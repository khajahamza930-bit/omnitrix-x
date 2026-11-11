import { Users, Copy, LogIn, DoorOpen, Swords, CheckCircle2, Wifi, WifiOff, X } from "lucide-react";

// The "play with friends" panel. It only shows things.
// All the state and the multiplayer logic stay in App.jsx, and come in as props.
function FriendsPanel({
  connected,
  myId,
  room,
  playerName,
  onPlayerNameChange,
  roomCodeInput,
  onRoomCodeChange,
  isBusy,
  isReady,
  isInBattle,
  canAttack,
  currentTurnName,
  battleWinner,
  message,
  error,
  onCreate,
  onJoin,
  onReady,
  onAttack,
  onLeave,
  onCopy,
  onClose,
}) {
  return (
    <section className="ox-friends ox-panel" aria-label="Play with friends">
      <div className="ox-panel__head">
        <div>
          <span className="ox-label">Online multiplayer</span>
          <h2 className="ox-friends__title">Play with friends</h2>
        </div>

        <div className="ox-friends__head-right">
          <span className="ox-badge">
            <span className={connected ? "ox-dot" : "ox-dot ox-dot--warn"} />
            {connected ? <Wifi size={15} aria-hidden="true" /> : <WifiOff size={15} aria-hidden="true" />}
            {connected ? "Server connected" : "Connecting to server"}
          </span>

          <button
            type="button"
            className="ox-btn ox-btn--icon"
            onClick={onClose}
            aria-label="Close the multiplayer panel"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      <div className="ox-panel__body">
        {!room ? (
          <div>
            <div className="ox-formrow">
              <label htmlFor="player-name" className="ox-label">
                Your player name
              </label>
              <input
                id="player-name"
                className="ox-field"
                value={playerName}
                onChange={(event) => onPlayerNameChange(event.target.value)}
                maxLength={20}
                placeholder="Enter your name"
                autoComplete="nickname"
              />
            </div>

            <div className="ox-friends__grid">
              <div className="ox-formrow">
                <span className="ox-label">Start a new room</span>
                <button type="button" className="ox-btn ox-btn--primary" onClick={onCreate} disabled={isBusy}>
                  <Users size={16} />
                  {isBusy ? "Please wait..." : "Create room"}
                </button>
              </div>

              <form
                className="ox-formrow"
                onSubmit={(event) => {
                  event.preventDefault();
                  onJoin();
                }}
              >
                <label htmlFor="room-code" className="ox-label">
                  Friend's room code
                </label>
                <input
                  id="room-code"
                  className="ox-field ox-field--code"
                  value={roomCodeInput}
                  onChange={(event) => onRoomCodeChange(event.target.value.toUpperCase())}
                  maxLength={6}
                  placeholder="E.G. A1B2C3"
                  autoComplete="off"
                />
                <button type="submit" className="ox-btn" disabled={isBusy || !roomCodeInput.trim()}>
                  <LogIn size={16} />
                  {isBusy ? "Please wait..." : "Join room"}
                </button>
              </form>
            </div>
          </div>
        ) : (
          <div>
            <div className="ox-room__top">
              <div>
                <span className="ox-label">Room code. Share it with your friend</span>
                <div className="ox-room__code">
                  <strong className="ox-roomcode">{room.code}</strong>
                  <button type="button" className="ox-btn" onClick={onCopy}>
                    <Copy size={15} />
                    Copy code
                  </button>
                </div>
              </div>

              <button type="button" className="ox-btn ox-btn--danger" onClick={onLeave}>
                <DoorOpen size={15} />
                Leave room
              </button>
            </div>

            <div className="ox-friends__grid ox-room__players">
              {room.players.map((player, index) => (
                <div className="ox-player" key={player.id}>
                  <span className="ox-label">
                    <span className="ox-dot" />
                    {index === 0 ? "Player 1 / host" : "Player 2"}
                  </span>

                  <h3 className="ox-player__name">
                    {player.name}
                    {player.id === myId ? " (you)" : ""}
                  </h3>

                  <p className="ox-player__alien">Alien: {player.alien || "Not selected"}</p>

                  <span className={player.ready ? "ox-tag" : "ox-tag ox-tag--idle"}>
                    {player.ready ? "Ready" : "Not ready"}
                  </span>

                  {typeof player.health === "number" && (
                    <div>
                      <span className="ox-label">HP {player.health}</span>
                      <div
                        className="ox-cells"
                        style={{ "--value": Math.max(0, Math.min(100, player.health)) }}
                      />
                    </div>
                  )}
                </div>
              ))}

              {room.players.length < 2 && (
                <div className="ox-player ox-player--waiting">Waiting for your friend to join...</div>
              )}
            </div>

            <div className="ox-room__actions">
              {!isInBattle && (
                <button type="button" className="ox-btn" onClick={onReady}>
                  <CheckCircle2 size={16} />
                  {isReady ? "Cancel ready" : "I'm ready"}
                </button>
              )}

              {isInBattle && room.players.length === 2 && (
                <>
                  <span className="ox-tag">
                    {canAttack
                      ? "Your turn"
                      : `${currentTurnName || "Opponent"}'s turn`}
                  </span>

                  <button
                    type="button"
                    className="ox-btn ox-btn--primary"
                    onClick={onAttack}
                    disabled={!canAttack}
                  >
                    <Swords size={16} />
                    {canAttack ? "Attack opponent (-10 HP)" : "Waiting for opponent"}
                  </button>
                </>
              )}

              {isInBattle && <span className="ox-tag">Battle in progress</span>}
            </div>

            {room.status === "finished" && battleWinner && (
              <p className="ox-winner">
                {battleWinner.winnerId === myId ? "Victory!" : `${battleWinner.winnerName} wins!`}
              </p>
            )}
          </div>
        )}

        {message && (
          <p className="ox-msg" role="status">
            {message}
          </p>
        )}

        {error && (
          <p className="ox-msg ox-msg--error" role="alert">
            {error}
          </p>
        )}

        <p className="ox-note">
          Local testing: both players can test on this computer using separate browser tabs.
          Friends on other computers will need the server deployed or network access configured.
        </p>
      </div>
    </section>
  );
}

export default FriendsPanel;