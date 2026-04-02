import { TestRunner } from "https://cdn.jsdelivr.net/gh/bealesd/js-test@main/source/test-runner.js"
import { TotalPension } from "../javascript/total-pension.js";
import { RegularPension } from "../javascript/regular-pension.js";
import { AddedPension } from "../javascript/added-pension.js";

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
        spy(RegularPension, "calculate").and.callFake(() => 15000);

        // Act
        const result = TotalPension.calculate(memberData);

        // Assert
        expect(RegularPension.calculate).toHaveBeenCalledWith(memberData);
        expect(result).toBeGreaterThan(10000);
    });
    it("added pension increases result", () => {
        // Arrange
        const d = createBaseMemberData();
        d.rows = [{ type: "self", period: "month", amount: 1000 }];

        // Act
        const result = TotalPension.calculate(d);

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
        const result = TotalPension.calculate(memberData);
        const resultEarlyStopAge = TotalPension.calculate(memberDataEarlyPreserve);

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
        const resultHighSalary = TotalPension.calculate(memberDataHighSalary);
        const resultLowSalary = TotalPension.calculate(memberDataLowSalary);

        // Assert
        expect(resultHighSalary).toBeGreaterThan(resultLowSalary);
    });
});
