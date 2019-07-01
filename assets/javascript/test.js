var weight = parseFloat(process.argv[2]);
var basal = parseInt(process.argv[3]);
var bsBed = parseInt(process.argv[4]);
var bsWake = parseInt(process.argv[5]);
var bedTime = parseInt(process.argv[6]);
var wakeTime = parseInt(process.argv[7]);

var rates = [.9916, .9916, 1.0846, 1.1001, 1.1466, 1.1776, 1.224, 1.255, 1.2395, 1.1931, 1.1311, 1.0691, .9452, .8677, .8367, .8367, .8367, .8212, .8212, .8367, .8677, .8677, .9142, .9452];

var hourly = basal / 24;
var ic = 1800 / weight;
var raise = 770.54574 * Math.pow(weight, -1.000424505);
var cf = parseFloat(raise * ic);

var predictedBS = bsBed;

for(var count = bedTime; count < wakeTime; count++){
    predictedBS = predictedBS + (rates[count] * hourly - hourly) * cf;
}

var difference = bsWake - predictedBS;
var timeDifference = Math.abs(bedTime - wakeTime);

var newBasal = basal + difference / cf * 24 / timeDifference;
console.log(newBasal.toFixed(0));