from flask import Flask, request, send_from_directory
from flask_cors import CORS, cross_origin
import pandas as pd
from pandas import json_normalize
import json
import pulp
import os
import random
import sys
import pathlib


random.seed(1)


app = Flask(__name__, static_folder="client/build")
CORS(app, resources={r"/*": {"origins": ["*"]}})
app.config["CORS_HEADERS"] = "Content-Type"


@app.route("/", defaults={"path": ""})
@app.route("/<path:path>")
@cross_origin()
def serve(path):
    if path != "" and os.path.exists(app.static_folder + "/" + path):
        return send_from_directory(app.static_folder, path)
    else:
        return send_from_directory(app.static_folder, "index.html")


@cross_origin()
@app.route("/api/get_data", methods=["POST", "GET"])
def get_data_Male():
    # data = request.get_json()
    # df = json_normalize(data['data']['selectedFile'])
    # df_dorms = json_normalize(data['data']['dorms'])
    # df_dormdata = json_normalize(data['data']['dormdata'])
    # df['primarydorm'] = df['Dorm'].str.split(';').str[0].str.strip()
    # df = df[df['primarydorm'] != 'All Gender Housing']
    # NUM_STUDENTS = len(df)

    # DORMS = [row['dormname'] for index, row in df_dormdata.iterrows() if row['gender'] == "Male" and row['dormname'] != "All Gender Housing"]
    # DORM_CAPACITY = {row['dormname']: row['totalStudents'] for index, row in df_dormdata.iterrows() if row['dormname'] in DORMS}

    # df['Podmates'] = df['Podmates'].apply(lambda x: [name.strip() for name in x.split(';') if name.strip()])

    # matched_rms = []
    # for index, row in df.iterrows():
    #     if row['Matched_Roommate'].strip() != '':
    #         potential_roommates = df[df['Name'] == row['Matched_Roommate'].strip()]
    #         for _, potential_roommate_row in potential_roommates.iterrows():
    #             if potential_roommate_row['Matched_Roommate'].strip() == row['Name'].strip():
    #                 pair = [row['Name'].strip(), row['Matched_Roommate'].strip()]
    #                 if pair not in matched_rms and pair[::-1] not in matched_rms:
    #                     matched_rms.append(pair)
    # # print(df_dorms['Taylor'][0])
    # cur_satisfaction = 0
    # assignments = {}
    # for dorm in df_dorms.keys():
    #         assignments[dorm] = df_dorms[dorm][0]
    # # for index, row in df.iterrows():
    # #     if

    # assignments_dict = {}
    # # print('max clemens' in df_dorms['Carter'])
    # for index, row in df_dorms.iterrows():
    #     for i in row.keys():
    #         for j in row[i]:
    #             if ('&' in j):
    #                 name1 = j.split(' & ')[0]
    #                 name2 = j.split(' & ')[1]
    #                 assignments_dict[name1] = i
    #                 assignments_dict[name2] = i
    #             else:
    #                 assignments_dict[j]=i

    # # # Define a list to hold our calculations
    # students_satisfaction = []
    # cur_satisfaction = 0
    # # Iterate over each student in the dataframe
    # for index, row in df.iterrows():
    #     student_name = row['Name']
    #     preferred_dorm = row['Dorm']
    #     assigned_dorm = assignments_dict.get(student_name)
    #     preferred_roommates = row['Podmates']

    #     # Calculate satisfaction based on the dorm assignment
    #     dorm_satisfaction = 2 if assigned_dorm == preferred_dorm else 0

    #     # Count matched podmates
    #     podmates_matched = sum(1 for roommate in preferred_roommates if assignments_dict.get(' '.join(roommate.strip().split(', ')[::-1])) == assigned_dorm)

    #     # Total satisfaction score
    #     total_satisfaction = dorm_satisfaction + podmates_matched
    #     cur_satisfaction += total_satisfaction
    #     # Append the calculations
    #     students_satisfaction.append({
    #         'Student Name': student_name,
    #         'Satisfaction Score': total_satisfaction,
    #         'Podmates Assigned': podmates_matched,
    #         'In Preferred Dorm': assigned_dorm == preferred_dorm
    #     })

    # # Create a DataFrame from the list
    # satisfaction_df = pd.DataFrame(students_satisfaction)

    # # Sort by the least satisfied students
    # satisfaction_df_sorted = satisfaction_df.sort_values(by='Satisfaction Score').reset_index(drop=True)

    # # Display the sorted DataFrame

    return {"cur_satisfaction": 0, "satisfaction_df": {}}

