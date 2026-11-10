import { Cpu, Activity } from "lucide-react";

// The profile of the selected alien: name, facts, abilities and power analysis.
function AlienDossier({ alien }) {
  return (
    <aside className="ox-dossier ox-panel" aria-label="Alien profile">
      <div className="ox-panel__head">
        <span className="ox-label">Alien profile</span>
        <span className="ox-tag">{alien.type}</span>
      </div>

      <div className="ox-panel__body">
        <h2 className="ox-dossier__name">{alien.name}</h2>
        <p className="ox-dossier__desc">{alien.description}</p>

        <dl className="ox-facts">
          <div>
            <dt className="ox-label">Species</dt>
            <dd>{alien.species}</dd>
          </div>
          <div>
            <dt className="ox-label">Home planet</dt>
            <dd>{alien.home}</dd>
          </div>
        </dl>

        <h3 className="ox-label ox-section-title">
          <Cpu size={14} aria-hidden="true" />
          Known abilities
        </h3>
        <ul className="ox-abilities">
          {alien.abilities.map((ability) => (
            <li key={ability}>{ability}</li>
          ))}
        </ul>

        <h3 className="ox-label ox-section-title">
          <Activity size={14} aria-hidden="true" />
          Power analysis
        </h3>
        {Object.entries(alien.stats).map(([stat, value]) => (
          <div className="ox-stat" key={stat}>
            <span className="ox-stat__name">{stat}</span>
            <div
              className="ox-cells"
              style={{ "--value": value }}
              role="meter"
              aria-label={stat}
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={value}
            />
            <span className="ox-stat__value">{value}</span>
          </div>
        ))}
      </div>
    </aside>
  );
}

export default AlienDossier;