import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ViewStyle,
  StyleProp,
  Platform,
} from 'react-native';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  categoryTag?: string;
  actionText?: string;
  onActionPress?: () => void;
  style?: StyleProp<ViewStyle>;
  rightElement?: React.ReactNode;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  categoryTag,
  actionText = 'See all →',
  onActionPress,
  style,
  rightElement,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  const handleAction = () => {
    if (!onActionPress) return;
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    onActionPress();
  };

  return (
    <View style={[styles.container, style]}>
      {categoryTag ? (
        <Text style={[styles.categoryTag, { color: isDark ? colors.blue : colors.blue }]}>
          {categoryTag.toUpperCase()}
        </Text>
      ) : null}

      <View style={styles.row}>
        <View style={styles.titleColumn}>
          <Text
            style={[
              styles.title,
              {
                color: colors.text,
                fontSize: isElderly ? 22 : 19,
              },
            ]}>
            {title}
          </Text>
          {subtitle ? (
            <Text
              style={[
                styles.subtitle,
                { color: isDark ? colors.textMuted : colors.textSecondary },
              ]}>
              {subtitle}
            </Text>
          ) : null}
        </View>

        {rightElement ? (
          rightElement
        ) : onActionPress && actionText ? (
          <Pressable
            onPress={handleAction}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={({ pressed }) => [
              styles.actionPressable,
              { opacity: pressed ? 0.75 : 1 },
            ]}>
            <Text
              style={[
                styles.actionText,
                {
                  color: isDark ? colors.blue : colors.blue,
                },
              ]}>
              {actionText}
            </Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 4,
    paddingHorizontal: 2,
  },
  categoryTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginBottom: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  titleColumn: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  actionPressable: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
});
