import { addedPensionByPeriodicalContributionFactors } from "./added_pension_contribution_factors.js";
import addedPensionRevaluationFactorByYears from "./added_pension_revaluation_factors.js";

export class AddedPension {
    calculate(memberData) {
        let totalAdded = 0;
        const stopAge = memberData.retirementAge;

        for (let currentAge = memberData.age; currentAge < memberData.retirementAge; currentAge++) {
            if (currentAge >= stopAge) continue;

            memberData.rows.forEach(row => {
                const addedPensionPaymentYearly = row.period === "month" ? row.addedPensionPayment * 12 : row.addedPensionPayment;
                const purchasedUnits = this.calculateAddedPensionForYearForGivenAge(addedPensionPaymentYearly, currentAge, row.type);
                const growthFactor = Math.pow(1 + memberData.cpi, memberData.retirementAge - currentAge);
                totalAdded += purchasedUnits * growthFactor;
            });
        }
        return totalAdded;
    }

    getAddedPensionRevaluationFactorByYears = (age) => {
        return addedPensionRevaluationFactorByYears[68 - age].factor;
    };

    getAddedPensionByPeriodicalContributionFactors = (age, type) => {
        let factor = addedPensionByPeriodicalContributionFactors[68][age][type];
        return factor;
    };


    calculateAddedPensionForYearForGivenAge = (totalContributionsForPeriod, currentAge, type) => {
        return Math.round(
            totalContributionsForPeriod / (this.getAddedPensionByPeriodicalContributionFactors(currentAge, type) * this.getAddedPensionRevaluationFactorByYears(currentAge))
        );
    };
}