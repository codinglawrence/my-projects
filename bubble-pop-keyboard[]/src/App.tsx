import { useState, useCallback } from "react";
import { Container, Box } from "@mui/material";
import { useAudioEngine } from "./hooks/useAudioEngine";
import type { AudioEngineAPI } from "./hooks/useAudioEngine";
import BubbleKeyboard from "./components/BubbleKeyboard";
import PopCounter from "./components/PopCounter";
import KeyboardHint from "./components/KeyboardHint";
import { CookieAnn } from "./components/DisneyCharacters";
import { LinaBell } from "./components/DisneyCharacters";

export default function App(): React.ReactElement {
  const audioEngine: AudioEngineAPI = useAudioEngine();
  const [popCount, setPopCount] = useState(0);

  const handlePopCountChange = useCallback((delta: number): void => {
    setPopCount((prev) => prev + delta);
  }, []);

  return (
    <Container
      maxWidth={false}
      disableGutters
      sx={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "transparent",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* 标题 */}
      <Box sx={{ position: "fixed", top: 20, left: 0, right: 0, textAlign: "center", pointerEvents: "none", zIndex: 0 }}>
        <Box component="span" sx={{ display: "inline-flex", alignItems: "center", gap: "8px", fontSize: "13px", letterSpacing: "6px", textTransform: "uppercase", fontWeight: 300, color: "rgba(180, 140, 100, 0.45)" }}>
          <span style={{ fontSize: "20px" }}>🪄</span> Magic Bubble Keys
          <span style={{ fontSize: "16px" }}>✨</span>
        </Box>
      </Box>

      {/* 玲娜贝儿 — 左上角 SVG 角色 */}
      <Box sx={{ position: "fixed", top: "16%", left: "5%", pointerEvents: "none", zIndex: 0, animation: "charaBounce1 3s ease-in-out infinite", filter: "drop-shadow(0 6px 16px rgba(242, 167, 179, 0.4))", "@keyframes charaBounce1": { "0%,100%": { transform: "translateY(0) rotate(-3deg)" }, "50%": { transform: "translateY(-10px) rotate(3deg)" } } }}>
        <LinaBell size={90} />
      </Box>

      {/* 饼饼 Cookie Ann — 右上角 SVG 角色 */}
      <Box sx={{ position: "fixed", top: "13%", right: "5%", pointerEvents: "none", zIndex: 0, animation: "charaBounce2 3.5s ease-in-out infinite", filter: "drop-shadow(0 6px 16px rgba(253, 183, 80, 0.4))", "@keyframes charaBounce2": { "0%,100%": { transform: "translateY(0) rotate(3deg)" }, "50%": { transform: "translateY(-12px) rotate(-3deg)" } } }}>
        <CookieAnn size={90} />
      </Box>

      {/* 浮动魔法星光 */}
      {["✨", "⭐", "💫", "🌟"].map((e, i) => {
        const ps = [{ top: "8%", left: "38%" }, { top: "68%", left: "22%" }, { top: "72%", right: "20%" }, { top: "10%", right: "35%" }];
        const p = ps[i]!;
        return (
          <Box key={`deco-${i}`} sx={{ position: "fixed", ...p, fontSize: "16px", opacity: 0.16, pointerEvents: "none", zIndex: 0, animation: `drift${i % 3 + 1} ${12 + i * 3}s ease-in-out infinite`, "@keyframes drift1": { "0%,100%": { transform: "translate(0,0) rotate(0deg)" }, "25%": { transform: "translate(30px,-40px) rotate(90deg)" }, "50%": { transform: "translate(-15px,-20px) rotate(180deg)" }, "75%": { transform: "translate(-35px,-50px) rotate(270deg)" } }, "@keyframes drift2": { "0%,100%": { transform: "translate(0,0) rotate(0deg)" }, "33%": { transform: "translate(-40px,-25px) rotate(-120deg)" }, "66%": { transform: "translate(20px,-45px) rotate(-240deg)" } }, "@keyframes drift3": { "0%,100%": { transform: "translate(0,0) rotate(0deg)" }, "50%": { transform: "translate(35px,-35px) rotate(180deg)" } } }}>
            {e}
          </Box>
        );
      })}

      <BubbleKeyboard audioEngine={audioEngine} onPopCountChange={handlePopCountChange} />
      <PopCounter count={popCount} />
      <KeyboardHint />
    </Container>
  );
}

