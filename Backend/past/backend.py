from flask import Flask, request
from flask_cors import CORS, cross_origin
import pandas as pd
from pandas import json_normalize
import json
import pulp

app = Flask(__name__)
CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'



@cross_origin()
@app.route("/get_data", methods=["POST", "GET"])
def get_data():
    data = request.get_json()
    df = json_normalize(data['data']['selectedFile'])
    df_dormdata = json_normalize(data['data']['dormdata'])
    df['primarydorm'] = df['Dorm'].str.split(';').str[0].str.strip()
    df = df[df['primarydorm'] != 'All Gender Housing']

    DORMS = [row['dormname'] for index, row in df_dormdata.iterrows() if row['gender'] == "Male" and row['dormname'] != "All Gender Housing"]
    DORM_CAPACITY = {row['dormname']: row['totalStudents'] for index, row in df_dormdata.iterrows() if row['dormname'] in DORMS}

    df['Podmates'] = df['Podmates'].apply(lambda x: [name.strip() for name in x.split(';') if name.strip()])
    
    matched_rms = []
    for index, row in df.iterrows():
        if row['Matched_Roommate'].strip() != '':
            potential_roommates = df[df['Name'] == row['Matched_Roommate'].strip()]
            for _, potential_roommate_row in potential_roommates.iterrows():
                if potential_roommate_row['Matched_Roommate'].strip() == row['Name'].strip():
                    pair = [row['Name'].strip(), row['Matched_Roommate'].strip()]
                    if pair not in matched_rms and pair[::-1] not in matched_rms:
                        matched_rms.append(pair)

    model = pulp.LpProblem("Dorm_Assignment_Problem", pulp.LpMaximize)
    x = pulp.LpVariable.dicts("x", ((i, j) for i in df.index for j in DORMS), cat=pulp.LpBinary)

    # Objective Function
    model += pulp.lpSum([x[i, df.loc[i, 'primarydorm']] * 2 +
                        sum(x[i, j] * (df.loc[k, 'Podmates'].count(df.loc[i, 'Name']) > 0)
                            for k in df.index if k != i and j in DORMS)
                        for i in df.index for j in DORMS])

    # Constraints
    for i in df.index:
        model += pulp.lpSum(x[i, j] for j in DORMS) == 1  # Each student must be assigned to one dorm

    for j in DORMS:
        model += pulp.lpSum(x[i, j] for i in df.index) <= DORM_CAPACITY[j]  # Correct reference to each dorm capacity

    # Roommate matching constraints
    for rm_pair in matched_rms:
        index1 = df[df['Name'] == rm_pair[0]].index[0]
        index2 = df[df['Name'] == rm_pair[1]].index[0]
        for j in DORMS:
            model += x[index1, j] == x[index2, j]

    # Solve the model
    status = model.solve()
    if pulp.LpStatus[status] == 'Optimal':
        print("Optimal Solution Found")
        assignments = [(df.loc[i, 'Name'], j) for i in df.index for j in DORMS if pulp.value(x[i, j]) == 1]
        for assignment in assignments:
            print(assignment)
    else:
        print("No Valid Solution Found")
    
    optimal_assignments_dict2 = {}

    optimal_assignments_dict = {name: dorm for name, dorm in assignments}
    for name, dorm in assignments:
        if dorm in optimal_assignments_dict2.keys():
            optimal_assignments_dict2[dorm] += [name]
        else:
            optimal_assignments_dict2[dorm] = []
            optimal_assignments_dict2[dorm] += [name]
    # Define a list to hold our calculations
    students_satisfaction = []
    max_satisfaction = 0
    # Iterate over each student in the dataframe
    for index, row in df.iterrows():
        student_name = row['Name']
        preferred_dorm = row['primarydorm']
        assigned_dorm = optimal_assignments_dict.get(student_name)
        preferred_roommates = row['Podmates']
        
        # Calculate satisfaction based on the dorm assignment
        dorm_satisfaction = calculate_dorm_preference_score(row['Dorm_Preferences'], assigned_dorm)
        
        # Count matched podmates
        podmates_matched = 0
        cnt = 0
        for dormmate in optimal_assignments_dict2[dorm]:
            if dormmate in row['Podmates']:
                cnt+=1

        if cnt== 0:
            podmates_matched = -100000
        elif cnt == 1:
            podmates_matched = -5
        elif cnt ==2:
            podmates_matched = -10
        elif cnt >= 3 and cnt <= 5:
            podmates_matched = 3.5
        else:
            podmates_matched = 4.5
        
        # Total satisfaction score
        total_satisfaction = dorm_satisfaction + podmates_matched
        max_satisfaction += total_satisfaction
        # Append the calculations
        students_satisfaction.append({
            'Student Name': student_name,
            'Satisfaction Score': total_satisfaction,
            'Podmates Assigned': podmates_matched,
            'In Preferred Dorm': assigned_dorm == preferred_dorm,
            'Dorm': optimal_assignments_dict[student_name]
        })
    print(students_satisfaction)
    return ({'assignments': assignments, 'max_satisfaction': max_satisfaction, 'students_satisfaction': students_satisfaction})


@cross_origin()
@app.route("/get_matched_roommates", methods=["POST", "GET"])
def get_matched_roommates():

    data = request.get_json()
    df = json_normalize(data['data']['selectedFile'])
    matched_rms = []
    for index, row in df.iterrows():
        
        if (row['Matched_Roommate'].strip() != ''):
            potential_roommates = df.loc[df['Name'] == row['Matched_Roommate']]
            for _, potential_roommate_row in potential_roommates.iterrows():
                if potential_roommate_row['Matched_Roommate'] == row['Name']:
                    pair = [row['Name'], row['Matched_Roommate']]
                    if pair not in matched_rms and pair[::-1] not in matched_rms:
                        matched_rms += [pair]

    return ({'matched_rms': matched_rms})

if __name__=="__main__":
    app.run(debug=True)