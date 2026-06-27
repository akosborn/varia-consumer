/**
 * BLE identifiers for the Garmin Varia rear-view radar.
 *
 * Protocol reverse-engineered by the pycycling project:
 * https://github.com/zacharyedwardbull/pycycling/blob/master/pycycling/rear_view_radar.py
 */

/** Radar service advertised by the device. */
export const VARIA_RADAR_SERVICE = '6a4e3200-667b-11e3-949a-0800200c9a66';

/** Notify characteristic carrying radar measurements (threat list). */
export const VARIA_RADAR_CHARACTERISTIC =
  '6a4e3203-667b-11e3-949a-0800200c9a66';

/** Substrings used as a fallback when matching devices by advertised name. */
export const VARIA_NAME_HINTS = ['varia', 'radar', 'rtl', 'rvr'];
