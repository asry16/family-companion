import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';

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

  const timelineEvents = [
    {
      id: 'evt_1',
      time: '09:42 AM',
      title: 'Asmita arrived at Home',
      details: 'Geofence Sanctuary verified',
      nodeColor: '#10B981',
      pillText: 'Safe',
      pillBg: isDark ? 'rgba(52, 211, 153, 0.16)' : '#ECFDF5',
      pillColor: isDark ? '#34D399' : '#059669',
      route: '/(tabs)/family',
    },
    {
      id: 'evt_2',
      time: '11:15 AM',
      title: 'Pediatric checkup confirmed',
      details: 'Dr. Sharma • Clinic Downtown',
      nodeColor: isDark ? '#38BDF8' : '#2563EB',
      pillText: 'All good',
      pillBg: isDark ? 'rgba(56, 189, 248, 0.16)' : '#EFF6FF',
      pillColor: isDark ? '#38BDF8' : '#2563EB',
      route: '/(tabs)/plans',
    },
    {
      id: 'evt_3',
      time: '01:30 PM',
      title: 'Health card document synced',
      details: 'Updated to Private Family Vault',
      nodeColor: isDark ? '#C084FC' : '#7C3AED',
      pillText: 'Vault',
      pillBg: isDark ? 'rgba(192, 132, 252, 0.16)' : '#F5F3FF',
      pillColor: isDark ? '#C084FC' : '#7C3AED',
      route: '/(tabs)/memory',
    },
    {
      id: 'evt_4',
      time: '04:05 PM',
      title: 'School pickup & grocery route',
      details: 'Whole Foods • 3 items pending',
      nodeColor: isDark ? '#FBBF24' : '#D97706',
      pillText: 'View',
      pillBg: isDark ? 'rgba(251, 191, 36, 0.16)' : '#FFFBEB',
      pillColor: isDark ? '#FBBF24' : '#D97706',
      route: '/(tabs)/plans',
    },
  ];

  return (
    <View
      style={[
        styles.cardContainer,
        {
          backgroundColor: isDark ? '#111827' : '#FFFFFF',
          borderColor: isDark ? 'rgba(255, 255, 255, 0.09)' : 'rgba(0, 0, 0, 0.06)',
          shadowColor: isDark ? '#000000' : '#64748B',
        },
      ]}>
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Text style={[styles.mainHeading, { color: colors.text, fontSize: isElderly ? 18 : 16 }]}>
            Today in your Circle
          </Text>
          <View style={[styles.eventCountTag, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#EFF6FF' }]}>
            <Text style={[styles.eventCountText, { color: isDark ? '#38BDF8' : '#2563EB' }]}>
              {timelineEvents.length} events
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/plans')}
          hitSlop={8}>
          <Text style={[styles.timelineAllText, { color: isDark ? '#38BDF8' : colors.brandAccent }]}>
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
                <Text style={[styles.timeText, { color: isDark ? '#94A3B8' : '#64748B' }]}>
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
                      { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0' },
                    ]}
                  />
                )}
              </View>

              {/* Right: Content Stack & Status Pill */}
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
                      { color: isDark ? '#94A3B8' : '#64748B' },
                    ]}>
                    {item.details}
                  </Text>
                </View>

                {/* Status Pill & Navigation Chevron */}
                <View style={styles.pillWithChevron}>
                  <View style={[styles.statusPill, { backgroundColor: item.pillBg }]}>
                    <Text style={[styles.statusPillText, { color: item.pillColor }]}>
                      {item.pillText}
                    </Text>
                  </View>
                  <Ionicons
                    name="chevron-forward"
                    size={14}
                    color={isDark ? '#64748B' : '#94A3B8'}
                  />
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 24,
    borderWidth: 1.2,
    padding: 18,
    gap: 16,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 3,
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
