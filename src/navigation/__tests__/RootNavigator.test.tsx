import React from 'react';
import { render } from '@testing-library/react-native';
import RootNavigator from '../RootNavigator';
import { useAuthStore } from '../../store/auth';

jest.mock('../../store/auth', () => {
  const actual = jest.requireActual('../../store/auth');
  return {
    ...actual,
    useAuthStore: jest.fn(actual.useAuthStore),
  };
});

describe('RootNavigator', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('mounts without crashing when loading', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      isLoading: true,
      isAuthenticated: false,
      needsOnboarding: false,
      hydrate: jest.fn(),
    });

    render(<RootNavigator />);
  });

  it('mounts without crashing when unauthenticated', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      isLoading: false,
      isAuthenticated: false,
      needsOnboarding: false,
      hydrate: jest.fn(),
    });

    render(<RootNavigator />);
  });

  it('mounts without crashing when needsOnboarding is true', () => {
    (useAuthStore as jest.Mock).mockReturnValue({
      isLoading: false,
      isAuthenticated: true,
      needsOnboarding: true,
      hydrate: jest.fn(),
    });

    render(<RootNavigator />);
  });
});
