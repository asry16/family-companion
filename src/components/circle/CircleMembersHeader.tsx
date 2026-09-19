import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui';

interface CircleMembersHeaderProps {
  onOpenQr: () => void;
  onOpenJoin: () => void;
  onAddMember: () => void;
  onOpenSettings: () => void;
}

export const CircleMembersHeader: React.FC<CircleMembersHeaderProps> = ({
  onOpenQr,
  onOpenJoin,
  onAddMember,
  onOpenSettings,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  return (
    <View style={styles.container}>
      {/* Section Title */}
      <Text
        style={[
          styles.sectionTitle,
          { color: colors.text, fontSize: isElderly ? 18 : 15 },
        ]}>
        MEMBERS & STATUS
      </Text>

      {/* Pill Actions Row */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsRow}>
        {/* 1. QR Code Pill */}
        <Button
          variant="tonal"
          size="sm"
          icon="qr-code"
          title="QR Code"
          onPress={onOpenQr}
        />

        {/* 2. Join Circle Pill */}
        <Button
          variant="tonal"
          size="sm"
          icon="person-add-outline"
          title="Join Circle"
          onPress={onOpenJoin}
        />

        {/* 3. Add Member */}
        <Button
          variant="primary"
          size="sm"
          icon="add"
          title="Add Member"
          onPress={onAddMember}
        />

        {/* 4. Settings Icon Button */}
        <Button
          variant="tonal"
          size="sm"
          circular
          icon="settings-outline"
          onPress={onOpenSettings}
          accessibilityLabel="Circle Settings"
        />
      </ScrollView>

    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 18,
    marginTop: 10,
    marginBottom: 2,
    gap: 8,
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
});
