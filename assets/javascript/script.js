$("document").ready(() => {
    var weight;
    var sensCo;
    var bs;
    var carb1;
    var pro1;
    var lastDose;
    var hours;
    var hyperMod = 1;
    var activeInsulin = 0;

    var ic = 1800 / weight;
    var raise = 770.54574 * Math.pow(weight, -1.000424505);
    var cf = parseFloat(raise * ic);
    var basal = parseFloat(weight * 0.453592 * sensCo / 2);
    var estimatedBasal = (500 - (175 + 175 * .36)) / ic;
    // carbs must be between 225-325
    var estimatedSensco = estimatedBasal * 2 / (weight * 0.453592);
    var ratesAm = [1.0846, 1.1001, 1.1466, 1.1776, 1.224, 1.255, 1.2395, 1.1931, 1.1311, 1.0691];
    // 2-11am
    var ratesPm = [.9916, .9916, .9452, .8677, .8367, .8367, .8367, .8212, .8212, .8367, .8677, .8677, .9142, .9452];
    //12pm - 2 am
    var amOffset = 0;

    $("#calcStats").on("click", function(){
        weight = parseFloat($("#weightInput").val());
        console.log(weight);
        sensCo = parseFloat($("#sensitivityInput").val());
        console.log(sensCo);
    })
})