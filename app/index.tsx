import { useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import colors from '@/constants/colors';

export default function Index() {
  const [isChecking, setIsChecking] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const checkAndNavigate = async () => {
      try {
        const value = await AsyncStorage.getItem('intro_shown');
        if (value === 'true') {
          router.replace('/(tabs)/calendly');
        } else {
          router.replace('/intro-splash');
        }
      } catch {
        router.replace('/intro-splash');
      } finally {
        setIsChecking(false);
      }
    };
    
    checkAndNavigate();
  }, [router]);

  if (isChecking) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000',
  },
});
