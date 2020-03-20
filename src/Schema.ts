// The definition of the core 'Schema' type, as well as a set of data-oriented
// combinators for building up complex schemas.

/**
 * A 'Schema<T, S>' encapsulates the behavior to:
 * - Encode values from domain type 'T' into representation type 'S'
 * - Decode values from representation type 'S' into domain type 'T'
 * - Validate that a given 'unknown' value is of type 'S'
 *
 * For example, if we have a class 'Person' with data fields 'name: string' and
 * 'age: number', we cannot encode/decode directly to/from JSON, since instances
 * of the class also contain methods that can't be serialized. We only want the
 * type of the JSON representation to contain the data, so we would define a
 * 'Schema<Person, { name: string; age: number; }' to handle this for us.
 */
export interface Schema<T, S> {
    encode(src: T): S;
    decode(data: S): T;
    validate(data: unknown): data is S;
}

/**
 * Extract the domain type from the type of a schema.
 */
export type DomainOf<T extends Schema<unknown, unknown>> = T extends Schema<infer S, unknown> ? S : never;

/**
 * Extract the representation type from the type of a schema. This is useful in
 * making schemas that are derived from other nontrivial schemas. For example:
 *
 * <pre><code>
 * const person: Schema<Person, { name: string, age: number } =
 *     recordOf({ name: aString, age: aNumber });
 * const people: Schema<Person[], ReprOf<typeof personSchema>[]> =
 *     arrayOf(personSchema);
 * </code></pre>
 *
 * This can also be used to automatically reflect domain types from some
 * combinators:
 *
 * <pre><code>
 * const person = recordOf({ name: aString, age: aNumber });
 * type Person = ReprOf<typeof person>; // { name: string; age: number; }
 * </code></pre>
 */
export type ReprOf<T extends Schema<unknown, unknown>> = T extends Schema<unknown, infer S> ? S : never;

// Ugly helper types for object- or tuple-based schemas
// Replace the schemas in an object/array with the domains of the schemas
type RecordDomains<R extends Record<string, Schema<unknown, unknown>> | Schema<unknown, unknown>[]> = {
    [K in keyof R]: R[K] extends Schema<infer A, unknown> ? A : never;
};
// Replace the schemas in an object/array with the representations of the schemas
type RecordReprs<R extends Record<string, Schema<unknown, unknown>> | Schema<unknown, unknown>[]> = {
    [K in keyof R]: R[K] extends Schema<unknown, infer B> ? B : never;
};

// Function to use when the compiler needs a path to be present, even when it's
// technically unreachable
function impossible(): never {
    throw Error("This code should be unreachable");
}

// The identity function, for trivial schemas
const id = <T>(x: T): T => x;

type NonEmptyArray<T> = [T, ...T[]];

export namespace Schemas {
    /**
     * Basic schema constructor function. It is also possible to just make the
     * object containing the functions directly, but this may be considered more
     * declarative.
     */
    export function schema<T, S>(args: {
        encode: (src: T) => S;
        decode: (data: S) => T;
        validate: (data: unknown) => data is S;
    }): Schema<T, S> {
        return args;
    }

    /**
     * Function to construct trivial schemas for representable primitive types.
     */
    export function primitive<T>(validate: (data: unknown) => data is T): Schema<T, T> {
        return { encode: id, decode: id, validate };
    }

    /**
     * Function to convert a literal value into a schema that validates that
     * value.
     */
    export function literal<T>(value: T): Schema<T, T> {
        return { encode: id, decode: id, validate: (x: unknown): x is T => x === value };
    }

    /**
     * The most basic schema, which accepts anything and validates everything
     */
    export const anAny: Schema<any, any> = primitive((_data: unknown): _data is any => true);

    /**
     * Trivial 'Schema' for 'string'.
     */
    export const aString: Schema<string, string> = primitive((data: unknown): data is string => {
        return typeof data === "string" || data instanceof String;
    });

    /**
     * Trivial 'Schema' for 'number'.
     */
    export const aNumber: Schema<number, number> = primitive((data: unknown): data is number => {
        return typeof data === "number";
    });

    /**
     * Trivial 'Schema' for 'boolean'.
     */
    export const aBoolean: Schema<boolean, boolean> = primitive((data: unknown): data is boolean => {
        return typeof data === "boolean";
    });

    /**
     * Trivial 'Schema' for 'null'.
     */
    export const aNull: Schema<null, null> = primitive((data: unknown): data is null => {
        return data === null;
    });

    /**
     * Trivial 'Schema' for 'undefined'.
     */
    export const anUndefined: Schema<undefined, undefined> = primitive((data: unknown): data is undefined => {
        return typeof data === "undefined";
    });

