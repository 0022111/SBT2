import { useState } from "react";
import {
  Box,
  Typography,
  IconButton,
  Paper,
  Slider,
  Chip,
  Button,
  AppBar,
  Toolbar,
  LinearProgress,
  Switch,
  FormControlLabel,
  Divider,
  Collapse,
} from "@mui/material";
import BluetoothConnectedIcon from "@mui/icons-material/BluetoothConnected";
import PowerSettingsNewIcon from "@mui/icons-material/PowerSettingsNew";
import BatteryFullIcon from "@mui/icons-material/BatteryFull";
import Battery60Icon from "@mui/icons-material/Battery60";
import Battery20Icon from "@mui/icons-material/Battery20";
import BoltIcon from "@mui/icons-material/Bolt";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import { useBluetooth } from "../providers/BluetoothProvider";
import { useDeviceStatus } from "../hooks/useDeviceStatus";

function BatteryIcon({ level }: { level: number }) {
  if (level > 60) return <BatteryFullIcon />;
  if (level > 20) return <Battery60Icon />;
  return <Battery20Icon />;
}

function batteryColor(level: number): string {
  if (level > 60) return "#4caf50";
  if (level > 20) return "#ff9800";
  return "#f44336";
}

export function Dashboard() {
  const { disconnect, deviceInfo } = useBluetooth();
  const {
    status,
    displayTargetTemp,
    displayBoostDelta,
    displaySuperBoostDelta,
    effectiveTemp,
    setTargetTemp,
    setBoostTemp,
    setSuperBoostTemp,
    setHeaterMode,
    setIsCelsius,
    setAutoShutdownTimer,
    setChargeCurrentOptimization,
    setChargeVoltageLimit,
    setPermanentBluetooth,
  } = useDeviceStatus();

  const [showSettings, setShowSettings] = useState(false);
  const [pendingTemp, setPendingTemp] = useState<number | null>(null);

  if (!status) {
    return (
      <Box sx={{ p: 3, textAlign: "center" }}>
        <Typography color="text.secondary">
          Waiting for device data...
        </Typography>
        <LinearProgress sx={{ mt: 2 }} />
      </Box>
    );
  }

  const unit = status.isCelsius ? "C" : "F";
  const minTemp = status.isCelsius ? 40 : 104;
  const maxTemp = status.isCelsius ? 210 : 410;
  const battery = status.batteryLevel ?? 0;
  const tempDisplay = pendingTemp ?? displayTargetTemp;

  return (
    <Box sx={{ pb: 10 }}>
      {/* Top Bar */}
      <AppBar position="static" color="transparent" elevation={0}>
        <Toolbar>
          <BluetoothConnectedIcon color="primary" sx={{ mr: 1 }} />
          <Typography variant="body1" sx={{ flexGrow: 1 }}>
            {deviceInfo.name || "Device"}
          </Typography>
          <Chip
            icon={<BatteryIcon level={battery} />}
            label={`${battery}%`}
            size="small"
            sx={{
              mr: 1,
              bgcolor: `${batteryColor(battery)}22`,
              color: batteryColor(battery),
              fontWeight: 600,
            }}
          />
          {status.isCharging && (
            <BoltIcon sx={{ color: "#ff9800", fontSize: 20 }} />
          )}
          <IconButton onClick={disconnect} size="small" sx={{ ml: 1 }}>
            <PowerSettingsNewIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* Main Temperature Display */}
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography
          variant="h1"
          fontWeight={800}
          sx={{
            fontSize: "5rem",
            color: status.isHeating ? "warning.main" : "text.primary",
            transition: "color 0.3s",
          }}
        >
          {tempDisplay}
        </Typography>
        <Typography variant="h6" color="text.secondary">
          Target ({unit})
        </Typography>
        {status.heaterMode !== null && status.heaterMode > 1 && (
          <Typography variant="body2" color="warning.main">
            Effective: {effectiveTemp} {unit} (
            {status.heaterMode === 2 ? "Boost" : "Super Boost"})
          </Typography>
        )}
        {status.setpointReached && (
          <Chip label="Target Reached" color="success" size="small" sx={{ mt: 1 }} />
        )}
      </Box>

      {/* Temperature Slider */}
      <Paper sx={{ mx: 2, p: 3, borderRadius: 3 }} elevation={2}>
        <Typography variant="overline" color="text.secondary">
          Temperature
        </Typography>
        <Slider
          value={pendingTemp ?? displayTargetTemp}
          min={minTemp}
          max={maxTemp}
          step={1}
          onChange={(_, val) => setPendingTemp(val as number)}
          onChangeCommitted={(_, val) => {
            const v = val as number;
            setPendingTemp(null);
            // Convert back to Celsius if in Fahrenheit mode
            const celsius = status.isCelsius
              ? v
              : Math.round((v - 32) / 1.8);
            setTargetTemp(celsius);
          }}
          valueLabelDisplay="auto"
          sx={{ mt: 1 }}
        />
        <Box sx={{ display: "flex", justifyContent: "space-between" }}>
          <Typography variant="caption" color="text.secondary">
            {minTemp}{unit}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {maxTemp}{unit}
          </Typography>
        </Box>
      </Paper>

      {/* Heater Control */}
      <Paper sx={{ mx: 2, mt: 2, p: 2, borderRadius: 3 }} elevation={2}>
        <Typography variant="overline" color="text.secondary">
          Heater
        </Typography>
        <Box sx={{ display: "flex", gap: 1, mt: 1 }}>
          <Button
            variant={status.heaterMode === 0 ? "contained" : "outlined"}
            color="inherit"
            size="small"
            onClick={() => setHeaterMode(0)}
            sx={{ flex: 1 }}
          >
            Off
          </Button>
          <Button
            variant={(status.heaterMode ?? 0) > 0 ? "contained" : "outlined"}
            color="warning"
            size="small"
            onClick={() => setHeaterMode((status.heaterMode ?? 0) > 0 ? 0 : 1)}
            sx={{ flex: 1 }}
          >
            {status.heaterMode === 2 ? "Boost" : status.heaterMode === 3 ? "Super Boost" : "Heat"}
          </Button>
        </Box>
      </Paper>

      {/* Boost Delta Cards — always visible, click to activate mode */}
      <Box sx={{ mx: 2, mt: 2, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 2 }}>
        {[
          {
            mode: 2,
            label: "Boost",
            delta: displayBoostDelta,
            adjust: (d: number) => setBoostTemp(Math.max(0, (status.boostTemp ?? 0) + d)),
          },
          {
            mode: 3,
            label: "Super Boost",
            delta: displaySuperBoostDelta,
            adjust: (d: number) => setSuperBoostTemp(Math.max(0, (status.superBoostTemp ?? 0) + d)),
          },
        ].map(({ mode, label, delta, adjust }) => {
          const active = status.heaterMode === mode;
          return (
            <Paper
              key={mode}
              elevation={active ? 4 : 2}
              onClick={() => {
                if (active) setHeaterMode(1);
                else setHeaterMode(mode);
              }}
              sx={{
                p: 2,
                borderRadius: 3,
                textAlign: "center",
                cursor: "pointer",
                border: active ? "2px solid" : "2px solid transparent",
                borderColor: active ? "warning.main" : "transparent",
                bgcolor: active ? "rgba(255,152,0,0.08)" : "background.paper",
                transition: "all 0.2s",
                "&:hover": { borderColor: "warning.main", bgcolor: "rgba(255,152,0,0.05)" },
              }}
            >
              <Typography variant="overline" color="text.secondary">
                {label}
              </Typography>
              <Typography
                variant="h5"
                fontWeight={700}
                sx={{ color: "warning.main", my: 0.5 }}
              >
                +{delta}°{unit}
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center", gap: 1 }}>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={(e) => { e.stopPropagation(); adjust(-1); }}
                  sx={{ minWidth: 36, px: 0 }}
                >
                  −
                </Button>
                <Button
                  size="small"
                  variant="outlined"
                  color="warning"
                  onClick={(e) => { e.stopPropagation(); adjust(1); }}
                  sx={{ minWidth: 36, px: 0 }}
                >
                  +
                </Button>
              </Box>
            </Paper>
          );
        })}
      </Box>

      {/* Battery Bar */}
      <Paper sx={{ mx: 2, mt: 2, p: 2, borderRadius: 3 }} elevation={2}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <Typography variant="overline" color="text.secondary">
            Battery
          </Typography>
          <Typography
            variant="body2"
            fontWeight={600}
            sx={{ color: batteryColor(battery) }}
          >
            {battery}%
          </Typography>
        </Box>
        <LinearProgress
          variant="determinate"
          value={battery}
          sx={{
            mt: 1,
            height: 8,
            borderRadius: 4,
            bgcolor: "grey.800",
            "& .MuiLinearProgress-bar": {
              bgcolor: batteryColor(battery),
              borderRadius: 4,
            },
          }}
        />
      </Paper>

      {/* Settings */}
      <Paper sx={{ mx: 2, mt: 2, borderRadius: 3 }} elevation={2}>
        <Button
          fullWidth
          onClick={() => setShowSettings(!showSettings)}
          endIcon={showSettings ? <ExpandLessIcon /> : <ExpandMoreIcon />}
          startIcon={<SettingsIcon />}
          sx={{ justifyContent: "flex-start", px: 2, py: 1.5, textTransform: "none" }}
        >
          Settings
        </Button>
        <Collapse in={showSettings}>
          <Box sx={{ px: 2, pb: 2 }}>
            <Divider sx={{ mb: 1 }} />
            <FormControlLabel
              control={
                <Switch
                  checked={status.isCelsius}
                  onChange={(_, v) => setIsCelsius(v)}
                />
              }
              label={`Units: ${status.isCelsius ? "Celsius" : "Fahrenheit"}`}
            />
            <FormControlLabel
              control={
                <Switch
                  checked={status.chargeCurrentOptimization}
                  onChange={(_, v) => setChargeCurrentOptimization(v)}
                />
              }
              label="Eco Charge Current"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={status.chargeVoltageLimit}
                  onChange={(_, v) => setChargeVoltageLimit(v)}
                />
              }
              label="Eco Charge Voltage"
            />
            <FormControlLabel
              control={
                <Switch
                  checked={status.permanentBluetooth}
                  onChange={(_, v) => setPermanentBluetooth(v)}
                />
              }
              label="Permanent Bluetooth"
            />
            <Divider sx={{ my: 1 }} />
            <Typography variant="overline" color="text.secondary">
              Auto-Shutdown (seconds)
            </Typography>
            <Slider
              value={status.autoShutdownTimer ?? 0}
              min={0}
              max={600}
              step={30}
              onChangeCommitted={(_, val) =>
                setAutoShutdownTimer(val as number)
              }
              valueLabelDisplay="auto"
            />
          </Box>
        </Collapse>
      </Paper>
    </Box>
  );
}
