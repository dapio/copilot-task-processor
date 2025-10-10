/**
 * Available Project Icons
 * ThinkCode AI Platform - Project Icon Configuration
 */

export interface ProjectIconOption {
  id: string;
  emoji: string;
  name: string;
  category: string;
}

export const PROJECT_ICONS: ProjectIconOption[] = [
  // Technology & Development
  { id: 'rocket', emoji: '🚀', name: 'Rakieta', category: 'technology' },
  { id: 'laptop', emoji: '💻', name: 'Laptop', category: 'technology' },
  { id: 'gear', emoji: '⚙️', name: 'Koło zębate', category: 'technology' },
  { id: 'code', emoji: '💻', name: 'Kod', category: 'technology' },
  { id: 'database', emoji: '🗄️', name: 'Baza danych', category: 'technology' },
  { id: 'cloud', emoji: '☁️', name: 'Chmura', category: 'technology' },
  { id: 'mobile', emoji: '📱', name: 'Telefon', category: 'technology' },
  { id: 'web', emoji: '🌐', name: 'Web', category: 'technology' },
  { id: 'api', emoji: '🔌', name: 'API', category: 'technology' },
  { id: 'ai', emoji: '🤖', name: 'AI/Robot', category: 'technology' },

  // Business & Finance
  { id: 'money', emoji: '💰', name: 'Pieniądze', category: 'business' },
  { id: 'chart', emoji: '📊', name: 'Wykres', category: 'business' },
  { id: 'bank', emoji: '🏦', name: 'Bank', category: 'business' },
  { id: 'shopping', emoji: '🛒', name: 'E-commerce', category: 'business' },
  { id: 'handshake', emoji: '🤝', name: 'Partnerstwo', category: 'business' },
  { id: 'target', emoji: '🎯', name: 'Cel', category: 'business' },
  { id: 'briefcase', emoji: '💼', name: 'Biznes', category: 'business' },
  { id: 'analytics', emoji: '📈', name: 'Analityka', category: 'business' },

  // Creative & Design
  { id: 'art', emoji: '🎨', name: 'Sztuka', category: 'creative' },
  { id: 'design', emoji: '✨', name: 'Design', category: 'creative' },
  { id: 'camera', emoji: '📷', name: 'Fotografia', category: 'creative' },
  { id: 'video', emoji: '🎬', name: 'Video', category: 'creative' },
  { id: 'music', emoji: '🎵', name: 'Muzyka', category: 'creative' },
  { id: 'book', emoji: '📚', name: 'Książka', category: 'creative' },
  { id: 'pen', emoji: '✍️', name: 'Pisanie', category: 'creative' },

  // Science & Research
  { id: 'lab', emoji: '🧪', name: 'Laboratorium', category: 'science' },
  { id: 'microscope', emoji: '🔬', name: 'Mikroskop', category: 'science' },
  { id: 'dna', emoji: '🧬', name: 'DNA', category: 'science' },
  { id: 'atom', emoji: '⚛️', name: 'Atom', category: 'science' },
  { id: 'brain', emoji: '🧠', name: 'Mózg', category: 'science' },
  { id: 'planet', emoji: '🌍', name: 'Planeta', category: 'science' },

  // Communication & Social
  { id: 'chat', emoji: '💬', name: 'Chat', category: 'communication' },
  { id: 'email', emoji: '📧', name: 'Email', category: 'communication' },
  { id: 'phone', emoji: '📞', name: 'Telefon', category: 'communication' },
  { id: 'megaphone', emoji: '📢', name: 'Megafon', category: 'communication' },
  { id: 'network', emoji: '🌐', name: 'Sieć', category: 'communication' },

  // Games & Entertainment
  { id: 'game', emoji: '🎮', name: 'Gra', category: 'entertainment' },
  { id: 'dice', emoji: '🎲', name: 'Kości', category: 'entertainment' },
  { id: 'trophy', emoji: '🏆', name: 'Trofeum', category: 'entertainment' },
  { id: 'star', emoji: '⭐', name: 'Gwiazda', category: 'entertainment' },
  { id: 'crown', emoji: '👑', name: 'Korona', category: 'entertainment' },

  // Health & Medical
  { id: 'heart', emoji: '❤️', name: 'Serce', category: 'health' },
  { id: 'medical', emoji: '🏥', name: 'Medycyna', category: 'health' },
  { id: 'pill', emoji: '💊', name: 'Tabletka', category: 'health' },
  { id: 'fitness', emoji: '💪', name: 'Fitness', category: 'health' },

  // Transport & Travel
  { id: 'car', emoji: '🚗', name: 'Samochód', category: 'transport' },
  { id: 'plane', emoji: '✈️', name: 'Samolot', category: 'transport' },
  { id: 'ship', emoji: '🚢', name: 'Statek', category: 'transport' },
  { id: 'train', emoji: '🚂', name: 'Pociąg', category: 'transport' },
  { id: 'bicycle', emoji: '🚴', name: 'Rower', category: 'transport' },

  // Food & Drinks
  { id: 'coffee', emoji: '☕', name: 'Kawa', category: 'food' },
  { id: 'pizza', emoji: '🍕', name: 'Pizza', category: 'food' },
  { id: 'cake', emoji: '🎂', name: 'Tort', category: 'food' },
  { id: 'apple', emoji: '🍎', name: 'Jabłko', category: 'food' },
];

export const PROJECT_ICON_CATEGORIES = [
  { id: 'technology', name: 'Technologia', color: '#667eea' },
  { id: 'business', name: 'Biznes', color: '#feca57' },
  { id: 'creative', name: 'Kreatywność', color: '#ff6b9d' },
  { id: 'science', name: 'Nauka', color: '#0984e3' },
  { id: 'communication', name: 'Komunikacja', color: '#00b894' },
  { id: 'entertainment', name: 'Rozrywka', color: '#a29bfe' },
  { id: 'health', name: 'Zdrowie', color: '#fd79a8' },
  { id: 'transport', name: 'Transport', color: '#fdcb6e' },
  { id: 'food', name: 'Jedzenie', color: '#e84393' },
];

export const getIconByEmoji = (
  emoji: string
): ProjectIconOption | undefined => {
  return PROJECT_ICONS.find(icon => icon.emoji === emoji);
};

export const getIconById = (id: string): ProjectIconOption | undefined => {
  return PROJECT_ICONS.find(icon => icon.id === id);
};

export const getIconsByCategory = (category: string): ProjectIconOption[] => {
  return PROJECT_ICONS.filter(icon => icon.category === category);
};

export const getDefaultIcon = (): ProjectIconOption => {
  return PROJECT_ICONS[0]; // Rocket as default
};
