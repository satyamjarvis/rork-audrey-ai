import { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Platform,
  TextInput,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  UserCircle2,
  User,
  Mail,
  Phone,
  Settings,
  ArrowLeft,
  Save,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";

import { useTheme } from "@/contexts/ThemeContext";
import { useUserProfile } from "@/contexts/UserProfileContext";
import { useTranslation } from "@/contexts/LanguageContext";

export default function AccountSettingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { profile, updateUserProfile } = useUserProfile();
  const { t } = useTranslation();
  
  const [name, setName] = useState<string>(profile.name || "Sarah Wilson");
  const [email, setEmail] = useState<string>(profile.email || "sarah.wilson@example.com");
  const [phoneNumber, setPhoneNumber] = useState<string>(profile.phoneNumber || "");
  const [isEditing, setIsEditing] = useState<boolean>(false);

  const handleSave = async () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    await updateUserProfile({ name, email, phoneNumber });
    setIsEditing(false);
    Alert.alert(t('common.success'), t('accountSettings.updateSuccess'));
  };

  const handleCancel = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setName(profile.name || "Sarah Wilson");
    setEmail(profile.email || "sarah.wilson@example.com");
    setPhoneNumber(profile.phoneNumber || "");
    setIsEditing(false);
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={theme.gradients.background as any} style={styles.gradient}>
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => {
              if (Platform.OS !== "web") {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }
              router.back();
            }}
            activeOpacity={0.7}
          >
            <ArrowLeft color={theme.colors.text.primary} size={24} strokeWidth={2} />
          </TouchableOpacity>
          <View style={styles.headerContent}>
            <Settings color={theme.colors.primary} size={32} strokeWidth={2.5} />
            <Text style={[styles.headerTitle, { color: theme.colors.text.primary }]}>
              {t('accountSettings.title')}
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: theme.colors.text.secondary }]}>
            {t('accountSettings.manageAccountInfo')}
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.profileCard, { backgroundColor: theme.colors.cardBackground }]}>
            <View style={[styles.avatarContainer, { backgroundColor: `${theme.colors.primary}15` }]}>
              <UserCircle2 color={theme.colors.primary} size={64} strokeWidth={1.5} />
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.profileName, { color: theme.colors.text.primary }]}>
                {name || "User"}
              </Text>
              <Text style={[styles.profileEmail, { color: theme.colors.text.secondary }]}>
                {email || "user@example.com"}
              </Text>
              {phoneNumber ? (
                <Text style={[styles.profileEmail, { color: theme.colors.text.secondary, marginTop: 4 }]}>
                  {phoneNumber}
                </Text>
              ) : null}
            </View>
          </View>

          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>
              {t('accountSettings.personalInformation')}
            </Text>
          </View>

          <View style={[styles.formCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>{t('accountSettings.fullName')}</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <User color={theme.colors.text.secondary} size={20} strokeWidth={2} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text.primary }]}
                  placeholder={t('accountSettings.enterYourName')}
                  placeholderTextColor={theme.colors.text.light}
                  value={name}
                  onChangeText={(text) => {
                    setName(text);
                    setIsEditing(true);
                  }}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>{t('accountSettings.email')}</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <Mail color={theme.colors.text.secondary} size={20} strokeWidth={2} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text.primary }]}
                  placeholder={t('accountSettings.enterYourEmail')}
                  placeholderTextColor={theme.colors.text.light}
                  value={email}
                  onChangeText={(text) => {
                    setEmail(text);
                    setIsEditing(true);
                  }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: theme.colors.text.primary }]}>{t('accountSettings.phoneNumber')}</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.colors.background, borderColor: theme.colors.border }]}>
                <Phone color={theme.colors.text.secondary} size={20} strokeWidth={2} />
                <TextInput
                  style={[styles.input, { color: theme.colors.text.primary }]}
                  placeholder={t('accountSettings.enterPhoneNumber')}
                  placeholderTextColor={theme.colors.text.light}
                  value={phoneNumber}
                  onChangeText={(text) => {
                    setPhoneNumber(text);
                    setIsEditing(true);
                  }}
                  keyboardType="phone-pad"
                />
              </View>
              <Text style={[styles.helperText, { color: theme.colors.text.secondary }]}>
                {t('accountSettings.phoneHelperText')}
              </Text>
            </View>
          </View>

          {isEditing && (
            <View style={styles.actionButtons}>
              <TouchableOpacity
                style={[styles.cancelButton, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Text style={[styles.cancelButtonText, { color: theme.colors.text.primary }]}>
                  {t('common.cancel')}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <LinearGradient
                  colors={theme.gradients.primary as any}
                  style={styles.saveGradient}
                >
                  <Save color="#FFFFFF" size={20} strokeWidth={2} />
                  <Text style={styles.saveText}>{t('accountSettings.saveChanges')}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.infoCard, { backgroundColor: theme.colors.cardBackground, borderColor: theme.colors.border }]}>
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: `${theme.colors.primary}15` }]}>
                <UserCircle2 color={theme.colors.primary} size={20} strokeWidth={2} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
                  {t('accountSettings.accountStatus')}
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                  {t('accountSettings.active')}
                </Text>
              </View>
            </View>
            <View style={[styles.infoDivider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.infoRow}>
              <View style={[styles.infoIcon, { backgroundColor: `${theme.colors.secondary}15` }]}>
                <Settings color={theme.colors.secondary} size={20} strokeWidth={2} />
              </View>
              <View style={styles.infoContent}>
                <Text style={[styles.infoLabel, { color: theme.colors.text.secondary }]}>
                  {t('accountSettings.memberSince')}
                </Text>
                <Text style={[styles.infoValue, { color: theme.colors.text.primary }]}>
                  January 2025
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
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
  header: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 12,
  },
  headerContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  headerSubtitle: {
    fontSize: 15,
    fontWeight: "500" as const,
    lineHeight: 22,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  profileCard: {
    borderRadius: 24,
    padding: 24,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
    marginBottom: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: "700" as const,
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  profileEmail: {
    fontSize: 14,
    fontWeight: "500" as const,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    letterSpacing: 0.2,
  },
  formCard: {
    borderRadius: 24,
    padding: 24,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  helperText: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 4,
    fontStyle: 'italic',
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600" as const,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  inputContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderWidth: 1,
  },
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: "500" as const,
  },
  actionButtons: {
    flexDirection: "row" as const,
    gap: 12,
    marginBottom: 24,
  },
  cancelButton: {
    flex: 1,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  saveButton: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  saveGradient: {
    paddingVertical: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    flexDirection: "row" as const,
    gap: 8,
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  infoCard: {
    borderRadius: 20,
    padding: 4,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    borderWidth: 1,
  },
  infoRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  infoIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  infoContent: {
    flex: 1,
    gap: 4,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: "500" as const,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: "700" as const,
  },
  infoDivider: {
    height: 1,
    marginHorizontal: 16,
  },
});
