import { RegularPension } from "./regular-pension.js";
import { AddedPension } from "./added-pension.js";

export class TotalPension {
    static calculate(memberData) {
        return memberData.accrued + RegularPension.calculate(memberData) + AddedPension.calculate(memberData);
    }
}