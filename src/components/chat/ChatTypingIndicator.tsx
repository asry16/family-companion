import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';

export const ChatTypingIndicator: React.FC = () => {
  const { colors, isDark } = useAppTheme();

  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnim = (val: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0,
            duration: 350,
            useNativeDriver: true,
          }),
          Animated.delay(500),
        ])
      );
    };

    const anim1 = createAnim(dot1, 0);
    const anim2 = createAnim(dot2, 150);
    const anim3 = createAnim(dot3, 300);

    anim1.start();
    anim2.start();
    anim3.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View style={styles.container}>
      {/* Assistant Header: Blue Sparkle Avatar + "Kinly AI" */}
      <View style={styles.assistantHeader}>
        <View
          style={[
            styles.sparkleAvatar,
            {
              backgroundColor: isDark ? '#1E293B' : '#EFF6FF',
              borderColor: isDark ? 'rgba(59, 111, 240, 0.40)' : 'rgba(59, 111, 240, 0.25)',
            },
          ]}>
          <Ionicons
            name="sparkles"
            size={12}
            color={isDark ? '#38BDF8' : colors.blue}
          />
        </View>
        <Text style={[styles.assistantName, { color: colors.text }]}>
          Kinly AI
        </Text>
      </View>

      {/* Bubble with three bouncing dots */}
      <View
        style={[
          styles.bubble,
          {
            backgroundColor: isDark
              ? 'rgba(15, 26, 58, 0.85)'
              : 'rgba(255, 255, 255, 0.90)',
            borderColor: isDark
              ? 'rgba(59, 111, 240, 0.25)'
              : 'rgba(20, 32, 58, 0.08)',
          },
        ]}>
        {[dot1, dot2, dot3].map((dot, idx) => (
          <Animated.View
            key={idx}
            style={[
              styles.dot,
              {
                backgroundColor: isDark ? '#38BDF8' : colors.blue,
                transform: [
                  {
                    translateY: dot.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, -5],
                    }),
                  },
                ],
                opacity: dot.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1],
                }),
              },
            ]}
          />
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 6,
    alignItems: 'flex-start',
    gap: 6,
  },
  assistantHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingLeft: 2,
  },
  sparkleAvatar: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  assistantName: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
});
