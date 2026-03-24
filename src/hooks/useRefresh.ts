import { useFocusEffect } from '@react-navigation/native';
import React, { useEffect } from 'react';

export function useRefreshOnFocus<T>(refetch: () => Promise<T>, enabled = true) {
  const firstTimeRef = React.useRef(true);

  useFocusEffect(
    React.useCallback(() => {
      if (firstTimeRef.current || !enabled) {
        firstTimeRef.current = false;
        return;
      }

      void refetch();
    }, [refetch, enabled])
  );
}

export function useRefreshOnMount<T>(refetch: () => Promise<T>) {
  const firstTimeRef = React.useRef(true);

  useEffect(() => {
    if (firstTimeRef.current) {
      firstTimeRef.current = false;
      void refetch();
    }
  }, [refetch]);
}
