import { Arbitrary } from "fast-check";
import * as fc from "fast-check";

export namespace CustomArbitraries {
    export const anyDouble: Arbitrary<number> = fc.oneof(
        fc.double(-Number.MAX_VALUE, Number.MAX_VALUE),
        fc.constant(Number.NEGATIVE_INFINITY),
        fc.constant(Number.POSITIVE_INFINITY),
        fc.constant(Number.NaN),
    );
}
