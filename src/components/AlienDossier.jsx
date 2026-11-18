import { Cpu, Activity, Shield, Zap, Eye, Heart, Swords, Sparkles } from "lucide-react";

const STAT_CONFIG = {
  power: { icon: Swords, color: "#ff5a4d" },
  speed: { icon: Activity, color: "#4ddcff" },
  intelligence: { icon: Cpu, color: "#8bff3a" },
  energy: { icon: Heart, color: "#ffb020" },
};

function AlienDossier({ alien }) {
  if (!alien) {
    return (
      <aside className="ox-dossier ox-panel" aria-label="Alien profile">
        <div className="ox-panel__head">
          <span className="ox-label">ALIEN PROFILE</span>
        </div>
        <div className="ox-panel__body" style={{ textAlign: "center", padding: "60px 20px" }}>
          <Sparkles size={48} style={{ opacity: 0.2, marginBottom: "16px" }} />
          <p style={{ color: "var(--ox-text-muted)" }}>Select an alien to view profile</p>
        </div>
      </aside>
    );
  }

  const stats = alien.stats || {};
  const maxStat = Math.max(...Object.values(stats));

  return (
    <aside className="ox-dossier ox-panel" aria-label="Alien profile">
      <div className="ox-panel__head">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Eye size={14} color="var(--ox-green)" />
          <span className="ox-label">ALIEN INTEL</span>
        </div>
        <span className="ox-tag">{alien.type}</span>
      </div>

      <div className="ox-panel__body">
        <div style={{ marginBottom: "20px" }}>
          <span className="ox-dossier__species">
            {alien.species} // {alien.home}
          </span>
          <h2 className="ox-dossier__name">
            {alien.name}
          </h2>
          <p className="ox-dossier__desc">
            {alien.description}
          </p>
        </div>

        <dl className="ox-facts">
          <div>
            <dt className="ox-label">Species</dt>
            <dd>{alien.species}</dd>
          </div>
          <div>
            <dt className="ox-label">Home Planet</dt>
            <dd>{alien.home}</dd>
          </div>
          <div>
            <dt className="ox-label">Classification</dt>
            <dd>{alien.type}</dd>
          </div>
          <div>
            <dt className="ox-label">DNA ID</dt>
            <dd>#{String(alien.id).padStart(2, "0")}</dd>
          </div>
        </dl>

        <div style={{ marginTop: "24px" }}>
          <h3 className="ox-section-title">
            <Shield size={14} aria-hidden="true" />
            Power Analysis
          </h3>
          <div style={{ display: "grid", gap: "16px" }}>
            {Object.entries(stats).map(([stat, value]) => {
              const config = STAT_CONFIG[stat] || { icon: Activity, color: "var(--ox-green)" };
              const Icon = config.icon;
              const percentage = (value / maxStat) * 100;
              return (
                <div key={stat} className="ox-stat">
                  <span className="ox-stat__name">
                    <Icon size={12} />
                    {stat}
                  </span>
                  <div className="ox-stat__bar">
                    <div
                      className="ox-stat__fill"
                      style={{ 
                        width: `${percentage}%`,
                        background: `linear-gradient(90deg, ${config.color}80, ${config.color})`
                      }}
                    />
                  </div>
                  <span className="ox-stat__value">{value}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ marginTop: "28px" }}>
          <h3 className="ox-section-title">
            <Cpu size={14} aria-hidden="true" />
            Known Abilities
          </h3>
          <ul className="ox-abilities">
            {alien.abilities.map((ability, i) => (
              <li key={ability}>
                <span style={{ 
                  position: "absolute", 
                  left: "12px", 
                  top: "50%", 
                  width: "6px", 
                  height: "6px", 
                  background: "var(--ox-green)", 
                  transform: "translateY(-50%) rotate(45deg)",
                  boxShadow: "0 0 6px var(--ox-green)"
                }} />
                <strong style={{ color: "var(--ox-text)", marginRight: "8px" }}>
                  {String(i + 1).padStart(2, "0")}
                </strong>
                {ability}
              </li>
            ))}
          </ul>
        </div>

        <div style={{ 
          marginTop: "24px", 
          padding: "12px 14px", 
          background: "rgba(139,255,58,0.03)", 
          border: "1px solid var(--ox-line)",
          fontFamily: "var(--ox-font-mono)",
          fontSize: "10px",
          color: "var(--ox-text-muted)",
          letterSpacing: "0.05em"
        }}>
          <Eye size={12} style={{ display: "inline", marginRight: "6px" }} />
          DNA Signature: {alien.name.toUpperCase()} // ID-{alien.id}
        </div>
      </div>
    </aside>
  );
}

export default AlienDossier;