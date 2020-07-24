import { IfEmpty, IfHasTail, IfFinite, Head, Tail } from "./Tuples";

/**
 * Merges a tuple of objects, flattening into a single object.
 */
export type Merge<T extends object[], Acc extends object = {}> = {
    0: Acc;
    1: Merge<Tail<T>, Head<T> & Acc>;
    2: Head<T> & Acc;
    3: never;
}[IfEmpty<T, 0, IfFinite<T, IfHasTail<T, 1, 2>, 3>>];

/**
 * Filter an object type, keeping only keys whose values are supertypes of the
 * given 'Condition'
 */
export type FilterSuper<T extends object, Condition = never> = Pick<T, {
    [K in keyof T]: Condition extends T[K] ? K : never;
}[keyof T]>;

/**
 * Filter an object type, keeping only keys whose values are subtypes of the
 * given 'Condition'
 */
export type FilterSub<T extends object, Condition = never> = Pick<T, {
    [K in keyof T]: T[K] extends Condition ? K : never;
}[keyof T]>;

/**
 * Filter an object type, keeping only keys whose values are not supertypes of
 * the given 'Condition'
 */
export type FilterOutSuper<T extends object, Condition = never> = Omit<T, {
    [K in keyof T]: Condition extends T[K] ? K : never;
}[keyof T]>;

/**
 * Filter an object type, keeping only keys whose values are not subtypes of the
 * given 'Condition'
 */
export type FilterOutSub<T extends object, Condition = never> = Omit<T, {
    [K in keyof T]: T[K] extends Condition ? K : never;
}[keyof T]>;

export type ConvertOptionals<T extends object> = FilterOutSuper<T, undefined> & {
    [K in keyof FilterSuper<T, undefined>]?: Exclude<T[K], undefined>;
};

