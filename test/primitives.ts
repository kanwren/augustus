import "mocha";
import * as fc from "fast-check";

import { Schemas as S } from "../src/augustus"

describe("aNumber", () => {
    it("should roundtrip", () => {
        const schema = S.aNumber;
        fc.assert(fc.property(fc.double(), n => {
            return schema.decode(schema.encode(n)) === n;
        }));
    });
});

describe("aString", () => {
    it("should roundtrip", () => {
        const schema = S.aString;
        fc.assert(fc.property(fc.string(), x => {
            return schema.decode(schema.encode(x)) === x;
        }));
    });
});

describe("aBoolean", () => {
    it("should roundtrip", () => {
        const schema = S.aBoolean;
        fc.assert(fc.property(fc.boolean(), x => {
            return schema.decode(schema.encode(x)) === x;
        }));
    });
});

describe("aNull", () => {
    it("should roundtrip", () => {
        const schema = S.aNull;
        fc.assert(fc.property(fc.constant(null), x => {
            return schema.decode(schema.encode(x)) === x;
        }));
    });
});

describe("anUndefined", () => {
    it("should roundtrip", () => {
        const schema = S.anUndefined;
        fc.assert(fc.property(fc.constant(undefined), x => {
            return schema.decode(schema.encode(x)) === x;
        }));
    });
});


