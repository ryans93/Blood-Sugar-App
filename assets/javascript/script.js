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
            text: "Lunch\t",
            carbs: 28,
            protein: 35
        },
        {
            text: "Snack\t",
            carbs: 18,
            protein: 29
        },
        {
            text: "Dinner\t",
            carbs: 70,
            protein: 33
        }
    ];

    $("#calcStats").on("click", function () {
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
        var $stats = $("#statDisplay");
        $stats.attr("class", "col-4 display");
        $stats.html("<h3>Stats</h3>");
        $stats.append("<h5>Insulin:Carb Ratio\t" + ic.toFixed(1) + "</h5>");
        $stats.append("<h5>Insulin:Protein Ratio\t" + ip.toFixed(1) + "</h5>");
        $stats.append("<h5>Correction Factor\t" + cf.toFixed(1) + "</h5>");
        $stats.append("<h5>Basal\t" + basal.toFixed(1) + "</h5>");
        $stats.append("<h5>Estimated Basal\t" + estimatedBasal.toFixed(1) + "</h5>");
        $stats.append("<h5>Estimated Sensitivity\t" + estimatedSensco.toFixed(1) + "</h5>");
        $stats.append("<h5>7am/7pm offset\t" + offset.toFixed(1) + "</h5>");
        $stats.append("<h3>Meals</h3>");
        var totalBolus = 0
        for (var i = 0; i < meals.length; i++) {
            var bolus = meals[i].carbs / ic + meals[i].protein / ip;
            totalBolus += bolus;
            $stats.append("<h5>" + meals[i].text + "\tBolus: " + bolus.toFixed(1) + "</h5>");
        }
        tdi = basal + totalBolus;
        $stats.append("<h5>TDI:\t" + tdi.toFixed(1) + "</h5>");
        $stats.append("<h5>" + (100 * totalBolus / tdi).toFixed(1) + "% bolus\t" + (100 * basal / tdi).toFixed(1) + "% basal</h5>");

    })
})