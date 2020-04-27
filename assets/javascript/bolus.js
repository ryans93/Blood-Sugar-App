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
    //$("body").css("height", "100%"); 
    init();
});

function init() {
    db.ref("/meals").orderByChild("favorite").equalTo(true).once("value", (snapshot) => {
        snapshot.forEach((data) => {
            meals.push(data.val());
            var option = "<option>" + data.val().name + "</option>";
            $("#mealSelect").append(option);
        })
        db.ref("/meals").orderByChild("favorite").equalTo(false).once("value", (snapshot2) => {
            snapshot2.forEach((data2) => {
                meals.push(data2.val());
                var option = "<option>" + data2.val().name + "</option>";
                $("#mealSelect").append(option);
            });
            db.ref("/stats").once("value", (statsSnapshot) =>{
                stats = statsSnapshot.val();
            });
        });
    });
};

$("#mealSelect").change(() => {
    var meal = $("#mealSelect").val();
    for (var i = 0; i < meals.length; i++) {
        if (meal.toLowerCase() === meals[i].name.toLowerCase()) {
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
        $bolusDisplay.append("<h4>Total\t" + bolusObj.total.toFixed(0) + "</h4>");
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
        $("#reminder-modal").modal("show");
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
    bolusObj.bolus = carbs / stats.ic + protein / stats.ip;
    var hyperMod = 1;
    /*if (bs >= 130) {
        hyperMod = bs * .0015 + .806151;
    }*/
    bolusObj.correction = (bs - 90) / stats.cf * hyperMod;
    bolusObj.active = active;
    bolusObj.total = Math.round((bolusObj.bolus + bolusObj.correction - bolusObj.active) * activity);

    if (bolusObj.total < 0) {
        var low = 90 + bolusObj.total * stats.cf;
        if (low < 80) {
            bolusObj.lowFlag = true;
            bolusObj.lowBs = low;
            bolusObj.carbCorrection = (90 - low) / stats.raise;
        }
    }
    bolusObj.time = ((bs - 90) / ((bolusObj.active + bolusObj.total) * stats.cf) + .0411111111) / .2683333333 + 0.04;
    return bolusObj;
}

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
    $("#confirm-modal-title").text("Save log");
    $("#confirm-modal-text").text("Saved Successfully!");
    $("#confirm-modal").modal("show");
});

$("#findActiveButton").on("click", () => {
    console.log($("#intra-check").is(":checked"));
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
    var dateString;
    if (date.getDate() < 10) {
        dateString = date.getMonth() + 1 + "-0" + date.getDate() + "-" + date.getFullYear();

    }
    else {
        dateString = date.getMonth() + 1 + "-" + date.getDate() + "-" + date.getFullYear();
    }
    db.ref("/logs/" + dateString).once("value").then((snapshot) => {
        snapshot.forEach((child) => {
            if ((child.val().minute < minute && child.val().hour == hour - 4) || child.val().hour < (hour - 4)) {
            } else {
                console.log(child.val());
                var lastDose = child.val().bolus;
                var hourDiff = hour - child.val().hour;
                var minuteDiff = minute - child.val().minute;
                hourDiff += minuteDiff / 60;
                console.log("time difference: " + hourDiff);
                if ($("#intra-check").is(":checked")) {
                    hourDiff *= 2;
                    console.log("intra-muscular time difference: " + hourDiff);
                }
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
        var newDate;
        if (day < 10) {
            newDate = month + "-" + day + "-" + year;
    
        }
        else {
            newDate = month + "-0" + day + "-" + year
        }
        
        db.ref("/logs/" + newDate).once("value").then((snapshot) => {
            snapshot.forEach((child) => {
                if ((child.val().minute < minute && child.val().hour == (24 + hour - 4)) || child.val().hour < (24 + hour - 4)) {
                } else {
                    console.log(child.val());
                    var lastDose = child.val().bolus;
                    var hourDiff = hour - (child.val().hour - 24);
                    var minuteDiff = minute - child.val().minute;
                    hourDiff += minuteDiff / 60;
                    console.log("time difference: " + hourDiff);
                    if ($("#intra-check").is(":checked")) {
                        hourDiff *= 2;
                        console.log("intra-muscular time difference: " + hourDiff);
                    }
                    active += lastDose * (-.01002331 * Math.pow(hourDiff, 4) + .0966847967 * Math.pow(hourDiff, 3) - .2579059829 * Math.pow(hourDiff, 2) - .1248510749 * hourDiff + 1.003651904);
                    console.log("active: " + active);
                }
            });
            $("#activeInsulinInput").val(active.toFixed(1));
        });
    }
});