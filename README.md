# Introduction
This is a software developed to assign students into Dorms.

# Get Started
Install the exec file and run in on an intel mac.

Running the exec file will open the "Terminal" app, and after a few seconds, will generate an output similar to the following:

	 * Serving Flask app 'backend4'

	* Debug mode: on

	WARNING: This is a development server. Do not use it in a production deployment. Use a production WSGI server instead.

	* Running on http://127.0.0.1:5000

	Press CTRL+C to quit

	* Restarting with stat

	* Debugger is active!

	* Debugger PIN: 515-619-927
Notice the line: 

> * Running on http://...(in this case, http://127.0.0.1:5000)

Go to any web browser (Chrome, Safari, etc), and enter the text starting with http://....(in this case, http://127.0.0.1:5000)

Now, you should see the following screen: 
<img src=https://i.postimg.cc/59nXbVp1/Screenshot-2024-05-30-at-4-27-55-PM.png></img>

# Uploading a File
Click the rainbow `Upload` button to select a file.

The software currently only supports `.csv` file where columns are:
|Name| Description |
|--|--|
| Name | Full name of the student (must be unique)|
|Identifier|(Male/Female/Other) - The algorithm does not consider students identifying as neither Male or Female|
|Year of Graduation|Graduating year (2025/2026/...)|
|Room Preference|The student's preference in room type, separated by semicolons (ex: Single;Double;Triple;)|
|Matched Roommate's Name|Name of matched roommate (does not have to be mutual at this point and could be empty)|
|Dorm Preference|The student's preference in dorm, separated by semicolons (ex: Batch;Taylor;Warham;...;)|
|One Student|Full name of one of the 8 other students a given student requested to be in a dorm with|
|One Student2|Full name of one of the 8 other students a given student requested to be in a dorm with|
|One Student3|Full name of one of the 8 other students a given student requested to be in a dorm with|
|One Student4|Full name of one of the 8 other students a given student requested to be in a dorm with|
|One Student5|Full name of one of the 8 other students a given student requested to be in a dorm with|
|One Student6|Full name of one of the 8 other students a given student requested to be in a dorm with|
|One Student7|Full name of one of the 8 other students a given student requested to be in a dorm with|
|One Student8|Full name of one of the 8 other students a given student requested to be in a dorm with|
|Gender|Gender that student identifies with most (Male/Female/Non-Binary/Self-Identifying)|

* These columns are strictly required, and the algorithm does not function if any of these columns are incorrectly formatted or nonexistent.
* Other columns may be present, but does not impact the algorithm at all.

# Using the Software
Properly uploading the file will redirect to a page with initialized Dorm configurations.      Student names can be dragged into other dorms.  Once changes are made, the configuration can be downloaded into a file format through the download icon on the bottom left. 

# Warnings
* The Matched Roommate does not imply that the two students should be placed in a double--it only indicates that they mutually put each other as their "matched roommates" in the survey
* The algorithm currently often places too many students in a dorm (so some dorms exceed capacity). Make sure to double-check.
* For students identifying neither with Male nor Female, they may indicate so in the survey (and may be part of the input .csv). However, they will show up in both "Male" and "Female" sections of the interface, and they may be placed in different dorms under each category. The "optimal" configuration for these students will be shown in the "All" category. 



 
