import { StudentComponent } from './Student';
import 'bootstrap-icons/font/bootstrap-icons.css'; // import Bootstrap icons
import { Rnd } from "react-rnd";
import { useEffect, useState } from 'react';
import { Student } from './Student';
import { useDroppable } from '@dnd-kit/core';



export function Dorm({ dormName, sortedStudents, color, onDormClick, zoomedDorm, setDorms, dorms, hoveredPodmates, onHover, onHoverEnd, dormColors,togglealert,dismissAll, zIndex, setDormsData, studentnumber, matchedRoommate,dormdata }) {

  const [dormData, setDormData] = useState(dormdata);
  const [textcolor, setTextColor] = useState("black");
  const [lastClickedStudentId, setLastClickedStudentId] = useState(null); // Initialize with null
  const [textWeight, setTextweight] = useState(200)
  const [activeStudentId, setActiveStudentId] = useState(null);
  const [matchedRoomates, setMatchedRoomates] = useState([])

  


  const [position, setPosition] = useState({
    x: Math.floor(Math.random() * (window.innerWidth - 200)),
    y: Math.floor(Math.random() * (window.innerHeight - 300))
  });
  

  const {
    setNodeRef: studentDropRef,
    isOver,
    isDropAnimating,
  } = useDroppable({
    id: dormName
  });

  useEffect(() => {
    if (isOver && activeStudentId) {
        console.log(`Hovering Student ID: ${activeStudentId}`);
        console.log(studentnumber)
  

        // Find which dorm the student with activeStudentId belongs to
        const sourceDormName = Object.keys(dorms).find(dorm => 
            dorms[dorm] && dorms[dorm].find(student => student.id === activeStudentId)
        );


        if (sourceDormName && dormName !== sourceDormName && 
            dorms[dormName] && !dorms[dormName].some(student => student.id === activeStudentId)) {

            const sourceStudent = dorms[sourceDormName].find(student => student.id === activeStudentId);
            

            const newSourceDorm = dorms[sourceDormName].filter(student => student.id !== activeStudentId);
            const newTargetDorm = [...dorms[dormName], sourceStudent];
              togglealert(`Moved ${sourceStudent.name} from ${sourceDormName} to ${dormName}`);

              const newSourceDormNames = newSourceDorm.map(student => student.name);
              const newTargetDormNames = newTargetDorm.map(student => student.name);
  
              setDorms(prev => ({
                  ...prev,
                  [sourceDormName]: newSourceDorm,
                  [dormName]: newTargetDorm,
              }));
  
              setDormsData(prev => ({
                  ...prev,
                  [sourceDormName]: newSourceDormNames,
                  [dormName]: newTargetDormNames,
              }));
            }
        
    }
}, [isOver, dormName, activeStudentId, dorms, setDorms]);






  const style = {
    borderColor: color,
    background: 'white',
    zIndex: zIndex,
    backgroundColor: "white",
  };


  const handleStudentClick = (clickedStudent) => {
    console.log(sortedStudents);
    if (!lastClickedStudentId && clickedStudent){
      console.log(studentnumber)

      togglealert(`${clickedStudent.name} selected. Click another student to swap positions.`);
      console.log(`${clickedStudent.name} selected. Click another student to swap positions.`);
    }

    if (lastClickedStudentId && lastClickedStudentId !== clickedStudent.id) {
      // Find the indexes of the clicked students
      const index1 = sortedStudents.findIndex(student => student.id === lastClickedStudentId);
      const index2 = sortedStudents.findIndex(student => student.id === clickedStudent.id);
      console.log(index1, index2);

      if (index1 !== -1 && index2 !== -1) {
        // Swap the students in the students array
        const newStudents = [...sortedStudents];
        [newStudents[index1], newStudents[index2]] = [newStudents[index2], newStudents[index1]];
        console.log(newStudents)
        // Update the students in the state
        setDorms(prevDorms => ({
          ...prevDorms,
          [dormName]: newStudents
        }));
        
      }

      setLastClickedStudentId(null); // Reset after swap
      dismissAll("f")
    } else {
      setLastClickedStudentId(clickedStudent.id); // Set this student as the last clicked
    }
  };

  const isZoomed = zoomedDorm === dormName;
  const dormStyle = style;


  const handleDragStop = (e, data) => {
    setPosition({
      x: data.x,
      y: data.y
    });
  };

  useEffect(() => {
    if (studentnumber > dormData[dormName]["Total Students"]){
      console.log(textcolor)
      setTextColor("red");
      setTextweight(800)
    }else{
      setTextColor("black")
      setTextweight(200)
    }

}, [studentnumber]);


  return (
    <>
    {!isZoomed ?
    <div     onClick={() => onDormClick(dormName)} 
    >
    <Rnd
    className="dorm-container"
    style={dormStyle}
    default={{
      x: position.x,
      y: position.y,
      width: 1200,   // set initial width
      height: 500   // set initial height
    }}
    minWidth={600}
    maxWidth={1500}
    minHeight={300}
    onDragStop={handleDragStop}
    enableResizing={true}
    onMouseDown={() => onDormClick(dormName)} 
    
  >
    <div onClick={() => onDormClick(dormName)} style={{height: "100%"}}>
      <h2>{dormName}</h2>
      
      <div 

        style={{position: 'absolute', top: '10px', right: '10px', cursor: 'pointer', zIndex: 100000, color: `${textcolor}`, fontWeight: `${textWeight}`}}
      >{studentnumber}/{dormData[dormName]["Total Students"]}</div>
          <div className='student-list-inner' style={{height: "100%"}}>

      <div ref={studentDropRef} className="students-list">
{sortedStudents.map(student => (

  <StudentComponent
    key={student.id}
    student={student}
    // onStudentSelected={handleStudentSelected}

    color={color}
    onClick={() => console.log("fdsafdasfa")}
    onStudentSelecte
    setActiveStudentId={setActiveStudentId}
    onHover={onHover}
    onHoverEnd={onHoverEnd}
    hoveredPodmates={hoveredPodmates}
    dormColors={dormColors} // Pass the dormColors down
    dorms={dorms} // Pass the dorms state down
    onStudentClick={handleStudentClick}
    matchedRoommate={matchedRoommate}

  />
))}


      </div>
      </div>
      </div>
    </Rnd>
    </div>
    
    :
    <div className="dorm-container large" style={dormStyle}>
            <i 
        className="bi bi-zoom-out" 
        onClick={() => onDormClick(dormName)} 
        style={{position: 'absolute', top: '10px', right: '10px', cursor: 'pointer', zIndex: 100000, color: "red"}}
      ></i>
            <h2>{dormName}</h2>

            {sortedStudents.map(student => (
      <StudentComponent
        key={student.id}
        student={student}
        color={color}
        setActiveStudentId={setActiveStudentId}
        onHover={onHover}
        onHoverEnd={onHoverEnd}
        hoveredPodmates={hoveredPodmates}
        matchedRoommate={matchedRoommate}
      />
    ))}
      </div>

}
    </>
  );
}