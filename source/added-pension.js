import { factors } from "./factors.js";

export class Added {
    static calculate(memberData) {
        let totalAdded = 0;
        const stopAge = memberData.stopAge ?? memberData.retAge;

        for (let currentAge = memberData.age; currentAge < memberData.retAge; currentAge++) {
            if (currentAge >= stopAge) continue;

            memberData.rows.forEach(row => {
                const yearlyAmount = row.period === "month" ? row.amount * 12 : row.amount;
                const factor = factors[memberData.retAge]?.[currentAge]?.[row.type];
                if (!factor) return;

                const purchasedUnits = yearlyAmount / factor;
                const growthFactor = Math.pow(1 + memberData.cpi, memberData.retAge - currentAge);
                totalAdded += purchasedUnits * growthFactor;
            });
        }
        return totalAdded;
    }
}