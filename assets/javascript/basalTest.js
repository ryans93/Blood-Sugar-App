var rates = [.9916, .9916, 1.0846, 1.1001, 1.1466, 1.1776, 1.224, 1.255, 1.2395, 1.1931, 1.1311, 1.0691, .9452, .8677, .8367, .8367, .8367, .8212, .8212, .8367, .8677, .8677, .9142, .9452];

let basal = 55;
let newBasal = 61;
let cf = 14.4;
let bs = 90;
let diff = 0;
let hour = 7;
let diffArr = [];

rates.forEach((r, index)=>{
    bs += (basal / 24 * r - newBasal / 24) * cf;
    console.log(((index) % 24) + ":00\t" + bs.toFixed(0));
    diff += (r- newBasal / basal);
    diffArr.push(diff);
    console.log(diff.toFixed(4));
});

let percent = (basal * diffArr[hour - 1] / hour  - 10 / cf + 55) / 55 - 1;
console.log((percent * 100).toFixed(2) + "%");