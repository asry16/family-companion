import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Image,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { FamilyMember } from '@/types';

interface CircleMemberRowProps {
  member: FamilyMember;
  isSelf?: boolean;
  accentColor?: string;
  isSelected?: boolean;
  onPress: () => void;
}

export const CircleMemberRow: React.FC<CircleMemberRowProps> = ({
  member,
  isSelf = false,
  accentColor = '#4F8EF7',
  isSelected = false,
  onPress,
}) => {
  const { colors, isDark } = useAppTheme();

  const initials = member.name.charAt(0).toUpperCase();
  const relation = member.relation || (isSelf ? 'Self' : 'Family');
  const place = member.humanLocation || 'At Home';
  const time = member.lastUpdated || 'Just now';
  
  const triggerHaptic = () => {
    if (Platform.OS !== 'web') { try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {} }
  };

  const handlePress = () => {
    triggerHaptic();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      style={({ pressed }) => [
        styles.rowCard,
        {
          backgroundColor: isSelected ? 'rgba(30, 39, 95, 0.6)' : 'rgba(20, 27, 74, 0.4)',
          borderColor: isSelected ? accentColor : 'rgba(130, 140, 255, 0.2)',
          opacity: pressed ? 0.85 : 1,
        },
      ]}>
      {/* Avatar */}
      <View style={styles.avatarContainer}>
        <View style={[styles.avatarCircle, { borderColor: accentColor }]}>
          {member.photoUrl ? (
            <Image source={{ uri: member.photoUrl }} style={styles.avatarImage} />
          ) : (
            <Text style={[styles.initialText, { color: accentColor }]}>{initials}</Text>
          )}
        </View>
        <View style={[styles.onlineDot, { backgroundColor: '#10B981' }]} />
      </View>

      {/* Info Column */}
      <View style={styles.infoCol}>
        <View style={styles.nameRow}>
          <Text numberOfLines={1} style={[styles.nameText, { color: '#FFFFFF' }]}>
            {member.name}
          </Text>
          {isSelf && (
            <View style={styles.youBadge}>
              <Text style={styles.youBadgeText}>You</Text>
            </View>
          )}
        </View>

        <View style={styles.subtitleRow}>
          <Ionicons name="location-sharp" size={11} color="#94A3B8" />
          <Text numberOfLines={1} style={styles.subtitleText}>
            {relation} • {place} • {time}
          </Text>
        </View>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={18} color="#C9CEFF" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  rowCard: {
    height: 72,
    borderRadius: 16,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    gap: 14,
    marginBottom: 8,
  },
  avatarContainer: {
    position: 'relative',
    width: 44, height: 44,
  },
  avatarCircle: {
    width: 44, height: 44,
    borderRadius: 22,
    borderWidth: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    alignItems: 'center', justifyContent: 'center',
  },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  initialText: { fontSize: 18, fontWeight: '700' },
  onlineDot: {
    position: 'absolute', bottom: -2, right: -2,
    width: 12, height: 12, borderRadius: 6,
    borderWidth: 2, borderColor: '#141A4A',
  },
  infoCol: { flex: 1, justifyContent: 'center', gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  nameText: { fontSize: 16, fontWeight: '700', letterSpacing: -0.2 },
  youBadge: {
    backgroundColor: 'rgba(139, 124, 246, 0.2)',
    paddingHorizontal: 6, paddingVertical: 2,
    borderRadius: 6,
  },
  youBadgeText: { color: '#8B7CF6', fontSize: 10, fontWeight: '800' },
  subtitleRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  subtitleText: { color: '#94A3B8', fontSize: 12, fontWeight: '500' },
});
