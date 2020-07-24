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
var stats;
var newBasal;

$("document").ready(() => {
    // retrieve stats data from database
    db.ref("/stats").once("value", (statsSnapshot) => {
        stats = statsSnapshot.val();
    });
});

// use form input to calculate suggested basal amount
$("#calcBasalButton").click(() => {
    var basal = parseInt($("#basalInput").val());
    var pmBS = parseInt($("#pmBSInput").val());
    var pmHour = parseInt($("#pmHourInput").val());
    var pmTime = $("#pmTimeInput").val();
    var amBS = parseInt($("#amBSInput").val());
    var amHour = parseInt($("#amHourInput").val());
    var amTime = $("#amTimeInput").val();
    //              12    1       2       3       4       5       6       7       8       9       10      11      12     1    2       3       4      5    6       7       8    9      10      11      
    var rates = [.9916, .9916, 1.0846, 1.1001, 1.1466, 1.1776, 1.224, 1.255, 1.2395, 1.1931, 1.1311, 1.0691, .9452, .8677, .8367, .8367, .8367, .8212, .8212, .8367, .8677, .8677, .9142, .9452];

    // validate form data
    if (!isNaN(pmBS) && !isNaN(amBS)) {
        var bedTime;
        var wakeTime;

        // convert to military time
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
        var timeDifference = Math.abs(bedTime - wakeTime);
        console.log("Time Diff: " + timeDifference)

        var rateDiff = 0;
        // use rates array to calculate expected blood sugar for each hour until am reading time is reached
        for (var count = 0; count < timeDifference; count++) {
            console.log(bedTime);
            rateDiff += rates[bedTime];
            bedTime++;
        }
        var predictedBS = pmBS + (rateDiff - timeDifference) * stats.cf;
        console.log("Predicted AM Blood Sugar: " + predictedBS.toFixed(4));
        // calculate new suggested bolus amount
        newBasal = basal + (amBS - predictedBS) / stats.cf * 24 / timeDifference;

        // append result and update button to html
        $("#basalResult").html("<h4>Suggested Basal: " + newBasal.toFixed(0) + " units</h4>");
        var button = "<button type'button' class='btn btn-success' id='updateStatsButton'>Update Stats</button>";
        $("#basalResult").append(button);
    }
});

// calculates new sesitivity value using suggested basal amount
$(document).on("click", "#updateStatsButton", function (e) {
    e.preventDefault();
    stats.sensCo = parseFloat((2 * newBasal / (stats.weight * 0.453592)).toFixed(2));
    console.log(stats.sensCo);
    // update stats in database then show confirmation modal
    db.ref("/stats").set(stats).then(() => {
        $("#confirm-modal-text").html("<h2>Stats successfully updated.</h2>");
        $("#confirm-modal").modal("show");
    });
});