# 🐄 Veelink Farm Management App

A modern, production-ready React Native application for livestock and farm management, built with Expo and TypeScript.

## ✨ Features

### 🏡 Farm Management
- Multi-farm support with dropdown selection
- Farm profile management
- Guided farm setup for new users

### 🐮 Animal Management
- ID-based animal identification system (no name-based IDs)
- Add, view, and manage livestock
- Search animals by ID
- Detailed animal profiles with health and financial records

### 💰 Financial Tracking
- Income and expense tracking for animals and farms
- Transaction history and management
- Profit/loss calculations and financial overview

### 🏥 Health Records
- Comprehensive health tracking for each animal
- Medical history and health record management

### 🎨 Modern UI/UX
- Dark and light theme support
- Clean, modern interface
- Responsive design for mobile and web
- Smooth animations and transitions

### 🔍 Search & Navigation
- Quick search functionality on dashboard and animal lists
- Intuitive tab-based navigation

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Bun or npm/yarn
- Expo CLI
- iOS Simulator (for iOS development)
- Android Studio (for Android development)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd veelink-farm-offline-version
```

2. Install dependencies:
```bash
bun install
# or
npm install
```

3. Start the development server:
```bash
bun start
# or
npx expo start
```

4. Run on your preferred platform:
- Press `i` for iOS simulator
- Press `a` for Android emulator
- Press `w` for web browser
- Scan QR code with Expo Go app on your device

## 📱 Usage

### First Time Setup
1. Register a new account or login
2. Create your first farm profile
3. Start adding animals and managing your livestock

### Daily Operations
- **Dashboard**: Overview of farm statistics and quick actions
- **Animals**: Browse, search, and manage livestock
- **Health**: Track medical records and health status
- **Financial**: Monitor income, expenses, and profitability
- **Settings**: Manage account, theme, and app preferences

## 🏗️ Project Structure

```
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens (Dashboard, Animals, Health, Financial, Reports, Settings)
│   ├── auth/              # Authentication screens (login, register)
│   ├── animal/            # Animal management (add, view, edit)
│   ├── health/            # Health record management (add, view, edit)
│   ├── financial/         # Financial tracking (add, view)
│   ├── farm/              # Farm management (add)
│   └── transaction/       # Transaction management (add)
├── components/            # Reusable UI components (Button, Card, Input, StatCard, AnimalCard, etc.)
├── store/                 # Zustand state management (animalStore, financialStore, etc.)
├── constants/             # App constants and configuration (colors)
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions (helpers, validation, mockData, etc.)
└── assets/                # Images and static assets
```

## 🛠️ Technologies Used

- **Framework**: React Native with Expo SDK 53
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand with AsyncStorage persistence
- **Styling**: React Native StyleSheet
- **Icons**: Lucide React Native
- **TypeScript**: Full type safety
- **Storage**: AsyncStorage for local data persistence

## 🎨 Design System

The app follows a modern design system inspired by:
- **iOS**: Native mobile patterns and interactions
- **Instagram**: Clean, content-focused layouts
- **Airbnb**: Intuitive user experience
- **Notion**: Organized information architecture
- **Linear**: Minimal, functional design

### Color Palette
- **Primary**: Gossamer (#1CDC74)
- **Secondary**: Mountain Meadow (#1F8F50)
- **Dark**: Black Russian (#232530)
- **Light**: Cotton Seed (#BCB8B1)

## 📊 Key Features in Detail

### Animal Management
- ID-only system for animal identification
- Comprehensive animal profiles
- Health and financial history tracking

### Financial System
- Track animal purchases and sales
- Monitor feed and medical expenses
- Calculate profit/loss per animal
- Generate financial reports

### Search Functionality
- Quick search on dashboard and animal lists
- Animal ID-based search
- Real-time search results

## 🔧 Development

### Adding New Features
1. Create new screens in the appropriate `app/` directory
2. Add reusable components to `components/`
3. Manage state with Zustand stores in `store/`
4. Update types in `types/` directory

### State Management
- Use Zustand for complex UI state
- Persist important data with AsyncStorage
- Keep request data separate from UI state

### Styling Guidelines
- Use React Native StyleSheet
- Follow mobile-first design principles
- Maintain consistent spacing and typography
- Support both light and dark themes

## 🌐 Platform Support

- ✅ iOS (Native)
- ✅ Android (Native)
- ✅ Web (React Native Web compatible)

## 📄 License

This project is intended for educational and demonstration purposes. For production use, please add your own LICENSE file.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📞 Support

For support and questions, please open an issue in the repository or contact the development team.

---

Built with ❤️ for modern farm management