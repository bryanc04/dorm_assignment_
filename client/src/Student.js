import { useDraggable } from '@dnd-kit/core';
import { useEffect } from 'react';

export class Student {
  constructor(name, id, dorm, podmates = [], matchedRoommate= "", dormPreferences = []) {
    this.name = name;
    this.id = id.toString();
    this.lastName = this.name.split(' ').slice(-1).join(' ');
    this.podmates = podmates; // initially an empty array
    this.isSelected = false;
    this.grade = "0";
    this.matchedRoommate = matchedRoommate;
    this.dormPreferences = dormPreferences;
  }

  toString() {
    return this.name;
}

  toJSON() {
    return {
      name: this.name,
      id:  this.id,
      lastName:   this.lastName,
      podmates: this.podmates.map(podmate => podmate.name),
      isSelected: this.isSelected,
      grade: this.grade,
      matchedRoommate: this.matchedRoommate,
      dormPreferences: this.dormPreferences
    };
  }
}

export function HoverMenu({ student, dormColors, dorms }) {
  const hoverMenuStyle = {};

  const getDormColor = (podmateName) => {
    console.log(student.name)
    for (const [dormName, students] of Object.entries(dorms)) {
      if (students.some(s => s.name === podmateName)) {
        return dormColors[dormName] || '#CCC'; // Default color if not found
      }
    }
    return '#CCC'; // Default color if not found
  };

  const sortPodmatesByDorm = (podmates) => {
    const studentDorm = Object.entries(dorms).find(([_, students]) =>
      students.some(s => s.name === student.name)
    )[0];

    return podmates.sort((a, b) => {
      const aDorm = Object.entries(dorms).find(([_, students]) =>
        students.some(s => s.name === a.name)
      )[0];
      const bDorm = Object.entries(dorms).find(([_, students]) =>
        students.some(s => s.name === b.name)
      )[0];

      if (aDorm === studentDorm && bDorm !== studentDorm) {
        return -1;
      } else if (aDorm !== studentDorm && bDorm === studentDorm) {
        return 1;
      } else {
        return aDorm.localeCompare(bDorm);
      }
    });
  };



  const sortedPodmates = sortPodmatesByDorm(student.podmates);
  

  return (
    <div className="hover-menu" style={hoverMenuStyle}>
      fdsafds
      <div><strong>Name:</strong> {student.name}</div>
      {student.matchedRoommate.length == 0 ? null : <div><strong>Matched Roommate:</strong><div style={{ background: getDormColor(student.matchedRoommate)}}>{student.matchedRoommate}</div></div>}
      <div><strong>Podmates:</strong></div>
      {student.podmates.map((podmate, index) => (
        podmate ? (
          <div key={index} style={{ background: getDormColor(podmate.name) }}>
            {podmate.name}
          </div>
        ) : null
      ))}
    </div>
  );
}


