import React, { useState, useEffect, useRef } from 'react';
import { DndContext, useSensors, useSensor, PointerSensor} from '@dnd-kit/core';
import { Dorm } from './Dorm';
import { Student } from './Student';
import './App.css';
import Papa from 'papaparse';
import axios from 'axios';
import Settings from './Settings';
import DropdownExampleSelection from './dropdownexample';
import 'react-awesome-button/dist/styles.css';
import HashLoader from 'react-spinners/HashLoader';
import fs from '@zenfs/core';
import {stringify} from 'flatted';
import { saveAs } from 'file-saver';
import { GooeyCircleLoader } from 'react-loaders-kit';
import {
  AwesomeButton,
  AwesomeButtonProgress,
  AwesomeButtonSocial,
} from 'react-awesome-button';
import toast, { Toaster } from 'react-hot-toast';
import { MuiFileInput } from 'mui-file-input'
import {MR} from './MR'
import Radio from '@mui/material/Radio';
import RadioGroup from '@mui/material/RadioGroup';
import FormControlLabel from '@mui/material/FormControlLabel';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import DownloadIcon from '@mui/icons-material/Download';


const dormColors = {
  "Kravis": "#FFB3BA",
  "Carter": "#FFDFB3",
  "Harman": "#FFFFB3",
  "Batchelder": "#B3FFB3",
  "Warham": "#77DD77",
  "Taylor": "#D9EDF8",
  "Richmond": "#FFB3BA",
  "Flagg": "#FFDFB3",
  "Cutler": "#FFFFB3",
  "Ammidon": "#B3FFB3",
  "Howe": "#77DD77",
  "Palmer": "#D9EDF8",
  "Longman": "#F6EAC2",
  "New Dorm": "Red"
};
const countStudents = (students) => {
  let count = 0;
  students.forEach(student => {
    if (student instanceof MR) {
      count += 2; // each matched roommate is considered as 2
    } else {
      count += 1;
    }
  });
  return count;
};
const dormLists = ["Male", "Female"]

