import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ThemeProvider, createTheme, CssBaseline } from "@mui/material";
import { BluetoothProvider } from "./providers/BluetoothProvider";
import App from "./App";

const darkTheme = createTheme({
  palette: {
    mode: "dark",
    primary: { main: "#7c4dff" },
    warning: { main: "#ff6d00" },
    background: {
      default: "#1a1a2e",
      paper: "#16213e",
    },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'Inter', 'Roboto', sans-serif",
  },
});

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <BluetoothProvider>
        <App />
      </BluetoothProvider>
    </ThemeProvider>
  </StrictMode>
);
