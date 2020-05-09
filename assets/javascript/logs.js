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

$("document").ready(() => {
    displayLogs(7);
});

// display averages
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

    // get logs for past number of days equal to value selected
    var query = db.ref("/logs").limitToLast(num);
    // get list of days
    query.once("value", (snapshot) => { 
        // loop through each day
        snapshot.forEach((day) => { 
            // count number of days
            dayCount++;
            // loop through logs of each day
            day.forEach((log) => {
                var logObj = log.val();
                bolus += parseFloat(logObj.bolus);
                bs += logObj.bs;
                carbs += logObj.carbs;
                protein += logObj.protein;
                // count high and low blood sugar readings
                if (logObj.bs > 180) {
                    hiBS++;
                }
                else if (logObj.bs < 70) {
                    lowBS++;
                }
                // count number of readings
                count++;
            });
        });
        bolus /= dayCount;
        bs /= count;
        protein /= dayCount;
        carbs /= dayCount;
        // append html to modal and show modal
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

// display logs for set number of days
function displayLogs(num) {
    $("#logDisplay").html("");
    // query db for logs within set number of days
    var query = db.ref("/logs").limitToLast(num);
    query.once("value", (snapshot) => { 
        //loop through each day
        snapshot.forEach((day) => {
            // loop through all logs in day
            day.forEach((data) => {
                var log = data.val();
                // display fix for time
                if (log.minute < 10) {
                    log.minute = "0" + log.minute;
                }
                if (log.hour < 10) {
                    log.hour = "0" + log.hour;
                }
                // append data to html
                var $dateContainer = "<div class='col-lg-2 col-4 log-Col'>" + log.date + "</div>";
                var $timeContainer = "<div class='col-lg-2 col-4 log-Col'>" + log.hour + ":" + log.minute + "</div>";
                var $bsContainer = "<div class='col-xl-2 col-lg-3 col-6 log-Col'>" + log.bs + "</div>";
                var $bolusContainer = "<div class='col-lg-2 col-4 log-Col'>" + log.bolus + "</div>";
                var $carbsContainer = "<div class='col-xl-1 col-lg-2 col-4 log-Col'>" + log.carbs + "</div>";
                var $proteinContainer = "<div class='col-xl-1 col-lg-2 col-4 log-Col'>" + log.protein + "</div>";
                var $activityContainer = "<div class='col-lg-2 col-4 log-Col'>" + log.activity + "</div>";
                var $rowContainer = "<div class='row' id=" + data.key + ">" + $dateContainer + $timeContainer + $bsContainer + $bolusContainer + $carbsContainer + $proteinContainer + $activityContainer + "</div>";
                $("#logDisplay").append($rowContainer);
                // flag high and low blood sugars
                if (log.bs >= 180){
                    $("#" + data.key).css("background-color", "red");
                }
                else if (log.bs < 70){
                    $("#" + data.key).css("background-color", "darkorange");
                }
            });
        });
    });
}

// calls displayLogs() for number of days selected
$("#averageSelect").change(() => {
    var num = parseInt($("#averageSelect").val());
    console.log(num);
    displayLogs(num);
});