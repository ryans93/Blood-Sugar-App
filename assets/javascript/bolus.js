// config firebase
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
var meals = [
    {
        name: "-",
        carbs: 0,
        protein: 0
    }
];
var stats;

$("document").ready(() => {
    // query meals from database and push into meals array, query favorites first
    db.ref("/meals").orderByChild("name").once("value", (snapshot) => {
        snapshot.forEach((data) => {
            meals.push(data.val());
            var option = `<option index=${meals.length - 1}> ${data.val().name} </option>`;
            $("#mealSelect").append(option);
        })
        // copy stats data from database into stats
        db.ref("/stats").once("value", (statsSnapshot) => {
            stats = statsSnapshot.val();
        });
    });
});

// auto-populate carbs and protein when meal selected
$("#mealSelect").change(() => {
    let meal = meals[$("#mealSelect option:selected").attr("index")];
    $("#carbsInput").val(meal.carbs);
    $("#proteinInput").val(meal.protein);
});

// get form data and call calculateBolus(), append data to html
$("#calcBolusButton").click(() => {
    var bloodSugar = parseInt($("#bsInput").val());
    var carbs = parseInt($("#carbsInput").val());
    var protein = parseInt($("#proteinInput").val());
    var active = parseFloat($("#activeInsulinInput").val());
    var activity = $("#activitySelect").val();
    // input validation
    if (!isNaN(bloodSugar)) {
        var bolusObj = calculateBolus(bloodSugar, carbs, protein, active, activity);
        bolus = bolusObj.total;
        // calculate symlin dosage
        var symlin = bolusObj.total * 3.47;
        if (symlin % 15 >= 7.5) {
            symlin += 15 - symlin % 15;
        }
        else {
            symlin -= symlin % 15;
        }
        // append html
        var $bolusDisplay = $("#totalBolusDisplay");
        $bolusDisplay.html("<h5>Bolus\t" + bolusObj.bolus.toFixed(1) + "</h5>");
        $bolusDisplay.append("<h5>Correction\t" + bolusObj.correction.toFixed(1) + "</h5>");
        $bolusDisplay.append("<h5>Active\t" + bolusObj.active.toFixed(1) + "</h5>");
        // removing basal offset display. Refactor?
        //$bolusDisplay.append("<h5>Basal Offset\t" + bolusObj.basalOffset.toFixed(1) + "</h5>");
        $bolusDisplay.append("<h4>Total\t" + bolusObj.total.toFixed(0) + "</h4>");
        $bolusDisplay.append("<h5>Symlin\t" + symlin.toFixed(0) + "mcg</h5>");
        if (bolusObj.time >= 0) {
            $bolusDisplay.append("<h5>Dosage Time</h5><h5>" + Math.floor(bolusObj.time) + " hours</h5><h5>" + ((bolusObj.time % 1) * 60).toFixed(0) + " minutes</h5>");
        }
        else {
            $bolusDisplay.append("<h5>Dosage Time</h5><h5>" + Math.ceil(bolusObj.time) + " hours</h5><h5>" + ((bolusObj.time % 1) * 60).toFixed(0) + " minutes</h5>");
        }
        // if low blood sugar predicted, show low blood sugar modal
        if (bolusObj.lowFlag) {
            var body = $("#lowBsModalBody");
            body.html("<h5>Low blood sugar of " + bolusObj.lowBs.toFixed(0) + " predicted.</h5>");
            body.append("<h5>Consume " + bolusObj.carbCorrection.toFixed(0) + " carbs to correct.</h5>");
            $("#lowBsModal").modal("show");
        }
        // show reminder modal 
        $("#reminder-modal").modal("show");
    }
});

