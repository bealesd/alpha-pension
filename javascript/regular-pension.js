export class RegularPension {
    calculate(memberData) {
        let totalPension = 0;
        const contributionRate = 0.0232;
        const stopAge = memberData.retAge;

        for (let currentAge = memberData.age; currentAge < memberData.retAge; currentAge++) {
            const yearlyContribution = currentAge < stopAge ? memberData.salary * contributionRate : 0;
            const growthFactor = Math.pow(1 + memberData.cpi, memberData.retAge - currentAge);
            totalPension += yearlyContribution * growthFactor;
        }
        return totalPension;
    }

    // helper: convert current lump sum to annual pension at retirement
    convertAccruedToAnnual(memberData) {
        if (!memberData.accrued || memberData.accrued <= 0) return 0;
        const currentAge = memberData.age;
        const retAge = memberData.retAge;

        // grow the lump-sum to retirement nominally
        const grownLump = memberData.accrued * Math.pow(1 + memberData.cpi, Math.max(0, retAge - currentAge));
        return grownLump;
    }
}