@cross_origin()
@app.route("/api/update_dormdata", methods=["POST", "GET"])
def update_dormdata():
    data = request.get_json()
    with open(str(pathlib.Path(__file__).parent.resolve()) + '/dormdata.json', "w") as outfile: 
        json.dump(data["editedInfo"], outfile)
    return ({})

@cross_origin()
@app.route("/api/get_dormdata", methods=["POST", "GET"])
def get_dormdata():
    # print(pathlib.Path(__file__).parent.resolve())
    # print(os.path.abspath(__file__))

    # files = [f for f in os.listdir('.') ]
    # for f in files:
    #     print(f)
    f = open(str(pathlib.Path(__file__).parent.resolve()) + '/dormdata.json')
    dormdata = json.load(f)
    return (dormdata)


@cross_origin()
@app.route("/api/get_matched_roommates", methods=["POST", "GET"])
def get_matched_roommates():
    data = request.get_json()
    df = json_normalize(data["data"]["selectedFile"])
    matched_rms = []
    for index, row in df.iterrows():
        if row["Matched_Roommate"].strip() != "":
            potential_roommates = df.loc[df["Name"] == row["Matched_Roommate"]]
            for _, potential_roommate_row in potential_roommates.iterrows():
                if potential_roommate_row["Matched_Roommate"] == row["Name"]:
                    pair = [row["Name"], row["Matched_Roommate"]]
                    if pair not in matched_rms and pair[::-1] not in matched_rms:
                        matched_rms += [pair]

    return {"matched_rms": matched_rms}


