import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useVoice } from '@/context/VoiceContext';

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
      subtitle: 'Schedule event or task',
      icon: 'calendar-outline' as const,
      accent: isDark ? '#38BDF8' : '#2563EB',
      glowBg: isDark ? 'rgba(56, 189, 248, 0.16)' : 'rgba(37, 99, 235, 0.1)',
      borderAccent: isDark ? 'rgba(56, 189, 248, 0.28)' : 'rgba(37, 99, 235, 0.18)',
    },
    {
      id: 'scan',
      title: 'Scan Document',
      subtitle: 'Prescriptions & vault',
      icon: 'scan-outline' as const,
      accent: isDark ? '#34D399' : '#059669',
      glowBg: isDark ? 'rgba(52, 211, 153, 0.16)' : 'rgba(16, 185, 129, 0.1)',
      borderAccent: isDark ? 'rgba(52, 211, 153, 0.28)' : 'rgba(16, 185, 129, 0.18)',
    },
    {
      id: 'checkin',
      title: 'Check In',
      subtitle: 'Broadcast safe status',
      icon: 'navigate-outline' as const,
      accent: isDark ? '#FBBF24' : '#D97706',
      glowBg: isDark ? 'rgba(251, 191, 36, 0.16)' : 'rgba(245, 158, 11, 0.1)',
      borderAccent: isDark ? 'rgba(251, 191, 36, 0.28)' : 'rgba(245, 158, 11, 0.18)',
    },
    {
      id: 'brief',
      title: 'AI Brief',
      subtitle: 'Voice morning brief',
      icon: 'sparkles' as const,
      accent: isDark ? '#C084FC' : '#7C3AED',
      glowBg: isDark ? 'rgba(192, 132, 252, 0.16)' : 'rgba(124, 58, 237, 0.1)',
      borderAccent: isDark ? 'rgba(192, 132, 252, 0.28)' : 'rgba(124, 58, 237, 0.18)',
    },
  ];

  return (
    <View style={styles.container}>
      {/* Section Header */}
      <View style={styles.headerRow}>
        <Text style={[styles.sectionTitle, { color: colors.text, fontSize: isElderly ? 18 : 15 }]}>
          QUICK ACTIONS
        </Text>
        <Pressable
          onPress={() => {
            if (onSeeAll) {
              onSeeAll();
            } else {
              router.push('/(tabs)/plans');
            }
          }}
          hitSlop={8}>
          <Text style={[styles.seeAllText, { color: isDark ? '#38BDF8' : colors.brandAccent }]}>
            See all →
          </Text>
        </Pressable>
      </View>

      {/* 2×2 Rounded Action Cards Grid */}
      <View style={styles.gridRow}>
        {actions.map((act) => (
          <Pressable
            key={act.id}
            onPress={() => handleAction(act.id as any)}
            style={({ pressed }) => [
              styles.actionCard,
              {
                backgroundColor: isDark ? '#111827' : '#FFFFFF',
                borderColor: act.borderAccent,
                opacity: pressed ? 0.88 : 1,
                transform: [{ scale: pressed ? 0.98 : 1 }],
                shadowColor: isDark ? act.accent : '#64748B',
              },
            ]}>
            {/* Glowing circular icon backdrop */}
            <View style={[styles.iconCircle, { backgroundColor: act.glowBg }]}>
              <Ionicons name={act.icon} size={20} color={act.accent} />
            </View>

            {/* Title & Short Subtitle */}
            <View style={styles.textStack}>
              <Text
                style={[
                  styles.cardTitle,
                  { color: colors.text, fontSize: isElderly ? 16 : 14 },
                ]}>
                {act.title}
              </Text>
              <Text
                numberOfLines={1}
                style={[
                  styles.cardSubtitle,
                  { color: isDark ? '#94A3B8' : '#64748B' },
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
    borderRadius: 22,
    borderWidth: 1.2,
    padding: 14,
    gap: 10,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  iconCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStack: {
    gap: 2,
  },
  cardTitle: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  cardSubtitle: {
    fontSize: 11,
    fontWeight: '500',
  },
});
