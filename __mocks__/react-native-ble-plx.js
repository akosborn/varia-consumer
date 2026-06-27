/**
 * Manual Jest mock for react-native-ble-plx.
 *
 * The real module constructs a NativeEventEmitter at instantiation, which is
 * unavailable under Jest. This stub provides just enough surface for modules
 * to import and instantiate BleManager without touching native code.
 */

const noopSubscription = { remove: jest.fn() };

class BleManager {
  startDeviceScan = jest.fn();
  stopDeviceScan = jest.fn();
  connectToDevice = jest.fn();
  cancelDeviceConnection = jest.fn();
  isDeviceConnected = jest.fn(() => Promise.resolve(false));
  onStateChange = jest.fn(() => noopSubscription);
  onDeviceDisconnected = jest.fn(() => noopSubscription);
  destroy = jest.fn();
}

const State = {
  Unknown: 'Unknown',
  Resetting: 'Resetting',
  Unsupported: 'Unsupported',
  Unauthorized: 'Unauthorized',
  PoweredOff: 'PoweredOff',
  PoweredOn: 'PoweredOn',
};

class Device {}
class Subscription {}

module.exports = { BleManager, Device, State, Subscription };
