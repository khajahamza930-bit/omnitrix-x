import {
  Users,
  Copy,
  LogIn,
  DoorOpen,
  Swords,
  CheckCircle2,
  Wifi,
  WifiOff,
  X,
  Zap,
  Heart,
} from "lucide-react";

// Multiplayer presentation only. Server-owned room data controls combat values.
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
  availableMoves = [],
  selectedMoveId,
  onMoveSelect,
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
  const myPlayer = room?.players?.find((player) => player.id === myId);
  const myEnergy = myPlayer?.energy ?? 0;

  const selectedMove =
    availableMoves.find((move) => move.id === selectedMoveId) ||
    availableMoves.find((move) => move.type === "basic") ||
    availableMoves[0] ||
    null;

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
            {connected ? (
              <Wifi size={15} aria-hidden="true" />
            ) : (
              <WifiOff size={15} aria-hidden="true" />
            )}
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
                <button
                  type="button"
                  className="ox-btn ox-btn--primary"
                  onClick={onCreate}
                  disabled={isBusy}
                >
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
                  onChange={(event) =>
                    onRoomCodeChange(event.target.value.toUpperCase())
                  }
                  maxLength={6}
                  placeholder="E.G. A1B2C3"
                  autoComplete="off"
                />
                <button
                  type="submit"
                  className="ox-btn"
                  disabled={isBusy || !roomCodeInput.trim()}
                >
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

              <button
                type="button"
                className="ox-btn ox-btn--danger"
                onClick={onLeave}
              >
                <DoorOpen size={15} />
                Leave room
              </button>
            </div>

            <div className="ox-friends__grid ox-room__players">
              {room.players.map((player, index) => {
                const health = Math.max(0, Math.min(100, player.health ?? 100));
                const energy = Math.max(0, Math.min(100, player.energy ?? 0));

                return (
                  <div className="ox-player" key={player.id}>
                    <span className="ox-label">
                      <span className="ox-dot" />
                      {index === 0 ? "Player 1 / host" : "Player 2"}
                      {player.id === room.currentTurnPlayerId && isInBattle
                        ? " · ACTIVE TURN"
                        : ""}
                    </span>

                    <h3 className="ox-player__name">
                      {player.name}
                      {player.id === myId ? " (you)" : ""}
                    </h3>

                    <p className="ox-player__alien">
                      Alien: {player.alien || "Not selected"}
                    </p>

                    <span className={player.ready ? "ox-tag" : "ox-tag ox-tag--idle"}>
                      {player.ready ? "Ready" : "Not ready"}
                    </span>

                    <div className="ox-meter">
                      <div className="ox-meter__label">
                        <span><Heart size={13} /> Health</span>
                        <strong>{health}/100</strong>
                      </div>
                      <div
                        className="ox-meter__track"
                        role="progressbar"
                        aria-label={`${player.name} health`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={health}
                      >
                        <span
                          className="ox-meter__fill ox-meter__fill--health"
                          style={{ width: `${health}%` }}
                        />
                      </div>
                    </div>

                    <div className="ox-meter">
                      <div className="ox-meter__label">
                        <span><Zap size={13} /> Energy</span>
                        <strong>{energy}/100</strong>
                      </div>
                      <div
                        className="ox-meter__track"
                        role="progressbar"
                        aria-label={`${player.name} energy`}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={energy}
                      >
                        <span
                          className="ox-meter__fill ox-meter__fill--energy"
                          style={{ width: `${energy}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })}

              {room.players.length < 2 && (
                <div className="ox-player ox-player--waiting">
                  Waiting for your friend to join...
                </div>
              )}
            </div>

            <div className="ox-room__actions">
              {!isInBattle && room.status !== "finished" && (
                <button type="button" className="ox-btn" onClick={onReady}>
                  <CheckCircle2 size={16} />
                  {isReady ? "Cancel ready" : "I'm ready"}
                </button>
              )}

              {isInBattle && room.players.length === 2 && (
                <span className="ox-tag">
                  {canAttack ? "Your turn" : `${currentTurnName || "Opponent"}'s turn`}
                </span>
              )}

              {room.status === "finished" && (
                <span className="ox-tag">Battle finished</span>
              )}
            </div>

            {isInBattle && room.players.length === 2 && (
              <section className="ox-combat" aria-label="Combat moves">
                <div className="ox-combat__heading">
                  <div>
                    <span className="ox-label">Combat console</span>
                    <h3>Choose your move</h3>
                  </div>
                  <span className="ox-combat__energy">
                    <Zap size={14} />
                    {myEnergy} energy
                  </span>
                </div>

                {availableMoves.length > 0 ? (
                  <>
                    <div className="ox-moves">
                      {availableMoves.map((move) => {
                        const affordable = myEnergy >= move.energyCost;
                        const selected = selectedMove?.id === move.id;

                        return (
                          <button
                            type="button"
                            key={move.id}
                            className={`ox-move${selected ? " ox-move--selected" : ""}`}
                            onClick={() => onMoveSelect(move.id)}
                            disabled={!affordable}
                            aria-pressed={selected}
                            title={
                              affordable
                                ? move.description
                                : `Requires ${move.energyCost} energy`
                            }
                          >
                            <span className="ox-move__type">
                              {move.type}
                            </span>
                            <strong className="ox-move__name">{move.name}</strong>
                            <span className="ox-move__description">
                              {move.description}
                            </span>
                            <span className="ox-move__stats">
                              <span>{move.damage} DMG</span>
                              <span>{move.energyCost} ENERGY</span>
                            </span>
                            {!affordable && (
                              <span className="ox-move__unavailable">
                                Insufficient energy
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>

                    <div className="ox-combat__footer">
                      <div>
                        <span className="ox-label">Selected move</span>
                        <strong>{selectedMove?.name || "No move selected"}</strong>
                      </div>

                      <button
                        type="button"
                        className="ox-btn ox-btn--primary"
                        onClick={onAttack}
                        disabled={
                          !canAttack ||
                          !selectedMove ||
                          myEnergy < (selectedMove?.energyCost ?? 0)
                        }
                      >
                        <Swords size={16} />
                        {!canAttack
                          ? "Waiting for opponent"
                          : selectedMove
                            ? `Use ${selectedMove.name}`
                            : "Select a move"}
                      </button>
                    </div>
                  </>
                ) : (
                  <p className="ox-note">
                    Combat moves are loading. Please wait for the room update.
                  </p>
                )}
              </section>
            )}

            {room.status === "finished" && battleWinner && (
              <p className="ox-winner">
                {battleWinner.winnerId === myId
                  ? "Victory!"
                  : `${battleWinner.winnerName} wins!`}
              </p>
            )}
          </div>
        )}

        {message && (
          <p className="ox-msg" role="status" aria-live="polite">
            {message}
          </p>
        )}

        {error && (
          <p className="ox-msg ox-msg--error" role="alert">
            {error}
          </p>
        )}

        <p className="ox-note">
          Local testing: both players can test on this computer using separate
          browser tabs. Friends on other computers need the deployed server.
        </p>
      </div>
    </section>
  );
}

export default FriendsPanel;