    /**
     * Construct a schema for a given record type, given the structure of the
     * record. For example:
     *
     * <pre><code>
     * type Person = { name: string; age: number; };
     *
     * const personSchema: Schema<Person, { name: string; age: number; }> =
     *     recordOf({
     *         name: aString,
     *         age: aNumber,
     *     });
     * </code></pre>
     */
    export function recordOf<
        // The structure of the record
        R extends Record<string, Schema<unknown, unknown>>,
    >(structure: R): Schema<RecordDomains<R>, RecordReprs<R>> {
        return {
            encode: (x: RecordDomains<R>) => {
                const obj: Partial<RecordReprs<R>> = {};
                for (const key in structure) {
                    obj[key] = structure[key].encode(x[key]) as ReprOf<R[keyof R]>;
                }
                return obj as RecordReprs<R>;
            },
            decode: (obj: RecordReprs<R>) => {
                const res: Partial<RecordDomains<R>> = {};
                for (const key in structure) {
                    res[key] = structure[key].decode(obj[key]) as DomainOf<R[keyof R]>;
                }
                return res as RecordDomains<R>;
            },
            validate: (data: unknown): data is RecordReprs<R> => {
                if (typeof data !== "object" || data === null) {
                    return false;
                }
                // Assume that data can be properly indexed, though we don't
                // know if the keys exist, or what type the values are. The
                // validator will handle 'undefined' keys. The 'Partial' here is
                // technically redundant, as the 'unknown' already handles the
                // 'undefined' case.
                const obj = data as Partial<Record<keyof R, unknown>>;
                for (const key in structure) {
                    const validator = structure[key];
                    if (!validator.validate(obj[key])) {
                        return false;
                    }
                }
                return true;
            },
        };
    }

    /**
     * Trivial serializer for empty object, the identity under object unions.
     */
    export const anEmptyObject: Schema<{}, {}> = recordOf({});

    /**
     * Serializes classes into records, like 'recordOf', but with custom
     * reconstruction for class instances, such as using a constructor. When
     * decoding a representation, the values of the representation will first be
     * recursively decoded, and then 'reconstruct' will be applied to the result to
     * make the new instance. For example:
     *
     * <pre><code>
     * class Person {
     *     constructor(
     *         private name: string,
     *         private age: number,
     *     ) {}
     * }
     *
     * const personSchema: Schema<Person, { name: string; age: number; }> =
     *     classOf({
     *         name: aString,
     *         age: aNumber,
     *     }, ({ name, age }) => new Person(name, age));
     * </code></pre>
     */
    export function classOf<
        // The structure of the serialized record
        R extends Record<string, Schema<unknown, unknown>>,
        T extends RecordDomains<R>
    >(structure: R, reconstruct: (data: RecordDomains<R>) => T): Schema<T, RecordReprs<R>> {
        const { encode, decode, validate } = recordOf<R>(structure);
        return {
            encode,
            decode: x => reconstruct(decode(x)),
            validate,
        };
    }

    /**
     * Construct a schema for arrays, given a schema for their elements.
     */
    export function arrayOf<T, S>(elementsSchema: Schema<T, S>): Schema<T[], S[]> {
        return {
            encode: (arr: T[]) => arr.map(x => elementsSchema.encode(x)),
            decode: (arr: S[]) => arr.map(x => elementsSchema.decode(x)),
            validate: (data: unknown): data is S[] => {
                if (!Array.isArray(data)) {
                    return false;
                }
                return data.every(x => elementsSchema.validate(x));
            },
        };
    }

    export function nonEmptyArrayOf<T, S>(elementsSchema: Schema<T, S>): Schema<NonEmptyArray<T>, NonEmptyArray<S>> {
        const { encode, decode, validate } = arrayOf(elementsSchema);
        return {
            encode: encode as (value: NonEmptyArray<T>) => NonEmptyArray<S>,
            decode: decode as (data: NonEmptyArray<S>) => NonEmptyArray<T>,
            validate: (data: unknown): data is NonEmptyArray<S> => {
                return Array.isArray(data) && data.length >= 1 && validate(data);
            },
        };
    }

    export function tupleOf<
        // The structure of the serialized tuple
        R extends Schema<unknown, unknown>[],
    >(...elementSchemas: R): Schema<RecordDomains<R>, RecordReprs<R>> {
        return {
            encode: (tup: RecordDomains<R>) => {
                return tup.map((x, i) => elementSchemas[i].encode(x)) as RecordReprs<R>;
            },
            decode: (tup: RecordReprs<R>) => {
                return tup.map((x, i) => elementSchemas[i].decode(x)) as RecordDomains<R>;
            },
            validate: (data: unknown): data is RecordReprs<R> => {
                if (!Array.isArray(data) || data.length !== elementSchemas.length) {
                    return false;
                }
                return elementSchemas.every((schema, i) => schema.validate(data[i]));
            }
        };
    }

