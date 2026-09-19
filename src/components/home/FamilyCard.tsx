import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';
import { GlassCard } from '@/components/ui/GlassCard';
import { Button, PulseRing, StatusDot } from '@/components/ui';

interface FamilyCardProps {
  onViewLiveMap: () => void;
}

export const FamilyCard: React.FC<FamilyCardProps> = ({ onViewLiveMap }) => {
  const { colors, isDark, isElderly } = useAppTheme();
  const { members, activeUser } = useFamily();

  const primaryMember = activeUser || members[0] || {
    id: 'self',
    name: 'Asmita',
    relation: 'Self',
    availability: 'available',
    isSharingLocation: true,
    humanLocation: 'Home',
    lastUpdated: '2 min ago',
    batteryLevel: 87,
  };

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  return (
    <GlassCard
      borderRadius={26}
      glowColor={isDark ? colors.green : undefined}
      onPress={() => {
        triggerHaptic();
        onViewLiveMap();
      }}
      style={styles.card}
      contentStyle={styles.cardContent}>
      
      {/* 1. Header: Glowing green circle with shield icon, "Family Pulse", subtitle, chevron on right */}
      <View style={styles.headerRow}>
        <View style={styles.titleWithShield}>
          {/* Glowing Green Circle with Shield Icon */}
          <View style={styles.shieldGlowWrap}>
            <PulseRing
              color={isDark ? 'rgba(34, 197, 139, 0.35)' : 'rgba(46, 191, 142, 0.35)'}
              size={34}
              maxScale={1.35}
              duration={2400}
              startOpacity={0.4}
            />
            <LinearGradient
              colors={['#2EBF8E', '#22C58B']}
              style={styles.shieldCoreCircle}>
              <Ionicons name="shield-checkmark" size={17} color="#FFFFFF" />
            </LinearGradient>
          </View>

          <View style={styles.headingTextCol}>
            <Text
              style={[
                styles.cardMainHeading,
                { color: colors.text, fontSize: isElderly ? 21 : 18 },
              ]}>
              Family Pulse
            </Text>
            <Text style={[styles.cardSubHeading, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
              Live Presence Active • Vault Synced
            </Text>
          </View>
        </View>

        {/* Tappable Chevron on Right */}
        <Ionicons
          name="chevron-forward"
          size={19}
          color={isDark ? colors.textMuted : colors.textSecondary}
        />
      </View>

      {/* 2. Inner Row & Mini Map Section */}
      <View style={styles.bodySection}>
        {/* Left: Avatar, Asmita with green dot, Home with pin icon, divider, Last active / 2 min ago */}
        <View style={styles.memberInfoContainer}>
          <View style={styles.avatarWithStatus}>
            <FamilyAvatar member={primaryMember as any} size="md" showStatus={false} />
            <StatusDot
              size={10}
              color={colors.green}
              style={styles.onlineDot}
              dotStyle={{ borderWidth: 1.5, borderColor: '#FFFFFF' }}
            />
          </View>

          <View style={styles.memberDetailsCol}>
            <View style={styles.memberNameRow}>
              <StatusDot size={6} color={colors.green} />
              <Text style={[styles.memberNameText, { color: colors.text }]}>
                {primaryMember.name}
              </Text>
            </View>

            <View style={styles.statusMetaRow}>
              <View style={styles.locationTag}>
                <Ionicons name="location-sharp" size={12} color={colors.green} />
                <Text style={[styles.locationText, { color: colors.textSecondary }]}>
                  Home
                </Text>
              </View>

              <View style={[styles.verticalDivider, { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(124, 92, 224, 0.12)' }]} />

              <Text style={[styles.lastActiveText, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                Last active / 2 min ago
              </Text>
            </View>
          </View>
        </View>

        {/* Map Illustration — lavender gradient to avoid API key watermark */}
        <View
          style={[
            styles.miniMapWrap,
            {
              borderColor: isDark ? 'rgba(34, 197, 139, 0.3)' : 'rgba(124, 92, 224, 0.16)',
            },
          ]}>
          <LinearGradient
            colors={isDark
              ? ['#0D1530', '#131E3F', '#0F1733']
              : ['#EAE6FB', '#E0DBF8', '#D8D2F3']}
            style={styles.miniMapImage}
          />

          {/* Faded grid lines for map texture */}
          <View style={[styles.mapOverlay, { opacity: isDark ? 0.12 : 0.08 }]}>
            <View style={styles.mapGridHorizontal} />
            <View style={[styles.mapGridHorizontal, { top: '33%' }]} />
            <View style={[styles.mapGridHorizontal, { top: '66%' }]} />
            <View style={styles.mapGridVertical} />
            <View style={[styles.mapGridVertical, { left: '33%' }]} />
            <View style={[styles.mapGridVertical, { left: '66%' }]} />
          </View>

          {/* Green Pin */}
          <View style={styles.greenPinWrap}>
            <View style={[styles.greenPinPulse, { backgroundColor: 'rgba(34, 197, 139, 0.35)' }]} />
            <View style={[styles.greenPinCircle, { backgroundColor: colors.green }]}>
              <Ionicons name="location" size={10} color="#FFFFFF" />
            </View>
          </View>

          {/* "View Live Map" Small Pill */}
          <Button
            title="View Live Map"
            variant="primary"
            size="sm"
            icon="arrow-forward"
            iconPosition="right"
            onPress={onViewLiveMap}
            style={styles.viewLiveMapBtn}
          />
        </View>
      </View>
    </GlassCard>

  );
};

const styles = StyleSheet.create({
  card: {
    padding: 0,
  },
  cardContent: {
    padding: 16,
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleWithShield: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  shieldGlowWrap: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shieldCoreCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#22C58B',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 3,
  },
  headingTextCol: {
    gap: 2,
    flex: 1,
  },
  cardMainHeading: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  cardSubHeading: {
    fontSize: 11.5,
    fontWeight: '500',
  },

  // Body section
  bodySection: {
    gap: 12,
  },
  memberInfoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarWithStatus: {
    position: 'relative',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  memberDetailsCol: {
    flex: 1,
    gap: 4,
  },
  memberNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inlineDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  memberNameText: {
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.1,
  },
  statusMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  locationTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
  },
  verticalDivider: {
    width: 1,
    height: 12,
  },
  lastActiveText: {
    fontSize: 11.5,
    fontWeight: '500',
  },

  // Mini Map
  miniMapWrap: {
    height: 105,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'rgba(124, 92, 224, 0.16)',
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMapImage: {
    ...StyleSheet.absoluteFill,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFill,
  },
  mapGridHorizontal: {
    position: 'absolute',
    top: '50%',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: 'rgba(124, 92, 224, 0.15)',
  },
  mapGridVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '50%',
    width: 1,
    backgroundColor: 'rgba(124, 92, 224, 0.15)',
  },
  greenPinWrap: {
    position: 'absolute',
    top: 18,
    left: '42%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  greenPinPulse: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderRadius: 11,
  },
  greenPinCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  viewLiveMapBtn: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
});
