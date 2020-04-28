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
    //$("body").css("height", "100%");
    displayLogs(7);
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

    var query = db.ref("/logs").limitToLast(num);
    query.once("value", (snapshot) => { //get list of days
        snapshot.forEach((day) => {
            dayCount++;
            day.forEach((log) => {
                var logObj = log.val();
                bolus += parseFloat(logObj.bolus);
                bs += logObj.bs;
                carbs += logObj.carbs;
                protein += logObj.protein;
                if (logObj.bs > 180) {
                    hiBS++;
                }
                else if (logObj.bs < 70) {
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

function displayLogs(num) {
    //var num = parseInt($("#averageSelect").val());
    $("#logDisplay").html("");
    var query = db.ref("/logs").limitToLast(num);
    query.once("value", (snapshot) => { //get list of days
        snapshot.forEach((day) => {
            day.forEach((data) => {
                var log = data.val();
                if (log.minute < 10) {
                    log.minute = "0" + log.minute;
                }
                if (log.hour < 10) {
                    log.hour = "0" + log.hour;
                }
                var $dateContainer = "<div class='col-lg-2 col-4'>" + log.date + "</div>";
                var $timeContainer = "<div class='col-lg-2 col-4'>" + log.hour + ":" + log.minute + "</div>";
                var $bsContainer = "<div class='col-xl-2 col-lg-3 col-6'>" + log.bs + "</div>";
                var $bolusContainer = "<div class='col-lg-2 col-4'>" + log.bolus + "</div>";
                var $carbsContainer = "<div class='col-xl-1 col-lg-2 col-4'>" + log.carbs + "</div>";
                var $proteinContainer = "<div class='col-xl-1 col-lg-2 col-4'>" + log.protein + "</div>";
                var $activityContainer = "<div class='col-lg-2 col-4'>" + log.activity + "</div>";
                var $rowContainer = "<div class='row reading-row' id=" + data.key + ">" + $dateContainer + $timeContainer + $bsContainer + $bolusContainer + $carbsContainer + $proteinContainer + $activityContainer + "</div>";
                $("#logDisplay").append($rowContainer);
                if (log.bs >= 180){
                    $("#" + data.key).css("background-color", "red");
                }
                else if (log.bs < 70){
                    $("#" + data.key).css("background-color", "darkorange");
                }
            });
        });
        $("#data-modal").modal("show");
    });
}

$("#averageSelect").change(() => {
    var num = parseInt($("#averageSelect").val());
    console.log(num);
    displayLogs(num);
});