// The definition of the core Schema types, as well as some helper type
// functions to operate on them.

/**
 * A 'Schema<T, S>' encapsulates the behavior to:
 * - Encode values from domain type 'T' into representation type 'S'
 * - Decode values from representation type 'S' into domain type 'T'
 * - Validate that a given 'unknown' value is of type 'S'
 *
 * For example, if we have a class 'Person' with data fields 'name: string' and
 * 'age: number', we cannot encode/decode directly to/from JSON, since instances
 * of the class also contain methods that can't be serialized. We only want the
 * type of the JSON representation to contain the data, so we would define a
 * 'Schema<Person, { name: string; age: number; }' to handle this for us.
 */
export interface Schema<T, S> {
    encode: (val: T) => S;
    decode: (data: S) => T;
    validate: (data: unknown) => data is S;
}

/**
 * An extension of a 'Schema' used for dependency injection, allowing us to
 * asymmetrically decode the representation type. An 'InjectSchema<T, D, B, S>'
 * represents a base 'Schema<B, S>' between a base domain type and its
 * serializable representation, with a way to inject a context/dependency 'D' to
 * recover the true domain type 'T'.
 *
 * Assume we have a domain type that contains some context that should not be
 * serialized, but we need this context to make an instance of the domain type.
 * For example, this can happen if we inject a reference through the
 * constructor. Let's call this the "true" domain type.
 *
 * To get around the asymmetry of decoding with context injection, we create a
 * "base" domain type by forgetting the context/dependency from the true domain
 * type. We first create a regular schema to convert between the base domain
 * type and the serializable representation. We then extend this with the
 * ability to "project" from the true domain type into the base domain type ('T
 * => B'), by discarding the context. We also add a way to "inject" the context,
 * which yields a function that can instantiate the true domain type from the
 * base domain type ('B => T').
 */
export interface InjectSchema<T, D, B, S> extends Schema<B, S> {
    project(val: T): B;
    inject(context: D): (base: B) => T;
}

/**
 * Extract the domain type from the type of a schema.
 */
export type DomainOf<T> = T extends Schema<infer S, infer _> ? S : never;

/**
 * Extract the representation type from the type of a schema. This is useful in
 * making schemas that are derived from other nontrivial schemas. For example:
 *
 * <pre><code>
 * const person: Schema<Person, { name: string, age: number } =
 *     recordOf({ name: aString, age: aNumber });
 * const people: Schema<Person[], ReprOf<typeof personSchema>[]> =
 *     arrayOf(personSchema);
 * </code></pre>
 *
 * This can also be used to automatically reflect domain types from some
 * combinators:
 *
 * <pre><code>
 * const person = recordOf({ name: aString, age: aNumber });
 * type Person = ReprOf<typeof person>; // { name: string; age: number; }
 * </code></pre>
 */
export type ReprOf<T> = T extends Schema<infer _, infer S> ? S : never;

