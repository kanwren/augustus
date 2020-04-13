import { Arbitrary } from "fast-check";
import * as fc from "fast-check";

export namespace CustomArbitraries {
    export const anyDouble: Arbitrary<number> = fc.oneof(
        fc.double(-Number.MAX_VALUE, Number.MAX_VALUE),
        fc.constant(Number.NEGATIVE_INFINITY),
        fc.constant(Number.POSITIVE_INFINITY),
        fc.constant(Number.NaN),
    );

    export function map<K, V>(keys: Arbitrary<K>, values: Arbitrary<V>): Arbitrary<Map<K, V>> {
        return fc.array(fc.tuple(keys, values)).map(arr => new Map(arr));
    }

    export function set<T>(values: Arbitrary<T>): Arbitrary<Set<T>> {
        return fc.array(values).map(arr => new Set(arr));
    }
}
