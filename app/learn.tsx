import { useState, useEffect, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Platform,
  Modal,
  Alert,
  TextInput,
  Animated,
  Easing,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Brain, Play, Lock, Star, Clock, Users, TrendingUp, Award, BookOpen, Target, Zap, ArrowLeft, X, Plus, Edit3, Check, Camera, Image as ImageIcon, Upload, Hourglass, Link, Globe } from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { Video, ResizeMode, Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";

import colors from "@/constants/colors";
import { useTheme } from "@/contexts/ThemeContext";
import { useUniverseMode } from "@/contexts/UniverseModeContext";
import { useLearn } from "@/contexts/LearnContext";
import { saveVideoToFileSystem, saveThumbnailToFileSystem, checkVideoExists } from "@/utils/videoStorage";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const VIDEO_WIDTH = SCREEN_WIDTH - 40;
const VIDEO_HEIGHT = (VIDEO_WIDTH * 9) / 16;

type VideoItem = {
  id: string;
  title: string;
  duration: string;
  thumbnail: string;
  videoUrl: string;
  isLocked: boolean;
  description?: string;
  previewType?: 'still' | 'loop' | 'custom';
  customThumbnail?: string;
  isUrlVideo?: boolean;
  originalUrl?: string;
};

type CourseCategory = {
  id: string;
  title: string;
  icon: any;
  color: string;
  videos: VideoItem[];
  isSubscriptionRequired: boolean;
};

export default function LearnScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { mode: universeMode } = useUniverseMode();
  const { categories, initializeDefaultCategories, updateVideo, addVideo, isLoading, updateCategory } = useLearn();
  const [hasSubscription] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<CourseCategory | null>(null);
  const [editingVideo, setEditingVideo] = useState<{ categoryId: string; videoId: string } | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [previewSettingsVideo, setPreviewSettingsVideo] = useState<{ categoryId: string; videoId: string } | null>(null);
  const [previewType, setPreviewType] = useState<'still' | 'loop' | 'custom'>('still');
  const [isSaving, setIsSaving] = useState(false);
  const [showComingSoon, setShowComingSoon] = useState(false);
  const [sound, setSound] = useState<Audio.Sound | null>(null);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlTitle, setUrlTitle] = useState("");
  const [urlDescription, setUrlDescription] = useState("");
  const [urlCategoryId, setUrlCategoryId] = useState<string | null>(null);
  const [urlVideoId, setUrlVideoId] = useState<string | null>(null);
  
  const rotateAnim = useRef(new Animated.Value(0)).current;
  const sandFallAnim = useRef(new Animated.Value(0)).current;
  const sandTopAnim = useRef(new Animated.Value(1)).current;
  const sandBottomAnim = useRef(new Animated.Value(0)).current;
  const isAnimationActive = useRef(false);
  
  const isNightMode = theme.id === 'night-mode' || theme.id === 'night';

  useEffect(() => {
    const playComingSoonSound = async () => {
      if (showComingSoon) {
        try {
          const { sound: newSound } = await Audio.Sound.createAsync(
            { uri: "https://rork.app/pa/ier8mze8ucoqq9oktvadp/guitar_4s_1" },
            { shouldPlay: true, isLooping: false }
          );
          setSound(newSound);
        } catch (error) {
          console.error("Error playing coming soon sound:", error);
        }
      }
    };

    playComingSoonSound();

    if (showComingSoon && !isAnimationActive.current) {
      isAnimationActive.current = true;
      
      const runHourglassAnimation = () => {
        Animated.sequence([
          Animated.parallel([
            Animated.timing(sandFallAnim, {
              toValue: 1,
              duration: 3000,
              easing: Easing.linear,
              useNativeDriver: false,
            }),
            Animated.timing(sandTopAnim, {
              toValue: 0,
              duration: 3000,
              easing: Easing.linear,
              useNativeDriver: false,
            }),
            Animated.timing(sandBottomAnim, {
              toValue: 1,
              duration: 3000,
              easing: Easing.linear,
              useNativeDriver: false,
            }),
          ]),
          Animated.timing(rotateAnim, {
            toValue: 1,
            duration: 500,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: false,
          }),
          Animated.parallel([
            Animated.timing(sandFallAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: false,
            }),
            Animated.timing(sandTopAnim, {
              toValue: 1,
              duration: 0,
              useNativeDriver: false,
            }),
            Animated.timing(sandBottomAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: false,
            }),
            Animated.timing(rotateAnim, {
              toValue: 0,
              duration: 0,
              useNativeDriver: false,
            }),
          ]),
        ]).start(({ finished }) => {
          if (finished && showComingSoon) {
            runHourglassAnimation();
          }
        });
      };
      
      runHourglassAnimation();
    }

    return () => {
      isAnimationActive.current = false;
      if (sound) {
        sound.unloadAsync();
      }
    };
  }, [showComingSoon, rotateAnim, sandFallAnim, sandTopAnim, sandBottomAnim]);

  const introVideo: VideoItem = {
    id: "intro",
    title: "Welcome to Your Learning Journey",
    duration: "3:45",
    thumbnail: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&q=80",
    videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
    isLocked: false,
    description: "Start your journey with this comprehensive introduction",
  };

  const featuredVideos: VideoItem[] = [
    {
      id: "v1",
      title: "Morning Mindfulness Practice",
      duration: "12:30",
      thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
      isLocked: false,
    },
    {
      id: "v2",
      title: "Building Healthy Habits",
      duration: "8:15",
      thumbnail: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
      isLocked: false,
    },
    {
      id: "v3",
      title: "Productivity Masterclass",
      duration: "15:20",
      thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
      isLocked: true,
    },
    {
      id: "v4",
      title: "Stress Management Techniques",
      duration: "10:45",
      thumbnail: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80",
      videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
      isLocked: true,
    },
  ];

  // Update selectedCategory when categories change
  useEffect(() => {
    if (selectedCategory && categories.length > 0) {
      const updatedCategory = categories.find(cat => cat.id === selectedCategory.id);
      if (updatedCategory) {
        setSelectedCategory(updatedCategory);
      }
    }
  }, [categories]);

  // Initialize default categories on first load
  useEffect(() => {
    const courseCategories: CourseCategory[] = [
      {
        id: "wellness",
        title: "Public Communication",
        icon: "Star" as any,
        color: isNightMode ? "#FFD700" : "#C71585",
        videos: [
          {
            id: "w1",
            title: "Introduction to Wellness",
            duration: "10:30",
            thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            isLocked: false,
            description: "Learn the fundamentals of wellness and healthy living",
          },
          {
            id: "w2",
            title: "Nutrition Basics",
            duration: "15:45",
            thumbnail: "https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800&q=80",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            isLocked: true,
            description: "Master the essentials of healthy eating",
          },
          {
            id: "w3",
            title: "Exercise & Movement",
            duration: "12:20",
            thumbnail: "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            isLocked: true,
            description: "Effective workout strategies for all levels",
          },
        ],
        isSubscriptionRequired: true,
      },
      {
        id: "productivity",
        title: "Productivity",
        icon: "TrendingUp" as any,
        color: isNightMode ? "#00FF87" : "#C71585",
        videos: [
          {
            id: "p1",
            title: "Time Management Mastery",
            duration: "18:30",
            thumbnail: "https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=800&q=80",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
            isLocked: false,
            description: "Learn to manage your time effectively",
          },
          {
            id: "p2",
            title: "Focus Techniques",
            duration: "14:15",
            thumbnail: "https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=800&q=80",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4",
            isLocked: true,
            description: "Boost your concentration and productivity",
          },
        ],
        isSubscriptionRequired: true,
      },
      {
        id: "mindfulness",
        title: "Mindfulness",
        icon: "Brain" as any,
        color: isNightMode ? "#FF1493" : "#C71585",
        videos: [
          {
            id: "m1",
            title: "Meditation for Beginners",
            duration: "20:00",
            thumbnail: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&q=80",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
            isLocked: false,
            description: "Start your meditation practice today",
          },
          {
            id: "m2",
            title: "Breathing Exercises",
            duration: "8:45",
            thumbnail: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&q=80",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4",
            isLocked: true,
            description: "Powerful breathing techniques for calm",
          },
        ],
        isSubscriptionRequired: true,
      },
      {
        id: "lifestyle",
        title: "Lifestyle Design",
        icon: "Award" as any,
        color: isNightMode ? "#00F5FF" : "#C71585",
        videos: [
          {
            id: "l1",
            title: "Creating Your Ideal Life",
            duration: "22:30",
            thumbnail: "https://images.unsplash.com/photo-1513151233558-d860c5398176?w=800&q=80",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4",
            isLocked: false,
            description: "Design the life you've always wanted",
          },
          {
            id: "l2",
            title: "Work-Life Balance",
            duration: "16:40",
            thumbnail: "https://images.unsplash.com/photo-1499750310107-5fef28a66643?w=800&q=80",
            videoUrl: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4",
            isLocked: true,
            description: "Find harmony between work and life",
          },
        ],
        isSubscriptionRequired: true,
      },
    ];

    initializeDefaultCategories(courseCategories);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update category titles if they don't match (migration)
  useEffect(() => {
    if (isLoading) return;
    
    const wellnessCategory = categories.find(c => c.id === 'wellness');
    if (wellnessCategory && wellnessCategory.title !== 'Public Communication') {
      console.log('Migrating wellness category title to Public Communication');
      updateCategory('wellness', { title: 'Public Communication' });
    }
  }, [categories, isLoading, updateCategory]);

  const handleVideoPress = (video: VideoItem) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    
    if (video.isLocked && !hasSubscription) {
      console.log("Video locked - subscription required");
      handleSubscribePress();
      return;
    }
    
    setSelectedVideo(video);
  };

  const handleCloseVideo = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedVideo(null);
  };

  const handleCategoryPress = (category: CourseCategory) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setSelectedCategory(category);
  };

  const handleCategoryBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedCategory(null);
  };

  const handleSubscribePress = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    console.log("Opening subscription");
  };

  const handleEditText = (categoryId: string, videoId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const category = categories.find((cat) => cat.id === categoryId);
    const video = category?.videos.find((vid) => vid.id === videoId);
    
    if (video) {
      setEditTitle(video.title);
      setEditDescription(video.description || "");
      setEditingVideo({ categoryId, videoId });
    }
  };

  const handleSaveTextEdits = async () => {
    if (!editingVideo) return;

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsSaving(true);
    
    try {
      await updateVideo(editingVideo.categoryId, editingVideo.videoId, {
        title: editTitle,
        description: editDescription,
      });

      setEditingVideo(null);
      setEditTitle("");
      setEditDescription("");
      Alert.alert("Success", "Video details updated and saved!");
    } catch (error) {
      console.error("Error saving video edits:", error);
      Alert.alert("Error", "Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelTextEdit = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setEditingVideo(null);
    setEditTitle("");
    setEditDescription("");
  };

  const handlePreviewSettings = (categoryId: string, videoId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    const category = categories.find((cat) => cat.id === categoryId);
    const video = category?.videos.find((vid) => vid.id === videoId);
    
    if (video) {
      setPreviewType(video.previewType || 'still');
      setPreviewSettingsVideo({ categoryId, videoId });
    }
  };

  const handleSavePreviewSettings = async () => {
    if (!previewSettingsVideo) return;

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsSaving(true);
    
    try {
      await updateVideo(previewSettingsVideo.categoryId, previewSettingsVideo.videoId, {
        previewType: previewType,
      });
      
      setPreviewSettingsVideo(null);
      Alert.alert("Success", "Preview settings updated and saved!");
    } catch (error) {
      console.error("Error saving preview settings:", error);
      Alert.alert("Error", "Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePickThumbnail = async (categoryId: string, videoId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "image/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      if (!file) {
        return;
      }

      // Save thumbnail to file system for persistent storage
      const savedThumbnailUri = await saveThumbnailToFileSystem(file.uri, videoId);
      if (!savedThumbnailUri) {
        Alert.alert("Error", "Failed to save thumbnail. Please try again.");
        return;
      }

      setIsSaving(true);
      
      try {
        await updateVideo(categoryId, videoId, {
          previewType: 'custom',
          customThumbnail: savedThumbnailUri,
        });
      } finally {
        setIsSaving(false);
      }

      if (previewSettingsVideo) {
        setPreviewType('custom');
      }

      if (Platform.OS !== "web") {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      Alert.alert("Success", "Custom thumbnail uploaded successfully!");
    } catch (error) {
      console.error("Error picking thumbnail:", error);
      Alert.alert("Error", "Failed to upload thumbnail. Please try again.");
    }
  };

  const handlePickVideo = async (categoryId: string, videoId?: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "video/*",
        copyToCacheDirectory: true,
      });

      if (result.canceled) {
        return;
      }

      const file = result.assets[0];
      if (!file) {
        return;
      }

      console.log("Selected video:", file);

      // Save video to file system for persistent storage
      const videoIdForSave = videoId || `video_${Date.now()}`;
      const savedVideoUri = await saveVideoToFileSystem(file.uri, videoIdForSave);
      
      if (!savedVideoUri) {
        Alert.alert("Error", "Failed to save video. Please try again.");
        return;
      }
      
      // Also save a thumbnail (using the same video URI as thumbnail for now)
      const savedThumbnailUri = await saveThumbnailToFileSystem(file.uri, videoIdForSave);

      setIsSaving(true);
      
      try {
        if (videoId) {
          await updateVideo(categoryId, videoId, {
            videoUrl: savedVideoUri,
            thumbnail: savedThumbnailUri || savedVideoUri,
          });

          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          Alert.alert("Success", "Video updated and saved!");
        } else {
          const newVideo: VideoItem = {
            id: videoIdForSave,
            title: file.name || "New Video",
            duration: "0:00",
            thumbnail: savedThumbnailUri || savedVideoUri,
            videoUrl: savedVideoUri,
            isLocked: false,
            description: "Uploaded video",
          };

          await addVideo(categoryId, newVideo);

          if (Platform.OS !== "web") {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          }
          Alert.alert("Success", "Video added and saved!");
        }
      } finally {
        setIsSaving(false);
      }
    } catch (error) {
      console.error("Error picking video:", error);
      Alert.alert("Error", "Failed to upload video. Please try again.");
    }
  };

  const convertGoogleDriveUrl = (url: string): string => {
    // Handle various Google Drive URL formats
    // Format 1: https://drive.google.com/file/d/FILE_ID/view
    // Format 2: https://drive.google.com/open?id=FILE_ID
    // Format 3: https://drive.google.com/uc?id=FILE_ID
    // Format 4: https://drive.google.com/uc?export=download&id=FILE_ID
    
    let fileId = '';
    
    // Try to extract file ID from /d/ format
    const dMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (dMatch) {
      fileId = dMatch[1];
    }
    
    // Try to extract from id= parameter
    if (!fileId) {
      const idMatch = url.match(/[?&]id=([a-zA-Z0-9_-]+)/);
      if (idMatch) {
        fileId = idMatch[1];
      }
    }
    
    if (fileId) {
      // Return direct download URL
      return `https://drive.google.com/uc?export=download&id=${fileId}`;
    }
    
    // If not a Google Drive URL, return as is
    return url;
  };

  const handleOpenUrlModal = (categoryId: string, videoId?: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setUrlCategoryId(categoryId);
    setUrlVideoId(videoId || null);
    
    if (videoId) {
      const category = categories.find((cat) => cat.id === categoryId);
      const video = category?.videos.find((vid) => vid.id === videoId);
      if (video) {
        setUrlInput(video.originalUrl || video.videoUrl || "");
        setUrlTitle(video.title || "");
        setUrlDescription(video.description || "");
      }
    } else {
      setUrlInput("");
      setUrlTitle("");
      setUrlDescription("");
    }
    setShowUrlModal(true);
  };

  const handleAddUrlVideo = async () => {
    if (!urlCategoryId || !urlInput.trim()) {
      Alert.alert("Error", "Please enter a valid URL");
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setIsSaving(true);

    try {
      const processedUrl = convertGoogleDriveUrl(urlInput.trim());
      
      if (urlVideoId) {
        await updateVideo(urlCategoryId, urlVideoId, {
          title: urlTitle.trim() || "Video from URL",
          videoUrl: processedUrl,
          description: urlDescription.trim() || "Video added from URL",
          isUrlVideo: true,
          originalUrl: urlInput.trim(),
        });
        
        setShowUrlModal(false);
        setUrlInput("");
        setUrlTitle("");
        setUrlDescription("");
        setUrlCategoryId(null);
        setUrlVideoId(null);
        
        Alert.alert("Success", "Video URL updated!");
      } else {
        const videoIdForSave = `url_video_${Date.now()}`;
        
        const newVideo: VideoItem = {
          id: videoIdForSave,
          title: urlTitle.trim() || "Video from URL",
          duration: "--:--",
          thumbnail: "https://images.unsplash.com/photo-1611162616475-46b635cb6868?w=800&q=80",
          videoUrl: processedUrl,
          isLocked: false,
          description: urlDescription.trim() || "Video added from URL",
          isUrlVideo: true,
          originalUrl: urlInput.trim(),
        };

        await addVideo(urlCategoryId, newVideo);
        
        setShowUrlModal(false);
        setUrlInput("");
        setUrlTitle("");
        setUrlDescription("");
        setUrlCategoryId(null);
        setUrlVideoId(null);
        
        Alert.alert("Success", "Video added from URL!");
      }
    } catch (error) {
      console.error("Error adding URL video:", error);
      Alert.alert("Error", "Failed to add video. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  };

  const tabBarHeight = universeMode === "classic" ? 85 : 0;

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  const sandTopHeight = sandTopAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const sandBottomHeight = sandBottomAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const sandStreamOpacity = sandFallAnim.interpolate({
    inputRange: [0, 0.1, 0.9, 1],
    outputRange: [0, 1, 1, 0],
  });

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isNightMode 
          ? ["#0a0a0f", "#1a0a1f", "#2a0a2f", "#1a0a1f", "#0a0a0f"] 
          : theme.gradients.background as any
        }
        style={StyleSheet.absoluteFill}
      />
      
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity 
          onPress={handleBack} 
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <ArrowLeft color={isNightMode ? "#FFD700" : "#C71585"} size={24} strokeWidth={2.5} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Brain color={isNightMode ? "#FFD700" : "#C71585"} size={32} strokeWidth={2.5} />
        </View>
        <View style={styles.headerRight} />
      </View>

      {isSaving && (
        <View style={styles.savingIndicator}>
          <View style={styles.savingBadge}>
            <Text style={styles.savingText}>Saving...</Text>
          </View>
        </View>
      )}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingTop: 20, paddingBottom: insets.bottom + tabBarHeight + 20 }]}
        showsVerticalScrollIndicator={false}
      >
          <View style={styles.heroSection}>
            <LinearGradient
              colors={isNightMode 
                ? ["rgba(80, 40, 100, 0.95)", "rgba(60, 20, 80, 0.95)"]
                : [theme.colors.primary + "15", theme.colors.secondary + "15"]
              }
              style={styles.heroGradient}
            >
              <Brain color={isNightMode ? "#FFD700" : "#C71585"} size={48} strokeWidth={2.5} />
              <Text style={[styles.heroTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>Learn & Grow</Text>
              <Text style={[styles.heroSubtitle, { color: isNightMode ? "#FF1493" : theme.colors.text.secondary }]}>Expand your mind with expert-led courses</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <BookOpen color={isNightMode ? "#00FF87" : "#C71585"} size={20} strokeWidth={2.5} />
                  <Text style={[styles.statNumber, { color: isNightMode ? "#FFFFFF" : theme.colors.text.primary }]}>89</Text>
                  <Text style={[styles.statLabel, { color: isNightMode ? "#888888" : theme.colors.text.secondary }]}>Courses</Text>
                </View>
                <View style={styles.statItem}>
                  <Target color={isNightMode ? "#00F5FF" : "#C71585"} size={20} strokeWidth={2.5} />
                  <Text style={[styles.statNumber, { color: isNightMode ? "#FFFFFF" : theme.colors.text.primary }]}>12.5k</Text>
                  <Text style={[styles.statLabel, { color: isNightMode ? "#888888" : theme.colors.text.secondary }]}>Students</Text>
                </View>
                <View style={styles.statItem}>
                  <Zap color={isNightMode ? "#FFD700" : "#C71585"} size={20} strokeWidth={2.5} />
                  <Text style={[styles.statNumber, { color: isNightMode ? "#FFFFFF" : theme.colors.text.primary }]}>4.8</Text>
                  <Text style={[styles.statLabel, { color: isNightMode ? "#888888" : theme.colors.text.secondary }]}>Rating</Text>
                </View>
              </View>
            </LinearGradient>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>Introduction</Text>
            <TouchableOpacity
              style={[styles.videoCard, { 
                backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground,
                borderWidth: isNightMode ? 1 : 0,
                borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "transparent"
              }]}
              onPress={() => handleVideoPress(introVideo)}
              activeOpacity={0.9}
            >
              <View style={styles.videoThumbnail}>
                <LinearGradient
                  colors={isNightMode 
                    ? ["#9D4EDD", "#7B2CBF"]
                    : ["#C71585", "#9D4EDD"]
                  }
                  style={styles.thumbnailGradient}
                >
                  <View style={styles.playButtonContainer}>
                    <View style={styles.playButton}>
                      <Play color="#FFFFFF" size={32} fill="#FFFFFF" strokeWidth={2} />
                    </View>
                  </View>
                  <View style={styles.videoDuration}>
                    <Clock color="#FFFFFF" size={14} strokeWidth={2.5} />
                    <Text style={styles.videoDurationText}>{introVideo.duration}</Text>
                  </View>
                </LinearGradient>
              </View>
              <View style={styles.videoInfo}>
                <Text style={[styles.videoTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>{introVideo.title}</Text>
                <Text style={[styles.videoDescription, { color: isNightMode ? "#888888" : theme.colors.text.secondary }]}>
                  {introVideo.description}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>Featured Videos</Text>
            <View style={styles.videoGrid}>
              {featuredVideos.map((video) => (
                <TouchableOpacity
                  key={video.id}
                  style={[styles.featuredVideoCard, {
                    backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground,
                    borderWidth: isNightMode ? 1 : 0,
                    borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "transparent"
                  }]}
                  onPress={() => handleVideoPress(video)}
                  activeOpacity={0.9}
                >
                  <View style={styles.featuredVideoThumbnail}>
                    <LinearGradient
                      colors={video.isLocked 
                        ? ["#9CA3AF", "#6B7280"] 
                        : isNightMode
                          ? ["#9D4EDD", "#7B2CBF"]
                          : ["#C71585", "#9D4EDD"]
                      }
                      style={styles.thumbnailGradient}
                    >
                      <View style={styles.playButtonContainer}>
                        <View style={styles.smallPlayButton}>
                          {video.isLocked ? (
                            <Lock color="#FFFFFF" size={20} strokeWidth={2.5} />
                          ) : (
                            <Play color="#FFFFFF" size={20} fill="#FFFFFF" strokeWidth={2} />
                          )}
                        </View>
                      </View>
                      <View style={styles.videoDuration}>
                        <Clock color="#FFFFFF" size={12} strokeWidth={2.5} />
                        <Text style={styles.smallDurationText}>{video.duration}</Text>
                      </View>
                    </LinearGradient>
                  </View>
                  <View style={styles.featuredVideoInfo}>
                    <Text style={[styles.featuredVideoTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]} numberOfLines={2}>
                      {video.title}
                    </Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>Course Categories</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((category) => {
                // Map icon names to components
                const iconMap: { [key: string]: any } = {
                  Star: Star,
                  TrendingUp: TrendingUp,
                  Brain: Brain,
                  Award: Award,
                };
                const Icon = iconMap[category.icon as string] || Star;
                return (
                  <TouchableOpacity
                    key={category.id}
                    style={[styles.categoryCard, { 
                      borderColor: `${category.color}30`,
                      backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.6)" : "transparent"
                    }]}
                    onPress={() => handleCategoryPress(category)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={isNightMode 
                        ? [`${category.color}20`, `${category.color}10`]
                        : [`${category.color}15`, `${category.color}08`]
                      }
                      style={styles.categoryCardGradient}
                    >
                      <View
                        style={[
                          styles.categoryIconContainer,
                          { backgroundColor: category.color },
                        ]}
                      >
                        <Icon color="#FFFFFF" size={24} strokeWidth={2.5} />
                      </View>
                      <Text style={[styles.categoryTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>{category.title}</Text>
                      <View style={styles.categoryFooter}>
                        <View style={styles.categoryInfo}>
                          <Users color={isNightMode ? "#888888" : theme.colors.text.secondary} size={14} strokeWidth={2} />
                          <Text style={[styles.categoryVideoCount, { color: isNightMode ? "#888888" : theme.colors.text.secondary }]}>
                            {category.videos.length} videos
                          </Text>
                        </View>
                        {category.isSubscriptionRequired && (
                          <View style={[styles.lockBadge, { backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : "rgba(0, 0, 0, 0.05)" }]}>
                            <Lock color={isNightMode ? "#FFD700" : colors.text.light} size={12} strokeWidth={2.5} />
                          </View>
                        )}
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {!hasSubscription && (
            <View style={styles.section}>
              <View style={[styles.subscriptionCard, {
                shadowColor: isNightMode ? "#FFD700" : "#667EEA"
              }]}>
                <LinearGradient
                  colors={isNightMode
                    ? ["#9D4EDD", "#7B2CBF", "#5B0F8B"]
                    : ["#C71585", "#9D4EDD"]
                  }
                  style={styles.subscriptionGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <View style={styles.subscriptionBadge}>
                    <Star color={isNightMode ? "#FFD700" : "#C71585"} size={20} fill={isNightMode ? "#FFD700" : "#C71585"} strokeWidth={2} />
                  </View>
                  <Text style={styles.subscriptionTitle}>Unlock All Courses</Text>
                  <Text style={styles.subscriptionDescription}>
                    Get unlimited access to all videos, courses, and exclusive content
                  </Text>
                  <View style={styles.subscriptionFeatures}>
                    <View style={styles.featureRow}>
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                      <Text style={styles.featureText}>100+ expert-led videos</Text>
                    </View>
                    <View style={styles.featureRow}>
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                      <Text style={styles.featureText}>New content every week</Text>
                    </View>
                    <View style={styles.featureRow}>
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                      <Text style={styles.featureText}>Downloadable resources</Text>
                    </View>
                  </View>
                  <TouchableOpacity
                    style={[styles.subscribeButton, {
                      backgroundColor: isNightMode ? "#FFD700" : "#FFFFFF"
                    }]}
                    onPress={handleSubscribePress}
                    activeOpacity={0.9}
                  >
                    <Text style={[styles.subscribeButtonText, {
                      color: isNightMode ? "#000000" : "#C71585"
                    }]}>
                      Start Free Trial - $20.00/month
                    </Text>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
            </View>
          )}
      </ScrollView>

      {selectedCategory && (
        <Modal
          visible={true}
          animationType="slide"
          presentationStyle="fullScreen"
          onRequestClose={handleCategoryBack}
        >
          <View style={styles.container}>
            <LinearGradient
              colors={isNightMode 
                ? ["#0a0a0f", "#1a0a1f", "#2a0a2f", "#1a0a1f", "#0a0a0f"] 
                : theme.gradients.background as any
              }
              style={StyleSheet.absoluteFill}
            />
            
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
              <TouchableOpacity 
                onPress={handleCategoryBack} 
                style={styles.backButton}
                activeOpacity={0.7}
              >
                <ArrowLeft color={isNightMode ? "#FFD700" : "#C71585"} size={24} strokeWidth={2.5} />
              </TouchableOpacity>
              <View style={styles.headerCenter}>
                {(() => {
                  const iconMap: { [key: string]: any } = {
                    Star: Star,
                    TrendingUp: TrendingUp,
                    Brain: Brain,
                    Award: Award,
                  };
                  const Icon = iconMap[selectedCategory.icon as string] || Star;
                  return <Icon color={isNightMode ? "#FFD700" : "#C71585"} size={32} strokeWidth={2.5} />;
                })()}
              </View>
              <View style={styles.headerRight} />
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={[styles.scrollContent, { paddingTop: 20, paddingBottom: insets.bottom + tabBarHeight + 20 }]}
              showsVerticalScrollIndicator={false}
            >
              <Text style={[styles.categoryModalTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>
                {selectedCategory.title}
              </Text>
              <View style={styles.categoryVideosList}>
                {selectedCategory.videos.map((video) => (
                  <View key={video.id} style={styles.videoItemWrapper}>
                    <TouchableOpacity
                      style={[styles.categoryVideoCard, {
                      backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground,
                      borderWidth: isNightMode ? 1 : 0,
                      borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "transparent"
                    }]}
                    onPress={() => handleVideoPress(video)}
                    activeOpacity={0.9}
                  >
                    <View style={styles.categoryVideoThumbnail}>
                      <LinearGradient
                        colors={video.isLocked 
                          ? ["#9CA3AF", "#6B7280"] 
                          : isNightMode
                            ? ["#9D4EDD", "#7B2CBF"]
                            : ["#C71585", "#9D4EDD"]
                        }
                        style={styles.categoryVideoThumbGradient}
                      >
                        <View style={styles.playButtonContainer}>
                          <View style={styles.smallPlayButton}>
                            {video.isLocked ? (
                              <Lock color="#FFFFFF" size={20} strokeWidth={2.5} />
                            ) : (
                              <Play color="#FFFFFF" size={20} fill="#FFFFFF" strokeWidth={2} />
                            )}
                          </View>
                        </View>
                        <View style={styles.videoDuration}>
                          <Clock color="#FFFFFF" size={12} strokeWidth={2.5} />
                          <Text style={styles.smallDurationText}>{video.duration}</Text>
                        </View>
                      </LinearGradient>
                    </View>
                    <View style={styles.categoryVideoInfo}>
                      <Text style={[styles.categoryVideoTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>
                        {video.title}
                      </Text>
                      {video.description && (
                        <Text style={[styles.categoryVideoDescription, { color: isNightMode ? "#888888" : theme.colors.text.secondary }]}>
                          {video.description}
                        </Text>
                      )}
                    </View>
                    </TouchableOpacity>
                    <View style={styles.editButtonsRow}>
                      <TouchableOpacity
                        style={[styles.editVideoButton, {
                          backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : "rgba(199, 21, 133, 0.1)",
                          borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : "rgba(199, 21, 133, 0.3)",
                        }]}
                        onPress={() => handleEditText(selectedCategory.id, video.id)}
                        activeOpacity={0.7}
                      >
                        <Edit3 color={isNightMode ? "#FFD700" : "#C71585"} size={16} strokeWidth={2.5} />
                        <Text style={[styles.editVideoText, { color: isNightMode ? "#FFD700" : "#C71585" }]}>Edit Text</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.editVideoButton, {
                          backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : "rgba(199, 21, 133, 0.1)",
                          borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : "rgba(199, 21, 133, 0.3)",
                        }]}
                        onPress={() => handleOpenUrlModal(selectedCategory.id, video.id)}
                        activeOpacity={0.7}
                      >
                        <Link color={isNightMode ? "#FFD700" : "#C71585"} size={16} strokeWidth={2.5} />
                        <Text style={[styles.editVideoText, { color: isNightMode ? "#FFD700" : "#C71585" }]}>Change Video</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={[styles.editVideoButton, {
                          backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : "rgba(199, 21, 133, 0.1)",
                          borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : "rgba(199, 21, 133, 0.3)",
                        }]}
                        onPress={() => handlePreviewSettings(selectedCategory.id, video.id)}
                        activeOpacity={0.7}
                      >
                        <Camera color={isNightMode ? "#FFD700" : "#C71585"} size={16} strokeWidth={2.5} />
                        <Text style={[styles.editVideoText, { color: isNightMode ? "#FFD700" : "#C71585" }]}>Preview</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                <View style={styles.addVideoOptionsRow}>
                  <TouchableOpacity
                    style={[styles.addVideoButton, styles.addVideoButtonHalf, {
                      backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : "rgba(199, 21, 133, 0.1)",
                      borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : "rgba(199, 21, 133, 0.3)",
                    }]}
                    onPress={() => handlePickVideo(selectedCategory.id)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={isNightMode 
                        ? ["rgba(255, 215, 0, 0.15)", "rgba(255, 20, 147, 0.15)"]
                        : ["rgba(199, 21, 133, 0.15)", "rgba(157, 78, 221, 0.15)"]
                      }
                      style={styles.addVideoGradient}
                    >
                      <View style={[styles.addVideoIconContainer, {
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "rgba(199, 21, 133, 0.2)",
                      }]}>
                        <Upload color={isNightMode ? "#FFD700" : "#C71585"} size={24} strokeWidth={2.5} />
                      </View>
                      <Text style={[styles.addVideoTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>
                        Upload File
                      </Text>
                      <Text style={[styles.addVideoSubtitle, { color: isNightMode ? "#888888" : theme.colors.text.secondary }]}>
                        From device
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.addVideoButton, styles.addVideoButtonHalf, {
                      backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : "rgba(199, 21, 133, 0.1)",
                      borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : "rgba(199, 21, 133, 0.3)",
                    }]}
                    onPress={() => handleOpenUrlModal(selectedCategory.id)}
                    activeOpacity={0.8}
                  >
                    <LinearGradient
                      colors={isNightMode 
                        ? ["rgba(255, 215, 0, 0.15)", "rgba(255, 20, 147, 0.15)"]
                        : ["rgba(199, 21, 133, 0.15)", "rgba(157, 78, 221, 0.15)"]
                      }
                      style={styles.addVideoGradient}
                    >
                      <View style={[styles.addVideoIconContainer, {
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "rgba(199, 21, 133, 0.2)",
                      }]}>
                        <Link color={isNightMode ? "#FFD700" : "#C71585"} size={24} strokeWidth={2.5} />
                      </View>
                      <Text style={[styles.addVideoTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>
                        Add URL
                      </Text>
                      <Text style={[styles.addVideoSubtitle, { color: isNightMode ? "#888888" : theme.colors.text.secondary }]}>
                        Google Drive link
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </View>
        </Modal>
      )}

      {selectedVideo && (
        <Modal
          visible={true}
          animationType="fade"
          presentationStyle="fullScreen"
          onRequestClose={handleCloseVideo}
        >
          <View style={styles.videoModalContainer}>
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleCloseVideo}
              activeOpacity={0.7}
            >
              <View style={styles.closeButtonCircle}>
                <X color="#FFFFFF" size={24} strokeWidth={2.5} />
              </View>
            </TouchableOpacity>

            <Video
              source={{ uri: selectedVideo.videoUrl }}
              style={styles.videoPlayer}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping
              shouldPlay
            />

            <View style={[styles.videoInfoOverlay, { paddingBottom: insets.bottom + 20 }]}>
              <Text style={styles.videoModalTitle}>{selectedVideo.title}</Text>
              {selectedVideo.description && (
                <Text style={styles.videoModalDescription}>{selectedVideo.description}</Text>
              )}
            </View>
          </View>
        </Modal>
      )}

      {editingVideo && (
        <Modal
          visible={true}
          animationType="slide"
          transparent={true}
          onRequestClose={handleCancelTextEdit}
        >
          <View style={styles.editModalOverlay}>
            <View style={[styles.editModalContent, {
              backgroundColor: isNightMode ? "#1a0a1f" : "#FFFFFF",
            }]}>
              <LinearGradient
                colors={isNightMode 
                  ? ["rgba(80, 40, 100, 0.95)", "rgba(60, 20, 80, 0.95)"]
                  : [theme.colors.primary + "15", theme.colors.secondary + "15"]
                }
                style={styles.editModalGradient}
              >
                <View style={styles.editModalHeader}>
                  <Text style={[styles.editModalTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>
                    Edit Video Details
                  </Text>
                  <TouchableOpacity
                    onPress={handleCancelTextEdit}
                    style={styles.editModalCloseButton}
                    activeOpacity={0.7}
                  >
                    <X color={isNightMode ? "#FFD700" : "#C71585"} size={24} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                <View style={styles.editModalForm}>
                  <View style={styles.editInputGroup}>
                    <Text style={[styles.editInputLabel, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>
                      Title
                    </Text>
                    <TextInput
                      value={editTitle}
                      onChangeText={setEditTitle}
                      style={[styles.editInput, {
                        backgroundColor: isNightMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                        borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : "rgba(199, 21, 133, 0.3)",
                        color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                      }]}
                      placeholder="Enter video title"
                      placeholderTextColor={isNightMode ? "#888888" : "#999999"}
                      maxLength={100}
                    />
                    <Text style={[styles.charCount, { color: isNightMode ? "#888888" : "#999999" }]}>
                      {editTitle.length}/100
                    </Text>
                  </View>

                  <View style={styles.editInputGroup}>
                    <Text style={[styles.editInputLabel, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>
                      Description
                    </Text>
                    <TextInput
                      value={editDescription}
                      onChangeText={setEditDescription}
                      style={[styles.editTextArea, {
                        backgroundColor: isNightMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                        borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : "rgba(199, 21, 133, 0.3)",
                        color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                      }]}
                      placeholder="Enter video description"
                      placeholderTextColor={isNightMode ? "#888888" : "#999999"}
                      multiline
                      numberOfLines={4}
                      maxLength={300}
                      textAlignVertical="top"
                      editable={true}
                    />
                    <Text style={[styles.charCount, { color: isNightMode ? "#888888" : "#999999" }]}>
                      {editDescription.length}/300
                    </Text>
                  </View>

                  <View style={styles.editModalButtons}>
                    <TouchableOpacity
                      style={[styles.editModalButton, styles.editModalCancelButton, {
                        borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : "rgba(199, 21, 133, 0.3)",
                      }]}
                      onPress={handleCancelTextEdit}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.editModalButtonText, { color: isNightMode ? "#FFD700" : "#C71585" }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.editModalButton, {
                        backgroundColor: isNightMode ? "#FFD700" : "#C71585",
                      }]}
                      onPress={handleSaveTextEdits}
                      activeOpacity={0.7}
                    >
                      <Check color={isNightMode ? "#000000" : "#FFFFFF"} size={20} strokeWidth={2.5} />
                      <Text style={[styles.editModalButtonText, { color: isNightMode ? "#000000" : "#FFFFFF" }]}>
                        Save Changes
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      )}

      {previewSettingsVideo && (
        <Modal
          visible={true}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setPreviewSettingsVideo(null)}
        >
          <View style={styles.editModalOverlay}>
            <View style={[styles.editModalContent, {
              backgroundColor: isNightMode ? "#1a0a1f" : "#FFFFFF",
            }]}>
              <LinearGradient
                colors={isNightMode 
                  ? ["rgba(80, 40, 100, 0.95)", "rgba(60, 20, 80, 0.95)"]
                  : [theme.colors.primary + "15", theme.colors.secondary + "15"]
                }
                style={styles.editModalGradient}
              >
                <View style={styles.editModalHeader}>
                  <Text style={[styles.editModalTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>
                    Preview Settings
                  </Text>
                  <TouchableOpacity
                    onPress={() => setPreviewSettingsVideo(null)}
                    style={styles.editModalCloseButton}
                    activeOpacity={0.7}
                  >
                    <X color={isNightMode ? "#FFD700" : "#C71585"} size={24} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                <View style={styles.previewOptions}>
                  <Text style={[styles.previewLabel, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>
                    Choose preview type for this video:
                  </Text>
                  
                  <TouchableOpacity
                    style={[
                      styles.previewOption, 
                      previewType === 'still' && [styles.previewOptionActive, {
                        borderColor: isNightMode ? "#FFD700" : "#C71585",
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : "rgba(199, 21, 133, 0.1)",
                      }],
                      {
                        borderColor: previewType !== 'still' 
                          ? (isNightMode ? "rgba(255, 215, 0, 0.2)" : "rgba(199, 21, 133, 0.2)")
                          : (isNightMode ? "#FFD700" : "#C71585"),
                      }
                    ]}
                    onPress={() => setPreviewType('still')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.previewIconContainer, {
                      backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : "rgba(199, 21, 133, 0.15)",
                    }]}>
                      <ImageIcon color={isNightMode ? "#FFD700" : "#C71585"} size={24} strokeWidth={2.5} />
                    </View>
                    <View style={styles.previewOptionContent}>
                      <Text style={[styles.previewOptionTitle, { color: isNightMode ? "#FFFFFF" : theme.colors.text.primary }]}>
                        Still Image
                      </Text>
                      <Text style={[styles.previewOptionDescription, { color: isNightMode ? "#888888" : theme.colors.text.secondary }]}>
                        Show a static thumbnail from the video
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.previewOption,
                      previewType === 'loop' && [styles.previewOptionActive, {
                        borderColor: isNightMode ? "#FFD700" : "#C71585",
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : "rgba(199, 21, 133, 0.1)",
                      }],
                      {
                        borderColor: previewType !== 'loop' 
                          ? (isNightMode ? "rgba(255, 215, 0, 0.2)" : "rgba(199, 21, 133, 0.2)")
                          : (isNightMode ? "#FFD700" : "#C71585"),
                      }
                    ]}
                    onPress={() => setPreviewType('loop')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.previewIconContainer, {
                      backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : "rgba(199, 21, 133, 0.15)",
                    }]}>
                      <Play color={isNightMode ? "#FFD700" : "#C71585"} size={24} strokeWidth={2.5} />
                    </View>
                    <View style={styles.previewOptionContent}>
                      <Text style={[styles.previewOptionTitle, { color: isNightMode ? "#FFFFFF" : theme.colors.text.primary }]}>
                        3 Second Loop
                      </Text>
                      <Text style={[styles.previewOptionDescription, { color: isNightMode ? "#888888" : theme.colors.text.secondary }]}>
                        Play a 3-second preview on repeat
                      </Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.previewOption,
                      previewType === 'custom' && [styles.previewOptionActive, {
                        borderColor: isNightMode ? "#FFD700" : "#C71585",
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : "rgba(199, 21, 133, 0.1)",
                      }],
                      {
                        borderColor: previewType !== 'custom' 
                          ? (isNightMode ? "rgba(255, 215, 0, 0.2)" : "rgba(199, 21, 133, 0.2)")
                          : (isNightMode ? "#FFD700" : "#C71585"),
                      }
                    ]}
                    onPress={() => setPreviewType('custom')}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.previewIconContainer, {
                      backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : "rgba(199, 21, 133, 0.15)",
                    }]}>
                      <Upload color={isNightMode ? "#FFD700" : "#C71585"} size={24} strokeWidth={2.5} />
                    </View>
                    <View style={styles.previewOptionContent}>
                      <Text style={[styles.previewOptionTitle, { color: isNightMode ? "#FFFFFF" : theme.colors.text.primary }]}>
                        Custom Thumbnail
                      </Text>
                      <Text style={[styles.previewOptionDescription, { color: isNightMode ? "#888888" : theme.colors.text.secondary }]}>
                        Upload your own preview image
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {previewType === 'custom' && (
                    <TouchableOpacity
                      style={[styles.uploadThumbnailButton, {
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : "rgba(199, 21, 133, 0.1)",
                        borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : "rgba(199, 21, 133, 0.3)",
                      }]}
                      onPress={() => {
                        if (previewSettingsVideo) {
                          handlePickThumbnail(previewSettingsVideo.categoryId, previewSettingsVideo.videoId);
                        }
                      }}
                      activeOpacity={0.7}
                    >
                      <Upload color={isNightMode ? "#FFD700" : "#C71585"} size={20} strokeWidth={2.5} />
                      <Text style={[styles.uploadThumbnailText, { color: isNightMode ? "#FFD700" : "#C71585" }]}>
                        Choose Image
                      </Text>
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.editModalButtons}>
                  <TouchableOpacity
                    style={[styles.editModalButton, styles.editModalCancelButton, {
                      borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : "rgba(199, 21, 133, 0.3)",
                    }]}
                    onPress={() => setPreviewSettingsVideo(null)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.editModalButtonText, { color: isNightMode ? "#FFD700" : "#C71585" }]}>
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={[styles.editModalButton, {
                      backgroundColor: isNightMode ? "#FFD700" : "#C71585",
                    }]}
                    onPress={handleSavePreviewSettings}
                    activeOpacity={0.7}
                  >
                    <Check color={isNightMode ? "#000000" : "#FFFFFF"} size={20} strokeWidth={2.5} />
                    <Text style={[styles.editModalButtonText, { color: isNightMode ? "#000000" : "#FFFFFF" }]}>
                      Save Settings
                    </Text>
                  </TouchableOpacity>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      )}

      {showUrlModal && (
        <Modal
          visible={true}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setShowUrlModal(false)}
        >
          <View style={styles.editModalOverlay}>
            <View style={[styles.editModalContent, {
              backgroundColor: isNightMode ? "#1a0a1f" : "#FFFFFF",
            }]}>
              <LinearGradient
                colors={isNightMode 
                  ? ["rgba(80, 40, 100, 0.95)", "rgba(60, 20, 80, 0.95)"]
                  : [theme.colors.primary + "15", theme.colors.secondary + "15"]
                }
                style={styles.editModalGradient}
              >
                <View style={styles.editModalHeader}>
                  <View style={styles.urlModalTitleRow}>
                    <Globe color={isNightMode ? "#FFD700" : "#C71585"} size={24} strokeWidth={2.5} />
                    <Text style={[styles.editModalTitle, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>
                      {urlVideoId ? "Change Video URL" : "Add Video from URL"}
                    </Text>
                  </View>
                  <TouchableOpacity
                    onPress={() => {
                      setShowUrlModal(false);
                      setUrlVideoId(null);
                    }}
                    style={styles.editModalCloseButton}
                    activeOpacity={0.7}
                  >
                    <X color={isNightMode ? "#FFD700" : "#C71585"} size={24} strokeWidth={2.5} />
                  </TouchableOpacity>
                </View>

                <View style={styles.editModalForm}>
                  <View style={styles.editInputGroup}>
                    <Text style={[styles.editInputLabel, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>
                      Video URL {urlVideoId ? "" : "*"}
                    </Text>
                    <TextInput
                      value={urlInput}
                      onChangeText={setUrlInput}
                      style={[styles.editInput, {
                        backgroundColor: isNightMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                        borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : "rgba(199, 21, 133, 0.3)",
                        color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                      }]}
                      placeholder="https://drive.google.com/file/d/..."
                      placeholderTextColor={isNightMode ? "#888888" : "#999999"}
                      autoCapitalize="none"
                      autoCorrect={false}
                      keyboardType="url"
                    />
                    <Text style={[styles.urlHint, { color: isNightMode ? "#888888" : "#999999" }]}>
                      Supports Google Drive share links
                    </Text>
                  </View>

                  <View style={styles.editInputGroup}>
                    <Text style={[styles.editInputLabel, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>
                      Title
                    </Text>
                    <TextInput
                      value={urlTitle}
                      onChangeText={setUrlTitle}
                      style={[styles.editInput, {
                        backgroundColor: isNightMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                        borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : "rgba(199, 21, 133, 0.3)",
                        color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                      }]}
                      placeholder="Enter video title"
                      placeholderTextColor={isNightMode ? "#888888" : "#999999"}
                      maxLength={100}
                    />
                  </View>

                  <View style={styles.editInputGroup}>
                    <Text style={[styles.editInputLabel, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>
                      Description
                    </Text>
                    <TextInput
                      value={urlDescription}
                      onChangeText={setUrlDescription}
                      style={[styles.editTextArea, {
                        backgroundColor: isNightMode ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)",
                        borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : "rgba(199, 21, 133, 0.3)",
                        color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                      }]}
                      placeholder="Enter video description"
                      placeholderTextColor={isNightMode ? "#888888" : "#999999"}
                      multiline
                      numberOfLines={3}
                      maxLength={200}
                      textAlignVertical="top"
                    />
                  </View>

                  <View style={styles.editModalButtons}>
                    <TouchableOpacity
                      style={[styles.editModalButton, styles.editModalCancelButton, {
                        borderColor: isNightMode ? "rgba(255, 215, 0, 0.3)" : "rgba(199, 21, 133, 0.3)",
                      }]}
                      onPress={() => {
                        setShowUrlModal(false);
                        setUrlVideoId(null);
                      }}
                      activeOpacity={0.7}
                    >
                      <Text style={[styles.editModalButtonText, { color: isNightMode ? "#FFD700" : "#C71585" }]}>
                        Cancel
                      </Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity
                      style={[styles.editModalButton, {
                        backgroundColor: isNightMode ? "#FFD700" : "#C71585",
                        opacity: urlInput.trim() ? 1 : 0.5,
                      }]}
                      onPress={handleAddUrlVideo}
                      activeOpacity={0.7}
                      disabled={!urlInput.trim()}
                    >
                      {urlVideoId ? (
                        <Check color={isNightMode ? "#000000" : "#FFFFFF"} size={20} strokeWidth={2.5} />
                      ) : (
                        <Plus color={isNightMode ? "#000000" : "#FFFFFF"} size={20} strokeWidth={2.5} />
                      )}
                      <Text style={[styles.editModalButtonText, { color: isNightMode ? "#000000" : "#FFFFFF" }]}>
                        {urlVideoId ? "Save Changes" : "Add Video"}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        </Modal>
      )}

      {showComingSoon && (
        <Modal
          visible={true}
          animationType="fade"
          transparent={true}
          onRequestClose={() => {}}
        >
          <View style={styles.comingSoonContainer}>
            {Platform.OS === 'web' ? (
              <View style={styles.comingSoonBlurWeb} />
            ) : (
              <BlurView
                intensity={95}
                tint={isNightMode ? "dark" : "light"}
                style={StyleSheet.absoluteFill}
              />
            )}
            
            <View style={styles.comingSoonContent}>
              {/* Realistic Hourglass Container */}
              <Animated.View 
                style={[
                  styles.hourglassWrapper,
                  {
                    transform: [{ rotate: spin }],
                  }
                ]}
              >
                {/* Hourglass Glass Shape */}
                <View style={styles.hourglassOuter}>
                  {/* Top Bulb */}
                  <View style={[
                    styles.hourglassBulbTop,
                    { borderColor: isNightMode ? "#FFD700" : "#C71585" }
                  ]}>
                    <Animated.View 
                      style={[
                        styles.sandTop,
                        { 
                          height: sandTopHeight,
                          backgroundColor: isNightMode ? "#FFB347" : "#FFB6C1"
                        }
                      ]} 
                    />
                  </View>
                  
                  {/* Neck */}
                  <View style={[
                    styles.hourglassNeck,
                    { borderColor: isNightMode ? "#FFD700" : "#C71585" }
                  ]}>
                    {/* Sand Stream */}
                    <Animated.View 
                      style={[
                        styles.sandStream,
                        { 
                          opacity: sandStreamOpacity,
                          backgroundColor: isNightMode ? "#FFB347" : "#FFB6C1"
                        }
                      ]} 
                    />
                  </View>
                  
                  {/* Bottom Bulb */}
                  <View style={[
                    styles.hourglassBulbBottom,
                    { borderColor: isNightMode ? "#FFD700" : "#C71585" }
                  ]}>
                    <Animated.View 
                      style={[
                        styles.sandBottom,
                        { 
                          height: sandBottomHeight,
                          backgroundColor: isNightMode ? "#FFB347" : "#FFB6C1"
                        }
                      ]} 
                    />
                  </View>
                </View>
              </Animated.View>

              <Text style={[
                styles.comingSoonText,
                { color: isNightMode ? "#FFD700" : "#C71585" }
              ]}>
                Coming Soon!
              </Text>
              <Text style={[
                styles.comingSoonDescription,
                { color: isNightMode ? "#FFFFFF" : "#333333" }
              ]}>
                Revolutionary videos that will transform your mindset, unlock your potential, and guide you to extraordinary success.
              </Text>
              <Text style={[
                styles.comingSoonSubheader,
                { color: isNightMode ? "#FFD700" : "#C71585" }
              ]}>
                We are crafting an extraordinary experience!
                This page is being prepared with care.
              </Text>
              <TouchableOpacity 
                style={styles.comingSoonHighlight}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
                  }
                  setShowComingSoon(false);
                  router.back();
                }}
                activeOpacity={0.8}
              >
                <Text style={[
                  styles.comingSoonHighlightText,
                  { color: isNightMode ? "#00FF87" : "#C71585" }
                ]}>
                  Worth the Wait
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  headerCenter: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  headerRight: {
    width: 40,
    height: 40,
  },
  heroSection: {
    marginBottom: 32,
  },
  heroGradient: {
    borderRadius: 24,
    padding: 32,
    alignItems: "center" as const,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  heroTitle: {
    fontSize: 32,
    fontWeight: "800" as const,
    marginTop: 16,
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  heroSubtitle: {
    fontSize: 16,
    fontWeight: "500" as const,
    textAlign: "center" as const,
    marginBottom: 24,
  },
  statsRow: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    width: "100%",
    gap: 16,
  },
  statItem: {
    alignItems: "center" as const,
    gap: 8,
    flex: 1,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "700" as const,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    marginBottom: 16,
    letterSpacing: 0.3,
  },
  videoCard: {
    borderRadius: 20,
    overflow: "hidden",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  videoThumbnail: {
    width: "100%",
    height: VIDEO_HEIGHT,
  },
  thumbnailGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  playButtonContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  playButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  smallPlayButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "rgba(255, 255, 255, 0.5)",
  },
  videoDuration: {
    position: "absolute" as const,
    bottom: 12,
    right: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  videoDurationText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700" as const,
  },
  smallDurationText: {
    color: "#FFFFFF",
    fontSize: 11,
    fontWeight: "700" as const,
  },
  videoInfo: {
    padding: 20,
  },
  videoTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  videoDescription: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500" as const,
  },
  videoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 16,
  },
  featuredVideoCard: {
    width: (SCREEN_WIDTH - 64) / 2,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
  },
  featuredVideoThumbnail: {
    width: "100%",
    height: ((SCREEN_WIDTH - 64) / 2) * 0.7,
  },
  featuredVideoInfo: {
    padding: 12,
  },
  featuredVideoTitle: {
    fontSize: 14,
    fontWeight: "700" as const,
    lineHeight: 18,
    letterSpacing: 0.2,
  },
  categoriesGrid: {
    gap: 16,
  },
  categoryCard: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  categoryCardGradient: {
    padding: 20,
  },
  categoryIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  categoryTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  categoryFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  categoryVideoCount: {
    fontSize: 13,
    fontWeight: "600" as const,
  },
  lockBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  subscriptionCard: {
    borderRadius: 24,
    overflow: "hidden",
    elevation: 4,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  subscriptionGradient: {
    padding: 28,
    alignItems: "center",
  },
  subscriptionBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  subscriptionTitle: {
    fontSize: 24,
    fontWeight: "800" as const,
    color: "#FFFFFF",
    marginBottom: 12,
    letterSpacing: 0.3,
  },
  subscriptionDescription: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.9)",
    textAlign: "center",
    lineHeight: 22,
    fontWeight: "500" as const,
    marginBottom: 24,
  },
  subscriptionFeatures: {
    alignSelf: "stretch",
    gap: 12,
    marginBottom: 28,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "700" as const,
  },
  featureText: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: "600" as const,
  },
  subscribeButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  subscribeButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  videoModalContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center" as const,
  },
  closeButton: {
    position: "absolute" as const,
    top: 50,
    right: 20,
    zIndex: 100,
  },
  closeButtonCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  videoPlayer: {
    width: "100%",
    height: "100%",
  },
  videoInfoOverlay: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    padding: 20,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
  },
  videoModalTitle: {
    fontSize: 20,
    fontWeight: "700" as const,
    color: "#FFFFFF",
    marginBottom: 8,
  },
  videoModalDescription: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    lineHeight: 20,
  },
  categoryModalTitle: {
    fontSize: 28,
    fontWeight: "800" as const,
    marginBottom: 24,
    letterSpacing: 0.5,
  },
  categoryVideosList: {
    gap: 16,
  },
  categoryVideoCard: {
    borderRadius: 16,
    overflow: "hidden",
    flexDirection: "row" as const,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  categoryVideoThumbnail: {
    width: 140,
    height: 100,
  },
  categoryVideoThumbGradient: {
    width: "100%",
    height: "100%",
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  categoryVideoInfo: {
    flex: 1,
    padding: 12,
    justifyContent: "center" as const,
  },
  categoryVideoTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    marginBottom: 6,
    letterSpacing: 0.2,
  },
  categoryVideoDescription: {
    fontSize: 13,
    lineHeight: 18,
  },
  videoItemWrapper: {
    gap: 8,
  },
  editVideoButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  editVideoText: {
    fontSize: 14,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  addVideoButton: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 2,
    borderStyle: "dashed" as const,
    marginTop: 8,
  },
  addVideoGradient: {
    padding: 28,
    alignItems: "center" as const,
    gap: 12,
  },
  addVideoIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  addVideoTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  addVideoSubtitle: {
    fontSize: 14,
    fontWeight: "500" as const,
    textAlign: "center" as const,
  },
  editButtonsRow: {
    flexDirection: "row" as const,
    gap: 8,
    flex: 1,
  },
  addVideoOptionsRow: {
    flexDirection: "row" as const,
    gap: 12,
    marginTop: 8,
  },
  addVideoButtonHalf: {
    flex: 1,
    marginTop: 0,
  },
  urlModalTitleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
  },
  urlHint: {
    fontSize: 12,
    fontWeight: "500" as const,
    marginTop: 4,
    marginLeft: 4,
  },
  editModalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 20,
  },
  editModalContent: {
    width: "100%",
    maxWidth: 400,
    borderRadius: 24,
    overflow: "hidden",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
  },
  editModalGradient: {
    padding: 24,
  },
  editModalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 24,
  },
  editModalTitle: {
    fontSize: 22,
    fontWeight: "800" as const,
    letterSpacing: 0.3,
  },
  editModalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  editModalForm: {
    gap: 20,
  },
  editInputGroup: {
    gap: 8,
  },
  editInputLabel: {
    fontSize: 14,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
    marginLeft: 4,
  },
  editInput: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "500" as const,
  },
  editTextArea: {
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: "500" as const,
    minHeight: 100,
  },
  charCount: {
    fontSize: 12,
    fontWeight: "600" as const,
    textAlign: "right" as const,
    marginTop: 4,
    marginRight: 4,
  },
  editModalButtons: {
    flexDirection: "row" as const,
    gap: 12,
    marginTop: 8,
  },
  editModalButton: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 14,
  },
  editModalCancelButton: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
  },
  editModalButtonText: {
    fontSize: 15,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  previewOptions: {
    gap: 16,
    marginBottom: 8,
  },
  previewLabel: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  previewOption: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
  },
  previewOptionActive: {
    borderWidth: 2,
  },
  previewIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  previewOptionContent: {
    flex: 1,
    gap: 4,
  },
  previewOptionTitle: {
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
  },
  previewOptionDescription: {
    fontSize: 13,
    fontWeight: "500" as const,
    lineHeight: 18,
  },
  uploadThumbnailButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 14,
    borderWidth: 2,
    borderStyle: "dashed" as const,
    marginTop: 8,
  },
  uploadThumbnailText: {
    fontSize: 15,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  savingIndicator: {
    position: "absolute" as const,
    top: 100,
    left: 0,
    right: 0,
    alignItems: "center" as const,
    zIndex: 1000,
  },
  savingBadge: {
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  savingText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600" as const,
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  comingSoonBlurWeb: {
    ...StyleSheet.absoluteFillObject,
    backdropFilter: "blur(30px)",
    WebkitBackdropFilter: "blur(30px)",
    backgroundColor: "rgba(0, 0, 0, 0.7)",
  } as any,
  comingSoonContent: {
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 20,
    padding: 24,
    maxWidth: 320,
  },
  hourglassWrapper: {
    width: 80,
    height: 100,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    marginBottom: 8,
  },
  hourglassOuter: {
    width: 60,
    height: 90,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  hourglassBulbTop: {
    width: 50,
    height: 35,
    borderWidth: 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    overflow: "hidden",
    justifyContent: "flex-end" as const,
    alignItems: "center" as const,
    backgroundColor: "transparent",
  },
  hourglassBulbBottom: {
    width: 50,
    height: 35,
    borderWidth: 2,
    borderTopWidth: 0,
    borderBottomLeftRadius: 25,
    borderBottomRightRadius: 25,
    overflow: "hidden",
    justifyContent: "flex-end" as const,
    alignItems: "center" as const,
    backgroundColor: "transparent",
  },
  hourglassNeck: {
    width: 20,
    height: 20,
    borderLeftWidth: 2,
    borderRightWidth: 2,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    position: "relative" as const,
  },
  sandTop: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
  },
  sandBottom: {
    position: "absolute" as const,
    bottom: 0,
    left: 0,
    right: 0,
    borderBottomLeftRadius: 20,
    borderBottomRightRadius: 20,
  },
  sandStream: {
    width: 2,
    height: 18,
    position: "absolute" as const,
  },
  comingSoonText: {
    fontSize: 18,
    fontWeight: "800" as const,
    letterSpacing: 1,
    textAlign: "center" as const,
    textTransform: "uppercase" as const,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    marginBottom: 8,
  },
  comingSoonDescription: {
    fontSize: 13,
    fontWeight: "600" as const,
    lineHeight: 20,
    textAlign: "center" as const,
    paddingHorizontal: 8,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  comingSoonHighlight: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.25)",
  },
  comingSoonHighlightText: {
    fontSize: 12,
    fontWeight: "700" as const,
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
    textShadowColor: "rgba(0, 0, 0, 0.3)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  comingSoonSubheader: {
    fontSize: 14,
    fontWeight: "700" as const,
    lineHeight: 20,
    textAlign: "center" as const,
    paddingHorizontal: 8,
    letterSpacing: 0.3,
    textShadowColor: "rgba(0, 0, 0, 0.5)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
