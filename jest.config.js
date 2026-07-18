module.exports = {
  preset: "jest-expo/web",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/jest-setup.ts"],
  transformIgnorePatterns: [
    "node_modules/(?!(react-native|react-native-web|@react-native|@react-navigation|expo|@expo|lucide-react-native|zustand|react-native-reanimated|react-native-gesture-handler|react-native-safe-area-context|react-native-screens|react-native-svg|@react-native-async-storage|@react-native-community|react-native-vector-icons|@react-native-picker|@react-native-community/datetimepicker|@testing-library)/)",
  ],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/$1",
  },
};
