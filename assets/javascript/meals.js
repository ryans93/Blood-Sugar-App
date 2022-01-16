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
    displayMeals();
});

// show add meal modal
$("#addMealButton").on("click", function () {
    $("#addMealModal").modal("show");
});

// use form data to add new meal to database and reload page
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

// query database for meals, show favorites first
function displayMeals() {
    db.ref("/meals").orderByChild("name").once("value", (snapshot) => {
        display(snapshot);
    });
};

// loop through meal data and append html to page
function display(snapshot){
    snapshot.forEach((data) => {
        console.log(data.key)
        var meal = data.val();
        console.log(meal);
        var $nameContainer = "<div class='col-xl-2 col-lg-2 col-4 meal-Col' id=" + data.key + "-name>" + meal.name + "</div>";
        var $descriptionContainer = "<div class='col-xl-4 col-lg-6 col-12 meal-Col desc' id=" + data.key + "-description>" + meal.description + "</div>";
        var $carbsContainer = "<div class='col-xl-1 col-lg-2 col-4 meal-Col' id=" + data.key + "-carbs>" + meal.carbs + "</div>";
        var $proteinContainer = "<div class='col-xl-1 col-lg-2 col-4 meal-Col' id=" + data.key + "-protein>" + meal.protein + "</div>";
        var $favoriteContainer;
        if (meal.favorite){
            $favoriteContainer = "<div class='col-xl-2 col-lg-2 col-4 meal-Col'><input type='checkbox' class='form-check-input' id=" + data.key + "-favorite checked></div>";
        }
        else{
            $favoriteContainer = "<div class='col-xl-2 col-lg-2 col-4 meal-Col'><input type='checkbox' class='form-check-input' id=" + data.key + "-favorite></div>";
        }
        var editButton = "<button type='button' class='btn btn-primary' id='editMealButton' data=" + data.key + ">Edit</button>";
        var deleteButton = "<button type='button' class='btn btn-danger' style='margin-left: 30px' id='deleteMealButton' data=" + data.key + ">X</button>"
        var $buttonContainer = "<div class='col-xl-2 col-lg-2 col-4 meal-Col'>" + editButton + deleteButton + "</div>"
        var $rowContainer = "<div class='row mealRow'>" + $nameContainer + $descriptionContainer + $carbsContainer + $proteinContainer + $favoriteContainer + $buttonContainer + "</div>";
        $("#mealDisplay").append($rowContainer);
    });
}

// delete meal and reload page
$(document).on("click", "#deleteMealButton", function(){
    console.log($(this).attr("data"));
    db.ref("/meals/" + $(this).attr("data")).remove().then(function(){
        location.reload();
    });
});

// fill out form using existing values on edit meal modal and show it
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

// use form data to update selected meal and reload page
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