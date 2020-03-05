type IfHasTail<T extends any[], Y=unknown, N=never> =
    T extends ([] | [any]) ? N : Y;

type IfEmpty<T extends any[], Y=unknown, N=never> =
    T extends []
        ? Y
        : N;

type Head<T extends any[]> =
    T extends [any, ...any[]]
        ? T[0]
        : never;

type Tail<T extends any[]> =
    ((...args: T) => any) extends ((head: any, ...tail: infer Tail) => any)
        ? Tail
        : never;

type Last<T extends any[]> = {
    0: Last<Tail<T>>;
    1: Head<T>;
}[IfHasTail<T, 0, 1>];

type Cons<A, T extends any[]> =
    Parameters<(head: A, ...tail: T) => any>;

type Snoc<A, T extends any[], Suffix extends any[] = []> = {
    0: Cons<A, Suffix>;
    1: Snoc<A, Tail<T>, Cons<Head<T>, Suffix>>;
    2: Cons<Head<T>, Cons<A, Suffix>>;
}[IfEmpty<T, 0, IfHasTail<T, 1, 2>>];

type Uncons<T extends any[]> =
    ((...args: T) => any) extends ((head: infer Head, ...tail: infer Tail) => any)
        ? [Head, Tail]
        : never;

type IfFinite<T extends any[], Y=unknown, N=never> =
    T extends []
        ? Y
        : T extends (infer E)[]
            ? E[] extends T
                ? N
                : Y
            : never;

type Reverse<T extends any[], Suffix extends any[] = []> = {
    0: Suffix;
    1: Reverse<Tail<T>, Cons<Head<T>, Suffix>>;
    2: Cons<Head<T>, Suffix>;
    3: T;
}[IfEmpty<T, 0, IfFinite<T, IfHasTail<T, 1, 2>, 3>>];

/**
 * Concatenates two tuples together, like 'Array.prototype.concat', but at the
 * type level.
 */
export type Concat<T extends any[], S extends any[]> = {
    0: S;
    1: Reverse<Reverse<T>, S>;
    2: Cons<Head<T>, S>;
    3: never;
}[IfEmpty<T, 0, IfFinite<T, IfHasTail<T, 1, 2>, 3>>];

// Concatenates a list of tuples, in reverse order. Helper for 'Concat'.
type ReverseFlatten<T extends any[][], Suffix extends any[] = []> = {
    0: Suffix;
    1: ReverseFlatten<Tail<T>, Concat<Head<T>, Suffix>>;
    2: Concat<Head<T>, Suffix>;
    3: never;
}[IfEmpty<T, 0, IfFinite<T, IfHasTail<T, 1, 2>, 3>>];

/**
 * Concatenates a tuple of tuples, flattening into a single tuple.
 */
export type Flatten<T extends any[][]> = ReverseFlatten<Reverse<T>>;

