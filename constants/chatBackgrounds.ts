import { ChatTheme } from "@/contexts/ChatContext";

export const CHAT_BACKGROUNDS: ChatTheme[] = [
  // ===== SOLID COLORS (iOS Inspired) =====
  // Clean, system-like colors
  { id: 'solid-ios-black', type: 'solid', colors: ['#000000'], name: 'Midnight Black' },
  { id: 'solid-ios-white', type: 'solid', colors: ['#F2F2F7'], name: 'System Gray 6' },
  { id: 'solid-ios-blue', type: 'solid', colors: ['#007AFF'], name: 'System Blue' },
  { id: 'solid-ios-mint', type: 'solid', colors: ['#00C7BE'], name: 'Mint' },
  { id: 'solid-ios-indigo', type: 'solid', colors: ['#5856D6'], name: 'Indigo' },
  { id: 'solid-ios-pink', type: 'solid', colors: ['#FF2D55'], name: 'Pink' },
  { id: 'solid-ios-orange', type: 'solid', colors: ['#FF9500'], name: 'Orange' },
  { id: 'solid-ios-gray', type: 'solid', colors: ['#8E8E93'], name: 'Gray' },

  // ===== GRADIENTS (iOS Wallpaper Style) =====
  // Elegant, smooth gradients
  
  // The "Aurora" look (Blues/Greens/Purples)
  { id: 'gradient-ios-aurora', type: 'gradient', colors: ['#2E3192', '#1BFFFF'], name: 'Aurora' },
  { id: 'gradient-ios-northern', type: 'gradient', colors: ['#43cea2', '#185a9d'], name: 'Northern Lights' },
  
  // The "Warm" look (Sunset/Sunrise)
  { id: 'gradient-ios-sunrise', type: 'gradient', colors: ['#ff9966', '#ff5e62'], name: 'Sunrise' },
  { id: 'gradient-ios-sunset', type: 'gradient', colors: ['#654ea3', '#eaafc8'], name: 'Ultraviolet' },
  
  // The "Ocean" look
  { id: 'gradient-ios-ocean', type: 'gradient', colors: ['#2193b0', '#6dd5ed'], name: 'Pacific' },
  { id: 'gradient-ios-deep', type: 'gradient', colors: ['#141E30', '#243B55'], name: 'Deep Blue' },
  
  // The "Pro" look (Darker, metallic)
  { id: 'gradient-ios-titanium', type: 'gradient', colors: ['#2c3e50', '#4ca1af'], name: 'Titanium Blue' },
  { id: 'gradient-ios-graphite', type: 'gradient', colors: ['#232526', '#414345'], name: 'Graphite' },
  
  // The "Pastel" look (Light mode friendly)
  { id: 'gradient-ios-cotton', type: 'gradient', colors: ['#E0C3FC', '#8EC5FC'], name: 'Cotton Candy' },
  { id: 'gradient-ios-peach', type: 'gradient', colors: ['#fad0c4', '#ffd1ff'], name: 'Peach' },
  
  // Vibrant
  { id: 'gradient-ios-hyper', type: 'gradient', colors: ['#DA22FF', '#9733EE'], name: 'Hyper Grape' },
  { id: 'gradient-ios-lush', type: 'gradient', colors: ['#56ab2f', '#a8e063'], name: 'Lush Green' },


  // ===== ANIMATED (Subtle Motion) =====
  // Using existing animation types but with iOS-tuned colors
  
  { id: 'anim-ios-stars', type: 'animated', colors: ['#0F2027', '#203A43', '#2C5364'], animation: 'stars', name: 'Cosmic Drift' },
  { id: 'anim-ios-snow', type: 'animated', colors: ['#243B55', '#141E30'], animation: 'snow', name: 'Winter Night' },
  { id: 'anim-ios-bubbles', type: 'animated', colors: ['#1A2980', '#26D0CE'], animation: 'bubbles', name: 'Aqua Flow' },
  { id: 'anim-ios-magic', type: 'animated', colors: ['#8E2DE2', '#4A00E0'], animation: 'floating-shapes', name: 'Mystic' },
  { id: 'anim-ios-night', type: 'animated', colors: ['#000000', '#434343'], animation: 'rain', name: 'Night Rain' },
];

export const getThemesByType = (type: 'solid' | 'gradient' | 'animated'): ChatTheme[] => {
  return CHAT_BACKGROUNDS.filter(bg => bg.type === type);
};

export const getThemeById = (id: string): ChatTheme => {
  return CHAT_BACKGROUNDS.find(bg => bg.id === id) || CHAT_BACKGROUNDS[0];
};
