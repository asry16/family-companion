import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusChip, StatusChipVariant } from '@/components/ui/StatusChip';

export const CircleTimelineCard: React.FC = () => {
  const router = useRouter();
  const { colors, isDark, isElderly } = useAppTheme();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const timelineEvents: Array<{
    id: string;
    time: string;
    title: string;
    details: string;
    nodeColor: string;
    variant: StatusChipVariant;
    route: string;
  }> = [
    {
      id: 'evt_1',
      time: '09:42 AM',
      title: 'Asmita arrived at Home',
      details: 'Geofence Sanctuary verified',
      nodeColor: colors.green,
      variant: 'Safe',
      route: '/(tabs)/family',
    },
    {
      id: 'evt_2',
      time: '11:15 AM',
      title: 'Pediatric checkup confirmed',
      details: 'Dr. Sharma • Clinic Downtown',
      nodeColor: colors.blue,
      variant: 'All good',
      route: '/(tabs)/plans',
    },
    {
      id: 'evt_3',
      time: '01:30 PM',
      title: 'Health card document synced',
      details: 'Updated to Private Family Vault',
      nodeColor: colors.purple,
      variant: 'Vault',
      route: '/(tabs)/memory',
    },
    {
      id: 'evt_4',
      time: '04:05 PM',
      title: 'School pickup & grocery route',
      details: 'Whole Foods • 3 items pending',
      nodeColor: isDark ? colors.yellow : '#D97706',
      variant: 'View',
      route: '/(tabs)/plans',
    },
  ];

  return (
    <GlassCard
      borderRadius={26}
      glowColor={isDark ? colors.blue : undefined}
      style={styles.cardContainer}
      contentStyle={styles.cardContent}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={[styles.mainHeading, { color: colors.text, fontSize: isElderly ? 18 : 16 }]}>
            Today in your Circle
          </Text>
          <View style={[styles.eventCountTag, { backgroundColor: isDark ? 'rgba(59, 111, 240, 0.15)' : 'rgba(59, 111, 240, 0.10)' }]}>
            <Text style={[styles.eventCountText, { color: colors.blue }]}>
              {timelineEvents.length} events
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/plans')}
          hitSlop={8}>
          <Text style={[styles.timelineAllText, { color: colors.blue }]}>
            History →
          </Text>
        </Pressable>
      </View>

      {/* Vertical Connected Timeline */}
      <View style={styles.timelineList}>
        {timelineEvents.map((item, index) => {
          const isLast = index === timelineEvents.length - 1;

          return (
            <Pressable
              key={item.id}
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
                router.push(item.route as any);
              }}
              style={({ pressed }) => [
                styles.timelineRow,
                { opacity: pressed ? 0.8 : 1 },
              ]}>
              {/* Left: Timestamp Column */}
              <View style={styles.timeColumn}>
                <Text style={[styles.timeText, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                  {item.time}
                </Text>
              </View>

              {/* Center: Glowing Node & Vertical Track */}
              <View style={styles.nodeColumn}>
                <View style={[styles.glowingNodeOuter, { backgroundColor: item.nodeColor + '25' }]}>
                  <View style={[styles.glowingNodeInner, { backgroundColor: item.nodeColor }]} />
                </View>
                {!isLast && (
                  <View
                    style={[
                      styles.trackLine,
                      { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(20, 32, 58, 0.08)' },
                    ]}
                  />
                )}
              </View>

              {/* Right: Content Stack & Status Pill via StatusChip */}
              <View style={styles.contentColumn}>
                <View style={styles.eventTextStack}>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.eventTitle,
                      { color: colors.text, fontSize: isElderly ? 15 : 13.5 },
                    ]}>
                    {item.title}
                  </Text>
                  <Text
                    numberOfLines={1}
                    style={[
                      styles.eventDetails,
                      { color: isDark ? colors.textMuted : colors.textSecondary },
                    ]}>
                    {item.details}
                  </Text>
                </View>

                {/* StatusChip & Navigation Chevron */}
                <View style={styles.pillWithChevron}>
                  <StatusChip variant={item.variant} size="sm" />
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={isDark ? colors.textMuted : colors.textSecondary}
                  />
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    padding: 0,
  },
  cardContent: {
    gap: 16,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mainHeading: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  eventCountTag: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 8,
  },
  eventCountText: {
    fontSize: 10,
    fontWeight: '700',
  },
  timelineAllText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Timeline list
  timelineList: {
    gap: 16,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  timeColumn: {
    width: 62,
    paddingTop: 2,
  },
  timeText: {
    fontSize: 10.5,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  nodeColumn: {
    alignItems: 'center',
    width: 22,
    marginRight: 10,
    position: 'relative',
  },
  glowingNodeOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  glowingNodeInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trackLine: {
    position: 'absolute',
    top: 16,
    bottom: -18,
    width: 1.5,
    zIndex: 1,
  },
  contentColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  eventTextStack: {
    flex: 1,
    gap: 2,
  },
  eventTitle: {
    fontWeight: '700',
  },
  eventDetails: {
    fontSize: 11,
    fontWeight: '500',
  },
  pillWithChevron: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  statusPillText: {
    fontSize: 10.5,
    fontWeight: '800',
  },
});
