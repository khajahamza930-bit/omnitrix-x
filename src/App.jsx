
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Zap,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Power,
  Shield,
  Cpu,
  Activity,
  Atom,
  Users,
  Copy,
  LogIn,
  DoorOpen,
  Swords,
  CheckCircle2,
  Wifi,
} from "lucide-react";

import aliens from "./data/aliens";
import Omnitrix3D from "./components/Omnitrix3D";
import AlienWheel from "./components/AlienWheel";
import "./styles/global.css";

import {
  socket,
  createRoom,
  joinRoom,
  setReady as sendReady,
  selectAlien as sendAlienSelection,
  attack as sendAttack,
  leaveRoom as sendLeaveRoom,
} from "./multiplayer";

function App() {
  const [showOmnitrixIntro, setShowOmnitrixIntro] = useState(true);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isPowered, setIsPowered] = useState(true);
  const [isTransformed, setIsTransformed] = useState(false);
  const [isTransforming, setIsTransforming] = useState(false);

  // Multiplayer state
  const [showFriends, setShowFriends] = useState(false);
  const [playerName, setPlayerName] = useState("");
  const [roomCodeInput, setRoomCodeInput] = useState("");
  const [room, setRoom] = useState(null);
  const [multiplayerMessage, setMultiplayerMessage] = useState("");
  const [multiplayerError, setMultiplayerError] = useState("");
  const [isReady, setIsReady] = useState(false);
  const [battleWinner, setBattleWinner] = useState(null);
  const [isBusy, setIsBusy] = useState(false);

  const alien = aliens[selectedIndex];

  const myPlayer = room?.players?.find(
    (player) => player.id === socket.id
  );

  const opponent = room?.players?.find(
    (player) => player.id !== socket.id
  );

  const isInBattle = room?.status === "battle";
  const isRoomOwner = room?.players?.[0]?.id === socket.id;

  useEffect(() => {
    function handleRoomUpdated(updatedRoom) {
      setRoom(updatedRoom);

      const me = updatedRoom.players?.find(
        (player) => player.id === socket.id
      );

      if (me) {
        setIsReady(me.ready);

        if (me.alien) {
          const index = aliens.findIndex(
            (item) =>
              item.name.toLowerCase() === me.alien.toLowerCase()
          );

          if (index >= 0) {
            setSelectedIndex(index);
          }
        }
      }
    }

    function handleBattleStarted(updatedRoom) {
      setRoom(updatedRoom);
      setBattleWinner(null);
      setMultiplayerMessage(
        "Both players are ready. Battle started!"
      );
      setMultiplayerError("");
    }

    function handleBattleUpdated(payload) {
      if (payload?.room) {
        setRoom(payload.room);
      }
    }

    function handleBattleFinished(result) {
      setBattleWinner(result);

      setMultiplayerMessage(
        result?.winnerId === socket.id
          ? "VICTORY! You won the battle."
          : `${result?.winnerName || "Your opponent"} won this battle.`
      );
    }

    function handleOpponentLeft() {
      setRoom((currentRoom) => {
        if (!currentRoom) return currentRoom;

        return {
          ...currentRoom,
          status: "waiting",
          players: currentRoom.players.filter(
            (player) => player.id === socket.id
          ),
        };
      });

      setIsReady(false);
      setBattleWinner(null);
      setMultiplayerMessage("Your friend left the room.");
    }

    socket.on("room-updated", handleRoomUpdated);
    socket.on("battle-started", handleBattleStarted);
    socket.on("battle-updated", handleBattleUpdated);
    socket.on("battle-finished", handleBattleFinished);
    socket.on("opponent-left", handleOpponentLeft);

    return () => {
      socket.off("room-updated", handleRoomUpdated);
      socket.off("battle-started", handleBattleStarted);
      socket.off("battle-updated", handleBattleUpdated);
      socket.off("battle-finished", handleBattleFinished);
      socket.off("opponent-left", handleOpponentLeft);
    };
  }, []);

  function selectAlien(index) {
    const nextIndex =
      (index + aliens.length) % aliens.length;

    setSelectedIndex(nextIndex);
    setIsTransformed(false);
    setIsTransforming(false);

    if (room && room.status === "waiting") {
      sendAlienSelection(aliens[nextIndex].name);
    }
  }

  function transform() {
    if (!isPowered || isTransforming) return;

    if (isTransformed) {
      setIsTransformed(false);
      return;
    }

    setIsTransforming(true);

    setTimeout(() => {
      setIsTransforming(false);
      setIsTransformed(true);
    }, 1800);
  }

  function resetOmnitrix() {
    setSelectedIndex(0);
    setIsPowered(true);
    setIsTransformed(false);
    setIsTransforming(false);
  }

  async function handleCreateRoom() {
    setIsBusy(true);
    setMultiplayerError("");
    setMultiplayerMessage("");

    try {
      if (!socket.connected) {
        socket.connect();
      }

      const result = await createRoom(
        playerName.trim() || "Player 1"
      );

      if (!result?.success) {
        setMultiplayerError(
          result?.message || "Could not create room."
        );
        return;
      }

      setRoom(result.room);
      setShowFriends(true);
      setBattleWinner(null);
      setMultiplayerMessage(
        "Room created! Share the code with your friend."
      );
    } catch {
      setMultiplayerError(
        "Could not connect to the multiplayer server. Is it running on port 3001?"
      );
    } finally {
      setIsBusy(false);
    }
  }

  async function handleJoinRoom() {
    setIsBusy(true);
    setMultiplayerError("");
    setMultiplayerMessage("");

    try {
      if (!socket.connected) {
        socket.connect();
      }

      const result = await joinRoom(
        roomCodeInput.trim().toUpperCase(),
        playerName.trim() || "Player 2"
      );

      if (!result?.success) {
        setMultiplayerError(
          result?.message || "Could not join room."
        );
        return;
      }

      setRoom(result.room);
      setShowFriends(true);
      setBattleWinner(null);
      setMultiplayerMessage(
        "Joined the room! Choose your alien and get ready."
      );
    } catch {
      setMultiplayerError(
        "Could not connect to the multiplayer server. Is it running on port 3001?"
      );
    } finally {
      setIsBusy(false);
    }
  }

  function handleReadyToggle() {
    const nextReady = !isReady;

    setIsReady(nextReady);
    sendReady(nextReady);
    setMultiplayerError("");

    setMultiplayerMessage(
      nextReady
        ? "You're ready. Waiting for your friend..."
        : "You're not ready yet."
    );
  }

  async function handleAttack() {
    setMultiplayerError("");

    const result = await sendAttack();

    if (!result?.success) {
      setMultiplayerError(
        result?.message || "Attack failed."
      );
    }
  }

  function handleLeaveRoom() {
    sendLeaveRoom();
    setRoom(null);
    setIsReady(false);
    setBattleWinner(null);
    setMultiplayerMessage("You left the room.");
    setMultiplayerError("");
  }

  function copyRoomCode() {
    if (!room?.code) return;

    if (navigator.clipboard?.writeText) {
      navigator.clipboard
        .writeText(room.code)
        .then(() => {
          setMultiplayerMessage(
            "Room code copied! Send it to your friend."
          );
        })
        .catch(() => {
          setMultiplayerMessage(
            `Your room code is ${room.code}. Copy it manually.`
          );
        });
    } else {
      setMultiplayerMessage(
        `Your room code is ${room.code}. Copy it manually.`
      );
    }
  }

  const friendPanelStyle = {
    margin: "0 0 24px",
    padding: "20px",
    border: "1px solid rgba(91, 255, 95, 0.35)",
    borderRadius: "16px",
    background:
      "linear-gradient(135deg, rgba(12, 31, 18, 0.96), rgba(7, 12, 10, 0.96))",
    boxShadow: "0 0 35px rgba(50, 255, 80, 0.08)",
    color: "#eaffeb",
  };

  const fieldStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 13px",
    borderRadius: "9px",
    border: "1px solid rgba(150, 255, 160, 0.28)",
    background: "#08110b",
    color: "#f0fff1",
    outline: "none",
    font: "inherit",
  };

  const actionStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "8px",
    padding: "11px 14px",
    borderRadius: "9px",
    border: "1px solid rgba(95, 255, 105, 0.45)",
    background: "rgba(52, 255, 75, 0.12)",
    color: "#a8ffad",
    cursor: "pointer",
    font: "inherit",
    fontWeight: 700,
  };

  // Show the Omnitrix opening screen before the dashboard.
  if (showOmnitrixIntro) {
    return (
      <Omnitrix3D
        onOpen={() => setShowOmnitrixIntro(false)}
      />
    );
  }

  return (
    <main
      className="app-shell"
      style={{ "--alien-color": alien.color }}
    >
      <div className="background-grid" />
      <div className="background-glow glow-one" />
      <div className="background-glow glow-two" />

      <header className="topbar">
        <div className="brand">
          <div className="brand-symbol">
            <Atom size={29} />
          </div>

          <div>
            <h1>
              OMNITRIX <span>X</span>
            </h1>
            <p>ALIEN TRANSFORMATION SYSTEM</p>
          </div>
        </div>

        <div className="system-status">
          <span
            className={`status-dot ${
              isPowered ? "" : "offline"
            }`}
          />

          <span>
            {isPowered ? "SYSTEM ONLINE" : "SYSTEM OFFLINE"}
          </span>

          <span className="version">VER 10.0</span>

          <button
            type="button"
            onClick={() =>
              setShowFriends((current) => !current)
            }
            style={actionStyle}
          >
            <Users size={16} />
            {showFriends
              ? "CLOSE FRIENDS"
              : "PLAY WITH FRIENDS"}
          </button>
        </div>
      </header>

      {showFriends && (
        <section
          style={friendPanelStyle}
          aria-label="Play with friends"
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 12,
              flexWrap: "wrap",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 5px",
                  color: "#8bff96",
                  fontSize: 11,
                  letterSpacing: 2,
                }}
              >
                OMNITRIX X / ONLINE MULTIPLAYER
              </p>

              <h2 style={{ margin: 0, fontSize: 24 }}>
                Play With Friends
              </h2>

              <p
                style={{
                  margin: "8px 0 0",
                  color: "#a6b9a8",
                  fontSize: 13,
                }}
              >
                Create a private room or join your friend's room
                with a code.
              </p>
            </div>

            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                color: socket.connected
                  ? "#9bffa3"
                  : "#ffd580",
                fontSize: 12,
              }}
            >
              <Wifi size={16} />
              {socket.connected
                ? "SERVER CONNECTED"
                : "CONNECTING TO SERVER"}
            </div>
          </div>

          {!room ? (
            <div
              style={{
                display: "grid",
                gridTemplateColumns:
                  "repeat(auto-fit, minmax(230px, 1fr))",
                gap: 16,
                marginTop: 20,
              }}
            >
              <div
                style={{
                  display: "grid",
                  gap: 10,
                  alignContent: "start",
                }}
              >
                <label
                  htmlFor="player-name"
                  style={{ fontSize: 12, color: "#b5c8b7" }}
                >
                  YOUR PLAYER NAME
                </label>

                <input
                  id="player-name"
                  value={playerName}
                  onChange={(event) =>
                    setPlayerName(event.target.value)
                  }
                  maxLength={20}
                  placeholder="Enter your name"
                  style={fieldStyle}
                />

                <button
                  type="button"
                  style={actionStyle}
                  onClick={handleCreateRoom}
                  disabled={isBusy}
                >
                  <Users size={16} />
                  {isBusy ? "PLEASE WAIT..." : "CREATE ROOM"}
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gap: 10,
                  alignContent: "start",
                }}
              >
                <label
                  htmlFor="room-code"
                  style={{ fontSize: 12, color: "#b5c8b7" }}
                >
                  FRIEND'S ROOM CODE
                </label>

                <input
                  id="room-code"
                  value={roomCodeInput}
                  onChange={(event) =>
                    setRoomCodeInput(
                      event.target.value.toUpperCase()
                    )
                  }
                  maxLength={6}
                  placeholder="E.G. A1B2C3"
                  style={{
                    ...fieldStyle,
                    textTransform: "uppercase",
                    letterSpacing: 3,
                  }}
                />

                <button
                  type="button"
                  style={actionStyle}
                  onClick={handleJoinRoom}
                  disabled={isBusy || !roomCodeInput.trim()}
                >
                  <LogIn size={16} />
                  {isBusy ? "PLEASE WAIT..." : "JOIN ROOM"}
                </button>
              </div>
            </div>
          ) : (
            <div style={{ marginTop: 20 }}>
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: 12,
                  justifyContent: "space-between",
                }}
              >
                <div>
                  <p
                    style={{
                      margin: "0 0 5px",
                      color: "#b5c8b7",
                      fontSize: 12,
                    }}
                  >
                    ROOM CODE — SHARE WITH YOUR FRIEND
                  </p>

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      flexWrap: "wrap",
                    }}
                  >
                    <strong
                      style={{
                        fontSize: 28,
                        letterSpacing: 5,
                        color: "#9bffa3",
                      }}
                    >
                      {room.code}
                    </strong>

                    <button
                      type="button"
                      style={actionStyle}
                      onClick={copyRoomCode}
                    >
                      <Copy size={15} />
                      COPY CODE
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  style={{
                    ...actionStyle,
                    borderColor: "rgba(255, 120, 120, .4)",
                    color: "#ffaaaa",
                    background: "rgba(255, 70, 70, .08)",
                  }}
                  onClick={handleLeaveRoom}
                >
                  <DoorOpen size={15} />
                  LEAVE ROOM
                </button>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns:
                    "repeat(auto-fit, minmax(190px, 1fr))",
                  gap: 12,
                  marginTop: 18,
                }}
              >
                {room.players.map((player, index) => (
                  <div
                    key={player.id}
                    style={{
                      padding: 14,
                      borderRadius: 11,
                      border:
                        "1px solid rgba(140, 255, 150, .18)",
                      background: "rgba(0, 0, 0, .22)",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        color: "#9bffa3",
                        fontSize: 11,
                        letterSpacing: 1,
                      }}
                    >
                      <span
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: "50%",
                          background: "#65ff75",
                          display: "inline-block",
                        }}
                      />
                      {index === 0
                        ? "PLAYER 1 / HOST"
                        : "PLAYER 2"}
                    </div>

                    <h3 style={{ margin: "9px 0 5px", fontSize: 18 }}>
                      {player.name}
                      {player.id === socket.id ? " (YOU)" : ""}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: "#a6b9a8",
                        fontSize: 12,
                      }}
                    >
                      Alien: {player.alien || "Not selected"}
                    </p>

                    <p
                      style={{
                        margin: "7px 0 0",
                        color: player.ready
                          ? "#9bffa3"
                          : "#ffd580",
                        fontSize: 12,
                      }}
                    >
                      {player.ready ? "READY" : "NOT READY"}
                    </p>
                  </div>
                ))}

                {room.players.length < 2 && (
                  <div
                    style={{
                      padding: 14,
                      borderRadius: 11,
                      border: "1px dashed rgba(140, 255, 150, .25)",
                      display: "grid",
                      alignContent: "center",
                      color: "#a6b9a8",
                      fontSize: 13,
                    }}
                  >
                    Waiting for your friend to join...
                  </div>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 10,
                  flexWrap: "wrap",
                  marginTop: 16,
                }}
              >
                {!isInBattle && (
                  <button
                    type="button"
                    style={actionStyle}
                    onClick={handleReadyToggle}
                  >
                    <CheckCircle2 size={16} />
                    {isReady ? "CANCEL READY" : "I'M READY"}
                  </button>
                )}

                {isInBattle && room.players.length === 2 && (
                  <button
                    type="button"
                    style={actionStyle}
                    onClick={handleAttack}
                  >
                    <Swords size={16} />
                    ATTACK OPPONENT (-10 HP)
                  </button>
                )}

                {isInBattle && (
                  <span
                    style={{
                      alignSelf: "center",
                      color: "#9bffa3",
                      fontSize: 13,
                    }}
                  >
                    BATTLE IN PROGRESS
                  </span>
                )}
              </div>

              {room.status === "finished" && battleWinner && (
                <h3
                  style={{ color: "#9bffa3", marginBottom: 0 }}
                >
                  {battleWinner.winnerId === socket.id
                    ? "VICTORY!"
                    : `${battleWinner.winnerName} WINS!`}
                </h3>
              )}
            </div>
          )}

          {multiplayerMessage && (
            <p
              role="status"
              style={{
                margin: "16px 0 0",
                color: "#9bffa3",
                fontSize: 13,
              }}
            >
              {multiplayerMessage}
            </p>
          )}

          {multiplayerError && (
            <p
              role="alert"
              style={{
                margin: "12px 0 0",
                color: "#ff9b9b",
                fontSize: 13,
              }}
            >
              {multiplayerError}
            </p>
          )}

          <p
            style={{
              margin: "16px 0 0",
              color: "#718574",
              fontSize: 11,
            }}
          >
            Local testing: both players can test on this computer
            using separate browser tabs. Friends on other computers
            will need the server deployed or network access configured.
          </p>
        </section>
      )}

      <section className="dashboard">
        <div className="section-heading">
          <div>
            <p className="eyebrow">ALIEN DATABASE / 001—{String(aliens.length).padStart(3, "0")}</p>
            <h2>
              Choose Your <span>Alien</span>
            </h2>
          </div>

          <button className="reset-button" onClick={resetOmnitrix}>
            <RotateCcw size={15} />
            RESET
          </button>
        </div>

        <div className="main-layout">
          <section className="dial-section">
            <div className="dial-label">
              <span>OMNITRIX ALIEN SELECTOR</span>
              <span className="dial-coordinates">
                {String(selectedIndex + 1).padStart(2, "0")} / {String(aliens.length).padStart(2, "0")}
              </span>
            </div>

            <AlienWheel
              aliens={aliens}
              selectedIndex={selectedIndex}
              onSelect={selectAlien}
            />

            <div className="dial-controls">
              <button
                className="round-control"
                onClick={() => selectAlien(selectedIndex - 1)}
                aria-label="Previous alien"
              >
                <ChevronLeft />
              </button>

              <button
                className={`transform-button ${
                  isTransformed ? "revert" : ""
                }`}
                onClick={transform}
                disabled={!isPowered || isTransforming}
              >
                {isTransforming ? (
                  <>
                    <Activity size={19} className="spin-icon" />
                    TRANSFORMING...
                  </>
                ) : isTransformed ? (
                  <>
                    <RotateCcw size={19} />
                    REVERT FORM
                  </>
                ) : (
                  <>
                    <Zap size={19} fill="currentColor" />
                    TRANSFORM
                  </>
                )}
              </button>

              <button
                className="round-control"
                onClick={() => selectAlien(selectedIndex + 1)}
                aria-label="Next alien"
              >
                <ChevronRight />
              </button>
            </div>

            <div className="transform-status">
              <span
                className={`status-dot ${
                  isTransformed ? "transformed-dot" : ""
                }`}
              />

              {isTransforming
                ? "DNA SEQUENCE ACTIVATING"
                : isTransformed
                  ? `TRANSFORMED: ${alien.name.toUpperCase()}`
                  : "AWAITING TRANSFORMATION"}
            </div>
          </section>

          <aside className="alien-details panel">
            <div className="panel-heading">
              <span>ALIEN PROFILE</span>
              <Shield size={16} />
            </div>

            <div className="profile-content">
              <div className="alien-type">
                <span className="type-line" />
                {alien.type} CLASS
              </div>

              <h2 className="alien-title">{alien.name}</h2>
              <p className="alien-description">
                {alien.description}
              </p>

              <div className="identity-grid">
                <div className="identity-item">
                  <span>SPECIES</span>
                  <strong>{alien.species}</strong>
                </div>

                <div className="identity-item">
                  <span>HOME PLANET</span>
                  <strong>{alien.home}</strong>
                </div>
              </div>

              <div className="detail-divider" />

              <div className="abilities-heading">
                <Cpu size={15} />
                <span>KNOWN ABILITIES</span>
              </div>

              <div className="ability-list">
                {alien.abilities.map((ability) => (
                  <div className="ability-item" key={ability}>
                    <span className="ability-check">+</span>
                    {ability}
                  </div>
                ))}
              </div>

              <div className="detail-divider" />

              <div className="stats-heading">
                <span>POWER ANALYSIS</span>
                <Activity size={15} />
              </div>

              {Object.entries(alien.stats).map(([stat, value]) => (
                <div className="stat-row" key={stat}>
                  <div className="stat-label">
                    <span>{stat.toUpperCase()}</span>
                    <strong>{value}%</strong>
                  </div>

                  <div className="stat-track">
                    <motion.div
                      className="stat-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${value}%` }}
                      transition={{ duration: 0.5 }}
                      style={{ backgroundColor: alien.color }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>

        <footer className="bottom-bar">
          <div>
            <span className="footer-mark">X</span> OMNITRIX X
            <span className="footer-muted"> / ALIEN SYSTEM</span>
          </div>

          <div className="footer-center">
            DNA SIGNATURE:{" "}
            <strong>{alien.name.toUpperCase()}</strong>
          </div>

          <button
            className={`power-button ${isPowered ? "on" : ""}`}
            onClick={() => {
              setIsPowered(!isPowered);
              setIsTransformed(false);
              setIsTransforming(false);
            }}
          >
            <Power size={15} />
            {isPowered ? "POWER ON" : "POWER OFF"}
          </button>
        </footer>
      </section>

      <AnimatePresence>
        {isTransforming && (
          <motion.div
            className="transform-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="transform-flash"
              initial={{ scale: 0.2, opacity: 0 }}
              animate={{
                scale: 1.5,
                opacity: [0, 1, 0],
              }}
              transition={{ duration: 1.8 }}
              style={{
                borderColor: alien.color,
                boxShadow: `0 0 100px ${alien.color}`,
              }}
            />

            <motion.div
              className="transform-message"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
            >
              <Zap size={34} />
              <h2>DNA TRANSFORMATION</h2>
              <p>
                ACTIVATING {alien.name.toUpperCase()} DNA...
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}

export default App;
