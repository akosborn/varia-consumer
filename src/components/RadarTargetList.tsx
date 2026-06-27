import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { RadarTarget } from '../ble/types';

interface Props {
  targets: RadarTarget[];
}

function speedKmh(target: RadarTarget): number {
  return Math.round(target.relativeSpeedMetersPerSecond * 3.6);
}

/** Color the distance row by proximity: closer = warmer. */
function distanceColor(meters: number): string {
  if (meters <= 30) {
    return '#d32f2f';
  }
  if (meters <= 80) {
    return '#f9a825';
  }
  return '#388e3c';
}

function TargetRow({ target }: { target: RadarTarget }) {
  return (
    <View style={[styles.row, { borderLeftColor: distanceColor(target.distanceMeters) }]}>
      <Text style={styles.distance}>{target.distanceMeters} m</Text>
      <View style={styles.meta}>
        <Text style={styles.speed}>
          {target.isApproaching ? '▲' : '▼'} {speedKmh(target)} km/h
        </Text>
        <Text style={styles.sub}>
          {target.isApproaching ? 'approaching' : 'receding'}
        </Text>
      </View>
    </View>
  );
}

export function RadarTargetList({ targets }: Props) {
  if (targets.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No vehicles detected</Text>
      </View>
    );
  }

  // Closest first.
  const sorted = [...targets].sort(
    (a, b) => a.distanceMeters - b.distanceMeters,
  );

  return (
    <FlatList
      data={sorted}
      keyExtractor={item => String(item.id)}
      renderItem={({ item }) => <TargetRow target={item} />}
      contentContainerStyle={styles.list}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    padding: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1e1e1e',
    borderLeftWidth: 6,
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  distance: {
    color: '#fff',
    fontSize: 32,
    fontWeight: '700',
  },
  meta: {
    alignItems: 'flex-end',
  },
  speed: {
    color: '#fff',
    fontSize: 20,
    fontWeight: '600',
  },
  sub: {
    color: '#9e9e9e',
    fontSize: 13,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyText: {
    color: '#9e9e9e',
    fontSize: 16,
  },
});
