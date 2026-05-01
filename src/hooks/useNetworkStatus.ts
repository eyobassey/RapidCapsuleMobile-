import * as Network from 'expo-network';
import { useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

export function useNetworkStatus() {
  const [isConnected, setIsConnected] = useState<boolean>(true);
  const [connectionType, setConnectionType] = useState<string | null>(null);

  useEffect(() => {
    const checkNetwork = async () => {
      const state = await Network.getNetworkStateAsync();
      setIsConnected(state.isConnected ?? true);
      setConnectionType(state.type ?? null);
    };

    void checkNetwork();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        void checkNetwork();
      }
    });

    return () => subscription.remove();
  }, []);

  return { isConnected, connectionType };
}
