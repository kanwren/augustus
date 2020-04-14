import "mocha";
import * as fc from "fast-check";

import { CustomArbitraries as CA } from "./arbitraries";

import { Schemas as S } from "../src/augustus";

describe("aNumber", () => {
    const schema = S.aNumber;
    it("should roundtrip", () => {
        fc.assert(fc.property(CA.anyDouble, x => {
            return Object.is(schema.decode(schema.encode(x)), x);
        }));
    });
    it("should validate numbers", () => {
        fc.assert(fc.property(CA.anyDouble, x => {
            return schema.validate(x);
        }));
    });
});

describe("aString", () => {
    const schema = S.aString;
    it("should roundtrip", () => {
        fc.assert(fc.property(fc.string(), x => {
            return schema.decode(schema.encode(x)) === x;
        }));
    });
    it("should validate strings", () => {
        fc.assert(fc.property(fc.string(), x => {
            return schema.validate(x);
        }));
    });
});

describe("aBoolean", () => {
    const schema = S.aBoolean;
    it("should roundtrip", () => {
        fc.assert(fc.property(fc.boolean(), x => {
            return schema.decode(schema.encode(x)) === x;
        }));
    });
    it("should validate booleans", () => {
        fc.assert(fc.property(fc.boolean(), x => {
            return schema.validate(x);
        }));
    });
});

describe("aNull", () => {
    const schema = S.aNull;
    it("should roundtrip", () => {
        fc.assert(fc.property(fc.constant(null), x => {
            return schema.decode(schema.encode(x)) === x;
        }));
    });
    it("should validate nulls", () => {
        fc.assert(fc.property(fc.constant(null), x => {
            return schema.validate(x);
        }));
    });
});

describe("anUndefined", () => {
    const schema = S.anUndefined;
    it("should roundtrip", () => {
        fc.assert(fc.property(fc.constant(undefined), x => {
            return schema.decode(schema.encode(x)) === x;
        }));
    });
    it("should validate undefineds", () => {
        fc.assert(fc.property(fc.constant(undefined), x => {
            return schema.validate(x);
        }));
    });
});

describe("anAny", () => {
    const schema = S.anAny;
    it("should roundtrip", () => {
        fc.assert(fc.property(fc.anything(), x => {
            return Object.is(schema.decode(schema.encode(x)), x);
        }));
    });
    it("should validate anything", () => {
        fc.assert(fc.property(fc.anything(), x => {
            return schema.validate(x);
        }));
    });
});

