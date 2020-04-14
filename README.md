# augustus

A work-in-progress library to construct combinators for serializing,
deserializing, and validating data in TypeScript, agnostic of your serialization
target. `augustus` uses a combinator-based approach, making it simple to compose
schemas that can marshal between domain and representation types, as well as
safely validate the structure of deserialized data. It also provides utilities
for safe JSON serialization/deserialization.

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

TODO