// calculates bolus dosage and meal timing
function calculateBolus(bs, carbs, protein, active, activity) {
    var bolusObj = {
        bolus: 0,
        correction: 0,
        active: 0,
        //basalOffset: 0,
        total: 0,
        lowFlag: false,
        lowBs: 0,
        carbCorrection: 0,
        time: 0
    };
    bolusObj.bolus = carbs / stats.ic + protein / stats.ip;
    // modifier accounting for dehydration due to high blood sugar
    var hyperMod = 1;
    if (bs >= 130) {
        hyperMod = bs * .0015 + .806151;
    }
    bolusObj.correction = (bs - 90) / stats.cf * hyperMod;
    bolusObj.active = active;

    // calc basal offset. Note: removed. Refactor?
    //           12am    1       2       3       4       5       6       7       8       9       10      11      12     1    2       3       4      5    6       7       8    9      10      11   12am   1       2          3
    /* var rates = [.9916, .9916, 1.0846, 1.1001, 1.1466, 1.1776, 1.224, 1.255, 1.2395, 1.1931, 1.1311, 1.0691, .9452, .8677, .8367, .8367, .8367, .8212, .8212, .8367, .8677, .8677, .9142, .9452, .9916, .9916, 1.0846, 1.1001];
    var time = new Date();
    var hour = time.getHours();
    if (time.getMinutes() > 30) {
        hour++;
    }
    console.log("current hour: " + hour);
    var offset = 0;
    for (let i = 0; i < 4; i++) {
        console.log(hour);
        offset += rates[hour] - 1;
        console.log(offset)
        hour++;
    }
    console.log("hourly offset: " + offset);
    bolusObj.basalOffset = parseFloat(stats.weight * 0.453592 * stats.sensCo / 2) / 24 * offset;
    console.log("basal offset: " + bolusObj.basalOffset.toFixed(4)); */

    // calc total bolus
    bolusObj.total = Math.round((bolusObj.bolus + bolusObj.correction - bolusObj.active / activity) * activity /*+ bolusObj.basalOffset*/);

    // check if lowblood sugar is predicted
    if (bolusObj.total < 0) {
        var low = 90 + bolusObj.total * stats.cf;
        if (low < 80) {
            bolusObj.lowFlag = true;
            bolusObj.lowBs = low;
            bolusObj.carbCorrection = (90 - low) / stats.raise;
        }
    }
    // calculate dosage time
    let desiredActive = 1 - (bolusObj.correction * activity) / (bolusObj.total + bolusObj.active);
    let increment = desiredActive <= 1 ? 5 / 60 : -5 / 60;
    bolusObj.time = 0 //findTime(desiredActive, increment, 0, null);
    return bolusObj;
}

//deprecated. NEEDS REFACTORING
function findTime(desiredActive, increment, time, prevDiff) {
    let active;
    var insulinType = parseFloat($("#insulinTypeSelect").val());
    active = findIOB(insulinType, lastDose, hourDiff)

    let diff = desiredActive - active;
    console.log("active " + active);
    console.log("diff " + diff);
    console.log("prevDiff " + prevDiff);
    console.log("time " + time);
    if (prevDiff === null) {
        return findTime(desiredActive, increment, time + increment, diff);
    }
    else {
        if (Math.abs(diff) <= Math.abs(prevDiff)) {
            console.log("----------------------------");
            return findTime(desiredActive, increment, time + increment, diff);
        }
        else {
            console.log(diff, prevDiff);
            return time - increment - .25;
        }
    }
}

// take form data and add log into database
$(document).on("click", "#addLogButton", () => {
    if (bolus === undefined) {
        return;
    }
    var bloodSugar = parseInt($("#bsInput").val());
    var carbs = parseInt($("#carbsInput").val());
    var protein = parseInt($("#proteinInput").val());
    var activity = $("#activitySelect").val();
    var date = new Date();
    var day;
    // date display fix
    if (date.getDate() < 10) {
        day = date.getMonth() + 1 + "-0" + date.getDate() + "-" + date.getFullYear();

    }
    else {
        day = date.getMonth() + 1 + "-" + date.getDate() + "-" + date.getFullYear();
    }
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
    db.ref("/logs/" + day).push(newLog);
    // show confirmation modal
    $("#confirm-modal-title").text("Save log");
    $("#confirm-modal-text").text("Saved Successfully!");
    $("#confirm-modal").modal("show");
});

