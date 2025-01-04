import React, { useState } from 'react';
import Draggable from 'react-draggable';
import { Dorm } from './Dorm';

export function SortableDorm({ dormName, students, color }) {
  const [position, setPosition] = useState({ x: 0, y: 0 });

  const handleDragStop = (e, data) => {
    setPosition({
      x: data.x,
      y: data.y
    });
  };

  return (
    <Draggable position={position} onStop={handleDragStop}>
      <div style={{ position: 'absolute', left: position.x, top: position.y }}>
        <Dorm dormName={dormName} students={students} color={color} />
      </div>
    </Draggable>
  );
}
