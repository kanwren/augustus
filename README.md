# augustus

![Travis CI badge](https://travis-ci.com/nprindle/augustus.svg?branch=master)

A work-in-progress library to construct combinators for serializing,
deserializing, and validating data in TypeScript, agnostic of your serialization
target. `augustus` uses a combinator-based approach, making it simple to compose
schemas that can marshal between domain and representation types, as well as
safely validate the structure of deserialized data. It also provides utilities
for safe JSON serialization/deserialization.

* [Motivation](#motivation)
    * [Validation](#validation)
    * [Encoding and Serialization](#encoding-and-serialization)
* [Usage](#usage)
    * [Schemas](#schemas)
    * [Serialization](#serialization)

## Motivation

This library is designed to help on two fronts:

#### Validation

In TypeScript, it's often very difficult to validate the structure of data after
it has been deserialized. For example, `JSON.parse` returns an `any`, and to use
this data, you have one of two choices:

- Use the `any` directly, or do an unsafe type assertion into your expected
  type. This will fail (sometimes silently) at runtime if the data does not
  match the expected structure.
- Write a type predicate to assert that your data is of the expected type: `(x:
  unknown) => x is S`. However, this is a tedious and unsafe process. Since type
  predicates unsafely turn boolean return values into type assertions, their
  correctness cannot be checked by the compiler by design; if the structure of
  your data changes, it will silently break your type predicate.

Instead, using a combinator-based approach allows for more flexible, modular,
and reusable data validation, making it simple to build up complex and nested
validation structures from simple building blocks. This makes it much easier and
safer to change the types or structure of represented data.

#### Encoding and Serialization

Unlike most serialization libraries, `augustus` is largely agnostic to your
serialization target, be it JSON, BSON, etc. It does this by first encoding your
domain types to a representation type. When serializing, it's common to first
marshal your domain model into JSON-representable types before using
`JSON.stringify` to serialize, and marshal the representation back to your
domain after using `JSON.parse` to deserialize. Building schemas using
combinators removes most of the manual labor of marshalling.

A common alternative approach is to annotate fields that should be serialized
using decorators. While syntactically clean, this approach isn't very composable
or extensible for nontrivial encodings, such as with dependency injection, and
usually only provides one serialization target. `augustus`'s combinators let you
model complex serialization demands without sacrificing simplicity or
flexibility.

This library uses the following terms:

- **serialize**/**deserialize**: to convert to and from some serialized
  representation; e.g., a JSON string.

- **encode**/**decode**: to convert a domain type to and from a serializable
  representation; e.g., encoding a class instance into a plain object before
  serializing it into JSON.
  - The encoded representation should be a type that's serializable into your
    target. For example, if targeting JSON, your representation should be
    strings, numbers, booleans, nulls, arrays, or objects.

Here's a diagram of this process:
```
       encode      serialize
      ------->    ----------->
domain        repr            serialization target
      <-------    <-----------
       decode      deserialize
```

For example, to serialize a class instance into JSON:
```
      encode        serialize
     ------->      ----------->
class        object            JSON string
     <-------      <-----------
      decode        deserialize
```

## Usage

### Schemas

`augustus` uses combinators to build up `Schema`s:

```typescript
import { Schema, Schemas } from "@nprindle/augustus";

// Trivial schema; numbers should be represented as numbers
const schema: Schema<number, number> = Schemas.aNumber;

schema.encode(4); // 4
schema.decode(4); // 4

// A Schema can validate that unknown data is the correct type
const x: unknown = 4;
schema.validate(x); // true

// The validation can be used as a type predicate:
if (schema.validate(x)) {
    // Now, 'x' is a number
    console.log(x * 2);
}
```

Besides trivial schemas, there are many aggregate schemas, as well:

```typescript
import { Schemas as S, DomainOf } from "@nprindle/augustus";

type ARecord = {
    a: string;
    b: number;
    c: (boolean | null)[];
    d: [Map<string, string>, Set<number>];
};

// Records
const aRecordSchema = S.recordOf({
    // Basic primitive types
    a: S.aString,
    b: S.aNumber,
    // Unions and arrays
    c: S.arrayOf(S.union(S.aNull, S.aBoolean)),
    // Tuples, maps, sets
    d: S.tupleOf(S.map(S.aString, S.aString), S.set(S.aNumber)),
});

// You can even recover the domain or representation type of a schema!
type AlsoARecord = DomainOf<typeof aRecordSchema>; // same as ARecord
```

We can also serialize instances of classes:

```typescript
import { Schemas as S, DomainOf } from "@nprindle/augustus";

class C {
    constructor(readonly n: number) {}
}

// Provide a record of fields to serialize and a way to reconstruct a class
// instance from the fields
const schema = S.classOf({
    n: S.aNumber,
}, ({ n }) => new C(n));
```

It's often nice to define class schemas as static variables on the classes they
encode.

There are many more combinators for constructing schemas too, such as:

* `contra`: given a base schema, transform the domain type
* `co`: given a base schema, transform the representation type
* `constrain`: don't change the type of a schema, but narrow the validation
  to use an additional predicate
    * Example: `constrain(aNumber, x => x >= 0)` to only validate positive
      numbers
    * `matching` constrains strings to match a regular expression
* `asserting`: like `constrain`, but use a type predicate to narrow the
  representation type
* `indexing`: encode elements of an array using their index
* `mapping`: encode elements of an object using their key
    * This is useful for serializing multiton patterns, which often depend on
      instance equality
* `injecting`: handles situations where reconstructing the domain type
  requires additional context, such as in dependency injection
    * Uses a base domain type without the context
    * Produces a special `InjectSchema`, with the ability to project into the
      base domain type, and inject a base domain type with context to
      reconstruct the true domain type
* `discriminating`: handles discriminated unions based on the different values
  of a discriminating key

### Serialization

If you have a schema, you can encode your domain types and serialize them to
a JSON string using `jsonEncodeWith`:

```typescript
import { Schemas as S, jsonEncodeWith } from "@nprindle/augustus";

const schema = S.arrayOf(S.aNumber);
jsonEncodeWith([1, 2, 3], schema); // "[1,2,3]"
```

Similarly, if you have a JSON string, and you want to attempt to deserialize and
decode it, you can use `jsonDecodeWith`. This returns a `DecodeResult`, which is
one of the following:

* A success, meaning that `JSON.parse` and `augustus`'s validation succeeded
* A syntax error, meaning that `JSON.parse` failed
    * Runtime exceptions thrown by `JSON.parse` are caught and returned on the
      value-level instead
* An invalid structure error, meaning that the value deserialized but didn't
  match the expected structure

```typescript
import { Schemas as S, jsonDecodeWith } from "@nprindle/augustus";

const schema = S.arrayOf(S.aNumber);

jsonDecodeWith("[1,2,3]", schema);
// { resultType: "success", result: [1, 2, 3] }

jsonDecodeWith("[1,2,3", schema);
// { resultType: "syntaxError", error: ... }

jsonDecodeWith("true", schema);
// { resultType: "invalidStructure" }
```

