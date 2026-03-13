import { Linking } from 'react-native';

type LaunchArgs = {
  E2E_SKIP_AUTH?: boolean | string;
};

/**
 * Decide whether to bypass auth for E2E runs.
 * Uses Detox launchArgs and/or an initial deep link query param.
 * Guarded by __DEV__ so it is a no-op in production builds.
 */
export async function shouldSkipAuthForE2E(): Promise<boolean> {
  if (!__DEV__) {
    return false;
  }

  let args: LaunchArgs | undefined;
  try {
    // Optional native module used for Detox launchArgs.

    const mod = require('react-native-launch-arguments');
    args = mod?.LaunchArguments?.value?.();
  } catch {
    args = undefined;
  }

  const skipAuthFromArgs = args?.E2E_SKIP_AUTH === true || args?.E2E_SKIP_AUTH === '1';

  const initialUrl = await Linking.getInitialURL();
  const skipAuthFromUrl =
    typeof initialUrl === 'string' &&
    (initialUrl.includes('e2eSkipAuth=1') || initialUrl.includes('E2E_SKIP_AUTH=1'));

  return skipAuthFromArgs || skipAuthFromUrl;
}
