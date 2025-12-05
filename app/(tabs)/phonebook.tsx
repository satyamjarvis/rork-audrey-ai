import { useState, useCallback, useMemo } from "react";
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
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import {
  Plus,
  Search,
  Star,
  Mail,
  Phone,
  MapPin,
  Building2,
  X,
  Edit3,
  Trash2,
  UserPlus,
  Users,
  Tag,
} from "lucide-react-native";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Stack } from "expo-router";
import { Image } from 'expo-image';

import { usePhonebook, type Contact } from "@/contexts/PhonebookContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useFontSize } from "@/contexts/FontSizeContext";
import { useLanguage } from "@/contexts/LanguageContext";
import KeyboardDismissButton from "@/components/KeyboardDismissButton";
import ShareButton from "@/components/ShareButton";
import { useCalendar } from "@/contexts/CalendarContext";
import { getCalendarBackground } from '@/constants/calendarBackgrounds';

export default function PhonebookScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const { getFontSize } = useFontSize();
  const { selectedBackground } = useCalendar();
  const { translations } = useLanguage();
  const isNightMode = theme.id === 'night-mode' || theme.id === 'night';
  const {
    contacts,
    lists,
    addContact,
    updateContact,
    deleteContact,
    toggleFavorite,
    createList,
    deleteList,
  } = usePhonebook();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedView, setSelectedView] = useState<"all" | "favorites" | string>("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [showListModal, setShowListModal] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [company, setCompany] = useState("");
  const [title, setTitle] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [mobile, setMobile] = useState("");
  const [street, setStreet] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [website, setWebsite] = useState("");
  const [notes, setNotes] = useState("");
  const [newListName, setNewListName] = useState("");

  const closeModal = useCallback(() => {
    setShowAddModal(false);
    setEditingContact(null);
    setFirstName("");
    setLastName("");
    setCompany("");
    setTitle("");
    setEmail("");
    setPhone("");
    setMobile("");
    setStreet("");
    setCity("");
    setState("");
    setZipCode("");
    setWebsite("");
    setNotes("");
  }, []);

  const filteredContacts = useMemo(() => {
    let filtered = contacts;

    if (selectedView === "favorites") {
      filtered = contacts.filter((c) => c.isFavorite);
    } else if (selectedView !== "all") {
      filtered = contacts.filter((c) => c.listIds.includes(selectedView));
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (c) =>
          c.firstName.toLowerCase().includes(query) ||
          c.lastName.toLowerCase().includes(query) ||
          c.email?.toLowerCase().includes(query) ||
          c.company?.toLowerCase().includes(query) ||
          c.phone?.toLowerCase().includes(query)
      );
    }

    return filtered.sort((a, b) => {
      const nameA = `${a.firstName} ${a.lastName}`.toLowerCase();
      const nameB = `${b.firstName} ${b.lastName}`.toLowerCase();
      return nameA.localeCompare(nameB);
    });
  }, [contacts, searchQuery, selectedView]);

  const activeBackground = useMemo(() => {
    if (selectedBackground && selectedBackground !== 'default') {
      return getCalendarBackground(selectedBackground);
    }
    return null;
  }, [selectedBackground]);

  const contactStats = useMemo(() => {
    return {
      total: contacts.length,
      favorites: contacts.filter((c) => c.isFavorite).length,
      withCompany: contacts.filter((c) => c.company).length,
    };
  }, [contacts]);

  const handleAddContact = useCallback(async () => {
    if (!firstName.trim() || !lastName.trim()) {
      Alert.alert(translations.contacts.requiredFields, translations.contacts.pleaseEnterFirstLastName);
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const contactData = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      company: company.trim() || undefined,
      title: title.trim() || undefined,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
      mobile: mobile.trim() || undefined,
      address: {
        street: street.trim() || undefined,
        city: city.trim() || undefined,
        state: state.trim() || undefined,
        zipCode: zipCode.trim() || undefined,
      },
      website: website.trim() || undefined,
      notes: notes.trim() || undefined,
      listIds: selectedView !== "all" && selectedView !== "favorites" ? [selectedView] : [],
      isFavorite: false,
    };

    if (editingContact) {
      await updateContact(editingContact.id, contactData);
    } else {
      await addContact(contactData);
    }

    closeModal();
  }, [
    firstName,
    lastName,
    company,
    title,
    email,
    phone,
    mobile,
    street,
    city,
    state,
    zipCode,
    website,
    notes,
    selectedView,
    editingContact,
    addContact,
    updateContact,
    closeModal,
  ]);

  const handleEditContact = useCallback((contact: Contact) => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    setEditingContact(contact);
    setFirstName(contact.firstName);
    setLastName(contact.lastName);
    setCompany(contact.company || "");
    setTitle(contact.title || "");
    setEmail(contact.email || "");
    setPhone(contact.phone || "");
    setMobile(contact.mobile || "");
    setStreet(contact.address?.street || "");
    setCity(contact.address?.city || "");
    setState(contact.address?.state || "");
    setZipCode(contact.address?.zipCode || "");
    setWebsite(contact.website || "");
    setNotes(contact.notes || "");
    setShowAddModal(true);
  }, []);

  const handleDeleteContact = useCallback(
    (contactId: string) => {
      Alert.alert(translations.contacts.deleteContact, translations.contacts.confirmDeleteContact, [
        { text: translations.common.cancel, style: "cancel" },
        {
          text: translations.common.delete,
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await deleteContact(contactId);
          },
        },
      ]);
    },
    [deleteContact]
  );

  const handleToggleFavorite = useCallback(
    async (contactId: string) => {
      if (Platform.OS !== "web") {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      await toggleFavorite(contactId);
    },
    [toggleFavorite]
  );

  const handleCreateList = useCallback(async () => {
    if (!newListName.trim()) {
      Alert.alert(translations.contacts.required, translations.contacts.pleaseEnterListName);
      return;
    }

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    await createList(newListName.trim());
    setNewListName("");
    setShowListModal(false);
  }, [newListName, createList]);

  const handleDeleteList = useCallback(
    (listId: string) => {
      Alert.alert(translations.contacts.deleteList, translations.contacts.removeListConfirmation, [
        { text: translations.common.cancel, style: "cancel" },
        {
          text: translations.common.delete,
          style: "destructive",
          onPress: async () => {
            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            }
            await deleteList(listId);
            if (selectedView === listId) {
              setSelectedView("all");
            }
          },
        },
      ]);
    },
    [deleteList, selectedView]
  );

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName[0]?.toUpperCase() || ""}${lastName[0]?.toUpperCase() || ""}`;
  };

  const renderContent = () => (
    <LinearGradient 
        colors={isNightMode ? ["#0a0a0f", "#1a0a1f", "#2a0a2f", "#1a0a1f", "#0a0a0f"] : (theme.gradients.background as any)} 
        style={styles.gradient}
      >
        <View style={[styles.header, { paddingTop: insets.top + 20 }]}>
          <View style={styles.titleSection}>
            <View style={styles.titleRow}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : `${theme.colors.primary}15` },
                ]}
              >
                <Users color={isNightMode ? "#FFD700" : theme.colors.primary} size={28} strokeWidth={2.5} />
              </View>
              <View style={styles.titleContent}>
                <Text style={[styles.title, { color: isNightMode ? "#FFD700" : theme.colors.text.primary }]}>
                  {translations.contacts.contacts}
                </Text>
                <Text
                  style={[
                    styles.subtitle,
                    { color: isNightMode ? "#FF1493" : theme.colors.text.light, fontSize: getFontSize(14) },
                  ]}
                >
                  {contactStats.total} {contactStats.total !== 1 ? translations.contacts.contactsCount : translations.contacts.contactCount}
                </Text>
              </View>
            </View>

            <TouchableOpacity
              style={[
                styles.manageButton,
                { backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : `${theme.colors.primary}10` },
              ]}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setShowListModal(true);
              }}
              activeOpacity={0.7}
            >
              <Tag color={isNightMode ? "#FFD700" : theme.colors.primary} size={20} strokeWidth={2.5} />
            </TouchableOpacity>
          </View>

          <View
            style={[
              styles.searchBar,
              { backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground },
            ]}
          >
            <Search color={isNightMode ? "#888888" : theme.colors.text.light} size={20} strokeWidth={2.5} />
            <TextInput
              style={[
                styles.searchInput,
                { color: isNightMode ? "#FFFFFF" : theme.colors.text.primary, fontSize: getFontSize(16) },
              ]}
              placeholder={translations.contacts.searchPlaceholder}
              placeholderTextColor={isNightMode ? "#888888" : theme.colors.text.light}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            {searchQuery.length > 0 && (
              <TouchableOpacity onPress={() => setSearchQuery("")}>
                <X color={isNightMode ? "#888888" : theme.colors.text.light} size={20} strokeWidth={2.5} />
              </TouchableOpacity>
            )}
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterContainer}
          >
            <TouchableOpacity
              style={[
                styles.filterTab,
                { backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.6)" : "rgba(255,255,255,0.7)" },
                selectedView === "all" && [
                  styles.filterTabActive,
                  { backgroundColor: isNightMode ? "#FFD700" : theme.colors.primary },
                ],
              ]}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setSelectedView("all");
              }}
              activeOpacity={0.7}
            >
              <Users
                color={selectedView === "all" ? (isNightMode ? "#000000" : "#FFFFFF") : (isNightMode ? "#888888" : theme.colors.text.secondary)}
                size={18}
                strokeWidth={2.5}
              />
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      selectedView === "all" ? (isNightMode ? "#000000" : "#FFFFFF") : (isNightMode ? "#888888" : theme.colors.text.secondary),
                    fontSize: getFontSize(15),
                  },
                ]}
              >
                {translations.contacts.all} ({contactStats.total})
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.filterTab,
                { backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.6)" : "rgba(255,255,255,0.7)" },
                selectedView === "favorites" && [
                  styles.filterTabActive,
                  { backgroundColor: isNightMode ? "#FF1493" : "#FFB84D" },
                ],
              ]}
              onPress={() => {
                if (Platform.OS !== "web") {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                }
                setSelectedView("favorites");
              }}
              activeOpacity={0.7}
            >
              <Star
                color={selectedView === "favorites" ? (isNightMode ? "#000000" : "#FFFFFF") : (isNightMode ? "#888888" : theme.colors.text.secondary)}
                size={18}
                strokeWidth={2.5}
                fill={selectedView === "favorites" ? (isNightMode ? "#000000" : "#FFFFFF") : "none"}
              />
              <Text
                style={[
                  styles.filterText,
                  {
                    color:
                      selectedView === "favorites" ? (isNightMode ? "#000000" : "#FFFFFF") : (isNightMode ? "#888888" : theme.colors.text.secondary),
                    fontSize: getFontSize(15),
                  },
                ]}
              >
                {translations.contacts.favorites} ({contactStats.favorites})
              </Text>
            </TouchableOpacity>

            {lists.map((list) => (
              <TouchableOpacity
                key={list.id}
                style={[
                  styles.filterTab,
                  { backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.6)" : "rgba(255,255,255,0.7)" },
                  selectedView === list.id && [
                    styles.filterTabActive,
                    { backgroundColor: list.color },
                  ],
                ]}
                onPress={() => {
                  if (Platform.OS !== "web") {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }
                  setSelectedView(list.id);
                }}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.listDot,
                    {
                      backgroundColor:
                        selectedView === list.id ? (isNightMode ? "#000000" : "#FFFFFF") : list.color,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.filterText,
                    {
                      color:
                        selectedView === list.id ? (isNightMode ? "#000000" : "#FFFFFF") : (isNightMode ? "#888888" : theme.colors.text.secondary),
                      fontSize: getFontSize(15),
                    },
                  ]}
                >
                  {list.name}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {filteredContacts.length === 0 ? (
            <View style={styles.emptyState}>
              <View
                style={[
                  styles.emptyIcon,
                  { backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : `${theme.colors.primary}10` },
                ]}
              >
                <Users color={isNightMode ? "#888888" : theme.colors.text.light} size={48} strokeWidth={1.5} />
              </View>
              <Text
                style={[
                  styles.emptyTitle,
                  { color: isNightMode ? "#FFD700" : theme.colors.text.primary, fontSize: getFontSize(20) },
                ]}
              >
                {searchQuery ? translations.contacts.noMatchesFound : translations.contacts.noContactsYet}
              </Text>
              <Text
                style={[
                  styles.emptySubtitle,
                  { color: isNightMode ? "#888888" : theme.colors.text.light, fontSize: getFontSize(15) },
                ]}
              >
                {searchQuery
                  ? translations.contacts.tryAdjustingSearch
                  : translations.contacts.tapPlusToAdd}
              </Text>
            </View>
          ) : (
            <View style={styles.contactList}>
              {filteredContacts.map((contact) => (
                <View
                    key={contact.id}
                    style={[
                      styles.contactCard,
                      { 
                        backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.8)" : theme.colors.cardBackground,
                        borderWidth: 1,
                        borderColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : "transparent",
                      },
                    ]}
                  >
                    <View style={styles.contactMain}>
                      <View style={styles.contactLeft}>
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
                            {getInitials(contact.firstName, contact.lastName)}
                          </Text>
                        </View>
                        <View style={styles.contactInfo}>
                          <View style={styles.nameRow}>
                            <Text
                              style={[
                                styles.contactName,
                                { color: isNightMode ? "#FFFFFF" : theme.colors.text.primary, fontSize: getFontSize(17) },
                              ]}
                              numberOfLines={1}
                            >
                              {contact.firstName} {contact.lastName}
                            </Text>
                            {contact.isFavorite && (
                              <Star color={isNightMode ? "#FF1493" : "#FFB84D"} size={16} strokeWidth={2.5} fill={isNightMode ? "#FF1493" : "#FFB84D"} />
                            )}
                          </View>
                          {contact.company && (
                            <View style={styles.companyRow}>
                              <Building2
                                color={isNightMode ? "#888888" : theme.colors.text.light}
                                size={14}
                                strokeWidth={2}
                              />
                              <Text
                                style={[
                                  styles.companyText,
                                  {
                                    color: isNightMode ? "#888888" : theme.colors.text.secondary,
                                    fontSize: getFontSize(14),
                                  },
                                ]}
                                numberOfLines={1}
                              >
                                {contact.title && `${contact.title} at `}
                                {contact.company}
                              </Text>
                            </View>
                          )}
                        </View>
                      </View>

                      <View style={styles.contactActions}>
                        <View style={styles.actionIcon}>
                          <ShareButton
                            shareableItem={{
                              type: "contact",
                              id: contact.id,
                              title: `${contact.firstName} ${contact.lastName}`,
                              data: {
                                firstName: contact.firstName,
                                lastName: contact.lastName,
                                company: contact.company,
                                title: contact.title,
                                email: contact.email,
                                phone: contact.phone,
                                mobile: contact.mobile,
                                address: contact.address,
                              },
                              sharedAt: new Date().toISOString(),
                              sharedBy: "me",
                              description: contact.email || contact.phone,
                              permissions: {
                                canDownload: true,
                                canEmailShare: true,
                                canOpenInSource: true,
                              },
                              sourceRoute: "/phonebook",
                            }}
                            size={20}
                            color={isNightMode ? "#FFD700" : theme.colors.primary}
                          />
                        </View>
                        <TouchableOpacity
                          onPress={() => handleToggleFavorite(contact.id)}
                          style={styles.actionIcon}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Star
                            color={contact.isFavorite ? (isNightMode ? "#FF1493" : "#FFB84D") : (isNightMode ? "#888888" : theme.colors.text.light)}
                            size={20}
                            strokeWidth={2.5}
                            fill={contact.isFavorite ? (isNightMode ? "#FF1493" : "#FFB84D") : "none"}
                          />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleEditContact(contact)}
                          style={styles.actionIcon}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Edit3 color={isNightMode ? "#00F5FF" : theme.colors.primary} size={19} strokeWidth={2} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => handleDeleteContact(contact.id)}
                          style={styles.actionIcon}
                          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                        >
                          <Trash2 color={isNightMode ? "#FF1493" : "#FF6B6B"} size={19} strokeWidth={2} />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {(contact.email || contact.phone || contact.mobile || contact.address?.city) && (
                      <View style={styles.contactDetails}>
                        {contact.email && (
                          <View style={styles.detailRow}>
                            <Mail
                              color={isNightMode ? "#888888" : theme.colors.text.light}
                              size={16}
                              strokeWidth={2}
                            />
                            <Text
                              style={[
                                styles.detailText,
                                {
                                  color: isNightMode ? "#888888" : theme.colors.text.secondary,
                                  fontSize: getFontSize(14),
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {contact.email}
                            </Text>
                          </View>
                        )}
                        {contact.phone && (
                          <View style={styles.detailRow}>
                            <Phone
                              color={isNightMode ? "#888888" : theme.colors.text.light}
                              size={16}
                              strokeWidth={2}
                            />
                            <Text
                              style={[
                                styles.detailText,
                                {
                                  color: isNightMode ? "#888888" : theme.colors.text.secondary,
                                  fontSize: getFontSize(14),
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
                              size={16}
                              strokeWidth={2}
                            />
                            <Text
                              style={[
                                styles.detailText,
                                {
                                  color: isNightMode ? "#888888" : theme.colors.text.secondary,
                                  fontSize: getFontSize(14),
                                },
                              ]}
                            >
                              {contact.mobile} • {translations.contacts.mobile}
                            </Text>
                          </View>
                        )}
                        {contact.address?.city && (
                          <View style={styles.detailRow}>
                            <MapPin
                              color={isNightMode ? "#888888" : theme.colors.text.light}
                              size={16}
                              strokeWidth={2}
                            />
                            <Text
                              style={[
                                styles.detailText,
                                {
                                  color: isNightMode ? "#888888" : theme.colors.text.secondary,
                                  fontSize: getFontSize(14),
                                },
                              ]}
                              numberOfLines={1}
                            >
                              {contact.address.city}
                              {contact.address.state && `, ${contact.address.state}`}
                            </Text>
                          </View>
                        )}
                      </View>
                    )}
                </View>
              ))}
            </View>
          )}
        </ScrollView>

        <TouchableOpacity
          style={[styles.fab, { bottom: insets.bottom + 90 }]}
          onPress={() => {
            if (Platform.OS !== "web") {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }
            setShowAddModal(true);
          }}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={isNightMode ? ["#FFD700", "#FFA500"] : (theme.gradients.primary as any)}
            style={styles.fabGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <UserPlus color={isNightMode ? "#000000" : "#FFFFFF"} size={26} strokeWidth={2.5} />
          </LinearGradient>
        </TouchableOpacity>
    </LinearGradient>
  );

  return (
    <View style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {activeBackground ? (
        <Image
          source={{ uri: activeBackground.url }}
          style={styles.backgroundImage}
          contentFit="cover"
        />
      ) : null}
      {renderContent()}

      <Modal
        visible={showAddModal}
        transparent={true}
        animationType="slide"
        onRequestClose={closeModal}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.95)" : theme.colors.cardBackground },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: isNightMode ? "#FFD700" : theme.colors.text.primary },
                ]}
              >
                {editingContact ? translations.contacts.editContact : translations.contacts.newContact}
              </Text>
              <View style={styles.headerActions}>
                <KeyboardDismissButton
                  color={isNightMode ? "#FFD700" : theme.colors.primary}
                  size={24}
                  style={{ backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.15)" : `${theme.colors.primary}15` }}
                />
                <TouchableOpacity onPress={closeModal} style={styles.closeButton}>
                  <X color={isNightMode ? "#FFD700" : theme.colors.text.primary} size={24} strokeWidth={2.5} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.formSection}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: isNightMode ? "#888888" : theme.colors.text.secondary, fontSize: getFontSize(13) },
                  ]}
                >
                  {translations.contacts.personalInformation}
                </Text>
                <View style={styles.formRow}>
                  <View style={[styles.formField, { flex: 1 }]}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : `${theme.colors.primary}08`,
                          color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                          fontSize: getFontSize(16),
                        },
                      ]}
                      placeholder={`${translations.contacts.firstName} *`}
                      placeholderTextColor={isNightMode ? "#888888" : theme.colors.text.light}
                      value={firstName}
                      onChangeText={setFirstName}
                    />
                  </View>
                  <View style={[styles.formField, { flex: 1 }]}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : `${theme.colors.primary}08`,
                          color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                          fontSize: getFontSize(16),
                        },
                      ]}
                      placeholder={`${translations.contacts.lastName} *`}
                      placeholderTextColor={isNightMode ? "#888888" : theme.colors.text.light}
                      value={lastName}
                      onChangeText={setLastName}
                    />
                  </View>
                </View>
              </View>

              <View style={styles.formSection}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: isNightMode ? "#888888" : theme.colors.text.secondary, fontSize: getFontSize(13) },
                  ]}
                >
                  {translations.contacts.professional}
                </Text>
                <View style={styles.formField}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : `${theme.colors.primary}08`,
                        color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                        fontSize: getFontSize(16),
                      },
                    ]}
                    placeholder={translations.contacts.company}
                    placeholderTextColor={isNightMode ? "#888888" : theme.colors.text.light}
                    value={company}
                    onChangeText={setCompany}
                  />
                </View>
                <View style={styles.formField}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : `${theme.colors.primary}08`,
                        color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                        fontSize: getFontSize(16),
                      },
                    ]}
                    placeholder={translations.contacts.jobTitle}
                    placeholderTextColor={isNightMode ? "#888888" : theme.colors.text.light}
                    value={title}
                    onChangeText={setTitle}
                  />
                </View>
              </View>

              <View style={styles.formSection}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: isNightMode ? "#888888" : theme.colors.text.secondary, fontSize: getFontSize(13) },
                  ]}
                >
                  {translations.contacts.contact}
                </Text>
                <View style={styles.formField}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : `${theme.colors.primary}08`,
                        color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                        fontSize: getFontSize(16),
                      },
                    ]}
                    placeholder={translations.contacts.email}
                    placeholderTextColor={isNightMode ? "#888888" : theme.colors.text.light}
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.formField}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : `${theme.colors.primary}08`,
                        color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                        fontSize: getFontSize(16),
                      },
                    ]}
                    placeholder={translations.contacts.phone}
                    placeholderTextColor={isNightMode ? "#888888" : theme.colors.text.light}
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                  />
                </View>
                <View style={styles.formField}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : `${theme.colors.primary}08`,
                        color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                        fontSize: getFontSize(16),
                      },
                    ]}
                    placeholder={translations.contacts.mobile}
                    placeholderTextColor={isNightMode ? "#888888" : theme.colors.text.light}
                    value={mobile}
                    onChangeText={setMobile}
                    keyboardType="phone-pad"
                  />
                </View>
              </View>

              <View style={styles.formSection}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: isNightMode ? "#888888" : theme.colors.text.secondary, fontSize: getFontSize(13) },
                  ]}
                >
                  {translations.contacts.addressSection}
                </Text>
                <View style={styles.formField}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : `${theme.colors.primary}08`,
                        color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                        fontSize: getFontSize(16),
                      },
                    ]}
                    placeholder={translations.contacts.street}
                    placeholderTextColor={isNightMode ? "#888888" : theme.colors.text.light}
                    value={street}
                    onChangeText={setStreet}
                  />
                </View>
                <View style={styles.formRow}>
                  <View style={[styles.formField, { flex: 2 }]}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : `${theme.colors.primary}08`,
                          color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                          fontSize: getFontSize(16),
                        },
                      ]}
                      placeholder={translations.contacts.city}
                      placeholderTextColor={isNightMode ? "#888888" : theme.colors.text.light}
                      value={city}
                      onChangeText={setCity}
                    />
                  </View>
                  <View style={[styles.formField, { flex: 1 }]}>
                    <TextInput
                      style={[
                        styles.input,
                        {
                          backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : `${theme.colors.primary}08`,
                          color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                          fontSize: getFontSize(16),
                        },
                      ]}
                      placeholder={translations.contacts.state}
                      placeholderTextColor={isNightMode ? "#888888" : theme.colors.text.light}
                      value={state}
                      onChangeText={setState}
                    />
                  </View>
                </View>
                <View style={styles.formField}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : `${theme.colors.primary}08`,
                        color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                        fontSize: getFontSize(16),
                      },
                    ]}
                    placeholder={translations.contacts.zipCode}
                    placeholderTextColor={isNightMode ? "#888888" : theme.colors.text.light}
                    value={zipCode}
                    onChangeText={setZipCode}
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <View style={styles.formSection}>
                <Text
                  style={[
                    styles.sectionLabel,
                    { color: isNightMode ? "#888888" : theme.colors.text.secondary, fontSize: getFontSize(13) },
                  ]}
                >
                  {translations.contacts.additional}
                </Text>
                <View style={styles.formField}>
                  <TextInput
                    style={[
                      styles.input,
                      {
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : `${theme.colors.primary}08`,
                        color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                        fontSize: getFontSize(16),
                      },
                    ]}
                    placeholder={translations.contacts.website}
                    placeholderTextColor={isNightMode ? "#888888" : theme.colors.text.light}
                    value={website}
                    onChangeText={setWebsite}
                    keyboardType="url"
                    autoCapitalize="none"
                  />
                </View>
                <View style={styles.formField}>
                  <TextInput
                    style={[
                      styles.input,
                      styles.textArea,
                      {
                        backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : `${theme.colors.primary}08`,
                        color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                        fontSize: getFontSize(16),
                      },
                    ]}
                    placeholder={translations.contacts.notes}
                    placeholderTextColor={isNightMode ? "#888888" : theme.colors.text.light}
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={3}
                  />
                </View>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleAddContact}>
                <LinearGradient
                  colors={isNightMode ? ["#FFD700", "#FFA500"] : (theme.gradients.primary as any)}
                  style={styles.submitGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={[styles.submitText, { fontSize: getFontSize(17), color: isNightMode ? "#000000" : "#FFFFFF" }]}>
                    {editingContact ? translations.contacts.updateContact : translations.contacts.addContact}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showListModal}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowListModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View
            style={[
              styles.modalContent,
              { backgroundColor: isNightMode ? "rgba(26, 10, 31, 0.95)" : theme.colors.cardBackground, maxHeight: "70%" },
            ]}
          >
            <View style={styles.modalHeader}>
              <Text
                style={[
                  styles.modalTitle,
                  { color: isNightMode ? "#FFD700" : theme.colors.text.primary },
                ]}
              >
                {translations.contacts.manageLists}
              </Text>
              <TouchableOpacity
                onPress={() => setShowListModal(false)}
                style={styles.closeButton}
              >
                <X color={isNightMode ? "#FFD700" : theme.colors.text.primary} size={24} strokeWidth={2.5} />
              </TouchableOpacity>
            </View>

            <View style={styles.formSection}>
              <View style={styles.listInputRow}>
                <TextInput
                  style={[
                    styles.input,
                    {
                      flex: 1,
                      backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : `${theme.colors.primary}08`,
                      color: isNightMode ? "#FFFFFF" : theme.colors.text.primary,
                      fontSize: getFontSize(16),
                    },
                  ]}
                  placeholder={translations.contacts.newListName}
                  placeholderTextColor={isNightMode ? "#888888" : theme.colors.text.light}
                  value={newListName}
                  onChangeText={setNewListName}
                />
                <TouchableOpacity
                  style={styles.addListButton}
                  onPress={handleCreateList}
                  activeOpacity={0.8}
                >
                  <LinearGradient
                    colors={isNightMode ? ["#FFD700", "#FFA500"] : (theme.gradients.primary as any)}
                    style={styles.addListGradient}
                  >
                    <Plus color={isNightMode ? "#000000" : "#FFFFFF"} size={22} strokeWidth={2.5} />
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {lists.length === 0 ? (
                <View style={styles.emptyLists}>
                  <Tag color={isNightMode ? "#888888" : theme.colors.text.light} size={40} strokeWidth={1.5} />
                  <Text
                    style={[
                      styles.emptyListText,
                      { color: isNightMode ? "#888888" : theme.colors.text.secondary, fontSize: getFontSize(15) },
                    ]}
                  >
                    {translations.contacts.noCustomListsYet}
                  </Text>
                </View>
              ) : (
                lists.map((list) => (
                  <View
                    key={list.id}
                    style={[
                      styles.listItem,
                      { borderBottomColor: isNightMode ? "rgba(255, 215, 0, 0.2)" : `${theme.colors.text.light}20` },
                    ]}
                  >
                    <View style={styles.listInfo}>
                      <View style={[styles.listColorDot, { backgroundColor: list.color }]} />
                      <Text
                        style={[
                          styles.listName,
                          { color: isNightMode ? "#FFFFFF" : theme.colors.text.primary, fontSize: getFontSize(16) },
                        ]}
                      >
                        {list.name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteList(list.id)}
                      hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                    >
                      <Trash2 color={isNightMode ? "#FF1493" : "#FF6B6B"} size={20} strokeWidth={2} />
                    </TouchableOpacity>
                  </View>
                ))
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: "100%",
    height: "100%",
  },
  gradient: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  titleSection: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 20,
  },
  titleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
  },
  iconContainer: {
    width: 54,
    height: 54,
    borderRadius: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  titleContent: {
    justifyContent: "center" as const,
  },
  title: {
    fontSize: 30,
    fontWeight: "700" as const,
    letterSpacing: -0.5,
    marginBottom: 2,
  },
  subtitle: {
    fontWeight: "600" as const,
    letterSpacing: 0.2,
  },
  manageButton: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  searchBar: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  searchInput: {
    flex: 1,
    fontWeight: "600" as const,
  },
  filterContainer: {
    gap: 10,
    paddingHorizontal: 2,
  },
  filterTab: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
  },
  filterTabActive: {
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
  },
  filterText: {
    fontWeight: "700" as const,
    letterSpacing: 0.2,
  },
  listDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
  },
  emptyState: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 80,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 20,
  },
  emptyTitle: {
    fontWeight: "700" as const,
    marginBottom: 8,
    letterSpacing: 0.2,
  },
  emptySubtitle: {
    fontWeight: "500" as const,
    textAlign: "center" as const,
  },
  contactList: {
    gap: 12,
  },
  contactCard: {
    borderRadius: 18,
    padding: 16,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  contactMain: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
  },
  contactLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    flex: 1,
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 15,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  contactInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 4,
  },
  contactName: {
    fontWeight: "700" as const,
    letterSpacing: 0.2,
    flex: 1,
  },
  companyRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  companyText: {
    fontWeight: "600" as const,
    flex: 1,
  },
  contactActions: {
    flexDirection: "row" as const,
    gap: 6,
  },
  actionIcon: {
    padding: 6,
  },
  contactDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(0,0,0,0.05)",
    gap: 8,
  },
  detailRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
  },
  detailText: {
    fontWeight: "600" as const,
    flex: 1,
  },
  fab: {
    position: "absolute" as const,
    right: 20,
    width: 64,
    height: 64,
    borderRadius: 32,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    overflow: "hidden" as const,
  },
  fabGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end" as const,
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 24,
    paddingBottom: 40,
    paddingHorizontal: 20,
    maxHeight: "92%",
  },
  modalHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 26,
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  closeButton: {
    padding: 4,
  },
  headerActions: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  formSection: {
    marginBottom: 24,
  },
  sectionLabel: {
    fontWeight: "700" as const,
    letterSpacing: 1,
    marginBottom: 12,
  },
  formRow: {
    flexDirection: "row" as const,
    gap: 12,
  },
  formField: {
    marginBottom: 12,
  },
  input: {
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontWeight: "600" as const,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: "top" as const,
  },
  submitButton: {
    borderRadius: 16,
    overflow: "hidden" as const,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    marginTop: 8,
  },
  submitGradient: {
    paddingVertical: 16,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  submitText: {
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  listInputRow: {
    flexDirection: "row" as const,
    gap: 12,
    alignItems: "center" as const,
  },
  addListButton: {
    width: 50,
    height: 50,
    borderRadius: 14,
    overflow: "hidden" as const,
  },
  addListGradient: {
    width: "100%",
    height: "100%",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  emptyLists: {
    alignItems: "center" as const,
    paddingVertical: 40,
  },
  emptyListText: {
    marginTop: 12,
    fontWeight: "600" as const,
  },
  listItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  listInfo: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  listColorDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  listName: {
    fontWeight: "700" as const,
    letterSpacing: 0.2,
  },
});
