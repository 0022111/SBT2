import {
  Box,
  Button,
  Typography,
  Paper,
  CircularProgress,
  Chip,
} from "@mui/material";
import BluetoothSearchingIcon from "@mui/icons-material/BluetoothSearching";
import BluetoothDisabledIcon from "@mui/icons-material/BluetoothDisabled";
import BatteryUnknownIcon from "@mui/icons-material/BatteryUnknown";
import { useBluetooth } from "../providers/BluetoothProvider";
import { ConnectionState } from "../utils/uuids";
import { loadPersistedData } from "../utils/storage";

function formatTimeAgo(timestamp: number): string {
  const diff = Date.now() - timestamp;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function ConnectScreen() {
  const { connect, connectionState } = useBluetooth();
  const persisted = loadPersistedData();
  const isConnecting = connectionState === ConnectionState.CONNECTING;
  const isFailed = connectionState === ConnectionState.CONNECTION_FAILED;

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        bgcolor: "background.default",
        p: 3,
        gap: 3,
      }}
    >
      <Typography variant="h3" fontWeight={700} color="primary">
        SBT2
      </Typography>

      {persisted.lastDeviceName && (
        <Paper
          sx={{
            p: 2,
            bgcolor: "background.paper",
            textAlign: "center",
            minWidth: 250,
          }}
          elevation={2}
        >
          <Typography variant="body2" color="text.secondary" gutterBottom>
            Last connected
          </Typography>
          <Typography variant="h6">{persisted.lastDeviceName}</Typography>
          {persisted.lastBatteryLevel != null && (
            <Chip
              icon={<BatteryUnknownIcon />}
              label={`${persisted.lastBatteryLevel}% ${
                persisted.lastBatteryTimestamp
                  ? formatTimeAgo(persisted.lastBatteryTimestamp)
                  : ""
              }`}
              size="small"
              sx={{ mt: 1 }}
            />
          )}
        </Paper>
      )}

      <Button
        variant="contained"
        size="large"
        onClick={connect}
        disabled={isConnecting}
        startIcon={
          isConnecting ? (
            <CircularProgress size={20} color="inherit" />
          ) : (
            <BluetoothSearchingIcon />
          )
        }
        sx={{ px: 4, py: 1.5, borderRadius: 3 }}
      >
        {isConnecting ? "Connecting..." : "Connect Device"}
      </Button>

      {isFailed && (
        <Paper
          sx={{
            p: 2,
            bgcolor: "error.dark",
            color: "error.contrastText",
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <BluetoothDisabledIcon />
          <Typography variant="body2">
            Connection failed. Make sure your device is on and nearby.
          </Typography>
        </Paper>
      )}

      {!navigator.bluetooth && (
        <Paper
          sx={{
            p: 2,
            bgcolor: "warning.dark",
            color: "warning.contrastText",
            maxWidth: 350,
            textAlign: "center",
          }}
        >
          <Typography variant="body2">
            Web Bluetooth is not supported in this browser. Use Chrome on
            Android or desktop.
          </Typography>
        </Paper>
      )}
    </Box>
  );
}
