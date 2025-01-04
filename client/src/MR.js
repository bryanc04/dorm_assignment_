import { useDraggable } from '@dnd-kit/core';
import { useEffect } from 'react';

export class MR {
    constructor(roommate1, roommate2, id) {
      this.roommate1 = roommate1;
      this.roommate2 = roommate2;
      this.id = id.toString();
      this.name = `${roommate1.name} & ${roommate2.name}`;
      this.lastName = (roommate1.lastName && roommate2.lastName) ? 
            [roommate1.lastName, roommate2.lastName].join(' & ') : undefined;
      this.podmates = [...roommate1.podmates, ...roommate2.podmates];
    }
  }
  export function MRComponent({ mr, onRemove, color, onHover, onHoverEnd, setActiveMRId }) {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id: mr.id,
      grade: null
    });
  
    return (
      <div
        ref={setNodeRef}
        className="mr-box"
        style={{ transform: transform ? `translate3d(${transform.x}px, ${transform.y}px, 0)` : undefined, background: color }}
        {...listeners}
        {...attributes}
        onMouseEnter={() => onHover(mr)}
        onMouseLeave={onHoverEnd}
        draggable="true"
      >
        {mr.name} fdfdsfadsfsad
      </div>
    );
  }