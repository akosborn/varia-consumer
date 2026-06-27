import React from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { BLEDevice, VariaDeviceState } from '../ble/types';

interface Props {
  state: VariaDeviceState;
  devices: BLEDevice[];
  permissionDenied: boolean;
  onScan: () => void;
  onStopScan: () => void;
  onConnect: (deviceId: string) => void;
  onDisconnect: () => void;
}

const STATUS_LABEL: Record<VariaDeviceState['status'], string> = {
  idle: 'Disconnected',
  scanning: 'Scanning…',
  connecting: 'Connecting…',
  connected: 'Connected',
  reconnecting: 'Reconnecting…',
};

export function ConnectionStatus({
  state,
  devices,
  permissionDenied,
  onScan,
  onStopScan,
  onConnect,
  onDisconnect,
}: Props) {
  const { status } = state;
  const busy = status === 'scanning' || status === 'connecting' || status === 'reconnecting';

  return (
    <View style={styles.container}>
      <View style={styles.statusRow}>
        <View>
          <Text style={styles.statusLabel}>{STATUS_LABEL[status]}</Text>
          {state.deviceName ? (
            <Text style={styles.deviceName}>{state.deviceName}</Text>
          ) : null}
        </View>
        {busy ? <ActivityIndicator color="#fff" /> : null}
      </View>

      {state.error ? <Text style={styles.error}>{state.error}</Text> : null}
      {permissionDenied ? (
        <Text style={styles.error}>
          Bluetooth permission denied. Enable it in system settings.
        </Text>
      ) : null}

      {state.connected ? (
        <TouchableOpacity style={[styles.button, styles.disconnect]} onPress={onDisconnect}>
          <Text style={styles.buttonText}>Disconnect</Text>
        </TouchableOpacity>
      ) : status === 'scanning' ? (
        <TouchableOpacity style={styles.button} onPress={onStopScan}>
          <Text style={styles.buttonText}>Stop scan</Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity style={styles.button} onPress={onScan}>
          <Text style={styles.buttonText}>Scan for Varia</Text>
        </TouchableOpacity>
      )}

      {!state.connected && devices.length > 0 ? (
        <FlatList
          style={styles.deviceList}
          data={devices}
          keyExtractor={item => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.deviceRow}
              onPress={() => onConnect(item.id)}>
              <Text style={styles.deviceRowName}>
                {item.name ?? 'Unknown device'}
              </Text>
              <Text style={styles.deviceRowSub}>
                {item.id}
                {item.rssi != null ? `  ·  ${item.rssi} dBm` : ''}
              </Text>
            </TouchableOpacity>
          )}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#121212',
    padding: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#333',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  deviceName: {
    color: '#9e9e9e',
    fontSize: 14,
    marginTop: 2,
  },
  error: {
    color: '#ef9a9a',
    marginTop: 8,
  },
  button: {
    backgroundColor: '#1976d2',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  disconnect: {
    backgroundColor: '#c62828',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  deviceList: {
    marginTop: 12,
    maxHeight: 220,
  },
  deviceRow: {
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#333',
  },
  deviceRowName: {
    color: '#fff',
    fontSize: 16,
  },
  deviceRowSub: {
    color: '#777',
    fontSize: 12,
    marginTop: 2,
  },
});
