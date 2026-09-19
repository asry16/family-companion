import React, { useState, useRef, useEffect } from 'react';
import {
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  TextStyle,
  StyleProp,
  Platform,
  ActivityIndicator,
  View,
  Animated,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { ButtonTokens } from '@/constants/theme';
import { PulseRing } from './PulseRing';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'tonal'
  | 'danger'
  | 'success'
  | 'link'
  | 'sos'
  | 'chip';

export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  title?: string;
  onPress?: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  icon?: keyof typeof Ionicons.glyphMap;
  iconPosition?: 'left' | 'right';
  iconSize?: number;
  loading?: boolean;
  disabled?: boolean;
  circular?: boolean;
  fullWidth?: boolean;
  selected?: boolean;
  colorScheme?: 'default' | 'danger' | 'success';
  style?: StyleProp<ViewStyle>;
  textStyle?: StyleProp<TextStyle>;
  accessibilityLabel?: string;
  // SOS hold behavior
  onHoldComplete?: () => void;
  holdDurationMs?: number;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  icon,
  iconPosition = 'left',
  iconSize,
  loading = false,
  disabled = false,
  circular = false,
  fullWidth = false,
  selected = false,
  colorScheme = 'default',
  style,
  textStyle,
  accessibilityLabel,
  onHoldComplete,
  holdDurationMs = 2000,
}) => {
  const { colors, isDark } = useAppTheme();
  const [isPressed, setIsPressed] = useState(false);

  // SOS Hold Animation State
  const [isHolding, setIsHolding] = useState(false);
  const holdProgress = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const hapticIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Concentric ambient breathing pulse for SOS core: 1 to 1.04 over 1600ms loop
  useEffect(() => {
    if (variant !== 'sos') return;
    let animLoop: Animated.CompositeAnimation | null = null;

    const startPulse = async () => {
      try {
        const isReduced = await AccessibilityInfo.isReduceMotionEnabled();
        if (isReduced) {
          pulseAnim.setValue(0);
          return;
        }
      } catch {}

      animLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 800,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      animLoop.start();
    };

    startPulse();

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (isReduced: boolean) => {
      if (isReduced) {
        animLoop?.stop();
        pulseAnim.setValue(0);
      } else {
        startPulse();
      }
    });

    return () => {
      animLoop?.stop();
      sub?.remove();
    };
  }, [variant, pulseAnim]);

  const clearHoldTimers = () => {
    if (holdTimerRef.current) {
      clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
    if (hapticIntervalRef.current) {
      clearInterval(hapticIntervalRef.current);
      hapticIntervalRef.current = null;
    }
  };

  const handlePressIn = () => {
    setIsPressed(true);
    if (disabled || loading) return;

    if (variant === 'sos') {
      setIsHolding(true);
      if (Platform.OS !== 'web') {
        try {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } catch (e) {}
      }

      let ticks = 0;
      hapticIntervalRef.current = setInterval(() => {
        ticks++;
        if (Platform.OS !== 'web') {
          try {
            Haptics.impactAsync(
              ticks > 3
                ? Haptics.ImpactFeedbackStyle.Heavy
                : Haptics.ImpactFeedbackStyle.Light
            );
          } catch (e) {}
        }
      }, 400);

      Animated.timing(holdProgress, {
        toValue: 1,
        duration: holdDurationMs,
        easing: Easing.linear,
        useNativeDriver: false,
      }).start();

      holdTimerRef.current = setTimeout(() => {
        clearHoldTimers();
        if (Platform.OS !== 'web') {
          try {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          } catch (e) {}
        }
        if (onHoldComplete) {
          onHoldComplete();
        } else if (onPress) {
          onPress();
        }
        setTimeout(() => {
          setIsHolding(false);
          holdProgress.setValue(0);
        }, 1200);
      }, holdDurationMs);
    }
  };

  const handlePressOut = () => {
    setIsPressed(false);
    if (variant === 'sos') {
      clearHoldTimers();
      setIsHolding(false);
      Animated.timing(holdProgress, {
        toValue: 0,
        duration: 180,
        useNativeDriver: false,
      }).start();
    }
  };

  const handlePress = () => {
    if (disabled || loading) return;
    if (variant === 'sos') {
      // SOS requires hold; quick tap does nothing
      return;
    }

    if (Platform.OS !== 'web') {
      try {
        if (variant === 'danger') {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        } else {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        }
      } catch (e) {}
    }
    if (onPress) onPress();
  };

  // Dimensions & typography from tokens
  const sizeTokens = ButtonTokens.pill[size];
  const isChipVariant = variant === 'chip';
  const height = isChipVariant ? ButtonTokens.chipHeight : sizeTokens.height;
  const circularSize = circular ? ButtonTokens.iconButton : 0;
  const paddingH = circular ? 0 : sizeTokens.paddingH;
  const fontSize = sizeTokens.fontSize;
  const resolvedIconSize = iconSize || (size === 'sm' ? 14 : size === 'lg' ? 20 : 16);
  const iconGap = size === 'sm' ? 5 : 7;

  // Effective variant when 'chip' is used
  const effectiveVariant = variant === 'chip' ? (selected ? 'primary' : 'tonal') : variant;

  // Variant Styling Tokens
  let bgColor = 'transparent';
  let borderColor = 'transparent';
  let borderWidth = 0;
  let textColor = '#FFFFFF';
  let iconColor = '#FFFFFF';
  let gradientColors: [string, string, ...string[]] | null = null;
  let shadowStyle: ViewStyle = {};
  let innerHighlight = false;

  switch (effectiveVariant) {
    case 'primary':
      if (isDark) {
        gradientColors = [colors.blue, '#2563EB'];
        textColor = '#FFFFFF';
        iconColor = '#FFFFFF';
        shadowStyle = {
          shadowColor: colors.blue,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.35,
          shadowRadius: 14,
          elevation: 5,
        };
      } else {
        // Light mode primary gradient: 90deg, #4F8EF7 to #8A6BF2, shadow 0 8px 20px rgba(110,90,224,0.28)
        gradientColors = ['#4F8EF7', '#8A6BF2'];
        textColor = '#FFFFFF';
        iconColor = '#FFFFFF';
        innerHighlight = true;
        shadowStyle = {
          shadowColor: '#6E5ADC',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.28,
          shadowRadius: 20,
          elevation: 6,
        };
      }
      break;

    case 'secondary':
      if (colorScheme === 'danger') {
        // Danger scheme secondary (e.g. SOS chip in header)
        if (isDark) {
          bgColor = 'rgba(239, 68, 68, 0.12)';
          borderColor = 'rgba(239, 68, 68, 0.35)';
          borderWidth = 1.5;
          textColor = '#F87171';
          iconColor = '#F87171';
        } else {
          bgColor = '#FDEAF2';
          borderColor = '#F7C6D9';
          borderWidth = 1.5;
          textColor = '#E11D48';
          iconColor = '#E11D48';
        }
      } else {
        if (isDark) {
          bgColor = 'rgba(255, 255, 255, 0.08)';
          borderColor = 'rgba(255, 255, 255, 0.18)';
          borderWidth = 1.5;
          textColor = colors.text;
          iconColor = colors.text;
        } else {
          // Light mode: translucent white fill, 1.5px border rgba(124,92,224,0.28), text & icon #5B4BC4
          bgColor = 'rgba(255, 255, 255, 0.78)';
          borderColor = 'rgba(124, 92, 224, 0.28)';
          borderWidth = 1.5;
          textColor = '#5B4BC4';
          iconColor = '#5B4BC4';
          shadowStyle = {
            shadowColor: '#6E5ADC',
            shadowOffset: { width: 0, height: 3 },
            shadowOpacity: 0.06,
            shadowRadius: 8,
            elevation: 2,
          };
        }
      }
      break;

    case 'tonal':
      if (isDark) {
        bgColor = 'rgba(255, 255, 255, 0.08)';
        borderWidth = 0;
        textColor = colors.text;
        iconColor = colors.text;
      } else {
        // Light mode: fill rgba(124,92,224,0.10), no border, text and icon #6D5BD0
        bgColor = 'rgba(124, 92, 224, 0.10)';
        borderWidth = 0;
        textColor = '#6D5BD0';
        iconColor = '#6D5BD0';
      }
      break;

    case 'danger':
      if (isDark) {
        bgColor = 'rgba(239, 68, 68, 0.15)';
        borderColor = 'rgba(239, 68, 68, 0.35)';
        borderWidth = 1;
        textColor = '#F87171';
        iconColor = '#F87171';
      } else {
        // Light mode: fill #FDEAF2, 1px border #F7C6D9, text and icon #E11D48
        bgColor = '#FDEAF2';
        borderColor = '#F7C6D9';
        borderWidth = 1;
        textColor = '#E11D48';
        iconColor = '#E11D48';
      }
      break;

    case 'success':
      if (isDark) {
        gradientColors = ['#14B8A6', '#0D9488'];
        textColor = '#FFFFFF';
        iconColor = '#FFFFFF';
      } else {
        // Light mode: gradient #2EBF8E to #22A97C, white text
        gradientColors = ['#2EBF8E', '#22A97C'];
        textColor = '#FFFFFF';
        iconColor = '#FFFFFF';
        shadowStyle = {
          shadowColor: '#2EBF8E',
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.25,
          shadowRadius: 10,
          elevation: 4,
        };
      }
      break;

    case 'link':
      bgColor = 'transparent';
      borderWidth = 0;
      textColor = isDark ? '#38BDF8' : '#6D5BD0';
      iconColor = isDark ? '#38BDF8' : '#6D5BD0';
      break;

    case 'sos':
      // SOS variant is handled with custom circle rendering below
      break;
  }

  // Handle special SOS variant
  if (variant === 'sos') {
    const coreSize = ButtonTokens.sosSize;
    const breatheScale = pulseAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [1.0, 1.04],
    });

    return (
      <View style={styles.sosContainer}>
        {/* Pulse Rings — hidden during hold */}
        {!isHolding && (
          <>
            <PulseRing
              color={isDark ? 'rgba(244, 63, 94, 0.35)' : 'rgba(244, 63, 94, 0.35)'}
              size={coreSize}
              maxScale={1.5}
              duration={2000}
              delay={0}
              startOpacity={0.35}
              paused={isHolding}
            />
            <PulseRing
              color={isDark ? 'rgba(244, 63, 94, 0.22)' : 'rgba(244, 63, 94, 0.22)'}
              size={coreSize}
              maxScale={1.5}
              duration={2000}
              delay={700}
              startOpacity={0.22}
              paused={isHolding}
            />
          </>
        )}

        {/* Hold Progress Track Ring */}
        {isHolding && (
          <View style={[styles.holdRingBackground, { width: coreSize + 8, height: coreSize + 8, borderRadius: (coreSize + 8) / 2 }]}>
            <Animated.View
              style={[
                styles.holdRingActive,
                {
                  width: coreSize + 8,
                  height: coreSize + 8,
                  borderRadius: (coreSize + 8) / 2,
                  opacity: holdProgress.interpolate({
                    inputRange: [0, 0.1, 1],
                    outputRange: [0, 1, 1],
                  }),
                },
              ]}
            />
          </View>
        )}

        {/* Center SOS Button Circle with breathing scale */}
        <Animated.View style={{ transform: [{ scale: isHolding ? 1 : breatheScale }] }}>
          <Pressable
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            accessibilityLabel={accessibilityLabel || 'Emergency SOS button. Press and hold for two seconds.'}
            accessibilityRole="button"
            hitSlop={ButtonTokens.hitSlop}
            style={({ pressed }) => [
              styles.sosCircle,
              {
                width: coreSize,
                height: coreSize,
                borderRadius: coreSize / 2,
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
            ]}>
            <LinearGradient
              colors={['#FF7A9C', '#F43F5E', '#E11D48']}
              start={{ x: 0.3, y: 0.2 }}
              end={{ x: 0.8, y: 0.9 }}
              style={styles.sosGradient}>
              <View style={styles.sosHighlight} />
              <Text style={styles.sosText}>{title || 'SOS'}</Text>
            </LinearGradient>
          </Pressable>
        </Animated.View>
      </View>
    );
  }

  // Link Variant: simple semibold text with trailing arrow and no background
  if (variant === 'link') {
    return (
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        accessibilityLabel={accessibilityLabel || title}
        accessibilityRole="button"
        hitSlop={ButtonTokens.hitSlop}
        style={({ pressed }) => [
          styles.linkContainer,
          {
            opacity: pressed ? 0.7 : disabled ? 0.5 : 1,
            transform: [{ scale: pressed ? 0.97 : 1 }],
          },
          style,
          { flexShrink: 0 },
        ]}>
        {title && (
          <Text
            numberOfLines={1}
            style={[styles.linkText, { color: textColor }, textStyle]}>
            {title}
          </Text>
        )}
        <Ionicons
          name={icon || 'arrow-forward'}
          size={resolvedIconSize}
          color={iconColor}
          style={styles.linkIcon}
        />
      </Pressable>
    );
  }

  // Standard Button (Primary, Secondary, Tonal, Danger, Success, Chip)
  const isSelectedChip = variant === 'chip' && selected;

  const containerStyle: ViewStyle = {
    height: circular ? (circularSize || height) : height,
    width: circular ? (circularSize || height) : fullWidth ? '100%' : undefined,
    paddingHorizontal: paddingH,
    borderRadius: 999,
    backgroundColor: gradientColors ? 'transparent' : bgColor,
    borderColor,
    borderWidth,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    flexShrink: 0,
    opacity: disabled ? 0.5 : 1,
    overflow: 'hidden',
    ...shadowStyle,
  };

  const content = (
    <>
      {/* 1px Inner top highlight for primary button in light mode */}
      {innerHighlight && !isDark && (
        <View style={styles.innerHighlight} pointerEvents="none" />
      )}

      {loading ? (
        <ActivityIndicator size="small" color={textColor} />
      ) : (
        <View style={[styles.contentRow, { gap: iconGap }]}>
          {icon && iconPosition === 'left' && (
            <Ionicons name={icon} size={resolvedIconSize} color={iconColor} />
          )}
          {title && (
            <Text
              numberOfLines={1}
              style={[
                styles.buttonText,
                {
                  fontSize,
                  color: textColor,
                  fontWeight: isSelectedChip ? '700' : '600',
                },
                textStyle,
              ]}>
              {title}
            </Text>
          )}
          {icon && iconPosition === 'right' && (
            <Ionicons name={icon} size={resolvedIconSize} color={iconColor} />
          )}
        </View>
      )}
    </>
  );

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      disabled={disabled || loading}
      accessibilityLabel={accessibilityLabel || title}
      accessibilityRole="button"
      hitSlop={ButtonTokens.hitSlop}
      style={({ pressed }) => [
        containerStyle,
        {
          transform: [{ scale: pressed ? 0.97 : 1 }],
        },
        style,
      ]}>
      {gradientColors ? (
        <LinearGradient
          colors={gradientColors}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[StyleSheet.absoluteFill, styles.gradientContent]}>
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </Pressable>
  );
};

