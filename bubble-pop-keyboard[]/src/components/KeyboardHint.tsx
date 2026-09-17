import { useState, useEffect, useCallback } from "react";
import { Snackbar, Alert, IconButton } from "@mui/material";

const STORAGE_KEY = "bubble_pop_hint_dismissed";

export default function KeyboardHint(): React.ReactElement {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      const timer = setTimeout(() => setOpen(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = useCallback(() => {
    setOpen(false);
    localStorage.setItem(STORAGE_KEY, "1");
  }, []);

  return (
    <Snackbar open={open} autoHideDuration={3000} onClose={handleClose} anchorOrigin={{ vertical: "top", horizontal: "center" }} sx={{ position: "fixed", top: 24, zIndex: 200 }}>
      <Alert severity="info" variant="filled" onClose={handleClose}
        action={<IconButton size="small" color="inherit" onClick={handleClose}>{"\u2715"}</IconButton>}
        sx={{ backgroundColor: "rgba(30, 20, 60, 0.95)", backdropFilter: "blur(12px)", border: "1px solid rgba(123, 47, 255, 0.3)", color: "#e0d0ff", fontFamily: "inherit", "& .MuiAlert-icon": { color: "#7b2fff" } }}
        icon={false}>
        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>{"\u2328\uFE0F"}</span>
          {"\u8BD5\u8BD5\u6572\u4F60\u7684\u952E\u76D8"}
        </span>
      </Alert>
    </Snackbar>
  );
}
