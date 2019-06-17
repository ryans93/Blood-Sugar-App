var weight;
var sensCo;
var ic;
var ip;
var raise;
var cf;
var basal;
var estimatedBasal;
// carbs must be between 225-325
var estimatedSensco;
var offset;
var tdi;
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
            weight = parseFloat($("#weightInput").val());
            sensCo = parseFloat($("#sensitivityInput").val());
            ic = 1800 / weight;
            ip = 1 / .36 * ic;
            raise = 770.54574 * Math.pow(weight, -1.000424505);
            cf = parseFloat(raise * ic);
            basal = parseFloat(weight * 0.453592 * sensCo / 2);
            estimatedBasal = (500 - (175 + 175 * .36)) / ic;
            estimatedSensco = estimatedBasal * 2 / (weight * 0.453592);
            offset = 1.62 * basal / 24;
            $stats.show();
            $bolus.show();
            $stats.html("<h3>Stats</h3>");
            $stats.append("<h5>Insulin:Carb Ratio\t" + ic.toFixed(1) + "</h5>");
            $stats.append("<h5>Insulin:Protein Ratio\t" + ip.toFixed(1) + "</h5>");
            $stats.append("<h5>Correction Factor\t" + cf.toFixed(1) + "</h5>");
            $stats.append("<h5>Basal\t" + basal.toFixed(1) + "</h5>");
            $stats.append("<h5>Estimated Basal (500 rule)\t" + estimatedBasal.toFixed(1) + "</h5>");
            $stats.append("<h5>Estimated Sensitivity\t" + estimatedSensco.toFixed(2) + "</h5>");
            $stats.append("<h5>7am/7pm offset\t" + offset.toFixed(1) + "</h5>");
            $stats.append("<h3>Meals</h3>");
            var totalBolus = 0
            for (var i = 1; i < meals.length; i++) {
                var bolus = meals[i].carbs / ic + meals[i].protein / ip;
                totalBolus += bolus;
                $stats.append("<h5>" + meals[i].text + "\tBolus: " + bolus.toFixed(1) + "</h5>");
            }
            tdi = basal + totalBolus;
            $stats.append("<h5>TDI:\t" + tdi.toFixed(1) + "</h5>");
            $stats.append("<h5>" + (100 * totalBolus / tdi).toFixed(1) + "% bolus\t" + (100 * basal / tdi).toFixed(1) + "% basal</h5>");
        }
    });

    $("#mealSelect").click(() => {
        var meal = $("#mealSelect").val();
        for (var i = 0; i < meals.length; i++) {
            if (meal.toLowerCase() === meals[i].text.toLowerCase()) {
                console.log("here");
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
            var $bolusDisplay = $("#totalBolusDisplay");
            $bolusDisplay.html("<h5>Bolus\t" + bolusObj.bolus.toFixed(1) + "</h5>");
            $bolusDisplay.append("<h5>Correction\t" + bolusObj.correction.toFixed(1) + "</h5>");
            $bolusDisplay.append("<h5>Active\t" + bolusObj.active.toFixed(1) + "</h5>");
            $bolusDisplay.append("<h4>Total\t" + bolusObj.total.toFixed(1) + "</h4>");
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

        var hyperMod = 1;
        if (bs >= 130) {
            hyperMod = bs * .0015 + .806151;
        }
        bolusObj.correction = (bs - 90) / cf * hyperMod;

        bolusObj.active = lastDose * (-.01002331 * Math.pow(hours, 4) + .0966847967 * Math.pow(hours, 3) - .2579059829 * Math.pow(hours, 2) - .1248510749 * hours + 1.003651904);

        bolusObj.total = bolusObj.bolus + bolusObj.correction - bolusObj.active;

        if (bolusObj.total < 0) {
            var low = 90 + bolusObj.total * cf;
            console.log(low);
            if (low < 80) {
                bolusObj.lowFlag = true;
                bolusObj.lowBs = low;
                bolusObj.carbCorrection = (90 - low) / raise;
            }
        }

        return bolusObj;
    }
})