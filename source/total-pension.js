import { Care } from "./salary-pension.js";
import { Added } from "./added-pension.js";

export class Calc {
    static calculate(memberData) {
        return memberData.accrued + Care.calculate(memberData) + Added.calculate(memberData);
    }
}