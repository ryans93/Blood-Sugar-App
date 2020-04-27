var stats = {
    weight: 0,
    sensCo: 0,
    ic: 0,
    ip: 0,
    raise: 0,
    cf: 0
};
var meals = [];
var $stats = $("#statDisplay");

var config = {
    apiKey: "AIzaSyBzsI73lH5-qLrt7s4Br439ZQWeASwcWPA",
    authDomain: "blood-sugar-app.firebaseapp.com",
    databaseURL: "https://blood-sugar-app.firebaseio.com",
    projectId: "blood-sugar-app",
    storageBucket: "blood-sugar-app.appspot.com",
    messagingSenderId: "825167606606",
    appId: "1:825167606606:web:4b9175670229405795641f",
    measurementId: "G-BVGFKS95M6"
};

firebase.initializeApp(config);
// Get a reference to the database service
var db = firebase.database();

$("document").ready(() => {
    $stats.hide();
    getFavoriteMeals();

    db.ref("/stats").once("value").then(function (snapshot) {
        var statsObj = snapshot.val()
        console.log(statsObj);
        if (statsObj !== null) {
            stats = statsObj;
            $("#weightInput").val(stats.weight);
            $("#sensitivityInput").val(stats.sensCo);
            displayStats();
        }
    });

    $("#calcStats").on("click", function () {
        stats.weight = parseFloat($("#weightInput").val());
        stats.sensCo = parseFloat($("#sensitivityInput").val());
        stats.ic = 1800 / stats.weight;
        stats.ip = 1 / .36 * stats.ic;
        stats.raise = 770.54574 * Math.pow(stats.weight, -1.000424505);
        stats.cf = parseFloat(stats.raise * stats.ic);

        db.ref("/stats").set(stats).then(() => {
            displayStats();
        });
    });
});

function displayStats() {
    //$("body").css("height", "100%"); 

    var basal = parseFloat(stats.weight * 0.453592 * stats.sensCo / 2);
    var lbm = 182.6 * 0.453592;
    var bmr = (370 + (21.6 * lbm) - lbm) * 1.1;
    console.log(bmr);
    var estimatedBasal1 = bmr * .45 / 4 / stats.ic;
    var estimatedSensco1 = estimatedBasal1 * 2 / (stats.weight * 0.453592);
    var estimatedBasal2 = bmr * .65 / 4 / stats.ic;
    var estimatedSensco2 = estimatedBasal2 * 2 / (stats.weight * 0.453592);
    var offset = 1.62 * basal / 24;

    var $stats = $("#statDisplay");
    $stats.html("<h3>Stats</h3>");
    $stats.append("<h5>Insulin:Carb Ratio\t" + stats.ic.toFixed(1) + "</h5>");
    $stats.append("<h5>Insulin:Protein Ratio\t" + stats.ip.toFixed(1) + "</h5>");
    $stats.append("<h5>Correction Factor\t" + stats.cf.toFixed(1) + "</h5>");
    $stats.append("<h5>Basal\t" + basal.toFixed(1) + "</h5>");
    $stats.append("<h5>Estimated Basal\t" + estimatedBasal1.toFixed(1) + "-" + estimatedBasal2.toFixed(1) + "</h5>");
    $stats.append("<h5>Estimated Sensitivity\t" + estimatedSensco1.toFixed(2) + "-" + estimatedSensco2.toFixed(2) + "</h5>");
    $stats.append("<h5>8am/2pm offset\t" + offset.toFixed(1) + "</h5>");
    $stats.append("<h3>Meals</h3>");
    $stats.show();
    var totalBolus = 0
    for (var i = 0; i < meals.length; i++) {
        var bolus = meals[i].carbs / stats.ic + meals[i].protein / stats.ip;
        totalBolus += bolus;
        $stats.append("<h5>" + meals[i].name + "\tBolus: " + bolus.toFixed(1) + "</h5>");
    }
    var tdi = basal + totalBolus;
    var goalTDI = 2.7595473 * Math.pow(10, -4) * Math.pow(stats.weight, 2) + .2283867552 * stats.weight - 1.548147422;
    $stats.append("<h5>TDI:\t" + tdi.toFixed(1) + "</h5>");
    $stats.append("<h5>Goal TDI (500 rule):\t" + goalTDI.toFixed(1) + "</h5>");
    $stats.append("<h5>" + (100 * totalBolus / tdi).toFixed(1) + "% bolus\t" + (100 * basal / tdi).toFixed(1) + "% basal</h5>");
}

function getFavoriteMeals(){
    db.ref("/meals").orderByChild("favorite").equalTo(true).on("value", function (snapshot){
        snapshot.forEach((data) => {
            console.log(data.val());
            meals.push(data.val());
        });
    });
}
