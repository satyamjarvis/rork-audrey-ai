import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
  User,
  Mail,
  Phone,
  Building2,
  MapPin,
  Check,
  X,
  Tag,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { usePhonebook, type Contact, type ContactList } from "@/contexts/PhonebookContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useFontSize } from "@/contexts/FontSizeContext";

export default function SharedContactScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const { getFontSize } = useFontSize();
  const isNightMode = theme.id === 'night-mode' || theme.id === 'night';
  const { addContact, lists } = usePhonebook();

  const [contact, setContact] = useState<Omit<Contact, "id" | "createdAt"> | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedLists, setSelectedLists] = useState<string[]>([]);

  useEffect(() => {
    const loadContactData = () => {
      try {
        if (params.data) {
          const contactData = JSON.parse(decodeURIComponent(params.data as string));
          setContact({
            firstName: contactData.firstName || "",
            lastName: contactData.lastName || "",
            company: contactData.company,
            title: contactData.title,
            email: contactData.email,
            phone: contactData.phone,
            mobile: contactData.mobile,
            address: contactData.address,
            website: contactData.website,
            notes: contactData.notes,
            listIds: [],
            isFavorite: false,
          });
          console.log("Loaded shared contact:", contactData);
        }
      } catch (error) {
        console.error("Error loading contact data:", error);
        Alert.alert("Error", "Failed to load contact data");
        router.back();
      } finally {
        setLoading(false);
      }
    };

    loadContactData();
  }, [params.data, router]);

  const handleSaveContact = useCallback(async () => {
    if (!contact) return;

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    setSaving(true);
    try {
      const savedContact = await addContact({
        ...contact,
        listIds: selectedLists,
      });
      console.log("Contact saved:", savedContact);

      Alert.alert(
        "Success",
        `${contact.firstName} ${contact.lastName} has been added to your contacts`,
        [
          {
            text: "OK",
            onPress: () => router.push("/(tabs)/phonebook"),
          },
        ]
      );
    } catch (error) {
      console.error("Error saving contact:", error);
      Alert.alert("Error", "Failed to save contact. Please try again.");
    } finally {
      setSaving(false);
    }
  }, [contact, selectedLists, addContact, router]);

  const handleCancel = useCallback(() => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    router.back();
  }, [router]);

  const toggleList = useCallback((listId: string) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setSelectedLists((prev) =>
      prev.includes(listId) ? prev.filter((id) => id !== listId) : [...prev, listId]
    );
  }, []);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator
          size="large"
          color={isNightMode ? "#FFD700" : theme.colors.primary}
        />
        <Text
          style={[
            styles.loadingText,
            { color: isNightMode ? "#888888" : theme.colors.text.secondary },
          ]}
        >
          Loading contact...
        </Text>
      </View>
    );
  }

  if (!contact) {
    return null;
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={isNightMode ? ["#0a0a0f", "#1a0a1f", "#2a0a2f", "#1a0a1f", "#0a0a0f"] : (theme.gradients.background as any)}
        style={styles.gradient}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.headerContent}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : `${theme.colors.primary}15` },
              ]}
            >
              <User color={isNightMode ? "#FFD700" : theme.colors.primary} size={32} strokeWidth={2.5} />
            </View>
            <View style={styles.titleContent}>
              <Text
                style={[
                  styles.title,
                  { color: isNightMode ? "#FFD700" : theme.colors.text.primary, fontSize: getFontSize(28) },
                ]}
              >
                Save Contact
              </Text>
              <Text
                style={[
                  styles.subtitle,
                  { color: isNightMode ? "#FF1493" : theme.colors.text.light, fontSize: getFontSize(14) },
                ]}
              >
                Review and add to phonebook
              </Text>
            </View>
          </View>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          <View
            style={[
              styles.previewCard,
              {
                backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground,
                borderWidth: 1,
                borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "transparent",
              },
            ]}
          >
            <View style={styles.contactHeader}>
              <View
                style={[
                  styles.avatar,
                  { backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : `${theme.colors.primary}20` },
                ]}
              >
                <Text
                  style={[
                    styles.avatarText,
                    { color: isNightMode ? "#FFD700" : theme.colors.primary },
                  ]}
                >
                  {contact.firstName[0]?.toUpperCase() || ""}
                  {contact.lastName[0]?.toUpperCase() || ""}
                </Text>
              </View>
              <View style={styles.contactMainInfo}>
                <Text
                  style={[
                    styles.contactName,
                    { color: isNightMode ? "#FFFFFF" : theme.colors.text.primary, fontSize: getFontSize(22) },
                  ]}
                >
                  {contact.firstName} {contact.lastName}
                </Text>
                {contact.company && (
                  <View style={styles.companyRow}>
                    <Building2
                      color={isNightMode ? "#888888" : theme.colors.text.light}
                      size={16}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.companyText,
                        {
                          color: isNightMode ? "#888888" : theme.colors.text.secondary,
                          fontSize: getFontSize(15),
                        },
                      ]}
                    >
                      {contact.title && `${contact.title} at `}
                      {contact.company}
                    </Text>
                  </View>
                )}
              </View>
            </View>

            {(contact.email || contact.phone || contact.mobile || contact.address?.city) && (
              <View style={styles.contactDetails}>
                {contact.email && (
                  <View style={styles.detailRow}>
                    <Mail
                      color={isNightMode ? "#888888" : theme.colors.text.light}
                      size={18}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.detailText,
                        {
                          color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                          fontSize: getFontSize(15),
                        },
                      ]}
                    >
                      {contact.email}
                    </Text>
                  </View>
                )}
                {contact.phone && (
                  <View style={styles.detailRow}>
                    <Phone
                      color={isNightMode ? "#888888" : theme.colors.text.light}
                      size={18}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.detailText,
                        {
                          color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                          fontSize: getFontSize(15),
                        },
                      ]}
                    >
                      {contact.phone}
                    </Text>
                  </View>
                )}
                {contact.mobile && contact.mobile !== contact.phone && (
                  <View style={styles.detailRow}>
                    <Phone
                      color={isNightMode ? "#888888" : theme.colors.text.light}
                      size={18}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.detailText,
                        {
                          color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                          fontSize: getFontSize(15),
                        },
                      ]}
                    >
                      {contact.mobile} • Mobile
                    </Text>
                  </View>
                )}
                {contact.address?.city && (
                  <View style={styles.detailRow}>
                    <MapPin
                      color={isNightMode ? "#888888" : theme.colors.text.light}
                      size={18}
                      strokeWidth={2}
                    />
                    <Text
                      style={[
                        styles.detailText,
                        {
                          color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                          fontSize: getFontSize(15),
                        },
                      ]}
                    >
                      {contact.address.city}
                      {contact.address.state && `, ${contact.address.state}`}
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>

          {lists.length > 0 && (
            <View
              style={[
                styles.categorySection,
                {
                  backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground,
                  borderWidth: 1,
                  borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "transparent",
                },
              ]}
            >
              <View style={styles.categorySectionHeader}>
                <Tag
                  color={isNightMode ? "#FFD700" : theme.colors.primary}
                  size={20}
                  strokeWidth={2.5}
                />
                <Text
                  style={[
                    styles.categoryTitle,
                    { color: isNightMode ? "#FFD700" : theme.colors.text.primary, fontSize: getFontSize(18) },
                  ]}
                >
                  Add to Category
                </Text>
              </View>
              <Text
                style={[
                  styles.categorySubtitle,
                  { color: isNightMode ? "#888888" : theme.colors.text.secondary, fontSize: getFontSize(14) },
                ]}
              >
                Optional - Select one or more categories
              </Text>
              <View style={styles.categoryList}>
                {lists.map((list: ContactList) => (
                  <TouchableOpacity
                    key={list.id}
                    style={[
                      styles.categoryItem,
                      {
                        backgroundColor: selectedLists.includes(list.id)
                          ? isNightMode
                            ? "rgba(255, 215, 0, 0.2)"
                            : `${list.color}20`
                          : isNightMode
                          ? "rgba(26, 10, 31, 0.6)"
                          : theme.colors.background,
                        borderColor: selectedLists.includes(list.id)
                          ? isNightMode
                            ? "#FFD700"
                            : list.color
                          : "transparent",
                        borderWidth: selectedLists.includes(list.id) ? 2 : 0,
                      },
                    ]}
                    onPress={() => toggleList(list.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.categoryDot, { backgroundColor: list.color }]} />
                    <Text
                      style={[
                        styles.categoryName,
                        {
                          color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                          fontSize: getFontSize(15),
                        },
                      ]}
                    >
                      {list.name}
                    </Text>
                    {selectedLists.includes(list.id) && (
                      <Check
                        color={isNightMode ? "#FFD700" : list.color}
                        size={20}
                        strokeWidth={3}
                      />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </ScrollView>

        <View
          style={[
            styles.actionButtons,
            { paddingBottom: insets.bottom + 20, backgroundColor: isNightMode ? "rgba(10, 10, 15, 0.95)" : theme.colors.cardBackground },
          ]}
        >
          <TouchableOpacity
            style={[
              styles.cancelButton,
              { backgroundColor: isNightMode ? "rgba(255, 20, 147, 0.15)" : `${theme.colors.text.light}20` },
            ]}
            onPress={handleCancel}
            activeOpacity={0.7}
            disabled={saving}
          >
            <X color={isNightMode ? "#FF1493" : theme.colors.text.secondary} size={22} strokeWidth={2.5} />
            <Text
              style={[
                styles.cancelButtonText,
                { color: isNightMode ? "#FF1493" : theme.colors.text.secondary, fontSize: getFontSize(16) },
              ]}
            >
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.saveButton}
            onPress={handleSaveContact}
            activeOpacity={0.9}
            disabled={saving}
          >
            <LinearGradient
              colors={isNightMode ? ["#FFD700", "#FFA500"] : (theme.gradients.primary as any)}
              style={styles.saveButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              {saving ? (
                <ActivityIndicator color={isNightMode ? "#000000" : "#FFFFFF"} size="small" />
              ) : (
                <>
                  <Check color={isNightMode ? "#000000" : "#FFFFFF"} size={22} strokeWidth={2.5} />
                  <Text
                    style={[
                      styles.saveButtonText,
                      { color: isNightMode ? "#000000" : "#FFFFFF", fontSize: getFontSize(16) },
                    ]}
                  >
                    Save Contact
                  </Text>
                </>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    backgroundColor: "#0a0a0f",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  headerContent: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  titleContent: {
    flex: 1,
  },
  title: {
    fontWeight: "700" as const,
    letterSpacing: -0.5,
    marginBottom: 4,
  },
  subtitle: {
    fontWeight: "600" as const,
    letterSpacing: 0.2,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  previewCard: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  contactHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 16,
    marginBottom: 20,
  },
  avatar: {
    width: 70,
    height: 70,
    borderRadius: 20,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  avatarText: {
    fontSize: 28,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  contactMainInfo: {
    flex: 1,
  },
  contactName: {
    fontWeight: "700" as const,
    letterSpacing: 0.2,
    marginBottom: 4,
  },
  companyRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  companyText: {
    fontWeight: "600" as const,
    flex: 1,
  },
  contactDetails: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
    paddingTop: 16,
    gap: 12,
  },
  detailRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  detailText: {
    fontWeight: "600" as const,
    flex: 1,
  },
  categorySection: {
    borderRadius: 20,
    padding: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
  },
  categorySectionHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    marginBottom: 8,
  },
  categoryTitle: {
    fontWeight: "700" as const,
    letterSpacing: 0.2,
  },
  categorySubtitle: {
    fontWeight: "600" as const,
    marginBottom: 16,
  },
  categoryList: {
    gap: 10,
  },
  categoryItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 14,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  categoryName: {
    flex: 1,
    fontWeight: "600" as const,
  },
  actionButtons: {
    flexDirection: "row" as const,
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
  },
  cancelButton: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
  },
  cancelButtonText: {
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  saveButton: {
    flex: 2,
    borderRadius: 16,
    overflow: "hidden" as const,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
  },
  saveButtonGradient: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingVertical: 16,
  },
  saveButtonText: {
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
});
