const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const config = getDefaultConfig(__dirname);

// Force @react-navigation/core and @react-navigation/native to always resolve
// to the single top-level instance. expo-router bundles its own nested copy of
// these packages, which creates two separate React context objects for things
// like PreventRemoveContext — causing the "Couldn't find the prevent remove
// context" crash. Redirecting all imports to the project-root copy ensures
// every package shares the same context instances.
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (
    moduleName === "@react-navigation/core" ||
    moduleName.startsWith("@react-navigation/core/") ||
    moduleName === "@react-navigation/native" ||
    moduleName.startsWith("@react-navigation/native/")
  ) {
    return context.resolveRequest(
      { ...context, originModulePath: path.join(__dirname, "package.json") },
      moduleName,
      platform
    );
  }
  // On web, alias bare react-native to react-native-web for component imports
  // (Platform, View, etc). Do NOT alias react-native/ sub-paths — react-native-web
  // doesn't mirror the internal directory structure.
  if (platform === "web" && moduleName === "react-native") {
    return context.resolveRequest(context, "react-native-web", platform);
  }
  // react-native/Libraries/Core/InitializeCore is pulled in by
  // @expo/metro-runtime's install.native.ts. On web this chain is unwanted.
  // Redirect to a no-op stub so the native devtools/bootstrap chain is skipped.
  if (platform === "web" && moduleName === "react-native/Libraries/Core/InitializeCore") {
    return { filePath: path.join(__dirname, "stubs", "react-native-core.js") };
  }
  // On web, Metro's active resolver condition is "browser", which zustand's
  // package.json exports map doesn't define — so it falls through to the
  // "import" condition and resolves esm/middleware.mjs. That file contains
  // raw `import.meta.env` syntax (from the bundled-in, unused `devtools`
  // middleware), which crashes web bundles since Expo serves them as classic
  // (non-module) scripts. Force the "react-native" condition instead, which
  // zustand maps to its plain CJS build (no import.meta) on every platform.
  if (platform === "web" && (moduleName === "zustand" || moduleName.startsWith("zustand/"))) {
    return context.resolveRequest(
      { ...context, unstable_conditionNames: ["react-native"] },
      moduleName,
      platform
    );
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
