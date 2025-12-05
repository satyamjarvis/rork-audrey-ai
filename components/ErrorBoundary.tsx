import React, { Component, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Animated } from 'react-native';
import { AlertCircle, RefreshCw, Home, ChevronDown, ChevronUp } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ErrorBoundaryProps = {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
  onReset?: () => void;
  level?: 'root' | 'screen' | 'component';
  showHomeButton?: boolean;
};

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
  retryCount: number;
  showDetails: boolean;
  isRecovering: boolean;
};

const MAX_AUTO_RETRIES = 2;
const RETRY_DELAY = 1000;

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private retryTimeout: ReturnType<typeof setTimeout> | null = null;
  private fadeAnim = new Animated.Value(0);

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      showDetails: false,
      isRecovering: false,
    };
  }

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    console.error('[ErrorBoundary] Caught error:', error?.message || error);
    return { hasError: true, error, isRecovering: false };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    const { level = 'component' } = this.props;
    const { retryCount } = this.state;
    
    console.error(`[ErrorBoundary:${level}] Error details:`, {
      message: error?.message,
      name: error?.name,
      componentStack: errorInfo?.componentStack?.slice(0, 500),
    });
    
    this.setState({ errorInfo });
    this.props.onError?.(error, errorInfo);
    
    this.logErrorToStorage(error, errorInfo);
    
    Animated.timing(this.fadeAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (retryCount < MAX_AUTO_RETRIES && this.isRecoverableError(error)) {
      console.log(`[ErrorBoundary] Auto-retry attempt ${retryCount + 1}/${MAX_AUTO_RETRIES}`);
      this.retryTimeout = setTimeout(() => {
        this.setState(prev => ({
          hasError: false,
          error: null,
          errorInfo: null,
          retryCount: prev.retryCount + 1,
          isRecovering: true,
        }));
      }, RETRY_DELAY * (retryCount + 1));
    }
  }

  private isRecoverableError(error: Error): boolean {
    const recoverablePatterns = [
      /network/i,
      /timeout/i,
      /fetch/i,
      /loading chunk/i,
      /dynamically imported/i,
      /module not found/i,
    ];
    
    const errorMessage = error?.message || '';
    return recoverablePatterns.some(pattern => pattern.test(errorMessage));
  }

  private async logErrorToStorage(error: Error, errorInfo: React.ErrorInfo) {
    try {
      const errorLog = {
        timestamp: Date.now(),
        message: error?.message || 'Unknown error',
        name: error?.name || 'Error',
        stack: error?.stack?.slice(0, 1000),
        componentStack: errorInfo?.componentStack?.slice(0, 500),
        level: this.props.level || 'component',
      };
      
      const existingLogs = await AsyncStorage.getItem('@error_logs');
      const logs = existingLogs ? JSON.parse(existingLogs) : [];
      logs.unshift(errorLog);
      const trimmedLogs = logs.slice(0, 20);
      await AsyncStorage.setItem('@error_logs', JSON.stringify(trimmedLogs));
    } catch (e) {
      console.warn('[ErrorBoundary] Failed to log error:', e);
    }
  }

  resetError = () => {
    console.log('[ErrorBoundary] Manual reset triggered');
    this.fadeAnim.setValue(0);
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0,
      showDetails: false,
      isRecovering: false,
    });
    this.props.onReset?.();
  };

  toggleDetails = () => {
    this.setState(prev => ({ showDetails: !prev.showDetails }));
  };

  handleGoHome = () => {
    this.resetError();
    if (Platform.OS === 'web') {
      window.location.href = '/';
    }
  };

  render() {
    const { level = 'component', showHomeButton = true } = this.props;
    const { hasError, error, errorInfo, retryCount, showDetails, isRecovering } = this.state;

    if (hasError && error) {
      if (this.props.fallback) {
        return this.props.fallback(error, this.resetError);
      }

      const isRootLevel = level === 'root';
      const errorMessage = this.getReadableErrorMessage(error);

      return (
        <Animated.View 
          style={[
            styles.container, 
            { opacity: this.fadeAnim },
            isRootLevel && styles.containerRoot,
          ]}
        >
          <View style={[styles.card, isRootLevel && styles.cardRoot]}>
            <View style={styles.iconContainer}>
              <AlertCircle size={isRootLevel ? 56 : 48} color="#ff6b6b" />
            </View>
            
            <Text style={[styles.title, isRootLevel && styles.titleRoot]}>
              {isRootLevel ? 'Oops! Something unexpected happened' : 'Something went wrong'}
            </Text>
            
            <Text style={styles.message}>{errorMessage}</Text>

            {retryCount > 0 && (
              <Text style={styles.retryInfo}>
                Auto-retry attempts: {retryCount}/{MAX_AUTO_RETRIES}
              </Text>
            )}

            <View style={styles.buttonContainer}>
              <TouchableOpacity 
                style={styles.button} 
                onPress={this.resetError}
                activeOpacity={0.8}
                testID="error-boundary-retry"
              >
                <RefreshCw size={20} color="#ffffff" />
                <Text style={styles.buttonText}>Try Again</Text>
              </TouchableOpacity>

              {showHomeButton && isRootLevel && (
                <TouchableOpacity 
                  style={[styles.button, styles.homeButton]} 
                  onPress={this.handleGoHome}
                  activeOpacity={0.8}
                  testID="error-boundary-home"
                >
                  <Home size={20} color="#ffffff" />
                  <Text style={styles.buttonText}>Go Home</Text>
                </TouchableOpacity>
              )}
            </View>

            {__DEV__ && errorInfo && (
              <>
                <TouchableOpacity 
                  style={styles.detailsToggle} 
                  onPress={this.toggleDetails}
                  activeOpacity={0.7}
                >
                  <Text style={styles.detailsToggleText}>
                    {showDetails ? 'Hide' : 'Show'} Technical Details
                  </Text>
                  {showDetails ? (
                    <ChevronUp size={16} color="#888888" />
                  ) : (
                    <ChevronDown size={16} color="#888888" />
                  )}
                </TouchableOpacity>

                {showDetails && (
                  <ScrollView style={styles.stackContainer} nestedScrollEnabled>
                    <Text style={styles.stackTitle}>Error Type:</Text>
                    <Text style={styles.stack}>{error.name || 'Error'}</Text>
                    
                    <Text style={styles.stackTitle}>Error Message:</Text>
                    <Text style={styles.stack}>{error.message || 'No message'}</Text>
                    
                    <Text style={styles.stackTitle}>Error Stack:</Text>
                    <Text style={styles.stack}>
                      {error.stack || 'No stack trace available'}
                    </Text>
                    
                    <Text style={styles.stackTitle}>Component Stack:</Text>
                    <Text style={styles.stack}>
                      {errorInfo.componentStack || 'No component stack'}
                    </Text>
                  </ScrollView>
                )}
              </>
            )}
          </View>
        </Animated.View>
      );
    }

    if (isRecovering) {
      return this.props.children;
    }

    return this.props.children;
  }

  private getReadableErrorMessage(error: Error): string {
    const message = error?.message || '';
    
    if (/network/i.test(message) || /fetch/i.test(message)) {
      return 'A network error occurred. Please check your connection and try again.';
    }
    if (/timeout/i.test(message)) {
      return 'The request timed out. Please try again.';
    }
    if (/loading chunk/i.test(message) || /dynamically imported/i.test(message)) {
      return 'Failed to load a required component. Please refresh the app.';
    }
    if (/storage/i.test(message) || /asyncstorage/i.test(message)) {
      return 'There was an issue accessing your data. Please try again.';
    }
    if (/permission/i.test(message)) {
      return 'Permission denied. Please check your app settings.';
    }
    
    if (message.length > 100) {
      return message.slice(0, 100) + '...';
    }
    
    return message || 'An unexpected error occurred. Please try again.';
  }
}