export function StudentComponent({ student, onStudentSelected, color, onRemove, onHover, onHoverEnd, hoveredPodmates, setActiveStudentId, dorms, dormColors, onDragEnd, onStudentClick, matchedRoommate }) {
  const { attributes, listeners, setNodeRef, transform, active } = useDraggable({
    id: student.id,
  });

  const handleStudentClick = (e) => {
    onStudentClick(student);

  };
  useEffect(() => {
    // Ensure the element is available and then attach the event listener
    const element = document.getElementById(student.id);
    if (element) {
      const handleClick = () => onStudentClick(student);
      element.addEventListener('click', handleClick);

      // Return a cleanup function to remove the event listener
      return () => element.removeEventListener('click', handleClick);
    }
  }, [student, onStudentClick]);
  
  

  useEffect(() => {
    if (active) {
      setActiveStudentId(active.id);
    } else {
      setActiveStudentId(null);
    }
  }, [active, student.id, setActiveStudentId]);

  const isHoveredPodmate = hoveredPodmates.some(s => student.name.includes(s.name));
  const isMatchedRoommate = student.name == matchedRoommate;
  const isPrefect = student.dormPreferences[0].includes('Prefect')
  student.studentStyle = {
    transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined,
    background: color,
    border: isMatchedRoommate? '5px solid red' : isHoveredPodmate ? '2px solid black' : '2px solid transparent',
    display: "grid",
    fontStyle: isPrefect? "italics" : null,
    fontWeight: isPrefect? 1000: null
  };

  const combinedListeners = {
    ...listeners,
    onMouseDown: (e) => {
      handleDragStart(e);
      if (listeners.onMouseDown) listeners.onMouseDown(e);
    },
    // onDragEnd prop added to handle drag end
    onDragEnd: () => onDragEnd && onDragEnd(student.id),
  };

  const handleDragStart = (e) => {
    e.stopPropagation();
  };

  const handleDrop = (e) => {
    // Call onDragEnd with the IDs of the dragged student and the drop target
    onDragEnd(student.id, e.target.id); // assuming e.target.id is the id of the drop target
  };

  const residentinpodmate = (resident, podmateNames) => {
    if (resident.name){
      if (!resident.name.includes("&")){
        if (podmateNames.has(resident.name)){
          return true;
        }
        return false
      }else{
        if (podmateNames.has(resident.name.split(" & ")[0]) || podmateNames.has(resident.name.split(" & ")[1])){
          console.log(resident.name, podmateNames)
          return true;
        }
        return false;
      }
    }
  }
  const getpercentage = () => {
    
    let instanceDormName = null;
    for (const [dormName, residents] of Object.entries(dorms)) {
        if (residents.some(resident => resident.name === student.name)) {
            instanceDormName = dormName;
            break;
        }
  
    }
    if (instanceDormName) {
      const podmateNames = new Set(student.podmates.map(podmate => podmate.name)); // Assuming podmates is an array of objects with a 'name' property
      const dormResidents = dorms[instanceDormName];
      let cnt = 0;

      for (let resident of dormResidents){
        if (!resident.name.includes("&")){
          if (podmateNames.has(resident.name)){
            cnt+=1;
          }
        }else{
          // console.log(resident.name.split(" & "))
          if (podmateNames.has(resident.name.split(" & ")[0]) && podmateNames.has(resident.name.split(" & ")[1])){
            cnt+=2;
          }
          else if (podmateNames.has(resident.name.split(" & ")[0]) || podmateNames.has(resident.name.split(" & ")[1])){
            cnt+=1;
          }
        }
      }

      // const count = dormResidents.filter(resident => residentinpodmate(resident, podmateNames));
      return Math.round(100*cnt/podmateNames.size);
  } else {
      // Instance not found in any dorm
      console.log("Instance not found in any dorm.");
      return 0;
  }
  }
  const getnumber = () => {

    let instanceDormName = null;
    for (const [dormName, residents] of Object.entries(dorms)) {
        if (residents.some(resident => resident.name === student.name)) {
            instanceDormName = dormName;
            break;
        }
  
    }
    if (instanceDormName) {
      const podmateNames = new Set(student.podmates.map(podmate => podmate.name)); // Assuming podmates is an array of objects with a 'name' property
      const dormResidents = dorms[instanceDormName];
      let cnt = 0;

      for (let resident of dormResidents){
        if (!resident.name.includes("&")){
          if (podmateNames.has(resident.name)){
            cnt+=1;
          }
        }else{
          // console.log(resident.name.split(" & "))
          if (podmateNames.has(resident.name.split(" & ")[0]) && podmateNames.has(resident.name.split(" & ")[1])){
            cnt+=2;
          }
          else if (podmateNames.has(resident.name.split(" & ")[0]) || podmateNames.has(resident.name.split(" & ")[1])){
            cnt+=1;
          }
        }
      }

      // const count = dormResidents.filter(resident => residentinpodmate(resident, podmateNames));
      return cnt;
  } else {
      // Instance not found in any dorm
      console.log("Instance not found in any dorm.");
      return 0;
  }
  }



  return (
    <div
      ref={setNodeRef}
      className="student-box"
      style={student.studentStyle}
      {...combinedListeners}
      {...attributes}
      onMouseEnter={() => onHover(student)}
      onMouseLeave={onHoverEnd}
      onDrop={handleDrop}
      draggable="true"
      onClick={() => handleStudentClick()}

      

    >
      <div style={{marginLeft:"auto", marginRight: "auto"}}>{student.name.substring(0,14)}{student.matchedRoommate.length ==0 ? "" : "*"} '{student.grade.substring(2,4)}</div>
      <div style={{marginLeft:"auto", marginRight: "auto"}}>#:{getnumber()} | %: {getpercentage()}</div>
    </div>
  );
}