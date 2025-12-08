import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useCallback } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ActivityIndicator, TouchableOpacity } from "react-native";
import { RefreshCw, AlertTriangle, Zap } from "lucide-react-native";
import AudreyFloatingButton from "@/components/AudreyFloatingButton";
import UniverseFloatingButton from "@/components/UniverseFloatingButton";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { MusicPlayerProvider } from "@/contexts/MusicPlayerContext";
import { CalendarProvider } from "@/contexts/CalendarContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ChatProvider } from "@/contexts/ChatContext";
import { AudioStyleProvider } from "@/contexts/AudioStyleContext";
// AsyncStorage is used by utility functions
import { restoreStorage } from "@/utils/storageRestoration";
import { clearCorruptedKeys } from "@/utils/asyncStorageHelpers";
import { cleanupWalletStorage } from "@/utils/cleanupWalletStorage";

import { PlannerProvider } from "@/contexts/PlannerContext";

import { FinanceProvider } from "@/contexts/FinanceContext";
import { WealthManifestingProvider } from "@/contexts/WealthManifestingContext";
import { StatisticsProvider } from "@/contexts/StatisticsContext";
import { PhonebookProvider } from "@/contexts/PhonebookContext";
import { UserProfileProvider } from "@/contexts/UserProfileContext";
import { AudreyMemoryProvider } from "@/contexts/AudreyMemoryContext";
import { NotesProvider } from "@/contexts/NotesContext";
import { TodoListProvider } from "@/contexts/TodoListContext";


import { SchedulingProvider } from "@/contexts/SchedulingContext";
import { NotificationSettingsProvider } from "@/contexts/NotificationSettingsContext";
import { SharingProvider } from "@/contexts/SharingContext";
import { FontSizeProvider } from "@/contexts/FontSizeContext";
import { UniverseModeProvider, useUniverseMode as useUniverseModeHook } from "@/contexts/UniverseModeContext";
import { AffirmationsProvider } from "@/contexts/AffirmationsContext";
import { MorningHabitsProvider } from "@/contexts/MorningHabitsContext";
import { MeditationProvider } from "@/contexts/MeditationContext";
import { MorningRoutinesProvider } from "@/contexts/MorningRoutinesContext";
import { WellnessCheckProvider } from "@/contexts/WellnessCheckContext";
import { LearnContext as LearnProvider } from "@/contexts/LearnContext";
import { MindMapProvider } from "@/contexts/MindMapContext";
import { AppBackgroundProvider } from "@/contexts/AppBackgroundContext";
import { AudreyTimerProvider } from "@/contexts/AudreyTimerContext";


SplashScreen.preventAutoHideAsync().catch((error) => {
  console.error('[SplashScreen] Error preventing auto hide:', error);
});

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      staleTime: 5000,
      refetchOnMount: false,
      refetchOnWindowFocus: false,
      gcTime: 1000 * 60 * 5,
    },
    mutations: {
      retry: 1,
    },
  },
});



type AppProvidersProps = {
  children: React.ReactNode;
};

const AppProviders = ({ children }: AppProvidersProps) => (
    <QueryClientProvider client={queryClient}>
    <LanguageProvider>
      <ThemeProvider>
        <AppBackgroundProvider>
          <FontSizeProvider>
          <UniverseModeProvider>
            <AudioStyleProvider>
              <MusicPlayerProvider>
                <CalendarProvider>
                  <SharingProvider>
                    <PlannerProvider>
                      <TodoListProvider>
                        <FinanceProvider>
                          <WealthManifestingProvider>
                              <StatisticsProvider>
                                <PhonebookProvider>
                                  <UserProfileProvider>
                                      <SchedulingProvider>
                                        <NotificationSettingsProvider>
                                          <AudreyMemoryProvider>
                                            <AffirmationsProvider>
                                              <MorningHabitsProvider>
                                                <MorningRoutinesProvider>
                                                  <MeditationProvider>
                                                    <WellnessCheckProvider>
                                                      <LearnProvider>
                                                        <NotesProvider>
                                                          <MindMapProvider>
                                                            <AudreyTimerProvider>
                                                              <ChatProvider>{children}</ChatProvider>
                                                            </AudreyTimerProvider>
                                                          </MindMapProvider>
                                                        </NotesProvider>
                                                      </LearnProvider>
                                                    </WellnessCheckProvider>
                                                  </MeditationProvider>
                                                </MorningRoutinesProvider>
                                              </MorningHabitsProvider>
                                            </AffirmationsProvider>
                                          </AudreyMemoryProvider>
                                        </NotificationSettingsProvider>
                                      </SchedulingProvider>
                                  </UserProfileProvider>
                                </PhonebookProvider>
                              </StatisticsProvider>
                            </WealthManifestingProvider>
                        </FinanceProvider>
                      </TodoListProvider>
                    </PlannerProvider>
                  </SharingProvider>
                </CalendarProvider>
              </MusicPlayerProvider>
            </AudioStyleProvider>
          </UniverseModeProvider>
        </FontSizeProvider>
          </AppBackgroundProvider>
      </ThemeProvider>
    </LanguageProvider>
    </QueryClientProvider>
);



