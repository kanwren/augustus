import { Schema, DomainOf, ReprOf } from "./Schema";
import { NonEmptyArray, id } from "./Utils";
import * as Schemas from "./Schemas";

// Ugly helper types for object- or tuple-based schemas
// Replace the schemas in an object/array with the domains of the schemas
type RecordDomainsLazy<R extends Record<string, () => Schema<any, any>>> = {
    [K in keyof R]: ReturnType<R[K]> extends Schema<infer D, infer _> ? D : never;
};

// Replace the schemas in an object/array with the representations of the schemas
type RecordReprsLazy<R extends Record<string, () => Schema<any, any>>> = {
    [K in keyof R]: ReturnType<R[K]> extends Schema<infer _, infer R> ? R : never;
};

/**
 * Like 'Schemas.arrayOf', but allows for a lazy schema for recursive types.
 */
export function arrayOf<T, S>(elementsSchema: () => Schema<T, S>): Schema<T[], S[]> {
    return {
        encode: (arr: T[]) => {
            const schema = elementsSchema();
            return arr.map(x => schema.encode(x));
        },
        decode: (arr: S[]) => {
            const schema = elementsSchema();
            return arr.map(x => schema.decode(x));
        },
        validate: (data: unknown): data is S[] => {
            const schema = elementsSchema();
            if (!Array.isArray(data)) {
                return false;
            }
            return data.every(x => schema.validate(x));
        },
    };
}

/**
 * Like 'Schemas.nonEmptyArrayOf', but allows for a lazy schema for
 * recursive types.
 */
export function nonEmptyArrayOf<T, S>(
    elementsSchema: () => Schema<T, S>
): Schema<NonEmptyArray<T>, NonEmptyArray<S>> {
    const { encode, decode, validate } = arrayOf(elementsSchema);
    return {
        encode: encode as any as (value: NonEmptyArray<T>) => NonEmptyArray<S>,
        decode: decode as any as (data: NonEmptyArray<S>) => NonEmptyArray<T>,
        validate: (data: unknown): data is NonEmptyArray<S> => {
            return Array.isArray(data) && data.length >= 1 && validate(data);
        },
    };
}

/**
 * Like 'Schemas.recordOf', but lazy in its schema values for recursive
 * types. This doesn't lessen recomputation over just using 'Schemas.lazy'
 * with 'Schemas.recordOf', but it can be used for syntactic convenience in
 * highly recursive types.
 */
export function recordOf<
    R extends Record<string, () => Schema<any, any>>,
>(structure: R): Schema<RecordDomainsLazy<R>, RecordReprsLazy<R>> {
    type Ds = RecordDomainsLazy<R>;
    type Rs = RecordReprsLazy<R>;
    return {
        encode: (x: Ds) => {
            const obj: Partial<Rs> = {};
            for (const key in structure) {
                obj[key] = structure[key]().encode(x[key]) as ReprOf<ReturnType<R[keyof R]>>;
            }
            return obj as Rs;
        },
        decode: (obj: Rs) => {
            const res: Partial<Ds> = {};
            for (const key in structure) {
                res[key] = structure[key]().decode(obj[key]) as DomainOf<ReturnType<R[keyof R]>>;
            }
            return res as Ds;
        },
        validate: (data: unknown): data is Rs => {
            if (typeof data !== "object" || data === null) {
                return false;
            }
            const obj = data as Partial<Record<keyof R, unknown>>;
            for (const key in structure) {
                const validator = structure[key]();
                if (!validator.validate(obj[key])) {
                    return false;
                }
            }
            return true;
        },
    };
}

/**
 * Like 'Schemas.classOf', but lazy in its schema values for recursive
 * types. This doesn't lessen recomputation over just using 'Schemas.lazy'
 * with 'Schemas.classOf', but it can be used for syntactic convenience in
 * highly recursive types.
 */
export function classOf<
    R extends Record<string, () => Schema<any, any>>,
    T extends RecordDomainsLazy<R>
>(structure: R, reconstruct: (data: RecordDomainsLazy<R>) => T): Schema<T, RecordReprsLazy<R>> {
    return Schemas.contra(recordOf(structure), id, reconstruct);
}

