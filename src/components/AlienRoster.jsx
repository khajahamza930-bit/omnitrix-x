import { useMemo, useState } from "react";
import { Search } from "lucide-react";

// The list of all aliens, with a search box and a filter by type.
function AlienRoster({ aliens, selectedIndex, onSelect }) {
  const [query, setQuery] = useState("");
  const [type, setType] = useState("ALL");

  // all the different types, like FIRE or POWER
  const types = useMemo(
    () => ["ALL", ...new Set(aliens.map((alien) => alien.type))],
    [aliens]
  );

  // we keep the real position (index) of each alien, so a click selects the right one
  // even when the list is filtered
  const shown = aliens
    .map((alien, index) => ({ alien, index }))
    .filter(({ alien }) => {
      const matchesType = type === "ALL" || alien.type === type;
      const matchesName = alien.name.toLowerCase().includes(query.trim().toLowerCase());
      return matchesType && matchesName;
    });

  return (
    <section className="ox-roster ox-panel" aria-label="Alien roster">
      <div className="ox-panel__head">
        <span className="ox-label">Roster</span>
        <span className="ox-label">
          {shown.length} / {aliens.length}
        </span>
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
            placeholder="Search by name"
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
        <p className="ox-roster__empty">
          No alien matches. Clear the search or choose "All types".
        </p>
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
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export default AlienRoster;