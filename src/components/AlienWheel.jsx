import Omnitrix3DWatch from "./Omnitrix3DWatch";
import "../styles/alien-wheel.css";
import { ChevronLeft, ChevronRight } from "lucide-react";

export default function AlienWheel({
  aliens = [],
  selectedIndex = 0,
  onSelect,
}) {
  if (!aliens.length) {
    return <p>Loading alien database...</p>;
  }

  const currentAlien = aliens[selectedIndex];

  return (
    <section className="omnitrix-3d-selector">
      <div className="omnitrix-3d-heading">
        <span className="omnitrix-status-light" />
        <span>OMNITRIX // DNA SELECTOR</span>
        <span className="omnitrix-status-online">ONLINE</span>
      </div>

      <Omnitrix3DWatch
        aliens={aliens}
        selectedIndex={selectedIndex}
        onSelect={onSelect}
      />

      <div className="omnitrix-3d-controls">
        <button 
          className="omnitrix-3d-nav" 
          onClick={() => onSelect((selectedIndex - 1 + aliens.length) % aliens.length)}
          aria-label="Previous alien"
        >
          <ChevronLeft size={20} />
        </button>
        
        <div className="omnitrix-3d-info">
          <span className="omnitrix-3d-counter">
            {String(selectedIndex + 1).padStart(2, "0")} / {String(aliens.length).padStart(2, "0")}
          </span>
          <span className="omnitrix-3d-alien-name">{currentAlien?.name}</span>
        </div>
        
        <button 
          className="omnitrix-3d-nav" 
          onClick={() => onSelect((selectedIndex + 1) % aliens.length)}
          aria-label="Next alien"
        >
          <ChevronRight size={20} />
        </button>
      </div>

      <p className="omnitrix-3d-hint">
        DRAG TO ROTATE VIEW • ARROW KEYS TO SELECT
      </p>
    </section>
  );
}