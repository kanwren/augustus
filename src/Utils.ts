export type NonEmptyArray<T> = [T, ...T[]];

export function foldMapNonEmpty<T, R>(xs: NonEmptyArray<T>, f: (t: T) => R, g: (current: R, acc: R) => R): R {
    return xs.map(x => f(x)).reduce((x, y) => g(x, y));
}

/**
 * Function to use when the compiler needs a path to be present, even when it's
 * technically unreachable.
 */
export function impossible(_: never): never {
    throw Error("This code should be unreachable");
}

/**
 * The identity function, used for trivial schemas
 */
export function id<T>(x: T): T {
    return x;
}

