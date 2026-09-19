import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Platform,
  StyleSheet,
  AccessibilityInfo,
  AppState,
  AppStateStatus,
  Easing,
} from 'react-native';
import { useNavigation } from 'expo-router';

export interface PulseRingProps {
  /** Ring color (use token) */
  color: string;
  /** Base size of the element this ring wraps */
  size: number;
  /** Maximum scale (default 1.5) */
  maxScale?: number;
  /** Loop duration in ms (default 2000) */
  duration?: number;
  /** Delay before animation starts in ms (default 0) */
  delay?: number;
  /** Starting opacity (default 0.35). Fades to 0. */
  startOpacity?: number;
  /** If true, the ring is paused (e.g. SOS hold in progress) */
  paused?: boolean;
}

/**
 * A reusable pulsing ring that scales from 1→maxScale while fading
 * from startOpacity→0 on an infinite loop.
 *
 * - Absolutely positioned behind the parent (use inside a relative container).
 * - pointerEvents="none" — never intercepts touches.
 * - Animates only transform + opacity (native driver on iOS/Android).
 * - Respects Reduce Motion: shows a static ring at half opacity.
 * - Pauses when the app is backgrounded or screen is not focused.
 */
export const PulseRing: React.FC<PulseRingProps> = ({
  color,
  size,
  maxScale = 1.5,
  duration = 2000,
  delay = 0,
  startOpacity = 0.35,
  paused = false,
}) => {
  const navigation = useNavigation();
  const progress = useRef(new Animated.Value(0)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const reducedMotion = useRef(false);
  const appActive = useRef(true);
  const isScreenFocused = useRef(true);

  // Detect reduced motion
  useEffect(() => {
    const checkMotion = async () => {
      try {
        const isReduced = await AccessibilityInfo.isReduceMotionEnabled();
        reducedMotion.current = isReduced;
        if (isReduced) {
          stopAnim();
          progress.setValue(0.5); // static midpoint
        }
      } catch {}
    };
    checkMotion();

    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', (isReduced: boolean) => {
      reducedMotion.current = isReduced;
      if (isReduced) {
        stopAnim();
        progress.setValue(0.5);
      } else if (appActive.current && isScreenFocused.current && !paused) {
        startAnim();
      }
    });

    return () => sub?.remove();
  }, [paused]);

  // Pause on app background
  useEffect(() => {
    const handleAppState = (nextState: AppStateStatus) => {
      appActive.current = nextState === 'active';
      if (nextState === 'active' && !reducedMotion.current && !paused && isScreenFocused.current) {
        startAnim();
      } else if (nextState !== 'active') {
        stopAnim();
      }
    };
    const sub = AppState.addEventListener('change', handleAppState);
    return () => sub?.remove();
  }, [paused]);

  // Pause when screen loses focus
  useEffect(() => {
    if (!navigation || typeof navigation.addListener !== 'function') return;
    const unsubFocus = navigation.addListener('focus', () => {
      isScreenFocused.current = true;
      if (appActive.current && !reducedMotion.current && !paused) {
        startAnim();
      }
    });
    const unsubBlur = navigation.addListener('blur', () => {
      isScreenFocused.current = false;
      stopAnim();
    });
    return () => {
      unsubFocus?.();
      unsubBlur?.();
    };
  }, [navigation, paused]);

  const useNative = Platform.OS !== 'web';

  const startAnim = () => {
    stopAnim();
    if (reducedMotion.current || paused || !appActive.current || !isScreenFocused.current) return;

    const sequence = Animated.sequence([
      ...(delay > 0 ? [Animated.delay(delay)] : []),
      Animated.timing(progress, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: useNative,
      }),
      Animated.timing(progress, {
        toValue: 0,
        duration: 0,
        useNativeDriver: useNative,
      }),
    ]);

    animRef.current = Animated.loop(sequence);
    animRef.current.start();
  };

  const stopAnim = () => {
    if (animRef.current) {
      animRef.current.stop();
      animRef.current = null;
    }
  };

  // Start/stop based on paused prop
  useEffect(() => {
    if (paused || reducedMotion.current) {
      stopAnim();
      if (reducedMotion.current) {
        progress.setValue(0.5);
      }
    } else {
      startAnim();
    }
    return () => stopAnim();
  }, [paused]);

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [1, maxScale],
  });

  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [startOpacity, 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          transform: [{ scale }],
          opacity,
        },
      ]}
    />
  );
};

/**
 * A breathing glow that oscillates opacity between two values.
 * Used for the Assistant orb violet glow.
 */
export interface BreathingGlowProps {
  color: string;
  size: number;
  minOpacity?: number;
  maxOpacity?: number;
  duration?: number;
  paused?: boolean;
}

export const BreathingGlow: React.FC<BreathingGlowProps> = ({
  color,
  size,
  minOpacity = 0.5,
  maxOpacity = 0.9,
  duration = 3000,
  paused = false,
}) => {
  const opacity = useRef(new Animated.Value(minOpacity)).current;
  const animRef = useRef<Animated.CompositeAnimation | null>(null);
  const reducedMotion = useRef(false);

  const useNative = Platform.OS !== 'web';

  useEffect(() => {
    const checkMotion = async () => {
      try {
        const isReduced = await AccessibilityInfo.isReduceMotionEnabled();
        reducedMotion.current = isReduced;
        if (isReduced) {
          if (animRef.current) animRef.current.stop();
          opacity.setValue((minOpacity + maxOpacity) / 2);
        }
      } catch {}
    };
    checkMotion();

    const subMotion = AccessibilityInfo.addEventListener('reduceMotionChanged', (isReduced: boolean) => {
      reducedMotion.current = isReduced;
      if (isReduced) {
        if (animRef.current) animRef.current.stop();
        opacity.setValue((minOpacity + maxOpacity) / 2);
      } else if (!paused) {
        startAnim();
      }
    });

    const handleAppState = (nextState: AppStateStatus) => {
      if (nextState === 'active' && !reducedMotion.current && !paused) {
        startAnim();
      } else if (nextState !== 'active') {
        if (animRef.current) animRef.current.stop();
      }
    };
    const subApp = AppState.addEventListener('change', handleAppState);

    return () => {
      subMotion?.remove();
      subApp?.remove();
    };
  }, [paused]);

  const startAnim = () => {
    if (animRef.current) animRef.current.stop();
    if (reducedMotion.current || paused) return;

    animRef.current = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: maxOpacity,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: useNative,
        }),
        Animated.timing(opacity, {
          toValue: minOpacity,
          duration: duration / 2,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: useNative,
        }),
      ])
    );
    animRef.current.start();
  };

  useEffect(() => {
    if (paused || reducedMotion.current) {
      if (animRef.current) animRef.current.stop();
    } else {
      startAnim();
    }
    return () => {
      if (animRef.current) animRef.current.stop();
    };
  }, [paused]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.ring,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
          opacity,
        },
      ]}
    />
  );
};

const styles = StyleSheet.create({
  ring: {
    position: 'absolute',
    alignSelf: 'center',
  },
});
