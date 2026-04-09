import { TestRunner } from "https://cdn.jsdelivr.net/gh/bealesd/js-test@main/source/test-runner.js"
import { TotalPension } from "../javascript/total-pension.js";
import { RegularPension } from "../javascript/regular-pension.js";
import { AddedPension } from "../javascript/added-pension.js";

const runner = TestRunner.getInstance();
const { it, fit, describe, expect, spy } = runner;

function createBaseMemberData() {
    return {
        age: 40,
        retirementAge: 68,
        salary: 40000,
        accrued: 0,
        cpi: 0.02,
        rows: []
    };
}

describe("total-pension.js Unit Tests", () => {
    it("Total Pension Converts Accrued Pension To Annual", () => {
        // Arrange
        const sut = new TotalPension();

        const memberData = createBaseMemberData();
        spy(RegularPension.prototype, "convertAccruedToAnnual").and.callFake(() => 6000);
        spy(RegularPension.prototype, "calculate").and.callFake(() => 12000);
        spy(AddedPension.prototype, "calculate").and.callFake(() => 2000);
        spy(sut, "getEarlyReductionFactors").and.returnValue(0.9);

        // Act
        const result = sut.calculate(memberData);

        // Assert
        expect(RegularPension.prototype.convertAccruedToAnnual).toHaveBeenCalledWith(memberData);
        expect(result).toEqual(18000);
    });
})

describe("total-pension.js Integration Tests", () => {
    it("added pension increases result", () => {
        // Arrange
        const sut = new TotalPension();

        const d = createBaseMemberData();
        d.rows = [{ type: "self", period: "month", addedPensionPayment: 1000 }];

        // Act
        const result = sut.calculate(d);

        // Assert
        expect(result).toBeGreaterThan(10000);
    });
    it("stopping contributions reduces pension", () => {
        // Arrange
        const sut = new TotalPension();

        const memberData = createBaseMemberData();
        memberData.rows = [{ type: "self", period: "month", addedPensionPayment: 500 }];

        const memberDataEarlyPreserve = createBaseMemberData();
        memberDataEarlyPreserve.rows = [{ type: "self", period: "month", addedPensionPayment: 500 }];
        memberDataEarlyPreserve.retirementAge = 55;

        // Act
        const result = sut.calculate(memberData);
        const resultEarlyStopAge = sut.calculate(memberDataEarlyPreserve);

        // Assert
        expect(resultEarlyStopAge).toBeLessThan(result);
    });
    it("higher salary increases pension", () => {
        // Arrange
        const sut = new TotalPension();

        const memberDataLowSalary = createBaseMemberData();
        memberDataLowSalary.salary = 30000;
        const memberDataHighSalary = createBaseMemberData();
        memberDataHighSalary.salary = 60000;

        // Act
        const resultHighSalary = sut.calculate(memberDataHighSalary);
        const resultLowSalary = sut.calculate(memberDataLowSalary);

        // Assert
        expect(resultHighSalary).toBeGreaterThan(resultLowSalary);
    });
});
