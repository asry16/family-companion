import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';
import { GlassCard } from '@/components/ui/GlassCard';
import { StatusChip } from '@/components/ui/StatusChip';
import { PillButton } from '@/components/ui/PillButton';

interface FamilyCardProps {
  onViewLiveMap: () => void;
}

export const FamilyCard: React.FC<FamilyCardProps> = ({ onViewLiveMap }) => {
  const { colors, isDark, isElderly } = useAppTheme();
  const { members, activeUser, places } = useFamily();

  // Highlight member: activeUser or first member
  const primaryMember = activeUser || members[0] || {
    id: 'self',
    name: 'Asmita',
    relation: 'Self',
    availability: 'available',
    isSharingLocation: true,
    humanLocation: 'Home • Family Sanctuary',
    lastUpdated: '2 min ago',
    batteryLevel: 87,
  };

  // Continuous subtle pulse animation for the shield and map beacon
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  // Safe place name
  const homePlace = places?.find((p) => p.type === 'home') || { name: 'Family Sanctuary', address: 'Home' };

  return (
    <View style={styles.outerContainer}>
      {/* Section Identifier as requested: "Family Card" */}
      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionCategoryTag, { color: isDark ? '#38BDF8' : '#2563EB' }]}>
          FAMILY CARD
        </Text>
      </View>

      {/* Main Glassmorphic Card */}
      <GlassCard
        borderRadius={26}
        glowColor={isDark ? colors.blue : undefined}
        style={styles.card}
        contentStyle={styles.cardContent}>
        {/* Top Header Row: 🛡️ Glowing Shield • "Family" */}
        <View style={styles.cardTopRow}>
          <View style={styles.titleWithShield}>
            {/* Glowing Circular Shield Element */}
            <View style={styles.shieldGlowWrap}>
              <Animated.View
                style={[
                  styles.shieldHalo,
                  {
                    backgroundColor: isDark ? 'rgba(59, 111, 240, 0.25)' : 'rgba(59, 111, 240, 0.15)',
                    transform: [
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.95, 1.25],
                        }),
                      },
                    ],
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 0.2],
                    }),
                  },
                ]}
              />
              <LinearGradient
                colors={isDark ? [colors.blue, '#2563EB'] : ['#2563EB', '#1D4ED8']}
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
                Family
              </Text>
              <Text style={[styles.cardSubHeading, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                Live Presence Active • Vault Synced
              </Text>
            </View>
          </View>

          {/* Quick live indicator tag via StatusChip */}
          <StatusChip variant="Safe" label="LIVE" size="sm" />
        </View>

        {/* Member Profile Details Strip */}
        <View
          style={[
            styles.memberPresenceStrip,
            {
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.65)' : '#F8FAFC',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            },
          ]}>
          <View style={styles.memberAvatarWrap}>
            <FamilyAvatar member={primaryMember as any} size="md" showStatus={false} />
            <View style={[styles.onlineDot, { backgroundColor: '#10B981' }]} />
          </View>

          <View style={styles.memberInfoCol}>
            <View style={styles.nameRow}>
              <Text style={[styles.memberName, { color: colors.text }]}>
                {primaryMember.name}
              </Text>
              <View
                style={[
                  styles.relationBadge,
                  {
                    backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#EFF6FF',
                  },
                ]}>
                <Text style={[styles.relationText, { color: isDark ? '#38BDF8' : '#2563EB' }]}>
                  {primaryMember.relation || 'Self'}
                </Text>
              </View>
            </View>

            <View style={styles.telemetryRow}>
              <View style={styles.locationPill}>
                <Ionicons name="home" size={11} color={colors.green} />
                <Text style={[styles.telemetryText, { color: colors.textSecondary }]}>
                  {homePlace.name || 'Home'}
                </Text>
              </View>
              <Text style={[styles.telemetryDot, { color: colors.textMuted }]}>•</Text>
              <Text style={[styles.telemetryText, { color: colors.textSecondary }]}>
                Active {primaryMember.lastUpdated || '2m ago'}
              </Text>
              <Text style={[styles.telemetryDot, { color: colors.textMuted }]}>•</Text>
              <View style={styles.batteryPill}>
                <Ionicons name="battery-half" size={11} color="#10B981" />
                <Text style={[styles.batteryText, { color: colors.textSecondary }]}>
                  {primaryMember.batteryLevel ?? 87}%
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Small Integrated Map Preview */}
        <View
          style={[
            styles.mapPreviewContainer,
            {
              backgroundColor: isDark ? '#0B1120' : '#E2E8F0',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(37, 99, 235, 0.15)',
            },
          ]}>
          {/* Stylized Raster Tile Snapshot Background */}
          <Image
            source={{
              uri: isDark
                ? 'https://a.basemaps.cartocdn.com/dark_all/14/9889/6249@2x.png'
                : 'https://a.basemaps.cartocdn.com/rastertiles/voyager/14/9889/6249@2x.png',
            }}
            style={styles.mapBackgroundImage}
            resizeMode="cover"
          />

          {/* Radar Scanner Grid Overlay */}
          <View style={styles.radarGridOverlay}>
            <View style={[styles.radarCrosshairH, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.12)' }]} />
            <View style={[styles.radarCrosshairV, { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : 'rgba(37, 99, 235, 0.12)' }]} />
          </View>

          {/* Glowing Center Beacon Marker */}
          <View style={styles.centerBeaconWrap}>
            <Animated.View
              style={[
                styles.beaconRadarWave,
                {
                  borderColor: isDark ? '#38BDF8' : '#2563EB',
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 2.1],
                      }),
                    },
                  ],
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 0],
                  }),
                },
              ]}
            />
            <View
              style={[
                styles.beaconPinCircle,
                {
                  backgroundColor: isDark ? '#38BDF8' : '#2563EB',
                  borderColor: '#FFFFFF',
                },
              ]}>
              <Text style={{ fontSize: 9 }}>🏡</Text>
            </View>
            <View
              style={[
                styles.beaconLabelPill,
                {
                  backgroundColor: isDark ? 'rgba(15, 23, 42, 0.9)' : 'rgba(255, 255, 255, 0.95)',
                  borderColor: isDark ? '#38BDF8' : '#2563EB',
                },
              ]}>
              <Text style={[styles.beaconLabelText, { color: isDark ? '#F8FAFC' : '#0F172A' }]}>
                {primaryMember.name}: Sanctuary
              </Text>
            </View>
          </View>

          {/* Prominent "View Live Map →" Button via PillButton */}
          <PillButton
            title="View Live Map →"
            variant="primary"
            size="sm"
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
              onViewLiveMap();
            }}
            style={styles.viewMapButton}
          />
        </View>
      </GlassCard>
    </View>
  );
};

