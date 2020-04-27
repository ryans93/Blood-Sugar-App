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
var stats;
var newBasal;

$("document").ready(() => {
    //$("body").css("height", "100%");
    init();
});

function init() {
    db.ref("/stats").once("value", (statsSnapshot) => {
        stats = statsSnapshot.val();
    });
};

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
            predictedBS = predictedBS + (rates[count] * hourly - hourly) * stats.cf;
        }
        var difference = amBS - predictedBS;
        var timeDifference = Math.abs(bedTime - wakeTime);
        newBasal = basal + difference / stats.cf * 24 / timeDifference;
        $("#basalResult").html("<h4>Suggested Basal: " + newBasal.toFixed(0) + " units</h4>");
        var button = "<button type'button' class='btn btn-success' id='updateStatsButton'>Update Stats</button>";
        $("#basalResult").append(button);
    }
});

$(document).on("click", "#updateStatsButton", function (e) {
    e.preventDefault();
    stats.sensCo = parseFloat((2 * newBasal / (stats.weight * 0.453592)).toFixed(2));
    console.log(stats.sensCo);
    db.ref("/stats").set(stats).then(() => {
        $("#confirm-modal-text").html("<h2>Stats successfully updated.</h2>");
        $("#confirm-modal").modal("show");
    });
});