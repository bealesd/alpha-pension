import { factors } from "./factors.js";

export function added(d) {
    let t = 0;
    let stop = d.stopAge || d.retAge;

    for (let a = d.age; a < d.retAge; a++) {
        if (a >= stop) continue;

        d.rows.forEach(r => {
            let y = r.period === "month" ? r.amount * 12 : r.amount;
            let f = factors[d.retAge]?.[a]?.[r.type];
            if (!f) return;

            let bought = y / f;
            let grow = Math.pow(1 + d.cpi, d.retAge - a);
            t += bought * grow;
        });
    }
    return t;
}
