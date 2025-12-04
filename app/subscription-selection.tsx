import { StyleSheet, Text, View, TouchableOpacity, ScrollView, Animated, Platform, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { router } from 'expo-router';
import { useState, useRef, useEffect } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Crown, Star, Sparkles, X, CheckCircle, ShieldCheck } from 'lucide-react-native';
import { useTheme } from '@/contexts/ThemeContext';
import { useLanguage } from '@/contexts/LanguageContext';

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
};

const plans: SubscriptionPlan[] = [
  {
    id: 'basic-monthly',
    name: 'Basic Monthly',
    price: '$25.99',
    period: '/month',
    type: 'basic',
    features: [
      'Full access to all features',
      'AI-powered assistant',
      'Unlimited planning & tracking',
      'Cloud sync across devices',
      'Priority support',
    ],
  },
  {
    id: 'basic-yearly',
    name: 'Basic Yearly',
    price: '$259.99',
    period: '/year',
    type: 'basic',
    badge: 'Save $52',
    features: [
      'Everything in Basic Monthly',
      'Save $52 per year',
      'Exclusive yearly bonuses',
      'Early access to new features',
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
    features: [
      'Everything in Basic',
      'Access to all online courses',
      'Excel in any field of life',
      'Become extraordinary',
      'VIP support',
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
    features: [
      'Everything in Advanced Monthly',
      'Save $152 per year',
      'Premium online courses',
      'Exclusive content updates',
      'Personal success coaching',
    ],
  },
];

export default function SubscriptionSelectionScreen() {
  const insets = useSafeAreaInsets();

  const { theme } = useTheme();
  const { t } = useLanguage();
  const [selectedPlan, setSelectedPlan] = useState<SubscriptionTier>('basic-yearly');
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const scaleAnims = useRef(plans.map(() => new Animated.Value(1))).current;
  
  const isNightMode = theme.id === 'night-mode';

  useEffect(() => {
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
  }, [fadeAnim, slideAnim]);

  const handlePlanSelect = (planId: SubscriptionTier, index: number) => {
    const plan = plans.find(p => p.id === planId);
    if (plan?.comingSoon) return;

    setSelectedPlan(planId);
    
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.97,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[index], {
        toValue: 1,
        tension: 100,
        friction: 5,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const handleSubscribe = () => {
    setShowConfirmModal(true);
  };

  const confirmPurchase = () => {
    setShowConfirmModal(false);
    // Simulate network request/processing
    setTimeout(() => {
      setShowSuccessModal(true);
    }, 1500);
  };

  const handleSuccessContinue = () => {
    setShowSuccessModal(false);
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 400,
      useNativeDriver: true,
    }).start(() => {
      router.replace('/intro-story');
    });
  };

  const selectedPlanDetails = plans.find(p => p.id === selectedPlan);

  return (
    <LinearGradient
      colors={isNightMode ? ['#000000', '#0A0A0A', '#000000'] : (theme.gradients.background as unknown as readonly [string, string, ...string[]])}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <Modal
        animationType="fade"
        transparent={true}
        visible={showConfirmModal}
        onRequestClose={() => setShowConfirmModal(false)}
      >
        <BlurView intensity={40} tint="dark" style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <LinearGradient
              colors={['rgba(20, 10, 40, 0.85)', 'rgba(60, 20, 20, 0.8)']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.modalCard}
            >
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: '#FFD700', textShadowColor: 'rgba(205, 127, 50, 0.5)', textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 4 }]}>
                  {t.confirmSubscription}
                </Text>
                <TouchableOpacity onPress={() => setShowConfirmModal(false)} style={styles.closeButton}>
                  <X size={20} color="#A0A0A0" />
                </TouchableOpacity>
              </View>
              
              <View style={[styles.planSummary, { backgroundColor: 'rgba(0,0,0,0.2)', borderColor: 'rgba(255,215,0,0.1)', borderWidth: 1 }]}>
                <View style={[styles.planIconPlaceholder, { backgroundColor: 'rgba(255, 215, 0, 0.1)' }]}>
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
                <ShieldCheck size={14} color="#4ADE80" />
                <Text style={[styles.securityText, { color: '#A0A0A0' }]}>{t.securedByAppStore}</Text>
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
                  <Text style={[styles.confirmButtonText, { color: '#FFFFFF' }]}>{t.doubleClickToPay}</Text>
                </LinearGradient>
              </TouchableOpacity>
              
              <TouchableOpacity onPress={() => setShowConfirmModal(false)}>
                <Text style={[styles.cancelText, { color: '#A0A0A0' }]}>{t.cancel}</Text>
              </TouchableOpacity>
            </LinearGradient>
          </View>
        </BlurView>
      </Modal>

      <Modal
        animationType="fade"
        transparent={true}
        visible={showSuccessModal}
        onRequestClose={handleSuccessContinue}
      >
        <BlurView intensity={40} tint="dark" style={styles.modalOverlay}>
              <View style={styles.modalContent}>
                <LinearGradient
                  colors={['rgba(20, 10, 40, 0.85)', 'rgba(60, 20, 20, 0.8)']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[styles.modalCard, styles.successCard]}
                >
                  <View style={styles.successIconContainer}>
                    <View style={styles.planetGlow} />
                    <LinearGradient
                       colors={['#4B0082', '#CD7F32']} // Dark Purple to Bronze
                       start={{ x: 0.2, y: 0.1 }}
                       end={{ x: 0.8, y: 0.9 }}
                       style={styles.successIconCircle}
                    >
                      <View style={styles.planetRing} />
                      <CheckCircle size={48} color="#FFD700" strokeWidth={3} />
                    </LinearGradient>
                  </View>
                  
                  <Text style={[styles.successTitle, { color: '#FFD700' }]}>
                    {t.youreAllSet}
                  </Text>
                  
                  <Text style={styles.successMessage}>
                    {t.welcomeToPremium}
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
                      <Text style={[styles.confirmButtonText, { color: '#FFFFFF' }]}>{t.letsGo}</Text>
                    </LinearGradient>
                  </TouchableOpacity>
                </LinearGradient>
              </View>
        </BlurView>
      </Modal>

      <Animated.View 
        style={[
          styles.content, 
          { 
            paddingTop: insets.top + 20,
            paddingBottom: Math.max(insets.bottom, 20) + 20,
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
                <Crown 
                  color={isNightMode ? '#000000' : theme.colors.cardBackground} 
                  size={24} 
                  strokeWidth={2} 
                />
              </LinearGradient>
            </View>
            <Text style={[styles.title, { 
              color: isNightMode ? theme.colors.text.secondary : theme.colors.primary,
              textShadowColor: isNightMode ? 'rgba(255, 215, 0, 0.5)' : `${theme.colors.primary}33`
            }]}>{t.chooseYourPremiumPlan}</Text>
            <Text style={[styles.subtitle, { 
              color: isNightMode ? theme.colors.text.light : theme.colors.text.secondary 
            }]}>{t.unlockFullPower}</Text>
          </View>

          <View style={{ flex: 1, justifyContent: 'center' }}>
            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.plansList}
              horizontal={true}
              showsHorizontalScrollIndicator={false}
            >
              {plans.map((plan, index) => {
                const isSelected = selectedPlan === plan.id;
                return (
                  <Animated.View
                    key={plan.id}
                    style={[
                      styles.planCardWrapper,
                      { transform: [{ scale: scaleAnims[index] }] },
                    ]}
                  >
                    <TouchableOpacity
                      style={[
                        styles.planCard,
                        { backgroundColor: isNightMode ? 'rgba(26, 26, 26, 0.4)' : theme.colors.cardBackground },
                        isSelected && styles.planCardSelected,
                        isSelected && { borderColor: isNightMode ? '#FFD700' : theme.colors.primary },
                        plan.popular && styles.planCardPopular,
                        plan.comingSoon && styles.planCardDisabled,
                      ]}
                      onPress={() => handlePlanSelect(plan.id, index)}
                      activeOpacity={plan.comingSoon ? 1 : 0.85}
                    >
                      {plan.popular && !plan.comingSoon && (
                        <View style={styles.popularBadge}>
                          <LinearGradient
                            colors={isNightMode ? ['#FFD700', '#FF00FF'] : (theme.gradients.primary as unknown as readonly [string, string, ...string[]])}
                            style={styles.popularBadgeGradient}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 0 }}
                          >
                            <Star 
                              color={isNightMode ? '#000000' : theme.colors.cardBackground} 
                              size={8} 
                              strokeWidth={2.5} 
                              fill={isNightMode ? '#000000' : theme.colors.cardBackground}
                            />
                            <Text style={[styles.popularBadgeText, { 
                              color: isNightMode ? '#000000' : theme.colors.cardBackground 
                            }]}>{t.popular}</Text>
                          </LinearGradient>
                        </View>
                      )}

                      {plan.comingSoon && (
                        <View style={styles.comingSoonOverlay}>
                           <LinearGradient
                              colors={['rgba(255, 215, 0, 0.1)', 'rgba(255, 255, 255, 0.2)', 'rgba(255, 215, 0, 0.1)']}
                              start={{ x: 0, y: 0 }}
                              end={{ x: 1, y: 1 }}
                              style={styles.comingSoonGradient}
                           >
                             <Text style={styles.comingSoonText}>{t.comingSoon}!</Text>
                           </LinearGradient>
                        </View>
                      )}

                      {isSelected && (
                        <LinearGradient
                          colors={['rgba(212, 175, 55, 0.15)', 'rgba(212, 20, 90, 0.1)']}
                          style={styles.selectedOverlay}
                        />
                      )}

                      <View style={styles.planHeader}>
                        <View style={styles.planTitleContainer}>
                          <Text style={[
                            styles.planName,
                            { color: isNightMode ? '#E8E8E8' : theme.colors.text.primary },
                            isSelected && styles.planNameSelected,
                            isSelected && { color: isNightMode ? '#FFD700' : theme.colors.primary }
                          ]} numberOfLines={1} adjustsFontSizeToFit>{plan.name}</Text>
                          {plan.badge && (
                            <View style={styles.saveBadge}>
                              <Text style={styles.saveBadgeText}>{plan.badge}</Text>
                            </View>
                          )}
                        </View>
                        <View style={styles.priceContainer}>
                          <Text style={[
                            styles.price,
                            { color: isNightMode ? '#D4AF37' : theme.colors.primary },
                            isSelected && styles.priceSelected,
                            isSelected && { color: isNightMode ? '#FFD700' : theme.colors.primary }
                          ]}>{plan.price}</Text>
                          <Text style={[styles.period, { 
                            color: isNightMode ? '#A8A8A8' : theme.colors.text.secondary 
                          }]}>{plan.period}</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </Animated.View>
                );
              })}
            </ScrollView>
            
            <View style={styles.detailsNoteContainer}>
               <Text style={[styles.detailsNote, { color: isNightMode ? '#A8A8A8' : theme.colors.text.secondary }]}>
                 {t.viewPlanDetails}
               </Text>
            </View>
          </View>

          <View style={styles.footer}>
            <TouchableOpacity
              style={styles.subscribeButton}
              onPress={handleSubscribe}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={isNightMode ? ['#FFD700', '#FF00FF', '#FFD700'] : (theme.gradients.primary as unknown as readonly [string, string, ...string[]])}
                style={styles.subscribeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View style={styles.buttonIconAbsolute}>
                  <Sparkles 
                    color={isNightMode ? '#000000' : theme.colors.cardBackground} 
                    size={16} 
                    strokeWidth={2.5} 
                  />
                </View>
                <Text style={[styles.subscribeButtonText, { 
                  color: isNightMode ? '#000000' : theme.colors.cardBackground 
                }]}>{t.continueWithPlan}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <Text style={[styles.footerNote, { 
              color: isNightMode ? theme.colors.text.light : theme.colors.text.secondary 
            }]}>
              {t.cancelAnytime}. {t.noHiddenFees}.
            </Text>

          </View>
      </Animated.View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'space-between' as const,
  },

  header: {
    alignItems: 'center' as const,
    marginBottom: 16,
  },
  iconContainer: {
    marginBottom: 16,
  },
  iconGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 2,
    borderColor: '#2E7D32',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#D4AF37',
    marginBottom: 8,
    letterSpacing: 0.5,
    textAlign: 'center' as const,
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
    fontSize: 12,
    fontWeight: '400' as const,
    color: '#4ADE80',
    textAlign: 'center' as const,
    letterSpacing: 0.2,
    lineHeight: 16,
  },
  scrollView: {
    flexGrow: 0,
    marginBottom: 10,
  },
  plansList: {
    paddingHorizontal: 4,
    paddingVertical: 10,
    flexDirection: 'row',
    gap: 12,
  },
  planCardWrapper: {
    width: 140,
  },
  planCard: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 26, 0.4)',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: 'rgba(46, 125, 50, 0.3)',
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    height: 120,
    justifyContent: 'center',
  },
  planCardSelected: {
    backgroundColor: 'rgba(20, 20, 20, 0.6)',
    borderColor: '#D4AF37',
    borderWidth: 2,
    elevation: 8,
    shadowColor: '#FFD700',
    shadowOpacity: 0.4,
    shadowRadius: 16,
    transform: [{ scale: 1.02 }],
  },
  planCardDisabled: {
    opacity: 0.7,
  },
  planCardPopular: {
    borderColor: 'rgba(212, 175, 55, 0.5)',
  },
  comingSoonOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 20,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 14,
    overflow: 'hidden',
  },
  comingSoonGradient: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  comingSoonText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#FFD700',
    textAlign: 'center',
    textShadowColor: 'rgba(255, 255, 255, 0.8)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
    transform: [{ rotate: '-15deg' }],
    letterSpacing: 1,
  },
  popularBadge: {
    position: 'absolute' as const,
    top: -2,
    right: -2,
    zIndex: 10,
    borderRadius: 8,
    overflow: 'hidden',
  },
  popularBadgeGradient: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 8,
  },
  popularBadgeText: {
    fontSize: 9,
    fontWeight: '700' as const,
    color: '#0A0A0A',
    letterSpacing: 0.3,
  },
  selectedOverlay: {
    position: 'absolute' as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  planHeader: {
    marginBottom: 0,
    alignItems: 'center',
  },
  planTitleContainer: {
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    gap: 4,
    marginBottom: 8,
  },
  planName: {
    fontSize: 13,
    fontWeight: '700' as const,
    color: '#E8E8E8',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  planNameSelected: {
    color: '#FFD700',
  },
  saveBadge: {
    backgroundColor: 'rgba(74, 222, 128, 0.2)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#4ADE80',
  },
  saveBadgeText: {
    fontSize: 8,
    fontWeight: '600' as const,
    color: '#4ADE80',
    letterSpacing: 0.2,
  },
  priceContainer: {
    flexDirection: 'column' as const,
    alignItems: 'center' as const,
    justifyContent: 'center',
  },
  price: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#D4AF37',
    letterSpacing: 0.4,
  },
  priceSelected: {
    color: '#FFD700',
  },
  period: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: '#A8A8A8',
    marginTop: 0,
  },
  featuresContainer: {
    display: 'none',
  },
  featureRow: {
    display: 'none',
  },
  detailsNoteContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  detailsNote: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    opacity: 0.8,
  },
  checkIconContainer: {
    width: 14,
    height: 14,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  featureText: {
    fontSize: 10,
    fontWeight: '500' as const,
    color: '#C0C0C0',
    letterSpacing: 0.2,
    flex: 1,
  },
  featureTextSelected: {
    color: '#E8E8E8',
  },
  footer: {
    paddingTop: 16,
    gap: 8,
  },
  subscribeButton: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  subscribeButtonGradient: {
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  },
  buttonIconAbsolute: {
    position: 'absolute',
    left: 20,
    height: '100%',
    justifyContent: 'center',
  },
  subscribeButtonText: {
    color: '#0A0A0A',
    fontSize: 14,
    fontWeight: '600' as const,
    letterSpacing: 0.3,
    fontFamily: Platform.select({
      ios: 'System',
      android: 'sans-serif',
      web: 'system-ui, -apple-system, sans-serif',
    }),
  },
  footerNote: {
    fontSize: 10,
    fontWeight: '400' as const,
    color: '#6B7280',
    textAlign: 'center' as const,
    letterSpacing: 0.2,
    lineHeight: 14,
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
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
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
    height: 50,
    borderRadius: 25,
    overflow: 'hidden',
    marginBottom: 16,
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
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  cancelText: {
    color: '#888',
    fontSize: 14,
    fontWeight: '500',
  },
  successCard: {
    paddingVertical: 40,
  },
  successIconContainer: {
    marginBottom: 24,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  planetGlow: {
    position: 'absolute',
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#CD7F32',
    opacity: 0.3,
    shadowColor: '#CD7F32',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 20,
    elevation: 10,
  },
  successIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.3)',
    overflow: 'visible', // Changed to visible for ring
  },
  planetRing: {
    position: 'absolute',
    width: 110,
    height: 25,
    borderRadius: 100,
    borderWidth: 2,
    borderColor: 'rgba(205, 127, 50, 0.6)',
    transform: [{ rotate: '-25deg' }],
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: 0.5,
    textAlign: 'center',
    textShadowColor: 'rgba(205, 127, 50, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 10,
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
