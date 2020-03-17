export type IfEmpty<T extends unknown[], Y=unknown, N=never> =
    T extends []
        ? Y
        : N;

export type IfHasTail<T extends unknown[], Y=unknown, N=never> =
    T extends ([] | [unknown]) ? N : Y;

export type Head<T extends unknown[]> =
    T extends [unknown, ...unknown[]]
        ? T[0]
        : never;

export type Tail<T extends unknown[]> =
    ((...args: T) => unknown) extends ((head: unknown, ...tail: infer Tail) => unknown)
        ? Tail
        : never;

export type Cons<A, T extends unknown[]> =
    Parameters<(head: A, ...tail: T) => unknown>;

export type IfFinite<T extends unknown[], Y=unknown, N=never> =
    T extends []
        ? Y
        : T extends (infer E)[]
            ? E[] extends T
                ? N
                : Y
            : never;

type Reverse<T extends unknown[], Suffix extends unknown[] = []> = {
    0: Suffix;
    1: Reverse<Tail<T>, Cons<Head<T>, Suffix>>;
    2: Cons<Head<T>, Suffix>;
    3: T;
}[IfEmpty<T, 0, IfFinite<T, IfHasTail<T, 1, 2>, 3>>];

/**
 * Concatenates two tuples together, like 'Array.prototype.concat', but at the
 * type level.
 */
export type Concat<T extends unknown[], S extends unknown[]> = {
    0: S;
    1: Reverse<Reverse<T>, S>;
    2: Cons<Head<T>, S>;
    3: never;
}[IfEmpty<T, 0, IfFinite<T, IfHasTail<T, 1, 2>, 3>>];

// Concatenates a list of tuples, in reverse order. Helper for 'Concat'.
type ReverseFlatten<T extends unknown[][], Suffix extends unknown[] = []> = {
    0: Suffix;
    1: ReverseFlatten<Tail<T>, Concat<Head<T>, Suffix>>;
    2: Concat<Head<T>, Suffix>;
    3: never;
}[IfEmpty<T, 0, IfFinite<T, IfHasTail<T, 1, 2>, 3>>];

/**
 * Concatenates a tuple of tuples, flattening into a single tuple.
 */
export type Flatten<T extends unknown[][]> = ReverseFlatten<Reverse<T>>;

