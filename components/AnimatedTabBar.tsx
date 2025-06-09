import React from "react";
import { View, TouchableOpacity, StyleSheet, Platform, Dimensions, Text } from "react-native";
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from "react-native-reanimated";
import Svg, { Path } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "@react-navigation/bottom-tabs";

// Tab icon definitions
const TAB_ICONS = [
    { name: "index", label: "Home", icon: "home-outline", iconActive: "home" },
    { name: "animals", label: "Animals", icon: "paw-outline", iconActive: "paw" },
    { name: "health", label: "Health", icon: "medkit-outline", iconActive: "medkit" },
    { name: "financial", label: "Financial", icon: "card-outline", iconActive: "card" },
    { name: "settings", label: "Settings", icon: "settings-outline", iconActive: "settings" },
];

const TAB_BAR_HEIGHT = 72;
const ICON_SIZE = 28;
const ACTIVE_CIRCLE_SIZE = 56;
const PILL_RADIUS = 32;
const { width: SCREEN_WIDTH } = Dimensions.get("window");

// Add types for props
interface AnimatedTabBarProps {
    state: BottomTabBarProps["state"];
    descriptors: BottomTabBarProps["descriptors"];
    navigation: BottomTabBarProps["navigation"];
}

export default function AnimatedTabBar({ state, descriptors, navigation }: AnimatedTabBarProps) {
    const activeIndex = state.index;
    const tabWidth = SCREEN_WIDTH / TAB_ICONS.length;
    const animatedX = useSharedValue(activeIndex * tabWidth);

    React.useEffect(() => {
        animatedX.value = withTiming(activeIndex * tabWidth, { duration: 350 });
    }, [activeIndex]);

    // Animated style for the floating active icon
    const activeIconStyle = useAnimatedStyle(() => ({
        transform: [
            { translateX: animatedX.value + tabWidth / 2 - ACTIVE_CIRCLE_SIZE / 2 },
            { translateY: -18 },
        ],
    }));

    // SVG path for the pill with a cutout
    const getPillPath = (x: number) => {
        const r = PILL_RADIUS;
        const cutoutRadius = ACTIVE_CIRCLE_SIZE / 2 + 8;
        const cutoutCenter = x + tabWidth / 2;
        const w = SCREEN_WIDTH - 32;
        const h = TAB_BAR_HEIGHT;
        const y = 0;
        // Left arc
        let path = `M${r},${y} Q0,${y} 0,${r} L0,${h - r} Q0,${h} ${r},${h} L${w - r},${h} Q${w},${h} ${w},${h - r} L${w},${r} Q${w},${y} ${w - r},${y}`;
        // Cutout (arc up)
        path += ` M${cutoutCenter - cutoutRadius},${y}`;
        path += ` A${cutoutRadius},${cutoutRadius} 0 0 1 ${cutoutCenter + cutoutRadius},${y}`;
        return path;
    };

    return (
        <View style={styles.container} pointerEvents="box-none">
            <View style={styles.shadow} />
            <Svg
                width={SCREEN_WIDTH - 32}
                height={TAB_BAR_HEIGHT}
                style={styles.svg}
            >
                <Path
                    d={getPillPath(animatedX.value)}
                    fill="#18181B"
                />
            </Svg>
            {/* Animated floating active icon */}
            <Animated.View style={[styles.activeCircle, activeIconStyle]}>
                <View style={styles.activeIconBg}>
                    <Ionicons
                        name={TAB_ICONS[activeIndex].iconActive as any}
                        size={ICON_SIZE}
                        color="#fff"
                    />
                </View>
                <Text style={styles.activeLabel}>{TAB_ICONS[activeIndex].label}</Text>
            </Animated.View>
            {/* Tab icons */}
            <View style={styles.tabRow}>
                {TAB_ICONS.map((tab, idx) => {
                    const isFocused = state.index === idx;
                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: state.routes[idx].key,
                            canPreventDefault: true,
                        });
                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(state.routes[idx].name);
                        }
                    };
                    return (
                        <TouchableOpacity
                            key={tab.name}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={descriptors[state.routes[idx].key].options.tabBarAccessibilityLabel}
                            onPress={onPress}
                            style={styles.tabButton}
                            activeOpacity={0.7}
                        >
                            <Ionicons
                                name={(isFocused ? tab.iconActive : tab.icon) as any}
                                size={ICON_SIZE}
                                color={isFocused ? "#F97316" : "#A1A1AA"}
                            />
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: "absolute",
        left: 16,
        right: 16,
        bottom: 16,
        height: TAB_BAR_HEIGHT,
        zIndex: 100,
        alignItems: "center",
        justifyContent: "center",
    },
    shadow: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        height: TAB_BAR_HEIGHT,
        borderRadius: PILL_RADIUS,
        backgroundColor: "#000",
        opacity: 0.08,
        zIndex: 1,
    },
    svg: {
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 2,
    },
    tabRow: {
        flexDirection: "row",
        width: "100%",
        height: TAB_BAR_HEIGHT,
        alignItems: "center",
        justifyContent: "space-between",
        position: "absolute",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 3,
        paddingHorizontal: 24,
    },
    tabButton: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        height: TAB_BAR_HEIGHT,
    },
    activeCircle: {
        position: "absolute",
        top: -ACTIVE_CIRCLE_SIZE / 2 + 12,
        zIndex: 10,
        alignItems: "center",
        width: ACTIVE_CIRCLE_SIZE,
        height: ACTIVE_CIRCLE_SIZE + 18,
        left: 0,
    },
    activeIconBg: {
        width: ACTIVE_CIRCLE_SIZE,
        height: ACTIVE_CIRCLE_SIZE,
        borderRadius: ACTIVE_CIRCLE_SIZE / 2,
        backgroundColor: "#F97316",
        alignItems: "center",
        justifyContent: "center",
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.18,
        shadowRadius: 8,
        elevation: 8,
    },
    activeLabel: {
        marginTop: 2,
        fontSize: 12,
        color: "#F97316",
        fontWeight: "700",
        textAlign: "center",
    },
}); 