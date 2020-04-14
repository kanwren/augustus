import "mocha";
import * as fc from "fast-check";

import { CustomArbitraries as CA } from "./arbitraries";

import { Schemas as S } from "../src/augustus";

describe("map", () => {
    const schema = S.map(S.aString, S.aNumber);
    const arb = CA.map(fc.string(), CA.anyDouble);
    it("should roundtrip", () => {
        fc.assert(fc.property(arb, x => {
            const result = schema.decode(schema.encode(x));
            if (x.size !== result.size) {
                return false;
            }
            for (const key of Array.from(x.keys())) {
                if (!result.has(key)) {
                    return false;
                }
                if (!Object.is(x.get(key), result.get(key))) {
                    return false;
                }
            }
            return true;
        }));
    });
    it("should validate map representations", () => {
        fc.assert(fc.property(fc.array(fc.tuple(fc.string(), CA.anyDouble)), x => {
            return schema.validate(x);
        }));
    });
});

describe("set", () => {
    const schema = S.set(S.aString);
    const arb = CA.set(fc.string());
    it("should roundtrip", () => {
        fc.assert(fc.property(arb, x => {
            const result = schema.decode(schema.encode(x));
            if (x.size !== result.size) {
                return false;
            }
            for (const val of Array.from(x)) {
                if (!result.has(val)) {
                    return false;
                }
            }
            return true;
        }));
    });
    it("should validate map representations", () => {
        fc.assert(fc.property(fc.array(fc.string()), x => {
            return schema.validate(x);
        }));
    });
});
