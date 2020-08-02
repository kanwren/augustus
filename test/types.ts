// Some unit tests to make sure that inferred types match up using Leibniz
// equality. If this compiles, the tests have passed. This can't catch stray
// 'any's, so watch out for those.

import { DomainOf, ReprOf, Schema, Schemas as S, jsonEncodeWith, jsonDecodeWith } from "../src/augustus";

type Leibniz<A, B> = ((a: A) => B) & ((b: B) => A);

function id<A>(x: A): A {
    return x;
}

const testTupleOf = S.tupleOf(
    S.aString,
    S.literal(3 as const),
    S.arrayOf(S.aNull),
    S.anEmptyArray,
    S.anEmptyObject,
);
const testTupleOfSameDomainRepr: Leibniz<
    DomainOf<typeof testTupleOf>,
    ReprOf<typeof testTupleOf>
> = id;
const testTupleOfCorrectDomain: Leibniz<
    DomainOf<typeof testTupleOf>,
    [string, 3, null[], [], {}]
> = id;

const testRecordOf = S.recordOf({
    foo: S.aString,
    bar: S.literal(3 as const),
    baz: S.arrayOf(S.aNull),
});
const testRecordOfSameDomainRepr: Leibniz<
    DomainOf<typeof testRecordOf>,
    ReprOf<typeof testRecordOf>
> = id;
const testRecordOfCorrectDomain: Leibniz<
    DomainOf<typeof testRecordOf>,
    { foo: string; bar: 3; baz: null[]; }
> = id;

const testMap = S.map(S.aString, S.aNumber);
const testMapCorrectDomain: Leibniz<
    DomainOf<typeof testMap>,
    Map<string, number>
> = id;
const testMapCorrectRepr: Leibniz<
    ReprOf<typeof testMap>,
    [string, number][]
> = id;

const testSet = S.set(S.arrayOf(S.aBoolean));
const testSetCorrectDomain: Leibniz<
    DomainOf<typeof testSet>,
    Set<boolean[]>
> = id;
const testSetCorrectRepr: Leibniz<
    ReprOf<typeof testSet>,
    boolean[][]
> = id;

const testUnion = S.union(S.anEmptyArray, S.aNull);
const testUnionSameDomainRepr: Leibniz<
    DomainOf<typeof testUnion>,
    ReprOf<typeof testUnion>
> = id;
const testUnionCorrectDomain: Leibniz<
    ReprOf<typeof testUnion>,
    [] | null
> = id;

const testAsserting = S.asserting(S.aString, (x): x is "foo" => x === "foo");
const testAssertingCorrectDomain: Leibniz<
    DomainOf<typeof testAsserting>,
    string
> = id;
const testAssertingCorrectRepr: Leibniz<
    ReprOf<typeof testAsserting>,
    "foo"
> = id;

const testIndexing = S.indexing([null]);
const testIndexingCorrectDomain: Leibniz<
    DomainOf<typeof testIndexing>,
    null
> = id;
const testIndexingCorrectRepr: Leibniz<
    ReprOf<typeof testIndexing>,
    number
> = id;

const testMapping = S.mapping({
    foo: 10,
    bar: 1,
});
const testMappingCorrectDomain: Leibniz<
    DomainOf<typeof testMapping>,
    number
> = id;
const testMappingCorrectRepr: Leibniz<
    ReprOf<typeof testMapping>,
    string
> = id;

// We currently need to help out the type inference here; changing this type
// should cause a compile error, though.
type TestDiscriminatingType = { disc: "foo"; a: number; } | { disc: "bar"; b: string; };
const testDiscriminating: Schema<TestDiscriminatingType, TestDiscriminatingType> =
    S.discriminating("disc", {
        foo: S.recordOf({ disc: S.literal("foo" as const), a: S.aNumber, }),
        bar: S.recordOf({ disc: S.literal("bar" as const), b: S.aString, }),
    });
const testDiscriminatingSameDomainRepr: Leibniz<
    DomainOf<typeof testDiscriminating>,
    ReprOf<typeof testDiscriminating>
> = id;
const testDiscriminatingCorrectDomain: Leibniz<
    DomainOf<typeof testDiscriminating>,
    TestDiscriminatingType
> = id;

// Test that all of the values are accepted by jsonEncodeWith
const testJsonEncode = {
    encodeString: jsonEncodeWith("foo", S.aString),
    encodeNumber: jsonEncodeWith(3, S.aNumber),
    encodeBoolean: jsonEncodeWith(true, S.aBoolean),
    encodeNull: jsonEncodeWith(null, S.aNull),
    encodeObject: jsonEncodeWith({}, S.anEmptyObject),
    encodeArray: jsonEncodeWith([], S.anEmptyArray),
};

describe("types", () => {
    it("should compile", () => {
        testTupleOfSameDomainRepr;
        testTupleOfCorrectDomain;

        testRecordOfSameDomainRepr;
        testRecordOfCorrectDomain;

        testMapCorrectDomain;
        testMapCorrectRepr;

        testSetCorrectDomain;
        testSetCorrectRepr;

        testUnionSameDomainRepr;
        testUnionCorrectDomain;

        testAssertingCorrectDomain;
        testAssertingCorrectRepr;

        testIndexingCorrectDomain;
        testIndexingCorrectRepr;

        testMappingCorrectDomain;
        testMappingCorrectRepr;

        testDiscriminatingSameDomainRepr;
        testDiscriminatingCorrectDomain;

        testJsonEncode;
    });
});
