import { factors } from "./factors.js";
import addedPensionRevaluationFactorByYears from "./added_pension_revaluation_factors.js";

export class AddedPension {
    calculate(memberData) {
        let totalAdded = 0;
        const stopAge = memberData.retAge;

        for (let currentAge = memberData.age; currentAge < memberData.retAge; currentAge++) {
            if (currentAge >= stopAge) continue;

            memberData.rows.forEach(row => {
                const yearlyAmount = row.period === "month" ? row.amount * 12 : row.amount;
                // const factor = this.getAddedPensionByPeriodicalContributionFactors(memberData.retAge, currentAge, row.type);
                // if (!factor) return;

                const purchasedUnits = this.calculateAddedPensionForYearForGivenAge(yearlyAmount, currentAge, row.type);

                // const purchasedUnits = yearlyAmount / factor;
                const growthFactor = Math.pow(1 + memberData.cpi, memberData.retAge - currentAge);
                totalAdded += purchasedUnits * growthFactor;
            });
        }
        return totalAdded;
    }

    getAddedPensionRevaluationFactorByYears = (age) => {
        return addedPensionRevaluationFactorByYears[68 - age].factor;
    };

    getAddedPensionByPeriodicalContributionFactors = (age, type) => {
        const addedPensionByPeriodicalContributionFactors = factors;
        let factor = addedPensionByPeriodicalContributionFactors[68][age]?.[type];
        return factor;
    };


    calculateAddedPensionForYearForGivenAge = (totalContributionsForPeriod, currentAge, type) => {
        return Math.round(
            totalContributionsForPeriod / ((this.getAddedPensionByPeriodicalContributionFactors(currentAge, type)) * this.getAddedPensionRevaluationFactorByYears(currentAge))
        );
    };
}