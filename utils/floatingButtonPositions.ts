import AsyncStorage from '@react-native-async-storage/async-storage';
import { Dimensions } from 'react-native';
import { safeJSONParse } from './asyncStorageHelpers';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const BUTTON_SIZE = 64;
const PADDING = 20;
const HEADER_HEIGHT = 120; // Account for header + safe area

// Calculate center for layout
const CENTER_Y = SCREEN_HEIGHT * 0.55; // Lowered from center (0.5) to 0.55

export interface ButtonPosition {
  x: number;
  y: number;
}

// Helper to calculate position on a Left Curve
// index: position index (0 to total-1)
// total: total number of items
const getLeftCurvePosition = (index: number, total: number): ButtonPosition => {
  const verticalSpan = SCREEN_HEIGHT * 0.6; // Span 60% of screen height
  const startY = CENTER_Y - verticalSpan / 2;
  const stepY = verticalSpan / (total - 1);
  
  const y = startY + index * stepY;
  
  // Calculate X based on Y distance from center
  // Parabolic curve: x peak at center, lower at ends
  const yFromCenter = y - CENTER_Y;
  const normalizedY = yFromCenter / (verticalSpan / 2); // -1 to 1
  
  // Curve equation: x = base + amplitude * (1 - y^2)
  const curveAmplitude = 40;
  const baseX = 10;
  const x = baseX + curveAmplitude * (1 - normalizedY * normalizedY);

  return {
    x,
    y: y - BUTTON_SIZE / 2, // Center the button on the point
  };
};

// Total buttons in the layout (excluding Audrey)
const TOTAL_BUTTONS = 10;

// Helper to calculate position on a Circle (Universe Mode)
const getCirclePosition = (index: number, total: number): ButtonPosition => {
  const radius = SCREEN_WIDTH * 0.38; // 38% of screen width
  const angleStep = (2 * Math.PI) / total;
  const startAngle = -Math.PI / 2; // Start from top (-90 degrees)
  
  const angle = startAngle + index * angleStep;
  
  // Center of the circle
  const centerX = SCREEN_WIDTH / 2;
  const centerY = SCREEN_HEIGHT * 0.55;
  
  const x = centerX + radius * Math.cos(angle) - BUTTON_SIZE / 2;
  const y = centerY + radius * Math.sin(angle) - BUTTON_SIZE / 2;

  return { x, y };
};

// Universe Mode Circle Layout
const UNIVERSE_BUTTONS = [
  'sun',      // Top
  'brain',    // Top Right
  'moon',     // Right
  'planner',  // Bottom Right
  'track',    // Bottom
  'chat',     // Bottom Left
  'calendly', // Left
  'contacts', // Top Left
  'settings'  // Top Left (High)
];

export const getUniversePosition = (buttonId: string): ButtonPosition | null => {
  const index = UNIVERSE_BUTTONS.indexOf(buttonId);
  if (index === -1) return null;
  return getCirclePosition(index, UNIVERSE_BUTTONS.length);
};

export const DEFAULT_POSITIONS: Record<string, ButtonPosition> = {
  // Left Curve Arrangement
  // Arranged so Sun (3), Brain (5), Moon (7) are distributed.
  
  planner: getLeftCurvePosition(0, TOTAL_BUTTONS),
  track: getLeftCurvePosition(1, TOTAL_BUTTONS),  
  chat: getLeftCurvePosition(2, TOTAL_BUTTONS),
  
  // Sun stays at 3
  sun: { ...getLeftCurvePosition(3, TOTAL_BUTTONS), x: getLeftCurvePosition(3, TOTAL_BUTTONS).x - 20 },
  
  // Camera next to Brain
  camera: getLeftCurvePosition(4, TOTAL_BUTTONS),
  
  // Brain moves to 5 (middle of 3 and 7)
  brain: getLeftCurvePosition(5, TOTAL_BUTTONS),

  // Moon moves to 7 (closer to bottom)
  moon: { ...getLeftCurvePosition(7, TOTAL_BUTTONS), x: getLeftCurvePosition(7, TOTAL_BUTTONS).x - 20 },
  
  // Filling gaps
  calendly: getLeftCurvePosition(6, TOTAL_BUTTONS), 
  contacts: getLeftCurvePosition(8, TOTAL_BUTTONS), 
  settings: getLeftCurvePosition(9, TOTAL_BUTTONS), 

  // Audrey (Bottom Right - Closer to corner and lower)
  audrey: {
    x: SCREEN_WIDTH - BUTTON_SIZE - 20,
    y: SCREEN_HEIGHT - BUTTON_SIZE - 20, // Adjusted to be a bit higher from bottom edge
  },
};

