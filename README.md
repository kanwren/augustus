# augustus

A work-in-progress experimental library to construct combinators for
serializing, deserializing, and validating data in TypeScript, as well as
provide utilities for safe encoding and decoding of data.

## Motivation

This library is designed to help on two fronts:

#### Validation

In TypeScript, it's often very difficult to validate the structure of data after
it has been decoded. For example, `JSON.parse` returns an `any`, and to use this
data, you have one of two choices:

- Use the `any` directly, or do an unsafe cast into your expected type. This
  will fail at runtime if the data does not match the expected structure. If the
  parsed types differ from the expected ones, it can easily fail silently as
  well. For example, if you expect the data to be a `number`, but it parses as a
  `string` instead, JavaScript will attempt to automatically coerce it for you,
  which can lead to unexpected behavior.
- Write a type predicate to assert that your data is of the expected type: `(x:
  unknown) => x is S`. However, this is often a manual process. For
  deeply-nested records, it is very tedious, and changes in structure are likely
  to break the predicate. Furthermore, since type predicates unsafely turn
  boolean return values into type assertions, their correctness cannot be
  checked by the compiler by design.

Instead, using a combinator-based approach allows for more flexible, modular,
and reusable data validation, making it easy to build up complex and nested
validation structures. It also becomes much easier to change the types or
structure of data in the representation type.

#### Serialization

Often, if you want to turn data from your domain model into a format such as
JSON, you first have to marshal it into a JSON-representable type, before
calling `JSON.stringify`. Similarly, after parsing using `JSON.parse`, you have
to marshal the result back into the domain type. This process is often manual
and tedious. By using a combinator-based approach, it is easy to recursively
derive how to serialize a structure.

A common approach to this problem is to annotate the fields that should be
serialized using TypeScript's decorators, and relying on compiler-generated
decorator metadata. While expressive, this approach is often not very extensible
or composable; it's not always easy to figure out how to serialize complex types
derived from other serializable types in nontrivial ways. With a
combinator-based approach, it's easy to model complex serialization demands by
building up simple functions.

## Usage

TODO

