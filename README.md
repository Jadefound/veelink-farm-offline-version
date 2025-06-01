# 🐄 Farm Management App

A modern, production-ready React Native application for livestock and farm management. 

## ✨ Features

### 🏡 Farm Management
- Multi-farm support with dropdown selection
- Farm profile management
- Guided farm setup for new users

### 🐮 Animal Management
- ID-based animal identification system
- Add, view, and manage livestock
- Search animals by ID
- Detailed animal profiles with health records

### 💰 Financial Tracking
- Income and expense tracking for animals
- Overall farm financial overview
- Transaction history and management
- Profit/loss calculations

### 🏥 Health Records
- Comprehensive health tracking
- Medical history for each animal
- Health record management

### 🎨 Modern UI/UX
- Dark and light theme support
- Clean, modern interface
- Responsive design for mobile and web
- Smooth animations and transitions

### 🔍 Search & Navigation
- Quick search functionality on dashboard
- Animal search by ID
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
cd farm-management-app
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
- **Dashboard**: Overview of your farm statistics and quick actions
- **Animals**: Browse, search, and manage your livestock
- **Health**: Track medical records and health status
- **Financial**: Monitor income, expenses, and profitability
- **Settings**: Manage account, theme, and app preferences

## 🏗️ Project Structure

```
├── app/                    # Expo Router pages
│   ├── (tabs)/            # Tab navigation screens
│   ├── auth/              # Authentication screens
│   ├── animal/            # Animal management screens
│   ├── health/            # Health record screens
│   ├── financial/         # Financial tracking screens
│   └── farm/              # Farm management screens
├── components/            # Reusable UI components
├── store/                 # Zustand state management
├── constants/             # App constants and configuration
├── types/                 # TypeScript type definitions
├── utils/                 # Utility functions
└── assets/               # Images and static assets
```

## 🛠️ Technologies Used

- **Framework**: React Native with Expo SDK 52
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
- No name-based identification (ID-only system)
- Comprehensive animal profiles
- Health history tracking
- Financial records per animal

### Financial System
- Track animal purchases and sales
- Monitor feed and medical expenses
- Calculate profit/loss per animal
- Generate financial reports

### Search Functionality
- Quick search on dashboard
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

This project is licensed under the MIT License - see the LICENSE file for details.

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