function RootLayoutNav() {
  console.log("[RootLayoutNav] Rendering - timestamp: " + Date.now());
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="intro-splash" options={{ headerShown: false }} />
      <Stack.Screen name="language-selection" options={{ headerShown: false }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="calendar-manager" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="calendar-chat" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="theme-selection" options={{ headerShown: false }} />
      <Stack.Screen name="journal" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="planner" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="yearly-planner" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="monthly-planner" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="weekly-planner" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="daily-planner" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="todo-list" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="file-upload" options={{ headerShown: false, presentation: "modal" }} />
      <Stack.Screen name="ai-assistant" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen 
        name="learn" 
        options={{ 
          headerShown: false, 
          presentation: "card",
        }} 
      />
      <Stack.Screen name="notes" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="mind-mapping/index" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="mind-mapping/[id]" options={{ headerShown: false, presentation: "card" }} />


      <Stack.Screen name="membership" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="account-creation" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="subscription-selection" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="configuring-app" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="intro-story" options={{ headerShown: false, presentation: "card", gestureEnabled: false }} />
      <Stack.Screen name="walkthrough" options={{ headerShown: false, presentation: "fullScreenModal", gestureEnabled: false }} />
      <Stack.Screen name="mode-selection" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="account-settings" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="notification-settings" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="morning-habits" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="morning-routines" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="morning-affirmations" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="morning-meditation" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="wellness-check" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="gratitude-moments" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="how-am-i-feeling" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="dream-journal" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="sleep-meditation" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="tomorrows-intentions" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="automations-manager" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="shared-contact" options={{ headerShown: false, presentation: "card" }} />
      <Stack.Screen name="+not-found" />
    </Stack>
  );
}

function FloatingButtons() {
  const { mode: universeMode } = useUniverseModeHook();
  const pathname = usePathname();

  const hideOnRoutes = [
    '/',
    '/intro-splash',
    '/intro-story',
    '/language-selection',
    '/theme-selection',
    '/account-creation',
    '/configuring-app',
    '/subscription-selection'
  ];

  if (hideOnRoutes.includes(pathname)) {
    return null;
  }
  
  return (
    <>
      <AudreyFloatingButton />
      {universeMode === "universe" && <UniverseFloatingButton />}
    </>
  );
}

function LoadingScreen() {
  return (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#ffffff" />
      <Text style={styles.loadingText}>Initializing...</Text>
    </View>
  );
}

