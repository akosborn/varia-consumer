/** A single vehicle ("threat") detected by the radar. */
export interface RadarTarget {
  id: number;
  distanceMeters: number;
  relativeSpeedMetersPerSecond: number;
  isApproaching: boolean;
  timestamp: number;
}

/** Connection lifecycle of the Varia device. */
export type ConnectionStatus =
  | 'idle'
  | 'scanning'
  | 'connecting'
  | 'connected'
  | 'reconnecting';

/** Aggregate state surfaced to the UI. */
export interface VariaDeviceState {
  status: ConnectionStatus;
  connected: boolean;
  batteryPercent?: number;
  targets: RadarTarget[];
  deviceName?: string;
  deviceId?: string;
  error?: string;
}

/** A device discovered during scanning. */
export interface BLEDevice {
  id: string;
  name: string | null;
  rssi?: number;
}
