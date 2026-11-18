import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Atom } from "lucide-react";
import "../styles/omnitrix.css";

export default function Omnitrix3D({ onOpen }) {
  const [opening, setOpening] = useState(false);
  const [powerState, setPowerState] = useState("online");

  const handleOpen = () => {
    if (opening) return;

    setOpening(true);
    setPowerState("initializing");

    setTimeout(() => {
      onOpen?.();
    }, 1800);
  };

  return (
    <main className="omnitrix-intro">
      <div className="omnitrix-atmosphere" />

      {/* Status bar */}
      <div style={{
        position: "absolute",
        top: "24px",
        left: "24px",
        right: "24px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        fontFamily: "var(--ox-font-mono)",
        fontSize: "10px",
        letterSpacing: "0.15em",
        color: "var(--ox-text-muted)",
        zIndex: 10
      }}>
        <span>OMNITRIX X // v2.0</span>
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ 
            width: "6px", 
            height: "6px", 
            background: "var(--ox-green)", 
            borderRadius: "50%",
            boxShadow: "0 0 6px var(--ox-green)"
          }} />
          {powerState.toUpperCase()}
        </span>
      </div>

      <motion.div
        className={`omnitrix-device ${opening ? "is-opening" : ""}`}
        animate={{
          rotateX: opening ? 0 : 9,
          rotateY: opening ? 0 : -8,
          scale: opening ? 1.08 : 1,
        }}
        transition={{ duration: 0.8, ease: "easeInOut" }}
      >
        <div className="watch-strap strap-top" />

        <div className="watch-body">
          <div className="watch-bezel">
            <div className="metal-rim">
              <div className="green-ring">
                <div className="omnitrix-screen">
                  <svg
                    viewBox="0 0 100 100"
                    className="hourglass-symbol"
                    aria-label="Omnitrix hourglass symbol"
                    role="img"
                  >
                    <path
                      d="M18 12 H82 L58 42 L82 88 H18 L42 58 Z"
                      fill="#050b07"
                    />
                    <path
                      d="M18 12 H82 L58 42 L82 88 H18 L42 58 Z"
                      fill="none"
                      stroke="#07130a"
                      strokeWidth="3"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="device-bolt bolt-one" />
            <div className="device-bolt bolt-two" />
            <div className="device-bolt bolt-three" />
            <div className="device-bolt bolt-four" />
          </div>
        </div>

        <div className="watch-strap strap-bottom" />
      </motion.div>

      <AnimatePresence>
        {!opening && (
          <motion.div
            className="omnitrix-intro-text"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
          >
            <div className="system-label" style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center", 
              gap: "8px",
              marginBottom: "16px"
            }}>
              <Atom size={14} />
              ALIEN TECHNOLOGY DETECTED
              <Atom size={14} />
            </div>
            <h1 style={{ 
              fontSize: "clamp(48px, 8vw, 96px)", 
              fontWeight: 900, 
              letterSpacing: "-0.02em",
              margin: "0 0 8px 0",
              background: "linear-gradient(180deg, #a6ff4d, #8bff3a)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text"
            }}>
              OMNITRIX <span style={{ color: "#8bff3a" }}>X</span>
            </h1>
            <p className="system-subtitle" style={{ 
              fontSize: "14px", 
              letterSpacing: "0.2em", 
              color: "var(--ox-text-secondary)",
              marginBottom: "40px"
            }}>
              YOUR NEXT TRANSFORMATION AWAITS
            </p>

            <button
              className="activate-omnitrix"
              onClick={handleOpen}
            >
              <Zap size={18} fill="currentColor" />
              ACTIVATE OMNITRIX
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {opening && (
        <motion.div
          className="opening-message"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <span className="loading-dot" style={{ 
            display: "flex", 
            gap: "6px",
            marginRight: "12px"
          }}>
            <span style={{ width: 8, height: 8, background: "var(--ox-green)", borderRadius: "50%", animation: "ox-pulse 1s ease-in-out infinite" }} />
            <span style={{ width: 8, height: 8, background: "var(--ox-green)", borderRadius: "50%", animation: "ox-pulse 1s ease-in-out infinite 0.3s" }} />
            <span style={{ width: 8, height: 8, background: "var(--ox-green)", borderRadius: "50%", animation: "ox-pulse 1s ease-in-out infinite 0.6s" }} />
          </span>
          INITIALIZING ALIEN INTERFACE
        </motion.div>
      )}
    </main>
  );
}