import { type ReactNode, useEffect } from "react";
import { motion } from "framer-motion";

interface Props {
  children: ReactNode;
}

export default function PageWrapper({ children }: Props) {
  useEffect(() => {
    // Snap scroll to top instantly on new page mount
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  return (
    <>
      {/*
        THE REVEAL (Entering)
        Fired when the new page is loaded.
        A solid black block pulling upwards into a liquid bell-curve, snapping off the top of the screen.
      */}
      <motion.svg
        style={{ position: "fixed", pointerEvents: "none", zIndex: 10001, width: "100vw", height: "100vh", top: 0, left: 0 }}
        viewBox="0 0 100 100" preserveAspectRatio="none"
        initial={{ opacity: 1 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0 } }}
      >
        {/* Subtle Typography flashing gracefully in the liquid void */}
        <motion.foreignObject
            x="0" y="45" width="100" height="10"
            initial={{ opacity: 1, y: 0 }}
            animate={{ opacity: 0, y: -10, transition: { duration: 0.6, ease: [0.76, 0, 0.24, 1], delay: 0.1 } }}
            exit={{ opacity: 0, transition: { duration: 0 } }}
            style={{ display: "flex", justifyContent: "center", alignItems: "center" }}
        >
            <div style={{ fontFamily: "'Jost', sans-serif", fontSize: "3px", letterSpacing: "0.5em", color: "white", textAlign: "center", textTransform: "uppercase" }}>
                DVSK SYNDICATE
            </div>
        </motion.foreignObject>

        <motion.path
          initial={{ d: "M 0 0 L 100 0 L 100 100 Q 50 100 0 100 Z" }}
          animate={{
            d: [
              "M 0 0 L 100 0 L 100 100 Q 50 100 0 100 Z",
              "M 0 0 L 100 0 L 100 50 Q 50 120 0 50 Z",
              "M 0 0 L 100 0 L 100 0 Q 50 0 0 0 Z"
            ],
            transition: { duration: 1.1, ease: [0.85, 0, 0.15, 1], delay: 0.1 }
          }}
          exit={{ d: "M 0 0 L 100 0 L 100 0 Q 50 0 0 0 Z" }}
          fill="#080808"
        />
      </motion.svg>

      {/*
        THE ENVELOPE (Exiting)
        Fired when leaving the active page.
        A liquid bell curve shooting up from the bottom of the screen to crash down and cover it.
      */}
      <motion.svg
        style={{ position: "fixed", pointerEvents: "none", zIndex: 10000, width: "100vw", height: "100vh", top: 0, left: 0 }}
        viewBox="0 0 100 100" preserveAspectRatio="none"
        initial={{ opacity: 0 }}
        animate={{ opacity: 0, transition: { duration: 0 } }}
        exit={{ opacity: 1, transition: { duration: 0 } }}
      >
        {/* Layer 1: Luxury Dark Violet Wave */}
        <motion.path
          initial={{ d: "M 0 100 Q 50 100 100 100 L 100 100 L 0 100 Z" }}
          animate={{ d: "M 0 100 Q 50 100 100 100 L 100 100 L 0 100 Z" }}
          exit={{
            d: [
              "M 0 100 Q 50 100 100 100 L 100 100 L 0 100 Z",
              "M 0 60 Q 50 -10 100 60 L 100 100 L 0 100 Z",
              "M 0 0 Q 50 0 100 0 L 100 100 L 0 100 Z"
            ],
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0 }
          }}
          fill="#2D0060"
        />
        {/* Layer 2: Blackout Void Wave */}
        <motion.path
          initial={{ d: "M 0 100 Q 50 100 100 100 L 100 100 L 0 100 Z" }}
          animate={{ d: "M 0 100 Q 50 100 100 100 L 100 100 L 0 100 Z" }}
          exit={{
            d: [
              "M 0 100 Q 50 100 100 100 L 100 100 L 0 100 Z",
              "M 0 60 Q 50 -10 100 60 L 100 100 L 0 100 Z",
              "M 0 0 Q 50 0 100 0 L 100 100 L 0 100 Z"
            ],
            transition: { duration: 0.8, ease: [0.76, 0, 0.24, 1], delay: 0.1 }
          }}
          fill="#080808"
        />
      </motion.svg>

      {/* Deep Cinematic Gliding Content Wrapper */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85, y: 50, filter: "blur(18px)" }}
        animate={{ opacity: 1, scale: 1, y: 0, filter: "blur(0px)" }}
        exit={{ opacity: 0, scale: 0.85, y: -50, filter: "blur(18px)" }}
        transition={{ duration: 1.2, ease: [0.76, 0, 0.24, 1], delay: 0.3 }}
        style={{ transformOrigin: "center" }}
      >
        {children}
      </motion.div>
    </>
  );
}
