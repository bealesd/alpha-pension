import { RegularPension } from "./regular-pension.js";
import { AddedPension } from "./added-pension.js";
import earlyPaymentReductionFactorsForNpa from "./early-payment-reduction-factors-for-npa-2025-02.js";

export class TotalPension {
    calculate(memberData) {
        const accruedAsAnnual = (new RegularPension).convertAccruedToAnnual(memberData);
        const earlyPaymentReductionFactorNpa = this.getEarlyPaymentReductionFactors(memberData.pensionStartAge);

        const totalPension = accruedAsAnnual + (new RegularPension).calculate(memberData) + (new AddedPension).calculate(memberData);

        return Math.round(earlyPaymentReductionFactorNpa * totalPension);
    }
    /**
     * @param {Number} earlyRetirementAge
     */
    getEarlyPaymentReductionFactors = (earlyRetirementAge) => {
        // NPA is state pension age, which is currently set at 68
        // EPA is effective pension age which can be up to NPA -3
        // Currently EPA is not part of this calculator
        const NPA = 68;
        return earlyPaymentReductionFactorsForNpa[NPA][earlyRetirementAge];
    };
}
