import { TestRunner } from "../../source/TestRunner.js";
import { Calculator } from "../calculator.js";

const runner = TestRunner.getInstance();
const { it, fit, describe, expect, spy } = runner;

describe("Calculator.Add", () => {
    it("Add calls math", () => {
        // Arrange
        const sut = new Calculator();
        spy(sut, "math").and.callFake(() => 3);

        // Act
        const result = sut.add(1, 2);

        // Assert
        expect(sut.math).toHaveBeenCalledWith(1, 2, 'add');
        expect(result).toEqual(3);
    });
    it("Adds 2 numbers", () => {
        // Arrange
        const sut = new Calculator();

        // Act
        const result = sut.add(1, 2);

        // Assert
         expect(result).toEqual(3);
    });
});