function App() {
  const inputRef1 = useRef();
  const inputRef2 = useRef();
  const inputRef3 = useRef();
  const [maxSatisfaction, setMaxSatisfaction] = useState(0);
  const [curSatisfaction, setCurSatisfaction] = useState(0);
  const [matchedRoomates, setMatchedRoomates] = useState(null)
  const [curGender, setCurGender] = useState("All")
  const [selectedFile, setSelectedFile] = useState(null);
  const [dormsData, setDormsData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [alert, setAlert] = useState(false);
  const [dorms, setDorms] = useState(null);
  const [selectedOption, setSelectedOption] = useState("Upperclassmen Boys");
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [savedConfigurations, setSavedConfigurations] = useState(dormLists);
  const [sourceDorm, setSourceDorm] = useState(null);
  const [zoomedDorm, setZoomedDorm] = useState(null);
  const [hoveredPodmates, setHoveredPodmates] = useState([]);
  const [activeStudent, setActiveStudent] = useState('');
  const [matchedRoommate, setMatchedRoommate] = useState("");
  const [allConfig, setAllConifig] = useState({});
  const [isDormsLoaded, setIsDormsLoaded] = useState(false);
  const [dormdata, setDormdata] = useState({});

  useEffect(() => { 
    axios.get('http://127.0.0.1:5000/api/get_dormdata').then(response => {
      const rdata = response.data;
      console.log(rdata);
      setDormdata(rdata);
    })
  },[])

  const handleGenderChange = (event) => {
    console.log(event.target.value)
    let gender = event.target.value;
    setCurGender(event.target.value);
      if (gender == "All") setDorms(allConfig);
      if (gender == "Male"){
        let tmp = {}
        Object.keys(allConfig).map(dormName => {
          if (dormdata[dormName].Gender == "Male"){
            tmp[dormName] = allConfig[dormName]
          }
          })
          setDorms(tmp);
          console.log(tmp)
      }
      if (gender == "Female"){
        let tmp = {}
        Object.keys(allConfig).map(dormName => {
          if (dormdata[dormName].Gender == "Female"){
            tmp[dormName] = allConfig[dormName]
          }
          })
          setDorms(tmp);
      }
  };

  const handleStudentHover = (student) => {
    const studentDorm = Object.entries(dorms).find(([_, students]) =>
    students.some(s => s.name === student.name)
  )[0];
  

  // Sort podmates based on their dorm, prioritizing the same dorm as the hovered student
  const sortedPodmates = student.podmates
  // .sort((a, b) => {
  //   const aDorm = Object.entries(dorms).find(([_, students]) =>
  //     students.some(s => s.name === a.name)
  //   )[0];
  //   const bDorm = Object.entries(dorms).find(([_, students]) =>
  //     students.some(s => s.name === b.name)
  //   )[0];

  //   if (aDorm === studentDorm && bDorm !== studentDorm) {
  //     return -1;
  //   } else if (aDorm !== studentDorm && bDorm === studentDorm) {
  //     return 1;
  //   } else {
  //     return aDorm.localeCompare(bDorm);
  //   }
  // }).map(p => p.name);
  setMatchedRoommate(student.matchedRoommate)
  setHoveredPodmates(sortedPodmates);
  setActiveStudent(student);
  console.log(student)
  };
  
  const handleStudentHoverEnd = () => {
    setHoveredPodmates([]);
  };
  const toastId = React.useRef(null);

  

  const initialPositions = {};
  Object.keys(dormLists).forEach(group => {
    Object.keys(dormLists[group]).forEach(dormName => {
      initialPositions[dormName] = { x: 1000, y: 0 };
    });
  });

  const [dormPositions, setDormPositions] = useState(initialPositions);

    const [hoveredStudent, setHoveredStudent] = useState(null);
  const [podmatesHighlight, setPodmatesHighlight] = useState([]);

  useEffect(() => {
    if (hoveredStudent) {
      const hoveredStudentData = Object.values(dorms).flat().find(student => student.name === hoveredStudent);
      if (hoveredStudentData) {
        setPodmatesHighlight(hoveredStudentData.podmates);
      }
    } else {
      setPodmatesHighlight([]);
    }
  }, []);



  useEffect(()=> {
    if (!selectedFile) return;
    
      const data = {
        selectedFile: selectedFile
      };
      console.log(selectedFile)
  
      
      axios.post('http://127.0.0.1:5000/api/get_matched_roommates', {data}).then(response => {
        const rdata = response.data;
        console.log("called")
        console.log(rdata.matched_rms)
        setMatchedRoomates(rdata.matched_rms);
      })
    },[selectedFile]);
    

  

 useEffect(() => {
  if (!dorms) return;
  const dormArray = Object.keys(dormdata).map(dormName => {
    return {
        dormname: dormName,
        singles: dormdata[dormName].Singles,
        doubles: dormdata[dormName].Doubles,
        totalStudents: dormdata[dormName]['Total Students'],
        gender: dormdata[dormName].Gender,
        grade: dormdata[dormName].Grade
    };
});
  // console.log(selectedFile)
  // console.log(dorms)
  // const dataDorm = 
  const data = {
    selectedFile: selectedFile,
    dorms: dormsData,
    dormdata: dormArray
  };
  console.log(dormsData)
  console.log(dorms)
  // console.log(typeof(data))
  
  axios.post('http://127.0.0.1:5000/api/get_data', {data}).then(response => {
    const rdata = response.data;
    console.log(rdata)
    setCurSatisfaction(rdata.cur_satisfaction); //
  })
}, [selectedFile, dorms]);

  useEffect(() => {
    
    if (!selectedFile) return;
    if (!matchedRoomates) return;
    const dormArray = Object.keys(dormdata).map(dormName => {
      return {
          dormname: dormName,
          singles: dormdata[dormName].Singles,
          doubles: dormdata[dormName].Doubles,
          totalStudents: dormdata[dormName]['Total Students'],
          gender: dormdata[dormName].Gender,
          grade: dormdata[dormName].Grade
      };
  });
    const data = {
      selectedFile: selectedFile,
      dormdata: dormArray
    };
    console.log(selectedFile)
    setIsLoading(true);
    axios.post(`http://127.0.0.1:5000/api/get_config_All`, {data})
      .then(response => {
        const dataFromApi = response.data;
        console.log(dataFromApi)
        console.log(isLoading)
        console.log(`${curGender} called`)
        
        setMaxSatisfaction(dataFromApi.max_satisfaction); 
        const allStudents = {}
        const studentMap = {};
        const loadedDorms = {};
        dataFromApi.assignments.forEach((studentData, index) => {
          const fullName = studentData[0].trim();
          const studentObj = new Student(fullName, index);

          allStudents[fullName] = studentObj
        });
        selectedFile.forEach(studentData => {
          const fullName = studentData['Name'].trim();
          const studentObj = allStudents[fullName];
          if (studentObj) {
            console.log(studentData.Class)
            studentObj.grade = studentData.Class
            const podmatesNames = studentData.Podmates.split(";").map(name => name.trim()).filter(name => name);
            const podmates = podmatesNames.map(name => {
              const sname = name.split(',').map(part => part.trim());

              return allStudents[sname]; // Reverse name order to match map keys
            }).filter(podmate => podmate); // Filter out undefined entries
            console.log(podmates)
            allStudents[fullName].podmates = podmates;
          
          }
        });
        console.log(allStudents)
        // First pass: Create student objects from API data and assign to dorms
        dataFromApi.assignments.forEach((studentData, index) => {
          const fullName = studentData[0].trim();
          let isMatchedRoomate = matchedRoomates.some(mr => mr[0]==fullName || mr[1]==fullName );
          console.log(studentData)
          const studentObj = allStudents[fullName];
          studentObj.dormPreferences = studentData[2];
          studentMap[fullName] = studentObj;
          if (isMatchedRoomate) {
              const [name1, name2] = matchedRoomates.find(mr => mr[0]==fullName|| mr[1]==fullName);
              if (name1 == fullName){
                studentObj.matchedRoommate = name2;
              }
              if (name2 == fullName){
                studentObj.matchedRoommate = name1;
              }
          }
            
      
          const dormName = studentData[1].trim();
          if (!loadedDorms[dormName]) loadedDorms[dormName] = [];
          loadedDorms[dormName].push(studentObj);
            
          } 
        );
  

        Object.keys(loadedDorms).forEach(dorm => {
              loadedDorms[dorm].sort((a, b) => a.lastName.localeCompare(b.lastName));
        });
        

        // Set the processed data to state
        setDorms(loadedDorms);
        setAllConifig(loadedDorms);
        setDormsData(extractNamesFromDorms(loadedDorms));
        console.log("Dorms set with podmates:", loadedDorms);
        setIsLoading(false);

        // onSaveFile(loadedDorms);

  
      })


  
  }, [matchedRoomates]);


  const extractNamesFromDorms = (dorms) => {
    const namesData = {};
    for (const [dormName, students] of Object.entries(dorms)) {
      namesData[dormName] = students.map(student => student.name);
    }
    console.log(namesData)
    return namesData;
  };
  

  
  
  


  const handleDragEnd = (event) => {
    const { active, over } = event;
  
    // Handling for dragging a dorm
    if (active.type === 'DORM') {
      const dormName = active.id.replace('dorm-', '');
      // Assuming dorms shouldn't overlap, we won't adjust their positions here
      return;
    }
    

    // Handle dragging a student to a dorm
    if (over) {
      const sourceDormName = Object.keys(dorms).find(dorm => 
          dorms[dorm] && dorms[dorm].find(student => student.id === active.id)
      );
      if (sourceDormName && sourceDormName !== over.id) {
        const sourceStudent = dorms[sourceDormName].find(student => student.id === active.id);
        const newSourceDorm = dorms[sourceDormName].filter(student => student.id !== active.id);
        const newTargetDorm = [...dorms[over.id], sourceStudent];
        console.log(`from ${newSourceDorm} to ${newTargetDorm}`);

        const newDorms = {
          ...dorms,
          [sourceDormName]: newSourceDorm,
          [over.id]: newTargetDorm,
      };
      setDorms(newDorms);
      setDormsData(extractNamesFromDorms(newDorms));
      console.log('dragged')
      }
    }
    setHasUnsavedChanges(true);
  };
  


  const handleSave = () => {
    setSavedConfigurations(prev => ({
      ...prev,
      [selectedOption]: dorms
    }));
    setHasUnsavedChanges(false);
    alert("Changes saved");
  };

  const handleOnChange = (event) => {
    console.log("onchange called")
    if (event.target.files && event.target.files[0]) {
      setIsLoading(true);
      const file = event.target.files[0];
  
      Papa.parse(file, {
        header: true,
        complete: function(results) {
          if (results.data) {
            // Transform CSV data to the JSON structure expected by the application
          
            console.log(results.data)
            const transformedData = results.data.map(entry => 
              ({
              
              Name: entry["Name"].trim(),
              Room_Type: entry["Room Preference"].trim(),
              Podmates: entry["One Student"].trim()  + ";" + (entry["One Student2"].trim()) + ";" + (entry["One Student3"].trim()) + ";" +(entry["One Student4"].trim()) + ";" +(entry["One Student5"].trim()) + ";" +(entry["One Student6"].trim()) + ";" +(entry["One Student7"].trim() )+ ";" +(entry["One Student8"].trim() ), 
              Dorm: entry["Dorm Preference"].trim(),
              Class: entry["Year of Graduation"].trim(),
              Matched_Roommate: entry["Matched Roommate's Name"].trim(),
              Gender: entry["Identifier"].trim()
            }));
  
            // Set the transformed JSON data to state
            setSelectedFile(transformedData);
            console.log("Processed data set as selected file:", transformedData);
            // getMatchedRommates();
          }
        },
        skipEmptyLines: true,
        error: function(err, file, inputElem, reason) {
          // handle errors
          console.error('Error parsing CSV:', err, reason);
        },
      });
    }
  };

  const onSaveFile = (variable) => {
    const file = new Blob([JSON.stringify(variable)], { type: 'text/plain;charset=utf-8' });
    saveAs(file, 'saved_file.json');
  };

  const handleOptionChange = (event) => {
    const selected = event.target.value;
    setSelectedOption(selected);

    const newDormConfig = savedConfigurations[selected] || dormLists[selected];
    console.log('fdsafasd')
    setDorms(newDormConfig);

    setHasUnsavedChanges(false);
  };
  const [dormZIndices, setDormZIndices] = useState(() => {
    // Initialize each dorm with a default z-index, e.g., 0
    const initialZIndices = {};
    Object.keys(dormLists).forEach(group => {
      Object.keys(dormLists[group]).forEach(dormName => {
        initialZIndices[dormName] = 0; // Initial z-index set to 0
      });
    });
    return initialZIndices;
  });

  const handleDormClick = (dormName) => {
    console.log("fdads")
    setDormZIndices(prevZIndices => {
      const maxZIndex = Math.max(...Object.values(prevZIndices)) + 1;
      return {
        ...prevZIndices,
        [dormName]: maxZIndex, // Set the clicked dorm's z-index to the new maximum
      };
      
    });

  };
  const [value, setValue] = React.useState(null)

  const handleChange = (newValue) => {
    setValue(newValue)
  }

  const handleDormDrag = (dormName, delta) => {
    setDormPositions(prevPositions => {
      if (!prevPositions[dormName]) {
        prevPositions[dormName] = { x: 0, y: 0 };
      }
      
      return {
        ...prevPositions,
        [dormName]: {
          x: prevPositions[dormName].x + delta.x,
          y: prevPositions[dormName].y + delta.y,
        },
      };
    });
  };

  const onChooseFile = () => {
    inputRef1.current.click();
  };

  const onChooseFile2 = () => {
    inputRef2.current.click();
  };
  const onChooseFile3 = () => {
    inputRef3.current.click();
  };



  const togglealert = (string) => {
    console.log(typeof(string))
    toast.dismiss();
    toast(string, {duration: 500});

  };

  const dismissAll = () => {
  toast.dismiss();
  };
    const getDormColor = (podmateName) => {
    for (const [dormName, students] of Object.entries(dorms)) {
  
      if (students.some(s => s.name === podmateName)) {
        return   dormColors[dormName]; // Default color if not found
      }
      else if (students.some(s => s.name.includes(podmateName))){
        return   dormColors[dormName];
      }
    }
    return '#CCC'; // Default color if not found
  };

  const onUploadSavedFile = (event) => {
    const file = event.target.files[0];
  
    const reader = new FileReader();
  
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target.result);
        // const tmp = 
        // Object.keys(json).map(dorm => 

        // )
        setDorms(json);
        setAllConifig(json); 
        console.log("JSON data loaded and parsed:", json);
      } catch (error) {
        console.error("Error parsing JSON:", error);
      }
    };
  
    reader.onerror = () => {
      console.error("Error reading file:", reader.error);
    };
  
    reader.readAsText(file);
  }
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  )

  const loaderProps = {
    loading: isLoading,
    size: 300,
    duration: 4,
    colors: ['#5e22f0', '#f6b93b']
}


  return (
    <>
  {dorms ?  
//   isLoading ?<div>
// <HashLoader/>
//   </div> :
   <DndContext onDragEnd={handleDragEnd} sensors={sensors}>
      <div className="App">
        <div className="selection-section">
        <FormControl>

      <FormLabel>Gender</FormLabel>
      <RadioGroup value={curGender} onChange={handleGenderChange}>
      <FormControlLabel value="All" control={<Radio />} label="All" />

      <FormControlLabel value="Male" control={<Radio />} label="Male" />
        <FormControlLabel value="Female" control={<Radio />} label="Female" />
        </RadioGroup>
            </FormControl>

 
        </div>

        <Toaster />
        <div style={{ marginLeft: "auto", marginRight: "auto", width: "50vw", height: "fit-content", border: "2px solid black", marginTop: "10px", borderRadius: "5px"}}>
          <div>Overview</div>
          <div>
            {curSatisfaction*100/maxSatisfaction}%
          </div>
          <div style={{display: "grid", gridTemplateColumns: "auto auto auto auto auto auto auto"}}>
          {Object.keys(dormColors).map(dormName => 
            (
              <div style={{backgroundColor: dormColors[dormName], margin: "3px", borderRadius: "10px", cursor: "pointer"}} onClick={()=> handleDormClick(dormName)}>{dormName}</div>
            )
          )}
          </div>
        </div>

        {activeStudent == '' ? null:<div className="student-info" style={{border: `6px solid ${getDormColor(activeStudent.name)}` }}>
            <div><strong>Name:</strong> {activeStudent.name}</div>
          {activeStudent.matchedRoommate.length == 0 ? null : <div><strong>Matched Roommate:</strong><div style={{ background: getDormColor(activeStudent.matchedRoommate)}}>{activeStudent.matchedRoommate}</div></div>}

          <div><strong>Podmates:</strong></div>
    <div style={{display: "grid", gridTemplateColumns: "auto auto",}}>
          {activeStudent.podmates.map((podmate, index) => (
            podmate ? (
              <div key={index} style={{ background: getDormColor(podmate.toString()), borderRadius: "5px", margin: "5px"}}>
                {podmate.toString()} 
              </div>
            ) : null
          ))}
          </div>
          <div><strong>Dorms: </strong>{activeStudent.dormPreferences.join(', ')}</div>
        </div>}

        {/* {hasUnsavedChanges && (
          <button onClick={handleSave} style={{ position: 'absolute', top: '200px', left: '10px' }}>
            Save Changes
          </button>

        )} */}

{dorms ? Object.keys(dorms).map(dormName => (
  <Dorm
    key={dormName}
    dormName={dormName}
    sortedStudents={dorms[dormName] || []}
    color={dormColors[dormName] || "#CCC"}
    position={dormPositions[dormName] || { x: 0, y: 0 }}
    handleDormDrag={handleDormDrag}
    onDormClick={handleDormClick}
    zoomedDorm={zoomedDorm}
    setDorms={setDorms}
    dorms={dorms}
    onHover={handleStudentHover}
    onHoverEnd={handleStudentHoverEnd}
    hoveredPodmates={hoveredPodmates}
    dormColors={dormColors}
    togglealert={togglealert}
    dismissAll={dismissAll}
    zIndex={dormZIndices[dormName]}
    setDormsData={setDormsData}
    extractNamesFromDorms={extractNamesFromDorms}
    studentnumber={countStudents(dorms[dormName])}
    matchedRoommate={matchedRoommate}
    dormdata={dormdata}
  />
)): <></>}
{/* <span class="material-symbols-outlined" style={{position:"absolute", bottom: "-1260px", left: "10px", cursor: "pointer"}}>
add<MuiFileInput style={{position:"absolute", bottom: "-1260px", left: "10px", cursor: "pointer"}} value={value} onChange={handleChange} /></span> */}
<div style={{gridTemplateColumns: "auto", display: "grid", bottom: "10px", left: "10px", position: "absolute"}}>
<input
        type="file"
        ref={inputRef1}
        onChange={handleOnChange}
        style={{ display: "none", cursor: "pointer"}}
      />

      <button className="file-btn" onClick={() => onSaveFile(dorms)} style={{  cursor: "pointer",background: "none", border: "none", transform: "scale(2)"}}>
       <DownloadIcon/>
        </button>
      

</div>




      </div>
    </DndContext> :
     isLoading ? <div style={{marginLeft: "auto", marginRight: "auto", justifyContent: "center", display: "flex", height: "100vh", alignItems: "center"}}>     
      <GooeyCircleLoader  {...loaderProps}/>
      </div>

     :
    <div className="App" style={{backgroundColor: "#eeeeee", display: "grid", alignItems: "end", gridTemplateRows: "60vh 40vh"}}>
              <Toaster />

      <div style={{display: "grid", gridTemplateColumns: "auto", marginLeft: "auto", marginRight: "auto"}}>
      <div style={{marginLeft: "auto", marginRight: "auto", fontFamily: "archivo", fontWeight: 600, fontSize: "70px"}}>Please select a file to upload</div>
      <div>
        <input
        type="file"
        ref={inputRef2}
        onChange={handleOnChange}
        style={{ display: "none", cursor: "pointer"}}
      />

      <AwesomeButton
      style={{height: "70px", width: "200px", margin: "30px", fontSize: "20px"}}
  size="100px"
  type="instagram"
  onPress={onChooseFile2}
>
  Start From Scratch
</AwesomeButton>
<input
        type="file"
        ref={inputRef3}
        onChange={onUploadSavedFile} 
        style={{ display: "none", cursor: "pointer"}}
      />

      {/* Button to trigger the file input dialog */}
      <AwesomeButton
      style={{height: "70px", width: "200px", margin: "30px", fontSize: "20px"}}
  size="100px"
  type="instagram"
  onPress={onChooseFile3}
>
  Upload Past File
</AwesomeButton>
      </div>
      </div>
      <div style={{display: "flex", marginLeft: "auto", marginRight: "auto", alignItems: ""}}>{dormdata ? <Settings dormdata={dormdata} setDormdata={setDormdata}/> : <></>}</div>

    </div>
  }
  </>
  );
}

export default App;