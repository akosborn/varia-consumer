import { base64ToBytes } from '../src/ble/base64';
import { parseRadarMeasurement } from '../src/ble/radarParser';

const FIXED_NOW = 1_700_000_000_000;

describe('parseRadarMeasurement', () => {
  it('returns no targets for an empty payload (header only)', () => {
    expect(parseRadarMeasurement([0x10], FIXED_NOW)).toEqual([]);
  });

  it('returns no targets for a zero-length payload', () => {
    expect(parseRadarMeasurement([], FIXED_NOW)).toEqual([]);
  });

  it('parses a single threat with km/h -> m/s conversion', () => {
    // header, [id=1, distance=50m, speed=36km/h]
    const result = parseRadarMeasurement([0x10, 1, 50, 36], FIXED_NOW);
    expect(result).toEqual([
      {
        id: 1,
        distanceMeters: 50,
        relativeSpeedMetersPerSecond: 10, // 36 / 3.6
        isApproaching: true,
        timestamp: FIXED_NOW,
      },
    ]);
  });

  it('parses multiple threats in order', () => {
    const result = parseRadarMeasurement(
      [0x11, 1, 90, 18, 2, 30, 54],
      FIXED_NOW,
    );
    expect(result.map(t => t.id)).toEqual([1, 2]);
    expect(result.map(t => t.distanceMeters)).toEqual([90, 30]);
    expect(result.map(t => Math.round(t.relativeSpeedMetersPerSecond))).toEqual([
      5, 15,
    ]);
  });

  it('marks a stationary threat (speed 0) as not approaching', () => {
    const [target] = parseRadarMeasurement([0x10, 1, 40, 0], FIXED_NOW);
    expect(target.isApproaching).toBe(false);
  });

  it('skips a truncated final group instead of throwing', () => {
    // One full threat, then a dangling 2 bytes.
    const result = parseRadarMeasurement([0x10, 1, 50, 36, 2, 30], FIXED_NOW);
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe(1);
  });

  it('accepts a Uint8Array payload', () => {
    const result = parseRadarMeasurement(
      Uint8Array.from([0x10, 3, 25, 18]),
      FIXED_NOW,
    );
    expect(result[0].distanceMeters).toBe(25);
  });
});

describe('base64ToBytes', () => {
  it('decodes a base64 radar payload to the original bytes', () => {
    // "EAEyJA==" is base64 for bytes [0x10, 1, 50, 36].
    expect(Array.from(base64ToBytes('EAEyJA=='))).toEqual([0x10, 1, 50, 36]);
  });

  it('round-trips through the parser', () => {
    // "EAd4CQ==" is base64 for bytes [0x10, 7, 120, 9].
    const [target] = parseRadarMeasurement(base64ToBytes('EAd4CQ=='), FIXED_NOW);
    expect(target.id).toBe(7);
    expect(target.distanceMeters).toBe(120);
  });
});
