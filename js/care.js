export function care(d) {
    let t = 0, rate = 0.0232;
    let stop = d.stopAge || d.retAge;

    for (let a = d.age; a < d.retAge; a++) {
        let slice = a < stop ? d.salary * rate : 0;
        let grow = Math.pow(1 + d.cpi, d.retAge - a);
        t += slice * grow;
    }
    return t;
}
