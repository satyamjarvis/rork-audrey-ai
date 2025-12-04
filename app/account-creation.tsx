import { StyleSheet, Text, View, TouchableOpacity, Animated, Platform, TextInput, KeyboardAvoidingView, ScrollView, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserPlus, Sparkles, User, Mail, Lock, ScanFace, Cloud, Phone } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as LocalAuthentication from 'expo-local-authentication';

export default function AccountCreationScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { t } = useLanguage();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const [isAppleAuthAvailable, setIsAppleAuthAvailable] = useState(false);
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');

  const isNightMode = theme.id === 'night-mode';

  useEffect(() => {
    checkAppleAuthAvailability();
    checkBiometrics();
    
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const checkAppleAuthAvailability = async () => {
    if (Platform.OS === 'ios') {
      const isAvailable = await AppleAuthentication.isAvailableAsync();
      setIsAppleAuthAvailable(isAvailable);
    }
  };

  const checkBiometrics = async () => {
    if (Platform.OS === 'web') return;
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      setIsBiometricAvailable(hasHardware && isEnrolled);
    } catch (e) {
      console.log('Biometric check failed', e);
    }
  };

  const handleBiometricAuth = async () => {
    if (Platform.OS === 'web') return;
    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Verify your identity',
        fallbackLabel: 'Use Passcode',
      });
      if (result.success) {
        Alert.alert('Success', 'Face ID/Touch ID verified!');
        // Proceed with account creation or login
        handleCreateAccount();
      }
    } catch (e) {
      console.log('Biometric auth failed', e);
    }
  };

  const handleAppleSignIn = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Not Available', 'Apple Sign In is only available on iOS devices.');
      return;
    }
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });
      
      console.log('Apple credential:', credential);
      
      navigateNext();
    } catch (error: any) {
      if (error.code === 'ERR_REQUEST_CANCELED') {
        console.log('User canceled Apple Sign In');
      } else {
        console.error('Apple Sign In error:', error);
      }
    }
  };

  const handleCreateAccount = () => {
    navigateNext();
  };

  const navigateNext = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      router.replace('/subscription-selection');
    });
  };

  const InputField = ({ 
    icon: Icon, 
    placeholder, 
    value, 
    onChangeText, 
    secureTextEntry = false,
    autoCapitalize = 'none' as const
  }: any) => (
    <View style={[styles.inputContainer, { backgroundColor: isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)' }]}>
      <Icon 
        size={20} 
        color={isNightMode ? theme.colors.text.secondary : theme.colors.text.primary} 
        style={styles.inputIcon}
      />
      <TextInput
        style={[styles.input, { color: isNightMode ? theme.colors.text.primary : theme.colors.text.primary }]}
        placeholder={placeholder}
        placeholderTextColor={isNightMode ? 'rgba(255,255,255,0.5)' : 'rgba(0,0,0,0.5)'}
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );

  return (
    <LinearGradient
      colors={isNightMode ? ['#000000', '#0A0A0A', '#000000'] : (theme.gradients.background as unknown as readonly [string, string, ...string[]])}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView 
          contentContainerStyle={[
            styles.scrollContent,
            { 
              paddingTop: insets.top + 40,
              paddingBottom: Math.max(insets.bottom, 20) + 20,
            }
          ]}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View 
            style={[
              styles.content, 
              { 
                opacity: fadeAnim,
                transform: [{ translateY: slideAnim }]
              }
            ]}
          >
            <View style={styles.header}>
              <View style={styles.iconContainer}>
                <LinearGradient
                  colors={isNightMode ? ['#FFD700', '#FF00FF'] : (theme.gradients.primary as unknown as readonly [string, string, ...string[]])}
                  style={styles.iconGradient}
                >
                  <Sparkles 
                    color={isNightMode ? '#000000' : theme.colors.cardBackground} 
                    size={24} 
                    strokeWidth={2} 
                    fill={isNightMode ? '#000000' : theme.colors.cardBackground} 
                  />
                </LinearGradient>
              </View>
              <Text style={[styles.title, { 
                color: isNightMode ? theme.colors.text.secondary : theme.colors.primary,
                textShadowColor: isNightMode ? 'rgba(255, 215, 0, 0.5)' : `${theme.colors.primary}33`
              }]}>{t.welcomeToAudrey}</Text>
              <Text style={[styles.subtitle, { 
                color: isNightMode ? theme.colors.text.light : theme.colors.text.secondary 
              }]}>{t.createAccountToBegin}</Text>
            </View>

            <View style={styles.formContainer}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <InputField 
                    icon={User}
                    placeholder={t.firstName}
                    value={firstName}
                    onChangeText={setFirstName}
                    autoCapitalize="words"
                  />
                </View>
                <View style={{ width: 12 }} />
                <View style={{ flex: 1 }}>
                  <InputField 
                    icon={User}
                    placeholder={t.lastName}
                    value={lastName}
                    onChangeText={setLastName}
                    autoCapitalize="words"
                  />
                </View>
              </View>

              <InputField 
                icon={Mail}
                placeholder={t.emailAddress}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
              />

              <View>
                <InputField 
                  icon={Phone}
                  placeholder={t.phoneNumber}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  keyboardType="phone-pad"
                />
                <Text style={[styles.helperText, { 
                  color: isNightMode ? theme.colors.text.light : theme.colors.text.secondary 
                }]}>
                  *{t.phoneNeededForChat}
                </Text>
              </View>

              <InputField 
                icon={Lock}
                placeholder={t.password}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.createButton}
                onPress={handleCreateAccount}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={isNightMode ? ['#FFD700', '#FF00FF', '#FFD700'] : (theme.gradients.primary as unknown as readonly [string, string, ...string[]])}
                  style={styles.buttonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <UserPlus 
                    color={isNightMode ? '#000000' : theme.colors.cardBackground} 
                    size={16} 
                    strokeWidth={2.5} 
                  />
                  <Text style={[styles.buttonText, { 
                    color: isNightMode ? '#000000' : theme.colors.cardBackground 
                  }]}>{t.createAccount}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <View style={styles.dividerContainer}>
                <View style={[styles.divider, { backgroundColor: isNightMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]} />
                <Text style={[styles.dividerText, { color: isNightMode ? theme.colors.text.light : theme.colors.text.secondary }]}>{t.or.toUpperCase()}</Text>
                <View style={[styles.divider, { backgroundColor: isNightMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.1)' }]} />
              </View>

              {isAppleAuthAvailable && Platform.OS === 'ios' && (
                <AppleAuthentication.AppleAuthenticationButton
                  buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_UP}
                  buttonStyle={isNightMode ? AppleAuthentication.AppleAuthenticationButtonStyle.WHITE : AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
                  cornerRadius={12}
                  style={styles.appleButton}
                  onPress={handleAppleSignIn}
                />
              )}

              {Platform.OS !== 'web' && (
                <TouchableOpacity
                  style={[styles.biometricButton, { 
                    backgroundColor: isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
                    borderColor: isNightMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)'
                  }]}
                  onPress={handleAppleSignIn}
                >
                  <Cloud size={20} color={isNightMode ? '#FFF' : '#000'} />
                  <Text style={[styles.biometricText, { color: isNightMode ? '#FFF' : '#000' }]}>
                    {t.signUpWithICloud}
                  </Text>
                </TouchableOpacity>
              )}

              {isBiometricAvailable && (
                <TouchableOpacity
                  style={[styles.biometricButton, { 
                    backgroundColor: isNightMode ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.8)',
                    borderColor: isNightMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.05)'
                  }]}
                  onPress={handleBiometricAuth}
                >
                  <ScanFace size={20} color={isNightMode ? '#FFF' : '#000'} />
                  <Text style={[styles.biometricText, { color: isNightMode ? '#FFF' : '#000' }]}>
                    {t.signUpWithFaceID}
                  </Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.footer}>
              <Text style={[styles.footerText, { 
                color: isNightMode ? theme.colors.text.light : theme.colors.text.secondary 
              }]}>
                {t.termsAndPrivacy}
              </Text>
            </View>
          </Animated.View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 32,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    gap: 32,
  },
  header: {
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  iconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.2)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#D4AF37',
    marginBottom: 8,
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(212, 175, 55, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      web: 'system-ui, -apple-system, sans-serif',
    }),
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#4ADE80',
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 20,
  },
  formContainer: {
    gap: 16,
  },
  row: {
    flexDirection: 'row',
  },
  helperText: {
    fontSize: 10,
    marginTop: 4,
    marginLeft: 4,
    fontWeight: '400',
    fontStyle: 'italic',
    opacity: 0.8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    height: '100%',
  },
  buttonContainer: {
    gap: 16,
  },
  appleButton: {
    width: '100%',
    height: 44,
  },
  createButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  buttonGradient: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  buttonText: {
    color: '#0A0A0A',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      web: 'system-ui, -apple-system, sans-serif',
    }),
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  divider: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    fontSize: 12,
    fontWeight: '500',
  },
  biometricButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    gap: 8,
  },
  biometricText: {
    fontSize: 15,
    fontWeight: '500',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 10,
    fontWeight: '400',
    color: '#6B7280',
    textAlign: 'center',
    letterSpacing: 0.2,
    lineHeight: 14,
  },
});
