export class Care {
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
}