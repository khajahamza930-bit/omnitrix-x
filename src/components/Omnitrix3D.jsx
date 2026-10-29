
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import "../styles/omnitrix.css";

export default function Omnitrix3D({ onOpen }) {
  const [opening, setOpening] = useState(false);

  const handleOpen = () => {
    if (opening) return;

    setOpening(true);

    setTimeout(() => {
      onOpen?.();
    }, 1800);
  };

  return (
    <main className="omnitrix-intro">
      <div className="omnitrix-atmosphere" />

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
            <p className="system-label">ALIEN TECHNOLOGY DETECTED</p>
            <h1>OMNITRIX <span>X</span></h1>
            <p className="system-subtitle">
              YOUR NEXT TRANSFORMATION AWAITS
            </p>

            <button
              className="activate-omnitrix"
              onClick={handleOpen}
            >
              <span>⏻</span> ACTIVATE OMNITRIX
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
          <span className="loading-dot" />
          INITIALIZING ALIEN INTERFACE
        </motion.div>
      )}
    </main>
  );
}