// search database for all doses within 4 hours to find active insulin
$("#findActiveButton").on("click", () => {
    console.log($("#intra-check").is(":checked"));
    var date = new Date();
    var hour = date.getHours();
    var minute = date.getMinutes();
    var day = date.getDate();
    var month = date.getMonth() + 1;
    var year = date.getFullYear();
    var monthDays = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    var insulinType = parseFloat($("#insulinTypeSelect").val());
    var activeTime = insulinType;
    console.log("Active Time: " + activeTime);
    console.log("Insulin Type: " + insulinType);
    // leap year
    if (year % 4 == 0) {
        monthDays[1] = 29;
    }
    var active = 0;
    var dateString;
    // date fix
    if (date.getDate() < 10) {
        dateString = date.getMonth() + 1 + "-0" + date.getDate() + "-" + date.getFullYear();

    }
    else {
        dateString = date.getMonth() + 1 + "-" + date.getDate() + "-" + date.getFullYear();
    }
    console.log(dateString);

    // check current day
    db.ref("/logs/" + dateString).once("value").then((snapshot) => {
        // loop through each reading
        snapshot.forEach((child) => {
            // check if reading is older than 4 hours
            if ((child.val().minute < minute && child.val().hour == hour - activeTime) || child.val().hour < (hour - activeTime)) {
                return;
            }
            console.log(child.val());
            var lastDose = child.val().bolus;
            var hourDiff = hour - child.val().hour;
            var minuteDiff = minute - child.val().minute;
            hourDiff += minuteDiff / 60;
            console.log("time difference: " + hourDiff);
            // double time difference for intra-muscular injection
            if ($("#intra-check").is(":checked")) {
                hourDiff *= 2;
                // prevent hour difference from exceeding 4
                if (hourDiff > activeTime) {
                    hourDiff = activeTime;
                }
                console.log("intra-muscular time difference: " + hourDiff);
            }
            // calculate active insulin
            active += findIOB(insulinType, lastDose, hourDiff)
        });
        $("#activeInsulinInput").val(active.toFixed(1));
    });
    // get logs from yesterday if between 12-4am
    if (hour >= 0 && hour < activeTime) {
        // get formate for previous day's date
        day--;
        if (day == -1) {
            month--;
            if (month == -1) {
                month = 11
                year--;
            }
            day = monthDays[month];
        }
        var newDate;
        // date fix
        if (day < 10) {
            newDate = month + "-0" + day + "-" + year;

        }
        else {
            newDate = month + "-" + day + "-" + year
        }
        console.log(newDate);
        // query logs from previous day
        db.ref("/logs/" + newDate).once("value").then((snapshot) => {
            // loop through each log
            snapshot.forEach((child) => {
                // check if log is older than 4 hours
                if ((child.val().minute < minute && child.val().hour == (24 + hour - activeTime)) || child.val().hour < (24 + hour - activeTime)) {
                    return;
                }
                console.log(child.val());
                var lastDose = child.val().bolus;
                var hourDiff = hour - (child.val().hour - 24);
                var minuteDiff = minute - child.val().minute;
                hourDiff += minuteDiff / 60;
                console.log("time difference: " + hourDiff);
                // double time difference for intra-muscular injection
                if ($("#intra-check").is(":checked")) {
                    hourDiff *= 2;
                    // prevent hour difference from exceeding 4
                    if (hourDiff > activeTime) {
                        hourDiff = activeTime;
                    }
                    console.log("intra-muscular time difference: " + hourDiff);
                }
                // calculate active insulin
                active += findIOB(insulinType, lastDose, hourDiff)
            });
            $("#activeInsulinInput").val(active.toFixed(1));
        });
    }
});

