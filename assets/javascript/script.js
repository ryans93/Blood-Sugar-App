var weight;
var sensCo;
var ic;
var ip;
var raise;
var cf;
var basal;
var estimatedBasal1;
var estimatedSensco1;
var estimatedBasal2;
var estimatedSensco2;
var offset;
var tdi;
var goalTDI;
var meals = [
    {
        text: "-",
        carbs: 0,
        protein: 0
    },
    {
        text: "Post-workout",
        carbs: 5,
        protein: 36
    },
    {
        text: "Breakfast",
        carbs: 60,
        protein: 42
    },
    {
        text: "Lunch",
        carbs: 28,
        protein: 35
    },
    {
        text: "Snack",
        carbs: 18,
        protein: 29
    },
    {
        text: "Dinner",
        carbs: 70,
        protein: 33
    }
];

$("document").ready(() => {
    var $stats = $("#statDisplay");
    var $bolus = $("#bolusDisplay");
    $stats.hide();
    $bolus.hide();

    $("#calcStats").on("click", function () {
        if ($("#weightInput").val() !== "" && $("#sensitivityInput").val() !== "") {
            $("body").css("height", "100%");
            weight = parseFloat($("#weightInput").val());
            sensCo = parseFloat($("#sensitivityInput").val());
            ic = 1800 / weight;
            ip = 1 / .36 * ic;
            raise = 770.54574 * Math.pow(weight, -1.000424505);
            cf = parseFloat(raise * ic);
            basal = parseFloat(weight * 0.453592 * sensCo / 2);
            estimatedBasal1 = (500 - 325) / ic;
            estimatedSensco1 = estimatedBasal1 * 2 / (weight * 0.453592);
            estimatedBasal2 = (500 - 225) / ic
            estimatedSensco2 = estimatedBasal2 * 2 / (weight * 0.453592);
            offset = 1.62 * basal / 24;
            $stats.show();
            $bolus.show();
            $stats.html("<h3>Stats</h3>");
            $stats.append("<h5>Insulin:Carb Ratio\t" + ic.toFixed(1) + "</h5>");
            $stats.append("<h5>Insulin:Protein Ratio\t" + ip.toFixed(1) + "</h5>");
            $stats.append("<h5>Correction Factor\t" + cf.toFixed(1) + "</h5>");
            $stats.append("<h5>Basal\t" + basal.toFixed(1) + "</h5>");
            $stats.append("<h5>Estimated Basal (500 rule)\t" + estimatedBasal1.toFixed(1) + "-" + estimatedBasal2.toFixed(1) + "</h5>");
            $stats.append("<h5>Estimated Sensitivity\t" + estimatedSensco1.toFixed(2) + "-" + estimatedSensco2.toFixed(2) + "</h5>");
            $stats.append("<h5>8am/2pm offset\t" + offset.toFixed(1) + "</h5>");
            $stats.append("<h3>Meals</h3>");
            var totalBolus = 0
            for (var i = 1; i < meals.length; i++) {
                var bolus = meals[i].carbs / ic + meals[i].protein / ip;
                totalBolus += bolus;
                $stats.append("<h5>" + meals[i].text + "\tBolus: " + bolus.toFixed(1) + "</h5>");
            }
            tdi = basal + totalBolus;
            goalTDI = 2.7595473 * Math.pow(10, -4) * Math.pow(weight, 2) + .2283867552 * weight - 1.548147422;
            $stats.append("<h5>TDI:\t" + tdi.toFixed(1) + "</h5>");
            $stats.append("<h5>Goal TDI (500 rule):\t" + goalTDI.toFixed(1) + "</h5>");
            $stats.append("<h5>" + (100 * totalBolus / tdi).toFixed(1) + "% bolus\t" + (100 * basal / tdi).toFixed(1) + "% basal</h5>");
            $stats.append("<button class='btn btn-primary' id='basalCalculatorButton'>Basal Calculator</button>");
        }
    });

    $("#mealSelect").change(() => {
        var meal = $("#mealSelect").val();
        for (var i = 0; i < meals.length; i++) {
            if (meal.toLowerCase() === meals[i].text.toLowerCase()) {
                $("#carbsInput").val(meals[i].carbs);
                $("#proteinInput").val(meals[i].protein);
                break;
            }
        }
    });

    $("#calcBolusButton").click(() => {
        var bloodSugar = parseInt($("#bsInput").val());
        var carbs = parseInt($("#carbsInput").val());
        var protein = parseInt($("#proteinInput").val());
        var lastDose = parseInt($("#lastDoseInput").val());
        var hours = parseFloat($("#hoursInput").val());
        if (!isNaN(bloodSugar)) {
            var bolusObj = calculateBolus(bloodSugar, carbs, protein, lastDose, hours);
            var symlin = bolusObj.total * 3.47;
            if (symlin % 15 >= 7.5) {
                symlin += 15 - symlin % 15;
            }
            else {
                symlin -= symlin % 15;
            }
            var $bolusDisplay = $("#totalBolusDisplay");
            $bolusDisplay.html("<h5>Bolus\t" + bolusObj.bolus.toFixed(1) + "</h5>");
            $bolusDisplay.append("<h5>Correction\t" + bolusObj.correction.toFixed(1) + "</h5>");
            $bolusDisplay.append("<h5>Active\t" + bolusObj.active.toFixed(1) + "</h5>");
            $bolusDisplay.append("<h4>Total\t" + bolusObj.total.toFixed(1) + "</h4>");
            $bolusDisplay.append("<h5>Symlin\t" + symlin.toFixed(0) + "mcg</h5>");
            if (bolusObj.lowFlag) {
                var body = $("#lowBsModalBody");
                body.html("<h5>Low blood sugar of " + bolusObj.lowBs.toFixed(0) + " predicted.</h5>");
                body.append("<h5>Consume " + bolusObj.carbCorrection.toFixed(0) + " carbs to correct.</h5>");
                $("#lowBsModal").modal("show");
            }
        }
    });

    function calculateBolus(bs, carbs, protein, lastDose, hours) {
        var bolusObj = {
            bolus: 0,
            correction: 0,
            active: 0,
            total: 0,
            lowFlag: false,
            lowBs: 0,
            carbCorrection: 0
        };
        bolusObj.bolus = carbs / ic + protein / ip;
        // time modifier accounting for longer absorbtion time observed
        hours -= .29;
        var hyperMod = 1;
        /*if (bs >= 130) {
            hyperMod = bs * .0015 + .806151;
        }*/
        bolusObj.correction = (bs - 90) / cf * hyperMod;

        bolusObj.active = lastDose * (-.01002331 * Math.pow(hours, 4) + .0966847967 * Math.pow(hours, 3) - .2579059829 * Math.pow(hours, 2) - .1248510749 * hours + 1.003651904);

        bolusObj.total = bolusObj.bolus + bolusObj.correction - bolusObj.active;

        if (bolusObj.total < 0) {
            var low = 90 + bolusObj.total * cf;
            if (low < 80) {
                bolusObj.lowFlag = true;
                bolusObj.lowBs = low;
                bolusObj.carbCorrection = (90 - low) / raise;
            }
        }

        return bolusObj;
    }

    $("body").on("click", "#basalCalculatorButton", () => {
        $("#basalModal").modal("show");
    });

    $("#calcBasalButton").click(() => {
        var basal = parseInt($("#basalInput").val());
        var pmBS = parseInt($("#pmBSInput").val());
        var pmHour = parseInt($("#pmHourInput").val());
        var pmTime = $("#pmTimeInput").val();
        var amBS = parseInt($("#amBSInput").val());
        var amHour = parseInt($("#amHourInput").val());
        var amTime = $("#amTimeInput").val();
        var rates = [.9916, .9916, 1.0846, 1.1001, 1.1466, 1.1776, 1.224, 1.255, 1.2395, 1.1931, 1.1311, 1.0691, .9452, .8677, .8367, .8367, .8367, .8212, .8212, .8367, .8677, .8677, .9142, .9452];

        if (!isNaN(pmBS) && !isNaN(amBS)) {
            var hourly = basal / 24;
            var predictedBS = pmBS;
            var bedTime;
            var wakeTime;

            if(pmTime === "am"){
                bedTime = pmHour % 12;
            }
            else{
                if (pmHour == 12){
                    bedTime = 12;
                }
                else{
                    bedTime = pmHour + 12;
                }
            }

            if(amTime === "am"){
                wakeTime = amHour % 12;
            }
            else{
                if (amHour == 12){
                    wakeTime = 12;
                }
                else{
                    wakeTime = amHour + 12;
                }
            }

            for (var count = bedTime; count < wakeTime; count++) {
                predictedBS = predictedBS + (rates[count] * hourly - hourly) * cf;
            }

            var difference = amBS - predictedBS;
            var timeDifference = Math.abs(bedTime - wakeTime);

            var newBasal = basal + difference / cf * 24 / timeDifference;

            $("#basalResult").html("<h4>" + newBasal.toFixed(0) + " units</h4>");
        }
    });

})