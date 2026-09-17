import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';

export default function NotificationsModal() {
  const router = useRouter();
  const { colors, isElderly } = useAppTheme();
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

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.navBar,
          {
            backgroundColor: colors.cardBackground,
            borderBottomColor: colors.borderSubtle,
          },
        ]}>
        <Text
          style={[
            styles.navTitle,
            { color: colors.text, fontSize: isElderly ? 22 : 17 },
          ]}>
          Smart Notifications
        </Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        <View
          style={[
            styles.infoBox,
            {
              backgroundColor: colors.blueSoft,
              borderColor: colors.blueBorder,
            },
          ]}>
          <Ionicons name="information-circle-outline" size={18} color={colors.blue} />
          <Text
            style={[
              styles.infoText,
              { color: colors.blue, fontSize: isElderly ? 14 : 12 },
            ]}>
            Kinly prioritizes notifications: Urgent, Important, and Normal. No spam.
          </Text>
        </View>

        {notifications.length > 0 ? (
          notifications.map((notif) => (
            <Pressable
              key={notif.id}
              onPress={() => markNotificationRead(notif.id)}
              style={({ pressed }) => [
                styles.notifCard,
                {
                  backgroundColor: colors.cardBackground,
                  borderColor: colors.border,
                  borderLeftColor:
                    notif.priority === 'urgent'
                      ? colors.red
                      : notif.priority === 'important'
                      ? colors.yellow
                      : colors.blue,
                  borderLeftWidth: 4,
                  opacity: notif.isRead ? 0.65 : pressed ? 0.85 : 1,
                },
              ]}>
              <View style={styles.topRow}>
                <View style={styles.titleRow}>
                  <Text
                    style={[
                      styles.title,
                      { color: colors.text, fontSize: isElderly ? 18 : 15 },
                    ]}>
                    {notif.title}
                  </Text>
                  {!notif.isRead && (
                    <View style={[styles.unreadDot, { backgroundColor: colors.brandAccent }]} />
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
                  { color: colors.textSecondary, fontSize: isElderly ? 16 : 13 },
                ]}>
                {notif.body}
              </Text>

              <Text
                style={[
                  styles.timestamp,
                  { color: colors.textMuted, fontSize: isElderly ? 13 : 11 },
                ]}>
                {notif.timestamp}
              </Text>
            </Pressable>
          ))
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
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  navTitle: {
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
    gap: 12,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 8,
    marginBottom: 4,
  },
  infoText: {
    flex: 1,
    fontWeight: '600',
    lineHeight: 18,
  },
  notifCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 6,
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
  title: {
    fontWeight: '700',
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  body: {
    lineHeight: 19,
  },
  timestamp: {
    fontWeight: '500',
    marginTop: 2,
  },
});
