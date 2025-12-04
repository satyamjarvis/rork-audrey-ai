import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, usePathname } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { StatusBar } from "expo-status-bar";
import { View, Text, StyleSheet, KeyboardAvoidingView, Platform, TouchableWithoutFeedback, Keyboard, ActivityIndicator } from "react-native";
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
});

export default function RootLayout() {
  const [isInitialized, setIsInitialized] = useState<boolean>(false);

  useEffect(() => {
    console.log('[RootLayout] Component mounted');
    
    let isMounted = true;
    
    const initialize = async () => {
      try {
        // Run critical initialization tasks
        await Promise.race([
          restoreStorage(),
          new Promise(resolve => setTimeout(resolve, 1000))
        ]).catch(err => console.warn('[RootLayout] Storage restoration timeout:', err));
        
        if (isMounted) {
          setIsInitialized(true);
          console.log('[RootLayout] App initialized');
          
          // Hide splash after initialization
          SplashScreen.hideAsync().catch(console.warn);
          
          // Run cleanup tasks in background (non-critical)
          cleanupWalletStorage().catch(console.warn);
          clearCorruptedKeys().catch(console.warn);
        }
      } catch (error) {
        console.error('[RootLayout] Initialization error:', error);
        // Proceed anyway to avoid blocking
        if (isMounted) {
          setIsInitialized(true);
          SplashScreen.hideAsync().catch(console.warn);
        }
      }
    };
    
    initialize();
    
    return () => {
      isMounted = false;
    };
  }, []);

  if (!isInitialized) {
    return <LoadingScreen />;
  }

  return (
    <ErrorBoundary>
      <ErrorBoundary>
        <AppProviders>
          <ErrorBoundary>
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
    </ErrorBoundary>
  );
}
