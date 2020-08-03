// Some unit tests to make sure that inferred types match up using Leibniz
// equality. If this compiles, the tests have passed. This can't catch stray
// 'any's, so watch out for those.

import { DomainOf, ReprOf, Schema, Schemas as S, jsonEncodeWith, jsonDecodeWith } from "../src/augustus";

type Eq<A, B> = ((a: A) => B) & ((b: B) => A);

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
const testTupleOfSameDomainRepr: Eq<
    DomainOf<typeof testTupleOf>,
    ReprOf<typeof testTupleOf>
> = id;
const testTupleOfCorrectDomain: Eq<
    DomainOf<typeof testTupleOf>,
    [string, 3, null[], [], {}]
> = id;

const testRecordOf = S.recordOf({
    foo: S.aString,
    bar: S.literal(3 as const),
    baz: S.arrayOf(S.aNull),
});
const testRecordOfSameDomainRepr: Eq<
    DomainOf<typeof testRecordOf>,
    ReprOf<typeof testRecordOf>
> = id;
const testRecordOfCorrectDomain: Eq<
    DomainOf<typeof testRecordOf>,
    { foo: string; bar: 3; baz: null[]; }
> = id;

const testMap = S.map(S.aString, S.aNumber);
const testMapCorrectDomain: Eq<
    DomainOf<typeof testMap>,
    Map<string, number>
> = id;
const testMapCorrectRepr: Eq<
    ReprOf<typeof testMap>,
    [string, number][]
> = id;

const testSet = S.set(S.arrayOf(S.aBoolean));
const testSetCorrectDomain: Eq<
    DomainOf<typeof testSet>,
    Set<boolean[]>
> = id;
const testSetCorrectRepr: Eq<
    ReprOf<typeof testSet>,
    boolean[][]
> = id;

const testUnion = S.union(S.anEmptyArray, S.aNull);
const testUnionSameDomainRepr: Eq<
    DomainOf<typeof testUnion>,
    ReprOf<typeof testUnion>
> = id;
const testUnionCorrectDomain: Eq<
    ReprOf<typeof testUnion>,
    [] | null
> = id;

const testAsserting = S.asserting(S.aString, (x): x is "foo" => x === "foo");
const testAssertingCorrectDomain: Eq<
    DomainOf<typeof testAsserting>,
    string
> = id;
const testAssertingCorrectRepr: Eq<
    ReprOf<typeof testAsserting>,
    "foo"
> = id;

const testIndexing = S.indexing([null]);
const testIndexingCorrectDomain: Eq<
    DomainOf<typeof testIndexing>,
    null
> = id;
const testIndexingCorrectRepr: Eq<
    ReprOf<typeof testIndexing>,
    number
> = id;

const testMapping = S.mapping({
    foo: 10,
    bar: 1,
});
const testMappingCorrectDomain: Eq<
    DomainOf<typeof testMapping>,
    number
> = id;
const testMappingCorrectRepr: Eq<
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
const testDiscriminatingSameDomainRepr: Eq<
    DomainOf<typeof testDiscriminating>,
    ReprOf<typeof testDiscriminating>
> = id;
const testDiscriminatingCorrectDomain: Eq<
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

// Test that a Schema<_, undefined> is not accepted by jsonEncodeWith
const testJsonEncodeBadUndefined = jsonEncodeWith.bind(null, undefined as any);
const testJsonEncodeBad: Eq<
    ReprOf<Parameters<typeof testJsonEncodeBadUndefined>[0]> & ReprOf<typeof S.anUndefined>,
    never
> = id;

// Test that all of the values are accepted by jsonEncodeWith
const testJsonDecode = {
    decodeString: jsonDecodeWith("", S.aString),
    decodeNumber: jsonDecodeWith("", S.aNumber),
    decodeBoolean: jsonDecodeWith("", S.aBoolean),
    decodeNull: jsonDecodeWith("", S.aNull),
    decodeObject: jsonDecodeWith("", S.anEmptyObject),
    decodeArray: jsonDecodeWith("", S.anEmptyArray),
};

// Test that a Schema<_, undefined> is not accepted by jsonDecodeWith
const testJsonDecodeBadUndefined = jsonDecodeWith.bind(null, "");
const testJsonDecodeBad: Eq<
    ReprOf<Parameters<typeof testJsonDecodeBadUndefined>[0]> & ReprOf<typeof S.anUndefined>,
    never
> = id;

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
        testJsonEncodeBad;

        testJsonDecode;
        testJsonDecodeBad;
    });
});
