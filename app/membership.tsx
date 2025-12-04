import { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Platform, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Crown, Star, Sparkles, X, CheckCircle, ShieldCheck, ArrowLeft, Check } from 'lucide-react-native';
import * as Haptics from "expo-haptics";
import { useTheme } from '@/contexts/ThemeContext';

type SubscriptionTier = 'basic-monthly' | 'basic-yearly' | 'advanced-monthly' | 'advanced-yearly';

type SubscriptionPlan = {
  id: SubscriptionTier;
  name: string;
  price: string;
  period: string;
  features: string[];
  badge?: string;
  popular?: boolean;
  type: 'basic' | 'advanced';
  comingSoon?: boolean;
  description: string;
};

const plans: SubscriptionPlan[] = [
  {
    id: 'basic-monthly',
    name: 'Basic Monthly',
    price: '$25.99',
    period: '/month',
    type: 'basic',
    description: 'Essential tools for your daily journey',
    features: [
      'Full access to all features',
      'AI-powered assistant',
      'Unlimited planning & tracking',
      'Cloud sync across devices',
      'Priority support',
    ],
  },
  {
    id: 'advanced-monthly',
    name: 'Advanced Monthly',
    price: '$75.99',
    period: '/month',
    type: 'advanced',
    comingSoon: true,
    description: 'For those who want to excel',
    features: [
      'Everything in Basic',
      'Access to all online courses',
      'Excel in any field of life',
      'Become extraordinary',
      'VIP support',
    ],
  },
  {
    id: 'basic-yearly',
    name: 'Basic Yearly',
    price: '$259.99',
    period: '/year',
    type: 'basic',
    badge: 'Save $52',
    description: 'Best value for year-round growth',
    features: [
      'Everything in Basic Monthly',
      'Save $52 per year',
      'Exclusive yearly bonuses',
      'Early access to new features',
      'Priority support',
    ],
  },
  {
    id: 'advanced-yearly',
    name: 'Advanced Yearly',
    price: '$759.99',
    period: '/year',
    type: 'advanced',
    badge: 'Save $152',
    popular: true,
    comingSoon: true,
    description: 'The ultimate toolkit for success',
    features: [
      'Everything in Advanced Monthly',
      'Save $152 per year',
      'Premium online courses',
      'Exclusive content updates',
      'Personal success coaching',
    ],
  },
];

