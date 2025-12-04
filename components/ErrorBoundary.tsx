import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { AlertCircle, RefreshCw } from 'lucide-react-native';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
};

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    console.error('[ErrorBoundary] Caught error:', error);
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('[ErrorBoundary] Error details:', error, errorInfo);
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
  }

  resetError = () => {
    console.log('[ErrorBoundary] Resetting error state');
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      if (this.props.fallback) {
        return this.props.fallback(this.state.error, this.resetError);
      }

      return (
        <View style={styles.container}>
          <View style={styles.card}>
            <View style={styles.iconContainer}>
              <AlertCircle size={48} color="#ff4444" />
            </View>
            
            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.message}>
              {this.state.error.message || 'An unexpected error occurred'}
            </Text>

            <TouchableOpacity 
              style={styles.button} 
              onPress={this.resetError}
              activeOpacity={0.8}
            >
              <RefreshCw size={20} color="#ffffff" />
              <Text style={styles.buttonText}>Try Again</Text>
            </TouchableOpacity>

            {__DEV__ && this.state.errorInfo && (
              <ScrollView style={styles.stackContainer}>
                <Text style={styles.stackTitle}>Error Stack:</Text>
                <Text style={styles.stack}>
                  {this.state.error.stack || 'No stack trace available'}
                </Text>
                <Text style={styles.stackTitle}>Component Stack:</Text>
                <Text style={styles.stack}>
                  {this.state.errorInfo.componentStack || 'No component stack'}
                </Text>
              </ScrollView>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: 24,
    borderRadius: 16,
    maxWidth: 400,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ff4444',
  },
  iconContainer: {
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold' as const,
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  message: {
    fontSize: 16,
    color: '#cccccc',
    marginBottom: 24,
    textAlign: 'center' as const,
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#ff4444',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
  stackContainer: {
    marginTop: 24,
    maxHeight: 200,
    backgroundColor: '#0a0a0a',
    padding: 12,
    borderRadius: 8,
  },
  stackTitle: {
    fontSize: 12,
    color: '#888888',
    fontWeight: 'bold' as const,
    marginTop: 8,
    marginBottom: 4,
  },
  stack: {
    fontSize: 11,
    color: '#666666',
    fontFamily: 'monospace' as const,
  },
});
