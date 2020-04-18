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
        * [`contra` and `co`](#contra-and-co)
        * [`constrain` and `asserting`](#constrain-and-asserting)
        * [`indexing` and `mapping`](#indexing-and-mapping)
        * [`discriminating`](#discriminating)
        * [`injecting`](#injecting)
        * [`lazy` and lazy aggregates](#lazy-and-lazy-aggregates)
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

`augustus` uses combinators to build up `Schema`s. A `Schema` consists of three
things:

```typescript
interface Schema<Domain, Repr> {
    encode(val: Domain): Repr;
    decode(data: Repr): Domain;
    validate(data: unknown): data is Repr;
}
```

For example:

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

Many schemas for Javascript's primitive types are exposed:

* `string`: `aString`
* `number`: `aNumber`
* `boolean`: `aBoolean`
* `null`: `aNull`
* `undefined`: `anUndefined`
    * WARNING: if targeting JSON, `undefined` isn't representable. Be aware that
      serializing a top-level `undefined` will fail, and serializing an array
      with an element `undefined` will convert it into `null`. It's safe to use
      as a value of an object, however.

Besides primitive schemas, there are many other useful basic and aggregate
schemas, as well:

```typescript
import { Schemas as S, DomainOf } from "@nprindle/augustus";

type ARecord = {
    a: string;
    b: number;
    c: (boolean | null)[];
    d: [Map<string, string>, Set<number>];
    e: "foo";
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
    // Literal types ('as const' is required for the literal type inference)
    e: S.literal("foo" as const),
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
const schema = S.classOf({ n: S.aNumber }, ({ n }) => new C(n));
```

It's often nice to define class schemas as static variables on the classes they
encode.

There are many more combinators for constructing schemas. Many of the important
ones are described in subsections below.

#### `contra` and `co`

These are used take a base schema and transform its domain type or the
representation type, respectively.

`contra` takes a base schema, as well as ways to transform between the new and
old domain types, and composes them with your base schema to get a new schema
that can convert between your new domain type and your representation type:

```
           encode            encode
          ------->          ------->
new domain        old domain        repr
          <-------          <-------
           decode            decode
|                 |                    |
|                 |----base schema-----|
|------new schema after 'contra'-------|
```

`co` is similar, but chains to the right of the `repr` to make a new
representation type. However, this also requires you to provide a new validating
function, so this is much less useful than `contra`.

#### `constrain` and `asserting`

`constrain` doesn't change the type of a schema, but it narrows the schema's
validation to only accept values that also match an additional predicate:

```typescript
import { Schemas as S } from "@nprindle/augustus";

const positive = S.constrain(S.aNumber, x => x > 0);

positive.validate(15); // true
positive.validate(-1); // false
```

The `matching` combinator is just `constrain`, but the predicate is to match a
regex:

```typescript
import { Schemas as S } from "@nprindle/augustus";

const alnumStr = S.matching(/[a-zA-Z0-9]*/);

alnumStr.validate("abc123"); // true
alnumStr.validate("!@#$%^"); // false
```

`asserting` is similar to `constrain`, but instead of taking a regular
predicate, it takes a type predicate. This lets you narrow the representation
type of a schema:

```typescript
import { Schemas as S } from "@nprindle/augustus";

const obj = { foo: 1, bar: 2 };

const objKeySchema = S.asserting(
    S.aString,
    (x: string): x is keyof typeof obj => x in obj,
);
```

#### `indexing` and `mapping`

`indexing` encodes elements of an array using their index. This is a somewhat
dangerous combinator; changes to the order of elements will break your
validation. Also, attempting to encode something that's not a value in the array
will simply fail at runtime.

```typescript
import { Schemas as S } from "@nprindle/augustus";

const arr = [ "foo", "bar", "baz" ];

const schema = S.indexing(arr);

schema.encode("foo"); // 0
schema.decode(2);     // "baz"
```

`mapping` encodes elements of an object using their key. This is useful for
serializing multiton patterns, which often depend on instance equality. However,
this is also somewhat dangerous; the same caveats apply as in `indexing`

```typescript
import { Schemas as S } from "@nprindle/augustus";

const obj = { foo: 1, bar: 2, baz: 3 };

const schema = S.mapping(arr);

schema.encode(1);     // "foo"
schema.decode("bar"); // 2
```

#### `discriminating`

`discriminating` handles discriminated unions based on the different values of a
discriminating key. For example:

```typescript
import { Schemas as S, Schema } from "@nprindle/augustus";

type DiscUnion =
    | { disc: "foo"; a: number; }
    | { disc: "bar"; b: string; }
    ;

// We need to help the type inference out here by declaring an explicit type
const discUnionSchema: Schema<DiscUnion, DiscUnion> =
    S.discriminating("disc", {
        foo: S.recordOf({ disc: S.literal("foo" as const), a: S.aNumber }),
        bar: S.recordOf({ disc: S.literal("bar" as const), b: S.aString }),
    })
```

#### `injecting`

`injecting` is a little more complicated than other combinators. `injecting`
handles situations where reconstructing the domain type requires additional
context, such as in dependency injection. To do this, we can take a base domain
type that doesn't have the context, and augment it with `injecting` to get a
special `InjectSchema` type. An `InjectSchema` is able to project from the true
domain type into the base domain type, and inject a base domain type with
context to reconstruct the true domain type. Here's an example:

```typescript
import { Schemas as S } from "@nprindle/augustus";

class Sub {
    // The 'context' is dependency injected, and should not be serialized.
    constructor(readonly context: Super, readonly n: number) {}
}

// Our 'true' domain type is 'Sub', but if we're decoding from a { n: number },
// then we still need a 'Super' to reconstruct a 'Sub' instance
const incorrectSubSchema = S.classOf(
  { n: S.aNumber },
  ({ n }) => new Sub(???, n) // we need a 'Super' here!
);

// Our 'base' domain type is { n: number }, the fields we want to serialize
// without the 'Super' context.
const baseSchema = S.recordOf({ n: S.aNumber });

// We use 'injecting' to get a special 'InjectSchema':
const subSchema: InjectSchema<
    Sub,            // the true domain type
    Super,          // the type of the required context
    { n: number; }, // the base domain type
    { n: number; }  // the representation type
> = S.injecting(
    baseSchema,
    // 'project' from the true domain type to the base domain type
    (sub: Sub): { n: number; } => ({ n: sub.n }),
    // 'inject' the base domain type with context to get the true domain type
    (context: Super) => (base: { n: number; }) => new Sub(context, base.n),
);
```

Without all the explanatory comments:

```typescript
import { Schemas as S } from "@nprindle/augustus";

class Sub {
    constructor(readonly context: Super, readonly n: number) {}

    static schema = S.injecting(
        S.aRecordOf({ n: S.aNumber }),
        sub => ({ n: sub.n }),
        context => base => new Sub(context, base.n)
    );
}
```

Later, if we're serializing something that contains a `Sub`, we can extend our
normal base schema using `contra` to manage the injection and projection for us:

```typescript
class Foo {
    // Assume that we want to serialize both of these fields, and that we've
    // already written Super.schema and Sub.schema
    private constructor(readonly sup: Super, readonly sub: Sub) {}

    static newFoo(): Foo {
        const sup = new Super();
        // 'sup' is injected during creation
        const sub = new Sub(sup, 5);
        return new Foo(sup, sub)
    }

    static schema = S.contra(
        S.classOf({ sup: Super.schema, sub: Sub.schema }),
        (f: Foo) => {
            const sup = f.sup;
            // Project the context out of the sub
            const sub = Sub.schema.project(f.sub);
            return { sub, sup };
        },
        ({ subBase, sup }) => {
            // Recover a 'Sub' by injecting the 'sup' context
            const sub = Sub.schema.inject(sup)(subBase);
            return new Foo(sup, sub);
        }
    );
}
```

#### `lazy` and lazy aggregates

TODO

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

