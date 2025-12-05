import createContextHook from "@nkzw/create-context-hook";
import { useState, useEffect, useMemo, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { encrypt, decrypt } from "@/utils/encryption";

export type AudioStyle = 
  | "hz-frequencies"
  | "christmas"
  | "halloween"
  | "morning"
  | "piano-electronic"
  | "night-time"
  | "rain-relaxing"
  | "country"
  | "relaxing";

export type AudioStyleOption = {
  id: AudioStyle;
  name: string;
  description: string;
  tracks: string[];
};

const PROJECT_BASE = "https://rork.app/pa/ier8mze8ucoqq9oktvadp";

export const AUDIO_STYLES: AudioStyleOption[] = [
  {
    id: "hz-frequencies",
    name: "Hz Frequencies",
    description: "Binaural beats and frequency healing",
    tracks: [
      `${PROJECT_BASE}/song_442hz_1`,
      `${PROJECT_BASE}/hz_528_healing`,
      `${PROJECT_BASE}/hz_432_meditation`,
      `${PROJECT_BASE}/hz_396_liberation`,
    ],
  },
  {
    id: "christmas",
    name: "Christmas Music",
    description: "Festive holiday music",
    tracks: [
      `${PROJECT_BASE}/christmas_bells`,
      `${PROJECT_BASE}/christmas_piano`,
      `${PROJECT_BASE}/christmas_ambient`,
    ],
  },
  {
    id: "halloween",
    name: "Halloween Music",
    description: "Spooky atmospheric sounds",
    tracks: [
      `${PROJECT_BASE}/halloween_spooky`,
      `${PROJECT_BASE}/halloween_ambient`,
      `${PROJECT_BASE}/halloween_eerie`,
    ],
  },
  {
    id: "morning",
    name: "Morning Music",
    description: "Uplifting morning tunes",
    tracks: [
      `${PROJECT_BASE}/morning_sunrise`,
      `${PROJECT_BASE}/morning_peaceful`,
      `${PROJECT_BASE}/morning_birds`,
      `${PROJECT_BASE}/morning_energy`,
    ],
  },
  {
    id: "piano-electronic",
    name: "Piano Electronic",
    description: "Modern electronic piano music",
    tracks: [
      `${PROJECT_BASE}/piano_electronic_1`,
      `${PROJECT_BASE}/piano_synth_ambient`,
      `${PROJECT_BASE}/piano_modern_chill`,
    ],
  },
  {
    id: "night-time",
    name: "Night Time Music",
    description: "Calming evening melodies",
    tracks: [
      `${PROJECT_BASE}/night_stars`,
      `${PROJECT_BASE}/night_moon_ambient`,
      `${PROJECT_BASE}/night_peaceful_sleep`,
      `${PROJECT_BASE}/night_dreamy`,
    ],
  },
  {
    id: "rain-relaxing",
    name: "Rain Relaxing Music",
    description: "Soothing rain and ambient sounds",
    tracks: [
      `${PROJECT_BASE}/rain_gentle`,
      `${PROJECT_BASE}/rain_thunder_soft`,
      `${PROJECT_BASE}/rain_forest`,
      `${PROJECT_BASE}/rain_window`,
    ],
  },
  {
    id: "country",
    name: "Country Music",
    description: "Classic country vibes",
    tracks: [
      `${PROJECT_BASE}/country_acoustic`,
      `${PROJECT_BASE}/country_guitar`,
      `${PROJECT_BASE}/country_folk`,
    ],
  },
  {
    id: "relaxing",
    name: "Relaxing Music",
    description: "Peaceful and calming music",
    tracks: [
      `${PROJECT_BASE}/relaxing_spa`,
      `${PROJECT_BASE}/relaxing_meditation`,
      `${PROJECT_BASE}/relaxing_nature`,
      `${PROJECT_BASE}/relaxing_zen`,
    ],
  },
];

const AUDIO_STYLE_KEY = "@audio_style";
const SELECTED_TRACK_KEY = "@selected_track";
const AUDIO_TRACKS_KEY = "@audio_tracks";

export const [AudioStyleProvider, useAudioStyle] = createContextHook(() => {
  const [audioStyle, setAudioStyleState] = useState<AudioStyle>("hz-frequencies");
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [selectedTrackIndex, setSelectedTrackIndex] = useState<Record<string, number>>({});
  const [audioTracks, setAudioTracks] = useState<Record<string, string[]>>({});

  useEffect(() => {
    async function loadAudioStyle() {
      try {
        const [storedStyleRaw, storedTracksRaw, storedSelectedTrackRaw] = await Promise.all([
          AsyncStorage.getItem(AUDIO_STYLE_KEY),
          AsyncStorage.getItem(AUDIO_TRACKS_KEY),
          AsyncStorage.getItem(SELECTED_TRACK_KEY),
        ]);

        let storedStyle = storedStyleRaw;
        let storedTracks = storedTracksRaw;
        let storedSelectedTrack = storedSelectedTrackRaw;

        if (storedStyleRaw) {
          try {
            storedStyle = await decrypt(storedStyleRaw);
            console.log('🔓 Audio style decrypted successfully');
          } catch {
            console.log('⚠️ Loaded unencrypted audio style, will encrypt on next save');
          }
        }

        if (storedTracksRaw) {
          try {
            storedTracks = await decrypt(storedTracksRaw);
            console.log('🔓 Audio tracks decrypted successfully');
          } catch {
            console.log('⚠️ Loaded unencrypted audio tracks, will encrypt on next save');
          }
        }

        if (storedSelectedTrackRaw) {
          try {
            storedSelectedTrack = await decrypt(storedSelectedTrackRaw);
            console.log('🔓 Selected tracks decrypted successfully');
          } catch {
            console.log('⚠️ Loaded unencrypted selected tracks, will encrypt on next save');
          }
        }

        if (storedTracks) {
          try {
            const parsedTracks = JSON.parse(storedTracks);
            if (typeof parsedTracks === 'object' && parsedTracks !== null) {
              // Filter out guitar_30sec_1 from any style
              const cleanTracks = Object.keys(parsedTracks).reduce((acc, key) => {
                acc[key] = parsedTracks[key].filter((track: string) => !track.includes('guitar_30sec_1'));
                return acc;
              }, {} as Record<string, string[]>);
              
              setAudioTracks(cleanTracks);
              console.log("Audio tracks loaded (cleaned):", cleanTracks);
              
              // Save back cleaned tracks if changes were made
              if (JSON.stringify(cleanTracks) !== JSON.stringify(parsedTracks)) {
                 const encrypted = await encrypt(JSON.stringify(cleanTracks));
                 await AsyncStorage.setItem(AUDIO_TRACKS_KEY, encrypted);
              }
            } else {
              console.warn("Invalid audio tracks format, resetting");
              await AsyncStorage.removeItem(AUDIO_TRACKS_KEY);
            }
          } catch (parseError) {
            console.error("Error parsing audio tracks, clearing corrupted data:", parseError);
            await AsyncStorage.removeItem(AUDIO_TRACKS_KEY);
          }
        }

        if (storedSelectedTrack) {
          try {
            const parsedSelectedTrack = JSON.parse(storedSelectedTrack);
            if (typeof parsedSelectedTrack === 'object' && parsedSelectedTrack !== null) {
              setSelectedTrackIndex(parsedSelectedTrack);
              console.log("Selected tracks loaded:", parsedSelectedTrack);
            } else {
              console.warn("Invalid selected track format, resetting");
              await AsyncStorage.removeItem(SELECTED_TRACK_KEY);
            }
          } catch (parseError) {
            console.error("Error parsing selected track, clearing corrupted data:", parseError);
            await AsyncStorage.removeItem(SELECTED_TRACK_KEY);
          }
        }
        
        if (storedStyle && typeof storedStyle === 'string') {
          const trimmedValue = storedStyle.trim();
          
          if (AUDIO_STYLES.some(style => style.id === trimmedValue)) {
            setAudioStyleState(trimmedValue as AudioStyle);
            console.log("Audio style loaded:", trimmedValue);
          } else {
            console.warn("Invalid audio style stored, resetting to default:", trimmedValue);
            const encrypted = await encrypt("hz-frequencies");
            await AsyncStorage.setItem(AUDIO_STYLE_KEY, encrypted);
            setAudioStyleState("hz-frequencies");
          }
        } else {
          console.log("No audio style found, setting default");
          const encrypted = await encrypt("hz-frequencies");
          await AsyncStorage.setItem(AUDIO_STYLE_KEY, encrypted);
          setAudioStyleState("hz-frequencies");
        }
      } catch (error) {
        console.error("Error loading audio style:", error);
        try {
          const encrypted = await encrypt("hz-frequencies");
          await AsyncStorage.setItem(AUDIO_STYLE_KEY, encrypted);
          setAudioStyleState("hz-frequencies");
        } catch (saveError) {
          console.error("Error setting default audio style:", saveError);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadAudioStyle();
  }, []);

  const setAudioStyle = useCallback(async (style: AudioStyle) => {
    setAudioStyleState(style);
    const encrypted = await encrypt(style);
    await AsyncStorage.setItem(AUDIO_STYLE_KEY, encrypted);
    console.log("🔒 Audio style encrypted and saved:", style);
  }, []);

  const addTrackToStyle = useCallback(async (styleId: AudioStyle, trackUri: string) => {
    const existingTracks = audioTracks[styleId] || [];
    if (!existingTracks.includes(trackUri)) {
      const updatedTracks = [...existingTracks, trackUri];
      const newAudioTracks = { ...audioTracks, [styleId]: updatedTracks };
      setAudioTracks(newAudioTracks);
      const encrypted = await encrypt(JSON.stringify(newAudioTracks));
      await AsyncStorage.setItem(AUDIO_TRACKS_KEY, encrypted);
      console.log(`🔒 Track encrypted and added to ${styleId}:`, trackUri);
    }
  }, [audioTracks]);

  const setSelectedTrack = useCallback(async (styleId: AudioStyle, trackIndex: number) => {
    const newSelectedTrack = { ...selectedTrackIndex, [styleId]: trackIndex };
    setSelectedTrackIndex(newSelectedTrack);
    const encrypted = await encrypt(JSON.stringify(newSelectedTrack));
    await AsyncStorage.setItem(SELECTED_TRACK_KEY, encrypted);
    console.log(`🔒 Selected track encrypted and saved for ${styleId}:`, trackIndex);
  }, [selectedTrackIndex]);

  const getTracksForStyle = useCallback((styleId: AudioStyle): string[] => {
    const baseStyle = AUDIO_STYLES.find(s => s.id === styleId);
    const customTracks = audioTracks[styleId] || [];
    return [...(baseStyle?.tracks || []), ...customTracks];
  }, [audioTracks]);

  const getSelectedTrackForStyle = useCallback((styleId: AudioStyle): number => {
    return selectedTrackIndex[styleId] ?? 0;
  }, [selectedTrackIndex]);

  const currentStyleData = useMemo(
    () => AUDIO_STYLES.find(s => s.id === audioStyle) || AUDIO_STYLES[0],
    [audioStyle]
  );

  return useMemo(
    () => ({
      audioStyle,
      setAudioStyle,
      currentStyleData,
      allStyles: AUDIO_STYLES,
      isLoading,
      addTrackToStyle,
      setSelectedTrack,
      getTracksForStyle,
      getSelectedTrackForStyle,
      audioTracks,
      selectedTrackIndex,
    }),
    [audioStyle, setAudioStyle, currentStyleData, isLoading, addTrackToStyle, setSelectedTrack, getTracksForStyle, getSelectedTrackForStyle, audioTracks, selectedTrackIndex]
  );
});
