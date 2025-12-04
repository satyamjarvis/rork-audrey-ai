export interface Theme {
  id: string;
  name: string;
  colors: {
    primary: string;
    secondary: string;
    morning: string;
    night: string;
    background: string;
    cardBackground: string;
    text: {
      primary: string;
      secondary: string;
      light: string;
    };
    border: string;
    selected: string;
    today: string;
    accent?: string;
  };
  gradients: {
    background: string[];
    primary: string[];
  };
  musicUris?: string[];
}

export interface HolidayTheme extends Theme {
  startDate: string;
  endDate: string;
  isActive: (date: Date) => boolean;
}

const DEFAULT_THEMES: Theme[] = [
  {
    id: "track-gradient",
    name: "Track Gradient",
    colors: {
      primary: "#667eea",
      secondary: "#F093FB",
      morning: "#4CAF50",
      night: "#764ba2",
      background: "#F8F5FF",
      cardBackground: "#FFFFFF",
      text: {
        primary: "#000000",
        secondary: "#5F6C7B",
        light: "#A0A8B7",
      },
      border: "#E8E4F3",
      selected: "#667eea",
      today: "#7B68EE",
      accent: "#F5576C",
    },
    gradients: {
      background: ["#9D4EDD", "#FFFFFF", "#FFB6D9"],
      primary: ["#667eea", "#764ba2"],
    },
  },
  {
    id: "night-mode",
    name: "Night Mode",
    colors: {
      primary: "#FFD700",
      secondary: "#FF00FF",
      morning: "#FFD700",
      night: "#FF00FF",
      background: "#000000",
      cardBackground: "rgba(20, 20, 20, 0.85)",
      text: {
        primary: "#FFFFFF",
        secondary: "#FFD700",
        light: "#999999",
      },
      border: "rgba(255, 215, 0, 0.3)",
      selected: "#FFD700",
      today: "#FF00FF",
      accent: "#E91E63",
    },
    gradients: {
      background: ["#000000", "#0A0A0A", "#000000"],
      primary: ["#FFD700", "#FF00FF"],
    },
  },
  {
    id: "default",
    name: "Default",
    colors: {
      primary: "#6B9BD1",
      secondary: "#A8C5E3",
      morning: "#FFB84D",
      night: "#5B7FA6",
      background: "#F8FAFB",
      cardBackground: "#FFFFFF",
      text: {
        primary: "#000000",
        secondary: "#6B7E8F",
        light: "#A0ADB8",
      },
      border: "#E5EAF0",
      selected: "#6B9BD1",
      today: "#4A90E2",
    },
    gradients: {
      background: ["#9D4EDD", "#FFFFFF", "#FFB6D9"],
      primary: ["#6B9BD1", "#5B9BD1"],
    },
  },
  {
    id: "ocean-blue",
    name: "Ocean Blue",
    colors: {
      primary: "#6B9BD1",
      secondary: "#A8C5E3",
      morning: "#FFB84D",
      night: "#5B7FA6",
      background: "#F8FAFB",
      cardBackground: "#FFFFFF",
      text: {
        primary: "#000000",
        secondary: "#6B7E8F",
        light: "#A0ADB8",
      },
      border: "#E5EAF0",
      selected: "#6B9BD1",
      today: "#4A90E2",
    },
    gradients: {
      background: ["#9D4EDD", "#FFFFFF", "#FFB6D9"],
      primary: ["#6B9BD1", "#5B9BD1"],
    },
  },
  {
    id: "sunset-orange",
    name: "Sunset Orange",
    colors: {
      primary: "#FF6B35",
      secondary: "#FFA07A",
      morning: "#FFB84D",
      night: "#D35400",
      background: "#FFF8F5",
      cardBackground: "#FFFFFF",
      text: {
        primary: "#000000",
        secondary: "#8B5E3C",
        light: "#C9A690",
      },
      border: "#FFE4D6",
      selected: "#FF6B35",
      today: "#FF8C5A",
    },
    gradients: {
      background: ["#9D4EDD", "#FFFFFF", "#FFB6D9"],
      primary: ["#FF6B35", "#FF8C5A"],
    },
  },
  {
    id: "forest-green",
    name: "Forest Green",
    colors: {
      primary: "#2D6A4F",
      secondary: "#52B788",
      morning: "#95D5B2",
      night: "#1B4332",
      background: "#F1F8F5",
      cardBackground: "#FFFFFF",
      text: {
        primary: "#000000",
        secondary: "#52796F",
        light: "#95D5B2",
      },
      border: "#D8F3DC",
      selected: "#2D6A4F",
      today: "#40916C",
    },
    gradients: {
      background: ["#9D4EDD", "#FFFFFF", "#FFB6D9"],
      primary: ["#2D6A4F", "#40916C"],
    },
  },
  {
    id: "lavender-purple",
    name: "Lavender Purple",
    colors: {
      primary: "#9D4EDD",
      secondary: "#C77DFF",
      morning: "#E0AAFF",
      night: "#7B2CBF",
      background: "#FAF7FD",
      cardBackground: "#FFFFFF",
      text: {
        primary: "#000000",
        secondary: "#7209B7",
        light: "#C77DFF",
      },
      border: "#E0AAFF",
      selected: "#9D4EDD",
      today: "#B565F2",
    },
    gradients: {
      background: ["#9D4EDD", "#FFFFFF", "#FFB6D9"],
      primary: ["#9D4EDD", "#B565F2"],
    },
  },
  {
    id: "rose-pink",
    name: "Rose Pink",
    colors: {
      primary: "#E63946",
      secondary: "#FF6B9D",
      morning: "#FFC2D1",
      night: "#C1121F",
      background: "#FFF5F7",
      cardBackground: "#FFFFFF",
      text: {
        primary: "#000000",
        secondary: "#8B3A62",
        light: "#FF6B9D",
      },
      border: "#FFE3E8",
      selected: "#E63946",
      today: "#FF4D5D",
    },
    gradients: {
      background: ["#9D4EDD", "#FFFFFF", "#FFB6D9"],
      primary: ["#E63946", "#FF4D5D"],
    },
  },
  {
    id: "midnight-blue",
    name: "Midnight Blue",
    colors: {
      primary: "#0A2463",
      secondary: "#3E92CC",
      morning: "#5AA9E6",
      night: "#001233",
      background: "#F0F5FA",
      cardBackground: "#FFFFFF",
      text: {
        primary: "#000000",
        secondary: "#0A2463",
        light: "#7EB2DD",
      },
      border: "#D6E8F5",
      selected: "#0A2463",
      today: "#1B3A6E",
    },
    gradients: {
      background: ["#9D4EDD", "#FFFFFF", "#FFB6D9"],
      primary: ["#0A2463", "#1B3A6E"],
    },
  },
  {
    id: "coral-reef",
    name: "Coral Reef",
    colors: {
      primary: "#FF6F61",
      secondary: "#FFB4AB",
      morning: "#FFD5C2",
      night: "#D85A4F",
      background: "#FFF9F7",
      cardBackground: "#FFFFFF",
      text: {
        primary: "#000000",
        secondary: "#8D6E63",
        light: "#BCAAA4",
      },
      border: "#FFE8E1",
      selected: "#FF6F61",
      today: "#FF8A7D",
    },
    gradients: {
      background: ["#9D4EDD", "#FFFFFF", "#FFB6D9"],
      primary: ["#FF6F61", "#FF8A7D"],
    },
  },
  {
    id: "golden-yellow",
    name: "Golden Yellow",
    colors: {
      primary: "#FFB700",
      secondary: "#FFC929",
      morning: "#FFD666",
      night: "#CC9200",
      background: "#FFFBF0",
      cardBackground: "#FFFFFF",
      text: {
        primary: "#000000",
        secondary: "#8D6E63",
        light: "#BCAAA4",
      },
      border: "#FFF0CC",
      selected: "#FFB700",
      today: "#FFC21A",
    },
    gradients: {
      background: ["#9D4EDD", "#FFFFFF", "#FFB6D9"],
      primary: ["#FFB700", "#FFC21A"],
    },
  },
  {
    id: "feminine",
    name: "Feminine",
    colors: {
      primary: "#FF69B4",
      secondary: "#FFB6D9",
      morning: "#FFD4E8",
      night: "#E91E8C",
      background: "#FFF5FA",
      cardBackground: "#FFFFFF",
      text: {
        primary: "#000000",
        secondary: "#A65678",
        light: "#E8A5C4",
      },
      border: "#FFE5F3",
      selected: "#FF69B4",
      today: "#FF85C0",
    },
    gradients: {
      background: ["#9D4EDD", "#FFFFFF", "#FFB6D9"],
      primary: ["#FF69B4", "#FFB6D9"],
    },
  },
  {
    id: "masculine",
    name: "Masculine",
    colors: {
      primary: "#1E3A5F",
      secondary: "#4A6FA5",
      morning: "#7FA1D1",
      night: "#0F1F3A",
      background: "#F5F7FA",
      cardBackground: "#FFFFFF",
      text: {
        primary: "#000000",
        secondary: "#4A5A6F",
        light: "#8A98AA",
      },
      border: "#DDE4ED",
      selected: "#1E3A5F",
      today: "#2E4A7F",
    },
    gradients: {
      background: ["#9D4EDD", "#FFFFFF", "#FFB6D9"],
      primary: ["#1E3A5F", "#4A6FA5"],
    },
  },
];

