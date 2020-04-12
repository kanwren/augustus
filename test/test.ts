import "mocha";
import { expect } from "chai";

function hello(): string {
    return "Hello, world!"
}

describe("Hello", () => {
    it("should return 'Hello, world!'", () => {
        const result = hello();
        expect(result).to.equal("Hello, world!");
    });
});

