import { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Modal,
  Alert,
  Platform,
  TextInput,
  FlatList,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  ChevronLeft,
  Clock,
  Bell,
  MessageSquare,
  Pause,
  Trash2,
  Copy,
  X,
  Check,
  Timer,
  Zap,
  Phone,
  Users,
  Search,
  ChevronRight,
} from "lucide-react-native";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";

import { useAudreyTimer, AudreyAutomation, AudreyTimer } from "@/contexts/AudreyTimerContext";
import { usePhonebook, Contact } from "@/contexts/PhonebookContext";

type PauseDuration = {
  type: "hours" | "days";
  value: number;
};

export default function AutomationsManagerScreen() {
  const insets = useSafeAreaInsets();
  const {
    timers,
    automations,
    toggleAutomation,
    deleteAutomation,
    deleteTimer,
    pauseTimer,
    resetTimer,
    createAutomation,
    formatTime,
  } = useAudreyTimer();

  const { contacts } = usePhonebook();

  const [selectedItem, setSelectedItem] = useState<AudreyAutomation | AudreyTimer | null>(null);
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [showPauseModal, setShowPauseModal] = useState(false);
  const [showContactsModal, setShowContactsModal] = useState(false);
  const [showDuplicateModal, setShowDuplicateModal] = useState(false);
  const [pauseDuration, setPauseDuration] = useState<PauseDuration>({ type: "hours", value: 1 });
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);
  const [contactSearchQuery, setContactSearchQuery] = useState("");
  const [duplicateName, setDuplicateName] = useState("");
  const [activeTab, setActiveTab] = useState<"automations" | "timers">("automations");

  

  const palette = useMemo(
    () => ({
      background: ["#000000", "#000000", "#000000"] as [string, string, string],
      textPrimary: "#FFFFFF",
      subtext: "rgba(255, 255, 255, 0.6)",
      accent: "#00D9FF",
      neonBlue: "#00D9FF",
      cardBg: "#0A0A0A",
      cardBorder: "rgba(0, 217, 255, 0.15)",
      success: "#34D399",
      warning: "#FBBF24",
      danger: "#EF4444",
    }),
    []
  );

  const filteredContacts = useMemo(() => {
    if (!contactSearchQuery.trim()) return contacts;
    const query = contactSearchQuery.toLowerCase();
    return contacts.filter(
      (c) =>
        c.firstName.toLowerCase().includes(query) ||
        c.lastName.toLowerCase().includes(query) ||
        c.phone?.toLowerCase().includes(query) ||
        c.mobile?.toLowerCase().includes(query)
    );
  }, [contacts, contactSearchQuery]);

  const smsAutomations = useMemo(
    () => automations.filter((a) => a.action.type === "sms"),
    [automations]
  );

  const otherAutomations = useMemo(
    () => automations.filter((a) => a.action.type !== "sms"),
    [automations]
  );

  const handleBackPress = () => {
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/ai-assistant" as any);
    }
  };

  const openActionSheet = (item: AudreyAutomation | AudreyTimer) => {
    setSelectedItem(item);
    setShowActionSheet(true);
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const isAutomation = (item: AudreyAutomation | AudreyTimer | null): item is AudreyAutomation => {
    return item !== null && "trigger" in item;
  };

  const isTimer = (item: AudreyAutomation | AudreyTimer | null): item is AudreyTimer => {
    return item !== null && "type" in item && "duration" in item;
  };

  const handleStop = async () => {
    if (!selectedItem) return;

    if (isAutomation(selectedItem)) {
      if (selectedItem.enabled) {
        await toggleAutomation(selectedItem.id);
      }
    } else if (isTimer(selectedItem)) {
      await resetTimer(selectedItem.id);
    }

    setShowActionSheet(false);
    setSelectedItem(null);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Alert.alert("Stopped", "The item has been stopped.");
  };

  const handlePause = () => {
    setShowActionSheet(false);
    setShowPauseModal(true);
  };

  const confirmPause = async () => {
    if (!selectedItem) return;

    const pauseMs =
      pauseDuration.type === "hours"
        ? pauseDuration.value * 60 * 60 * 1000
        : pauseDuration.value * 24 * 60 * 60 * 1000;

    if (isAutomation(selectedItem)) {
      if (selectedItem.enabled) {
        await toggleAutomation(selectedItem.id);
      }
      setTimeout(async () => {
        const current = automations.find((a) => a.id === selectedItem.id);
        if (current && !current.enabled) {
          await toggleAutomation(selectedItem.id);
          console.log("[AutomationsManager] Automation auto-resumed after pause");
        }
      }, pauseMs);
    } else if (isTimer(selectedItem)) {
      await pauseTimer(selectedItem.id);
    }

    setShowPauseModal(false);
    setSelectedItem(null);

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    const durationText = `${pauseDuration.value} ${pauseDuration.type}`;
    Alert.alert("Paused", `Paused for ${durationText}. Will auto-resume after.`);
  };

  const handleDelete = () => {
    if (!selectedItem) return;

    Alert.alert(
      "Delete",
      `Are you sure you want to delete "${selectedItem.name}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            if (isAutomation(selectedItem)) {
              await deleteAutomation(selectedItem.id);
            } else if (isTimer(selectedItem)) {
              await deleteTimer(selectedItem.id);
            }

            setShowActionSheet(false);
            setSelectedItem(null);

            if (Platform.OS !== "web") {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
          },
        },
      ]
    );
  };

  const handleDuplicate = () => {
    if (!selectedItem || !isAutomation(selectedItem)) return;

    setDuplicateName(`${selectedItem.name} (Copy)`);
    setShowActionSheet(false);
    setShowDuplicateModal(true);
  };

  const confirmDuplicate = async () => {
    if (!selectedItem || !isAutomation(selectedItem)) return;

    await createAutomation(
      duplicateName || `${selectedItem.name} (Copy)`,
      selectedItem.trigger,
      { ...selectedItem.triggerConfig },
      { ...selectedItem.action }
    );

    setShowDuplicateModal(false);
    setSelectedItem(null);
    setDuplicateName("");

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Alert.alert("Duplicated", "Automation has been duplicated.");
  };

  const handleChangeContacts = () => {
    if (!selectedItem || !isAutomation(selectedItem) || selectedItem.action.type !== "sms") return;

    setSelectedContacts([]);
    setShowActionSheet(false);
    setShowContactsModal(true);
  };

  const toggleContactSelection = (contact: Contact) => {
    const phoneNumber = contact.mobile || contact.phone;
    if (!phoneNumber) return;

    setSelectedContacts((prev) => {
      if (prev.includes(phoneNumber)) {
        return prev.filter((p) => p !== phoneNumber);
      }
      return [...prev, phoneNumber];
    });

    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
  };

  const confirmContactsChange = async () => {
    if (!selectedItem || !isAutomation(selectedItem) || selectedContacts.length === 0) return;

    for (const phoneNumber of selectedContacts) {
      const name =
        selectedContacts.length > 1
          ? `${selectedItem.name} - ${phoneNumber}`
          : selectedItem.name;

      await createAutomation(
        name,
        selectedItem.trigger,
        { ...selectedItem.triggerConfig },
        { ...selectedItem.action, phoneNumber }
      );
    }

    setShowContactsModal(false);
    setSelectedItem(null);
    setSelectedContacts([]);
    setContactSearchQuery("");

    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }

    Alert.alert(
      "Created",
      `Created ${selectedContacts.length} new SMS automation(s) with selected contacts.`
    );
  };

  const getTriggerDescription = (automation: AudreyAutomation) => {
    switch (automation.trigger) {
      case "daily":
        return `Daily at ${automation.triggerConfig.time}`;
      case "weekly":
        const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
        const selectedDays = automation.triggerConfig.dayOfWeek?.map((d) => days[d]).join(", ");
        return `Weekly (${selectedDays}) at ${automation.triggerConfig.time}`;
      case "timer_complete":
        return "When timer completes";
      case "time":
        return `Once at ${automation.triggerConfig.time}`;
      default:
        return "Unknown trigger";
    }
  };

  const getActionIcon = (type: string) => {
    switch (type) {
      case "sms":
        return <MessageSquare color={palette.accent} size={20} />;
      case "speak":
        return <Bell color={palette.warning} size={20} />;
      case "notify":
        return <Bell color={palette.success} size={20} />;
      case "reminder":
        return <Clock color="#F472B6" size={20} />;
      case "affirmation":
        return <Zap color="#A78BFA" size={20} />;
      default:
        return <Bell color={palette.subtext} size={20} />;
    }
  };

  const renderAutomationCard = (automation: AudreyAutomation) => (
    <TouchableOpacity
      key={automation.id}
      style={[styles.card, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}
      onPress={() => openActionSheet(automation)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIconContainer}>{getActionIcon(automation.action.type)}</View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: palette.textPrimary }]} numberOfLines={1}>
            {automation.name}
          </Text>
          <Text style={[styles.cardSubtitle, { color: palette.subtext }]} numberOfLines={1}>
            {getTriggerDescription(automation)}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            { backgroundColor: automation.enabled ? "rgba(52, 211, 153, 0.2)" : "rgba(239, 68, 68, 0.2)" },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: automation.enabled ? palette.success : palette.danger },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              { color: automation.enabled ? palette.success : palette.danger },
            ]}
          >
            {automation.enabled ? "Active" : "Paused"}
          </Text>
        </View>
      </View>

      {automation.action.type === "sms" && (
        <View style={styles.cardDetails}>
          <View style={styles.detailRow}>
            <Phone color={palette.subtext} size={14} />
            <Text style={[styles.detailText, { color: palette.subtext }]} numberOfLines={1}>
              {automation.action.phoneNumber || "No number"}
            </Text>
          </View>
          {automation.action.message && (
            <Text style={[styles.messagePreview, { color: palette.subtext }]} numberOfLines={2}>
              &quot;{automation.action.message}&quot;
            </Text>
          )}
        </View>
      )}

      <View style={styles.cardFooter}>
        <Text style={[styles.footerText, { color: palette.subtext }]}>
          Last run: {automation.lastRun ? new Date(automation.lastRun).toLocaleDateString() : "Never"}
        </Text>
        <ChevronRight color={palette.subtext} size={16} />
      </View>
    </TouchableOpacity>
  );

  const renderTimerCard = (timer: AudreyTimer) => (
    <TouchableOpacity
      key={timer.id}
      style={[styles.card, { backgroundColor: palette.cardBg, borderColor: palette.cardBorder }]}
      onPress={() => openActionSheet(timer)}
      activeOpacity={0.7}
    >
      <View style={styles.cardHeader}>
        <View style={styles.cardIconContainer}>
          <Timer color={palette.accent} size={20} />
        </View>
        <View style={styles.cardContent}>
          <Text style={[styles.cardTitle, { color: palette.textPrimary }]} numberOfLines={1}>
            {timer.name}
          </Text>
          <Text style={[styles.cardSubtitle, { color: palette.subtext }]}>
            {timer.type === "pomodoro" ? "🍅 Pomodoro" : timer.type === "stopwatch" ? "⏱️ Stopwatch" : "⏰ Countdown"}
          </Text>
        </View>
        <View
          style={[
            styles.statusBadge,
            {
              backgroundColor:
                timer.status === "running"
                  ? "rgba(52, 211, 153, 0.2)"
                  : timer.status === "paused"
                  ? "rgba(251, 191, 36, 0.2)"
                  : "rgba(255, 255, 255, 0.1)",
            },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              {
                backgroundColor:
                  timer.status === "running"
                    ? palette.success
                    : timer.status === "paused"
                    ? palette.warning
                    : palette.subtext,
              },
            ]}
          />
          <Text
            style={[
              styles.statusText,
              {
                color:
                  timer.status === "running"
                    ? palette.success
                    : timer.status === "paused"
                    ? palette.warning
                    : palette.subtext,
              },
            ]}
          >
            {timer.status.charAt(0).toUpperCase() + timer.status.slice(1)}
          </Text>
        </View>
      </View>

      <View style={styles.timerDisplay}>
        <Text style={[styles.timerTime, { color: palette.textPrimary }]}>
          {formatTime(timer.remaining)}
        </Text>
        {timer.type !== "stopwatch" && (
          <Text style={[styles.timerTotal, { color: palette.subtext }]}>
            / {formatTime(timer.duration)}
          </Text>
        )}
      </View>

      <View style={styles.cardFooter}>
        <Text style={[styles.footerText, { color: palette.subtext }]}>
          Created: {new Date(timer.createdAt).toLocaleDateString()}
        </Text>
        <ChevronRight color={palette.subtext} size={16} />
      </View>
    </TouchableOpacity>
  );

  const renderContactItem = ({ item }: { item: Contact }) => {
    const phoneNumber = item.mobile || item.phone;
    const isSelected = phoneNumber ? selectedContacts.includes(phoneNumber) : false;

    return (
      <TouchableOpacity
        style={[
          styles.contactItem,
          { borderColor: palette.cardBorder },
          isSelected && { backgroundColor: "rgba(0, 217, 255, 0.1)", borderColor: palette.accent },
        ]}
        onPress={() => toggleContactSelection(item)}
        disabled={!phoneNumber}
      >
        <View style={styles.contactInfo}>
          <Text style={[styles.contactName, { color: palette.textPrimary }]}>
            {item.firstName} {item.lastName}
          </Text>
          <Text style={[styles.contactPhone, { color: palette.subtext }]}>
            {phoneNumber || "No phone number"}
          </Text>
        </View>
        {phoneNumber && (
          <View
            style={[
              styles.checkBox,
              { borderColor: isSelected ? palette.accent : palette.cardBorder },
              isSelected && { backgroundColor: palette.accent },
            ]}
          >
            {isSelected && <Check color="#000" size={14} strokeWidth={3} />}
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={palette.background} style={styles.gradient}>
        <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
          <TouchableOpacity
            style={[styles.backButton, { borderColor: palette.cardBorder }]}
            onPress={handleBackPress}
          >
            <ChevronLeft color={palette.textPrimary} size={22} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: palette.textPrimary }]}>Automations Manager</Text>
          <View style={styles.placeholder} />
        </View>

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "automations" && { backgroundColor: "rgba(0, 217, 255, 0.15)", borderColor: palette.accent },
            ]}
            onPress={() => setActiveTab("automations")}
          >
            <Zap color={activeTab === "automations" ? palette.accent : palette.subtext} size={18} />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "automations" ? palette.accent : palette.subtext },
              ]}
            >
              Automations ({automations.length})
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.tab,
              activeTab === "timers" && { backgroundColor: "rgba(0, 217, 255, 0.15)", borderColor: palette.accent },
            ]}
            onPress={() => setActiveTab("timers")}
          >
            <Timer color={activeTab === "timers" ? palette.accent : palette.subtext} size={18} />
            <Text
              style={[
                styles.tabText,
                { color: activeTab === "timers" ? palette.accent : palette.subtext },
              ]}
            >
              Timers ({timers.length})
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.content}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: insets.bottom + 20 }]}
          showsVerticalScrollIndicator={false}
        >
          {activeTab === "automations" ? (
            <>
              {smsAutomations.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <MessageSquare color={palette.accent} size={18} />
                    <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                      SMS Automations
                    </Text>
                  </View>
                  {smsAutomations.map(renderAutomationCard)}
                </View>
              )}

              {otherAutomations.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Bell color={palette.warning} size={18} />
                    <Text style={[styles.sectionTitle, { color: palette.textPrimary }]}>
                      Other Automations
                    </Text>
                  </View>
                  {otherAutomations.map(renderAutomationCard)}
                </View>
              )}

              {automations.length === 0 && (
                <View style={styles.emptyState}>
                  <Zap color={palette.subtext} size={48} />
                  <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
                    No Automations Yet
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: palette.subtext }]}>
                    Ask Audrey to create automated reminders, scheduled SMS messages, or other tasks.
                  </Text>
                </View>
              )}
            </>
          ) : (
            <>
              {timers.length > 0 ? (
                <View style={styles.section}>
                  {timers.map(renderTimerCard)}
                </View>
              ) : (
                <View style={styles.emptyState}>
                  <Timer color={palette.subtext} size={48} />
                  <Text style={[styles.emptyTitle, { color: palette.textPrimary }]}>
                    No Timers Yet
                  </Text>
                  <Text style={[styles.emptySubtitle, { color: palette.subtext }]}>
                    Ask Audrey to create timers, stopwatches, or Pomodoro sessions.
                  </Text>
                </View>
              )}
            </>
          )}
        </ScrollView>

        {/* Action Sheet Modal */}
        <Modal
          visible={showActionSheet}
          animationType="slide"
          transparent
          onRequestClose={() => setShowActionSheet(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowActionSheet(false)}
          >
            <View style={[styles.actionSheet, { backgroundColor: palette.cardBg }]}>
              <View style={styles.actionSheetHandle} />
              <Text style={[styles.actionSheetTitle, { color: palette.textPrimary }]}>
                {selectedItem?.name}
              </Text>

              <TouchableOpacity style={styles.actionItem} onPress={handleStop}>
                <View style={[styles.actionIcon, { backgroundColor: "rgba(239, 68, 68, 0.2)" }]}>
                  <Pause color={palette.danger} size={20} />
                </View>
                <Text style={[styles.actionText, { color: palette.textPrimary }]}>Stop</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.actionItem} onPress={handlePause}>
                <View style={[styles.actionIcon, { backgroundColor: "rgba(251, 191, 36, 0.2)" }]}>
                  <Clock color={palette.warning} size={20} />
                </View>
                <Text style={[styles.actionText, { color: palette.textPrimary }]}>
                  Pause for...
                </Text>
              </TouchableOpacity>

              {selectedItem && isAutomation(selectedItem) && (
                <TouchableOpacity style={styles.actionItem} onPress={handleDuplicate}>
                  <View style={[styles.actionIcon, { backgroundColor: "rgba(0, 217, 255, 0.2)" }]}>
                    <Copy color={palette.accent} size={20} />
                  </View>
                  <Text style={[styles.actionText, { color: palette.textPrimary }]}>Duplicate</Text>
                </TouchableOpacity>
              )}

              {selectedItem &&
                isAutomation(selectedItem) &&
                selectedItem.action.type === "sms" && (
                  <TouchableOpacity style={styles.actionItem} onPress={handleChangeContacts}>
                    <View style={[styles.actionIcon, { backgroundColor: "rgba(167, 139, 250, 0.2)" }]}>
                      <Users color="#A78BFA" size={20} />
                    </View>
                    <Text style={[styles.actionText, { color: palette.textPrimary }]}>
                      Send to Different Contacts
                    </Text>
                  </TouchableOpacity>
                )}

              <TouchableOpacity style={styles.actionItem} onPress={handleDelete}>
                <View style={[styles.actionIcon, { backgroundColor: "rgba(239, 68, 68, 0.2)" }]}>
                  <Trash2 color={palette.danger} size={20} />
                </View>
                <Text style={[styles.actionText, { color: palette.danger }]}>Delete</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.cancelButton, { borderColor: palette.cardBorder }]}
                onPress={() => setShowActionSheet(false)}
              >
                <Text style={[styles.cancelText, { color: palette.textPrimary }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Pause Duration Modal */}
        <Modal
          visible={showPauseModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowPauseModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.pauseModal, { backgroundColor: palette.cardBg }]}>
              <Text style={[styles.pauseModalTitle, { color: palette.textPrimary }]}>
                Pause Duration
              </Text>

              <View style={styles.durationSelector}>
                <TouchableOpacity
                  style={[
                    styles.durationButton,
                    pauseDuration.type === "hours" && { backgroundColor: palette.accent },
                  ]}
                  onPress={() => setPauseDuration({ ...pauseDuration, type: "hours" })}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      { color: pauseDuration.type === "hours" ? "#000" : palette.textPrimary },
                    ]}
                  >
                    Hours
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.durationButton,
                    pauseDuration.type === "days" && { backgroundColor: palette.accent },
                  ]}
                  onPress={() => setPauseDuration({ ...pauseDuration, type: "days" })}
                >
                  <Text
                    style={[
                      styles.durationButtonText,
                      { color: pauseDuration.type === "days" ? "#000" : palette.textPrimary },
                    ]}
                  >
                    Days
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.valueSelector}>
                {[1, 2, 3, 6, 12, 24].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.valueButton,
                      pauseDuration.value === val && { backgroundColor: "rgba(0, 217, 255, 0.2)", borderColor: palette.accent },
                      { borderColor: palette.cardBorder },
                    ]}
                    onPress={() => setPauseDuration({ ...pauseDuration, value: val })}
                  >
                    <Text
                      style={[
                        styles.valueText,
                        { color: pauseDuration.value === val ? palette.accent : palette.textPrimary },
                      ]}
                    >
                      {val}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { borderColor: palette.cardBorder }]}
                  onPress={() => setShowPauseModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: palette.textPrimary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: palette.accent }]}
                  onPress={confirmPause}
                >
                  <Text style={[styles.modalButtonText, { color: "#000" }]}>Confirm</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Contacts Selection Modal */}
        <Modal
          visible={showContactsModal}
          animationType="slide"
          transparent
          onRequestClose={() => setShowContactsModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.contactsModal, { backgroundColor: palette.cardBg }]}>
              <View style={styles.contactsHeader}>
                <Text style={[styles.contactsTitle, { color: palette.textPrimary }]}>
                  Select Contacts
                </Text>
                <TouchableOpacity onPress={() => setShowContactsModal(false)}>
                  <X color={palette.textPrimary} size={24} />
                </TouchableOpacity>
              </View>

              <View style={[styles.searchContainer, { borderColor: palette.cardBorder }]}>
                <Search color={palette.subtext} size={18} />
                <TextInput
                  style={[styles.searchInput, { color: palette.textPrimary }]}
                  placeholder="Search contacts..."
                  placeholderTextColor={palette.subtext}
                  value={contactSearchQuery}
                  onChangeText={setContactSearchQuery}
                />
              </View>

              <Text style={[styles.selectedCount, { color: palette.subtext }]}>
                {selectedContacts.length} selected
              </Text>

              <FlatList
                data={filteredContacts}
                renderItem={renderContactItem}
                keyExtractor={(item) => item.id}
                style={styles.contactsList}
                showsVerticalScrollIndicator={false}
              />

              <TouchableOpacity
                style={[
                  styles.confirmContactsButton,
                  { backgroundColor: selectedContacts.length > 0 ? palette.accent : palette.cardBorder },
                ]}
                onPress={confirmContactsChange}
                disabled={selectedContacts.length === 0}
              >
                <Text
                  style={[
                    styles.confirmContactsText,
                    { color: selectedContacts.length > 0 ? "#000" : palette.subtext },
                  ]}
                >
                  Create {selectedContacts.length} Automation{selectedContacts.length !== 1 ? "s" : ""}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Duplicate Modal */}
        <Modal
          visible={showDuplicateModal}
          animationType="fade"
          transparent
          onRequestClose={() => setShowDuplicateModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.duplicateModal, { backgroundColor: palette.cardBg }]}>
              <Text style={[styles.duplicateTitle, { color: palette.textPrimary }]}>
                Duplicate Automation
              </Text>
              <TextInput
                style={[styles.duplicateInput, { color: palette.textPrimary, borderColor: palette.cardBorder }]}
                placeholder="Automation name"
                placeholderTextColor={palette.subtext}
                value={duplicateName}
                onChangeText={setDuplicateName}
              />
              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={[styles.modalButton, { borderColor: palette.cardBorder }]}
                  onPress={() => setShowDuplicateModal(false)}
                >
                  <Text style={[styles.modalButtonText, { color: palette.textPrimary }]}>
                    Cancel
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.modalButton, { backgroundColor: palette.accent }]}
                  onPress={confirmDuplicate}
                >
                  <Text style={[styles.modalButtonText, { color: "#000" }]}>Create</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    letterSpacing: 0.5,
  },
  placeholder: {
    width: 44,
  },
  tabsContainer: {
    flexDirection: "row",
    paddingHorizontal: 20,
    gap: 12,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600" as const,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  cardIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0, 217, 255, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: "600" as const,
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    fontSize: 12,
    fontWeight: "500" as const,
  },
  cardDetails: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  detailRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  detailText: {
    fontSize: 13,
  },
  messagePreview: {
    fontSize: 12,
    fontStyle: "italic" as const,
    marginTop: 8,
  },
  timerDisplay: {
    flexDirection: "row",
    alignItems: "baseline",
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.1)",
  },
  timerTime: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontVariant: ["tabular-nums"],
  },
  timerTotal: {
    fontSize: 16,
    marginLeft: 8,
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 12,
  },
  footerText: {
    fontSize: 12,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: "center",
    marginTop: 8,
    maxWidth: "80%",
    lineHeight: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    justifyContent: "flex-end",
  },
  actionSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 40,
  },
  actionSheetHandle: {
    width: 40,
    height: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 2,
    alignSelf: "center",
    marginBottom: 16,
  },
  actionSheetTitle: {
    fontSize: 18,
    fontWeight: "600" as const,
    textAlign: "center",
    marginBottom: 20,
  },
  actionItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
    paddingVertical: 14,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  actionText: {
    fontSize: 16,
    fontWeight: "500" as const,
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
  },
  cancelText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  pauseModal: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
  },
  pauseModalTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    textAlign: "center",
    marginBottom: 24,
  },
  durationSelector: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 20,
  },
  durationButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
  },
  durationButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
  },
  valueSelector: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 24,
  },
  valueButton: {
    width: "30%",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    borderWidth: 1,
  },
  valueText: {
    fontSize: 18,
    fontWeight: "600" as const,
  },
  modalActions: {
    flexDirection: "row",
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "transparent",
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  contactsModal: {
    flex: 1,
    marginTop: 80,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  contactsHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  contactsTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
  },
  selectedCount: {
    fontSize: 13,
    marginBottom: 12,
  },
  contactsList: {
    flex: 1,
  },
  contactItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  contactInfo: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: "500" as const,
    marginBottom: 2,
  },
  contactPhone: {
    fontSize: 13,
  },
  checkBox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  confirmContactsButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 16,
  },
  confirmContactsText: {
    fontSize: 16,
    fontWeight: "600" as const,
  },
  duplicateModal: {
    margin: 20,
    borderRadius: 20,
    padding: 24,
  },
  duplicateTitle: {
    fontSize: 20,
    fontWeight: "600" as const,
    textAlign: "center",
    marginBottom: 20,
  },
  duplicateInput: {
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    marginBottom: 20,
  },
});
