function AlienInfo({ alien }) {
  const stats = [
    ['Strength', alien.stats.strength],
    ['Speed', alien.stats.speed],
    ['Intelligence', alien.stats.intelligence],
    ['Durability', alien.stats.durability],
    ['Efficiency', alien.stats.energy],
  ]

  return (
    <section className="panel info">
      <h2>{alien.name}</h2>
      <p className="species">{alien.species} · {alien.classification}</p>
      <p>{alien.description}</p>

      <h3>Abilities</h3>
      <ul className="chips">
        {alien.abilities.map((ability) => (
          <li key={ability}>{ability}</li>
        ))}
      </ul>

      <h3>Stats</h3>
      {stats.map(([name, value]) => (
        <div className="stat" key={name}>
          <span>{name}</span>
          <div className="bar-bg">
            <div className="bar-fill" style={{ width: value + '%' }}></div>
          </div>
          <b>{value}</b>
        </div>
      ))}

      <p className="small"><b>Strengths:</b> {alien.strengths}</p>
      <p className="small"><b>Weaknesses:</b> {alien.weaknesses}</p>
    </section>
  )
}

export default AlienInfo