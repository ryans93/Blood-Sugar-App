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

The user can select a meal from the dropdown menu to auto-populate the carbs and protein fields. If eating a meal that has not been added to the app, they can do so on the Meals Page or manually enter the amount of carbs and protein consumed. The user's blood sugar reading must also be entered. If a previous dose(s) were taken within the past four hours, use the "Find Active Insulin" button to find any insulin still active. Subtracting active insulin from previous doses is necessary to avoid low blood sugars. If any of the previous doses were done as intramuscular injections, check the intra-muscular box to correct the active insulin amount. The reading data can be saved by pressing the "Save" button on either the modal or the page itself.

![bolus](/assets/images/screenshots/bolus.png)