@cross_origin()
@app.route("/api/get_config_All", methods=["POST", "GET"])
def get_config_All():
    data = request.get_json()
    df = json_normalize(data["data"]["selectedFile"])

    df_dormdata = json_normalize(data["data"]["dormdata"])
    print(df_dormdata)
    df_dormdata.columns = [
        "Dorm_Name",
        "Singles",
        "Doubles",
        "Total_Students",
        "Gender",
        "Grade",
    ]
    class_to_grade = {"2025": 12, "2026": 11, "2027": 10, "2028": 9}
    # df = df = df[df['Gender'].isin(['Male', 'Female'])]

    df["Podmates"] = df["Podmates"].apply(
        lambda x: [name.strip() for name in x.split(";") if name.strip()]
    )
    df["Dorm_Preferences"] = df["Dorm"].apply(
        lambda x: [
            dorm.strip()
            for dorm in x.split(";")
            if dorm.strip()
            and (
                dorm.strip() in df_dormdata["Dorm_Name"].to_numpy()
                or "Prefect" in x.split(";")[0]
            )
        ]
    )
    students = df.to_dict("records")
    dorm_capacity = {
        dorm[1]["Dorm_Name"]: dorm[1]["Total_Students"]
        for dorm in df_dormdata.iterrows()
    }
    dorm_gender = {
        dorm[1]["Dorm_Name"]: dorm[1]["Gender"] for dorm in df_dormdata.iterrows()
    }
    dorm_preferences = {}
    for student in students:
        if student["Gender"] in ["Male", "Female"]:
            if "Prefect" in student["Dorm_Preferences"][0]:
                dorm_preferences[student["Name"]] = [student["Dorm_Preferences"][0]]
            else:
                dorm_preferences[student["Name"]] = [
                    dorm
                    for dorm in student["Dorm_Preferences"]
                    if dorm_gender[dorm] == student["Gender"] and "Prefect" not in dorm
                ]
        else:
            dorm_preferences[student["Name"]] = ["New Dorm"]
    matched_rms = []
    is_matched_rm = []
    for index, row in df.iterrows():
        if row["Matched_Roommate"].strip() != "":
            potential_roommates = df[df["Name"] == row["Matched_Roommate"].strip()]
            for _, potential_roommate_row in potential_roommates.iterrows():
                if (
                    potential_roommate_row["Matched_Roommate"].strip()
                    == row["Name"].strip()
                ):
                    pair = [row["Name"].strip(), row["Matched_Roommate"].strip()]
                    if pair not in matched_rms and pair[::-1] not in matched_rms:
                        matched_rms.append(pair)
                        is_matched_rm.append(pair[0])
                        is_matched_rm.append(pair[1])

    population_size = 100
    generations = 100
    mutation_rate = 0.1

    def create_individual():
        assignments = {}
        dorm_counts = {dorm: 0 for dorm in dorm_capacity}
        cnt = 0
        for student in students:
            if student["Gender"] in ["Male", "Female"]:
                if "Prefect" in student["Dorm_Preferences"][0]:
                    valid_dorms = [student["Dorm_Preferences"][0].split(" ")[0]]
                else:
                    valid_dorms = [
                        dorm
                        for dorm in student["Dorm_Preferences"]
                        if dorm_gender[dorm] == student["Gender"]
                        and dorm_counts[dorm] < dorm_capacity[dorm]
                    ]
                    for i in matched_rms:
                        if student["Name"] == i[0]:
                            if i[1] in assignments.keys():
                                valid_dorms = [assignments[i[1]]]
                        elif student["Name"] == i[1]:
                            if i[0] in assignments.keys():
                                valid_dorms = [assignments[i[0]]]
            else:
                valid_dorms = ["New Dorm"]

            if valid_dorms:
                chosen_dorm = random.choice(valid_dorms)
                assignments[student["Name"]] = chosen_dorm
                dorm_counts[chosen_dorm] += 1
            else:
                print(
                    f"No valid dorms found for {student['Name']} with gender {student['Gender']}. Check data and capacity constraints."
                )
        return assignments

    def calculate_fitness(individual):
        """Calculates fitness based on number of podmates in the same dorm and dorm preferences."""
        score = 0
        for student in students:
            assigned_dorm = individual.get(student["Name"])
            if assigned_dorm:
                # Dorm preference score (higher index, lower preference)
                if assigned_dorm in student["Dorm_Preferences"]:
                    index = student["Dorm_Preferences"].index(assigned_dorm)
                    score += max(0, len(student["Dorm_Preferences"]) - index)

                # Podmate score
                podmates_in_same_dorm = sum(
                    2
                    for pm in student["Podmates"]
                    if individual.get(pm) == assigned_dorm
                )
                score += podmates_in_same_dorm
        return score

    def crossover(parent1, parent2):
        # Ensure both parents have more than one gene to perform a valid crossover
        if len(parent1) > 1 and len(parent2) > 1:
            crossover_point = random.randint(1, min(len(parent1), len(parent2)) - 1)
            child1 = dict(
                list(parent1.items())[:crossover_point]
                + list(parent2.items())[crossover_point:]
            )
            child2 = dict(
                list(parent2.items())[:crossover_point]
                + list(parent1.items())[crossover_point:]
            )
            return child1, child2
        else:
            # If not enough data for crossover, return parents as children
            return parent1.copy(), parent2.copy()

    def mutate(individual):
        """Mutates an individual by randomly changing the dorm assignment of a student."""
        if not individual:  # Check if the individual is empty
            return  # Skip mutation if the individual has no assignments
        if random.random() < mutation_rate:
            all_students = individual.keys()
            mutatable_students = []
            for possible_student in all_students:
                for student in students:
                    if student["Name"] == possible_student:
                        if (
                            student["Gender"] in ["Male", "Female"]
                            and "Prefect" not in student["Dorm_Preferences"][0]
                            and possible_student not in is_matched_rm
                        ):
                            mutatable_students.append(possible_student)
            student_to_mutate = random.choice(mutatable_students)
            possible_dorms = [
                dorm
                for dorm in dorm_capacity
                if dorm_gender[dorm]
                == next(
                    student["Gender"]
                    for student in students
                    if student["Name"] == student_to_mutate
                )
            ]
            for student in students:
                if student["Name"] == student_to_mutate and student["Gender"] not in [
                    "Male",
                    "Female",
                ]:
                    possible_dorms = ["All Gender"]

            new_dorm = random.choice(possible_dorms)
            individual[student_to_mutate] = new_dorm

    def genetic_algorithm():
        population = [create_individual() for _ in range(population_size)]
        for generation in range(generations):
            # Calculate fitness for each individual
            fitness_scores = [
                (individual, calculate_fitness(individual)) for individual in population
            ]
            # Selection - top 50% survive
            survivors = sorted(fitness_scores, key=lambda x: x[1], reverse=True)[
                : population_size // 2
            ]
            # Crossover and mutation to create new population
            new_population = [ind for ind, _ in survivors]  # Keep survivors
            while len(new_population) < population_size:
                parent1, parent2 = random.sample(survivors, 2)
                child1, child2 = crossover(parent1[0], parent2[0])
                mutate(child1)
                mutate(child2)
                new_population.extend([child1, child2])
            population = new_population[
                :population_size
            ]  # Ensure population size stays constant
        # Return the best solution
        best_solution = max(population, key=calculate_fitness)
        return best_solution

    assignments = []
    best_assignment = genetic_algorithm()
    for i in best_assignment.keys():
        assignments.append([i, best_assignment[i], dorm_preferences[i]])
    dorm_counts = {dorm: 0 for dorm in dorm_capacity}
    # for i in assignments:
    #     dorm_counts[i[1]] += 1
    #     if dorm_counts[i[1]] > dorm_capacity[i[1]]:
    #         print("fdfdasfdasfasd")

    return {"assignments": assignments, "max_satisfaction": 0}


if __name__ == "__main__":
    app.run(debug=True)