function RecoveringScreen({ onRetry }: { onRetry?: () => void }) {
  return (
    <View style={styles.recoveringContainer}>
      <Zap size={48} color="#4CAF50" />
      <Text style={styles.recoveringTitle}>Auto-Recovery in Progress</Text>
      <Text style={styles.recoveringSubtitle}>The app detected an issue and is fixing itself...</Text>
      <ActivityIndicator size="small" color="#4CAF50" style={{ marginTop: 16 }} />
      {onRetry && (
        <TouchableOpacity style={styles.retryButton} onPress={onRetry}>
          <RefreshCw size={18} color="#ffffff" />
          <Text style={styles.retryButtonText}>Retry Manually</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function ProviderErrorFallback({ onRetry }: { onRetry: () => void }) {
  return (
    <View style={styles.providerErrorContainer}>
      <AlertTriangle size={48} color="#ff6b6b" />
      <Text style={styles.providerErrorTitle}>Initialization Error</Text>
      <Text style={styles.providerErrorText}>
        Something went wrong during app startup. This might be due to corrupted data.
      </Text>
      <TouchableOpacity style={styles.providerErrorButton} onPress={onRetry}>
        <RefreshCw size={18} color="#ffffff" />
        <Text style={styles.providerErrorButtonText}>Try Again</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    gap: 16,
  },
  loadingText: {
    color: '#ffffff',
    fontSize: 16,
  },
  recoveringContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 24,
  },
  recoveringTitle: {
    color: '#4CAF50',
    fontSize: 22,
    fontWeight: '700' as const,
    marginTop: 16,
    textAlign: 'center' as const,
  },
  recoveringSubtitle: {
    color: '#888888',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center' as const,
  },
  retryButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#333333',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600' as const,
  },
  providerErrorContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center' as const,
    alignItems: 'center' as const,
    padding: 24,
  },
  providerErrorTitle: {
    color: '#ff6b6b',
    fontSize: 22,
    fontWeight: '700' as const,
    marginTop: 16,
    textAlign: 'center' as const,
  },
  providerErrorText: {
    color: '#888888',
    fontSize: 15,
    marginTop: 8,
    textAlign: 'center' as const,
    lineHeight: 22,
    maxWidth: 300,
  },
  providerErrorButton: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    backgroundColor: '#ff6b6b',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 12,
    marginTop: 24,
    gap: 8,
  },
  providerErrorButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600' as const,
  },
});

export default function RootLayout() {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);
  const [initError, setInitError] = useState<Error | null>(null);
  const [isRecovering, setIsRecovering] = useState<boolean>(false);

  const initialize = useCallback(async (isRetry: boolean = false) => {
    console.log(`[RootLayout] ${isRetry ? 'Retrying' : 'Starting'} initialization...`);
    setInitError(null);
    
    if (isRetry) {
      setIsRecovering(true);
    }
    
    try {
      // Run critical initialization tasks with timeout
      await Promise.race([
        restoreStorage(),
        new Promise(resolve => setTimeout(resolve, 2000))
      ]).catch(err => {
        console.warn('[RootLayout] Storage restoration timeout or error:', err);
      });
      
      // Run cleanup in parallel with shorter timeout
      await Promise.race([
        Promise.all([
          cleanupWalletStorage().catch(err => console.warn('[RootLayout] Wallet cleanup error:', err)),
          clearCorruptedKeys().catch(err => console.warn('[RootLayout] Corrupted keys cleanup error:', err)),
        ]),
        new Promise(resolve => setTimeout(resolve, 1500))
      ]).catch(err => console.warn('[RootLayout] Cleanup timeout:', err));
      
      setIsInitialized(true);
      setIsRecovering(false);
      console.log('[RootLayout] App initialized successfully');
      
      // Hide splash after initialization
      SplashScreen.hideAsync().catch(console.warn);
    } catch (error) {
      console.error('[RootLayout] Initialization error:', error);
      const err = error instanceof Error ? error : new Error(String(error));
      
      // Try to proceed anyway on first attempt
      if (!isRetry) {
        setIsInitialized(true);
        setIsRecovering(false);
        SplashScreen.hideAsync().catch(console.warn);
      } else {
        setInitError(err);
        setIsRecovering(false);
      }
    }
  }, []);

  useEffect(() => {
    console.log('[RootLayout] Component mounted');
    initialize();
  }, [initialize]);

  if (initError) {
    return <ProviderErrorFallback onRetry={() => initialize(true)} />;
  }

  if (isRecovering) {
    return <RecoveringScreen onRetry={() => initialize(true)} />;
  }

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary level="root" showHomeButton={true}>
      <AppProviders>
        <ErrorBoundary level="screen">
          <GestureHandlerRootView style={{ flex: 1, backgroundColor: "#000000" }}>
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
                keyboardVerticalOffset={0}
              >
                <TouchableWithoutFeedback 
                  onPress={() => {
                    console.log('[RootLayout] Keyboard dismiss triggered');
                    Keyboard.dismiss();
                  }}
                  accessible={false}
                >
                  <View style={{ flex: 1 }}>
                    <StatusBar style="light" />
                  <RootLayoutNav />
                  <FloatingButtons />
                </View>
              </TouchableWithoutFeedback>
            </KeyboardAvoidingView>
          </GestureHandlerRootView>
        </ErrorBoundary>
      </AppProviders>
    </ErrorBoundary>
  );
}
