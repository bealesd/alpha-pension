import { RegularPension } from "./regular-pension.js";
import { AddedPension } from "./added-pension.js";

export class TotalPension {
    static calculate(memberData) {
        const accruedAsAnnual = RegularPension.convertAccruedToAnnual(memberData, memberData.type || "self");
        return accruedAsAnnual + RegularPension.calculate(memberData) + AddedPension.calculate(memberData);
    }
}