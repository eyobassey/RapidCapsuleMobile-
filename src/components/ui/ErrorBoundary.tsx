import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, TouchableOpacity } from 'react-native';
import { Text } from './Text';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught:', error, errorInfo);
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View
          style={{
            flex: 1,
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: '#151c2c',
            padding: 24,
          }}
        >
          <Text
            style={{
              color: '#f8fafc',
              fontSize: 20,
              fontFamily: 'Inter-SemiBold',
              marginBottom: 8,
            }}
          >
            Something went wrong
          </Text>
          <Text
            style={{
              color: '#7c8ba3',
              fontSize: 14,
              fontFamily: 'Inter-Regular',
              textAlign: 'center',
              marginBottom: 24,
            }}
          >
            An unexpected error occurred. Please try again.
          </Text>
          <TouchableOpacity
            onPress={this.handleRetry}
            style={{
              backgroundColor: '#0ea5e9',
              paddingHorizontal: 24,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text
              style={{
                color: '#ffffff',
                fontSize: 16,
                fontFamily: 'Inter-SemiBold',
              }}
            >
              Try Again
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
