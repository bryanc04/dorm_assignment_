from flask import Flask, send_from_directory, request
from flask_cors import CORS, cross_origin
import pandas as pd
from pandas import json_normalize
import json
import pulp
import os
import sys

app = Flask(__name__)

# # Determine the base directory depending on whether the app is frozen (packaged)
# if getattr(sys, 'frozen', False):
#     # If the app is run as a bundle, the PyInstaller bootloader
#     # sets the sys._MEIPASS attribute to the path where the bundled app is unpacked
#     application_path = sys._MEIPASS
# else:
#     # If running live, just use the current directory
#     application_path = os.path.dirname(os.path.abspath(__file__))

# # Set the static folder path
# app.static_folder = os.path.join(application_path, 'client/build')

# @cross_origin()
# @app.route("/")
# def connect():
#     print("hi")
#     return("hi")

# @app.route('/<path:path>')
# def serve(path):
#     full_path = os.path.join(app.static_folder, path)
#     if os.path.exists(full_path):
#         return send_from_directory(app.static_folder, path)
#     else:
#         # If no specific path is found, serve index.html
#         return send_from_directory(app.static_folder, 'index.html')


@cross_origin()
@app.route("/api/get_data", methods=["POST", "GET"])
def get_data():
    data = request.get_json()
    df = json_normalize(data['data']['selectedFile'])
    df_dorms = json_normalize(data['data']['dorms'])
    df_dormdata = json_normalize(data['data']['dormdata'])
    df['primarydorm'] = df['Dorm'].str.split(';').str[0].str.strip()
    df = df[df['primarydorm'] != 'All Gender Housing']
    NUM_STUDENTS = len(df)
    print(df_dormdata)

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
    print('fdsafasfas')
    # print(df_dorms['Taylor'][0])
    cur_satisfaction = 0
    assignments = {}
    for dorm in DORMS:
            assignments[dorm] = df_dorms[dorm][0]
    # for index, row in df.iterrows():
    #     if 
        
    assignments_dict = {}
    # print('max clemens' in df_dorms['Carter'])
    for index, row in df_dorms.iterrows():
        for i in row.keys():
            for j in row[i]:
                if ('&' in j):
                    name1 = j.split(' & ')[0]
                    name2 = j.split(' & ')[1]
                    assignments_dict[name1] = i
                    assignments_dict[name2] = i
                else:
                    assignments_dict[j]=i
    
    print(assignments_dict)
    # # Define a list to hold our calculations
    students_satisfaction = []
    cur_satisfaction = 0
    # Iterate over each student in the dataframe
    for index, row in df.iterrows():
        student_name = row['Name']
        preferred_dorm = row['Dorm']
        assigned_dorm = assignments_dict.get(student_name)
        preferred_roommates = row['Podmates']
        
        # Calculate satisfaction based on the dorm assignment
        dorm_satisfaction = 2 if assigned_dorm == preferred_dorm else 0
        
        # Count matched podmates
        podmates_matched = sum(1 for roommate in preferred_roommates if assignments_dict.get(' '.join(roommate.strip().split(', ')[::-1])) == assigned_dorm)
        
        # Total satisfaction score
        total_satisfaction = dorm_satisfaction + podmates_matched
        cur_satisfaction += total_satisfaction
        # Append the calculations
        students_satisfaction.append({
            'Student Name': student_name,
            'Satisfaction Score': total_satisfaction,
            'Podmates Assigned': podmates_matched,
            'In Preferred Dorm': assigned_dorm == preferred_dorm
        })

    # Create a DataFrame from the list
    satisfaction_df = pd.DataFrame(students_satisfaction)

    # Sort by the least satisfied students
    satisfaction_df_sorted = satisfaction_df.sort_values(by='Satisfaction Score').reset_index(drop=True)

    # Display the sorted DataFrame

    return ({'cur_satisfaction': cur_satisfaction, 'satisfaction_df': satisfaction_df_sorted.to_dict() })

@cross_origin()
@app.route("/api/get_config", methods=["POST", "GET"])
def get_config():
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
                        sum(x[i, j] * 100*(df.loc[k, 'Podmates'].count(df.loc[i, 'Name']) > 0)
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
    else:
        print("No Valid Solution Found")

    optimal_assignments_dict = {name: dorm for name, dorm in assignments}
    print(optimal_assignments_dict)

    # Define a list to hold our calculations
    students_satisfaction = []
    max_satisfaction = 0
    # Iterate over each student in the dataframe
    for index, row in df.iterrows():
        student_name = row['Name']
        preferred_dorm = row['Dorm']
        assigned_dorm = optimal_assignments_dict.get(student_name)
        preferred_roommates = row['Podmates']
        
        # Calculate satisfaction based on the dorm assignment
        dorm_satisfaction = 2 if assigned_dorm == preferred_dorm else 0
        
        # Count matched podmates
        podmates_matched = sum(1 for roommate in preferred_roommates if optimal_assignments_dict.get(' '.join(roommate.strip().split(', ')[::-1])) == assigned_dorm)
        
        # Total satisfaction score
        total_satisfaction = dorm_satisfaction + podmates_matched
        max_satisfaction += total_satisfaction
        # Append the calculations
        students_satisfaction.append({
            'Student Name': student_name,
            'Satisfaction Score': total_satisfaction,
            'Podmates Assigned': podmates_matched,
            'In Preferred Dorm': assigned_dorm == preferred_dorm
        })
    return ({'assignments': assignments, 'max_satisfaction': max_satisfaction})


@cross_origin()
@app.route("/api/get_matched_roommates", methods=["POST", "GET"])
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

@app.route('/hi')
def hi():
    print("hi")
    return("hi")

if __name__=="__main__":
    app.run(use_reloader=True, port=5000, threaded=True)
