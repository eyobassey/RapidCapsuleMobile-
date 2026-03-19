import { createNavigationContainerRef } from '@react-navigation/native';

export const navigationRef = createNavigationContainerRef<any>();

/**
 * Navigate from outside React components (e.g. notification handlers).
 * Safely no-ops if the navigator isn't mounted yet.
 */
export function navigateFromOutside(name: string, params?: Record<string, any>) {
  if (navigationRef.isReady()) {
    (navigationRef.navigate as any)(name, params);
  }
}
