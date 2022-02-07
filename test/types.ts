// Some unit tests to make sure that inferred types match up using Leibniz
// equality. If this compiles, the tests have passed. This can't catch stray
// 'any's, so watch out for those.

import "mocha";
import { DomainOf, ReprOf, Schema, Schemas as S, Json } from "../src/augustus";

import { refl, test, testEq, testNotSub } from "@nprindle/leibniz";

test<"tupleOf">(() => {
    const testTupleOf = S.tupleOf(
        S.aString,
        S.literal(3 as const),
        S.arrayOf(S.aNull),
        S.anEmptyArray,
        S.anEmptyObject,
    );
    testEq<
        DomainOf<typeof testTupleOf>,
        ReprOf<typeof testTupleOf>,
        "tupleOf same domain and repr"
    >(refl);
    testEq<
        DomainOf<typeof testTupleOf>,
        [string, 3, null[], [], {}],
        "tupleOf correct domain"
    >(refl);
    // This is implied by sub1 of the two proofs above, but left for completeness
    testEq<
        ReprOf<typeof testTupleOf>,
        [string, 3, null[], [], {}],
        "tupleOf correct repr"
    >(refl);
});

test<"recordOf">(() => {
    const testRecordOf = S.recordOf({
        foo: S.aString,
        bar: S.literal(3 as const),
        baz: S.arrayOf(S.aNull),
    });
    testEq<
        DomainOf<typeof testRecordOf>,
        ReprOf<typeof testRecordOf>,
        "recordOf same domain and repr"
    >(refl);
    testEq<
        DomainOf<typeof testRecordOf>,
        { foo: string; bar: 3; baz: null[]; },
        "recordOf correct domain"
    >(refl);
    // This is implied by sub1 of the two proofs above, but left for completeness
    testEq<
        ReprOf<typeof testRecordOf>,
        { foo: string; bar: 3; baz: null[]; },
        "recordOf correct repr"
    >(refl);
});

test<"map">(() => {
    const testMap = S.map(S.aString, S.aNumber);
    testEq<
        DomainOf<typeof testMap>,
        Map<string, number>,
        "map correct domain"
    >(refl);
    testEq<
        ReprOf<typeof testMap>,
        [string, number][],
        "map correct repr"
    >(refl);
});

test<"set">(() => {
    const testSet = S.set(S.arrayOf(S.aBoolean));
    testEq<
        DomainOf<typeof testSet>,
        Set<boolean[]>,
        "set correct domain"
    >(refl);
    testEq<
        ReprOf<typeof testSet>,
        boolean[][],
        "set correct repr"
    >(refl);
});

test<"union">(() => {
    const testUnion = S.union(S.anEmptyArray, S.aNull);
    testEq<
        DomainOf<typeof testUnion>,
        ReprOf<typeof testUnion>,
        "union same domain repr"
    >(refl);
    testEq<
        ReprOf<typeof testUnion>,
        [] | null,
        "union correct domain"
    >(refl);
});

test<"asserting">(() => {
    const testAsserting = S.asserting(S.aString, (x): x is "foo" => x === "foo");
    testEq<
        DomainOf<typeof testAsserting>,
        string,
        "asserting correct domain"
    >(refl);
    testEq<
        ReprOf<typeof testAsserting>,
        "foo",
        "asserting correct repr"
    >(refl);
});

test<"indexing">(() => {
    const testIndexing = S.indexing([null]);
    testEq<
        DomainOf<typeof testIndexing>,
        null,
        "indexing correct domain"
    >(refl);
    testEq<
        ReprOf<typeof testIndexing>,
        number,
        "indexing correct repr"
    >(refl);
});

test<"mapping">(() => {
    const testMapping = S.mapping({
        foo: 10,
        bar: 1,
    });
    testEq<
        DomainOf<typeof testMapping>,
        number,
        "mapping correct domain"
    >(refl);
    testEq<
        ReprOf<typeof testMapping>,
        "foo" | "bar",
        "mapping correct repr"
    >(refl);
});

test<"discriminating">(() => {
    // We currently need to help out the type inference here; changing this type
    // should cause a compile error, though.
    type TestDiscriminatingType = { disc: "foo"; a: number; } | { disc: "bar"; b: string; };
    const testDiscriminating: Schema<TestDiscriminatingType, TestDiscriminatingType> =
        S.discriminating("disc", {
            foo: S.recordOf({ disc: S.literal("foo" as const), a: S.aNumber, }),
            bar: S.recordOf({ disc: S.literal("bar" as const), b: S.aString, }),
        });
    testEq<
        DomainOf<typeof testDiscriminating>,
        ReprOf<typeof testDiscriminating>,
        "discriminating same domain repr"
    >(refl);
    testEq<
        DomainOf<typeof testDiscriminating>,
        TestDiscriminatingType,
        "discriminating correct domain"
    >(refl);
});

test<"encodeWith and decodeWith">(() => {
    // Test that all of the values are accepted by encodeWith
    test<"encodeWith accepts correct types">(() => [
        Json.encodeWith("foo", S.aString),
        Json.encodeWith(3, S.aNumber),
        Json.encodeWith(true, S.aBoolean),
        Json.encodeWith(null, S.aNull),
        Json.encodeWith({}, S.anEmptyObject),
        Json.encodeWith([], S.anEmptyArray),
        Json.encodeWith({ foo: undefined }, S.recordOf({ foo: S.anUndefined })),
    ]);

    const testJsonEncodeBadUndefined = Json.encodeWith.bind(null, undefined as any);
    testNotSub<
        ReprOf<typeof S.anUndefined>,
        ReprOf<Parameters<typeof testJsonEncodeBadUndefined>[0]>,
        "encodeWith does not accept undefined"
    >(refl);

    const undefinedArraySchema = S.arrayOf(S.anUndefined);
    testNotSub<
        ReprOf<typeof undefinedArraySchema>,
        ReprOf<Parameters<typeof testJsonEncodeBadUndefined>[0]>,
        "encodeWith does not accept undefined[]"
    >(refl);

    // Test that all of the values are accepted by encodeWith
    test<"decodeWith accepts correct types">(() => [
        Json.decodeWith("", S.aString),
        Json.decodeWith("", S.aNumber),
        Json.decodeWith("", S.aBoolean),
        Json.decodeWith("", S.aNull),
        Json.decodeWith("", S.anEmptyObject),
        Json.decodeWith("", S.anEmptyArray),
        Json.decodeWith("", S.recordOf({ foo: S.anUndefined })),
    ]);

    // Test that a Schema<_, undefined> is not accepted by decodeWith
    const testJsonDecodeBadUndefined = Json.decodeWith.bind(null, "");
    testNotSub<
        ReprOf<typeof S.anUndefined>,
        ReprOf<Parameters<typeof testJsonDecodeBadUndefined>[0]>,
        "decodeWith does not accept undefined"
    >(refl);

    testNotSub<
        ReprOf<typeof S.anUndefined>,
        ReprOf<Parameters<typeof testJsonDecodeBadUndefined>[0]>,
        "decodeWith does not accept undefined[]"
    >(refl);
});

describe("types", () => {
    it("should compile", () => {});
});
