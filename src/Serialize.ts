import { Schema } from "./Schema.js";

/**
 * Encode JSON using 'JSON.stringify', using a particular schema for
 * serialization into a JSON-representable value.
 */
export function jsonEncodeWith<T, S>(value: T, schema: Schema<T, S>): string {
    return JSON.stringify(schema.encode(value));
}

/**
 * The result of attempting to decode a JSON string. Either we successfully
 * parsed the JSON and the resulting structure, the input was not valid JSON, or
 * the JSON was parsed but did not meet our expected structure.
 */
export type DecodeResult<T> =
    { resultType: "success"; result: T; }
    | { resultType: "syntaxError"; error: SyntaxError; }
    | { resultType: "invalidStructure"; };

/**
 * Decode a JSON string using 'JSON.parse()', using a particular schema for
 * validation of and deserialization from the encoded structure.
 */
export function jsonDecodeWith<T, S>(json: string, schema: Schema<T, S>): DecodeResult<T> {
    try {
        const result = JSON.parse(json);
        if (schema.validate(result)) {
            return {
                resultType: "success",
                result: schema.decode(result),
            };
        } else {
            return {
                resultType: "invalidStructure",
            };
        }
    } catch (e) {
        if (e instanceof SyntaxError) {
            return {
                resultType: "syntaxError",
                error: e,
            };
        } else {
            throw e;
        }
    }
}
/**
 * Like 'jsonDecodeWith', but throws an exception if parsing/validation fails.
 */
export function unsafeJsonDecodeWith<T, S>(json: string, schema: Schema<T, S>): T {
    const result = JSON.parse(json);
    if (schema.validate(result)) {
        return schema.decode(result);
    } else {
        throw Error("Failed to parse JSON");
    }
}