export default function MembershipScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isNightMode = theme.id === 'night-mode';
  
  // Mock current plan - in a real app this would come from context/backend
  const currentPlanId: SubscriptionTier = 'basic-yearly';
  
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>('advanced-yearly');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);

  const handlePlanSelect = (planId: SubscriptionTier) => {
    const plan = plans.find(p => p.id === planId);
    if (plan?.comingSoon || planId === currentPlanId) return;
    
    if (Platform.OS !== "web") {
      Haptics.selectionAsync();
    }
    setSelectedPlan(planId);
  };

  const handleUpgrade = () => {
    if (Platform.OS !== "web") {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
    setShowConfirmModal(true);
  };

  const confirmPurchase = () => {
    if (Platform.OS !== "web") {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    }
    setShowConfirmModal(false);
    setTimeout(() => {
      setShowSuccessModal(true);
    }, 500);
  };

  const handleSuccessContinue = () => {
    setShowSuccessModal(false);
  };

  const selectedPlanDetails = plans.find(p => p.id === selectedPlan);
  const currentPlanDetails = plans.find(p => p.id === currentPlanId);

  return (
    <View style={styles.container}>
      <LinearGradient 
        colors={isNightMode ? ["#0a0a0f", "#1a0a1f", "#2a0a2f", "#1a0a1f", "#0a0a0f"] : theme.gradients.background as any} 
        style={styles.gradient}
      >
        {/* Header - Removed title, only Back Button */}
        <TouchableOpacity
          style={[styles.backButton, { position: 'absolute', top: insets.top + 10, left: 24, zIndex: 10 }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <ArrowLeft color={theme.colors.text.primary} size={24} strokeWidth={2} />
        </TouchableOpacity>

        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100, paddingTop: insets.top + 60 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Current Plan Section */}
          <View style={[styles.sectionHeader, { marginTop: 0 }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Your Current Plan</Text>
          </View>

          <View style={[
            styles.currentPlanCard, 
            { 
              backgroundColor: isNightMode ? "rgba(255, 215, 0, 0.1)" : `${theme.colors.primary}10`,
              borderColor: theme.colors.primary,
            }
          ]}>
            <View style={styles.currentPlanHeader}>
              <View style={styles.planInfo}>
                <Text style={[styles.currentPlanName, { color: theme.colors.text.primary }]}>
                  {currentPlanDetails?.name}
                </Text>
                <Text style={[styles.currentPlanPrice, { color: theme.colors.primary }]}>
                  {currentPlanDetails?.price}<Text style={{ fontSize: 14, color: theme.colors.text.secondary }}>{currentPlanDetails?.period}</Text>
                </Text>
              </View>
              <View style={[styles.activeBadge, { backgroundColor: theme.colors.primary }]}>
                <Check color="#FFFFFF" size={14} strokeWidth={3} />
                <Text style={styles.activeBadgeText}>Active</Text>
              </View>
            </View>
            <View style={[styles.divider, { backgroundColor: theme.colors.border }]} />
            <View style={styles.featuresList}>
              {currentPlanDetails?.features.slice(0, 3).map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <CheckCircle size={16} color={theme.colors.primary} />
                  <Text style={[styles.featureText, { color: theme.colors.text.secondary }]}>{feature}</Text>
                </View>
              ))}
              <Text style={[styles.moreFeatures, { color: theme.colors.text.secondary }]}>+ {currentPlanDetails?.features.length ? currentPlanDetails.features.length - 3 : 0} more features</Text>
            </View>
          </View>

          {/* Upgrade Section */}
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text.primary }]}>Upgrade Your Experience</Text>
            <Text style={[styles.sectionSubtitle, { color: theme.colors.text.secondary }]}>Unlock the full power of Audrey&apos;s features</Text>
          </View>

          <View style={styles.plansGrid}>
            {plans.map((plan) => {
              const isSelected = selectedPlan === plan.id;
              const isCurrent = currentPlanId === plan.id;
              
              if (isCurrent) return null; // Skip current plan in upgrade list

              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    { 
                      backgroundColor: theme.colors.cardBackground,
                      borderColor: isSelected ? theme.colors.primary : theme.colors.border,
                      borderWidth: isSelected ? 2 : 1,
                      opacity: plan.comingSoon ? 0.7 : 1,
                    },
                    isSelected && {
                      shadowColor: theme.colors.primary,
                      shadowOffset: { width: 0, height: 4 },
                      shadowOpacity: 0.3,
                      shadowRadius: 12,
                      elevation: 8,
                    }
                  ]}
                  onPress={() => handlePlanSelect(plan.id)}
                  activeOpacity={0.9}
                  disabled={plan.comingSoon}
                >
                  {plan.popular && !plan.comingSoon && (
                    <View style={styles.popularBadge}>
                      <LinearGradient
                        colors={theme.gradients.primary as any}
                        style={styles.popularBadgeGradient}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 0 }}
                      >
                        <Star color="#FFFFFF" size={10} fill="#FFFFFF" />
                        <Text style={styles.popularBadgeText}>Best Value</Text>
                      </LinearGradient>
                    </View>
                  )}
                  
                  {plan.comingSoon && (
                     <View style={styles.comingSoonOverlay}>
                       <Text style={[styles.comingSoonText, { color: theme.colors.primary }]}>Coming Soon</Text>
                     </View>
                  )}

                  <View style={styles.planCardContent}>
                    <View style={styles.planHeader}>
                      <Text style={[styles.planName, { color: theme.colors.text.primary }]}>{plan.name}</Text>
                      {plan.badge && (
                        <View style={[styles.saveBadge, { backgroundColor: `${theme.colors.secondary}20` }]}>
                          <Text style={[styles.saveBadgeText, { color: theme.colors.secondary }]}>{plan.badge}</Text>
                        </View>
                      )}
                    </View>
                    
                    <Text style={[styles.planDescription, { color: theme.colors.text.secondary }]}>
                      {plan.description}
                    </Text>
                    
                    <Text style={[styles.planPrice, { color: theme.colors.primary }]}>
                      {plan.price}<Text style={{ fontSize: 14, color: theme.colors.text.secondary }}>{plan.period}</Text>
                    </Text>

                    <View style={[styles.divider, { backgroundColor: theme.colors.border, marginVertical: 12 }]} />
                    
                    <View style={styles.featuresList}>
                      {plan.features.map((feature, idx) => (
                        <View key={idx} style={styles.featureRow}>
                          <Check size={16} color={isSelected ? theme.colors.primary : theme.colors.text.secondary} />
                          <Text style={[
                            styles.featureText, 
                            { color: theme.colors.text.secondary }
                          ]}>{feature}</Text>
                        </View>
                      ))}
                    </View>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>

        {/* Footer with CTA */}
        <View style={[
          styles.footer, 
          { 
            paddingBottom: insets.bottom, 
            backgroundColor: 'transparent',
            borderTopWidth: 0,
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
          }
        ]}>
           <TouchableOpacity
            style={styles.upgradeButton}
            onPress={handleUpgrade}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={theme.gradients.primary as any}
              style={[styles.upgradeGradient, { paddingVertical: 12 }]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Sparkles color="#FFFFFF" size={18} strokeWidth={2} />
              <Text style={[styles.upgradeText, { 
                textShadowColor: 'rgba(255, 255, 255, 0.8)',
                textShadowOffset: { width: 0, height: 0 },
                textShadowRadius: 15,
              }]} numberOfLines={1}>
                Upgrade to {selectedPlanDetails?.name}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Modal Logic Reuse */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showConfirmModal}
          onRequestClose={() => setShowConfirmModal(false)}
        >
          <BlurView intensity={40} tint="dark" style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <LinearGradient
                colors={['rgba(20, 10, 40, 0.95)', 'rgba(60, 20, 20, 0.9)']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.modalCard}
              >
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: '#FFD700' }]}>
                    Confirm Upgrade
                  </Text>
                  <TouchableOpacity onPress={() => setShowConfirmModal(false)} style={styles.closeButton}>
                    <X size={24} color="#A0A0A0" />
                  </TouchableOpacity>
                </View>
                
                <View style={styles.planSummary}>
                  <View style={styles.planIconPlaceholder}>
                    <Crown size={32} color="#D4AF37" />
                  </View>
                  <View>
                    <Text style={[styles.summaryPlanName, { color: '#E8E8E8' }]}>
                      {selectedPlanDetails?.name}
                    </Text>
                    <Text style={[styles.summaryPrice, { color: '#D4AF37' }]}>
                      {selectedPlanDetails?.price}<Text style={{ fontSize: 14, color: '#A0A0A0' }}>{selectedPlanDetails?.period}</Text>
                    </Text>
                  </View>
                </View>
                
                <View style={styles.securityNote}>
                  <ShieldCheck size={16} color="#4ADE80" />
                  <Text style={styles.securityText}>Secured by App Store</Text>
                </View>

                <TouchableOpacity
                  style={styles.confirmButton}
                  onPress={confirmPurchase}
                  activeOpacity={0.9}
                >
                  <LinearGradient
                    colors={['#CD7F32', '#4B0082']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.confirmButtonGradient}
                  >
                    <Text style={styles.confirmButtonText}>Double Click to Pay</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </BlurView>
        </Modal>

        {/* Success Modal */}
        <Modal
          animationType="fade"
          transparent={true}
          visible={showSuccessModal}
          onRequestClose={handleSuccessContinue}
        >
          <BlurView intensity={40} tint="dark" style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <LinearGradient
                  colors={['rgba(20, 10, 40, 0.95)', 'rgba(60, 20, 20, 0.9)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.modalCard, styles.successCard]}
                >
                  <View style={styles.successIconContainer}>
                    <View style={styles.successIconCircle}>
                      <CheckCircle size={56} color="#FFD700" strokeWidth={3} />
                    </View>
                  </View>
                  
                  <Text style={[styles.successTitle, { color: '#FFD700' }]}>
                    Upgrade Successful!
                  </Text>
                  
                  <Text style={styles.successMessage}>
                    Welcome to {selectedPlanDetails?.name}. You now have access to all premium features.
                  </Text>

                  <TouchableOpacity
                    style={styles.confirmButton}
                    onPress={handleSuccessContinue}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={['#CD7F32', '#4B0082']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.confirmButtonGradient}
                    >
                      <Text style={styles.confirmButtonText}>Continue</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
          </BlurView>
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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
  },
  sectionHeader: {
    marginTop: 24,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 14,
    opacity: 0.6,
  },
  currentPlanCard: {
    borderRadius: 24,
    padding: 24,
    borderWidth: 1.5,
  },
  currentPlanHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  planInfo: {
    flex: 1,
  },
  currentPlanName: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 4,
  },
  currentPlanPrice: {
    fontSize: 18,
    fontWeight: '600',
  },
  activeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    gap: 4,
  },
  activeBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  divider: {
    height: 1,
    marginVertical: 16,
    opacity: 0.2,
  },
  featuresList: {
    gap: 10,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  moreFeatures: {
    fontSize: 13,
    fontWeight: '600',
    marginTop: 4,
    marginLeft: 28,
  },
  plansGrid: {
    gap: 16,
  },
  planCard: {
    borderRadius: 24,
    overflow: 'hidden',
    position: 'relative',
  },
  planCardContent: {
    padding: 24,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
  },
  planDescription: {
    fontSize: 14,
    marginBottom: 16,
    lineHeight: 20,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '800',
  },
  saveBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  saveBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  popularBadge: {
    position: 'absolute',
    top: 0,
    right: 0,
    borderBottomLeftRadius: 16,
    overflow: 'hidden',
    zIndex: 10,
  },
  popularBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 16,
    paddingVertical: 6,
  },
  popularBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
  },
  comingSoonOverlay: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  comingSoonText: {
    fontSize: 12,
    fontWeight: '700',
  },
  footer: {
    paddingTop: 20,
    paddingHorizontal: 24,
    borderTopWidth: 1,
  },
  upgradeButton: {
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  upgradeGradient: {
    paddingVertical: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  upgradeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
  },
  modalCard: {
    padding: 24,
    borderRadius: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  modalHeader: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  planSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 24,
    padding: 16,
    backgroundColor: 'rgba(128,128,128,0.1)',
    borderRadius: 16,
    gap: 16,
  },
  planIconPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  summaryPlanName: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  summaryPrice: {
    fontSize: 20,
    fontWeight: '700',
  },
  securityNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 24,
    opacity: 0.8,
  },
  securityText: {
    color: '#888',
    fontSize: 12,
  },
  confirmButton: {
    width: '100%',
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  confirmButtonGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  confirmButtonText: {
    color: '#000',
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  successCard: {
    paddingVertical: 40,
  },
  successIconContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    backgroundColor: 'rgba(255, 215, 0, 0.1)',
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    textAlign: 'center',
    color: '#E0E0E0',
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 16,
    fontWeight: '500',
  },
});
