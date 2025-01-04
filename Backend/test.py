import json

file_path = '././students.json'
with open(file_path, 'r') as file:
    data = json.load(file)

print(data)