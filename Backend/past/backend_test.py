from flask import Flask, request, send_from_directory
from flask_cors import CORS, cross_origin
import pandas as pd
from pandas import json_normalize
import json
import pulp
import os


app = Flask(__name__, static_folder="client/build")
CORS(app, resources={
    r'/*': {
        'origins': [
            '*'
        ]
    }
})
app.config['CORS_HEADERS'] = 'Content-Type'

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
@cross_origin()
def serve(path):
    print(path)
    if path != "" and os.path.exists(app.static_folder + '/' + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, 'index.html')



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
        # Define satisfaction score dictionaries
    df_dormdata.columns = ['Dorm_Name', 'Singles', 'Doubles', 'Total_Students', 'Gender', 'Grade']
    class_to_grade = {"2024": 12, "2025": 11, "2026": 10, "2027": 9}

    # Preprocess student data
    df['Podmates'] = df['Podmates'].apply(lambda x: [name.strip() for name in x.split(';') if name.strip()])
    df['Dorm_Preferences'] = df['Dorm'].apply(lambda x: [dorm.strip() for dorm in x.split(';')  if dorm.strip() != 'All Gender Housing' ])

    # Define satisfaction score dictionaries
    dorm_satisfaction_scores = {0: 3, 1: 1, 2: 0}
    podmate_satisfaction_scores = {(0.8, 1.0): 15, (0.6, 0.8): 13, (0.4, 0.6): 10, (0.2, 0.4): 5, (0.0, 0.2): 0}

    def calculate_podmate_score(num_podmates, matched_podmates):
        if num_podmates == 0:
            return 10  # Maximum score if no podmates are listed
        ratio = matched_podmates / num_podmates
        for (low, high), score in podmate_satisfaction_scores.items():
            if low <= ratio <= high:
                return score
        return 0

    # Initialize the problem
    prob = pulp.LpProblem("Dorm_Assignment_Problem", pulp.LpMaximize)


    assignments = pulp.LpVariable.dicts("assignment",
                                        ((s['Name'], d['Dorm_Name']) for _, s in df.iterrows() for _, d in df_dormdata.iterrows() if d["Gender"] == s["Gender"] and class_to_grade[s['Class']] in d['Grade']),
                                        cat='Binary')

    # Pre-compute which students are in which podmates list for efficiency
    podmates_dict = {s['Name']: s['Podmates'] for _, s in df.iterrows()}

    # Adjusted function for podmate satisfaction
    def podmate_satisfaction(name, dorm_name):
        num_podmates = len(podmates_dict[name])
        if num_podmates == 0:
            return 15  # Maximum score if no podmates are listed
        # Calculate matched podmates by summing the assignment variables where podmates are assigned to the same dorm
        matched_podmates = sum(assignments[pm, dorm_name].varValue if assignments[pm, dorm_name].varValue is not None else 0 
                            for pm in podmates_dict[name] if (pm, dorm_name) in assignments)
        return calculate_podmate_score(num_podmates, matched_podmates) 

    prob += pulp.lpSum(
        assignments[s['Name'], d['Dorm_Name']] * (
            dorm_satisfaction_scores.get(s['Dorm_Preferences'].index(d['Dorm_Name']), 0) +  # Handle dorm satisfaction
            podmate_satisfaction(s['Name'], d['Dorm_Name'])  # Calculate podmate satisfaction correctly
        )
        for _, s in df.iterrows() for _, d in df_dormdata.iterrows() if d['Dorm_Name'] in s['Dorm_Preferences'] and d["Gender"] == s["Gender"] and class_to_grade[s['Class']] in d['Grade']
    )

    # Constraints

    # Find mutually matched roommates
    matched_roommates = []
    for index, row in df.iterrows():
        if row['Matched_Roommate'].strip() != '':
            potential_roommates = df[df['Name'] == row['Matched_Roommate'].strip()]
            for _, potential_roommate_row in potential_roommates.iterrows():
                if potential_roommate_row['Matched_Roommate'].strip() == row['Name'].strip():
                    pair = (row['Name'].strip(), row['Matched_Roommate'].strip())
                    matched_roommates.append(pair)

    # Add constraint for matched roommates to be in the same dorm
    for roommate1, roommate2 in matched_roommates:
        for _, dorm_row in df_dormdata.iterrows():
            dorm_name = dorm_row['Dorm_Name']
            if ((roommate1, dorm_name) in assignments.keys() and (roommate2, dorm_name) in assignments.keys()):
                prob += (assignments[roommate1, dorm_name] == assignments[roommate2, dorm_name],
                        f"Matched_Roommates_{roommate1}_{roommate2}_{dorm_name}")
            
    for _, s in df.iterrows():
        prob += pulp.lpSum(assignments[s['Name'], d['Dorm_Name']] for _, d in df_dormdata.iterrows() if d['Dorm_Name'] in s['Dorm_Preferences']and d["Gender"] == s["Gender"] and class_to_grade[s['Class']] in d['Grade']) == 1 

    for _, s in df.iterrows():
        for _, d in df_dormdata.iterrows():
            if d["Gender"]==s["Gender"]:
                if class_to_grade[s['Class']] not in d['Grade'] :
                    if(d["Gender"] == s["Gender"] and class_to_grade[s['Class']] in d['Grade']):
                        print('Fffff')
                        prob += assignments[s['Name'], d['Dorm_Name']] == 0

    for _, d in df_dormdata.iterrows():
        prob += pulp.lpSum(assignments[s['Name'], d['Dorm_Name']] for _, s in df.iterrows() if d['Dorm_Name'] in s['Dorm_Preferences'] and d["Gender"] == s["Gender"] and class_to_grade[s['Class']] in d['Grade']) <= d['Total_Students'] 
        
    for student_name, podmates in podmates_dict.items():
        if len(podmates) >= 4:  # Check if the student has requested at least four podmates
            for _, dorm_row in df_dormdata.iterrows():
                dorm_name = dorm_row['Dorm_Name']
                # Sum of assignments for the podmates to the same dorm
                prob += (pulp.lpSum(assignments[pm, dorm_name] for pm in podmates if (pm, dorm_name) in assignments) >= 1,
                        f"Podmate_constraint_{student_name}_{dorm_name}")
    # Solve the problem
    prob.solve()

    # Extract results and calculate satisfaction scores
    assignments_list = []
    satisfaction_scores = {}
    for (student_name, dorm_name), var in assignments.items():
        if var.varValue == 1:  # Only consider assignments that are made

            if dorm_name in df.loc[df['Name'] == student_name, 'Dorm_Preferences'].values[0]:
                dorm_pref_index = df.loc[df['Name'] == student_name, 'Dorm_Preferences'].values[0].index(dorm_name)
                dorm_score = dorm_satisfaction_scores.get(dorm_pref_index, 0)
            else: 
                dorm_score=0
            pod_score = podmate_satisfaction(student_name, dorm_name)
            total_score = dorm_score + pod_score
            assignments_list.append((student_name, dorm_name))
            satisfaction_scores[student_name] = {'Dorm': dorm_name, 'Total Satisfaction Score': total_score}
    # Define a list to hold our calculations
    students_satisfaction = []
    max_satisfaction = 0
    # Iterate over each student in the dataframe
    # for index, row in df.iterrows():
    #     student_name = row['Name']
    #     preferred_dorm = row['Dorm']
    #     assigned_dorm = optimal_assignments_dict.get(student_name)
    #     preferred_roommates = row['Podmates']
        
    #     # Calculate satisfaction based on the dorm assignment
    #     dorm_satisfaction = 2 if assigned_dorm == preferred_dorm else 0
        
    #     # Count matched podmates
    #     podmates_matched = sum(1 for roommate in preferred_roommates if optimal_assignments_dict.get(' '.join(roommate.strip().split(', ')[::-1])) == assigned_dorm)
        
    #     # Total satisfaction score
    #     total_satisfaction = dorm_satisfaction + podmates_matched
    #     max_satisfaction += total_satisfaction
    #     # Append the calculations
    #     students_satisfaction.append({
    #         'Student Name': student_name,
    #         'Satisfaction Score': total_satisfaction,
    #         'Podmates Assigned': podmates_matched,
    #         'In Preferred Dorm': assigned_dorm == preferred_dorm
    #     })
    print(len(assignments_list))
    return ({'assignments': assignments_list, 'max_satisfaction': max_satisfaction})


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

if __name__=="__main__":
    app.run(debug=True)