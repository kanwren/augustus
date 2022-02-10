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
    T extends [infer _Head, ...(infer Tail)]
        ? Tail
        : never;

export type Cons<A, T extends unknown[]> = [A, ...T];
export type Snoc<T extends unknown[], A> = [...T, A];

export type IfFinite<T extends unknown[], Y=unknown, N=never> =
    T extends []
        ? Y
        : T extends (infer E)[]
            ? E[] extends T
                ? N
                : Y
            : never;

