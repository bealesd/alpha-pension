import { TestRunner } from "../js/TestRunner.js";
import { Calc } from "../js/calc.js";

const runner = TestRunner.getInstance();
const { it, fit, describe, expect, spy } = runner;

function baseData() {
    return {
        age: 40,
        retAge: 68,
        salary: 40000,
        accrued: 0,
        cpi: 0.02,
        stopAge: null,
        rows: []
    };
}

describe("Alpha Pension Calculator", () => {
    it("CARE produces pension", () => {
        // Arrange
        const sut = new Calc();
        const d = baseData();
        spy(sut, "getTotal").and.callFake(() => 15000);

        // Act
        const result = sut.calc(d);

        // Assert
        expect(sut.getTotal).toHaveBeenCalledWith(d);
        expect(result).toBeGreaterThan(10000);
    });
    it("added pension increases result", () => {
        // Arrange
        const sut = new Calc();
        const d = baseData();
        d.rows = [{ type: "self", period: "month", amount: 1000 }];

        // Act
        const result = sut.calc(d);

        // Assert
        expect(result).toBeGreaterThan(10000);
    });
    it("stopping contributions reduces pension", () => {
        // Arrange
        const sut = new Calc();
        const d1 = baseData();
        d1.rows = [{ type: "self", period: "month", amount: 500 }];
        const d2 = baseData();
        d2.rows = [{ type: "self", period: "month", amount: 500 }];
        d2.stopAge = 55;

        // Act
        const result = sut.calc(d1);
        const resultEarlyStopAge = sut.calc(d2);

        // Assert
        expect(resultEarlyStopAge).toBeLessThan(result);
    });
    it("higher salary increases pension", () => {
        // Arrange
        const sut = new Calc();
        const low = baseData();
        low.salary = 30000;
        const high = baseData();
        high.salary = 60000;

        // Act
        const resultHighSalary = sut.calc(high);
        const resultLowSalary = sut.calc(low);

        // Assert
        expect(resultHighSalary).toBeGreaterThan(resultLowSalary);
    });
    it("a failing test", () => {
        // Arrange

        // Act & Assert
        expect(1).toBeGreaterThan(2);
    });
});
