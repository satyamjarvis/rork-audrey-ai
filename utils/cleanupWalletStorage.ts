import AsyncStorage from '@react-native-async-storage/async-storage';

const WALLET_KEYS_TO_REMOVE = [
  "@wallet_payment_cards",
  "@wallet_transactions",
  "@wallet_loyalty_cards",
  "@wallet_contacts",
  "@wallet_split_bills",
  "@wallet_rewards",
  "@wallet_balance",
  "@wallet_cashback",
  "@wallet_points",
];

export async function cleanupWalletStorage(): Promise<void> {
  console.log('🧹 Starting wallet storage cleanup...');
  
  try {
    for (const key of WALLET_KEYS_TO_REMOVE) {
      try {
        await AsyncStorage.removeItem(key);
        console.log(`✅ Removed wallet key: ${key}`);
      } catch (error) {
        console.error(`❌ Failed to remove key ${key}:`, error);
      }
    }
    
    console.log('✅ Wallet storage cleanup complete!');
  } catch (error) {
    console.error('❌ Error during wallet storage cleanup:', error);
  }
}