// Default circle positions for Universe page
export const UNIVERSE_DEFAULT_POSITIONS: Record<string, ButtonPosition> = {
  sun: getCirclePosition(0, UNIVERSE_BUTTONS.length),      // Top
  brain: getCirclePosition(1, UNIVERSE_BUTTONS.length),    // Top Right
  moon: getCirclePosition(2, UNIVERSE_BUTTONS.length),     // Right
  planner: getCirclePosition(3, UNIVERSE_BUTTONS.length),  // Bottom Right
  track: getCirclePosition(4, UNIVERSE_BUTTONS.length),    // Bottom
  chat: getCirclePosition(5, UNIVERSE_BUTTONS.length),     // Bottom Left
  calendly: getCirclePosition(6, UNIVERSE_BUTTONS.length), // Left
  contacts: getCirclePosition(7, UNIVERSE_BUTTONS.length), // Top Left
  settings: getCirclePosition(8, UNIVERSE_BUTTONS.length), // Top Left (High)
  
  audrey: {
    x: SCREEN_WIDTH - BUTTON_SIZE - 20,
    y: SCREEN_HEIGHT - BUTTON_SIZE - 20,
  },
};

// Get default position for a button (synchronous)
export function getDefaultPosition(buttonId: string, isUniversePage: boolean = false): ButtonPosition {
  const defaultPositions = isUniversePage ? UNIVERSE_DEFAULT_POSITIONS : DEFAULT_POSITIONS;
  return defaultPositions[buttonId] || { x: PADDING, y: HEADER_HEIGHT };
}

// Changed storage key to force update to new positions
const STORAGE_KEY = '@floating_button_positions_v17';
const UNIVERSE_STORAGE_KEY = '@floating_button_positions_universe_v2';

export async function hasStoredPosition(buttonId: string, isUniversePage: boolean = false): Promise<boolean> {
  try {
    const storedPositions = await getStoredPositions(isUniversePage);
    return !!storedPositions[buttonId];
  } catch (error) {
    console.error('Error checking stored position:', error);
    return false;
  }
}

export async function saveButtonPosition(buttonId: string, position: ButtonPosition, isUniversePage: boolean = false): Promise<void> {
  try {
    const storageKey = isUniversePage ? UNIVERSE_STORAGE_KEY : STORAGE_KEY;
    const storedPositions = await getStoredPositions(isUniversePage);
    storedPositions[buttonId] = position;
    await AsyncStorage.setItem(storageKey, JSON.stringify(storedPositions));
    console.log(`[FloatingButton] Saved ${buttonId} position for ${isUniversePage ? 'universe' : 'regular'} page:`, position);
  } catch (error) {
    console.error('Error saving button position:', error);
  }
}

export async function getButtonPosition(buttonId: string, isUniversePage: boolean = false): Promise<ButtonPosition> {
  try {
    const storedPositions = await getStoredPositions(isUniversePage);
    // Check if there's a stored position for this button
    if (storedPositions[buttonId]) {
      console.log(`[FloatingButton] Loaded ${buttonId} position for ${isUniversePage ? 'universe' : 'regular'} page:`, storedPositions[buttonId]);
      return storedPositions[buttonId];
    }
    // Use universe circle positions for universe page, curve positions for other pages
    const defaultPositions = isUniversePage ? UNIVERSE_DEFAULT_POSITIONS : DEFAULT_POSITIONS;
    return defaultPositions[buttonId] || { x: PADDING, y: HEADER_HEIGHT };
  } catch (error) {
    console.error('Error getting button position:', error);
    const defaultPositions = isUniversePage ? UNIVERSE_DEFAULT_POSITIONS : DEFAULT_POSITIONS;
    return defaultPositions[buttonId] || { x: PADDING, y: HEADER_HEIGHT };
  }
}

export async function resetButtonPosition(buttonId: string, isUniversePage: boolean = false): Promise<void> {
  try {
    const storageKey = isUniversePage ? UNIVERSE_STORAGE_KEY : STORAGE_KEY;
    const storedPositions = await getStoredPositions(isUniversePage);
    delete storedPositions[buttonId];
    await AsyncStorage.setItem(storageKey, JSON.stringify(storedPositions));
  } catch (error) {
    console.error('Error resetting button position:', error);
  }
}

export async function resetAllButtonPositions(isUniversePage: boolean = false): Promise<void> {
  try {
    const storageKey = isUniversePage ? UNIVERSE_STORAGE_KEY : STORAGE_KEY;
    await AsyncStorage.removeItem(storageKey);
  } catch (error) {
    console.error('Error resetting all button positions:', error);
  }
}

async function getStoredPositions(isUniversePage: boolean = false): Promise<Record<string, ButtonPosition>> {
  try {
    const storageKey = isUniversePage ? UNIVERSE_STORAGE_KEY : STORAGE_KEY;
    const stored = await AsyncStorage.getItem(storageKey);
    return safeJSONParse<Record<string, ButtonPosition>>(stored, {});
  } catch (error) {
    console.error('Error reading stored positions:', error);
  }
  return {};
}
