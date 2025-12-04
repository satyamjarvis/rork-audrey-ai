import { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Keyboard,
  FlatList,
  Modal,
  Animated,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Send,
  Users,
  Trash2,
  FileText,
  Download,
  Lock,
  ChevronDown,
  Mic,
  UserPlus,
  Bell,
  BellOff,
  X,
  Paperclip,
  Play,
  Pause,
  Circle,
  Type,
  Palette,
} from "lucide-react-native";
import { router, useLocalSearchParams } from "expo-router";
import * as Haptics from "expo-haptics";

import { Audio } from "expo-av";

import { useChat, type FileAttachment, DEFAULT_THEME } from "@/contexts/ChatContext";
import { useCalendar } from "@/contexts/CalendarContext";
import colors from "@/constants/colors";
import { downloadAttachmentToDevice, getMimeTypeFromFileName, pickFileFromDevice } from "@/utils/attachmentHelpers";
import { useTheme } from "@/contexts/ThemeContext";
import EmojiPickerModal from "@/components/EmojiPickerModal";
import FontStyleModal from "@/components/FontStyleModal";
import AttachmentPreviewModal from "@/components/AttachmentPreviewModal";
import ChatBackground from "@/components/ChatBackground";
import ChatThemeModal from "@/components/ChatThemeModal";



function GlitterSendButton({ hasText, onPress, theme, isNightMode }: { hasText: boolean; onPress: () => void; theme: any; isNightMode: boolean }) {
  const glowAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim1 = useRef(new Animated.Value(0)).current;
  const sparkleAnim2 = useRef(new Animated.Value(0)).current;
  const sparkleAnim3 = useRef(new Animated.Value(0)).current;
  const sparkleAnim4 = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (hasText) {
      const glowLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0.3,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      );

      const pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );

      const rotateLoop = Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      );

      const createSparkle = (anim: Animated.Value, delay: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: 1,
              duration: 400,
              delay,
              useNativeDriver: true,
            }),
            Animated.timing(anim, {
              toValue: 0,
              duration: 400,
              useNativeDriver: true,
            }),
          ])
        );
      };

      const sparkle1 = createSparkle(sparkleAnim1, 0);
      const sparkle2 = createSparkle(sparkleAnim2, 200);
      const sparkle3 = createSparkle(sparkleAnim3, 400);
      const sparkle4 = createSparkle(sparkleAnim4, 600);

      glowLoop.start();
      pulseLoop.start();
      rotateLoop.start();
      sparkle1.start();
      sparkle2.start();
      sparkle3.start();
      sparkle4.start();

      return () => {
        glowLoop.stop();
        pulseLoop.stop();
        rotateLoop.stop();
        sparkle1.stop();
        sparkle2.stop();
        sparkle3.stop();
        sparkle4.stop();
      };
    } else {
      glowAnim.setValue(0);
      pulseAnim.setValue(1);
      rotateAnim.setValue(0);
      sparkleAnim1.setValue(0);
      sparkleAnim2.setValue(0);
      sparkleAnim3.setValue(0);
      sparkleAnim4.setValue(0);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasText]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 0.8],
  });

  const rotateInterpolate = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sparklePositions = [
    { top: -6, right: -6 },
    { top: -4, left: -4 },
    { bottom: -6, right: -4 },
    { bottom: -4, left: -6 },
  ];

  return (
    <TouchableOpacity
      style={[glitterSendStyles.container, !hasText && glitterSendStyles.disabled]}
      onPress={onPress}
      disabled={!hasText}
      activeOpacity={0.8}
    >
      {hasText && (
        <>
          <Animated.View
            style={[
              glitterSendStyles.glowOuter,
              {
                opacity: glowOpacity,
                backgroundColor: isNightMode ? '#FFD700' : theme.colors.primary,
                transform: [{ scale: pulseAnim }],
              },
            ]}
          />
          <Animated.View
            style={[
              glitterSendStyles.glowMiddle,
              {
                opacity: glowOpacity,
                backgroundColor: isNightMode ? '#FF1493' : theme.colors.secondary || theme.colors.primary,
                transform: [{ rotate: rotateInterpolate }],
              },
            ]}
          />
          {[sparkleAnim1, sparkleAnim2, sparkleAnim3, sparkleAnim4].map((anim, index) => (
            <Animated.View
              key={index}
              style={[
                glitterSendStyles.sparkle,
                sparklePositions[index],
                {
                  opacity: anim,
                  transform: [
                    {
                      scale: anim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, 1.2],
                      }),
                    },
                  ],
                  backgroundColor: index % 2 === 0 
                    ? (isNightMode ? '#FFD700' : '#FFD700') 
                    : (isNightMode ? '#FF1493' : '#00BFFF'),
                },
              ]}
            />
          ))}
        </>
      )}
      <Animated.View
        style={[
          glitterSendStyles.buttonInner,
          hasText && { transform: [{ scale: pulseAnim }] },
        ]}
      >
        <LinearGradient
          colors={
            hasText
              ? (isNightMode ? ['#FFD700', '#FF8C00', '#FF1493'] : theme.gradients.primary as any)
              : ['#E0E0E0', '#D0D0D0']
          }
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={glitterSendStyles.gradient}
        >
          <Send color="#FFFFFF" size={18} strokeWidth={2.5} />
        </LinearGradient>
      </Animated.View>
    </TouchableOpacity>
  );
}

