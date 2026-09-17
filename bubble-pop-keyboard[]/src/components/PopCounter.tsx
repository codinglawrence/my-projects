import { Chip } from "@mui/material";

interface PopCounterProps { count: number; }

export default function PopCounter({ count }: PopCounterProps): React.ReactElement {
  return (
    <Chip
      label={
        <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "16px" }}>{"\U0001F4A5"}</span>
          <span style={{ fontVariantNumeric: "tabular-nums", fontWeight: 700, minWidth: "3ch", textAlign: "center", transition: "transform 0.15s ease-out", display: "inline-block" }} key={count}>
            {count}
          </span>
        </span>
      }
      sx={{ position: "fixed", bottom: 24, right: 24, zIndex: 100, backgroundColor: "rgba(20, 20, 30, 0.85)", backdropFilter: "blur(8px)", border: "1px solid rgba(255, 110, 199, 0.25)", color: "#fff", fontSize: "14px", fontWeight: 600, px: 2, py: 0.5, borderRadius: "20px", "& .MuiChip-label": { px: 0 } }}
    />
  );
}
