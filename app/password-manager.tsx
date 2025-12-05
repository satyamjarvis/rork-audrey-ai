import { useState, useEffect, useRef, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Platform,
  Animated,
  Switch,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as LocalAuthentication from "expo-local-authentication";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import * as Crypto from "expo-crypto";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, Stack } from "expo-router";
import {
  Lock,
  Key,
  Eye,
  EyeOff,
  Copy,
  Plus,
  Trash2,
  Search,
  ShieldCheck,
  ArrowLeft,
  Save,
  Fingerprint,
  MoreVertical,
  Globe,
  User,
  Settings,
  ChevronRight,
  RefreshCcw,
} from "lucide-react-native";

import { useTheme } from "@/contexts/ThemeContext";
import { encrypt, decrypt } from "@/utils/encryption";
import KeyboardDismissButton from "@/components/KeyboardDismissButton";

const STORAGE_KEY = "@rork_passwords";
const PIN_KEY = "@rork_password_manager_pin";
const BIOMETRIC_KEY = "@rork_biometrics_enabled";

interface PasswordEntry {
  id: string;
  title: string;
  username: string;
  password: string;
  url?: string;
  category?: string;
  updatedAt: number;
}

const INTRO_SHOWN_KEY = 'intro_shown';
const FIRST_LAUNCH_KEY = 'has_launched_before';

