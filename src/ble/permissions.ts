import { PermissionsAndroid, Platform } from 'react-native';

/**
 * Request the runtime permissions required to scan for and connect to BLE
 * devices. Resolves to `true` when all required permissions are granted.
 *
 * - Android 12+ (API 31): BLUETOOTH_SCAN + BLUETOOTH_CONNECT. We declare
 *   `neverForLocation` in the manifest, so fine location is not required.
 * - Android 11 and below: ACCESS_FINE_LOCATION is needed for BLE scanning.
 * - iOS: permission is handled by the OS prompt (Info.plist usage strings),
 *   so this is a no-op.
 */
export async function requestBlePermissions(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return true;
  }

  const apiLevel = Platform.Version as number;

  if (apiLevel >= 31) {
    const result = await PermissionsAndroid.requestMultiple([
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
      PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
    ]);
    return (
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN] ===
        PermissionsAndroid.RESULTS.GRANTED &&
      result[PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT] ===
        PermissionsAndroid.RESULTS.GRANTED
    );
  }

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
  );
  return granted === PermissionsAndroid.RESULTS.GRANTED;
}
