import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LightBackdrop, DarkBackdrop, GlassCard } from '@/components/ui';

export default function NotificationsModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, isElderly } = useAppTheme();
  const { notifications, markNotificationRead } = useFamily();

  const getPriorityVariant = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'red';
      case 'important':
        return 'yellow';
      default:
        return 'blue';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return { name: 'warning', color: '#EF4444', bg: isDark ? 'rgba(239, 68, 68, 0.16)' : 'rgba(239, 68, 68, 0.10)' };
      case 'important':
        return { name: 'alert-circle', color: '#F59E0B', bg: isDark ? 'rgba(245, 158, 11, 0.16)' : 'rgba(245, 158, 11, 0.10)' };
      default:
        return { name: 'notifications', color: isDark ? '#8A6BF2' : '#7C5CE0', bg: isDark ? 'rgba(138, 107, 242, 0.16)' : 'rgba(124, 92, 224, 0.10)' };
    }
  };

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    router.back();
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LightBackdrop />
      <DarkBackdrop />

      {/* Modern Frosted Header */}
      <View
        style={[
          styles.navBar,
          {
            paddingTop: insets.top > 0 ? insets.top + 8 : 16,
            borderBottomColor: isDark ? 'rgba(130, 140, 255, 0.14)' : 'rgba(124, 92, 224, 0.10)',
          },
        ]}>
        <View>
          <Text
            style={[
              styles.navTitle,
              { color: colors.text, fontSize: isElderly ? 22 : 18 },
            ]}>
            Notifications
          </Text>
          <Text style={[styles.navSubtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
            Priority alerts & family updates
          </Text>
        </View>

        <Pressable
          onPress={handleClose}
          hitSlop={8}
          style={[
            styles.closeBtn,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 92, 224, 0.08)',
              borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.16)',
            },
          ]}>
          <Ionicons name="close" size={19} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 30 }]}
        showsVerticalScrollIndicator={false}>
        {/* Info Banner */}
        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: isDark ? 'rgba(130, 140, 255, 0.08)' : 'rgba(240, 243, 255, 0.85)',
              borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.16)',
            },
          ]}>
          <Ionicons name="sparkles" size={17} color={isDark ? '#A594FD' : '#7C5CE0'} />
          <Text
            style={[
              styles.infoText,
              { color: isDark ? '#D8DCFF' : '#4E5375', fontSize: isElderly ? 14 : 12.5 },
            ]}>
            Kinly prioritizes urgent safety and time-sensitive reminders. Zero spam.
          </Text>
        </View>

        {notifications.length > 0 ? (
          notifications.map((notif) => {
            const iconConfig = getPriorityIcon(notif.priority);
            return (
              <GlassCard
                key={notif.id}
                borderRadius={22}
                onPress={() => markNotificationRead(notif.id)}
                style={[
                  styles.cardWrapper,
                  notif.isRead && { opacity: 0.68 },
                ]}
                contentStyle={styles.notifCard}>
                <View style={styles.topRow}>
                  <View style={styles.titleRow}>
                    <View
                      style={[
                        styles.iconBubble,
                        { backgroundColor: iconConfig.bg },
                      ]}>
                      <Ionicons
                        name={iconConfig.name as any}
                        size={16}
                        color={iconConfig.color}
                      />
                    </View>
                    <Text
                      style={[
                        styles.title,
                        { color: colors.text, fontSize: isElderly ? 17 : 15 },
                      ]}>
                      {notif.title}
                    </Text>
                    {!notif.isRead && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>

                  <StatusBadge
                    label={notif.priority}
                    variant={getPriorityVariant(notif.priority)}
                    size="sm"
                  />
                </View>

                <Text
                  style={[
                    styles.body,
                    { color: isDark ? colors.textMuted : colors.textSecondary, fontSize: isElderly ? 15 : 13 },
                  ]}>
                  {notif.body}
                </Text>

                <View style={styles.bottomRow}>
                  <Ionicons name="time-outline" size={13} color={colors.textMuted} />
                  <Text
                    style={[
                      styles.timestamp,
                      { color: colors.textMuted, fontSize: isElderly ? 13 : 11.5 },
                    ]}>
                    {notif.timestamp}
                  </Text>
                </View>
              </GlassCard>
            );
          })
        ) : (
          <EmptyState
            icon="notifications-off-outline"
            badge="Inbox Zero"
            title="All Caught Up"
            description="You have zero unread notifications. Kinly only interrupts you when it truly matters."
            actionLabel="Back to Home"
            onAction={() => router.back()}
          />
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  navTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  navSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    gap: 10,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderWidth: 1,
    gap: 10,
    marginBottom: 4,
  },
  infoText: {
    flex: 1,
    fontWeight: '600',
    lineHeight: 18,
  },
  cardWrapper: {
    marginBottom: 2,
  },
  notifCard: {
    padding: 16,
    gap: 8,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    paddingRight: 8,
  },
  iconBubble: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontWeight: '700',
    flex: 1,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#8A6BF2',
  },
  body: {
    lineHeight: 19,
    paddingLeft: 38,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingLeft: 38,
    marginTop: 2,
  },
  timestamp: {
    fontWeight: '500',
  },
});

