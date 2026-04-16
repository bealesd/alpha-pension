import { RegularPension } from "./regular-pension.js";
import { AddedPension } from "./added-pension.js";
import earlyPaymentReductionFactorsForNpa from "./early-payment-reduction-factors-for-npa.js";

export class TotalPension {
    calculate(memberData) {
        const accruedAsAnnual = (new RegularPension).convertAccruedToAnnual(memberData);
        const earlyPaymentReductionFactorNpa = this.getEarlyPaymentReductionFactors(memberData.pensionStartAge, memberData.npa);

        const totalPension = accruedAsAnnual + (new RegularPension).calculate(memberData) + (new AddedPension).calculate(memberData);

        return Math.round(earlyPaymentReductionFactorNpa * totalPension);
    }
    /**
     * @param {Number} earlyRetirementAge
     * @param {Number} pensionAge - can be NPA or EPA
     */
    getEarlyPaymentReductionFactors = (earlyRetirementAge, npa=68) => {
        // NPA is state pension age, which is currently set at 68
        // EPA is effective pension age which can be up to NPA -3
        // Currently EPA is not part of this calculator
        return earlyPaymentReductionFactorsForNpa[npa][earlyRetirementAge];
    };
}
