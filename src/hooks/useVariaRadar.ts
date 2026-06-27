import { useCallback, useEffect, useRef, useState } from 'react';
import { requestBlePermissions } from '../ble/permissions';
import { variaRadarManager } from '../ble/VariaRadarManager';
import { BLEDevice, VariaDeviceState } from '../ble/types';

const INITIAL_STATE: VariaDeviceState = {
  status: 'idle',
  connected: false,
  targets: [],
};

/**
 * React binding over {@link variaRadarManager}. Owns the {@link VariaDeviceState}
 * surfaced to the UI and exposes scan/connect/disconnect actions. Wires the
 * manager callbacks on mount and tears them down on unmount.
 */
export function useVariaRadar() {
  const [state, setState] = useState<VariaDeviceState>(INITIAL_STATE);
  const [devices, setDevices] = useState<BLEDevice[]>([]);
  const [permissionDenied, setPermissionDenied] = useState(false);
  // Avoid clearing targets that arrive faster than React batches state.
  const targetsRef = useRef(state.targets);

  useEffect(() => {
    const manager = variaRadarManager;

    manager.onTargets = targets => {
      targetsRef.current = targets;
      setState(prev => ({ ...prev, targets }));
    };

    manager.onConnectionChange = device => {
      setState(prev => ({
        ...prev,
        connected: device != null,
        deviceName: device?.name ?? prev.deviceName,
        deviceId: device?.id ?? prev.deviceId,
        targets: device ? prev.targets : [],
      }));
    };

    manager.onStatusChange = status => {
      setState(prev => ({
        ...prev,
        status: status === 'disconnected' ? 'idle' : status,
        connected: status === 'connected',
      }));
    };

    manager.onError = message => {
      setState(prev => ({ ...prev, error: message }));
    };

    return () => {
      manager.onTargets = null;
      manager.onConnectionChange = null;
      manager.onStatusChange = null;
      manager.onError = null;
    };
  }, []);

  const scan = useCallback(async () => {
    const granted = await requestBlePermissions();
    if (!granted) {
      setPermissionDenied(true);
      return;
    }
    setPermissionDenied(false);
    setDevices([]);
    setState(prev => ({ ...prev, status: 'scanning', error: undefined }));
    await variaRadarManager.startScan(device => {
      setDevices(prev =>
        prev.some(d => d.id === device.id) ? prev : [...prev, device],
      );
    });
  }, []);

  const stopScan = useCallback(() => {
    variaRadarManager.stopScan();
    setState(prev =>
      prev.status === 'scanning' ? { ...prev, status: 'idle' } : prev,
    );
  }, []);

  const connect = useCallback(async (deviceId: string) => {
    variaRadarManager.stopScan();
    await variaRadarManager.connect(deviceId);
  }, []);

  const disconnect = useCallback(async () => {
    await variaRadarManager.disconnect();
    setState(prev => ({ ...prev, targets: [] }));
  }, []);

  return {
    state,
    devices,
    permissionDenied,
    scan,
    stopScan,
    connect,
    disconnect,
  };
}
