import { TestRunner } from "../js/TestRunner.js";

const runner = TestRunner.getInstance();
const { it, fit, describe, expect } = runner;

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

describe("Some UI Tests", () => {
    it("a failing test 2", () => {
        expect(1).toBeGreaterThan(2);
    });
});