const glitterSendStyles = StyleSheet.create({
  container: {
    width: 46,
    height: 46,
    borderRadius: 23,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    position: 'relative' as const,
  },
  disabled: {
    opacity: 0.5,
  },
  glowOuter: {
    position: 'absolute' as const,
    width: 56,
    height: 56,
    borderRadius: 28,
    zIndex: -2,
  },
  glowMiddle: {
    position: 'absolute' as const,
    width: 50,
    height: 50,
    borderRadius: 25,
    zIndex: -1,
  },
  sparkle: {
    position: 'absolute' as const,
    width: 8,
    height: 8,
    borderRadius: 4,
    zIndex: 10,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 4,
    elevation: 6,
  },
  buttonInner: {
    width: 42,
    height: 42,
    borderRadius: 21,
    overflow: 'hidden' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  gradient: {
    width: '100%',
    height: '100%',
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
});

function AnimatedMusicIcon({ isPlaying, color }: { isPlaying: boolean; color: string }) {
  const scaleAnim1 = useRef(new Animated.Value(0.3)).current;
  const scaleAnim2 = useRef(new Animated.Value(0.5)).current;
  const scaleAnim3 = useRef(new Animated.Value(0.4)).current;
  const scaleAnim4 = useRef(new Animated.Value(0.6)).current;
  const scaleAnim5 = useRef(new Animated.Value(0.3)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isPlaying) {
      const createWave = (anim: Animated.Value, delay: number, min: number, max: number) => {
        return Animated.loop(
          Animated.sequence([
            Animated.timing(anim, {
              toValue: max,
              duration: 300,
              delay,
              useNativeDriver: false,
            }),
            Animated.timing(anim, {
              toValue: min,
              duration: 300,
              useNativeDriver: false,
            }),
          ])
        );
      };

      const wave1 = createWave(scaleAnim1, 0, 0.3, 1);
      const wave2 = createWave(scaleAnim2, 60, 0.4, 0.9);
      const wave3 = createWave(scaleAnim3, 120, 0.5, 1.1);
      const wave4 = createWave(scaleAnim4, 180, 0.3, 0.8);
      const wave5 = createWave(scaleAnim5, 240, 0.4, 0.95);

      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: false,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: false,
          }),
        ])
      );

      const glow = Animated.loop(
        Animated.sequence([
          Animated.timing(glowAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: false,
          }),
          Animated.timing(glowAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: false,
          }),
        ])
      );

      wave1.start();
      wave2.start();
      wave3.start();
      wave4.start();
      wave5.start();
      pulse.start();
      glow.start();

      return () => {
        wave1.stop();
        wave2.stop();
        wave3.stop();
        wave4.stop();
        wave5.stop();
        pulse.stop();
        glow.stop();
      };
    } else {
      // Reset animations to base values when stopped
      Animated.timing(scaleAnim1, { toValue: 0.3, duration: 200, useNativeDriver: false }).start();
      Animated.timing(scaleAnim2, { toValue: 0.5, duration: 200, useNativeDriver: false }).start();
      Animated.timing(scaleAnim3, { toValue: 0.4, duration: 200, useNativeDriver: false }).start();
      Animated.timing(scaleAnim4, { toValue: 0.6, duration: 200, useNativeDriver: false }).start();
      Animated.timing(scaleAnim5, { toValue: 0.3, duration: 200, useNativeDriver: false }).start();
      pulseAnim.setValue(1);
      glowAnim.setValue(0);
    }
  }, [isPlaying, scaleAnim1, scaleAnim2, scaleAnim3, scaleAnim4, scaleAnim5, pulseAnim, glowAnim]);

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.animatedMusicIconContainer}>
      <View style={styles.waveformContainer}>
        <Animated.View
          style={[
            styles.waveBar,
            {
              backgroundColor: color,
              transform: [{ scaleY: scaleAnim1 }],
              opacity: isPlaying ? 1 : 0.5,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.waveBar,
            {
              backgroundColor: color,
              transform: [{ scaleY: scaleAnim2 }],
              opacity: isPlaying ? 1 : 0.5,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.waveBar,
            styles.waveBarCenter,
            {
              backgroundColor: color,
              transform: [{ scaleY: scaleAnim3 }],
              opacity: isPlaying ? 1 : 0.6,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.waveBar,
            {
              backgroundColor: color,
              transform: [{ scaleY: scaleAnim4 }],
              opacity: isPlaying ? 1 : 0.5,
            },
          ]}
        />
        <Animated.View
          style={[
            styles.waveBar,
            {
              backgroundColor: color,
              transform: [{ scaleY: scaleAnim5 }],
              opacity: isPlaying ? 1 : 0.5,
            },
          ]}
        />
      </View>
      {isPlaying && (
        <Animated.View
          style={[
            styles.glowCircle,
            {
              backgroundColor: color,
              opacity: glowOpacity,
              transform: [{ scale: pulseAnim }],
            },
          ]}
        />
      )}
    </View>
  );
}

export default function CalendarChatScreen() {
  const insets = useSafeAreaInsets();
  const { calendarId } = useLocalSearchParams<{ calendarId: string }>();
  const { theme } = useTheme();
  const { 
    sendMessage, 
    getMessagesForCalendar, 
    clearCalendarChat, 
    getDecryptedMessage,
    downloadAttachment,
    sendFileAttachment,
    setChatTheme,
    chatThemes,
  } = useChat();
  const { calendars } = useCalendar();
  const [messageText, setMessageText] = useState("");
  const scrollViewRef = useRef<ScrollView>(null);
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  
  const [showChatList, setShowChatList] = useState(false);
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [showMembersModal, setShowMembersModal] = useState(false);
  const [newMemberEmail, setNewMemberEmail] = useState("");
  const [chatNotifications, setChatNotifications] = useState<{[key: string]: boolean}>({});
  
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState<string | null>(null);
  const [playbackSound, setPlaybackSound] = useState<Audio.Sound | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isPickingDocument, setIsPickingDocument] = useState(false);
  const [showVoiceSendOptions, setShowVoiceSendOptions] = useState(false);
  const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
  const [messagePlaybackSounds, setMessagePlaybackSounds] = useState<{[key: string]: Audio.Sound}>({});
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const [showFontStyleModal, setShowFontStyleModal] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [selectedFontStyle, setSelectedFontStyle] = useState<'normal' | 'bold' | 'italic' | 'bold-italic'>('normal');
  
  const isNightMode = theme.id === 'night-mode' || theme.id === 'night';
  const [selectedTextColor, setSelectedTextColor] = useState<string>(isNightMode ? '#FFFFFF' : '#000000');
  
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const [selectedAttachment, setSelectedAttachment] = useState<{ messageId: string; attachment: any } | null>(null);
  const [attachmentFileData, setAttachmentFileData] = useState<string | null>(null);

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener('keyboardDidShow', (e) => {
      setKeyboardVisible(true);
      setKeyboardHeight(e.endCoordinates.height);
    });
    const keyboardDidHideListener = Keyboard.addListener('keyboardDidHide', () => {
      setKeyboardVisible(false);
      setKeyboardHeight(0);
    });

    return () => {
      keyboardDidShowListener.remove();
      keyboardDidHideListener.remove();
    };
  }, []);

  const messages = getMessagesForCalendar(calendarId || "");
  const [decryptedMessages, setDecryptedMessages] = useState<{ [key: string]: string }>({});
  const [lastMessagePreviews, setLastMessagePreviews] = useState<{[key: string]: string}>({});

  useEffect(() => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages.length]);

  useEffect(() => {
    const decryptMessages = async () => {
      const decrypted: { [key: string]: string } = {};
      for (const message of messages) {
        if (message.encrypted && message.encryptedData) {
          try {
            const text = await getDecryptedMessage(message);
            decrypted[message.id] = text;
          } catch (error) {
            console.error("Error decrypting message:", error);
            decrypted[message.id] = "[Decryption failed]";
          }
        } else {
          decrypted[message.id] = message.text;
        }
      }
      setDecryptedMessages(decrypted);
    };
    
    if (messages.length > 0) {
      decryptMessages();
    }
  }, [messages, getDecryptedMessage]);



  const handleSendMessage = async () => {
    if (!messageText.trim() || !calendarId) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      // Preserve the message with emojis and formatting
      const messageToSend = messageText.trim();
      await sendMessage(calendarId, messageToSend, "me", undefined, selectedTextColor, selectedFontStyle);
      setMessageText("");
      
      // Scroll to bottom after sending
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
      Alert.alert("Error", "Failed to send message. Please try again.");
    }
  };

  const startRecording = async () => {
    try {
      if (recording) {
        console.log("Recording already in progress, stopping it first...");
        try {
          await recording.stopAndUnloadAsync();
        } catch (err) {
          console.log("Error stopping existing recording:", err);
        }
        setRecording(null);
        setIsRecording(false);
      }

      console.log("Requesting permissions...");
      const permission = await Audio.requestPermissionsAsync();
      
      if (permission.status !== "granted") {
        Alert.alert("Permission required", "Please grant microphone permission");
        return;
      }

      if (Platform.OS !== "web") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: true,
          playsInSilentModeIOS: true,
        });
      }

      console.log("Starting recording...");
      const { recording: newRecording } = await Audio.Recording.createAsync(
        Platform.OS === "web" ? Audio.RecordingOptionsPresets.HIGH_QUALITY : {
          android: {
            extension: ".m4a",
            outputFormat: Audio.AndroidOutputFormat.MPEG_4,
            audioEncoder: Audio.AndroidAudioEncoder.AAC,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
          },
          ios: {
            extension: ".wav",
            outputFormat: Audio.IOSOutputFormat.LINEARPCM,
            audioQuality: Audio.IOSAudioQuality.HIGH,
            sampleRate: 44100,
            numberOfChannels: 2,
            bitRate: 128000,
            linearPCMBitDepth: 16,
            linearPCMIsBigEndian: false,
            linearPCMIsFloat: false,
          },
          web: {
            mimeType: "audio/webm",
            bitsPerSecond: 128000,
          },
        }
      );
      
      setRecording(newRecording);
      setIsRecording(true);
      
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }
    } catch (err) {
      console.error("Failed to start recording", err);
      setRecording(null);
      setIsRecording(false);
      if (Platform.OS !== "web") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      }
      Alert.alert("Error", "Failed to start recording: " + (err instanceof Error ? err.message : String(err)));
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      console.log("Stopping recording...");
      setIsRecording(false);
      await recording.stopAndUnloadAsync();
      
      if (Platform.OS !== "web") {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
        });
      }
      
      const uri = recording.getURI();
      console.log("Recording stopped and stored at", uri);
      setRecordingUri(uri);
      setRecording(null);

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };



  const playRecording = async () => {
    if (!recordingUri) return;

    try {
      if (playbackSound) {
        if (isPlaying) {
          await playbackSound.pauseAsync();
          setIsPlaying(false);
        } else {
          await playbackSound.playAsync();
          setIsPlaying(true);
        }
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: recordingUri },
        { shouldPlay: true }
      );
      
      setPlaybackSound(sound);
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
        }
      });
    } catch (err) {
      console.error("Failed to play recording", err);
    }
  };

  const sendVoiceMessage = async (asFile: boolean = false) => {
    if (!recordingUri || !calendarId) return;

    try {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const response = await fetch(recordingUri);
      const blob = await response.blob();
      const reader = new FileReader();
      
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        const fileExtension = Platform.OS === "ios" ? "wav" : Platform.OS === "android" ? "m4a" : "webm";
        
        if (asFile) {
          await sendFileAttachment(
            calendarId,
            base64data.split(",")[1] || base64data,
            `voice_${Date.now()}.${fileExtension}`,
            "📁 Voice file"
          );
        } else {
          await sendMessage(
            calendarId,
            `🎤VOICE_MSG🎤${base64data}`
          );
        }
        
        setRecordingUri(null);
        setShowVoiceSendOptions(false);
        if (playbackSound) {
          await playbackSound.unloadAsync();
          setPlaybackSound(null);
        }
      };
      
      reader.readAsDataURL(blob);
    } catch (err) {
      console.error("Failed to send voice message", err);
      Alert.alert("Error", "Failed to send voice message");
    }
  };

  const playInlineVoiceMessage = async (messageId: string, messageText: string) => {
    try {
      if (playingMessageId === messageId) {
        const sound = messagePlaybackSounds[messageId];
        if (sound) {
          const status = await sound.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            await sound.pauseAsync();
            setPlayingMessageId(null);
          } else if (status.isLoaded) {
            await sound.playAsync();
            setPlayingMessageId(messageId);
          }
        }
        return;
      }

      if (playingMessageId) {
        const previousSound = messagePlaybackSounds[playingMessageId];
        if (previousSound) {
          await previousSound.pauseAsync();
        }
      }

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const voiceMarker = "🎤VOICE_MSG🎤";
      if (!messageText.includes(voiceMarker)) {
        Alert.alert("Error", "Invalid voice message format");
        return;
      }

      const base64Audio = messageText.split(voiceMarker)[1];
      if (!base64Audio) {
        Alert.alert("Error", "Voice data not found");
        return;
      }

      const { sound } = await Audio.Sound.createAsync(
        { uri: base64Audio },
        { shouldPlay: true }
      );

      setMessagePlaybackSounds(prev => ({ ...prev, [messageId]: sound }));
      setPlayingMessageId(messageId);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingMessageId(null);
        }
      });
    } catch (err) {
      console.error("Failed to play inline voice message", err);
      Alert.alert("Error", "Failed to play voice message");
    }
  };

  const playMessageVoice = async (messageId: string, attachment: FileAttachment) => {
    if (!calendarId) return;

    try {
      if (playingMessageId === messageId) {
        const sound = messagePlaybackSounds[messageId];
        if (sound) {
          const status = await sound.getStatusAsync();
          if (status.isLoaded && status.isPlaying) {
            await sound.pauseAsync();
            setPlayingMessageId(null);
          } else if (status.isLoaded) {
            await sound.playAsync();
            setPlayingMessageId(messageId);
          }
        }
        return;
      }

      if (playingMessageId) {
        const previousSound = messagePlaybackSounds[playingMessageId];
        if (previousSound) {
          await previousSound.pauseAsync();
        }
      }

      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }

      const fileData = await downloadAttachment(attachment, calendarId, messageId);
      const base64Audio = `data:audio/${attachment.fileType.split("/")[1] || "mp4"};base64,${fileData}`;

      const { sound } = await Audio.Sound.createAsync(
        { uri: base64Audio },
        { shouldPlay: true }
      );

      setMessagePlaybackSounds(prev => ({ ...prev, [messageId]: sound }));
      setPlayingMessageId(messageId);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setPlayingMessageId(null);
        }
      });
    } catch (err) {
      console.error("Failed to play voice message", err);
      Alert.alert("Error", "Failed to play voice message");
    }
  };

  const handlePickDocument = async (type: string = "any") => {
    if (isPickingDocument) {
      console.log("[CalendarChat] Document picker already in progress, ignoring request");
      return;
    }

    try {
      setIsPickingDocument(true);
      setShowAttachMenu(false);
      console.log("[CalendarChat] Starting document picker, type:", type);
      
      let fileType: 'image' | 'video' | 'audio' | 'document' | 'any' = 'any';
      let messagePrefix = "📎";
      
      if (type === "media") {
        fileType = 'any';
        messagePrefix = "📸";
      } else if (type === "document") {
        fileType = 'document';
        messagePrefix = "📄";
      } else if (type === "image") {
        fileType = 'image';
        messagePrefix = "🖼️";
      } else if (type === "video") {
        fileType = 'video';
        messagePrefix = "🎥";
      } else if (type === "audio") {
        fileType = 'audio';
        messagePrefix = "🎵";
      }
      
      const pickedFile = await pickFileFromDevice({ type: fileType, maxSizeInMB: 10 });
      
      if (!pickedFile) {
        console.log("[CalendarChat] No file picked or user cancelled");
        setIsPickingDocument(false);
        return;
      }
      
      console.log("[CalendarChat] File picked:", pickedFile.name);
      console.log("[CalendarChat] File type:", pickedFile.type);
      console.log("[CalendarChat] File size:", pickedFile.size);
      console.log("[CalendarChat] Base64 data length:", pickedFile.base64Data?.length || 0);
      
      if (!pickedFile.base64Data || pickedFile.base64Data.length === 0) {
        console.error("[CalendarChat] File has no data");
        Alert.alert("Attachment Error", "The selected file could not be read. Please try a different file.");
        setIsPickingDocument(false);
        return;
      }
      
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      }

      if (calendarId) {
        const displayName = pickedFile.name.length > 30 ? pickedFile.name.substring(0, 27) + "..." : pickedFile.name;
        
        console.log("[CalendarChat] Sending attachment to chat...");
        try {
          await sendFileAttachment(
            calendarId,
            pickedFile.base64Data,
            pickedFile.name,
            `${messagePrefix} ${displayName}`,
            "me",
            true,
            'external'
          );
          console.log("[CalendarChat] Attachment sent successfully");
          
          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          
          setTimeout(() => {
            scrollViewRef.current?.scrollToEnd({ animated: true });
          }, 100);
        } catch (sendError) {
          console.error("[CalendarChat] Error sending attachment:", sendError);
          Alert.alert("Send Error", "Failed to send attachment. Please try again.");
        }
      } else {
        console.error("[CalendarChat] Missing calendarId");
        Alert.alert("Error", "Chat not found. Please try again.");
      }
      
      setIsPickingDocument(false);
    } catch (err) {
      console.error("[CalendarChat] Error picking document:", err);
      Alert.alert("Attachment Error", "Failed to attach file. Please try again.");
      setIsPickingDocument(false);
    }
  };

  const toggleNotifications = (chatId: string) => {
    setChatNotifications(prev => ({
      ...prev,
      [chatId]: !prev[chatId]
    }));
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const handleAddMember = () => {
    if (!newMemberEmail.trim()) {
      Alert.alert("Error", "Please enter an email address");
      return;
    }
    
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    
    Alert.alert("Success", `Invitation sent to ${newMemberEmail}`);
    setNewMemberEmail("");
    setShowMembersModal(false);
  };

  const handleAttachmentPress = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message?.attachment || !calendarId) return;

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const fileData = await downloadAttachment(message.attachment, calendarId, messageId);
      setSelectedAttachment({ messageId, attachment: message.attachment });
      setAttachmentFileData(fileData);
      setShowAttachmentPreview(true);
    } catch (error) {
      console.error("Error loading attachment:", error);
      Alert.alert("Error", "Failed to load attachment");
    }
  };

  const handleDownloadAttachment = async (messageId: string) => {
    const message = messages.find(m => m.id === messageId);
    if (!message?.attachment || !calendarId) {
      console.error('[CalendarChat] Download failed: missing message or attachment');
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }

    console.log('[CalendarChat] Starting download for:', message.attachment.fileName);
    console.log('[CalendarChat] Attachment file type:', message.attachment.fileType);
    console.log('[CalendarChat] Encrypted data exists:', !!message.attachment.encryptedData);

    try {
      const fileData = await downloadAttachment(message.attachment, calendarId, messageId);
      const fileName = message.attachment.fileName;
      const mimeType = message.attachment.fileType || getMimeTypeFromFileName(fileName);

      console.log('[CalendarChat] Decrypted file data length:', fileData?.length || 0);
      console.log('[CalendarChat] Using MIME type:', mimeType);

      if (!fileData || fileData.length === 0) {
        console.error('[CalendarChat] No file data to download');
        Alert.alert("Error", "File data is empty. The file may be corrupted.");
        return;
      }

      const success = await downloadAttachmentToDevice({
        fileName: fileName,
        fileData: fileData,
        fileType: mimeType,
        showSuccessAlert: true,
      });

      if (!success) {
        console.error('[CalendarChat] Download helper returned false');
      } else {
        console.log('[CalendarChat] Download completed successfully');
      }
    } catch (error) {
      console.error("[CalendarChat] Error downloading attachment:", error);
      Alert.alert("Error", "Failed to download file. Please try again.");
    }
  };

  const handleClearChat = () => {
    Alert.alert(
      "Clear Chat",
      "Are you sure you want to clear all messages in this chat?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear",
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            if (calendarId) {
              await clearCalendarChat(calendarId);
            }
          },
        },
      ]
    );
  };

  useEffect(() => {
    const loadChatListPreviews = async () => {
      const previews: {[key: string]: string} = {};
      for (const cal of calendars) {
        const calMessages = getMessagesForCalendar(cal.id);
        const lastMessage = calMessages[calMessages.length - 1];
        if (lastMessage) {
          if (lastMessage.encrypted && lastMessage.encryptedData) {
            try {
              const decrypted = await getDecryptedMessage(lastMessage);
              if (decrypted.includes("🎤VOICE_MSG🎤")) {
                previews[cal.id] = "🎤 Voice message";
              } else {
                previews[cal.id] = decrypted;
              }
            } catch (error) {
              console.error("Error decrypting preview:", error);
              previews[cal.id] = "[Encrypted message]";
            }
          } else {
            previews[cal.id] = lastMessage.text || "📎 Attachment";
          }
        }
      }
      setLastMessagePreviews(previews);
    };
    
    if (showChatList) {
      loadChatListPreviews();
    }
  }, [showChatList, calendars, getMessagesForCalendar, getDecryptedMessage]);

  const chatsWithMessages = calendars.map(cal => {
    const calMessages = getMessagesForCalendar(cal.id);
    const lastMessage = calMessages[calMessages.length - 1];
    const unreadCount = calMessages.filter(m => !m.encrypted || m.senderEmail !== "me").length;
    
    return {
      ...cal,
      lastMessage,
      unreadCount: Math.min(unreadCount, 99),
      hasNotifications: chatNotifications[cal.id] !== false,
    };
  });

  if (showChatList) {
    return (
      <View style={styles.container}>
        <LinearGradient 
          colors={isNightMode ? ["#0a0a0f", "#1a0a1f", "#2a0a2f", "#1a0a1f", "#0a0a0f"] : theme.gradients.background as any} 
          style={styles.gradient}
        >
          <View style={[styles.listHeader, { paddingTop: insets.top + 20 }]}>
            <View style={styles.listHeaderTop}>
              <View style={styles.listHeaderTitleContainer}>
                <MessageCircle color={isNightMode ? "#FFD700" : theme.colors.primary} size={32} strokeWidth={2.5} />
                <Text style={[styles.listHeaderTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>Chats</Text>
              </View>
              <View style={[styles.encryptionBadgeHeader, {
                backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : "rgba(107, 155, 209, 0.1)"
              }]}>
                <Lock color={isNightMode ? "#FFD700" : theme.colors.primary} size={16} strokeWidth={2.5} />
                <Text style={[styles.encryptionText, { color: isNightMode ? "#FFD700" : theme.colors.primary }]}>Encrypted</Text>
              </View>
            </View>
            <Text style={[styles.listHeaderSubtitle, { color: isNightMode ? "#FF1493" : theme.colors.text.secondary }]}>
              All conversations are end-to-end encrypted
            </Text>
          </View>

          <FlatList
            data={chatsWithMessages}
            keyExtractor={(item) => item.id}
            contentContainerStyle={[styles.chatListContent, { paddingBottom: insets.bottom + 20 }]}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[styles.chatListItem, { 
                  backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground,
                  borderWidth: 1,
                  borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "transparent"
                }]}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSelectedChat(item.id);
                  setShowChatList(false);
                }}
                activeOpacity={0.7}
              >
                <View style={[styles.chatColorIndicator, { backgroundColor: item.color }]} />
                <View style={styles.chatListItemContent}>
                  <View style={styles.chatListItemTop}>
                    <View style={styles.chatListItemLeft}>
                      <Text style={[styles.chatListItemName, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>
                        {item.name}
                      </Text>
                      <View style={styles.chatListItemMembersRow}>
                        <Users color={isNightMode ? "#888888" : theme.colors.text.light} size={14} strokeWidth={2} />
                        <Text style={[styles.chatListItemMembers, { color: isNightMode ? "#888888" : theme.colors.text.light }]}>
                          {item.sharedWith.length + 1} members
                        </Text>
                      </View>
                    </View>
                    <View style={styles.chatListItemRight}>
                      {item.unreadCount > 0 && (
                        <View style={[styles.unreadBadge, { backgroundColor: isNightMode ? "#FF1493" : theme.colors.primary }]}>
                          <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
                        </View>
                      )}
                      <TouchableOpacity
                        onPress={(e) => {
                          e.stopPropagation();
                          toggleNotifications(item.id);
                        }}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                      >
                        {item.hasNotifications ? (
                          <Bell color={isNightMode ? "#FF1493" : theme.colors.primary} size={20} strokeWidth={2.5} />
                        ) : (
                          <BellOff color={isNightMode ? "#666666" : theme.colors.text.light} size={20} strokeWidth={2.5} />
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                  {item.lastMessage && (
                    <Text style={[styles.chatListItemLastMessage, { color: isNightMode ? "#888888" : theme.colors.text.secondary }]} numberOfLines={1}>
                      {lastMessagePreviews[item.id] || "Loading..."}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <MessageCircle color={isNightMode ? "#666666" : theme.colors.text.light} size={64} strokeWidth={1.5} />
                <Text style={[styles.emptyTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>No chats yet</Text>
                <Text style={[styles.emptyText, { color: isNightMode ? "#888888" : theme.colors.text.secondary }]}>
                  Create a calendar to start a conversation
                </Text>
              </View>
            }
          />
        </LinearGradient>
      </View>
    );
  }

  const calendar = calendars.find((cal) => cal.id === (selectedChat || calendarId));
  const currentChatId = selectedChat || calendarId;
  const currentTheme = chatThemes[currentChatId || ''] || DEFAULT_THEME;

  if (!calendar || !currentChatId) {
    return (
      <View style={styles.container}>
        <ChatBackground theme={currentTheme}>
          <View style={styles.errorContainer}>
            <Text style={[styles.errorText, { color: isNightMode ? "#888888" : theme.colors.text.secondary }]}>Chat not found</Text>
          </View>
        </ChatBackground>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
    >

      <ChatBackground theme={currentTheme}>
        <View style={styles.safeArea}>
          <View style={[styles.header, { 
            paddingTop: insets.top + 12,
            backgroundColor: isNightMode ? "rgba(80, 40, 100, 0.95)" : "rgba(255, 255, 255, 0.95)",
            borderBottomColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : "rgba(107, 155, 209, 0.1)"
          }]}>
            <TouchableOpacity
              style={[styles.backButton, { backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : `${theme.colors.primary}15` }]}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.selectionAsync();
                }
                if (router.canGoBack()) {
                  router.back();
                } else {
                  router.replace('/(tabs)/calendly' as any);
                }
              }}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ChevronLeft color={isNightMode ? "#FFD700" : theme.colors.primary} size={28} strokeWidth={2.5} />
            </TouchableOpacity>

            <View style={styles.headerTitleContainer}>
              <View style={[styles.calendarColorDot, { backgroundColor: calendar.color }]} />
              <View style={styles.headerTextContainer}>
                <Text style={[styles.headerTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>{calendar.name}</Text>
                <View style={styles.headerSubtitle}>
                  <Lock color={isNightMode ? "#FF1493" : theme.colors.primary} size={12} strokeWidth={2.5} />
                  <Text style={[styles.headerSubtitleText, { color: isNightMode ? "#FF1493" : theme.colors.text.secondary }]}>
                    End-to-end encrypted
                  </Text>
                </View>
              </View>
            </View>

            <View style={styles.headerActions}>
              <TouchableOpacity
                style={[styles.headerActionButton, { backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : `${theme.colors.primary}15` }]}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setShowThemeModal(true);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Palette color={isNightMode ? "#FFD700" : theme.colors.primary} size={20} strokeWidth={2.5} />
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.headerActionButton, { backgroundColor: isNightMode ? "rgba(0, 255, 135, 0.15)" : `${theme.colors.primary}15` }]}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setShowMembersModal(true);
                }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <UserPlus color={isNightMode ? "#00FF87" : theme.colors.primary} size={20} strokeWidth={2.5} />
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.headerActionButton, { backgroundColor: isNightMode ? "rgba(255, 20, 147, 0.15)" : "rgba(247, 127, 139, 0.1)" }]}
                onPress={handleClearChat}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Trash2 color={isNightMode ? "#FF1493" : "#F77F8B"} size={20} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView
            ref={scrollViewRef}
            style={styles.messagesContainer}
            contentContainerStyle={styles.messagesContent}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
          >
            {messages.length === 0 ? (
              <View style={styles.emptyState}>
                <MessageCircle color={colors.primary} size={64} strokeWidth={1.5} />
                <Text style={styles.emptyTitle}>No messages yet</Text>
                <Text style={styles.emptyText}>
                  Start a conversation with the members of this calendar
                </Text>
              </View>
            ) : (
              <View style={styles.messagesList}>
                {messages.map((message) => {
                  const isMe = message.senderEmail === "me";
                  const messageText = decryptedMessages[message.id] !== undefined 
                    ? decryptedMessages[message.id] 
                    : (message.text || "Decrypting...");
                  return (
                    <View
                      key={message.id}
                      style={[
                        styles.messageBubble,
                        isMe ? styles.myMessage : styles.theirMessage,
                      ]}
                    >
                      {!isMe && (
                        <Text style={styles.senderName}>{message.senderEmail}</Text>
                      )}
                      {message.encrypted && (
                        <View style={styles.encryptionBadge}>
                          <Lock color={isMe ? "#FFFFFF" : colors.primary} size={12} strokeWidth={2.5} />
                          <Text style={[
                            styles.encryptionBadgeText,
                            isMe ? styles.myEncryptionBadgeText : styles.theirEncryptionBadgeText,
                          ]}>
                            End-to-end encrypted
                          </Text>
                        </View>
                      )}
                      {messageText.includes("🎤VOICE_MSG🎤") && !message.attachment ? (
                        <TouchableOpacity
                          style={[
                            styles.voiceMessageContainer,
                            isMe ? styles.myVoiceMessage : styles.theirVoiceMessage,
                          ]}
                          onPress={() => playInlineVoiceMessage(message.id, messageText)}
                        >
                          <AnimatedMusicIcon
                            isPlaying={playingMessageId === message.id}
                            color={isNightMode ? "#FFFFFF" : (isMe ? "#000000" : colors.primary)}
                          />
                          <Text style={[
                            styles.voiceMessageText,
                            { color: isNightMode ? "#FFFFFF" : "#000000" },
                          ]}>
                            {playingMessageId === message.id ? "Playing..." : "Tap to play"}
                          </Text>
                        </TouchableOpacity>
                      ) : (!messageText.includes("🎤VOICE_MSG🎤") && !messageText.includes("📁 Voice file")) || !message.attachment ? (
                        <Text style={[
                          styles.messageText,
                          isMe ? styles.myMessageText : styles.theirMessageText,
                          { 
                            color: message.textColor || (isNightMode ? "#FFFFFF" : "#000000"),
                            fontWeight: message.fontStyle?.includes('bold') ? '700' : '400',
                            fontStyle: message.fontStyle?.includes('italic') ? 'italic' : 'normal',
                          },
                        ]}>
                          {messageText || "Loading..."}
                        </Text>
                      ) : null}
                      {message.attachment && (
                        <View>
                          {messageText && !messageText.includes("🎤VOICE_MSG🎤") && !messageText.includes("📁 Voice file") && (
                            <Text style={[
                              styles.attachmentDescription,
                              isMe ? styles.myMessageText : styles.theirMessageText,
                              { color: isNightMode ? "#FFFFFF" : "#000000" },
                            ]}>
                              {messageText}
                            </Text>
                          )}
                          {messageText.includes("📁 Voice file") ? (
                            <View style={styles.voiceFileRow}>
                              <TouchableOpacity
                                style={[
                                  styles.voiceMessageContainer,
                                  isMe ? styles.myVoiceMessage : styles.theirVoiceMessage,
                                ]}
                                onPress={() => playMessageVoice(message.id, message.attachment!)}
                              >
                                <AnimatedMusicIcon
                                  isPlaying={playingMessageId === message.id}
                                  color={isMe ? "#FFFFFF" : colors.primary}
                                />
                                <Text style={[
                                  styles.voiceMessageText,
                                  isMe ? styles.myVoiceMessageText : styles.theirVoiceMessageText,
                                ]}>
                                  {playingMessageId === message.id ? "Playing..." : "Tap to play"}
                                </Text>
                              </TouchableOpacity>
                              <TouchableOpacity
                                style={styles.downloadIconButton}
                                onPress={() => handleDownloadAttachment(message.id)}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              >
                                <Download 
                                  color="#888888" 
                                  size={18} 
                                  strokeWidth={2.5} 
                                />
                              </TouchableOpacity>
                            </View>
                          ) : (
                            <TouchableOpacity
                              style={[
                                styles.attachmentContainer,
                                isMe ? styles.myAttachment : styles.theirAttachment,
                              ]}
                              onPress={() => handleAttachmentPress(message.id)}
                            >
                              <FileText 
                                color="#888888" 
                                size={20} 
                                strokeWidth={2.5} 
                              />
                              <View style={styles.attachmentInfo}>
                                <Text style={[
                                  styles.attachmentName,
                                  { color: "#888888" },
                                ]} numberOfLines={1}>
                                  {message.attachment.fileName}
                                </Text>
                                <Text style={[
                                  styles.attachmentSize,
                                  { color: "#888888" },
                                ]}>
                                  {(message.attachment.size / 1024).toFixed(1)} KB • Encrypted
                                </Text>
                              </View>
                              <Download 
                                color="#888888" 
                                size={18} 
                                strokeWidth={2.5} 
                              />
                            </TouchableOpacity>
                          )}
                        </View>
                      )}
                      <Text style={[
                        styles.messageTime,
                        { color: isNightMode ? "rgba(255, 255, 255, 0.6)" : "rgba(0, 0, 0, 0.5)" },
                      ]}>
                        {new Date(message.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
          </ScrollView>

          {showVoiceSendOptions && recordingUri && (
            <View style={[styles.voiceSendOptionsOverlay, { 
              bottom: keyboardHeight > 0 ? keyboardHeight + 120 : 120
            }]}>
              <View style={[styles.voiceSendOptionsContainer, { backgroundColor: theme.colors.cardBackground }]}>
                <View style={styles.voiceSendOptionsHeader}>
                  <Mic color={theme.colors.primary} size={24} strokeWidth={2.5} />
                  <Text style={[styles.voiceSendOptionsTitle, { color: theme.colors.text.primary }]}>Send Voice Message</Text>
                </View>
                <TouchableOpacity
                  style={styles.voiceSendOption}
                  onPress={() => sendVoiceMessage(false)}
                >
                  <View style={[styles.voiceSendOptionIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                    <Play color={theme.colors.primary} size={24} strokeWidth={2.5} />
                  </View>
                  <View style={styles.voiceSendOptionText}>
                    <Text style={[styles.voiceSendOptionTitle, { color: theme.colors.text.primary }]}>Playable Voice</Text>
                    <Text style={[styles.voiceSendOptionSubtitle, { color: theme.colors.text.secondary }]}>Play directly in chat</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.voiceSendOption}
                  onPress={() => sendVoiceMessage(true)}
                >
                  <View style={[styles.voiceSendOptionIcon, { backgroundColor: "#4CAF5015" }]}>
                    <FileText color="#4CAF50" size={24} strokeWidth={2.5} />
                  </View>
                  <View style={styles.voiceSendOptionText}>
                    <Text style={[styles.voiceSendOptionTitle, { color: theme.colors.text.primary }]}>Downloadable File</Text>
                    <Text style={[styles.voiceSendOptionSubtitle, { color: theme.colors.text.secondary }]}>Send as audio file</Text>
                  </View>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.voiceSendCancelButton, { backgroundColor: `${theme.colors.primary}10` }]}
                  onPress={() => setShowVoiceSendOptions(false)}
                >
                  <Text style={[styles.voiceSendCancelText, { color: theme.colors.primary }]}>Cancel</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {keyboardVisible && (
            <TouchableOpacity
              style={styles.keyboardDismissButton}
              onPress={() => {
                Keyboard.dismiss();
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              activeOpacity={0.8}
            >
              <View style={styles.keyboardDismissContent}>
                <ChevronDown color="#FFFFFF" size={24} strokeWidth={3} />
              </View>
            </TouchableOpacity>
          )}

          <View style={[styles.inputContainer, { 
            paddingBottom: Math.max(insets.bottom + 20, 32), 
            backgroundColor: isNightMode ? "rgba(80, 40, 100, 0.95)" : theme.colors.cardBackground,
            borderTopColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : "rgba(107, 155, 209, 0.1)"
          }]}>
            {recordingUri && (
              <View style={[styles.voiceMessagePreview, { backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : `${theme.colors.primary}10` }]}>
                <View style={styles.voicePreviewLeft}>
                  <Mic color={isNightMode ? "#FFD700" : theme.colors.primary} size={20} strokeWidth={2.5} />
                  <Text style={[styles.voicePreviewText, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>Voice message ready</Text>
                </View>
                <View style={styles.voicePreviewActions}>
                  <TouchableOpacity
                    style={[styles.voicePreviewButton, { backgroundColor: theme.colors.primary }]}
                    onPress={playRecording}
                  >
                    {isPlaying ? (
                      <Pause color="#FFFFFF" size={16} strokeWidth={2.5} />
                    ) : (
                      <Play color="#FFFFFF" size={16} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.voicePreviewButton, { backgroundColor: "#4CAF50" }]}
                    onPress={() => setShowVoiceSendOptions(true)}
                  >
                    <Send color="#FFFFFF" size={16} strokeWidth={2.5} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.voicePreviewButton, { backgroundColor: "#F44336" }]}
                    onPress={() => {
                      setRecordingUri(null);
                      if (playbackSound) {
                        playbackSound.unloadAsync();
                        setPlaybackSound(null);
                      }
                    }}
                  >
                    <X color="#FFFFFF" size={16} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>
              </View>
            )}
            <View style={styles.floatingActionsContainer}>
              <View style={styles.floatingActions}>
                <TouchableOpacity
                  style={styles.floatingActionButton}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setShowAttachMenu(!showAttachMenu);
                  }}
                >
                  <Paperclip color={isNightMode ? "#9D4EDD" : theme.colors.primary} size={20} strokeWidth={2.5} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.floatingActionButton}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setShowEmojiPicker(true);
                  }}
                >
                  <View style={[styles.emojiOutline, { borderColor: isNightMode ? "#9D4EDD" : theme.colors.primary }]}>
                    <View style={[styles.emojiEye, { left: 5, backgroundColor: isNightMode ? "#9D4EDD" : theme.colors.primary }]} />
                    <View style={[styles.emojiEye, { right: 5, backgroundColor: isNightMode ? "#9D4EDD" : theme.colors.primary }]} />
                    <View style={[styles.emojiMouth, { borderColor: isNightMode ? "#9D4EDD" : theme.colors.primary }]} />  
                  </View>
                </TouchableOpacity>
                {isRecording ? (
                  <TouchableOpacity
                    style={[styles.floatingActionButton, styles.recordingButton]}
                    onPress={stopRecording}
                  >
                    <View style={styles.recordingIndicator}>
                      <View style={styles.recordingPulse} />
                      <Circle color="#FF0000" size={10} strokeWidth={0} fill="#FF0000" />
                    </View>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.floatingActionButton}
                    onPress={startRecording}
                    onLongPress={startRecording}
                  >
                    <Mic color={isNightMode ? "#00F5FF" : theme.colors.primary} size={20} strokeWidth={2.5} />
                  </TouchableOpacity>
                )}
                <TouchableOpacity
                  style={styles.floatingActionButton}
                  onPress={() => {
                    if (Platform.OS !== "web") {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    }
                    setShowFontStyleModal(true);
                  }}
                >
                  <Type color={isNightMode ? "#9D4EDD" : theme.colors.primary} size={20} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.inputWrapper}>
              <TextInput
                style={[styles.input, { 
                  color: selectedTextColor, 
                  borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : theme.colors.border,
                  backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : "#F5F7FA",
                  fontWeight: selectedFontStyle.includes('bold') ? '700' : '400',
                  fontStyle: selectedFontStyle.includes('italic') ? 'italic' : 'normal',
                }]}
                placeholder="Type a message..."
                placeholderTextColor={isNightMode ? "#666666" : theme.colors.text.light}
                value={messageText}
                onChangeText={setMessageText}
                multiline
                maxLength={5000}
                keyboardType="default"
                returnKeyType="default"
                autoCapitalize="sentences"
                autoCorrect
              />
              <GlitterSendButton
                hasText={!!messageText.trim()}
                onPress={handleSendMessage}
                theme={theme}
                isNightMode={isNightMode}
              />
            </View>
          </View>
        </View>
      </ChatBackground>

      <Modal
        visible={showAttachMenu}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowAttachMenu(false)}
      >
        <TouchableOpacity
          style={styles.attachMenuOverlay}
          activeOpacity={1}
          onPress={() => setShowAttachMenu(false)}
        >
          <View style={[styles.attachMenu, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.attachMenuHeader}>
              <Paperclip color={isNightMode ? "#FFD700" : theme.colors.primary} size={24} strokeWidth={2.5} />
              <Text style={[styles.attachMenuTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>Attach Files</Text>
            </View>
            
            <TouchableOpacity
              style={[styles.attachMenuItem, { 
                backgroundColor: isNightMode ? "rgba(33, 150, 243, 0.1)" : "#2196F308",
                borderWidth: 1,
                borderColor: isNightMode ? "rgba(33, 150, 243, 0.3)" : "rgba(33, 150, 243, 0.2)"
              }]}
              onPress={() => {
                setShowAttachMenu(false);
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                }
                handlePickDocument("any");
              }}
              disabled={isPickingDocument}
              activeOpacity={0.7}
            >
              <View style={[styles.attachMenuIcon, { backgroundColor: "#2196F320" }]}>
                <Paperclip color={isNightMode ? "#FFFFFF" : theme.colors.primary} size={28} strokeWidth={2.5} />
              </View>
              <View style={styles.attachMenuTextContainer}>
                <Text style={[styles.attachMenuText, { color: isNightMode ? "#FFFFFF" : theme.colors.text.primary }]}>Attachment</Text>
                <Text style={[styles.attachMenuSubtext, { color: isNightMode ? "#AAAAAA" : theme.colors.text.secondary }]}>Photos, Videos, Documents</Text>
              </View>
              <ChevronRight color={isNightMode ? "#666666" : theme.colors.text.light} size={20} strokeWidth={2} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.attachMenuCancelButton, { 
                backgroundColor: isNightMode ? "rgba(255, 20, 147, 0.1)" : `${theme.colors.primary}10`,
                borderWidth: 1,
                borderColor: isNightMode ? "rgba(255, 20, 147, 0.2)" : `${theme.colors.primary}20`
              }]}
              onPress={() => {
                setShowAttachMenu(false);
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
              }}
              activeOpacity={0.7}
            >
              <X color={isNightMode ? "#FF1493" : theme.colors.primary} size={20} strokeWidth={2.5} />
              <Text style={[styles.attachMenuCancelText, { color: isNightMode ? "#FF1493" : theme.colors.primary }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <Modal
        visible={showMembersModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowMembersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text.primary }]}>Add Members</Text>
              <TouchableOpacity onPress={() => setShowMembersModal(false)}>
                <X color={theme.colors.text.primary} size={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.membersSection}>
              <Text style={[styles.membersLabel, { color: theme.colors.text.secondary }]}>Current Members</Text>
              <View style={styles.membersList}>
                <View style={styles.memberItem}>
                  <View style={[styles.memberAvatar, { backgroundColor: theme.colors.primary }]}>
                    <Text style={styles.memberAvatarText}>You</Text>
                  </View>
                  <Text style={[styles.memberName, { color: theme.colors.text.primary }]}>You (Owner)</Text>
                </View>
                {calendar.sharedWith.map((email, index) => (
                  <View key={index} style={styles.memberItem}>
                    <View style={[styles.memberAvatar, { backgroundColor: `${theme.colors.primary}60` }]}>
                      <Text style={styles.memberAvatarText}>{email[0].toUpperCase()}</Text>
                    </View>
                    <Text style={[styles.memberName, { color: theme.colors.text.primary }]}>{email}</Text>
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.addMemberSection}>
              <Text style={[styles.membersLabel, { color: theme.colors.text.secondary }]}>Invite New Member</Text>
              <TextInput
                style={[styles.memberInput, { 
                  color: theme.colors.text.primary, 
                  borderColor: theme.colors.border,
                  backgroundColor: `${theme.colors.primary}05`
                }]}
                placeholder="Enter email address"
                placeholderTextColor={theme.colors.text.light}
                value={newMemberEmail}
                onChangeText={setNewMemberEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />
              <TouchableOpacity
                style={styles.addMemberButton}
                onPress={handleAddMember}
              >
                <LinearGradient
                  colors={theme.gradients.primary as any}
                  style={styles.addMemberButtonGradient}
                >
                  <UserPlus color="#FFFFFF" size={20} strokeWidth={2.5} />
                  <Text style={styles.addMemberButtonText}>Send Invitation</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <EmojiPickerModal
        visible={showEmojiPicker}
        onClose={() => setShowEmojiPicker(false)}
        onSelectEmoji={(emoji) => {
          setMessageText(prev => prev + emoji);
          setShowEmojiPicker(false);
        }}
        isNightMode={isNightMode}
        themeColor={theme.colors.primary}
      />
      <FontStyleModal
        visible={showFontStyleModal}
        onClose={() => setShowFontStyleModal(false)}
        onSelectStyle={(style) => {
          setSelectedFontStyle(style);
        }}
        onSelectColor={(color) => {
          setSelectedTextColor(color);
        }}
        isNightMode={isNightMode}
        themeColor={theme.colors.primary}
        currentStyle={selectedFontStyle}
        currentColor={selectedTextColor}
      />
      <AttachmentPreviewModal
        visible={showAttachmentPreview}
        onClose={() => {
          setShowAttachmentPreview(false);
          setSelectedAttachment(null);
          setAttachmentFileData(null);
        }}
        attachment={
          selectedAttachment
            ? {
                id: selectedAttachment.attachment.id,
                name: selectedAttachment.attachment.fileName,
                type: selectedAttachment.attachment.fileType,
                uri: "",
                size: selectedAttachment.attachment.size,
                uploadedAt: selectedAttachment.attachment.uploadedAt || new Date().toISOString(),
                sourceFeature: selectedAttachment.attachment.sourceFeature,
                sourceId: selectedAttachment.attachment.sourceId,
                metadata: selectedAttachment.attachment.metadata,
              }
            : null
        }
        fileData={attachmentFileData}
        canDownload={calendar?.attachmentSettings?.allowDownload ?? true}
        calendarOwner={calendar?.owner || "Unknown"}
        allowEditing={selectedAttachment?.attachment.allowEditing ?? true}
        themeColors={{
          primary: isNightMode ? "#FFD700" : theme.colors.primary,
          secondary: isNightMode ? "#FF1493" : theme.colors.secondary,
          cardBg: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground,
          textPrimary: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
          textSecondary: isNightMode ? "#888888" : theme.colors.text.secondary,
          border: isNightMode ? "rgba(255, 215, 0, 0.2)" : theme.colors.border,
        }}
        isNightMode={isNightMode}
      />
      <ChatThemeModal
        visible={showThemeModal}
        onClose={() => setShowThemeModal(false)}
        onSelectTheme={(theme) => {
          if (currentChatId) {
            setChatTheme(currentChatId, theme);
          }
        }}
        currentThemeId={currentTheme.id}
        isNightMode={isNightMode}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(107, 155, 209, 0.1)",
  },
  backButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(107, 155, 209, 0.1)",
  },
  headerTitleContainer: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginHorizontal: 12,
  },
  calendarColorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    color: colors.text.primary,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    marginTop: 2,
  },
  headerSubtitleText: {
    fontSize: 13,
    fontWeight: "500" as const,
    color: colors.text.secondary,
  },
  clearButton: {
    padding: 8,
    borderRadius: 12,
    backgroundColor: "rgba(247, 127, 139, 0.1)",
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    padding: 20,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: colors.text.primary,
    marginTop: 20,
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    color: colors.text.secondary,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 280,
    fontWeight: "500" as const,
  },
  messagesList: {
    gap: 12,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
  },
  myMessage: {
    alignSelf: "flex-end",
    borderBottomRightRadius: 4,
  },
  theirMessage: {
    alignSelf: "flex-start",
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 12,
    fontWeight: "600" as const,
    color: colors.primary,
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500" as const,
  },
  myMessageText: {
    // Color will be overridden inline based on theme
  },
  theirMessageText: {
    // Color will be overridden inline based on theme
  },

  messageTime: {
    fontSize: 11,
    marginTop: 4,
    fontWeight: "500" as const,
  },

  inputContainer: {
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderTopWidth: 1,
    borderTopColor: "rgba(107, 155, 209, 0.1)",
  },
  floatingActionsContainer: {
    paddingBottom: 8,
  },
  floatingActions: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    gap: 12,
    paddingHorizontal: 8,
  },
  floatingActionButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  floatingActionEmoji: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  recordingButton: {
    // No background for recording button
  },
  emojiOutline: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    position: "relative" as const,
  },
  emojiEye: {
    position: "absolute" as const,
    width: 2,
    height: 2,
    borderRadius: 1,
    top: 6,
  },
  emojiMouth: {
    position: "absolute" as const,
    width: 8,
    height: 4,
    borderBottomLeftRadius: 4,
    borderBottomRightRadius: 4,
    borderWidth: 0,
    borderBottomWidth: 2,
    borderLeftWidth: 0,
    borderRightWidth: 0,
    bottom: 5,
    left: 4,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: "#F5F7FA",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.text.primary,
    fontWeight: "500" as const,
    maxHeight: 80,
    minHeight: 38,
    borderWidth: 1,
    borderColor: colors.border,
  },
  sendButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: "hidden",
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  listHeader: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  listHeaderTop: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  listHeaderTitleContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  listHeaderTitle: {
    fontSize: 32,
    fontWeight: "800" as const,
    letterSpacing: 0.3,
  },
  listHeaderSubtitle: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  encryptionBadgeHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  encryptionText: {
    fontSize: 12,
    fontWeight: "700" as const,
  },
  chatListContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  chatListItem: {
    flexDirection: "row" as const,
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    overflow: "hidden" as const,
  },
  chatColorIndicator: {
    width: 4,
    position: "absolute" as const,
    left: 0,
    top: 0,
    bottom: 0,
  },
  chatListItemContent: {
    flex: 1,
    gap: 8,
  },
  chatListItemTop: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
  },
  chatListItemLeft: {
    flex: 1,
    gap: 4,
  },
  chatListItemName: {
    fontSize: 18,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  chatListItemMembersRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  chatListItemMembers: {
    fontSize: 12,
    fontWeight: "600" as const,
  },
  chatListItemRight: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  unreadBadge: {
    minWidth: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingHorizontal: 6,
  },
  unreadBadgeText: {
    color: "#FFFFFF",
    fontSize: 12,
    fontWeight: "700" as const,
  },
  chatListItemLastMessage: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  headerActions: {
    flexDirection: "row" as const,
    gap: 8,
  },
  headerActionButton: {
    padding: 8,
    borderRadius: 12,
  },
  attachButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  emojiButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  emojiButtonIcon: {
    fontSize: 22,
    fontWeight: "600" as const,
  },
  recordButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  recordButtonActive: {
    backgroundColor: "#F44336",
  },
  recordingIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  recordingPulse: {
    position: "absolute" as const,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 0, 0, 0.2)",
  },
  voiceMessagePreview: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  voicePreviewLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    flex: 1,
  },
  voicePreviewText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  voicePreviewActions: {
    flexDirection: "row" as const,
    gap: 8,
  },
  voicePreviewButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  attachMenuOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end" as const,
    paddingBottom: 100,
  },
  attachMenu: {
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 24,
    padding: 20,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    gap: 12,
  },
  attachMenuHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingBottom: 12,
    marginBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0, 0, 0, 0.08)",
  },
  attachMenuTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  attachMenuItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    padding: 18,
    gap: 16,
    borderRadius: 16,
  },
  attachMenuIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  attachMenuTextContainer: {
    flex: 1,
  },
  attachMenuText: {
    fontSize: 17,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
  },
  attachMenuSubtext: {
    fontSize: 13,
    fontWeight: "500" as const,
    marginTop: 4,
    lineHeight: 18,
  },
  attachMenuCancelButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    padding: 16,
    borderRadius: 16,
    gap: 8,
    marginTop: 8,
  },
  attachMenuCancelText: {
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "flex-end" as const,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: "80%" as const,
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
  },
  membersSection: {
    marginBottom: 24,
  },
  membersLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 12,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  membersList: {
    gap: 12,
  },
  memberItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    padding: 12,
    backgroundColor: "rgba(0, 0, 0, 0.03)",
    borderRadius: 12,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  memberAvatarText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  memberName: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  addMemberSection: {
    gap: 12,
  },
  memberInput: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    fontWeight: "500" as const,
    borderWidth: 1,
  },
  addMemberButton: {
    borderRadius: 14,
    overflow: "hidden" as const,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  addMemberButtonGradient: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 14,
    gap: 8,
  },
  addMemberButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  encryptionBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    marginBottom: 6,
  },
  encryptionBadgeText: {
    fontSize: 10,
    fontWeight: "600" as const,
  },
  myEncryptionBadgeText: {
    color: "rgba(255, 255, 255, 0.8)",
  },
  theirEncryptionBadgeText: {
    color: colors.primary,
  },
  attachmentContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    marginTop: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  myAttachment: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  theirAttachment: {
    backgroundColor: "#FFFFFF",
    borderColor: colors.border,
  },
  attachmentInfo: {
    flex: 1,
  },
  attachmentName: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 2,
  },
  myAttachmentText: {
    color: "#FFFFFF",
  },
  theirAttachmentText: {
    color: colors.text.primary,
  },
  attachmentSize: {
    fontSize: 11,
    fontWeight: "500" as const,
  },
  myAttachmentSize: {
    color: "rgba(255, 255, 255, 0.7)",
  },
  theirAttachmentSize: {
    color: colors.text.light,
  },
  attachmentLoading: {
    opacity: 0.7,
  },
  keyboardDismissButton: {
    position: "absolute" as const,
    bottom: 140,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    zIndex: 1000,
  },
  keyboardDismissContent: {
    width: "100%",
    height: "100%",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  voiceMessageContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginTop: 8,
    padding: 14,
    borderRadius: 20,
    borderWidth: 1,
    minWidth: 160,
  },
  myVoiceMessage: {
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  theirVoiceMessage: {
    backgroundColor: "#FFFFFF",
    borderColor: colors.border,
  },
  voiceMessageText: {
    fontSize: 14,
    fontWeight: "600" as const,
    flex: 1,
  },
  myVoiceMessageText: {
    color: "rgba(255, 255, 255, 0.9)",
  },
  theirVoiceMessageText: {
    color: colors.text.secondary,
  },
  animatedMusicIconContainer: {
    position: "relative" as const,
    width: 40,
    height: 40,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  glowCircle: {
    position: "absolute" as const,
    width: 40,
    height: 40,
    borderRadius: 20,
    zIndex: -1,
  },
  waveformContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 3,
    height: 28,
    paddingHorizontal: 4,
  },
  waveBar: {
    width: 3,
    height: 28,
    borderRadius: 2,
  },
  waveBarCenter: {
    width: 3.5,
  },
  voiceFileRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  downloadIconButton: {
    padding: 8,
  },
  voiceSendOptionsOverlay: {
    position: "absolute" as const,
    left: 20,
    right: 20,
    backgroundColor: "transparent",
  },
  voiceSendOptionsContainer: {
    borderRadius: 20,
    padding: 20,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
  },
  voiceSendOptionsHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginBottom: 20,
  },
  voiceSendOptionsTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
  },
  voiceSendOption: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    backgroundColor: "rgba(0, 0, 0, 0.02)",
  },
  voiceSendOptionIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  voiceSendOptionText: {
    flex: 1,
  },
  voiceSendOptionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    marginBottom: 4,
  },
  voiceSendOptionSubtitle: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  voiceSendCancelButton: {
    padding: 16,
    borderRadius: 16,
    alignItems: "center" as const,
    marginTop: 8,
  },
  voiceSendCancelText: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  attachmentDescription: {
    fontSize: 15,
    lineHeight: 21,
    fontWeight: "500" as const,
    marginBottom: 8,
  },
});
