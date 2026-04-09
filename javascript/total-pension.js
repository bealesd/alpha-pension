import { RegularPension } from "./regular-pension.js";
import { AddedPension } from "./added-pension.js";
import earlyPaymentReductionFactors from "./early_payment_reduction_factors.js";

export class TotalPension {
    calculate(memberData) {
        const accruedAsAnnual = (new RegularPension).convertAccruedToAnnual(memberData);
        const earlyReductionFactor = this.getEarlyReductionFactors(memberData.pensionStartAge);

        return Math.round(earlyReductionFactor * (accruedAsAnnual + (new RegularPension).calculate(memberData) + (new AddedPension).calculate(memberData)));
    }

    getEarlyReductionFactors = (earlyRetirementAge) => {
        // NPA will always be 68 unless EPA has been purchased
        return earlyPaymentReductionFactors[68][earlyRetirementAge];
    };
}