const styles = StyleSheet.create({
  outerContainer: {
    gap: 8,
  },
  sectionHeaderRow: {
    paddingHorizontal: 4,
  },
  sectionCategoryTag: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  card: {
    padding: 0,
  },
  cardContent: {
    gap: 14,
  },
  cardTopRow: {
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
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  shieldHalo: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  shieldCoreCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  headingTextCol: {
    gap: 2,
    flex: 1,
  },
  cardMainHeading: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  cardSubHeading: {
    fontSize: 11.5,
    fontWeight: '500',
  },
  liveTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 8,
    paddingVertical: 3.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  liveMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveTagText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },

  // Member details strip
  memberPresenceStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 10,
    borderRadius: 18,
    borderWidth: 1,
  },
  memberAvatarWrap: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  onlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  memberInfoCol: {
    flex: 1,
    gap: 3,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  relationBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 6,
  },
  relationText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  telemetryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flexWrap: 'wrap',
  },
  locationPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  telemetryText: {
    fontSize: 11,
    fontWeight: '500',
  },
  telemetryDot: {
    fontSize: 9,
  },
  batteryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  batteryText: {
    fontSize: 10.5,
    fontWeight: '600',
  },

  // Map Preview
  mapPreviewContainer: {
    height: 130,
    borderRadius: 18,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapBackgroundImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.82,
  },
  radarGridOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radarCrosshairH: {
    position: 'absolute',
    width: '100%',
    height: 1,
  },
  radarCrosshairV: {
    position: 'absolute',
    height: '100%',
    width: 1,
  },
  centerBeaconWrap: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  beaconRadarWave: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
  },
  beaconPinCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  beaconLabelPill: {
    position: 'absolute',
    top: 28,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
  },
  beaconLabelText: {
    fontSize: 9.5,
    fontWeight: '700',
  },
  viewMapButton: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    paddingHorizontal: 12,
    paddingVertical: 6.5,
    borderRadius: 12,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 3,
  },
  viewMapText: {
    fontSize: 11.5,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
});
