import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Zap,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Power,
  Activity,
  Atom,
  Users,
} from "lucide-react";

import aliens from "./data/aliens";
import Omnitrix3D from "./components/Omnitrix3D";
import AlienWheel from "./components/AlienWheel";
import AlienRoster from "./components/AlienRoster";
import AlienDossier from "./components/AlienDossier";
import FriendsPanel from "./components/FriendsPanel";
import "./styles/global.css";
import "./styles/console.css";

import {
  socket,
  createRoom,
  joinRoom,
  setReady as sendReady,
  selectAlien as sendAlienSelection,
  attack as sendAttack,
  leaveRoom as sendLeaveRoom,
} from "./multiplayer";

// turns 5 into 05
const pad = (number) => String(number).padStart(2, "0");

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
  const [selectedMoveId, setSelectedMoveId] = useState("");
  const [isBusy, setIsBusy] = useState(false);
  const [connected, setConnected] = useState(socket.connected);

  const alien = aliens[selectedIndex];
  const isInBattle = room?.status === "battle";

  const currentTurnPlayer = room?.players?.find(
    (player) => player.id === room.currentTurnPlayerId
  );

  const canAttack =
    isInBattle &&
    room?.currentTurnPlayerId === socket.id;

  const currentTurnName = currentTurnPlayer?.name || "Opponent";

  const myPlayer = room?.players?.find(
    (player) => player.id === socket.id
  );

  const availableMoves = myPlayer?.moves || [];

  const selectedMove =
    availableMoves.find((move) => move.id === selectedMoveId) ||
    availableMoves.find((move) => move.type === "basic") ||
    availableMoves[0] ||
    null;

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

      if (payload?.attackName && payload?.attackerId) {
        const attacker = payload.attackerId === socket.id
          ? "You"
          : payload.room?.players?.find(
              (player) => player.id === payload.attackerId
            )?.name || "Opponent";

        setMultiplayerMessage(
          `${attacker} used ${payload.attackName} for ${payload.damage} damage.`
        );
        setMultiplayerError("");
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

  // keeps the "server connected" badge up to date
  useEffect(() => {
    function handleConnect() {
      setConnected(true);
    }

    function handleDisconnect() {
      setConnected(false);
    }

    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);

    return () => {
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
    };
  }, []);

  // the left and right arrow keys browse the aliens (not while you type in a box)
  useEffect(() => {
    function handleKey(event) {
      if (showOmnitrixIntro) return;

      const tag = event.target?.tagName;
      if (tag === "INPUT" || tag === "SELECT" || tag === "TEXTAREA") return;

      if (event.key === "ArrowLeft") selectAlien(selectedIndex - 1);
      if (event.key === "ArrowRight") selectAlien(selectedIndex + 1);
    }

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  });

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
        playerName.trim() || "Player 1",
        alien.name
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
        playerName.trim() || "Player 2",
        alien.name
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

  async function handleAttack(moveId) {
    if (!moveId || !canAttack) return;

    setMultiplayerError("");

    const result = await sendAttack(moveId);

    if (!result?.success) {
      setMultiplayerError(
        result?.message || "Attack failed."
      );
      return;
    }

    setMultiplayerMessage(
      `${result.attackName} dealt ${result.damage} damage.`
    );
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
      className="ox-app"
      style={{ "--alien-color": alien.color }}
    >
      <div className="ox-wrap">
        <header className="ox-topbar">
          <div className="ox-brand">
            <div className="ox-brand__mark">
              <Atom size={22} aria-hidden="true" />
            </div>

            <div>
              <h1 className="ox-brand__name">
                OMNITRIX <span>X</span>
              </h1>
              <p className="ox-label">Alien transformation system</p>
            </div>
          </div>

          <div className="ox-status">
            <span className="ox-badge">
              <span className={isPowered ? "ox-dot" : "ox-dot ox-dot--off"} />
              {isPowered ? "System online" : "System offline"}
            </span>

            <button
              type="button"
              className="ox-btn"
              aria-expanded={showFriends}
              onClick={() => setShowFriends((current) => !current)}
            >
              <Users size={16} />
              {showFriends ? "Close friends" : "Play with friends"}
            </button>
          </div>
        </header>

        {showFriends && (
          <FriendsPanel
            connected={connected}
            myId={socket.id}
            room={room}
            playerName={playerName}
            onPlayerNameChange={setPlayerName}
            roomCodeInput={roomCodeInput}
            onRoomCodeChange={setRoomCodeInput}
            isBusy={isBusy}
            isReady={isReady}
            isInBattle={isInBattle}
            canAttack={canAttack}
            currentTurnName={currentTurnName}
            availableMoves={availableMoves}
            selectedMoveId={selectedMove?.id || ""}
            onMoveSelect={setSelectedMoveId}
            battleWinner={battleWinner}
            message={multiplayerMessage}
            error={multiplayerError}
            onCreate={handleCreateRoom}
            onJoin={handleJoinRoom}
            onReady={handleReadyToggle}
            onAttack={() => handleAttack(selectedMove?.id)}
            onLeave={handleLeaveRoom}
            onCopy={copyRoomCode}
            onClose={() => setShowFriends(false)}
          />
        )}

        <div className="ox-pagehead">
          <div>
            <p className="ox-label">
              Alien database / 001—{String(aliens.length).padStart(3, "0")}
            </p>
            <h2 className="ox-title">
              Choose your <span>alien</span>
            </h2>
          </div>

          <button type="button" className="ox-btn" onClick={resetOmnitrix}>
            <RotateCcw size={15} />
            Reset
          </button>
        </div>

        <div className="ox-console">
          <AlienRoster
            aliens={aliens}
            selectedIndex={selectedIndex}
            onSelect={selectAlien}
          />

          <div className="ox-center">
            <section className="ox-viewport ox-panel" aria-label="Alien selector">
              <div className="ox-panel__head">
                <span className="ox-label">Omnitrix alien selector</span>
                <span className="ox-counter">
                  {pad(selectedIndex + 1)} / {pad(aliens.length)}
                </span>
              </div>

              <div className="ox-viewport__stage">
                <AlienWheel
                  aliens={aliens}
                  selectedIndex={selectedIndex}
                  onSelect={selectAlien}
                />
              </div>
            </section>

            <div className="ox-actions">
              <button
                type="button"
                className="ox-btn ox-btn--icon"
                onClick={() => selectAlien(selectedIndex - 1)}
                aria-label="Previous alien"
              >
                <ChevronLeft />
              </button>

              <button
                type="button"
                className={
                  isTransformed
                    ? "ox-btn ox-btn--warn"
                    : "ox-btn ox-btn--primary"
                }
                onClick={transform}
                disabled={!isPowered || isTransforming}
              >
                {isTransforming ? (
                  <>
                    <Activity size={19} className="spin-icon" />
                    Transforming...
                  </>
                ) : isTransformed ? (
                  <>
                    <RotateCcw size={19} />
                    Revert form
                  </>
                ) : (
                  <>
                    <Zap size={19} fill="currentColor" />
                    Transform
                  </>
                )}
              </button>

              <button
                type="button"
                className="ox-btn ox-btn--icon"
                onClick={() => selectAlien(selectedIndex + 1)}
                aria-label="Next alien"
              >
                <ChevronRight />
              </button>
            </div>

            <p className="ox-state" role="status">
              <span className={isTransformed ? "ox-dot" : "ox-dot ox-dot--idle"} />
              {isTransforming
                ? "DNA sequence activating"
                : isTransformed
                  ? `Transformed: ${alien.name}`
                  : isPowered
                    ? "Awaiting transformation"
                    : "System offline"}
            </p>

            <p className="ox-hint">Tip: use the left and right arrow keys to browse the aliens.</p>
          </div>

          <AlienDossier alien={alien} />
        </div>

        <footer className="ox-footer">
          <span className="ox-label">
            DNA signature: <strong>{alien.name}</strong>
          </span>

          <button
            type="button"
            className="ox-btn"
            aria-pressed={isPowered}
            onClick={() => {
              setIsPowered(!isPowered);
              setIsTransformed(false);
              setIsTransforming(false);
            }}
          >
            <Power size={15} />
            {isPowered ? "Power on" : "Power off"}
          </button>
        </footer>
      </div>

      <AnimatePresence>
        {isTransforming && (
          <motion.div
            className="transform-overlay"
            role="status"
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