import { useState } from 'react'

function Dial({ aliens, index, onSelect, onNext, onPrev, status }) {
  // saves where the finger or mouse started, used for swipe
  const [startX, setStartX] = useState(null)

  const angle = 360 / aliens.length
  const current = aliens[index]
  const CurrentIcon = current.icon

  function handlePointerDown(e) {
    setStartX(e.clientX)
  }

  function handlePointerUp(e) {
    if (startX === null) return
    const diff = e.clientX - startX
    if (diff > 50) onPrev()
    if (diff < -50) onNext()
    setStartX(null)
  }

  return (
    <div
      className={'dial ' + status}
      onPointerDown={handlePointerDown}
      onPointerUp={handlePointerUp}
    >
      <div className="dial-spin"></div>
      <div className="dial-pointer"></div>

      {/* this ring rotates so the selected alien stays on top */}
      <div className="dial-ring" style={{ transform: 'rotate(' + -index * angle + 'deg)' }}>
        {aliens.map((alien, i) => {
          const Icon = alien.icon
          const position =
            'rotate(' + i * angle + 'deg) translateY(calc(var(--radius) * -1)) rotate(' + (index * angle - i * angle) + 'deg)'
          return (
            <button
              key={alien.id}
              className={i === index ? 'dial-node active' : 'dial-node'}
              style={{ '--c': alien.color, transform: position }}
              onClick={() => onSelect(i)}
              aria-label={'Select ' + alien.name}
            >
              <Icon size={22} />
            </button>
          )
        })}
      </div>

      <div className="dial-core" style={{ '--c': current.color }}>
        <CurrentIcon size={64} strokeWidth={1.5} />
        <span className="core-name">{current.name}</span>
      </div>
    </div>
  )
}

export default Dial