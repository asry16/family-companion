import React, { useMemo } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusChip, StatusChipVariant } from '@/components/ui/StatusChip';

export const CircleTimelineCard: React.FC = () => {
  const router = useRouter();
  const { colors, isDark, isElderly } = useAppTheme();
  const { notifications, members } = useFamily();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const timelineEvents = useMemo(() => {
    const items: Array<{
      id: string;
      time: string;
      title: string;
      subtitle?: string;
      nodeColor: string;
      variant: StatusChipVariant;
      colorScheme?: 'green' | 'blue' | 'purple' | 'yellow';
      route: string;
    }> = [];

    // Map recent notifications
    (notifications || []).slice(0, 4).forEach((n) => {
      const isUrgent = n.priority === 'urgent';
      const isImportant = n.priority === 'important';
      items.push({
        id: n.id,
        time: n.timestamp || 'Just now',
        title: n.title,
        subtitle: n.body,
        nodeColor: isUrgent ? colors.red : isImportant ? colors.yellow : colors.green,
        variant: (isUrgent ? 'Safe' : 'All good') as StatusChipVariant,
        colorScheme: isUrgent ? 'yellow' : 'green',
        route: '/(tabs)/plans',
      });
    });

    // If few notifications, also add member status updates
    if (items.length < 3 && members && members.length > 0) {
      members.slice(0, 3 - items.length).forEach((m) => {
        items.push({
          id: `member-loc-${m.id}`,
          time: m.lastUpdated || 'Live',
          title: `${m.name} is ${m.humanLocation || 'connected'}`,
          subtitle: m.statusMessage || (m.batteryLevel ? `Battery at ${m.batteryLevel}%` : undefined),
          nodeColor: colors.blue,
          variant: 'Safe',
          colorScheme: 'blue',
          route: '/(tabs)/family',
        });
      });
    }

    return items;
  }, [notifications, members, colors]);

  return (
    <GlassCard
      borderRadius={26}
      glowColor={isDark ? colors.blue : undefined}
      style={styles.cardContainer}
      contentStyle={styles.cardContent}>
      {/* Header: Clock Icon + "Today in your Circle" + "View all →" */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons
            name="time-outline"
            size={18}
            color={isDark ? colors.brandAccent : '#6D5BD0'}
          />
          <Text style={[styles.mainHeading, { color: colors.text, fontSize: isElderly ? 18 : 16.5 }]}>
            Today in your Circle
          </Text>
        </View>

        <Pressable
          onPress={() => {
            triggerHaptic();
            router.push('/(tabs)/plans');
          }}
          hitSlop={10}
          style={({ pressed }) => [
            styles.viewAllPressable,
            { opacity: pressed ? 0.75 : 1 },
          ]}>
          <Text style={[styles.timelineAllText, { color: isDark ? colors.brandAccent : '#6D5BD0' }]}>
            View all →
          </Text>
        </Pressable>
      </View>

      {/* Dynamic Timeline or Empty State */}
      {timelineEvents.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons
            name="sparkles-outline"
            size={22}
            color={isDark ? colors.brandAccent : '#6D5BD0'}
            style={styles.emptyIcon}
          />
          <Text style={[styles.emptyTitle, { color: colors.text }]}>
            All quiet in your Circle
          </Text>
          <Text style={[styles.emptySubtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
            Live family check-ins, location changes, and smart notifications will stream here in real time.
          </Text>
        </View>
      ) : (
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

                {/* Center: Colored Dot Node & Vertical Track */}
                <View style={styles.nodeColumn}>
                  <View style={[styles.glowingNodeOuter, { backgroundColor: item.nodeColor + '28' }]}>
                    <View style={[styles.glowingNodeInner, { backgroundColor: item.nodeColor }]} />
                  </View>
                  {!isLast && (
                    <View
                      style={[
                        styles.trackLine,
                        { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(124, 92, 224, 0.12)' },
                      ]}
                    />
                  )}
                </View>

                {/* Right: Content Stack (title, optional subtitle) & Right-Aligned StatusChip + Chevron */}
                <View style={styles.contentColumn}>
                  <View style={styles.eventTextStack}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.eventTitle,
                        { color: colors.text, fontSize: isElderly ? 15 : 14 },
                      ]}>
                      {item.title}
                    </Text>
                    {item.subtitle ? (
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.eventSubtitle,
                          { color: isDark ? colors.textMuted : colors.textSecondary },
                        ]}>
                        {item.subtitle}
                      </Text>
                    ) : null}
                  </View>

                  {/* Right-aligned StatusChip & Chevron */}
                  <View style={styles.chipAndChevronWrap}>
                    <StatusChip
                      variant={item.variant}
                      colorScheme={item.colorScheme}
                      size="sm"
                    />
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
      )}
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    padding: 0,
  },
  cardContent: {
    padding: 16,
    gap: 16,
  },
  emptyContainer: {
    paddingVertical: 18,
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  emptyIcon: {
    marginBottom: 2,
  },
  emptyTitle: {
    fontSize: 14.5,
    fontWeight: '700',
    letterSpacing: -0.1,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 12.5,
    fontWeight: '400',
    lineHeight: 17,
    textAlign: 'center',
    maxWidth: 280,
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
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  viewAllPressable: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  timelineAllText: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  timelineList: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    minHeight: 52,
  },
  timeColumn: {
    width: 44,
    paddingTop: 3,
    alignItems: 'flex-start',
  },
  timeText: {
    fontSize: 12,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  nodeColumn: {
    width: 24,
    alignItems: 'center',
    height: '100%',
    position: 'relative',
  },
  glowingNodeOuter: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
    zIndex: 2,
  },
  glowingNodeInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  trackLine: {
    position: 'absolute',
    top: 18,
    bottom: -8,
    width: 1.5,
    zIndex: 1,
  },
  contentColumn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: 8,
    paddingBottom: 14,
    gap: 8,
  },
  eventTextStack: {
    flex: 1,
    gap: 2,
  },
  eventTitle: {
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  eventSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  chipAndChevronWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
});