// ==========================================
// Grouped Header Icon Capsule Component
// ==========================================

export interface HeaderCapsuleItem {
  id: string;
  name: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  accessibilityLabel: string;
  badgeCount?: number;
  showBadgeDot?: boolean;
  badgeColor?: string;
  isActive?: boolean;
  color?: string;
}

export interface HeaderIconCapsuleProps {
  items: HeaderCapsuleItem[];
  style?: StyleProp<ViewStyle>;
}

export const HeaderIconCapsule: React.FC<HeaderIconCapsuleProps> = ({
  items,
  style,
}) => {
  const { colors, isDark } = useAppTheme();

  return (
    <View
      style={[
        styles.capsuleContainer,
        {
          backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.85)',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.14)' : 'rgba(124, 92, 224, 0.16)',
          shadowColor: isDark ? '#000000' : '#6E5ADC',
        },
        style,
      ]}>
      {items.map((item, index) => {
        const itemColor = item.color || (isDark ? colors.text : '#4B3FBF');

        return (
          <Pressable
            key={item.id || index}
            onPress={() => {
              if (Platform.OS !== 'web') {
                try {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                } catch (e) {}
              }
              item.onPress();
            }}
            accessibilityLabel={item.accessibilityLabel}
            accessibilityRole="button"
            style={({ pressed }) => [
              styles.capsuleButton,
              {
                backgroundColor: item.isActive
                  ? isDark
                    ? 'rgba(124, 92, 224, 0.28)'
                    : '#EAE6FB'
                  : 'transparent',
                transform: [{ scale: pressed ? 0.94 : 1 }],
              },
            ]}>
            <Ionicons name={item.name} size={18} color={itemColor} />

            {/* Badge Count or Dot */}
            {item.showBadgeDot && (
              <View
                style={[
                  styles.capsuleBadgeDot,
                  { backgroundColor: item.badgeColor || colors.red },
                ]}
              />
            )}
            {Boolean(item.badgeCount && item.badgeCount > 0) && (
              <View
                style={[
                  styles.capsuleBadgeCount,
                  { backgroundColor: item.badgeColor || colors.red },
                ]}>
                <Text style={styles.capsuleBadgeText}>
                  {item.badgeCount! > 99 ? '99+' : item.badgeCount}
                </Text>
              </View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  contentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  gradientContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  innerHighlight: {
    position: 'absolute',
    top: 0,
    left: 12,
    right: 12,
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.35)',
    borderRadius: 999,
  },
  buttonText: {
    letterSpacing: -0.2,
    textAlign: 'center',
    flexShrink: 0,
  },
  linkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    flexShrink: 0,
  },
  linkText: {
    fontSize: 14.5,
    fontWeight: '600',
    letterSpacing: -0.2,
    flexShrink: 0,
  },
  linkIcon: {
    marginLeft: 4,
  },
  // SOS Variant Styles
  sosContainer: {
    width: ButtonTokens.sosColumnWidth,
    height: ButtonTokens.sosColumnWidth,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  holdRingBackground: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: 'rgba(244, 63, 94, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  holdRingActive: {
    position: 'absolute',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
  },
  sosCircle: {
    overflow: 'hidden',
    shadowColor: '#F43F5E',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.40,
    shadowRadius: 14,
    elevation: 6,
  },
  sosGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sosHighlight: {
    position: 'absolute',
    top: 4,
    width: 28,
    height: 3,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.40)',
  },
  sosText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 1.2,
  },
  // Header Icon Capsule Styles
  capsuleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: ButtonTokens.capsuleHeight,
    borderRadius: 999,
    paddingHorizontal: 2,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 14,
    elevation: 3,
  },
  capsuleButton: {
    width: ButtonTokens.capsuleButton,
    height: ButtonTokens.capsuleButton,
    borderRadius: ButtonTokens.capsuleButton / 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  capsuleBadgeDot: {
    position: 'absolute',
    top: 7,
    right: 8,
    width: 7.5,
    height: 7.5,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  capsuleBadgeCount: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 15,
    height: 15,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  capsuleBadgeText: {
    color: '#FFFFFF',
    fontSize: 9,
    fontWeight: '800',
  },
});
