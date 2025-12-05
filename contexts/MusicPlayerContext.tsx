import createContextHook from "@nkzw/create-context-hook";
import { Audio } from "expo-av";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTheme } from "./ThemeContext";
import { useAudioStyle } from "./AudioStyleContext";
import { usePathname } from 'expo-router';

const MUTE_KEY = "@music_muted";
const PROJECT_BASE = "https://rork.app/pa/ier8mze8ucoqq9oktvadp";
const DEFAULT_AUDIO_URI = `${PROJECT_BASE}/song_442hz_1`;
const INTRO_SPLASH_OPENED_KEY = "@intro_splash_opened";
const MAX_RETRY_ATTEMPTS = 3;

export const [MusicPlayerProvider, useMusicPlayer] = createContextHook(() => {
  const { theme } = useTheme();
  const { audioStyle, getTracksForStyle, getSelectedTrackForStyle } = useAudioStyle();
  const pathname = usePathname();
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isDisabled, setIsDisabled] = useState(false);
  // const [shouldDelayMusic, setShouldDelayMusic] = useState(true); // Removed unused state
  const soundRef = useRef<Audio.Sound | null>(null);
  const isInitializedRef = useRef(false);
  const currentUriRef = useRef<string | null>(null);
  const currentTrackIndexRef = useRef(0);
  const musicUrisRef = useRef<string[]>([]);
  const calendarTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMutedRef = useRef(isMuted);
  isMutedRef.current = isMuted;
  const retryCountRef = useRef(0);

  const playNextTrack = useCallback(async () => {
    if (!isInitializedRef.current || !soundRef.current) {
      return;
    }

    try {
      const musicUris = musicUrisRef.current;
      if (musicUris.length === 0) return;

      currentTrackIndexRef.current = (currentTrackIndexRef.current + 1) % musicUris.length;
      const nextUri = musicUris[currentTrackIndexRef.current];
      
      console.log("Playing next track:", nextUri, "(track", currentTrackIndexRef.current + 1, "of", musicUris.length, ")");

      await soundRef.current.unloadAsync();
      
      try {
        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: nextUri },
          { 
            shouldPlay: !isMutedRef.current, 
            isLooping: false,
            volume: 0.4
          }
        );

        soundRef.current = newSound;
        currentUriRef.current = nextUri;
        
        newSound.setOnPlaybackStatusUpdate((status) => {
          if (status.isLoaded && status.didJustFinish && !status.isLooping) {
            playNextTrack();
          }
        });

        if (isMutedRef.current) {
          await newSound.pauseAsync();
        }
      } catch (audioError: any) {
        console.log('[MusicPlayer] Next track not supported:', audioError?.message || audioError);
      }
    } catch (error) {
      console.log('[MusicPlayer] Error playing next track:', error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function initializeMusic() {
      try {
        // Check if we're on pages where music shouldn't play
        const noMusicPages = ['/account-creation', '/subscription-selection', '/intro-splash', '/language-selection'];
        if (noMusicPages.some(page => pathname.startsWith(page))) {
          console.log('[MusicPlayer] Music disabled on:', pathname);
          setIsDisabled(true);
          setIsLoading(false);
          if (soundRef.current) {
            await soundRef.current.pauseAsync();
          }
          return;
        }
        
        // Check if intro splash has been opened before
        const introSplashOpened = await AsyncStorage.getItem(INTRO_SPLASH_OPENED_KEY).catch(() => null);
        const shouldDelayForIntro = introSplashOpened !== "true";
        
        // If intro splash hasn't been opened yet, delay music
        if (shouldDelayForIntro) {
          console.log('[MusicPlayer] Delaying music for intro splash');
          // setShouldDelayMusic(true);
        } else {
          // setShouldDelayMusic(false);
        }
        
        const storedMuteState = await AsyncStorage.getItem(MUTE_KEY).catch((error) => {
          console.error("Error reading mute state:", error);
          return null;
        });
        const shouldMute = storedMuteState === "true";

        if (!isMounted) return;

        setIsMuted(shouldMute);
        setIsLoading(false);

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        console.log("Initializing music player. Muted:", shouldMute);

        if (!isMounted) return;

        const audioStyleTracks = getTracksForStyle(audioStyle);
        const selectedTrackIndex = getSelectedTrackForStyle(audioStyle);
        
        const musicUris = audioStyleTracks.length > 0 ? audioStyleTracks : (theme?.musicUris || [DEFAULT_AUDIO_URI]);
        musicUrisRef.current = musicUris;
        
        const startIndex = audioStyleTracks.length > 0 ? selectedTrackIndex : (musicUris.length > 1 ? musicUris.length - 1 : 0);
        currentTrackIndexRef.current = startIndex;
        const audioUri = musicUris[startIndex];
        
        console.log("Loading audio:", audioUri, "(track", startIndex + 1, "of", musicUris.length, ")");
        currentUriRef.current = audioUri;
        
        const loadAudioWithRetry = async (uri: string, attempt: number = 0): Promise<boolean> => {
          try {
            console.log(`[MusicPlayer] Loading audio (attempt ${attempt + 1}/${MAX_RETRY_ATTEMPTS}):`, uri);
            
            const { sound: newSound } = await Audio.Sound.createAsync(
              { uri },
              { 
                shouldPlay: false,
                isLooping: false,
                volume: 0.4
              },
              (status) => {
                if (!status.isLoaded && 'error' in status) {
                  console.log('[MusicPlayer] Audio status error:', status.error);
                }
              }
            );

            if (!isMounted) {
              await newSound?.unloadAsync().catch(() => {});
              return false;
            }

            if (newSound) {
              soundRef.current = newSound;
              isInitializedRef.current = true;
              retryCountRef.current = 0;
              
              newSound.setOnPlaybackStatusUpdate((status) => {
                if (status.isLoaded && status.didJustFinish && !status.isLooping) {
                  playNextTrack();
                }
              });
              
              await newSound.pauseAsync();
              console.log('[MusicPlayer] Music loaded successfully, waiting for calendar page');
              return true;
            }
            return false;
          } catch (audioError: any) {
            console.log('[MusicPlayer] Audio load error:', audioError?.message || audioError);
            
            if (attempt < MAX_RETRY_ATTEMPTS - 1 && isMounted) {
              console.log(`[MusicPlayer] Retrying with default audio...`);
              await new Promise(resolve => setTimeout(resolve, 500));
              return loadAudioWithRetry(DEFAULT_AUDIO_URI, attempt + 1);
            }
            
            return false;
          }
        };

        const success = await loadAudioWithRetry(audioUri);
        
        if (!success && isMounted) {
          console.log('[MusicPlayer] All audio load attempts failed, sound disabled');
          setIsDisabled(true);
          soundRef.current = null;
          isInitializedRef.current = false;
        }
      } catch (error) {
        console.log("Music player initialization error:", error);
        if (isMounted) {
          setIsLoading(false);
          setIsDisabled(true);
          soundRef.current = null;
          isInitializedRef.current = false;
        }
      }
    }

    const timer = setTimeout(() => {
      if (isMounted) {
        initializeMusic();
      }
    }, 500);

    return () => {
      isMounted = false;
      clearTimeout(timer);
      if (soundRef.current) {
        soundRef.current.unloadAsync().catch(() => {});
        soundRef.current = null;
        isInitializedRef.current = false;
      }
    };
  }, [theme, audioStyle, getTracksForStyle, getSelectedTrackForStyle, pathname, playNextTrack]);

  // Handle page changes to pause music on specific pages
  useEffect(() => {
    const noMusicPages = ['/account-creation', '/subscription-selection', '/intro-splash', '/language-selection'];
    
    if (noMusicPages.some(page => pathname.startsWith(page))) {
      // Pause music on these pages
      if (soundRef.current && isInitializedRef.current) {
        console.log('[MusicPlayer] Pausing music on:', pathname);
        soundRef.current.pauseAsync().catch(() => {});
      }
    }
    // Music will only resume when calendar page specifically requests it
  }, [pathname, isMuted]);

  useEffect(() => {
    let isMounted = true;

    async function switchMusic() {
      // Don't switch music on no-music pages
      const noMusicPages = ['/account-creation', '/subscription-selection'];
      if (noMusicPages.includes(pathname)) {
        return;
      }
      
      const audioStyleTracks = getTracksForStyle(audioStyle);
      const selectedTrackIndex = getSelectedTrackForStyle(audioStyle);
      
      const musicUris = audioStyleTracks.length > 0 ? audioStyleTracks : (theme?.musicUris || [DEFAULT_AUDIO_URI]);
      const startIndex = audioStyleTracks.length > 0 ? selectedTrackIndex : (musicUris.length > 1 ? musicUris.length - 1 : 0);
      const newUri = musicUris[startIndex];
      
      if (newUri === currentUriRef.current || !isInitializedRef.current) {
        return;
      }

      console.log("Switching music theme from", currentUriRef.current, "to", newUri);
      
      // When user selects a new track, we want to enable sound (unmute) if it was muted
      if (isMuted) {
        console.log("Auto-unmuting for new track selection");
        setIsMuted(false);
        AsyncStorage.setItem(MUTE_KEY, "false").catch(err => console.error("Error saving mute state:", err));
      }
      
      musicUrisRef.current = musicUris;
      currentTrackIndexRef.current = startIndex;

      try {
        if (soundRef.current) {
          await soundRef.current.unloadAsync();
          soundRef.current = null;
          isInitializedRef.current = false;
        }

        if (!isMounted) return;

        try {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: newUri },
            { 
              shouldPlay: true,
              isLooping: false,
              volume: 0.4
            },
            (status) => {
              if (!status.isLoaded && 'error' in status) {
                console.log('[MusicPlayer] Audio loading error:', status.error);
              }
            }
          );

          if (!isMounted) {
            await newSound?.unloadAsync().catch(() => {});
            return;
          }

          soundRef.current = newSound;
          isInitializedRef.current = true;
          currentUriRef.current = newUri;
          
          newSound.setOnPlaybackStatusUpdate((status) => {
            if (status.isLoaded && status.didJustFinish && !status.isLooping) {
              playNextTrack();
            }
          });
          
          console.log('[MusicPlayer] Music switched successfully to:', newUri);
        } catch (audioError: any) {
          console.log('[MusicPlayer] Switch track not supported:', audioError?.message || audioError);
          setIsDisabled(true);
        }
      } catch (error) {
        console.log('[MusicPlayer] Error switching music:', error);
      }
    }

    switchMusic();

    return () => {
      isMounted = false;
    };
  }, [theme, audioStyle, isMuted, getTracksForStyle, getSelectedTrackForStyle, pathname, playNextTrack]);



  const toggleMute = useCallback(async () => {
    if (isDisabled || !soundRef.current || !isInitializedRef.current) {
      console.log("Cannot toggle mute: sound not initialized or disabled");
      return;
    }

    try {
      const newMutedState = !isMuted;
      
      if (newMutedState) {
        await soundRef.current.pauseAsync();
      } else {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.playAsync();
        }
      }
      
      setIsMuted(newMutedState);
      await AsyncStorage.setItem(MUTE_KEY, String(newMutedState));
      console.log("Music mute toggled:", newMutedState);
    } catch (error) {
      console.error("Error toggling mute:", error);
    }
  }, [isMuted, isDisabled]);



  // Function to start music after intro splash
  const startMusicAfterIntro = useCallback(async () => {
    await AsyncStorage.setItem(INTRO_SPLASH_OPENED_KEY, "true");
    // setShouldDelayMusic(false);
    // Don't auto-play here anymore
    console.log('[MusicPlayer] Intro completed, music ready but not playing');
  }, []);

  // Function called when calendar page opens
  const notifyCalendarOpened = useCallback(async () => {
    // Clear any existing timeout
    if (calendarTimeoutRef.current) {
      clearTimeout(calendarTimeoutRef.current);
    }
    
    console.log('[MusicPlayer] Calendar opened, starting 10 second timer');
    
    // Start music after 10 seconds
    calendarTimeoutRef.current = setTimeout(async () => {
      if (soundRef.current && !isMutedRef.current && isInitializedRef.current) {
        console.log('[MusicPlayer] Starting music after 10 seconds on calendar page');
        try {
          const status = await soundRef.current.getStatusAsync();
          if (status.isLoaded) {
             await soundRef.current.playAsync();
          }
        } catch (error: any) {
           // Handle NotAllowedError specifically for web/browsers
          // Check error name, code, and message content
          if (
            error?.name === 'NotAllowedError' || 
            error?.code === 'NotAllowedError' || 
            error?.message?.includes('NotAllowedError') || 
            error?.message?.includes('The request is not allowed')
          ) {
            console.log('[MusicPlayer] Autoplay prevented. Waiting for user interaction.');
            // Sync UI state to muted since we couldn't play
            setIsMuted(true);
            await AsyncStorage.setItem(MUTE_KEY, "true").catch(() => {});
          } else {
            console.error('[MusicPlayer] Error starting music:', error);
          }
        }
      }
    }, 10000); // 10 seconds delay
  }, []);

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (calendarTimeoutRef.current) {
        clearTimeout(calendarTimeoutRef.current);
      }
    };
  }, []);

  return useMemo(
    () => ({
      isMuted,
      toggleMute,
      isLoading,
      isDisabled,
      startMusicAfterIntro,
      notifyCalendarOpened,
    }),
    [isMuted, toggleMute, isLoading, isDisabled, startMusicAfterIntro, notifyCalendarOpened]
  );
});
