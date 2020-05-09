# Blood-Sugar-App

## Description

An application aimed to assist type-1 diabetics in controlling their blood sugar. The app can calculate key stats such as insulin:carbohydrate ratio, correction factor, and total daily insulin dosage. Users can also use the app to calculate insulin dosages at meal times, add and edit custom meals, and display logs and averages.

### Home Page

This page takes the users weight and sensitivity coefficient to calculate key numbers and stats used in other sections of the app. 

#### Usage 

Enter weight in lbs and senstivity number into form and press "Calculate". The sensitivity number is a number that can fluctuate daily and represents the users sensitivity to insulin due to physical activity. The lower the number, the more sensitive you are to the effects of insulin. A sliding scale is provided a below as a guide. This number can be more accurately estimated by using the Basal Page.

![home 1](/assets/images/screenshots/home1.png)
![home 2](/assets/images/screenshots/home2.png)

### Bolus Page

This page allows the user to calculate a bolus or correction insulin dose. The app also gives a recommended time to wait after taking the insulin injection before eating. If a low blood sugar is predicted, the user is alerted and the app calculates an amount of carbohydrates to negate the low. Blood sugar logs are saved to the database on this page as well.

#### Usage

The user can select a meal from the dropdown menu to auto-populate the carbs and protein fields. If eating a meal that has not been added to the app, they can do so on the Meals Page or manually enter the amount of carbs and protein consumed. The user's blood sugar reading must also be entered. If a previous dose(s) were taken within the past four hours, use the "Find Active Insulin" button to find any insulin still active. Subtracting active insulin from previous doses is necessary to avoid low blood sugars. If any of the previous doses were done as intramuscular injections, check the intra-muscular box to correct the active insulin amount. The user can then select their anticipated exercise level after eating to modify their dose. The reading data can be saved by pressing the "Save" button on either the modal or the page itself.

![bolus](/assets/images/screenshots/bolus.png)

### Basal Page

The page gives the user a better estimate for their daily basal dose. After filling out the form, a new suggested basal amount is shown. The user then has the option to update their sensitivity number. 

#### Usage

Regular periodic use of this page is recommended, due to the fluctuating nature of the sensitivity number. The last used basal dose should first be entered. The user should then enter their blood sugar level before bed and the time checked, as well as the morning reading and time checked. It is important for these readings to be taken with as little bolus insulin active as possible and to avoid eating food between these times. The longer period the fast is, the more accurate the recommendation will be. Ideally, the user would check their blood sugar before bed, atleast 4 hours from their last meal, go to bed without snacking, then recheck upon waking. 

![basal](/assets/images/screenshots/basal.png)

### Meals Page

This page allows users to create, edit, and delete their own custom meals. Meals added on this page are used on the Bolus Page to auto-populate carbs and protein when selected. This prevents redundant carb-counting for meals that the user eats on a frequent basis.

#### Usage

Clicking the "Add+" button will show a form to add a new meal to the database. Clicking the "Edit" button for its associated meal will show a form to update it. The "X" button deletes its associated meal. Users can also favorite certain meals. A favorite meal is shown in the stats section the Home Page. Favorite meals also appear on the top of the page and are the first options for meal selections on the Bolus Page.

![meals](/assets/images/screenshots/meals.png)
![add meal](/assets/images/screenshots/add-meal.png)

### Logs Page

This page allows users to display their logs recorded in the database, as well as averages and other stats such as number of highs and lows. High blood sugars are flagged red and lows are flagged orange.

#### Usage

Select an option from the dropdown menu to display logs for those previous days. Clicking the "Averages" button will show averages and statistics corresponding to the days selected in the dropdown menu.

![logs](/assets/images/screenshots/logs.png)
![logs-averages](/assets/images/screenshots/logs-averages.png)

### Data 

Clicking the Data link will redirect to the Firebase Database for the app. The root of the database has 3 branches: 

1. Logs
2. Meals
3. Stats

#### Logs

The logs branch is divided into sub branches for each day (mm-dd-yyyy). Each day contains its associated readings. These reading are entered from the Bolus Page.

![db-1](/assets/images/screenshots/db-1.png)

#### Meals

This branch contains the meals entered by the user on the Meals Page.

#### Stats

This branch holds a single object containing key numbers calculated on the home page. This data is accessed on other pages of the app. 

![db-2](/assets/images/screenshots/db-2.png)

## Installation

No software is needed for this app besides a compatible internet browser.

## Upcoming features

There are no planned features in development at this time.

## Authors and Acknowledgements

- Ryan Strickler - author
- "Think Like a Pancreas" by Gary Scheiner - data for equations used in app and hourly basal rates
- "Dr. Bernstein's Diabetes Solution: The Complete Guide to Achieving Normal Blood Sugars" by Richard Bernstein - data for equations used in app
