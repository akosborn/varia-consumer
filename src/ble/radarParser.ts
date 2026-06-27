import { RadarTarget } from './types';

/**
 * Conversion factor from km/h to m/s.
 */
const KMH_TO_MS = 1 / 3.6;

/**
 * Parse a raw radar measurement payload into a list of targets.
 *
 * Payload layout (length = 1 + 3 * N for N threats), per pycycling:
 *   byte 0        : page / packet identifier (ignored here)
 *   bytes [i..i+2]: per threat, starting at i = 1, stepping by 3
 *       i     -> threat id
 *       i + 1 -> distance to threat, in meters
 *       i + 2 -> relative speed of threat, in km/h
 *
 * A payload of length <= 1 means no threats are currently detected. A
 * truncated final group (incomplete data, common at startup) is skipped
 * rather than throwing.
 *
 * @param bytes raw characteristic value
 * @param now   timestamp applied to each target (injectable for tests)
 */
export function parseRadarMeasurement(
  bytes: Uint8Array | number[],
  now: number = Date.now(),
): RadarTarget[] {
  const data = bytes instanceof Uint8Array ? bytes : Uint8Array.from(bytes);
  const targets: RadarTarget[] = [];

  for (let i = 1; i + 2 < data.length; i += 3) {
    const id = data[i];
    const distanceMeters = data[i + 1];
    const speedKmh = data[i + 2];

    targets.push({
      id,
      distanceMeters,
      relativeSpeedMetersPerSecond: speedKmh * KMH_TO_MS,
      isApproaching: speedKmh > 0,
      timestamp: now,
    });
  }

  return targets;
}
