import { useBluetooth } from "./providers/BluetoothProvider";
import { ConnectionState } from "./utils/uuids";
import { ConnectScreen } from "./components/ConnectScreen";
import { Dashboard } from "./components/Dashboard";

function App() {
  const { connectionState } = useBluetooth();

  if (connectionState === ConnectionState.CONNECTED) {
    return <Dashboard />;
  }

  return <ConnectScreen />;
}

export default App;