export default function PasswordManagerScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  
  const isDark = useMemo(() => 
    theme.name.toLowerCase().includes('night') || 
    theme.name.toLowerCase().includes('dark') || 
    theme.colors.background === '#000000', 
  [theme.name, theme.colors.background]);

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pinInput, setPinInput] = useState("");
  const [setupPin, setSetupPin] = useState("");
  const [isSettingUpPin, setIsSettingUpPin] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [isBiometricLoading, setIsBiometricLoading] = useState(false);
  const [isBiometricEnabled, setIsBiometricEnabled] = useState(false);

  const [passwords, setPasswords] = useState<PasswordEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [settingsModalVisible, setSettingsModalVisible] = useState(false);
  const [changePinStep, setChangePinStep] = useState<"none" | "current" | "new" | "confirm">("none");
  
  const [editingPassword, setEditingPassword] = useState<PasswordEntry | null>(null);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const shakeAnim = useRef(new Animated.Value(0)).current;

  const [formData, setFormData] = useState({
    title: "",
    username: "",
    password: "",
    url: "",
    category: "",
  });

  const [passwordVisibleInForm, setPasswordVisibleInForm] = useState(false);

  const authenticateBiometric = async () => {
    if ((Platform.OS as string) === 'web') return;
    try {
      setIsBiometricLoading(true);
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to access Password Manager",
        fallbackLabel: "Use PIN",
      });
      if (result.success) {
        setIsAuthenticated(true);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    } catch (error) {
      console.error("Biometric auth error:", error);
    } finally {
      setIsBiometricLoading(false);
    }
  };

  const checkPinStatus = async () => {
    const storedPin = await AsyncStorage.getItem(PIN_KEY);
    if (!storedPin) {
      setIsSettingUpPin(true);
    } else {
       const bioEnabled = await AsyncStorage.getItem(BIOMETRIC_KEY);
       if (bioEnabled === "true") {
         authenticateBiometric();
       }
    }
  };

  const checkBiometrics = async () => {
    if ((Platform.OS as string) === 'web') return;
    const compatible = await LocalAuthentication.hasHardwareAsync();
    const enrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricsAvailable(compatible && enrolled);
  };

  useEffect(() => {
    checkPinStatus();
    checkBiometrics();
    loadPasswords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 50,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isAuthenticated, fadeAnim, slideAnim]);

  useEffect(() => {
    if (pinInput.length === 6) {
      handlePinSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pinInput]);

  useEffect(() => {
    AsyncStorage.getItem(BIOMETRIC_KEY).then(val => setIsBiometricEnabled(val === "true"));
  }, [settingsModalVisible]);

  const handlePinSubmit = async () => {
    if (pinInput.length !== 6) return;

    if (changePinStep === "current") {
      const storedPin = await AsyncStorage.getItem(PIN_KEY);
      const hashed = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pinInput
      );
      
      if (hashed === storedPin) {
        setPinInput("");
        setChangePinStep("none");
        setSettingsModalVisible(false);
        await AsyncStorage.removeItem(PIN_KEY);
        setIsAuthenticated(false);
        setIsSettingUpPin(true);
        setSetupPin("");
        Alert.alert("Success", "PIN cleared. Please create a new PIN.");
      } else {
        shake();
        setPinInput("");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        Alert.alert("Error", "Incorrect PIN");
      }
      return;
    }

    if (isSettingUpPin) {
      if (!setupPin) {
        setSetupPin(pinInput);
        setPinInput("");
        Alert.alert("Confirm PIN", "Please enter your PIN again to confirm.");
      } else {
        if (pinInput === setupPin) {
          const hashed = await Crypto.digestStringAsync(
            Crypto.CryptoDigestAlgorithm.SHA256,
            pinInput
          );
          await AsyncStorage.setItem(PIN_KEY, hashed);
          
          setIsSettingUpPin(false);
          setIsAuthenticated(true);
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          
          if (biometricsAvailable) {
            setTimeout(() => {
              Alert.alert(
                "Enable Biometrics?",
                "Use Face ID or Touch ID for faster access next time?",
                [
                  { text: "Not Now", style: "cancel" },
                  { 
                    text: "Enable", 
                    onPress: async () => {
                      await AsyncStorage.setItem(BIOMETRIC_KEY, "true");
                      setIsBiometricEnabled(true);
                    }
                  }
                ]
              );
            }, 500);
          }
        } else {
          Alert.alert("Error", "PINs do not match. Please try again.");
          setSetupPin("");
          setPinInput("");
          shake();
        }
      }
    } else {
      const storedPin = await AsyncStorage.getItem(PIN_KEY);
      const hashed = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        pinInput
      );
      if (hashed === storedPin) {
        setIsAuthenticated(true);
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        shake();
        setPinInput("");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    }
  };

  const shake = () => {
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 10, duration: 50, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0, duration: 50, useNativeDriver: true }),
    ]).start();
  };

  const loadPasswords = async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPasswords(JSON.parse(stored));
      }
    } catch (error) {
      console.error("Error loading passwords:", error);
    }
  };

  const savePassword = async () => {
    if (!formData.title.trim() || !formData.password.trim()) {
      Alert.alert("Error", "Title and Password are required");
      return;
    }

    try {
      const encryptedPassword = await encrypt(formData.password);
      
      const newEntry: PasswordEntry = {
        id: editingPassword ? editingPassword.id : Date.now().toString(),
        title: formData.title.trim(),
        username: formData.username.trim() || "",
        password: encryptedPassword,
        url: formData.url.trim() || undefined,
        category: formData.category.trim() || undefined,
        updatedAt: Date.now(),
      };

      let updatedPasswords;
      if (editingPassword) {
        updatedPasswords = passwords.map(p => p.id === editingPassword.id ? newEntry : p);
      } else {
        updatedPasswords = [...passwords, newEntry];
      }

      setPasswords(updatedPasswords);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPasswords));
      
      setEditModalVisible(false);
      resetForm();
      if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error saving password:", error);
      Alert.alert("Error", "Failed to save password");
    }
  };

  const deletePassword = async (id: string) => {
    Alert.alert("Delete Password", "Are you sure you want to delete this password?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          const updated = passwords.filter(p => p.id !== id);
          setPasswords(updated);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
          if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        }
      }
    ]);
  };

  const openEditModal = async (password?: PasswordEntry) => {
    if (password) {
      setEditingPassword(password);
      try {
        const decrypted = await decrypt(password.password);
        setFormData({
          title: password.title,
          username: password.username,
          password: decrypted,
          url: password.url || "",
          category: password.category || "",
        });
      } catch (e) {
        console.error("Error decrypting for edit", e);
        Alert.alert("Error", "Could not decrypt password");
        return;
      }
    } else {
      setEditingPassword(null);
      resetForm();
    }
    setEditModalVisible(true);
  };

  const resetForm = () => {
    setFormData({
      title: "",
      username: "",
      password: "",
      url: "",
      category: "",
    });
    setPasswordVisibleInForm(false);
  };

  const copyToClipboard = async (text: string, type: string) => {
    await Clipboard.setStringAsync(text);
    if (Platform.OS !== "web") Haptics.selectionAsync();
  };

  const filteredPasswords = useMemo(() => {
    return passwords.filter(p => {
      const matchesSearch = 
        p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.username.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory ? p.category === selectedCategory : true;
      return matchesSearch && matchesCategory;
    });
  }, [passwords, searchQuery, selectedCategory]);

  const categories = useMemo(() => {
    const cats = new Set(passwords.map(p => p.category || "General"));
    return Array.from(cats);
  }, [passwords]);

  const handleForgotPin = () => {
    Alert.alert(
      "Reset Password Manager?",
      "To recover access, you will be logged out of the app. You must complete the setup process again to verify your identity. Your passwords will be preserved, but you will need to set a new PIN.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reset & Logout",
          style: "destructive",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem(PIN_KEY);
              await AsyncStorage.removeItem(BIOMETRIC_KEY);
              await AsyncStorage.removeItem(FIRST_LAUNCH_KEY);
              await AsyncStorage.removeItem(INTRO_SHOWN_KEY);
              
              if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
              
              router.replace("/intro-splash");
            } catch (error) {
              console.error("Error resetting:", error);
              Alert.alert("Error", "Failed to reset application");
            }
          }
        }
      ]
    );
  };

  const toggleBiometrics = async () => {
    if (!biometricsAvailable) {
      Alert.alert("Not Available", "Biometrics are not available on this device.");
      return;
    }

    const isEnabled = await AsyncStorage.getItem(BIOMETRIC_KEY) === "true";
    
    if (isEnabled) {
      await AsyncStorage.removeItem(BIOMETRIC_KEY);
      if (Platform.OS !== "web") Haptics.selectionAsync();
    } else {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Authenticate to enable biometrics",
      });
      if (result.success) {
        await AsyncStorage.setItem(BIOMETRIC_KEY, "true");
        if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
    }
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
         <Stack.Screen options={{ headerShown: false }} />
         <LinearGradient 
            colors={isDark ? ["#000000", "#1a1a1a"] : theme.gradients.background as any} 
            style={styles.gradient}
         >
            <TouchableOpacity 
              style={[styles.backButton, { top: insets.top + 20 }]} 
              onPress={() => router.back()}
            >
              <ArrowLeft color={isDark ? "#FFF" : theme.colors.text.primary} size={24} />
            </TouchableOpacity>

            <View style={styles.lockContent}>
               <Animated.View style={{ transform: [{ translateX: shakeAnim }] }}>
                 <View style={[styles.lockIconContainer, { backgroundColor: isSettingUpPin ? theme.colors.primary : (isDark ? "#333" : "rgba(0,0,0,0.05)") }]}>
                    <Lock color={isDark ? "#FFF" : theme.colors.text.primary} size={40} />
                 </View>
               </Animated.View>
               
               <Text style={[styles.lockTitle, { color: isDark ? "#FFF" : theme.colors.text.primary }]}>
                 {isSettingUpPin 
                   ? (setupPin ? "Confirm PIN" : "Create 6-Digit PIN") 
                   : (changePinStep === "current" ? "Enter Current PIN" : "Enter PIN")}
               </Text>
               <Text style={[styles.lockSubtitle, { color: isDark ? "#AAA" : theme.colors.text.secondary }]}>
                 {isSettingUpPin 
                   ? (setupPin ? "Re-enter your 6-digit PIN" : "Create a secure 6-digit PIN") 
                   : (changePinStep === "current" ? "Verify to change PIN" : "Enter your PIN to unlock")}
               </Text>

               <View style={styles.pinIndicatorContainer}>
                  {[0, 1, 2, 3, 4, 5].map((i) => (
                    <View 
                      key={i} 
                      style={[
                        styles.pinDot, 
                        { borderColor: isDark ? "#666" : "#999" },
                        pinInput.length > i && { backgroundColor: theme.colors.primary, borderColor: theme.colors.primary }
                      ]} 
                    />
                  ))}
               </View>

               <View style={styles.numpad}>
                 {[1, 2, 3, 4, 5, 6, 7, 8, 9, -1, 0, -2].map((num) => {
                   if (num === -1 && !biometricsAvailable && changePinStep !== "current") return <View key="empty" style={styles.numButton} />;
                   if (num === -1) {
                     if (changePinStep === "current" || isSettingUpPin) return <View key="empty" style={styles.numButton} />;
                     
                     return (
                        <TouchableOpacity 
                          key="bio" 
                          style={[styles.numButton, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]} 
                          onPress={authenticateBiometric}
                          disabled={isBiometricLoading}
                        >
                           {isBiometricLoading ? (
                             <ActivityIndicator color={theme.colors.primary} />
                           ) : (
                             <Fingerprint color={theme.colors.primary} size={28} />
                           )}
                        </TouchableOpacity>
                     );
                   }
                   if (num === -2) {
                      return (
                        <TouchableOpacity 
                          key="backspace" 
                          style={[styles.numButton, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]} 
                          onPress={() => {
                            if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                            setPinInput(prev => prev.slice(0, -1));
                          }}
                        >
                           <ArrowLeft color={isDark ? "#FFF" : theme.colors.text.primary} size={24} />
                        </TouchableOpacity>
                      );
                   }
                   return (
                     <TouchableOpacity
                       key={num}
                       style={[styles.numButton, { borderColor: isDark ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.1)' }]}
                       onPress={() => {
                         if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                         if (pinInput.length < 6) {
                            setPinInput(pinInput + num);
                         }
                       }}
                     >
                       <Text style={[styles.numText, { color: isDark ? "#FFF" : theme.colors.text.primary }]}>{num}</Text>
                     </TouchableOpacity>
                   );
                 })}
               </View>
            </View>
            
            {!isSettingUpPin && changePinStep !== "current" && (
              <View style={styles.forgotButtonContainer}>
                <TouchableOpacity 
                  style={styles.forgotButton}
                  onPress={handleForgotPin}
                >
                  <Text style={[styles.forgotButtonText, { color: isDark ? "#AAA" : theme.colors.text.secondary }]}>Forgot Passcode?</Text>
                </TouchableOpacity>
              </View>
            )}
         </LinearGradient>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      <LinearGradient
        colors={isDark ? ["#000000", "#1a1a1a"] : theme.gradients.background as any}
        style={styles.gradient}
      >
        <Animated.View style={[styles.safeArea, { paddingTop: insets.top, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
           
           <View style={styles.header}>
             <View style={styles.headerTop}>
               <TouchableOpacity 
                  style={styles.backButtonSmall}
                  onPress={() => router.back()}
               >
                 <ArrowLeft color={isDark ? "#FFF" : theme.colors.primary} size={24} />
               </TouchableOpacity>
               <Text style={[styles.headerTitle, { color: isDark ? "#FFF" : theme.colors.text.primary }]}>Password Manager</Text>
               <View style={{flexDirection: 'row', gap: 8}}>
                 <TouchableOpacity onPress={() => setSettingsModalVisible(true)} style={styles.addButtonHeader}>
                    <Settings color={isDark ? "#FFF" : theme.colors.text.primary} size={24} />
                 </TouchableOpacity>
                 <TouchableOpacity onPress={() => openEditModal()} style={styles.addButtonHeader}>
                    <Plus color={isDark ? "#FFF" : theme.colors.text.primary} size={24} />
                 </TouchableOpacity>
               </View>
             </View>
             
             <View style={[styles.searchContainer, { backgroundColor: isDark ? "rgba(255,255,255,0.1)" : "#F5F5F5" }]}>
                <Search color={isDark ? "rgba(255,255,255,0.5)" : "#999"} size={20} />
                <TextInput
                  style={[styles.searchInput, { color: isDark ? "#FFF" : "#000" }]}
                  placeholder="Search passwords..."
                  placeholderTextColor={isDark ? "rgba(255,255,255,0.5)" : "#999"}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                />
                {searchQuery.length > 0 && (
                  <TouchableOpacity onPress={() => setSearchQuery("")}>
                    <View style={{ backgroundColor: "#999", borderRadius: 10, padding: 2 }}>
                       <Text style={{ color: "#FFF", fontSize: 10 }}>✕</Text>
                    </View>
                  </TouchableOpacity>
                )}
             </View>

             <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoriesScroll}>
               <TouchableOpacity
                 style={[
                   styles.categoryChip,
                   !selectedCategory && { backgroundColor: theme.colors.primary }
                 ]}
                 onPress={() => setSelectedCategory(null)}
               >
                 <Text style={[styles.categoryText, !selectedCategory && { color: "#FFF", fontWeight: "bold" as const }]}>All</Text>
               </TouchableOpacity>
               {categories.map(cat => (
                 <TouchableOpacity
                   key={cat}
                   style={[
                     styles.categoryChip,
                     selectedCategory === cat && { backgroundColor: theme.colors.primary }
                   ]}
                   onPress={() => setSelectedCategory(cat === selectedCategory ? null : cat)}
                 >
                   <Text style={[styles.categoryText, selectedCategory === cat && { color: "#FFF", fontWeight: "bold" as const }]}>{cat}</Text>
                 </TouchableOpacity>
               ))}
             </ScrollView>
           </View>

           <ScrollView contentContainerStyle={styles.listContent}>
             {filteredPasswords.length === 0 ? (
               <View style={styles.emptyState}>
                 <ShieldCheck color={isDark ? "#333" : "#DDD"} size={80} />
                 <Text style={[styles.emptyText, { color: isDark ? "#666" : "#999" }]}>No passwords found</Text>
                 <TouchableOpacity style={styles.createButton} onPress={() => openEditModal()}>
                    <Text style={styles.createButtonText}>Add New Password</Text>
                 </TouchableOpacity>
               </View>
             ) : (
               filteredPasswords.map((item) => (
                 <TouchableOpacity 
                    key={item.id} 
                    style={[styles.passwordCard, { backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "#FFF" }]}
                    onPress={() => openEditModal(item)}
                 >
                    <View style={[styles.passwordIcon, { backgroundColor: `${theme.colors.primary}20` }]}>
                       {item.url ? <Globe color={theme.colors.primary} size={20} /> : <Key color={theme.colors.primary} size={20} />}
                    </View>
                    <View style={styles.passwordInfo}>
                       <Text style={[styles.passwordTitle, { color: isDark ? "#FFF" : theme.colors.text.primary }]}>{item.title}</Text>
                       <Text style={styles.passwordUsername}>{item.username}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.copyButton}
                      onPress={(e) => {
                        e.stopPropagation();
                        copyToClipboard(item.username, "Username");
                      }}
                    >
                      <Copy color={isDark ? "#999" : "#666"} size={18} />
                    </TouchableOpacity>
                 </TouchableOpacity>
               ))
             )}
             <View style={{ height: 100 }} />
           </ScrollView>
        </Animated.View>

        <Modal
          visible={settingsModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setSettingsModalVisible(false)}
        >
           <TouchableOpacity 
             style={styles.modalOverlay}
             activeOpacity={1}
             onPress={() => setSettingsModalVisible(false)}
           >
              <View style={[styles.modalContent, { backgroundColor: isDark ? "#1E1E1E" : "#FFF" }]} onStartShouldSetResponder={() => true}>
                 <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: isDark ? "#FFF" : "#000" }]}>
                      Security Settings
                    </Text>
                    <View style={styles.modalHeaderActions}>
                       <KeyboardDismissButton isDark={isDark} />
                       <TouchableOpacity onPress={() => setSettingsModalVisible(false)}>
                          <Text style={{ color: theme.colors.primary, fontSize: 16 }}>Done</Text>
                       </TouchableOpacity>
                    </View>
                 </View>

                 <View style={styles.settingsContainer}>
                    {biometricsAvailable && (
                      <View style={[styles.settingItem, { borderBottomColor: isDark ? "#333" : "#EEE" }]}>
                         <View style={styles.settingInfo}>
                            <Fingerprint color={isDark ? "#FFF" : "#000"} size={24} />
                            <Text style={[styles.settingText, { color: isDark ? "#FFF" : "#000" }]}>Biometric Unlock</Text>
                         </View>
                         <Switch
                            value={isBiometricEnabled}
                            onValueChange={(val) => {
                              setIsBiometricEnabled(val);
                              toggleBiometrics();
                            }}
                            trackColor={{ false: "#767577", true: theme.colors.primary }}
                            thumbColor={isBiometricEnabled ? "#FFF" : "#f4f3f4"}
                         />
                      </View>
                    )}

                    <TouchableOpacity 
                      style={[styles.settingItem, { borderBottomColor: isDark ? "#333" : "#EEE" }]}
                      onPress={() => {
                        setSettingsModalVisible(false);
                        setChangePinStep("current");
                        setPinInput("");
                        setIsAuthenticated(false);
                      }}
                    >
                       <View style={styles.settingInfo}>
                          <RefreshCcw color={isDark ? "#FFF" : "#000"} size={24} />
                          <Text style={[styles.settingText, { color: isDark ? "#FFF" : "#000" }]}>Change Passcode</Text>
                       </View>
                       <ChevronRight color={isDark ? "#666" : "#999"} size={20} />
                    </TouchableOpacity>
                 </View>
              </View>
           </TouchableOpacity>
        </Modal>

        <Modal
          visible={editModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setEditModalVisible(false)}
        >
           <TouchableOpacity 
             style={styles.modalOverlay}
             activeOpacity={1}
             onPress={() => setEditModalVisible(false)}
           >
              <View style={[styles.modalContent, { backgroundColor: isDark ? "#1E1E1E" : "#FFF" }]} onStartShouldSetResponder={() => true}>
                 <View style={styles.modalHeader}>
                    <Text style={[styles.modalTitle, { color: isDark ? "#FFF" : "#000" }]}>
                      {editingPassword ? "Edit Password" : "New Password"}
                    </Text>
                    <View style={styles.modalHeaderActions}>
                       <KeyboardDismissButton isDark={isDark} />
                       <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                          <Text style={{ color: theme.colors.primary, fontSize: 16 }}>Cancel</Text>
                       </TouchableOpacity>
                    </View>
                 </View>

                 <ScrollView>
                    <View style={styles.inputGroup}>
                       <Text style={[styles.label, { color: isDark ? "#BBB" : "#666" }]}>Title <Text style={{ color: '#FF4444' }}>*</Text></Text>
                       <View style={[styles.inputContainer, { borderColor: isDark ? "#333" : "#DDD", backgroundColor: isDark ? "#111" : "#F9F9F9" }]}>
                          <Globe color={isDark ? "#666" : "#999"} size={18} />
                          <TextInput
                             style={[styles.input, { color: isDark ? "#FFF" : "#000" }]}
                             placeholder="e.g. Netflix, Gmail (Required)"
                             placeholderTextColor={isDark ? "#555" : "#AAA"}
                             value={formData.title}
                             onChangeText={(text) => setFormData({...formData, title: text})}
                          />
                       </View>
                    </View>

                    <View style={styles.inputGroup}>
                       <Text style={[styles.label, { color: isDark ? "#BBB" : "#666" }]}>Password <Text style={{ color: '#FF4444' }}>*</Text></Text>
                       <View style={[styles.inputContainer, { borderColor: isDark ? "#333" : "#DDD", backgroundColor: isDark ? "#111" : "#F9F9F9" }]}>
                          <Key color={isDark ? "#666" : "#999"} size={18} />
                          <TextInput
                             style={[styles.input, { color: isDark ? "#FFF" : "#000" }]}
                             placeholder="Enter password (Required)"
                             placeholderTextColor={isDark ? "#555" : "#AAA"}
                             value={formData.password}
                             onChangeText={(text) => setFormData({...formData, password: text})}
                             secureTextEntry={!passwordVisibleInForm}
                          />
                          <TouchableOpacity onPress={() => setPasswordVisibleInForm(!passwordVisibleInForm)} style={{ marginRight: 8 }}>
                             {passwordVisibleInForm ? <EyeOff color={isDark ? "#999" : "#666"} size={18} /> : <Eye color={isDark ? "#999" : "#666"} size={18} />}
                          </TouchableOpacity>
                          {formData.password.length > 0 && (
                             <TouchableOpacity onPress={() => copyToClipboard(formData.password, "Password")}>
                                <Copy color={theme.colors.primary} size={18} />
                             </TouchableOpacity>
                          )}
                       </View>
                    </View>

                    <View style={styles.inputGroup}>
                       <Text style={[styles.label, { color: isDark ? "#BBB" : "#666" }]}>Email (Optional)</Text>
                       <View style={[styles.inputContainer, { borderColor: isDark ? "#333" : "#DDD", backgroundColor: isDark ? "#111" : "#F9F9F9" }]}>
                          <User color={isDark ? "#666" : "#999"} size={18} />
                          <TextInput
                             style={[styles.input, { color: isDark ? "#FFF" : "#000" }]}
                             placeholder="username@example.com (Optional)"
                             placeholderTextColor={isDark ? "#555" : "#AAA"}
                             value={formData.username}
                             autoCapitalize="none"
                             keyboardType="email-address"
                             onChangeText={(text) => setFormData({...formData, username: text})}
                          />
                          {formData.username.length > 0 && (
                             <TouchableOpacity onPress={() => copyToClipboard(formData.username, "Email")}>
                                <Copy color={theme.colors.primary} size={18} />
                             </TouchableOpacity>
                          )}
                       </View>
                    </View>

                    <View style={styles.inputGroup}>
                       <Text style={[styles.label, { color: isDark ? "#BBB" : "#666" }]}>Website (Optional)</Text>
                       <View style={[styles.inputContainer, { borderColor: isDark ? "#333" : "#DDD", backgroundColor: isDark ? "#111" : "#F9F9F9" }]}>
                          <Globe color={isDark ? "#666" : "#999"} size={18} />
                          <TextInput
                             style={[styles.input, { color: isDark ? "#FFF" : "#000" }]}
                             placeholder="https://example.com (Optional)"
                             placeholderTextColor={isDark ? "#555" : "#AAA"}
                             value={formData.url}
                             autoCapitalize="none"
                             keyboardType="url"
                             onChangeText={(text) => setFormData({...formData, url: text})}
                          />
                       </View>
                    </View>

                    <View style={styles.inputGroup}>
                       <Text style={[styles.label, { color: isDark ? "#BBB" : "#666" }]}>Category (Optional)</Text>
                       <View style={[styles.inputContainer, { borderColor: isDark ? "#333" : "#DDD", backgroundColor: isDark ? "#111" : "#F9F9F9" }]}>
                          <MoreVertical color={isDark ? "#666" : "#999"} size={18} />
                          <TextInput
                             style={[styles.input, { color: isDark ? "#FFF" : "#000" }]}
                             placeholder="e.g. Social, Work (Optional)"
                             placeholderTextColor={isDark ? "#555" : "#AAA"}
                             value={formData.category}
                             onChangeText={(text) => setFormData({...formData, category: text})}
                          />
                       </View>
                    </View>

                    <View style={styles.modalActions}>
                       {editingPassword && (
                          <TouchableOpacity 
                            style={[styles.actionButton, styles.deleteButton]} 
                            onPress={() => {
                               setEditModalVisible(false);
                               deletePassword(editingPassword.id);
                            }}
                          >
                             <Trash2 color="#FF4444" size={20} />
                             <Text style={{ color: "#FF4444", fontWeight: "600" as const }}>Delete</Text>
                          </TouchableOpacity>
                       )}
                       <TouchableOpacity 
                         style={[styles.actionButton, styles.saveButton, { backgroundColor: theme.colors.primary }]}
                         onPress={savePassword}
                       >
                          <Save color="#FFF" size={20} />
                          <Text style={{ color: "#FFF", fontWeight: "600" as const }}>Save</Text>
                       </TouchableOpacity>
                    </View>
                 </ScrollView>
              </View>
           </TouchableOpacity>
        </Modal>

      </LinearGradient>
    </View>
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
  backButton: {
    position: 'absolute' as const,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  lockContent: {
    flex: 1,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    paddingHorizontal: 40,
    marginTop: -40, // Shift content up slightly to make room for forgot button and balance layout
  },
  lockIconContainer: {
    width: 70,
    height: 70,
    borderRadius: 35,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginBottom: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  lockTitle: {
    fontSize: 22,
    fontWeight: '600' as const,
    marginBottom: 8,
  },
  lockSubtitle: {
    fontSize: 15,
    marginBottom: 40,
    textAlign: 'center' as const,
  },
  pinIndicatorContainer: {
    flexDirection: 'row' as const,
    gap: 16,
    marginBottom: 40,
  },
  pinDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    backgroundColor: 'transparent',
  },
  numpad: {
    flexDirection: 'row' as const,
    flexWrap: 'wrap' as const,
    justifyContent: 'center' as const,
    gap: 24, // Increased gap for cleaner look
    width: 280,
  },
  numButton: {
    width: 60, // Smaller button
    height: 60,
    borderRadius: 30,
    backgroundColor: 'transparent', // Transparent background for sophistication
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
  },
  numText: {
    fontSize: 24, // Smaller font
    fontWeight: '400' as const, // Thinner font
  },
  forgotButtonContainer: {
    position: 'absolute' as const,
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  forgotButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  forgotButtonText: {
    fontSize: 14,
    fontWeight: '500' as const,
  },
  headerTop: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    marginBottom: 20,
  },
  backButtonSmall: {
    padding: 8,
    borderRadius: 12,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold' as const,
  },
  addButtonHeader: {
    padding: 8,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
  },
  searchContainer: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingHorizontal: 12,
    borderRadius: 12,
    height: 44,
    marginBottom: 16,
    gap: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  categoriesScroll: {
    marginBottom: 10,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(128,128,128,0.2)',
    marginRight: 8,
  },
  categoryText: {
    color: '#AAA',
    fontWeight: '500' as const,
  },
  listContent: {
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  passwordCard: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    gap: 16,
  },
  passwordIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  passwordInfo: {
    flex: 1,
  },
  passwordTitle: {
    fontSize: 16,
    fontWeight: '700' as const,
    marginBottom: 4,
  },
  passwordUsername: {
    fontSize: 14,
    color: '#999',
  },
  copyButton: {
    padding: 8,
  },
  emptyState: {
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    marginTop: 100,
  },
  emptyText: {
    fontSize: 18,
    marginTop: 16,
    marginBottom: 20,
  },
  createButton: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: '#333',
    borderRadius: 12,
  },
  createButtonText: {
    color: '#FFF',
    fontWeight: '600' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end" as const,
  },
  modalContent: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
    maxHeight: "90%",
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 24,
  },
  modalHeaderActions: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold" as const,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    height: "100%",
  },
  modalActions: {
    flexDirection: "row" as const,
    gap: 12,
    marginTop: 10,
  },
  actionButton: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    height: 50,
    borderRadius: 12,
    gap: 8,
  },
  saveButton: {
    elevation: 2,
  },
  deleteButton: {
    backgroundColor: "rgba(255, 68, 68, 0.1)",
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  settingsContainer: {
    gap: 0,
  },
  settingItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'space-between' as const,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  settingInfo: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 12,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500' as const,
  },
});