    /**
     * Trivial serializer for empty array/tuple, the identity under tuple/array
     * concatenation.
     */
    export const anEmptyArray: Schema<[], []> = tupleOf();

    /**
     * Construct a schema for a type union, given schemas of either type.
     * Additionally requires type predicates in order to be able to determine
     * which schema to use when encoding. If the two types are trivially
     * serializable (they have a 'Schema<T, T>'), consider using 'union'
     * instead. Note that this is left-biased; if both types are the same, for
     * example, the schema on the left will be tried first.
     */
    export function unionOf<TL, SL, TR, SR>(
        isLeft: (x: TL | TR) => x is TL,
        isRight: (x: TL | TR) => x is TR,
        left: Schema<TL, SL>,
        right: Schema<TR, SR>,
    ): Schema<TL | TR, SL | SR> {
        return {
            encode: (x: TL | TR) => {
                if (isLeft(x)) {
                    return left.encode(x);
                } else if (isRight(x)) {
                    return right.encode(x);
                } else {
                    return impossible();
                }
            },
            decode: (json: SL | SR) => {
                if (left.validate(json)) {
                    return left.decode(json);
                } else if (right.validate(json)) {
                    return right.decode(json);
                } else {
                    return impossible();
                }
            },
            validate: (data: unknown): data is SL | SR => {
                return left.validate(data) || right.validate(data);
            },
        };
    }

    /**
     * Like 'unionOf', but for schemas in which at least one of the types in
     * the union trivially encodes to the same type, since they already have
     * built-in validation. If only one of the types is trivial, it must go on
     * the left. For example:
     *
     * <pre><code>
     * const numberOrStringSchema: Schema<number | string, number | string> =
     *     union(aNumber, aString);
     * </code></pre>
     *
     * Like 'unionOf', this is left-biased; the left schema will apply in the
     * case where both schemas would validate a value.
     */
    export function union<TL, TR, SR>(left: Schema<TL, TL>, right: Schema<TR, SR>): Schema<TL | TR, TL | SR> {
        return unionOf(
            (x: TL | TR): x is TL => left.validate(x),
            (x: TL | TR): x is TR => !left.validate(x),
            left,
            right,
        );
    }

    /**
     * Allows the schema to be undefined. In 'recordOf', this can be used to
     * make a field optional:
     *
     * <pre><code>
     * const schema = recordOf({ x: optional(aNumber) });
     * schema.validate({ x: 1 });         // true
     * schema.validate({ x: "hello" });   // false
     * schema.validate({ x: undefined }); // true
     * schema.validate({});               // true
     * </code></pre>
     */
    export function optional<T, S>(schema: Schema<T, S>): Schema<undefined | T, undefined | S> {
        return union(anUndefined, schema);
    }

    /**
     * Extends a schema's validation to apply additional restrictions to the
     * representation type after initial validation. For example:
     *
     * <pre><code>
     * const positive: Schema<number, number> = constrain(aNumber, x => x > 0);
     * </code></pre>
     */
    export function constrain<T, S>(schema: Schema<T, S>, predicate: (x: S) => boolean): Schema<T, S> {
        return {
            encode: x => schema.encode(x),
            decode: x => schema.decode(x),
            validate: (x): x is S => schema.validate(x) && predicate(x),
        };
    }

    /**
     * Restrict a string schema to only strings matching a regular expression.
     * The match is conducted via 'RegExp.prototype.test'. To ensure that the
     * entire string matches the regex, use <code>/^regex$/</code>.
     */
    export function matching(regex: RegExp): Schema<string, string> {
        return constrain(aString, s => regex.test(s));
    }

    /**
     * Transform a schema in the contravariant position to serialization; given
     * a way to encode and decode from a new domain type to the old domain type,
     * produce a new schema that has the new domain type.
     */
    export function contra<U, T, S>(schema: Schema<T, S>, encode: (src: U) => T, decode: (data: T) => U): Schema<U, S> {
        return {
            encode: (x: U): S => schema.encode(encode(x)),
            decode: (x: S): U => decode(schema.decode(x)),
            validate: (data: unknown): data is S => schema.validate(data),
        };
    }

    /**
     * Transform a schema in the covariant position to serialization; given a
     * way to encode and decode from a new representation type to the old
     * representation type, and a new validator, produce a new schema that has
     * the new representation type.
     */
    export function co<T, S, U>(
        schema: Schema<T, S>,
        encode: (src: S) => U,
        decode: (data: U) => S,
        validate: (data: unknown) => data is U,
    ): Schema<T, U> {
        return {
            encode: (x: T): U => encode(schema.encode(x)),
            decode: (x: U): T => schema.decode(decode(x)),
            validate
        };
    }
}
