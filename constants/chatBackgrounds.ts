import { ChatTheme } from "@/contexts/ChatContext";

export const CHAT_BACKGROUNDS: ChatTheme[] = [
  // ===== SOLID COLORS =====
  // Dark Tones
  { id: 'solid-black', type: 'solid', colors: ['#000000'], name: 'Pure Black' },
  { id: 'solid-charcoal', type: 'solid', colors: ['#1c1c1e'], name: 'Charcoal' },
  { id: 'solid-graphite', type: 'solid', colors: ['#2c2c2e'], name: 'Graphite' },
  { id: 'solid-slate', type: 'solid', colors: ['#3a3a3c'], name: 'Slate' },
  
  // Cool Tones
  { id: 'solid-navy', type: 'solid', colors: ['#0a192f'], name: 'Navy' },
  { id: 'solid-midnight', type: 'solid', colors: ['#191970'], name: 'Midnight' },
  { id: 'solid-indigo', type: 'solid', colors: ['#1a0a3e'], name: 'Indigo' },
  { id: 'solid-sapphire', type: 'solid', colors: ['#082a4d'], name: 'Sapphire' },
  { id: 'solid-teal', type: 'solid', colors: ['#0d3d3d'], name: 'Teal' },
  
  // Warm Tones  
  { id: 'solid-burgundy', type: 'solid', colors: ['#2d0a0f'], name: 'Burgundy' },
  { id: 'solid-maroon', type: 'solid', colors: ['#3d0814'], name: 'Maroon' },
  { id: 'solid-wine', type: 'solid', colors: ['#2e0c18'], name: 'Wine' },
  { id: 'solid-plum', type: 'solid', colors: ['#1a0a1f'], name: 'Plum' },
  { id: 'solid-chocolate', type: 'solid', colors: ['#2d1f1a'], name: 'Chocolate' },
  
  // Nature Tones
  { id: 'solid-forest', type: 'solid', colors: ['#0d1f0d'], name: 'Forest' },
  { id: 'solid-moss', type: 'solid', colors: ['#1a2f1a'], name: 'Moss' },
  { id: 'solid-olive', type: 'solid', colors: ['#2d2f1a'], name: 'Olive' },

  // ===== GRADIENTS =====
  // Classic iOS Gradients
  { id: 'gradient-cosmic', type: 'gradient', colors: ['#0a0a0f', '#1a0a1f', '#2a0a2f', '#1a0a1f', '#0a0a0f'], name: 'Cosmic' },
  { id: 'gradient-ocean', type: 'gradient', colors: ['#0f2027', '#203a43', '#2c5364'], name: 'Ocean' },
  { id: 'gradient-sunset', type: 'gradient', colors: ['#2b1055', '#7597de'], name: 'Sunset' },
  { id: 'gradient-aurora', type: 'gradient', colors: ['#1a0a2e', '#16213e', '#0f3460'], name: 'Aurora' },
  { id: 'gradient-twilight', type: 'gradient', colors: ['#0a0612', '#1e0a2e', '#2e0a46'], name: 'Twilight' },
  
  // Warm Gradients
  { id: 'gradient-fire', type: 'gradient', colors: ['#4a0000', '#880000', '#c60000'], name: 'Fire' },
  { id: 'gradient-ember', type: 'gradient', colors: ['#2d0a0f', '#5a0a1f', '#880f2f'], name: 'Ember' },
  { id: 'gradient-gold', type: 'gradient', colors: ['#141414', '#332a00', '#665400'], name: 'Gold' },
  { id: 'gradient-bronze', type: 'gradient', colors: ['#1a0f0a', '#3d2414', '#63391f'], name: 'Bronze' },
  { id: 'gradient-copper', type: 'gradient', colors: ['#2d1a0a', '#5a2f14', '#8a451f'], name: 'Copper' },
  
  // Cool Gradients
  { id: 'gradient-arctic', type: 'gradient', colors: ['#0a1a2a', '#1a3a4a', '#2a5a6a'], name: 'Arctic' },
  { id: 'gradient-sapphire', type: 'gradient', colors: ['#0a0a3d', '#141464', '#1f1f8c'], name: 'Sapphire' },
  { id: 'gradient-emerald', type: 'gradient', colors: ['#0a2d0a', '#145214', '#1f7a1f'], name: 'Emerald' },
  { id: 'gradient-jade', type: 'gradient', colors: ['#0a2d2d', '#145252', '#1f7a7a'], name: 'Jade' },
  { id: 'gradient-amethyst', type: 'gradient', colors: ['#2d0a2d', '#521452', '#7a1f7a'], name: 'Amethyst' },
  
  // Nature Gradients
  { id: 'gradient-forest', type: 'gradient', colors: ['#0d1f0d', '#1a3d1a', '#2a5a2a'], name: 'Forest' },
  { id: 'gradient-meadow', type: 'gradient', colors: ['#1a2f0a', '#2f5214', '#4a7a1f'], name: 'Meadow' },
  { id: 'gradient-storm', type: 'gradient', colors: ['#1a1a2d', '#2d2d4a', '#4a4a6a'], name: 'Storm' },
  { id: 'gradient-dusk', type: 'gradient', colors: ['#2d1a3d', '#4a2d5a', '#6a4a7a'], name: 'Dusk' },
  
  // Modern/Tech Gradients
  { id: 'gradient-matrix', type: 'gradient', colors: ['#000000', '#003300', '#0f9b0f'], name: 'Matrix' },
  { id: 'gradient-cyber', type: 'gradient', colors: ['#0a0a1f', '#1f0a3d', '#3d1f5a'], name: 'Cyber' },
  { id: 'gradient-neon', type: 'gradient', colors: ['#0a0a0f', '#1f0a1f', '#3d1f3d'], name: 'Neon' },
  { id: 'gradient-volt', type: 'gradient', colors: ['#0f0a1f', '#1f143d', '#3d285a'], name: 'Volt' },
  { id: 'gradient-midnight', type: 'gradient', colors: ['#232526', '#414345'], name: 'Midnight' },

  // ===== ANIMATED =====
  // Sky & Space
  { id: 'anim-stars', type: 'animated', colors: ['#000000', '#0a0a2a'], animation: 'stars', name: 'Starry Night' },
  { id: 'anim-galaxy', type: 'animated', colors: ['#0a0014', '#1a0a2e'], animation: 'stars', name: 'Galaxy' },
  { id: 'anim-nebula', type: 'animated', colors: ['#140a1f', '#2a143d'], animation: 'stars', name: 'Nebula' },
  { id: 'anim-cosmos', type: 'animated', colors: ['#0a0a1a', '#1a0a3a'], animation: 'stars', name: 'Cosmos' },
  
  // Water & Ocean
  { id: 'anim-bubbles', type: 'animated', colors: ['#000033', '#000066'], animation: 'bubbles', name: 'Deep Sea' },
  { id: 'anim-ocean', type: 'animated', colors: ['#001a33', '#00334d'], animation: 'bubbles', name: 'Ocean Depth' },
  { id: 'anim-lagoon', type: 'animated', colors: ['#0a2a3a', '#143d52'], animation: 'bubbles', name: 'Lagoon' },
  { id: 'anim-coral', type: 'animated', colors: ['#1a2d3a', '#2d4a5a'], animation: 'bubbles', name: 'Coral Reef' },
  
  // Weather
  { id: 'anim-rain', type: 'animated', colors: ['#1a1a1a', '#2a2a2a'], animation: 'rain', name: 'Rainy Day' },
  { id: 'anim-storm', type: 'animated', colors: ['#0f1f2a', '#1f3a4a'], animation: 'rain', name: 'Storm' },
  { id: 'anim-monsoon', type: 'animated', colors: ['#1a2a2a', '#2a4545'], animation: 'rain', name: 'Monsoon' },
  { id: 'anim-drizzle', type: 'animated', colors: ['#2a2a3a', '#3a3a52'], animation: 'rain', name: 'Drizzle' },
  
  // Snow & Winter
  { id: 'anim-snow', type: 'animated', colors: ['#0a1a2a', '#1a2a3a'], animation: 'snow', name: 'Winter' },
  { id: 'anim-blizzard', type: 'animated', colors: ['#141e2e', '#1e2e3e'], animation: 'snow', name: 'Blizzard' },
  { id: 'anim-frost', type: 'animated', colors: ['#1a2a3a', '#2a3a4a'], animation: 'snow', name: 'Frost' },
  { id: 'anim-arctic', type: 'animated', colors: ['#0f1f2f', '#1f2f3f'], animation: 'snow', name: 'Arctic' },
  
  // Abstract & Magic
  { id: 'anim-magic', type: 'animated', colors: ['#1a0a1f', '#2a0a2f'], animation: 'floating-shapes', name: 'Magic' },
  { id: 'anim-mystic', type: 'animated', colors: ['#0f0a1f', '#1f143d'], animation: 'floating-shapes', name: 'Mystic' },
  { id: 'anim-dream', type: 'animated', colors: ['#1a0a2a', '#2e143d'], animation: 'floating-shapes', name: 'Dream' },
  { id: 'anim-ethereal', type: 'animated', colors: ['#140a2a', '#2a1452'], animation: 'floating-shapes', name: 'Ethereal' },
  { id: 'anim-aurora', type: 'animated', colors: ['#0a1a1f', '#142e3d'], animation: 'floating-shapes', name: 'Aurora Flow' },
  
  // Tech & Neon
  { id: 'anim-neon', type: 'animated', colors: ['#0a0a0f', '#1a0a1f'], animation: 'neon-grid', name: 'Neon City' },
  { id: 'anim-cyber', type: 'animated', colors: ['#0a0a1a', '#1a0a2e'], animation: 'neon-grid', name: 'Cyber Grid' },
  { id: 'anim-tron', type: 'animated', colors: ['#000a1a', '#00142e'], animation: 'neon-grid', name: 'Tron' },
  { id: 'anim-digital', type: 'animated', colors: ['#0a0a14', '#14142e'], animation: 'neon-grid', name: 'Digital' },
];

export const getThemesByType = (type: 'solid' | 'gradient' | 'animated'): ChatTheme[] => {
  return CHAT_BACKGROUNDS.filter(bg => bg.type === type);
};

export const getThemeById = (id: string): ChatTheme => {
  return CHAT_BACKGROUNDS.find(bg => bg.id === id) || CHAT_BACKGROUNDS[0];
};
