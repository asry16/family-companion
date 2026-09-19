import React from 'react';
import { View, StyleSheet, StyleProp, ViewStyle } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { PulseRing } from './PulseRing';

export interface StatusDotProps {
  /** Size of the core dot in px (default 8) */
  size?: number;
  /** Color of the dot and halo (defaults to theme colors.green) */
  color?: string;
  /** Whether the halo pulse is enabled (default true) */
  pulsing?: boolean;
  /** Container style */
  style?: StyleProp<ViewStyle>;
  /** Core dot style */
  dotStyle?: StyleProp<ViewStyle>;
}

/**
 * StatusDot: A status beacon/dot with a pulsing halo.
 * Fulfills: "Every green status dot ('Your family is safe', online dots, the LIVE pill):
 * a small halo scaling from 1 to 2.2 while fading from 0.5 to 0, 1600ms loop."
 */
export const StatusDot: React.FC<StatusDotProps> = ({
  size = 8,
  color,
  pulsing = true,
  style,
  dotStyle,
}) => {
  const { colors } = useAppTheme();
  const dotColor = color || colors.green;

  return (
    <View style={[styles.container, { width: size, height: size }, style]}>
      {pulsing && (
        <PulseRing
          color={dotColor}
          size={size}
          maxScale={2.2}
          duration={1600}
          startOpacity={0.5}
        />
      )}
      <View
        style={[
          styles.dot,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor: dotColor,
          },
          dotStyle,
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dot: {
    zIndex: 1,
  },
});
