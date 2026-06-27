import {
  BleManager,
  Device,
  State,
  Subscription,
} from 'react-native-ble-plx';
import { base64ToBytes } from './base64';
import {
  VARIA_NAME_HINTS,
  VARIA_RADAR_CHARACTERISTIC,
  VARIA_RADAR_SERVICE,
} from './constants';
import { parseRadarMeasurement } from './radarParser';
import { BLEDevice, RadarTarget } from './types';

type TargetsListener = (targets: RadarTarget[]) => void;
type ConnectionListener = (device: BLEDevice | null) => void;
type StatusListener = (
  status: 'connecting' | 'connected' | 'reconnecting' | 'disconnected',
) => void;
type ErrorListener = (message: string) => void;

const RECONNECT_DELAYS_MS = [1000, 2000, 4000, 8000, 15000];

/**
 * Wraps {@link BleManager} with Varia-specific scanning, connection,
 * radar-notification handling and auto-reconnect. A single shared instance is
 * exported as {@link variaRadarManager}.
 */
export class VariaRadarManager {
  private manager = new BleManager();
  private monitorSub: Subscription | null = null;
  private disconnectSub: Subscription | null = null;
  private connectedDevice: Device | null = null;
  private lastDeviceId: string | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private reconnectAttempt = 0;
  /** True while the user intends to stay connected (enables auto-reconnect). */
  private wantConnection = false;

  onTargets: TargetsListener | null = null;
  onConnectionChange: ConnectionListener | null = null;
  onStatusChange: StatusListener | null = null;
  onError: ErrorListener | null = null;

  /** Wait until the adapter is powered on (resolves immediately if already). */
  private waitForPoweredOn(): Promise<void> {
    return new Promise(resolve => {
      const sub = this.manager.onStateChange(state => {
        if (state === State.PoweredOn) {
          sub.remove();
          resolve();
        }
      }, true);
    });
  }

  private matchesVaria(device: Device): boolean {
    const services = device.serviceUUIDs ?? [];
    if (
      services.some(s => s.toLowerCase() === VARIA_RADAR_SERVICE.toLowerCase())
    ) {
      return true;
    }
    const name = (device.name ?? device.localName ?? '').toLowerCase();
    return name.length > 0 && VARIA_NAME_HINTS.some(hint => name.includes(hint));
  }

  /**
   * Scan for nearby Varia devices. Invokes `onDevice` for each unique match.
   * Filtering by service UUID is unreliable on some Android stacks, so we scan
   * with no UUID filter and match in {@link matchesVaria}.
   */
  async startScan(onDevice: (device: BLEDevice) => void): Promise<void> {
    await this.waitForPoweredOn();
    const seen = new Set<string>();

    this.manager.startDeviceScan(null, { allowDuplicates: false }, (error, device) => {
      if (error) {
        this.onError?.(error.message);
        return;
      }
      if (!device || seen.has(device.id) || !this.matchesVaria(device)) {
        return;
      }
      seen.add(device.id);
      onDevice({
        id: device.id,
        name: device.name ?? device.localName ?? null,
        rssi: device.rssi ?? undefined,
      });
    });
  }

  stopScan(): void {
    this.manager.stopDeviceScan();
  }

  /** Connect to a device and begin streaming radar measurements. */
  async connect(deviceId: string): Promise<void> {
    this.stopScan();
    this.wantConnection = true;
    this.lastDeviceId = deviceId;
    this.onStatusChange?.('connecting');

    try {
      const device = await this.manager.connectToDevice(deviceId, {
        requestMTU: 64,
      });
      await device.discoverAllServicesAndCharacteristics();
      this.connectedDevice = device;
      this.reconnectAttempt = 0;

      this.subscribeToRadar(device);
      this.subscribeToDisconnect(device);

      this.onConnectionChange?.({
        id: device.id,
        name: device.name ?? device.localName ?? null,
      });
      this.onStatusChange?.('connected');
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e);
      this.onError?.(message);
      // Connection failed mid-attempt: schedule a retry if still wanted.
      this.scheduleReconnect();
    }
  }

  private subscribeToRadar(device: Device): void {
    this.monitorSub?.remove();
    this.monitorSub = device.monitorCharacteristicForService(
      VARIA_RADAR_SERVICE,
      VARIA_RADAR_CHARACTERISTIC,
      (error, characteristic) => {
        if (error) {
          // Disconnects surface here too; the disconnect handler drives reconnect.
          return;
        }
        if (!characteristic?.value) {
          return;
        }
        const bytes = base64ToBytes(characteristic.value);
        this.onTargets?.(parseRadarMeasurement(bytes));
      },
    );
  }

  private subscribeToDisconnect(device: Device): void {
    this.disconnectSub?.remove();
    this.disconnectSub = device.onDisconnected(() => {
      this.monitorSub?.remove();
      this.monitorSub = null;
      this.connectedDevice = null;
      this.onConnectionChange?.(null);
      if (this.wantConnection) {
        this.scheduleReconnect();
      } else {
        this.onStatusChange?.('disconnected');
      }
    });
  }

  private scheduleReconnect(): void {
    if (!this.wantConnection || !this.lastDeviceId || this.reconnectTimer) {
      return;
    }
    const delay =
      RECONNECT_DELAYS_MS[
        Math.min(this.reconnectAttempt, RECONNECT_DELAYS_MS.length - 1)
      ];
    this.reconnectAttempt += 1;
    this.onStatusChange?.('reconnecting');
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.wantConnection && this.lastDeviceId) {
        this.connect(this.lastDeviceId);
      }
    }, delay);
  }

  /** Disconnect and stop auto-reconnecting. */
  async disconnect(): Promise<void> {
    this.wantConnection = false;
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.monitorSub?.remove();
    this.monitorSub = null;
    this.disconnectSub?.remove();
    this.disconnectSub = null;

    const id = this.connectedDevice?.id ?? this.lastDeviceId;
    this.connectedDevice = null;
    if (id) {
      try {
        await this.manager.cancelDeviceConnection(id);
      } catch {
        // Already disconnected — ignore.
      }
    }
    this.onConnectionChange?.(null);
    this.onStatusChange?.('disconnected');
  }

  /** The id of the most recently connected device (for reconnect-on-launch). */
  getLastDeviceId(): string | null {
    return this.lastDeviceId;
  }

  /** Release all native resources. */
  destroy(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
    }
    this.monitorSub?.remove();
    this.disconnectSub?.remove();
    this.manager.stopDeviceScan();
    this.manager.destroy();
  }
}

/** Shared singleton used across the app. */
export const variaRadarManager = new VariaRadarManager();
