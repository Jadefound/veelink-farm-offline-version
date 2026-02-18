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
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
