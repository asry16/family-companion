import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Animated, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';
import { GlassCard } from '@/components/ui/GlassCard';
import { PillButton } from '@/components/ui/PillButton';

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

  // Continuous subtle pulse animation for glowing green shield circle
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
            <Animated.View
              style={[
                styles.shieldHalo,
                {
                  backgroundColor: isDark ? 'rgba(34, 197, 139, 0.28)' : 'rgba(46, 191, 142, 0.20)',
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
            <View style={[styles.onlineDot, { backgroundColor: colors.green }]} />
          </View>

          <View style={styles.memberDetailsCol}>
            <View style={styles.memberNameRow}>
              <View style={[styles.inlineDot, { backgroundColor: colors.green }]} />
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

        {/* Right: Faded mini-map thumbnail with green pin + "View Live Map →" pill button over it */}
        <View
          style={[
            styles.miniMapWrap,
            {
              borderColor: isDark ? 'rgba(34, 197, 139, 0.3)' : 'rgba(124, 92, 224, 0.16)',
            },
          ]}>
          <Image
            source={{
              uri: isDark
                ? 'https://a.basemaps.cartocdn.com/dark_all/14/9889/6249@2x.png'
                : 'https://a.basemaps.cartocdn.com/rastertiles/voyager/14/9889/6249@2x.png',
            }}
            style={styles.miniMapImage}
            resizeMode="cover"
          />

          {/* Faded overlay with lavender tint in light mode */}
          <View
            style={[
              styles.mapOverlay,
              {
                backgroundColor: isDark ? 'rgba(6, 11, 31, 0.45)' : 'rgba(238, 235, 252, 0.45)',
              },
            ]}
          />

          {/* Green Pin */}
          <View style={styles.greenPinWrap}>
            <View style={[styles.greenPinPulse, { backgroundColor: 'rgba(34, 197, 139, 0.35)' }]} />
            <View style={[styles.greenPinCircle, { backgroundColor: colors.green }]}>
              <Ionicons name="location" size={10} color="#FFFFFF" />
            </View>
          </View>

          {/* "View Live Map →" Pill Button Over It */}
          <PillButton
            title="View Live Map →"
            variant="primary"
            size="sm"
            onPress={onViewLiveMap}
            style={styles.viewLiveMapBtn}
            textStyle={styles.viewLiveMapBtnText}
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
  shieldHalo: {
    position: 'absolute',
    width: 42,
    height: 42,
    borderRadius: 21,
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
    overflow: 'hidden',
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  miniMapImage: {
    ...StyleSheet.absoluteFill,
    opacity: 0.65,
  },
  mapOverlay: {
    ...StyleSheet.absoluteFill,
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
    bottom: 10,
    right: 10,
    paddingHorizontal: 14,
    paddingVertical: 6,
    minHeight: 30,
  },
  viewLiveMapBtnText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
});
