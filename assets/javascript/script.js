var weight;
var sensCo;
var ic;
var ip;
var raise;
var cf;
var basal;
var bolus;
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
        text: "Breakfast",
        carbs: 64,
        protein: 49
    },
    {
        text: "Lunch",
        carbs: 24,
        protein: 28
    },
    {
        text: "Snack",
        carbs: 20,
        protein: 30
    },
    {
        text: "Post-workout",
        carbs: 6,
        protein: 48
    },
    {
        text: "Dinner",
        carbs: 71,
        protein: 32
    },
    {
        text: "Bed",
        carbs: 10,
        protein: 20
    },
];

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
            var lbm = 182.6 * 0.453592;
            var bmr = (370 + (21.6 * lbm) - lbm) * 1.1;
            console.log(bmr);
            estimatedBasal1 = bmr * .45 / 4 / ic;
            estimatedSensco1 = estimatedBasal1 * 2 / (weight * 0.453592);
            estimatedBasal2 = bmr * .65 / 4 / ic;
            estimatedSensco2 = estimatedBasal2 * 2 / (weight * 0.453592);
            offset = 1.62 * basal / 24;
            $stats.show();
            $bolus.show();
            $stats.html("<h3>Stats</h3>");
            $stats.append("<h5>Insulin:Carb Ratio\t" + ic.toFixed(1) + "</h5>");
            $stats.append("<h5>Insulin:Protein Ratio\t" + ip.toFixed(1) + "</h5>");
            $stats.append("<h5>Correction Factor\t" + cf.toFixed(1) + "</h5>");
            $stats.append("<h5>Basal\t" + basal.toFixed(1) + "</h5>");
            $stats.append("<h5>Estimated Basal\t" + estimatedBasal1.toFixed(1) + "-" + estimatedBasal2.toFixed(1) + "</h5>");
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
        var active = parseInt($("#activeInsulinInput").val());
        var activity = $("#activitySelect").val();
        if (!isNaN(bloodSugar)) {
            var bolusObj = calculateBolus(bloodSugar, carbs, protein, active, activity);
            bolus = bolusObj.total;
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
            if (bolusObj.time >= 0) {
                $bolusDisplay.append("<h5>Dosage Time</h5><h5>" + Math.floor(bolusObj.time) + " hours</h5><h5>" + ((bolusObj.time % 1) * 60).toFixed(0) + " minutes</h5>");
            }
            else {
                $bolusDisplay.append("<h5>Dosage Time</h5><h5>" + Math.ceil(bolusObj.time) + " hours</h5><h5>" + ((bolusObj.time % 1) * 60).toFixed(0) + " minutes</h5>");
            }
            if (bolusObj.lowFlag) {
                var body = $("#lowBsModalBody");
                body.html("<h5>Low blood sugar of " + bolusObj.lowBs.toFixed(0) + " predicted.</h5>");
                body.append("<h5>Consume " + bolusObj.carbCorrection.toFixed(0) + " carbs to correct.</h5>");
                $("#lowBsModal").modal("show");
            }
        }
    });

    function calculateBolus(bs, carbs, protein, active, activity) {
        var bolusObj = {
            bolus: 0,
            correction: 0,
            active: 0,
            total: 0,
            lowFlag: false,
            lowBs: 0,
            carbCorrection: 0,
            time: 0
        };
        bolusObj.bolus = carbs / ic + protein / ip;
        var hyperMod = 1;
        /*if (bs >= 130) {
            hyperMod = bs * .0015 + .806151;
        }*/
        bolusObj.correction = (bs - 90) / cf * hyperMod;
        bolusObj.active = active;
        bolusObj.total = Math.round((bolusObj.bolus + bolusObj.correction - bolusObj.active) * activity);

        if (bolusObj.total < 0) {
            var low = 90 + bolusObj.total * cf;
            if (low < 80) {
                bolusObj.lowFlag = true;
                bolusObj.lowBs = low;
                bolusObj.carbCorrection = (90 - low) / raise;
            }
        }
        bolusObj.time = ((bs - 90) / ((bolusObj.active + bolusObj.total) * cf) + .0411111111) / .2683333333 + 0.04;
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

            if (pmTime === "am") {
                bedTime = pmHour % 12;
            }
            else {
                if (pmHour == 12) {
                    bedTime = 12;
                }
                else {
                    bedTime = pmHour + 12;
                }
            }
            if (amTime === "am") {
                wakeTime = amHour % 12;
            }
            else {
                if (amHour == 12) {
                    wakeTime = 12;
                }
                else {
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

    $("#addLogButton").on("click", () => {
        if (bolus === undefined) {
            return;
        }
        var bloodSugar = parseInt($("#bsInput").val());
        var carbs = parseInt($("#carbsInput").val());
        var protein = parseInt($("#proteinInput").val());
        var activity = $("#activitySelect").val();
        var date = new Date();
        var day = date.getMonth() + 1 + "-" + date.getDate() + "-" + date.getFullYear();
        var newLog = {
            date: day,
            hour: date.getHours(),
            minute: date.getMinutes(),
            bs: bloodSugar,
            carbs: carbs,
            protein: protein,
            bolus: bolus.toFixed(1),
            activity: activity
        };
        db.ref("/" + day).push(newLog);
        $("#confirm-modal-title").text("Save log");
        $("#confirm-modal-text").text("Saved Successfully!");
        $("#confirm-modal").modal("show");
    });

    $("#findActiveButton").on("click", () => {
        var date = new Date();
        var hour = date.getHours();
        var minute = date.getMinutes();
        var day = date.getDate();
        var month = date.getMonth() + 1;
        var year = date.getFullYear();
        var monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
        if (year % 4 == 0) {
            monthDays[1] = 29;
        }
        var active = 0;
        db.ref("/" + month + "-" + day + "-" + year).once("value").then((snapshot) => {
            snapshot.forEach((child) => {
                if ((child.val().minute < minute && child.val().hour == hour - 4) || child.val().hour < (hour - 4)) {
                } else {
                    console.log(child.val());
                    var lastDose = child.val().bolus;
                    var hourDiff = hour - child.val().hour;
                    var minuteDiff = minute - child.val().minute;
                    hourDiff += minuteDiff / 60;
                    console.log("time difference: " + hourDiff);
                    active += lastDose * (-.01002331 * Math.pow(hourDiff, 4) + .0966847967 * Math.pow(hourDiff, 3) - .2579059829 * Math.pow(hourDiff, 2) - .1248510749 * hourDiff + 1.003651904);
                    console.log("active: " + active);
                }
            });
            $("#activeInsulinInput").val(active.toFixed(1));
        });
        if (hour >= 0 && hour < 4) { // get logs from yesterday
            day--;
            if (day == 0) {
                month--;
                if (month == -1) {
                    month = 11
                    year--;
                }
                day = monthDays[month];
            }
            var newDate = month + "-" + day + "-" + year;
            db.ref("/" + newDate).once("value").then((snapshot) => {
                snapshot.forEach((child) => {
                    if ((child.val().minute < minute && child.val().hour == (24 + hour - 4)) || child.val().hour < (24 + hour - 4)) {
                    } else {
                        console.log(child.val());
                        var lastDose = child.val().bolus;
                        var hourDiff = hour - (child.val().hour - 24);
                        var minuteDiff = minute - child.val().minute;
                        hourDiff += minuteDiff / 60;
                        console.log("time difference: " + hourDiff);
                        active += lastDose * (-.01002331 * Math.pow(hourDiff, 4) + .0966847967 * Math.pow(hourDiff, 3) - .2579059829 * Math.pow(hourDiff, 2) - .1248510749 * hourDiff + 1.003651904);
                        console.log("active: " + active);
                    }
                });
                $("#activeInsulinInput").val(active.toFixed(1));
            });
        }
    });

    $("#averageButton").on("click", function () {
        var num = parseInt($("#averageSelect").val());
        var count = 0;
        var dayCount = 0;
        var bs = 0;
        var hiBS = 0;
        var lowBS = 0;
        var bolus = 0;
        var carbs = 0;
        var protein = 0;

        var query = db.ref().limitToLast(num);
        query.once("value", (snapshot) => { //get list of days
            snapshot.forEach((day) => {
                dayCount++;
                day.forEach((log) => {
                    var logObj = log.val();
                    bolus += parseFloat(logObj.bolus);
                    bs += logObj.bs;
                    carbs += logObj.carbs;
                    protein += logObj.protein;
                    if (logObj.bs > 150) {
                        hiBS++;
                    }
                    else if (logObj.bs <= 70) {
                        lowBS++;
                    }
                    count++;
                });
            });
            bolus /= dayCount;
            bs /= count;
            protein /= dayCount;
            carbs /= dayCount;
            $("#average-modal-title").text(num + " day Average");
            $("#average-modal-body").html("");
            $("#average-modal-body").append("<h5>Blood Sugar: " + bs.toFixed(0) + "</h5>");
            $("#average-modal-body").append("<h5>Total Daily Bolus: " + bolus.toFixed(1) + "</h5>");
            $("#average-modal-body").append("<h5>Carbs: " + carbs.toFixed(0) + "</h5>");
            $("#average-modal-body").append("<h5>Protein: " + protein.toFixed(0) + "</h5>");
            $("#average-modal-body").append("<h5># of highs: " + hiBS + "</h5>");
            $("#average-modal-body").append("<h5># of lows: " + lowBS + "</h5>");
            $("#average-modal").modal("show");
        });
    });

    $("#printButton").on("click", function () {
        var num = parseInt($("#averageSelect").val());
        $("#data-modal-title").text(num + " day logs");
        $("#data-content").html("");
        $("#data-content").append("<pre>Date        Time    BS  Bolus   Car.   Pro.   Activity</pre>");
        var query = db.ref().limitToLast(num);
        query.once("value", (snapshot) => { //get list of days
            snapshot.forEach((day) => {
                day.forEach((data) => {
                    var log = data.val();
                    if (log.minute == 0) {
                        log.minute = "00";
                    }
                    var string = log.date + "  ";
                    string += log.hour + ":" + log.minute + "   ";
                    string += log.bs + "\t";
                    string += log.bolus + "\t";
                    string += log.carbs + "\t";
                    string += log.protein + "\t";
                    string += log.activity + "\n";
                    $("#data-content").append("<pre>" + string + "</pre>");
                });
            });
            $("#data-modal").modal("show");
        });
    });
});