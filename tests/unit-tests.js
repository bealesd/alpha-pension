import { TestRunner } from "https://cdn.jsdelivr.net/gh/bealesd/js-test@main/source/test-runner.js"
import { Calc } from "../source/total-pension.js";
import { Care } from "../source/salary-pension.js";
import { Added } from "../source/added-pension.js";

const runner = TestRunner.getInstance();
const { it, fit, describe, expect, spy } = runner;

function createBaseMemberData() {
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
        const memberData = createBaseMemberData();
        spy(Care, "calculate").and.callFake(() => 15000);

        // Act
        const result = Calc.calculate(memberData);

        // Assert
        expect(Care.calculate).toHaveBeenCalledWith(memberData);
        expect(result).toBeGreaterThan(10000);
    });
    it("added pension increases result", () => {
        // Arrange
        const d = createBaseMemberData();
        d.rows = [{ type: "self", period: "month", amount: 1000 }];

        // Act
        const result = Calc.calculate(d);

        // Assert
        expect(result).toBeGreaterThan(10000);
    });
    it("stopping contributions reduces pension", () => {
        // Arrange
        const memberData = createBaseMemberData();
        memberData.rows = [{ type: "self", period: "month", amount: 500 }];
        const memberDataEarlyPreserve = createBaseMemberData();
        memberDataEarlyPreserve.rows = [{ type: "self", period: "month", amount: 500 }];
        memberDataEarlyPreserve.stopAge = 55;

        // Act
        const result = Calc.calculate(memberData);
        const resultEarlyStopAge = Calc.calculate(memberDataEarlyPreserve);

        // Assert
        expect(resultEarlyStopAge).toBeLessThan(result);
    });
    it("higher salary increases pension", () => {
        // Arrange
        const memberDataLowSalary = createBaseMemberData();
        memberDataLowSalary.salary = 30000;
        const memberDataHighSalary = createBaseMemberData();
        memberDataHighSalary.salary = 60000;

        // Act
        const resultHighSalary = Calc.calculate(memberDataHighSalary);
        const resultLowSalary = Calc.calculate(memberDataLowSalary);

        // Assert
        expect(resultHighSalary).toBeGreaterThan(resultLowSalary);
    });
});
