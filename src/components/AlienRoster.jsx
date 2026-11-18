import { useMemo, useState } from "react";
import { Search, Filter, X } from "lucide-react";

function AlienRoster({ aliens, selectedIndex, onSelect }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("ALL");
  const [isCollapsed, setIsCollapsed] = useState(false);

  const types = useMemo(
    () => ["ALL", ...new Set(aliens.map((alien) => alien.type))],
    [aliens]
  );

  const shown = aliens
    .map((alien, index) => ({ alien, index }))
    .filter(({ alien }) => {
      const matchesType = type === "ALL" || alien.type === type;
      const matchesName = alien.name.toLowerCase().includes(query.trim().toLowerCase());
      return matchesType && matchesName;
    });

  if (isCollapsed) {
    return (
      <section className="ox-roster ox-panel" aria-label="Alien roster">
        <div className="ox-panel__head">
          <button
            type="button"
            className="ox-btn ox-btn--icon"
            onClick={() => setIsCollapsed(false)}
            aria-label="Expand roster"
            style={{ padding: "4px 8px" }}
          >
            <Filter size={14} />
          </button>
          <span className="ox-label">ROSTER</span>
          <span className="ox-counter">{shown.length}/{aliens.length}</span>
        </div>
      </section>
    );
  }

  return (
    <section className="ox-roster ox-panel" aria-label="Alien roster">
      <div className="ox-panel__head">
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <Filter size={14} color="var(--ox-green)" />
          <span className="ox-label">ALIEN ROSTER</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span className="ox-counter">{shown.length}/{aliens.length}</span>
          <button
            type="button"
            className="ox-btn ox-btn--icon"
            onClick={() => setIsCollapsed(true)}
            aria-label="Collapse roster"
            style={{ padding: "4px 8px" }}
          >
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="ox-roster__tools">
        <div className="ox-search">
          <Search size={16} aria-hidden="true" />
          <label htmlFor="alien-search" className="ox-sr-only">
            Search aliens by name
          </label>
          <input
            id="alien-search"
            className="ox-field"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by name..."
            autoComplete="off"
          />
        </div>

        <label htmlFor="alien-type" className="ox-sr-only">
          Filter by type
        </label>
        <select
          id="alien-type"
          className="ox-field"
          value={type}
          onChange={(event) => setType(event.target.value)}
        >
          {types.map((item) => (
            <option key={item} value={item}>
              {item === "ALL" ? "All types" : item}
            </option>
          ))}
        </select>
      </div>

      {shown.length === 0 ? (
        <div className="ox-roster__empty">
          <Filter size={32} style={{ opacity: 0.3, marginBottom: "12px" }} />
          <p style={{ margin: 0, fontSize: "13px" }}>
            No alien matches.<br />Clear the search or choose "All types".
          </p>
        </div>
      ) : (
        <ul className="ox-roster__list">
          {shown.map(({ alien, index }) => (
            <li key={alien.id}>
              <button
                type="button"
                className="ox-roster__item"
                aria-pressed={index === selectedIndex}
                onClick={() => onSelect(index)}
              >
                <span className="ox-roster__no">{String(index + 1).padStart(2, "0")}</span>
                <span className="ox-roster__glyph" aria-hidden="true">
                  {alien.icon}
                </span>
                <span className="ox-roster__name">
                  <strong>{alien.name}</strong>
                  <small>{alien.type}</small>
                </span>
                {index === selectedIndex && (
                  <span className="ox-roster__indicator" aria-hidden="true" />
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default AlienRoster;