export function withErrorBoundary<P extends object>(
  WrappedComponent: React.ComponentType<P>,
  boundaryProps?: Omit<ErrorBoundaryProps, 'children'>
): React.FC<P> {
  const WithErrorBoundary: React.FC<P> = (props) => (
    <ErrorBoundary {...boundaryProps}>
      <WrappedComponent {...props} />
    </ErrorBoundary>
  );
  
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component';
  WithErrorBoundary.displayName = `withErrorBoundary(${displayName})`;
  
  return WithErrorBoundary;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 20,
  },
  containerRoot: {
    backgroundColor: '#0a0a0a',
  },
  card: {
    backgroundColor: '#1a1a1a',
    padding: 24,
    borderRadius: 16,
    maxWidth: 400,
    width: '100%',
    borderWidth: 1,
    borderColor: '#ff6b6b',
    shadowColor: '#ff6b6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 8,
  },
  cardRoot: {
    maxWidth: 440,
    padding: 32,
  },
  iconContainer: {
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold' as const,
    color: '#ffffff',
    marginBottom: 12,
    textAlign: 'center' as const,
  },
  titleRoot: {
    fontSize: 26,
  },
  message: {
    fontSize: 15,
    color: '#b0b0b0',
    marginBottom: 20,
    textAlign: 'center' as const,
    lineHeight: 22,
  },
  retryInfo: {
    fontSize: 12,
    color: '#666666',
    textAlign: 'center' as const,
    marginBottom: 16,
  },
  buttonContainer: {
    flexDirection: 'row' as const,
    justifyContent: 'center' as const,
    gap: 12,
    flexWrap: 'wrap' as const,
  },
  button: {
    backgroundColor: '#ff6b6b',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 8,
    minWidth: 140,
  },
  homeButton: {
    backgroundColor: '#4a4a4a',
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  detailsToggle: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    gap: 4,
    marginTop: 20,
    paddingVertical: 8,
  },
  detailsToggleText: {
    fontSize: 13,
    color: '#888888',
  },
  stackContainer: {
    marginTop: 12,
    maxHeight: 200,
    backgroundColor: '#0a0a0a',
    padding: 12,
    borderRadius: 8,
  },
  stackTitle: {
    fontSize: 11,
    color: '#888888',
    fontWeight: 'bold' as const,
    marginTop: 8,
    marginBottom: 4,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  stack: {
    fontSize: 10,
    color: '#666666',
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
    lineHeight: 16,
  },
});
