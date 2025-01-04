import React, { useState, useEffect, useRef } from 'react';
import { Dropdown } from 'semantic-ui-react';
import Box from '@mui/material/Box';
import FormControl from '@mui/material/FormControl';
import FormGroup from '@mui/material/FormGroup';
import FormLabel from '@mui/material/FormLabel';
import FormControlLabel from '@mui/material/FormControlLabel';
import Checkbox from '@mui/material/Checkbox';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import { saveAs } from 'file-saver';
import fs from '@zenfs/core';
import 'semantic-ui-css/semantic.min.css'
import axios from 'axios';
import toast, { Toaster } from 'react-hot-toast';


export default function Settings({dormdata, setDormdata}) {
    const [dormInfo, setDormInfo] = useState({});
    const [editedInfo, setEditedInfo] = useState();
    const [selectedDorm, setSelectedDorm] = useState(null);
    console.log(dormdata)
    useEffect(() => { 
        setEditedInfo(dormdata)
        console.log("fda")

      }, [dormdata])


    const dormOptions = Object.keys(dormdata).map(dorm => ({
        key: dorm,
        text: dorm,
        value: dorm
    }));

    const handleDormSelection = (event, data) => {
        console.log(data)
        setSelectedDorm(data.value);
    };

    const handleGenderChange = (event) => {
        console.log(dormdata)
        setEditedInfo(prev => ({
            ...prev,
            [selectedDorm]: {
                ...prev[selectedDorm],
                Gender: event.target.value,
            },
        }));
    };

    const handleGradeChange = (grade, checked) => {
        setEditedInfo(prev => {
            const currentGrades = new Set(prev[selectedDorm].Grade);
            if (checked) {
                currentGrades.add(grade);
            } else {
                currentGrades.delete(grade);
            }
            return {
                ...prev,
                [selectedDorm]: {
                    ...prev[selectedDorm],
                    Grade: Array.from(currentGrades),
                },
            };
        });
    };

    // let navigate = useNavigate(); 

    const handleSave = () => {
        console.log(editedInfo)
        axios.post('http://127.0.0.1:5000/api/update_dormdata', {editedInfo}).then(response => {
          toast("Success!", {duration: 1000})
          console.log("fda")
        })
        setDormdata(editedInfo)
        // setDormInfo(editedInfo);
        // const file = new Blob([JSON.stringify(editedInfo)], { type: 'text/plain;charset=utf-8' });
        // fs.writeFileSync('/test.txt', 'HI, I can do this in any JS environment (including browsers)!');
        // const contents = fs.readFileSync('/test.txt', 'utf-8');
        // console.log(contents);
        // // fs.readdirSync('/', (err, files) => {
        // //     console.log(files)
        // //     console.log("f")
        // //     files.forEach(file => {
        // //       console.log(file);
        // //     });
        // //   });
        // saveAs(file, 'dorm_data.json');
    };

    const handleCancel = () => {
        setSelectedDorm(null); 

        // navigate('../');
    };

    return (
        <div style={{ padding: "10px", backgroundColor: "white", borderRadius: "5px", fontWeight: "500", border: "2px solid black", width: "40vw" }}>
            <div style={{ display: "flex", marginBottom: "10px"}}>Settings</div>
            <Dropdown
                placeholder='Select Dorm'
                fluid
                selection
                options={dormOptions}
                onChange={handleDormSelection}
                
            />
            {selectedDorm && (
                        Object.keys(editedInfo).length!=0 ? 
                            <div>
        {console.log("Rendering with editedInfo:", editedInfo)}

                        <div style={{display: "grid", gridTemplateColumns: "auto auto"}}>
                        <Box sx={{ paddingTop: "20px" }}>
                            <FormControl component="fieldset">
                            <FormLabel id="gender-label" style={{}}>Gender</FormLabel>

                                <RadioGroup
                                row
                                    aria-label="gender"
                                    name="gender1"
                                    value={editedInfo[selectedDorm].Gender}
                                    onChange={handleGenderChange}
                                >
                                    <FormControlLabel value="Male" control={<Radio />} label="Male" />
                                    <FormControlLabel value="Female" control={<Radio />} label="Female" />
                                    <FormControlLabel value="Non-Binary" control={<Radio />} label="Non-Binary" />
                                </RadioGroup>
                            </FormControl>
                            </Box>
                            <div style={{paddingTop: "20px", display: "grid", alignItems: "center"}}>Grade Levels
                                <FormGroup sx={{marginLeft: "auto", marginRight: "auto"}}row>
                                    {[9, 10, 11, 12].map(grade => (
                                        <FormControlLabel
                                            key={grade}
                                            control={
                                                <Checkbox
                                                    checked={editedInfo[selectedDorm].Grade.includes(grade)}
                                                    onChange={(event) => handleGradeChange(grade, event.target.checked)}
                                                />
                                            }
                                            label={`${grade}`}
                                        />
                                    ))}
                                </FormGroup>
                            </div>
                            </div>
                            <div style={{margin: "10px"}}>
                            <TextField style={{margin: "10px"}} label="Maximum Capacity" variant="standard" defaultValue={editedInfo[selectedDorm]["Total Students"]} />
                            <TextField style={{margin: "10px"}} label="Number of Singles" variant="standard" defaultValue={editedInfo[selectedDorm].Singles}  />
                            <TextField style={{margin: "10px"}} label="Number of Doubles" variant="standard" defaultValue={editedInfo[selectedDorm].Doubles} />
                        </div>
                            </div>
                        : <></>
                    
            )}
            <Button variant="outlined" onClick={handleSave} style={{ margin: '10px' }}>Save</Button>
            <Button variant="outlined" onClick={handleCancel} style={{ margin: '10px' }}>Cancel</Button>
        </div>
    );
}
