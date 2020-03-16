import { IfEmpty, IfHasTail, IfFinite, Head, Tail } from "./Tuples.js";

/**
 * Merges a tuple of objects, flattening into a single object.
 */
export type Merge<T extends object[], Acc extends object = {}> = {
    0: Acc;
    1: Merge<Tail<T>, Head<T> & Acc>;
    2: Head<T> & Acc;
    3: never;
}[IfEmpty<T, 0, IfFinite<T, IfHasTail<T, 1, 2>, 3>>];

