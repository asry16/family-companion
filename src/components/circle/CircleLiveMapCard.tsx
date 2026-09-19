import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Image,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { FamilyMember } from '@/types';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';
import { GlassCard } from '@/components/ui/GlassCard';

interface CircleLiveMapCardProps {
  onFullScreen?: () => void;
}

export const CircleLiveMapCard: React.FC<CircleLiveMapCardProps> = ({ onFullScreen }) => {
  const { colors, isDark, isElderly } = useAppTheme();
  const { members, activeUser } = useFamily();

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);

  // Radar / Beacon continuous animation
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
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

  const handleZoomIn = () => {
    triggerHaptic();
    setZoomLevel((z) => Math.min(z + 0.15, 1.45));
  };

  const handleZoomOut = () => {
    triggerHaptic();
    setZoomLevel((z) => Math.max(z - 0.15, 0.85));
  };

  const handleRecenter = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMemberId(null);
    setZoomLevel(1);
  };

  const broadcastingCount = members.length > 0 ? members.length : 1;

  // Selected member for highlight
  const activeFocusMember = members.find((m) => m.id === selectedMemberId);

  return (
    <GlassCard
      borderRadius={26}
      glowColor={isDark ? colors.blue : undefined}
      style={styles.cardWrapper}
      contentStyle={styles.cardContent}>
      
      {/* 1. Header: Map Icon, Title "LIVE FAMILY MAP", "Full Screen →" */}
      <View style={styles.headerRow}>
        <View style={styles.titleGroup}>
          <Ionicons name="map-outline" size={17} color={colors.blue} />
          <Text
            style={[
              styles.mainTitle,
              { color: colors.text, fontSize: isElderly ? 18 : 15 },
            ]}>
            LIVE FAMILY MAP
          </Text>
        </View>

        <Pressable
          onPress={() => {
            triggerHaptic();
            if (onFullScreen) onFullScreen();
          }}
          hitSlop={8}
          style={({ pressed }) => [
            styles.fullScreenPressable,
            { opacity: pressed ? 0.7 : 1 },
          ]}>
          <Text style={[styles.fullScreenText, { color: colors.blue }]}>
            Full Screen →
          </Text>
        </Pressable>
      </View>

      {/* 2. Rounded Map Container with Overlays */}
      <View
        style={[
          styles.mapContainer,
          {
            borderColor: isDark ? 'rgba(59, 111, 240, 0.3)' : 'rgba(20, 32, 58, 0.1)',
          },
        ]}>
        {/* Real Tile Background Image */}
        <Image
          source={{
            uri: isDark
              ? 'https://a.basemaps.cartocdn.com/dark_all/14/9889/6249@2x.png'
              : 'https://a.basemaps.cartocdn.com/rastertiles/voyager/14/9889/6249@2x.png',
          }}
          style={[
            styles.mapImageBackground,
            {
              transform: [{ scale: zoomLevel }],
            },
          ]}
          resizeMode="cover"
        />

        {/* Vector Roadways Overlay */}
        <View style={styles.vectorOverlay}>
          <View
            style={[
              styles.roadLine1,
              { backgroundColor: isDark ? 'rgba(59, 111, 240, 0.25)' : 'rgba(255, 255, 255, 0.7)' },
            ]}
          />
          <View
            style={[
              styles.roadLine2,
              { backgroundColor: isDark ? 'rgba(59, 111, 240, 0.20)' : 'rgba(255, 255, 255, 0.6)' },
            ]}
          />
        </View>

        {/* Light Mode Soft Lavender Map Overlay */}
        {!isDark && (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: 'rgba(238, 235, 252, 0.35)' },
            ]}
          />
        )}

        {/* HOME MARKER: Blue circle with house icon */}
        <View style={[styles.homeMarkerWrap, { left: '32%', top: '48%' }]}>
          <View
            style={[
              styles.homeGlowHalo,
              { backgroundColor: isDark ? 'rgba(59, 111, 240, 0.35)' : 'rgba(124, 92, 224, 0.20)' },
            ]}
          />
          <View style={[styles.homeCirclePin, { backgroundColor: colors.blue }]}>
            <Ionicons name="home" size={13} color="#FFFFFF" />
          </View>
          <View
            style={[
              styles.homeLabelTag,
              {
                backgroundColor: isDark ? 'rgba(15, 26, 58, 0.90)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(59, 111, 240, 0.40)' : 'rgba(124, 92, 224, 0.20)',
              },
            ]}>
            <Text style={[styles.homeLabelText, { color: colors.text }]}>Home</Text>
          </View>
        </View>

        {/* FAMILY MEMBER MARKERS: Circular avatars with glow and name label */}
        {members.map((member, idx) => {
          const isSelected = selectedMemberId === member.id;
          const fallbackX = 54 + (idx % 2 === 0 ? 12 : -18);
          const fallbackY = 40 + (idx % 2 === 0 ? -10 : 20);
          const coordsX = member.coords?.x ?? fallbackX;
          const coordsY = member.coords?.y ?? fallbackY;

          return (
            <Pressable
              key={member.id}
              onPress={() => {
                triggerHaptic();
                setSelectedMemberId(isSelected ? null : member.id);
              }}
              style={[
                styles.memberMarkerWrap,
                {
                  left: `${coordsX}%`,
                  top: `${coordsY}%`,
                  zIndex: isSelected ? 20 : 10,
                },
              ]}>
              {/* Pulsing Outer Glow Ring */}
              <Animated.View
                style={[
                  styles.markerPulseHalo,
                  {
                    backgroundColor: isDark ? 'rgba(34, 197, 139, 0.30)' : 'rgba(46, 191, 142, 0.20)',
                    transform: [
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [1, 1.4],
                        }),
                      },
                    ],
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 0.2],
                    }),
                  },
                ]}
              />

              {/* Avatar Wrap */}
              <View
                style={[
                  styles.avatarMarkerCircle,
                  {
                    borderColor: isSelected ? colors.blue : colors.green,
                    shadowColor: isSelected ? colors.blue : colors.green,
                  },
                ]}>
                <FamilyAvatar member={member} size="sm" showStatus={false} />
              </View>

              {/* Member Name Label */}
              <View
                style={[
                  styles.markerLabelWrap,
                  {
                    backgroundColor: isDark ? 'rgba(15, 26, 58, 0.92)' : '#FFFFFF',
                    borderColor: isSelected
                      ? colors.blue
                      : isDark
                      ? 'rgba(34, 197, 139, 0.40)'
                      : 'rgba(124, 92, 224, 0.18)',
                  },
                ]}>
                <View style={[styles.inlineGreenDot, { backgroundColor: colors.green }]} />
                <Text
                  style={[
                    styles.markerNameText,
                    {
                      color: colors.text,
                      fontWeight: isSelected ? '800' : '700',
                    },
                  ]}>
                  {member.name}
                </Text>
              </View>
            </Pressable>
          );
        })}

        {/* OVERLAYS: */}
        {/* Top-Left: Green "LIVE" Pill + "1 member broadcasting" */}
        <View
          style={[
            styles.liveStatusPill,
            {
              backgroundColor: isDark ? 'rgba(15, 26, 58, 0.90)' : 'rgba(255, 255, 255, 0.92)',
              borderColor: isDark ? 'rgba(34, 197, 139, 0.45)' : 'rgba(46, 191, 142, 0.35)',
            },
          ]}>
          <View style={styles.liveBadgeTag}>
            <View style={[styles.liveInnerDot, { backgroundColor: colors.green }]} />
            <Text style={[styles.liveBadgeText, { color: colors.green }]}>LIVE</Text>
          </View>
          <Text
            style={[
              styles.broadcastingText,
              { color: isDark ? colors.textMuted : colors.textSecondary },
            ]}>
            {broadcastingCount} {broadcastingCount === 1 ? 'member' : 'members'} broadcasting
          </Text>
        </View>

        {/* Top-Right: "Last updated 20:07" Pill */}
        <View
          style={[
            styles.updatedPill,
            {
              backgroundColor: isDark ? 'rgba(15, 26, 58, 0.90)' : 'rgba(255, 255, 255, 0.92)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(124, 92, 224, 0.14)',
            },
          ]}>
          <Ionicons name="time-outline" size={11} color={isDark ? colors.textMuted : colors.textSecondary} />
          <Text
            style={[
              styles.updatedPillText,
              { color: isDark ? colors.textMuted : colors.textSecondary },
            ]}>
            Last updated 20:07
          </Text>
        </View>

        {/* Right Controls: Zoom +/- and Locate Target Buttons */}
        <View style={styles.rightControlsCluster}>
          <Pressable
            onPress={handleZoomIn}
            style={[
              styles.controlCircleBtn,
              {
                backgroundColor: isDark ? 'rgba(15, 26, 58, 0.90)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(124, 92, 224, 0.15)',
              },
            ]}>
            <Ionicons name="add" size={16} color={colors.text} />
          </Pressable>

          <Pressable
            onPress={handleZoomOut}
            style={[
              styles.controlCircleBtn,
              {
                backgroundColor: isDark ? 'rgba(15, 26, 58, 0.90)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(124, 92, 224, 0.15)',
              },
            ]}>
            <Ionicons name="remove" size={16} color={colors.text} />
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic();
              if (activeUser) setSelectedMemberId(activeUser.id);
            }}
            style={[
              styles.controlCircleBtn,
              {
                backgroundColor: isDark ? 'rgba(15, 26, 58, 0.90)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(124, 92, 224, 0.15)',
              },
            ]}>
            <Ionicons name="locate" size={14} color={isDark ? colors.blue : '#7C5CE0'} />
          </Pressable>
        </View>

        {/* Bottom-Right: "Recenter" Pill */}
        <Pressable
          onPress={handleRecenter}
          style={[
            styles.recenterPill,
            {
              backgroundColor: isDark ? 'rgba(15, 26, 58, 0.92)' : 'rgba(255, 255, 255, 0.94)',
              borderColor: isDark ? 'rgba(59, 111, 240, 0.40)' : 'rgba(124, 92, 224, 0.20)',
            },
          ]}>
          <Ionicons name="compass-outline" size={13} color={isDark ? colors.blue : '#7C5CE0'} />
          <Text style={[styles.recenterText, { color: isDark ? colors.blue : '#7C5CE0' }]}>Recenter</Text>
        </Pressable>
      </View>

      {/* 3. Below Map: Member Filter Chips ("All (1)" + One chip per member with green dot) */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterChipsRow}>
        {/* "All (1)" Chip */}
        <Pressable
          onPress={() => {
            triggerHaptic();
            setSelectedMemberId(null);
          }}
          style={[
            styles.filterChip,
            {
              backgroundColor: !selectedMemberId
                ? isDark
                  ? colors.blue
                  : undefined
                : isDark
                ? 'rgba(255, 255, 255, 0.06)'
                : 'rgba(124, 92, 224, 0.08)',
              borderColor: !selectedMemberId
                ? isDark
                  ? colors.blue
                  : 'transparent'
                : isDark
                ? 'rgba(255, 255, 255, 0.12)'
                : 'rgba(124, 92, 224, 0.15)',
              overflow: 'hidden',
            },
          ]}>
          {!isDark && !selectedMemberId && (
            <LinearGradient
              colors={['#4F8EF7', '#8A6BF2']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          )}
          <Text
            style={[
              styles.filterChipText,
              {
                color: !selectedMemberId
                  ? '#FFFFFF'
                  : colors.text,
                fontWeight: !selectedMemberId ? '800' : '600',
              },
            ]}>
            All ({broadcastingCount})
          </Text>
        </Pressable>

        {/* Member Chips with Green Dot */}
        {members.map((m) => {
          const isSelected = selectedMemberId === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => {
                triggerHaptic();
                setSelectedMemberId(isSelected ? null : m.id);
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isSelected
                    ? isDark
                      ? colors.blue
                      : undefined
                    : isDark
                    ? 'rgba(255, 255, 255, 0.06)'
                    : 'rgba(124, 92, 224, 0.08)',
                  borderColor: isSelected
                    ? isDark
                      ? colors.blue
                      : 'transparent'
                    : isDark
                    ? 'rgba(255, 255, 255, 0.12)'
                    : 'rgba(124, 92, 224, 0.15)',
                  overflow: 'hidden',
                },
              ]}>
              {!isDark && isSelected && (
                <LinearGradient
                  colors={['#4F8EF7', '#8A6BF2']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={StyleSheet.absoluteFill}
                />
              )}
              <View
                style={[
                  styles.filterDot,
                  {
                    backgroundColor: isSelected
                      ? '#FFFFFF'
                      : colors.green,
                  },
                ]}
              />
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: isSelected
                      ? '#FFFFFF'
                      : colors.text,
                    fontWeight: isSelected ? '800' : '600',
                  },
                ]}>
                {m.name}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>
    </GlassCard>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    padding: 0,
    marginHorizontal: 18,
    marginVertical: 4,
  },
  cardContent: {
    padding: 16,
    gap: 12,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  titleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  mainTitle: {
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  fullScreenPressable: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  fullScreenText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Map Container
  mapContainer: {
    height: 220,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  mapImageBackground: {
    ...StyleSheet.absoluteFill,
    opacity: 0.85,
  },
  vectorOverlay: {
    ...StyleSheet.absoluteFill,
  },
  roadLine1: {
    position: 'absolute',
    top: '42%',
    left: 0,
    right: 0,
    height: 6,
    transform: [{ rotate: '-12deg' }],
  },
  roadLine2: {
    position: 'absolute',
    left: '52%',
    top: 0,
    bottom: 0,
    width: 6,
  },

  // Home Marker
  homeMarkerWrap: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -16 }, { translateY: -16 }],
  },
  homeGlowHalo: {
    position: 'absolute',
    width: 38,
    height: 38,
    borderRadius: 19,
  },
  homeCirclePin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#3B6FF0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 3,
  },
  homeLabelTag: {
    marginTop: 3,
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: 8,
    borderWidth: 1,
  },
  homeLabelText: {
    fontSize: 9.5,
    fontWeight: '800',
  },

  // Member Markers
  memberMarkerWrap: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -16 }, { translateY: -20 }],
  },
  markerPulseHalo: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    top: -4,
  },
  avatarMarkerCircle: {
    borderWidth: 2,
    borderRadius: 18,
    padding: 1,
    backgroundColor: '#FFFFFF',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  markerLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 3,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  inlineGreenDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  markerNameText: {
    fontSize: 10,
  },

  // Overlays
  liveStatusPill: {
    position: 'absolute',
    top: 10,
    left: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  liveBadgeTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  liveBadgeText: {
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  broadcastingText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  updatedPill: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 12,
    borderWidth: 1,
  },
  updatedPillText: {
    fontSize: 10,
    fontWeight: '600',
  },
  rightControlsCluster: {
    position: 'absolute',
    right: 10,
    top: 48,
    gap: 6,
  },
  controlCircleBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  recenterPill: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#3B6FF0',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  recenterText: {
    fontSize: 11,
    fontWeight: '800',
  },

  // Filter Chips Row
  filterChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterChipText: {
    fontSize: 12,
  },
});
