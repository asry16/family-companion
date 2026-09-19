import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useVoice } from '@/context/VoiceContext';
import { SectionHeader } from '@/components/ui/SectionHeader';

interface QuickActionsGridProps {
  onSeeAll?: () => void;
}

export const QuickActionsGrid: React.FC<QuickActionsGridProps> = ({ onSeeAll }) => {
  const router = useRouter();
  const { colors, isDark, isElderly } = useAppTheme();
  const { sendFamilyPing, activeUser } = useFamily();
  const { startListening, speak } = useVoice();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const handleAction = (type: 'plan' | 'scan' | 'checkin' | 'brief') => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);

    switch (type) {
      case 'plan':
        router.push('/modal/new-plan');
        break;
      case 'scan':
        router.push('/modal/scan-document');
        break;
      case 'checkin':
        if (activeUser) {
          sendFamilyPing(activeUser.id, 'I am checking in! Status safe.');
        }
        alert('Status check-in broadcasted to your circle.');
        break;
      case 'brief':
        startListening((text) => {
          if (text) {
            speak(`FamilyOS processing: ${text}`);
            router.push({ pathname: '/(tabs)/ai', params: { initialQuery: text } });
          }
        });
        break;
    }
  };

  const actions = [
    {
      id: 'plan',
      title: 'Add Plan',
      subtitle: 'Create a new plan',
      icon: 'add' as const,
      accent: isDark ? colors.blue : '#4F8EF7',
      glowBg: isDark ? 'rgba(59, 111, 240, 0.20)' : '#EEF4FF',
      borderAccent: isDark ? 'rgba(59, 111, 240, 0.32)' : 'rgba(124, 92, 224, 0.14)',
    },
    {
      id: 'scan',
      title: 'Scan Document',
      subtitle: 'Extract important details',
      icon: 'scan-outline' as const,
      accent: '#7C5CE0',
      glowBg: isDark ? 'rgba(124, 92, 224, 0.20)' : '#F5F0FF',
      borderAccent: isDark ? 'rgba(124, 92, 224, 0.32)' : 'rgba(124, 92, 224, 0.14)',
    },
    {
      id: 'checkin',
      title: 'Check In',
      subtitle: 'Update your location',
      icon: 'paper-plane' as const,
      accent: '#2EBF8E',
      glowBg: isDark ? 'rgba(34, 197, 139, 0.20)' : '#EBFDF7',
      borderAccent: isDark ? 'rgba(34, 197, 139, 0.32)' : 'rgba(124, 92, 224, 0.14)',
    },
    {
      id: 'brief',
      title: 'AI Brief',
      subtitle: 'Understand it instantly',
      icon: 'sparkles' as const,
      accent: '#EC4899',
      glowBg: isDark ? 'rgba(236, 72, 153, 0.20)' : '#FDF2F8',
      borderAccent: isDark ? 'rgba(236, 72, 153, 0.32)' : 'rgba(124, 92, 224, 0.14)',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Reusable Section Header */}
      <SectionHeader
        title="Quick Actions"
        categoryTag="ACTIONS"
        actionText="See all →"
        onActionPress={() => {
          if (onSeeAll) {
            onSeeAll();
          } else {
            router.push('/(tabs)/plans');
          }
        }}
      />

      {/* 2×2 Rounded Action Cards Grid */}
      <View style={styles.gridRow}>
        {actions.map((act) => (
          <Pressable
            key={act.id}
            onPress={() => handleAction(act.id as any)}
            style={({ pressed }) => [
              styles.actionCard,
              {
                backgroundColor: colors.cardBackground,
                borderColor: isDark ? act.borderAccent : 'rgba(124, 92, 224, 0.14)',
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                shadowColor: isDark ? act.accent : '#6E5ADC',
              },
            ]}>
            {/* Glowing circular icon backdrop with subtle inner highlight */}
            <View
              style={[
                styles.iconCircle,
                {
                  backgroundColor: act.glowBg,
                  borderColor: isDark ? 'transparent' : 'rgba(255, 255, 255, 0.9)',
                },
              ]}>
              <Ionicons name={act.icon} size={20} color={act.accent} />
            </View>

            {/* Title & Short Subtitle in clean geometric sans */}
            <View style={styles.textStack}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: colors.text, fontSize: isElderly ? 16 : 15 },
                ]}>
                {act.title}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.cardSubtitle,
                  { color: isDark ? colors.textMuted : colors.textSecondary },
                ]}>
                {act.subtitle}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 10,
    marginTop: 4,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  seeAllText: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  gridRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionCard: {
    width: '48%',
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 14,
    gap: 8,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStack: {
    gap: 2,
  },
  cardTitle: {
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
});
