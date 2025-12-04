export type CalendarBackground = {
  id: string;
  name: string;
  url: string;
  description?: string;
};

export const CALENDAR_BACKGROUNDS: CalendarBackground[] = [
  { 
    id: 'default', 
    name: 'Default', 
    url: 'default', 
    description: 'Original calendar design' 
  },
  { 
    id: 'bg1', 
    name: 'Mountain Sunset', 
    url: 'https://r2-pub.rork.com/generated-images/107edf80-4b76-4148-a993-87f7e5ffe1ff.png' 
  },
  { 
    id: 'bg2', 
    name: 'Ocean Waves', 
    url: 'https://r2-pub.rork.com/generated-images/cb3a904a-4fe7-4194-9c6e-056c7c0bc104.png' 
  },
  { 
    id: 'bg3', 
    name: 'Forest Path', 
    url: 'https://r2-pub.rork.com/generated-images/e591b1a9-677b-45d2-88b0-5719cc9212a6.png' 
  },
  { 
    id: 'bg4', 
    name: 'Cherry Blossoms', 
    url: 'https://r2-pub.rork.com/generated-images/3cfcbde2-4109-447c-a941-6bbc63a62840.png' 
  },
  { 
    id: 'bg5', 
    name: 'City Lights', 
    url: 'https://r2-pub.rork.com/generated-images/2933cf1c-e781-4c19-96e2-65902bb8d397.png' 
  },
  { 
    id: 'bg6', 
    name: 'Desert Dunes', 
    url: 'https://r2-pub.rork.com/generated-images/a00f44a6-927b-461e-be51-164170cf96d4.png' 
  },
  { 
    id: 'bg7', 
    name: 'Northern Lights', 
    url: 'https://r2-pub.rork.com/generated-images/724f6b3f-7076-40a8-aa69-afa5f44380bb.png' 
  },
  { 
    id: 'bg8', 
    name: 'Lavender Field', 
    url: 'https://r2-pub.rork.com/generated-images/9b4b7f5a-ac5b-4a57-9ab0-f6b12628bd1e.png' 
  },
];

export const getCalendarBackground = (id: string) => {
  return CALENDAR_BACKGROUNDS.find(bg => bg.id === id) || CALENDAR_BACKGROUNDS[0];
};
