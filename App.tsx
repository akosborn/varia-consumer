/**
 * Varia Consumer — reads live rear-view radar data from a Garmin Varia
 * device over BLE.
 *
 * @format
 */

import React from 'react';
import { StatusBar, StyleSheet, Text, View } from 'react-native';
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { ConnectionStatus } from './src/components/ConnectionStatus';
import { RadarTargetList } from './src/components/RadarTargetList';
import { useVariaRadar } from './src/hooks/useVariaRadar';

function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <AppContent />
    </SafeAreaProvider>
  );
}

function AppContent() {
  const insets = useSafeAreaInsets();
  const {
    state,
    devices,
    permissionDenied,
    scan,
    stopScan,
    connect,
    disconnect,
  } = useVariaRadar();

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={styles.title}>Varia Radar</Text>
      </View>
      <ConnectionStatus
        state={state}
        devices={devices}
        permissionDenied={permissionDenied}
        onScan={scan}
        onStopScan={stopScan}
        onConnect={connect}
        onDisconnect={disconnect}
      />
      <RadarTargetList targets={state.targets} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  title: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '800',
  },
});

export default App;
