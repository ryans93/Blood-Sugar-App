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
    displayMeals();
});

$("#addMealButton").on("click", function () {
    $("#addMealModal").modal("show");
});

$("#saveMealButton").on("click", function () {
    var newMeal = {
        name: $("#name").val(),
        description: $("#description").val(),
        carbs: $("#carbs").val(),
        protein: $("#protein").val(),
        favorite: $("#favorite").is(":checked")
    };
    console.log(newMeal);
    db.ref("/meals").push(newMeal).then(function () {
        location.reload();
    });
});

function displayMeals() {
    db.ref("/meals").orderByChild("favorite").equalTo(true).once("value", (snapshot) => {
        display(snapshot);
        db.ref("/meals").orderByChild("favorite").equalTo(false).once("value", (snapshot2) => {
            display(snapshot2);
        });
    });
};

function display(snapshot){
    snapshot.forEach((data) => {
        console.log(data.key)
        var meal = data.val();
        console.log(meal);
        var $nameContainer = "<div class='col-1' id=" + data.key + "-name>" + meal.name + "</div>";
        var $descriptionContainer = "<div class='col-6' id=" + data.key + "-description>" + meal.description + "</div>";
        var $carbsContainer = "<div class='col-1' id=" + data.key + "-carbs>" + meal.carbs + "</div>";
        var $proteinContainer = "<div class='col-1' id=" + data.key + "-protein>" + meal.protein + "</div>";
        var $favoriteContainer;
        if (meal.favorite){
            $favoriteContainer = "<div class='col-1'><input type='checkbox' class='form-check-input' id=" + data.key + "-favorite checked></div>";
        }
        else{
            $favoriteContainer = "<div class='col-1'><input type='checkbox' class='form-check-input' id=" + data.key + "-favorite></div>";
        }
        var editButton = "<button type='button' class='btn btn-primary' id='editMealButton' data=" + data.key + ">Edit</button>";
        var deleteButton = "<button type='button' class='btn btn-danger' style='margin-left: 30px' id='deleteMealButton' data=" + data.key + ">X</button>"
        var $buttonContainer = "<div class='col-2'>" + editButton + deleteButton + "</div>"
        var $rowContainer = "<div class='row mealRow'>" + $nameContainer + $descriptionContainer + $carbsContainer + $proteinContainer + $favoriteContainer + $buttonContainer + "</div>";
        $("#mealDisplay").append($rowContainer);
    });
}

$(document).on("click", "#deleteMealButton", function(){
    console.log($(this).attr("data"));
    db.ref("/meals/" + $(this).attr("data")).remove().then(function(){
        location.reload();
    });
});

$(document).on("click", "#editMealButton", function(){
    console.log($(this).attr("data"));
    $("#edit-name").val($("#" + $(this).attr("data") + "-name").text());
    $("#edit-description").val($("#" + $(this).attr("data") + "-description").text());
    $("#edit-carbs").val($("#" + $(this).attr("data") + "-carbs").text());
    $("#edit-protein").val($("#" + $(this).attr("data") + "-protein").text());
    $("#saveEditedMealButton").attr("data", $(this).attr("data"));
    if ($("#"+ $(this).attr("data") + "-favorite").is(":checked")){
        $("#edit-favorite").prop('checked', true);
    }
    $("#editMealModal").modal("show");
});

$("#saveEditedMealButton").on("click", function () {
    var newMeal = {
        name: $("#edit-name").val(),
        description: $("#edit-description").val(),
        carbs: $("#edit-carbs").val(),
        protein: $("#edit-protein").val(),
        favorite: $("#edit-favorite").is(":checked")
    };
    console.log(newMeal);
    db.ref("/meals/" + $(this).attr("data")).set(newMeal).then(function () {
        location.reload();
    });
});