import React, { useState } from 'react';
import { Rnd } from 'react-rnd';
import { DragDropContext, Droppable, Draggable } from 'react-beautiful-dnd';

// Distribute students among the dorms initially
const initialStudents = Array.from({ length: 100 }, (_, index) => `student-${index + 1}`);
const distributeStudents = (students, numDorms) => {
  const perDorm = Math.ceil(students.length / numDorms);
  return Array.from({ length: numDorms }, (_, i) => 
    students.slice(i * perDorm, (i + 1) * perDorm)
  );
};
const studentDistribution = distributeStudents(initialStudents, 3);

const initialDorms = [
  { id: 'dorm1', students: studentDistribution[0], position: { x: 0, y: 0 }, size: { width: 200, height: 200 } },
  { id: 'dorm2', students: studentDistribution[1], position: { x: 220, y: 0 }, size: { width: 200, height: 200 } },
  { id: 'dorm3', students: studentDistribution[2], position: { x: 440, y: 0 }, size: { width: 200, height: 200 } },
];

function App() {
  const [dorms, setDorms] = useState(initialDorms);

  const onDragEnd = (result) => {
    const { source, destination } = result;
    if (!destination) return;

    const start = dorms.find(dorm => dorm.id === source.droppableId);
    const finish = dorms.find(dorm => dorm.id === destination.droppableId);

    if (start === finish) return;

    const startStudents = Array.from(start.students);
    const finishStudents = Array.from(finish.students);

    const [removed] = startStudents.splice(source.index, 1);
    finishStudents.splice(destination.index, 0, removed);

    const newStart = { ...start, students: startStudents };
    const newFinish = { ...finish, students: finishStudents };

    const newState = dorms.map(dorm => {
      if (dorm.id === newStart.id) {
        return newStart;
      } else if (dorm.id === newFinish.id) {
        return newFinish;
      }
      return dorm;
    });

    setDorms(newState);
  };

  const updateDormPosition = (dormId, position) => {
    const updatedDorms = dorms.map(dorm => {
      if (dorm.id === dormId) {
        return { ...dorm, position };
      }
      return dorm;
    });
    setDorms(updatedDorms);
  };

  const updateDormSize = (dormId, size) => {
    const updatedDorms = dorms.map(dorm => {
      if (dorm.id === dormId) {
        return { ...dorm, size: { width: size.width, height: size.height } };
      }
      return dorm;
    });
    setDorms(updatedDorms);
  };

   return (
    <DragDropContext onDragEnd={onDragEnd}>
      {dorms.map(dorm => (
        <Rnd
          key={dorm.id}
          size={{ width: dorm.size.width, height: dorm.size.height }}
          position={{ x: dorm.position.x, y: dorm.position.y }}
          onDragStop={(e, d) => updateDormPosition(dorm.id, { x: d.x, y: d.y })}
          onResizeStop={(e, direction, ref, delta, position) => {
            updateDormSize(dorm.id, { width: ref.style.width, height: ref.style.height });
            updateDormPosition(dorm.id, position);
          }}
          dragHandleClassName="dorm-handle"
        >
          <div className="dorm-handle" style={{ backgroundColor: 'gray', padding: '10px' }}>
            {dorm.id.toUpperCase()}
          </div>
          <Droppable droppableId={dorm.id}>
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                style={{ background: snapshot.isDraggingOver ? 'lightblue' : 'lightgrey', minHeight: 100 }}
                {...provided.droppableProps}
              >
            {dorm.students.map((student, index) => (
              <Draggable key={student} draggableId={student} index={index}>
                {(provided, snapshot) => {
                  // Adjusting the position during dragging
                  if (snapshot.isDragging) {
                    provided.draggableProps.style.left = provided.draggableProps.style.offsetLeft;
                    provided.draggableProps.style.top = provided.draggableProps.style.offsetTop;
                  }
                  return (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={provided.draggableProps.style}
                    >
                      {student}
                    </div>
                  );
                }}
              </Draggable>
            ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        </Rnd>
      ))}
    </DragDropContext>
  );
}

export default App;