const HOLIDAY_THEMES: HolidayTheme[] = [
  {
    id: "christmas",
    name: "Christmas",
    startDate: "12-01",
    endDate: "12-31",
    colors: {
      primary: "#C41E3A",
      secondary: "#165B33",
      morning: "#FFD700",
      night: "#0F4C2C",
      background: "#FFF5F5",
      cardBackground: "#FFFFFF",
      text: {
        primary: "#1A1A1A",
        secondary: "#5C5C5C",
        light: "#A0A0A0",
      },
      border: "#FFE6E6",
      selected: "#C41E3A",
      today: "#D62F46",
      accent: "#FFD700",
    },
    gradients: {
      background: ["#9D4EDD", "#FFFFFF", "#FFB6D9"],
      primary: ["#C41E3A", "#165B33"],
    },
    musicUris: [
      "https://rork.app/pa/ier8mze8ucoqq9oktvadp/jolly_carol_1",
      "https://rork.app/pa/ier8mze8ucoqq9oktvadp/christmas_song_bg_1",
      "https://rork.app/pa/ier8mze8ucoqq9oktvadp/christmas_carol_celebration_1",
      "https://rork.app/pa/ier8mze8ucoqq9oktvadp/christmas_carol_country_1",
    ],
    isActive: (date: Date) => {
      const month = date.getMonth() + 1;
      return month === 12;
    },
  },
  {
    id: "halloween",
    name: "Halloween",
    startDate: "10-15",
    endDate: "10-31",
    colors: {
      primary: "#FF6600",
      secondary: "#9966CC",
      morning: "#FFA500",
      night: "#4B0082",
      background: "#FFF8F0",
      cardBackground: "#FFFFFF",
      text: {
        primary: "#000000",
        secondary: "#5C3D2E",
        light: "#A08060",
      },
      border: "#FFE6CC",
      selected: "#FF6600",
      today: "#FF8533",
      accent: "#9966CC",
    },
    gradients: {
      background: ["#9D4EDD", "#FFFFFF", "#FFB6D9"],
      primary: ["#FF6600", "#9966CC"],
    },
    isActive: (date: Date) => {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return month === 10 && day >= 15;
    },
  },
  {
    id: "valentines",
    name: "Valentine's Day",
    startDate: "02-07",
    endDate: "02-14",
    colors: {
      primary: "#FF1744",
      secondary: "#FF80AB",
      morning: "#FFB3BA",
      night: "#C2185B",
      background: "#FFF5F7",
      cardBackground: "#FFFFFF",
      text: {
        primary: "#000000",
        secondary: "#8E3557",
        light: "#D18091",
      },
      border: "#FFE0E6",
      selected: "#FF1744",
      today: "#FF4569",
      accent: "#FF80AB",
    },
    gradients: {
      background: ["#9D4EDD", "#FFFFFF", "#FFB6D9"],
      primary: ["#FF1744", "#FF80AB"],
    },
    isActive: (date: Date) => {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return month === 2 && day >= 7 && day <= 14;
    },
  },
  {
    id: "spring",
    name: "Spring Blossom",
    startDate: "03-20",
    endDate: "06-20",
    colors: {
      primary: "#FF69B4",
      secondary: "#98D8C8",
      morning: "#FFE5F0",
      night: "#6C7B8B",
      background: "#FFF9FC",
      cardBackground: "#FFFFFF",
      text: {
        primary: "#000000",
        secondary: "#6B7A8F",
        light: "#B8BECC",
      },
      border: "#FFE5F0",
      selected: "#FF69B4",
      today: "#FF85C5",
      accent: "#98D8C8",
    },
    gradients: {
      background: ["#9D4EDD", "#FFFFFF", "#FFB6D9"],
      primary: ["#FF69B4", "#98D8C8"],
    },
    isActive: (date: Date) => {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return (month === 3 && day >= 20) || month === 4 || month === 5 || (month === 6 && day <= 20);
    },
  },
  {
    id: "summer",
    name: "Summer Vibes",
    startDate: "06-21",
    endDate: "09-22",
    colors: {
      primary: "#FFD23F",
      secondary: "#06FFA5",
      morning: "#FFE57F",
      night: "#4ECDC4",
      background: "#FFFEF7",
      cardBackground: "#FFFFFF",
      text: {
        primary: "#000000",
        secondary: "#7F8C8D",
        light: "#BDC3C7",
      },
      border: "#FFF6D5",
      selected: "#FFD23F",
      today: "#FFE066",
      accent: "#06FFA5",
    },
    gradients: {
      background: ["#9D4EDD", "#FFFFFF", "#FFB6D9"],
      primary: ["#FFD23F", "#06FFA5"],
    },
    isActive: (date: Date) => {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return (month === 6 && day >= 21) || month === 7 || month === 8 || (month === 9 && day <= 22);
    },
  },
  {
    id: "autumn",
    name: "Autumn Leaves",
    startDate: "09-23",
    endDate: "12-20",
    colors: {
      primary: "#D2691E",
      secondary: "#CD853F",
      morning: "#F4A460",
      night: "#8B4513",
      background: "#FFF8F0",
      cardBackground: "#FFFFFF",
      text: {
        primary: "#3E2723",
        secondary: "#795548",
        light: "#BCAAA4",
      },
      border: "#FFE9D6",
      selected: "#D2691E",
      today: "#E07B3A",
      accent: "#DAA520",
    },
    gradients: {
      background: ["#9D4EDD", "#FFFFFF", "#FFB6D9"],
      primary: ["#D2691E", "#CD853F"],
    },
    isActive: (date: Date) => {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return (month === 9 && day >= 23) || month === 10 || month === 11 || (month === 12 && day <= 20);
    },
  },
  {
    id: "newyear",
    name: "New Year",
    startDate: "12-25",
    endDate: "01-05",
    colors: {
      primary: "#FFD700",
      secondary: "#E6E6FA",
      morning: "#FFF8DC",
      night: "#4B0082",
      background: "#FAFAF5",
      cardBackground: "#FFFFFF",
      text: {
        primary: "#1A1A1A",
        secondary: "#5C5C5C",
        light: "#A0A0A0",
      },
      border: "#FFF8DC",
      selected: "#FFD700",
      today: "#FFE44D",
      accent: "#E6E6FA",
    },
    gradients: {
      background: ["#9D4EDD", "#FFFFFF", "#FFB6D9"],
      primary: ["#FFD700", "#E6E6FA"],
    },
    isActive: (date: Date) => {
      const month = date.getMonth() + 1;
      const day = date.getDate();
      return (month === 12 && day >= 25) || (month === 1 && day <= 5);
    },
  },
];

export function getActiveHolidayTheme(date: Date = new Date()): HolidayTheme | null {
  for (const theme of HOLIDAY_THEMES) {
    if (theme.isActive(date)) {
      return theme;
    }
  }
  return null;
}

export function getAllThemes(): Theme[] {
  return DEFAULT_THEMES;
}

export function getHolidayThemes(): HolidayTheme[] {
  return HOLIDAY_THEMES;
}

export function getThemeById(id: string): Theme | null {
  const allThemes = [...DEFAULT_THEMES, ...HOLIDAY_THEMES];
  return allThemes.find((theme) => theme.id === id) || null;
}

export { DEFAULT_THEMES, HOLIDAY_THEMES };
