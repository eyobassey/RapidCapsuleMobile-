import { useEffect } from 'react';
import { Platform } from 'react-native';
import { requestTrackingPermission, getTrackingStatus } from 'react-native-tracking-transparency';

/**
 * Requests App Tracking Transparency permission on iOS 14+.
 *
 * iOS only — no-ops on Android. Safe to call on every launch; the system
 * dialog is shown at most once (iOS remembers the user's choice). We check
 * the current status first so we never prompt again after the user has
 * already decided.
 *
 * Call this hook after the app has finished bootstrapping so the ATT dialog
 * appears once the user has seen the home screen rather than on a blank splash.
 */
export function useTrackingTransparency() {
  useEffect(() => {
    if (Platform.OS !== 'ios') return;

    void (async () => {
      const status = await getTrackingStatus();
      // 'not-determined' means the dialog hasn't been shown yet
      if (status === 'not-determined') {
        await requestTrackingPermission();
      }
    })();
  }, []);
}
