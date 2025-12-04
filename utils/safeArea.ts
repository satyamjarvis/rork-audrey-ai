import { Platform } from 'react-native';

/**
 * Standard safe area padding values for consistent spacing across the app
 */
export const SAFE_AREA_PADDING = {
  // Top padding for screens (accounting for status bar and providing comfortable spacing)
  TOP: 24,
  
  // Bottom padding when tab bar is visible
  BOTTOM_WITH_TAB: Platform.OS === 'ios' ? 110 : 105,
  
  // Bottom padding when tab bar is not visible
  BOTTOM_NO_TAB: 20,
  
  // Additional padding for scroll view content to ensure last items are visible
  SCROLL_CONTENT_BOTTOM: 100,
  
  // Modal bottom padding
  MODAL_BOTTOM: 20,
} as const;

/**
 * Helper to calculate top padding with safe area insets
 */
export function getTopPadding(insetTop: number, additionalPadding: number = SAFE_AREA_PADDING.TOP): number {
  return insetTop + additionalPadding;
}

/**
 * Helper to calculate bottom padding with safe area insets
 */
export function getBottomPadding(
  insetBottom: number,
  hasTabBar: boolean = true,
  isScrollContent: boolean = false
): number {
  if (isScrollContent) {
    return insetBottom + SAFE_AREA_PADDING.SCROLL_CONTENT_BOTTOM;
  }
  
  return hasTabBar 
    ? SAFE_AREA_PADDING.BOTTOM_WITH_TAB 
    : insetBottom + SAFE_AREA_PADDING.BOTTOM_NO_TAB;
}