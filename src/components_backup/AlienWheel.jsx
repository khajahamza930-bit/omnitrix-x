
import Omnitrix3DWatch from "./Omnitrix3DWatch";
import "../styles/alien-wheel.css";

export default function AlienWheel({
  aliens = [],
  selectedIndex = 0,
  onSelect,
}) {
  if (!aliens.length) {
    return <p>Loading alien database...</p>;
  }

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

      <p className="omnitrix-3d-hint">
        DRAG TO ROTATE VIEW · SELECT AN ALIEN
      </p>
    </section>
  );
}
