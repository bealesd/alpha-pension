import { factors } from "./factors.js";

export class RegularPension {
    static calculate(memberData) {
        let totalPension = 0;
        const contributionRate = 0.0232;
        const stopAge = memberData.stopAge ?? memberData.retAge;

        for (let currentAge = memberData.age; currentAge < memberData.retAge; currentAge++) {
            const yearlyContribution = currentAge < stopAge ? memberData.salary * contributionRate : 0;
            const growthFactor = Math.pow(1 + memberData.cpi, memberData.retAge - currentAge);
            totalPension += yearlyContribution * growthFactor;
        }
        return totalPension;
    }

    // helper: convert current lump sum to annual pension at retirement
    static convertAccruedToAnnual(memberData, pensionType = "self") {
        if (!memberData.accrued || memberData.accrued <= 0) return 0;
        const currentAge = memberData.age;
        const retAge = memberData.retAge;
        const factor = factors[retAge]?.[currentAge]?.[pensionType];
        if (!factor) return 0; // no factor available -> treat as 0 or handle differently

        // grow the lump-sum to retirement nominally
        const grownLump = memberData.accrued * Math.pow(1 + memberData.cpi, Math.max(0, retAge - currentAge));

        // convert grown lump-sum to annual pension using the annuity factor
        return grownLump / factor;
    }
}