function findIOB(duration, dose, hours) {
    console.log(`Dose: ${dose}\nTime Elapsed: ${hours} hours\n`)
    let peakCoeff = duration == 4.5 ? 20 : duration == 5.5 ? 25 : 30;
    let peak = duration * peakCoeff;
    let minutes = hours * 60;
    console.log(peakCoeff);

    // logic for bilateral functions
    if (minutes <= peak) {
        let ob = 1 - 200 * Math.pow(minutes, 2) / (12000 * peak * duration);
        let iob = ob * dose;
    
        //openAPS method
        var x1 = (3 / duration * minutes / 5) + 1;  // scaled minutes since bolus, pre-peak; divided by 5 to work with coefficients estimated based on 5 minute increments
        iobContrib = dose * ((-0.001852 * x1 * x1) + (0.001852 * x1) + 1.000000);
    
        console.log(`Bilateral % remaining (Pre-peak): ${(ob * 100).toFixed(2)}%\t IOB: ${iob.toFixed(1)}\t IOB(OpenAPS) ${iobContrib.toFixed(1)}`);
    }
    else {
        let base = 60 * duration - minutes;
        let height = 200 / (60 * duration) - 200 * (minutes - peak) / (Math.pow(60 * duration, 2) - 60 * duration * peak);
        let ob = base * height / 200;
        let iob = ob * dose;
    
        //openAPS method
        var x2 = ((3 / duration * minutes - 75) / 5);  // scaled minutes past peak; divided by 5 to work with coefficients estimated based on 5 minute increments
        iobContrib = dose * ((0.001323 * x2 * x2) + (-0.054233 * x2) + 0.555560);
        console.log(`Bilateral % remaining (Post-peak): ${(ob * 100).toFixed(2)}%\t IOB: ${iob.toFixed(1)}\t IOB(OpenAPS) ${iobContrib.toFixed(1)}`);
    }

    // logic for exponential function
    let end = duration * 60;  // end of insulin activity, in minutes
    if (peak > 120) {
        peak = 120;
    }
    else if (peak < 50) {
        peak = 50;
    }
    console.log([peak, end, duration, minutes])
    // Formula source: https://github.com/LoopKit/Loop/issues/388#issuecomment-317938473
    var tau = peak * (1 - peak / end) / (1 - 2 * peak / end);  // time constant of exponential decay
    tau = tau !== Infinity ? tau : peak * (1 - peak / end) / .01;
    var a = 2 * tau / end;                                     // rise time factor
    var S = 1 / (1 - a + (1 + a) * Math.exp(-end / tau));      // auxiliary scale factor
    let iob = dose * (1 - S * (1 - a) * ((Math.pow(minutes, 2) / (tau * end * (1 - a)) - minutes / tau - 1) * Math.exp(-minutes / tau) + 1));
    console.log(`Exponential % remaining (OpenAPS): ${iob.toFixed(1)}`);
    return iob;
}

//old IoB formula
/*
    case 0:
        active += lastDose * (-.01002331 * Math.pow(hourDiff, 4) + .0966847967 * Math.pow(hourDiff, 3) - .2579059829 * Math.pow(hourDiff, 2) - .1248510749 * hourDiff + 1.003651904);
        console.log("active: " + active);
        break;
    case 1:
        active += lastDose * (-.0093160839 * Math.pow(hourDiff, 4) + .0749320383 * Math.pow(hourDiff, 3) - .1491268454 * Math.pow(hourDiff, 2) - .2589889925 * hourDiff + 1.005624864);
        console.log("active: " + active);
        break;
    case 2:
        active += lastDose * (-.0032352941 * Math.pow(hourDiff, 4) + .04462959 * Math.pow(hourDiff, 3) - .17594239 * Math.pow(hourDiff, 2) - .0209426828 * hourDiff + 1.006270685);
        console.log("active: " + active);
        break;
*/