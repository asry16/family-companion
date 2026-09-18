import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  Linking,
  Animated,
  PanResponder,
  Dimensions,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { FamilyMember, FamilyPlace } from '@/types';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';
import { FamilyInviteModal } from '@/components/modals/FamilyInviteModal';

export type MemberPresenceStatus = 'HOME' | 'AWAY' | 'MOVING' | 'OFFLINE';

export interface PresenceInfo {
  status: MemberPresenceStatus;
  label: string;
  badgeColor: string;
  badgeBg: string;
  isLive: boolean;
}

export function getMemberPresence(member: FamilyMember, isDark: boolean): PresenceInfo {
  if (member.availability === 'offline' || member.isSharingLocation === false) {
    return {
      status: 'OFFLINE',
      label: 'OFFLINE',
      badgeColor: isDark ? '#94A3B8' : '#64748B',
      badgeBg: isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(100, 116, 139, 0.12)',
      isLive: false,
    };
  }

  const loc = (member.humanLocation || '').toLowerCase();
  const statusMsg = (member.statusMessage || '').toLowerCase();

  if (
    member.availability === 'in_transit' ||
    loc.includes('transit') ||
    loc.includes('moving') ||
    loc.includes('driving') ||
    loc.includes('on way') ||
    statusMsg.includes('transit')
  ) {
    return {
      status: 'MOVING',
      label: 'MOVING',
      badgeColor: '#F59E0B', // Amber
      badgeBg: isDark ? 'rgba(245, 158, 11, 0.18)' : 'rgba(245, 158, 11, 0.14)',
      isLive: true,
    };
  }

  if (
    member.currentPlaceId === 'place_home' ||
    loc.includes('home') ||
    statusMsg.includes('home')
  ) {
    return {
      status: 'HOME',
      label: 'HOME',
      badgeColor: '#10B981', // Mint / Teal
      badgeBg: isDark ? 'rgba(16, 185, 129, 0.20)' : 'rgba(16, 185, 129, 0.14)',
      isLive: true,
    };
  }

  return {
    status: 'AWAY',
    label: 'AWAY',
    badgeColor: isDark ? '#38BDF8' : '#2563EB', // Cyan / Royal Blue
    badgeBg: isDark ? 'rgba(56, 189, 248, 0.18)' : 'rgba(37, 99, 235, 0.12)',
    isLive: true,
  };
}

export const FamilyCommandCenter: React.FC = () => {
  const router = useRouter();
  const { colors, isDark, isElderly } = useAppTheme();
  const { members, activeUser, places, sendFamilyPing } = useFamily();

  // Selected member for map focus & bottom sheet
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Invite & Join Modal State
  const [inviteModalVisible, setInviteModalVisible] = useState(false);
  const [inviteModalTab, setInviteModalTab] = useState<'invite' | 'join'>('invite');

  // Interactive Map State: Pan & Zoom
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Map style toggle (Vector vs Satellite)
  const [mapMode, setMapMode] = useState<'streets' | 'satellite'>('streets');

  // Animation drivers
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const radarAnim = useRef(new Animated.Value(0)).current;
  const sheetTranslateY = useRef(new Animated.Value(400)).current;

  // Haptic feedback helper
  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  // Continuous pulse animation for live beacons & markers
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1600,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1600,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  // Radar circular scan for single-member onboarding
  useEffect(() => {
    const radarLoop = Animated.loop(
      Animated.timing(radarAnim, {
        toValue: 1,
        duration: 3000,
        useNativeDriver: true,
      })
    );
    radarLoop.start();
    return () => radarLoop.stop();
  }, [radarAnim]);

  // Handle Bottom Sheet Animation
  useEffect(() => {
    if (sheetVisible) {
      Animated.spring(sheetTranslateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 65,
        friction: 10,
      }).start();
    } else {
      Animated.timing(sheetTranslateY, {
        toValue: 400,
        duration: 220,
        useNativeDriver: true,
      }).start();
    }
  }, [sheetVisible, sheetTranslateY]);

  // Ensure active user is displayed if members list is empty
  const displayMembers: FamilyMember[] = useMemo(() => {
    if (members && members.length > 0) {
      return members;
    }
    if (activeUser) {
      return [activeUser];
    }
    return [];
  }, [members, activeUser]);

  // Home location coordinates from places
  const homePlace = useMemo<FamilyPlace | undefined>(() => {
    return places.find((p) => p.type === 'home' || p.id === 'place_home') || {
      id: 'place_home',
      name: 'Home',
      type: 'home',
      address: 'Family Sanctuary',
      emoji: '🏡',
      coords: { x: 50, y: 50 },
    };
  }, [places]);

  // Family status counts
  const statusSummary = useMemo(() => {
    let safeCount = 0;
    let homeCount = 0;
    let movingCount = 0;
    let latestActivity = 'Just now';

    displayMembers.forEach((m) => {
      const presence = getMemberPresence(m, isDark);
      if (presence.status !== 'OFFLINE') {
        safeCount += 1;
      }
      if (presence.status === 'HOME') {
        homeCount += 1;
      }
      if (presence.status === 'MOVING') {
        movingCount += 1;
      }
      if (m.lastUpdated && m.lastUpdated !== 'Just now') {
        latestActivity = m.lastUpdated;
      }
    });

    return {
      safeCount: Math.max(safeCount, 1),
      homeCount,
      movingCount,
      latestActivity,
      broadcastingCount: displayMembers.filter((m) => m.isSharingLocation !== false && m.availability !== 'offline').length || 1,
    };
  }, [displayMembers, isDark]);

  // Pan gesture responder for the interactive map
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 4 || Math.abs(gestureState.dy) > 4;
      },
      onPanResponderMove: (_, gestureState) => {
        setPanOffset((prev) => ({
          x: Math.min(Math.max(prev.x + gestureState.dx * 0.15, -120), 120),
          y: Math.min(Math.max(prev.y + gestureState.dy * 0.15, -120), 120),
        }));
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  // Zoom controls
  const handleZoomIn = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setZoomLevel((z) => Math.min(Number((z + 0.25).toFixed(2)), 2.2));
  };

  const handleZoomOut = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setZoomLevel((z) => Math.max(Number((z - 0.25).toFixed(2)), 0.8));
  };

  const handleRecenter = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setZoomLevel(1.0);
    setPanOffset({ x: 0, y: 0 });
    if (selectedMember) {
      // center towards selected member
      const memberX = selectedMember.coords?.x ?? 50;
      const memberY = selectedMember.coords?.y ?? 50;
      setPanOffset({
        x: (50 - memberX) * 1.5,
        y: (50 - memberY) * 1.5,
      });
    }
  };

  const openMemberSheet = (member: FamilyMember) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMember(member);
    setSheetVisible(true);

    // Pan map to focus member
    const memberX = member.coords?.x ?? 50;
    const memberY = member.coords?.y ?? 50;
    setPanOffset({
      x: (50 - memberX) * 1.8,
      y: (50 - memberY) * 1.8,
    });
  };

  const closeMemberSheet = () => {
    setSheetVisible(false);
  };

  const openInviteModal = (tab: 'invite' | 'join' = 'invite') => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setInviteModalTab(tab);
    setInviteModalVisible(true);
  };

  // Open directions in external maps app
  const handleOpenDirections = (member: FamilyMember) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const coords = member.coords;
    let url = '';
    if (coords?.latitude && coords?.longitude) {
      url = Platform.select({
        ios: `maps:0,0?q=${member.name}@${coords.latitude},${coords.longitude}`,
        android: `geo:0,0?q=${coords.latitude},${coords.longitude}(${member.name})`,
        default: `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`,
      }) || '';
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(member.humanLocation || member.name)}`;
    }
    Linking.openURL(url).catch(() => {
      alert(`Navigating to ${member.name}'s location...`);
    });
  };

  // Direct call handler
  const handleCallMember = (phone: string, name: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    if (!phone) {
      alert(`No phone registered for ${name}`);
      return;
    }
    Linking.openURL(`tel:${phone}`).catch(() => {
      alert(`Calling ${name} at ${phone}...`);
    });
  };

  // Direct ping handler
  const handlePingMember = (member: FamilyMember) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    sendFamilyPing(member.id, 'Live status check from Family Command Center.');
    alert(`Status check sent to ${member.name}`);
  };

  return (
    <View style={styles.commandCenterWrap}>
      {/* ========================================================================= */}
      {/* 1. LIVE CIRCLE PRESENCE HEADER                                            */}
      {/* ========================================================================= */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.headerLeftBlock}>
          <View style={styles.headerTitleLine}>
            <View style={[styles.liveBeaconRing, { borderColor: isDark ? '#34D399' : '#10B981' }]}>
              <Animated.View
                style={[
                  styles.liveBeaconCore,
                  {
                    backgroundColor: isDark ? '#34D399' : '#10B981',
                    transform: [
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.25],
                        }),
                      },
                    ],
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.65, 1],
                    }),
                  },
                ]}
              />
            </View>
            <Text style={[styles.headerTitle, { color: colors.text, fontSize: isElderly ? 18 : 15 }]}>
              LIVE CIRCLE
            </Text>
          </View>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Everyone’s presence, at a glance
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/family')}
          hitSlop={10}
          style={styles.headerSeeAllBtn}>
          <Text style={[styles.headerSeeAllText, { color: colors.brandAccent }]}>
            Circle Details →
          </Text>
        </Pressable>
      </View>

      {/* ========================================================================= */}
      {/* 1. HORIZONTAL PRESENCE CARDS LIST                                         */}
      {/* ========================================================================= */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presenceScrollContainer}>
        {displayMembers.map((member) => {
          const presence = getMemberPresence(member, isDark);
          const isSelected = selectedMember?.id === member.id;

          return (
            <Pressable
              key={member.id}
              onPress={() => openMemberSheet(member)}
              style={({ pressed }) => [
                styles.presenceCard,
                {
                  backgroundColor: isDark ? 'rgba(30, 41, 59, 0.85)' : '#FFFFFF',
                  borderColor: isSelected
                    ? colors.brandAccent
                    : isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : 'rgba(0, 0, 0, 0.06)',
                  shadowColor: isDark ? '#000000' : '#64748B',
                  opacity: pressed ? 0.92 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}>
              {/* Top Row: Animated Live Dot + Name + Battery */}
              <View style={styles.cardHeaderRow}>
                <View style={styles.cardUserIdentity}>
                  <View style={styles.avatarWrap}>
                    <FamilyAvatar member={member} size="sm" showStatus={false} />
                    {presence.isLive && (
                      <Animated.View
                        style={[
                          styles.cardLiveIndicator,
                          {
                            backgroundColor: presence.badgeColor,
                            transform: [
                              {
                                scale: pulseAnim.interpolate({
                                  inputRange: [0, 1],
                                  outputRange: [0.9, 1.3],
                                }),
                              },
                            ],
                          },
                        ]}
                      />
                    )}
                  </View>
                  <View style={styles.nameBlock}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.cardMemberName,
                        { color: colors.text, fontSize: isElderly ? 16 : 14 },
                      ]}>
                      {member.name.split(' ')[0]} {member.isSelf ? '(You)' : ''}
                    </Text>
                    {/* Status Badge: HOME / AWAY / MOVING / OFFLINE */}
                    <View
                      style={[
                        styles.statusBadgePill,
                        { backgroundColor: presence.badgeBg },
                      ]}>
                      <View
                        style={[
                          styles.statusDot,
                          { backgroundColor: presence.badgeColor },
                        ]}
                      />
                      <Text
                        style={[
                          styles.statusBadgeText,
                          { color: presence.badgeColor },
                        ]}>
                        {presence.label}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Battery percentage */}
                <View
                  style={[
                    styles.batteryBadge,
                    {
                      backgroundColor:
                        member.batteryLevel > 50 || member.isCharging
                          ? isDark
                            ? 'rgba(16, 185, 129, 0.15)'
                            : '#ECFDF5'
                          : isDark
                          ? 'rgba(245, 158, 11, 0.15)'
                          : '#FFFBEB',
                      borderColor:
                        member.batteryLevel > 50 || member.isCharging
                          ? isDark
                            ? 'rgba(16, 185, 129, 0.35)'
                            : '#A7F3D0'
                          : isDark
                          ? 'rgba(245, 158, 11, 0.35)'
                          : '#FDE68A',
                    },
                  ]}>
                  <Ionicons
                    name={
                      member.isCharging
                        ? 'flash'
                        : member.batteryLevel > 25
                        ? 'battery-half'
                        : 'battery-dead'
                    }
                    size={11}
                    color={
                      member.batteryLevel > 50 || member.isCharging
                        ? '#10B981'
                        : '#F59E0B'
                    }
                  />
                  <Text
                    style={[
                      styles.batteryText,
                      {
                        color:
                          member.batteryLevel > 50 || member.isCharging
                            ? isDark
                              ? '#34D399'
                              : '#059669'
                            : isDark
                            ? '#FBBF24'
                            : '#D97706',
                      },
                    ]}>
                    {member.batteryLevel}%
                  </Text>
                </View>
              </View>

              {/* Bottom Row: Location & Last Updated */}
              <View style={styles.cardFooter}>
                <View style={styles.locationRow}>
                  <Ionicons name="location-sharp" size={12} color={colors.textSecondary} />
                  <Text
                    numberOfLines={1}
                    style={[styles.cardLocationText, { color: colors.textSecondary }]}>
                    {member.humanLocation || 'Location sharing active'}
                  </Text>
                </View>
                <Text style={[styles.cardUpdatedText, { color: colors.textMuted }]}>
                  Updated {member.lastUpdated || '2 min ago'}
                </Text>
              </View>
            </Pressable>
          );
        })}

        {/* Compact "+ Add Member" Card at the end */}
        <Pressable
          onPress={() => openInviteModal('invite')}
          style={({ pressed }) => [
            styles.compactAddMemberCard,
            {
              backgroundColor: isDark ? 'rgba(30, 41, 59, 0.6)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <View
            style={[
              styles.compactAddIconCircle,
              { backgroundColor: isDark ? 'rgba(56, 189, 248, 0.15)' : '#EFF6FF' },
            ]}>
            <Ionicons
              name="person-add"
              size={18}
              color={isDark ? '#38BDF8' : colors.brandAccent}
            />
          </View>
          <Text
            style={[
              styles.compactAddTitle,
              { color: colors.text, fontSize: isElderly ? 14 : 12 },
            ]}>
            + Add Member
          </Text>
          <Text style={[styles.compactAddSub, { color: colors.textSecondary }]}>
            Invite family
          </Text>
        </Pressable>
      </ScrollView>

      {/* ========================================================================= */}
      {/* 2. INTENTIONAL ONBOARDING BANNER (WHEN ONLY 1 MEMBER CONNECTED)           */}
      {/* ========================================================================= */}
      {displayMembers.length <= 1 && (
        <View
          style={[
            styles.onboardingCard,
            {
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.85)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(37, 99, 235, 0.15)',
              shadowColor: isDark ? '#000000' : '#3B82F6',
            },
          ]}>
          <View style={styles.onboardingRow}>
            {/* Animated Radar Circle Illustration */}
            <View style={styles.radarIllustrationWrap}>
              <Animated.View
                style={[
                  styles.radarCircleOuter,
                  {
                    borderColor: isDark ? 'rgba(56, 189, 248, 0.25)' : 'rgba(37, 99, 235, 0.2)',
                    transform: [
                      {
                        scale: radarAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.6, 1.15],
                        }),
                      },
                    ],
                    opacity: radarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 0.1],
                    }),
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.radarCircleMid,
                  {
                    borderColor: isDark ? 'rgba(52, 211, 153, 0.35)' : 'rgba(16, 185, 129, 0.3)',
                    transform: [
                      {
                        scale: radarAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.4, 0.85],
                        }),
                      },
                    ],
                    opacity: radarAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.9, 0.2],
                    }),
                  },
                ]}
              />
              <View
                style={[
                  styles.radarCenterBeacon,
                  { backgroundColor: isDark ? '#38BDF8' : colors.brandAccent },
                ]}>
                <Ionicons name="sparkles" size={14} color="#FFFFFF" />
              </View>
            </View>

            {/* Onboarding Text */}
            <View style={styles.onboardingTextCol}>
              <Text
                style={[
                  styles.onboardingTitle,
                  { color: isDark ? '#38BDF8' : colors.brandAccent },
                ]}>
                ✦ YOUR CIRCLE STARTS HERE
              </Text>
              <Text
                style={[
                  styles.onboardingSubtitle,
                  { color: colors.textSecondary, fontSize: isElderly ? 14 : 12 },
                ]}>
                Invite your family to see their live presence and location.
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.onboardingActionsRow}>
            <Pressable
              onPress={() => openInviteModal('invite')}
              style={({ pressed }) => [
                styles.onboardingPrimaryBtn,
                {
                  backgroundColor: colors.brandAccent,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}>
              <Ionicons name="person-add" size={14} color={colors.buttonTextOnAccent} />
              <Text
                style={[
                  styles.onboardingPrimaryBtnText,
                  { color: colors.buttonTextOnAccent },
                ]}>
                + Add Family Member
              </Text>
            </Pressable>

            <Text style={[styles.onboardingOrDivider, { color: colors.textMuted }]}>
              or
            </Text>

            <Pressable
              onPress={() => openInviteModal('join')}
              style={({ pressed }) => [
                styles.onboardingSecondaryBtn,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#F8FAFC',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                  opacity: pressed ? 0.85 : 1,
                },
              ]}>
              <Ionicons name="qr-code-outline" size={14} color={colors.text} />
              <Text style={[styles.onboardingSecondaryBtnText, { color: colors.text }]}>
                Scan QR
              </Text>
            </Pressable>
          </View>
        </View>
      )}

      {/* ========================================================================= */}
      {/* 3. FAMILY STATUS SUMMARY                                                  */}
      {/* ========================================================================= */}
      <View
        style={[
          styles.statusSummaryCard,
          {
            backgroundColor: isDark ? 'rgba(30, 41, 59, 0.8)' : '#FFFFFF',
            borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
            shadowColor: isDark ? '#000000' : '#64748B',
          },
        ]}>
        <View style={styles.statusSummaryHeader}>
          <Text style={[styles.statusSummaryTitle, { color: colors.textMuted }]}>
            FAMILY STATUS
          </Text>
          <Pressable
            onPress={() => router.push('/(tabs)/family')}
            hitSlop={8}
            style={styles.viewCircleLink}>
            <Text style={[styles.viewCircleText, { color: colors.brandAccent }]}>
              View Circle →
            </Text>
          </Pressable>
        </View>

        <View style={styles.statusSummaryMetricsRow}>
          {/* Safe Count */}
          <View style={styles.metricItem}>
            <View style={[styles.metricDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.metricLabel, { color: colors.text }]}>
              <Text style={styles.metricBold}>{statusSummary.safeCount}</Text> Safe
            </Text>
          </View>

          {/* Home Count */}
          <View style={styles.metricItem}>
            <View style={[styles.metricDot, { backgroundColor: isDark ? '#38BDF8' : '#2563EB' }]} />
            <Text style={[styles.metricLabel, { color: colors.text }]}>
              <Text style={styles.metricBold}>{statusSummary.homeCount}</Text> Home
            </Text>
          </View>

          {/* Moving Count (if any) */}
          {statusSummary.movingCount > 0 && (
            <View style={styles.metricItem}>
              <View style={[styles.metricDot, { backgroundColor: '#F59E0B' }]} />
              <Text style={[styles.metricLabel, { color: colors.text }]}>
                <Text style={styles.metricBold}>{statusSummary.movingCount}</Text> Moving
              </Text>
            </View>
          )}

          {/* Spacer */}
          <View style={{ flex: 1 }} />

          {/* Last Activity */}
          <Text style={[styles.metricTimestamp, { color: colors.textSecondary }]}>
            Last activity: {statusSummary.latestActivity}
          </Text>
        </View>
      </View>

      {/* ========================================================================= */}
      {/* 4. LIVE FAMILY MAP HERO SECTION                                           */}
      {/* ========================================================================= */}
      <View style={styles.mapSectionHeader}>
        <View style={styles.mapSectionTitleWrap}>
          <Ionicons
            name="navigate-circle"
            size={18}
            color={isDark ? '#38BDF8' : colors.brandAccent}
          />
          <Text
            style={[
              styles.mapSectionTitle,
              { color: colors.text, fontSize: isElderly ? 18 : 15 },
            ]}>
            LIVE FAMILY MAP
          </Text>
        </View>

        <View style={styles.mapHeaderRightRow}>
          {/* Vector / Satellite switch */}
          <Pressable
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setMapMode(mapMode === 'streets' ? 'satellite' : 'streets');
            }}
            style={[
              styles.mapModePill,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : '#E2E8F0',
              },
            ]}>
            <Ionicons
              name={mapMode === 'streets' ? 'layers-outline' : 'map-outline'}
              size={12}
              color={colors.textSecondary}
            />
            <Text style={[styles.mapModeText, { color: colors.textSecondary }]}>
              {mapMode === 'streets' ? 'Vector' : 'Satellite'}
            </Text>
          </Pressable>

          <Pressable
            onPress={() => router.push('/(tabs)/family')}
            hitSlop={8}>
            <Text style={[styles.fullScreenLink, { color: colors.brandAccent }]}>
              Full Screen →
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Real Interactive Map Canvas */}
      <View
        style={[
          styles.mapContainer,
          {
            backgroundColor:
              mapMode === 'satellite'
                ? '#0F172A'
                : isDark
                ? '#0B132B'
                : '#EFF6FF',
            borderColor: isDark ? 'rgba(56, 189, 248, 0.2)' : 'rgba(37, 99, 235, 0.15)',
            shadowColor: isDark ? '#000000' : '#1E293B',
          },
        ]}
        {...panResponder.panHandlers}>
        {/* Vector Map Roads, Grid & Waterways */}
        <Animated.View
          style={[
            styles.mapInnerPlane,
            {
              transform: [
                { translateX: panOffset.x },
                { translateY: panOffset.y },
                { scale: zoomLevel },
              ],
            },
          ]}>
          {/* Waterways */}
          <View
            style={[
              styles.mapRiver,
              {
                backgroundColor:
                  mapMode === 'satellite'
                    ? '#1E293B'
                    : isDark
                    ? '#0D274C'
                    : '#BAE6FD',
              },
            ]}
          />
          {/* Grid lines / streets */}
          <View
            style={[
              styles.mapStreetH1,
              {
                backgroundColor:
                  mapMode === 'satellite'
                    ? '#334155'
                    : isDark
                    ? '#1E293B'
                    : '#E2E8F0',
              },
            ]}
          />
          <View
            style={[
              styles.mapStreetH2,
              {
                backgroundColor:
                  mapMode === 'satellite'
                    ? '#334155'
                    : isDark
                    ? '#1E293B'
                    : '#E2E8F0',
              },
            ]}
          />
          <View
            style={[
              styles.mapStreetV1,
              {
                backgroundColor:
                  mapMode === 'satellite'
                    ? '#334155'
                    : isDark
                    ? '#1E293B'
                    : '#E2E8F0',
              },
            ]}
          />
          <View
            style={[
              styles.mapStreetV2,
              {
                backgroundColor:
                  mapMode === 'satellite'
                    ? '#334155'
                    : isDark
                    ? '#1E293B'
                    : '#E2E8F0',
              },
            ]}
          />
          {/* Park zone */}
          <View
            style={[
              styles.mapParkArea,
              {
                backgroundColor:
                  mapMode === 'satellite'
                    ? 'rgba(16, 185, 129, 0.06)'
                    : isDark
                    ? 'rgba(16, 185, 129, 0.12)'
                    : 'rgba(16, 185, 129, 0.16)',
              },
            ]}
          />

          {/* Home Location Marker */}
          {homePlace && (
            <View
              style={[
                styles.homeMarkerWrap,
                {
                  left: `${homePlace.coords.x}%`,
                  top: `${homePlace.coords.y}%`,
                },
              ]}>
              <View
                style={[
                  styles.homeHalo,
                  {
                    backgroundColor: isDark
                      ? 'rgba(56, 189, 248, 0.15)'
                      : 'rgba(37, 99, 235, 0.12)',
                  },
                ]}
              />
              <View
                style={[
                  styles.homeBadge,
                  {
                    backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                    borderColor: isDark ? '#38BDF8' : '#2563EB',
                  },
                ]}>
                <Text style={styles.homeEmoji}>🏡</Text>
                <Text
                  style={[
                    styles.homeLabel,
                    { color: isDark ? '#FFFFFF' : '#1E293B' },
                  ]}>
                  Home
                </Text>
              </View>
            </View>
          )}

          {/* Family Member Dynamic Markers */}
          {displayMembers.map((member, idx) => {
            const presence = getMemberPresence(member, isDark);
            const isFocused = selectedMember?.id === member.id;

            // Fallback coordinate positioning if not specified in telemetry
            const fallbackX = 50 + ((idx * 28 + 15) % 60) - 30;
            const fallbackY = 48 + ((idx * 34 + 10) % 50) - 25;
            const posX = member.coords?.x ?? fallbackX;
            const posY = member.coords?.y ?? fallbackY;

            return (
              <Pressable
                key={member.id}
                onPress={() => openMemberSheet(member)}
                style={[
                  styles.memberMarkerPin,
                  {
                    left: `${posX}%`,
                    top: `${posY}%`,
                    zIndex: isFocused ? 50 : 20,
                  },
                ]}>
                {/* Live Pulse Halo (Mint in light, restrained Cyan/Mint glow in dark) */}
                {presence.isLive && (
                  <Animated.View
                    style={[
                      styles.markerRadarHalo,
                      {
                        borderColor: isDark ? '#34D399' : '#10B981',
                        shadowColor: isDark ? '#34D399' : '#10B981',
                        transform: [
                          {
                            scale: pulseAnim.interpolate({
                              inputRange: [0, 1],
                              outputRange: [1, 1.45],
                            }),
                          },
                        ],
                        opacity: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.85, 0.15],
                        }),
                      },
                    ]}
                  />
                )}

                {/* Pin Name Callout */}
                <View
                  style={[
                    styles.pinNamePill,
                    {
                      backgroundColor: isFocused
                        ? colors.brandAccent
                        : isDark
                        ? 'rgba(15, 23, 42, 0.92)'
                        : '#FFFFFF',
                      borderColor: isFocused
                        ? '#FFFFFF'
                        : isDark
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'rgba(0, 0, 0, 0.1)',
                    },
                  ]}>
                  <View
                    style={[
                      styles.pinLiveTinyDot,
                      { backgroundColor: presence.badgeColor },
                    ]}
                  />
                  <Text
                    style={[
                      styles.pinNameText,
                      {
                        color: isFocused
                          ? colors.buttonTextOnAccent
                          : colors.text,
                      },
                    ]}>
                    {member.name.split(' ')[0]}
                  </Text>
                  <Text
                    style={[
                      styles.pinBatteryText,
                      {
                        color: isFocused
                          ? colors.buttonTextOnAccent
                          : colors.textSecondary,
                      },
                    ]}>
                    🔋{member.batteryLevel}%
                  </Text>
                </View>

                {/* Circular Avatar Marker with Status Ring */}
                <View
                  style={[
                    styles.avatarMarkerCircle,
                    {
                      borderColor: presence.badgeColor,
                      backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
                    },
                  ]}>
                  <FamilyAvatar member={member} size="sm" showStatus={false} />
                  {presence.status === 'MOVING' && (
                    <View style={styles.movingSubIconWrap}>
                      <Ionicons name="car" size={9} color="#FFFFFF" />
                    </View>
                  )}
                </View>

                {/* Marker Pointer Arrow */}
                <View
                  style={[
                    styles.pinPointerArrow,
                    { borderTopColor: presence.badgeColor },
                  ]}
                />
              </Pressable>
            );
          })}
        </Animated.View>

        {/* Map Top-Left Overlay: LIVE Broadcast Status */}
        <View
          style={[
            styles.mapStatusOverlay,
            {
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.88)' : 'rgba(255, 255, 255, 0.92)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}>
          <View style={styles.mapStatusTopRow}>
            <View style={styles.overlayLiveDot} />
            <Text style={[styles.overlayLiveText, { color: isDark ? '#34D399' : '#059669' }]}>
              LIVE
            </Text>
          </View>
          <Text style={[styles.overlayCountText, { color: colors.text }]}>
            {statusSummary.broadcastingCount} {statusSummary.broadcastingCount === 1 ? 'member' : 'members'} broadcasting
          </Text>
        </View>

        {/* Map Top-Right Overlay: Zoom Controls (+ and -) */}
        <View style={styles.mapZoomControls}>
          <Pressable
            onPress={handleZoomIn}
            style={({ pressed }) => [
              styles.zoomBtn,
              {
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <Ionicons name="add" size={16} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={handleZoomOut}
            style={({ pressed }) => [
              styles.zoomBtn,
              {
                backgroundColor: isDark ? 'rgba(30, 41, 59, 0.9)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <Ionicons name="remove" size={16} color={colors.text} />
          </Pressable>
        </View>

        {/* Map Bottom-Left: Recenter Control Button */}
        <Pressable
          onPress={handleRecenter}
          style={({ pressed }) => [
            styles.recenterButton,
            {
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.92)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(56, 189, 248, 0.3)' : 'rgba(37, 99, 235, 0.2)',
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <Ionicons
            name="locate-outline"
            size={14}
            color={isDark ? '#38BDF8' : colors.brandAccent}
          />
          <Text
            style={[
              styles.recenterText,
              { color: isDark ? '#38BDF8' : colors.brandAccent },
            ]}>
            ⊙ Recenter
          </Text>
        </Pressable>
      </View>

      {/* ========================================================================= */}
      {/* 5. MEMBER FILTER CHIPS BELOW MAP                                          */}
      {/* ========================================================================= */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.memberFilterRow}>
        {/* All Chip */}
        <Pressable
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            setSelectedMember(null);
            setPanOffset({ x: 0, y: 0 });
          }}
          style={[
            styles.filterChip,
            {
              backgroundColor: !selectedMember
                ? colors.brandAccent
                : isDark
                ? 'rgba(255, 255, 255, 0.08)'
                : '#F1F5F9',
              borderColor: !selectedMember
                ? colors.brandAccent
                : isDark
                ? 'rgba(255, 255, 255, 0.1)'
                : '#E2E8F0',
            },
          ]}>
          <Text
            style={[
              styles.filterChipText,
              {
                color: !selectedMember ? colors.buttonTextOnAccent : colors.text,
                fontWeight: !selectedMember ? '700' : '600',
              },
            ]}>
            All ({displayMembers.length})
          </Text>
        </Pressable>

        {/* Member Specific Chips */}
        {displayMembers.map((member) => {
          const presence = getMemberPresence(member, isDark);
          const isCurrent = selectedMember?.id === member.id;

          return (
            <Pressable
              key={member.id}
              onPress={() => openMemberSheet(member)}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isCurrent
                    ? colors.brandAccent
                    : isDark
                    ? 'rgba(255, 255, 255, 0.08)'
                    : '#F1F5F9',
                  borderColor: isCurrent
                    ? colors.brandAccent
                    : isDark
                    ? 'rgba(255, 255, 255, 0.1)'
                    : '#E2E8F0',
                },
              ]}>
              <View
                style={[
                  styles.filterChipDot,
                  { backgroundColor: presence.badgeColor },
                ]}
              />
              <Text
                style={[
                  styles.filterChipText,
                  {
                    color: isCurrent ? colors.buttonTextOnAccent : colors.text,
                    fontWeight: isCurrent ? '700' : '600',
                  },
                ]}>
                {member.name.split(' ')[0]}
              </Text>
              <Text
                style={[
                  styles.filterChipBattery,
                  {
                    color: isCurrent
                      ? colors.buttonTextOnAccent
                      : colors.textSecondary,
                  },
                ]}>
                {member.batteryLevel}%
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ========================================================================= */}
      {/* 6. MAP MEMBER BOTTOM SHEET MODAL                                          */}
      {/* ========================================================================= */}
      {selectedMember && (
        <Modal
          visible={sheetVisible}
          transparent
          animationType="none"
          onRequestClose={closeMemberSheet}>
          <View style={styles.sheetBackdrop}>
            <Pressable style={styles.sheetBackdropPress} onPress={closeMemberSheet} />
            <Animated.View
              style={[
                styles.bottomSheetContainer,
                {
                  backgroundColor: isDark ? '#1E293B' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  transform: [{ translateY: sheetTranslateY }],
                },
              ]}>
              {/* Drag handle bar */}
              <View
                style={[
                  styles.sheetDragBar,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1' },
                ]}
              />

              {/* Member Title Row */}
              <View style={styles.sheetHeader}>
                <View style={styles.sheetHeaderLeft}>
                  <FamilyAvatar member={selectedMember} size="md" showStatus={false} />
                  <View style={styles.sheetNameCol}>
                    <View style={styles.sheetNameBadgeRow}>
                      <Text
                        style={[
                          styles.sheetMemberName,
                          { color: colors.text, fontSize: isElderly ? 20 : 17 },
                        ]}>
                        {selectedMember.name}
                      </Text>
                      {selectedMember.relation && (
                        <View
                          style={[
                            styles.sheetRelationBadge,
                            {
                              backgroundColor: isDark
                                ? 'rgba(255, 255, 255, 0.08)'
                                : '#F1F5F9',
                            },
                          ]}>
                          <Text
                            style={[
                              styles.sheetRelationText,
                              { color: colors.textSecondary },
                            ]}>
                            {selectedMember.relation}
                          </Text>
                        </View>
                      )}
                    </View>

                    {/* Status Pill: Live • Home */}
                    {(() => {
                      const p = getMemberPresence(selectedMember, isDark);
                      return (
                        <View style={styles.sheetLiveStatusRow}>
                          <View
                            style={[styles.sheetDot, { backgroundColor: p.badgeColor }]}
                          />
                          <Text
                            style={[
                              styles.sheetStatusText,
                              { color: p.badgeColor },
                            ]}>
                            Live • {p.label}
                          </Text>
                        </View>
                      );
                    })()}
                  </View>
                </View>

                {/* Close sheet */}
                <Pressable
                  onPress={closeMemberSheet}
                  hitSlop={12}
                  style={styles.sheetCloseBtn}>
                  <Ionicons name="close-circle" size={24} color={colors.textMuted} />
                </Pressable>
              </View>

              {/* Telemetry info cards grid */}
              <View style={styles.sheetTelemetryGrid}>
                <View
                  style={[
                    styles.sheetTelemetryTile,
                    {
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
                    },
                  ]}>
                  <Ionicons name="location-sharp" size={15} color={colors.brandAccent} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>
                      Location
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[styles.tileValue, { color: colors.text }]}>
                      {selectedMember.humanLocation || 'Sanctuary'}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.sheetTelemetryTile,
                    {
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
                    },
                  ]}>
                  <Ionicons
                    name={selectedMember.isCharging ? 'flash' : 'battery-charging'}
                    size={15}
                    color={
                      selectedMember.batteryLevel > 50 ? '#10B981' : '#F59E0B'
                    }
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>
                      Battery
                    </Text>
                    <Text style={[styles.tileValue, { color: colors.text }]}>
                      {selectedMember.batteryLevel}% {selectedMember.isCharging ? '(Charging)' : ''}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.sheetTelemetryTile,
                    {
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
                    },
                  ]}>
                  <Ionicons name="time-outline" size={15} color={colors.textSecondary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>
                      Last Sync
                    </Text>
                    <Text style={[styles.tileValue, { color: colors.text }]}>
                      {selectedMember.lastUpdated || '2 min ago'}
                    </Text>
                  </View>
                </View>

                <View
                  style={[
                    styles.sheetTelemetryTile,
                    {
                      backgroundColor: isDark ? 'rgba(15, 23, 42, 0.7)' : '#F8FAFC',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : '#E2E8F0',
                    },
                  ]}>
                  <Ionicons
                    name={
                      selectedMember.ringerMode === 'silent'
                        ? 'volume-mute'
                        : selectedMember.ringerMode === 'vibrate'
                        ? 'radio'
                        : 'volume-high'
                    }
                    size={15}
                    color={
                      selectedMember.ringerMode === 'silent'
                        ? '#EF4444'
                        : colors.textSecondary
                    }
                  />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.tileLabel, { color: colors.textSecondary }]}>
                      Phone Mode
                    </Text>
                    <Text style={[styles.tileValue, { color: colors.text }]}>
                      {selectedMember.ringerMode === 'silent'
                        ? 'Silent'
                        : selectedMember.ringerMode === 'vibrate'
                        ? 'Vibrate'
                        : 'Sound Normal'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Sheet Action Buttons */}
              <View style={styles.sheetActionsRow}>
                {/* View Profile */}
                <Pressable
                  onPress={() => {
                    closeMemberSheet();
                    router.push('/(tabs)/family');
                  }}
                  style={({ pressed }) => [
                    styles.sheetPrimaryBtn,
                    {
                      backgroundColor: colors.brandAccent,
                      opacity: pressed ? 0.88 : 1,
                    },
                  ]}>
                  <Ionicons
                    name="person-circle-outline"
                    size={16}
                    color={colors.buttonTextOnAccent}
                  />
                  <Text
                    style={[
                      styles.sheetPrimaryBtnText,
                      { color: colors.buttonTextOnAccent },
                    ]}>
                    View Profile
                  </Text>
                </Pressable>

                {/* Directions */}
                <Pressable
                  onPress={() => handleOpenDirections(selectedMember)}
                  style={({ pressed }) => [
                    styles.sheetSecondaryBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.08)'
                        : '#F1F5F9',
                      borderColor: isDark
                        ? 'rgba(255, 255, 255, 0.12)'
                        : '#E2E8F0',
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <Ionicons
                    name="navigate-outline"
                    size={16}
                    color={isDark ? '#38BDF8' : colors.brandAccent}
                  />
                  <Text
                    style={[
                      styles.sheetSecondaryBtnText,
                      { color: colors.text },
                    ]}>
                    Directions
                  </Text>
                </Pressable>

                {/* Call */}
                <Pressable
                  onPress={() =>
                    handleCallMember(selectedMember.phone, selectedMember.name)
                  }
                  style={({ pressed }) => [
                    styles.sheetIconOnlyBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(16, 185, 129, 0.15)'
                        : '#ECFDF5',
                      borderColor: isDark
                        ? 'rgba(16, 185, 129, 0.3)'
                        : '#A7F3D0',
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <Ionicons name="call" size={17} color="#10B981" />
                </Pressable>

                {/* Ping */}
                <Pressable
                  onPress={() => handlePingMember(selectedMember)}
                  style={({ pressed }) => [
                    styles.sheetIconOnlyBtn,
                    {
                      backgroundColor: isDark
                        ? 'rgba(245, 158, 11, 0.15)'
                        : '#FFFBEB',
                      borderColor: isDark
                        ? 'rgba(245, 158, 11, 0.3)'
                        : '#FDE68A',
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <Ionicons name="paper-plane" size={17} color="#F59E0B" />
                </Pressable>
              </View>
            </Animated.View>
          </View>
        </Modal>
      )}

      {/* ========================================================================= */}
      {/* 7. ALL-IN-ONE INVITATION & QR MODAL                                       */}
      {/* ========================================================================= */}
      <FamilyInviteModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        initialTab={inviteModalTab}
        onSuccess={() => {
          setInviteModalVisible(false);
          alert('Welcome! Family circle updated.');
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  commandCenterWrap: {
    marginVertical: 10,
    gap: 14,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 2,
  },
  headerLeftBlock: {
    gap: 3,
  },
  headerTitleLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  liveBeaconRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveBeaconCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  headerTitle: {
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerSeeAllBtn: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  headerSeeAllText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Presence Cards Scroll List
  presenceScrollContainer: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 4,
  },
  presenceCard: {
    width: 224,
    borderRadius: 18,
    borderWidth: 1,
    padding: 13,
    gap: 10,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  cardUserIdentity: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  avatarWrap: {
    position: 'relative',
  },
  cardLiveIndicator: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  nameBlock: {
    gap: 2,
    flex: 1,
  },
  cardMemberName: {
    fontWeight: '700',
  },
  statusBadgePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  statusDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  statusBadgeText: {
    fontSize: 9.5,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  batteryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
  },
  batteryText: {
    fontSize: 10.5,
    fontWeight: '700',
  },
  cardFooter: {
    gap: 3,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(150, 150, 150, 0.15)',
    paddingTop: 8,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  cardLocationText: {
    fontSize: 11.5,
    fontWeight: '500',
    flex: 1,
  },
  cardUpdatedText: {
    fontSize: 10,
    fontWeight: '500',
  },

  // Compact Add Member Card
  compactAddMemberCard: {
    width: 106,
    borderRadius: 18,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    gap: 5,
  },
  compactAddIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAddTitle: {
    fontWeight: '700',
    textAlign: 'center',
  },
  compactAddSub: {
    fontSize: 10,
    fontWeight: '500',
  },

  // Onboarding Radar Banner (When 1 Member)
  onboardingCard: {
    marginHorizontal: 16,
    borderRadius: 18,
    borderWidth: 1,
    padding: 16,
    gap: 14,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.09,
    shadowRadius: 10,
    elevation: 3,
  },
  onboardingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  radarIllustrationWrap: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  radarCircleOuter: {
    position: 'absolute',
    width: 52,
    height: 52,
    borderRadius: 26,
    borderWidth: 1.5,
  },
  radarCircleMid: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1.5,
  },
  radarCenterBeacon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  onboardingTextCol: {
    flex: 1,
    gap: 3,
  },
  onboardingTitle: {
    fontSize: 12.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  onboardingSubtitle: {
    lineHeight: 17,
  },
  onboardingActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  onboardingPrimaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 11,
  },
  onboardingPrimaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  onboardingOrDivider: {
    fontSize: 11,
    fontWeight: '600',
  },
  onboardingSecondaryBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 38,
    borderRadius: 11,
    borderWidth: 1,
  },
  onboardingSecondaryBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Family Status Summary Card
  statusSummaryCard: {
    marginHorizontal: 16,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 8,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  statusSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusSummaryTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  viewCircleLink: {
    paddingVertical: 2,
    paddingHorizontal: 4,
  },
  viewCircleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statusSummaryMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flexWrap: 'wrap',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metricDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  metricLabel: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  metricBold: {
    fontWeight: '800',
  },
  metricTimestamp: {
    fontSize: 11,
    fontWeight: '500',
  },

  // Live Family Map Section Header
  mapSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  mapSectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
  },
  mapSectionTitle: {
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  mapHeaderRightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  mapModePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  mapModeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  fullScreenLink: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Live Family Map Container
  mapContainer: {
    marginHorizontal: 16,
    height: 260,
    borderRadius: 22,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  mapInnerPlane: {
    ...StyleSheet.absoluteFill,
  },
  mapRiver: {
    position: 'absolute',
    left: '20%',
    top: -20,
    width: 60,
    height: '140%',
    transform: [{ rotate: '-28deg' }],
    opacity: 0.65,
  },
  mapStreetH1: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '38%',
    height: 6,
    opacity: 0.8,
  },
  mapStreetH2: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '68%',
    height: 5,
    opacity: 0.7,
  },
  mapStreetV1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '32%',
    width: 6,
    opacity: 0.8,
  },
  mapStreetV2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '68%',
    width: 5,
    opacity: 0.7,
  },
  mapParkArea: {
    position: 'absolute',
    right: '8%',
    bottom: '12%',
    width: 90,
    height: 70,
    borderRadius: 16,
  },

  // Home Location Marker
  homeMarkerWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -30 }, { translateY: -30 }],
  },
  homeHalo: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  homeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  homeEmoji: {
    fontSize: 12,
  },
  homeLabel: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  // Dynamic Family Marker
  memberMarkerPin: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -30 }, { translateY: -46 }],
  },
  markerRadarHalo: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  pinNamePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 2.5,
    borderRadius: 9,
    borderWidth: 1,
    marginBottom: 3,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  pinLiveTinyDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  pinNameText: {
    fontSize: 10,
    fontWeight: '700',
  },
  pinBatteryText: {
    fontSize: 9,
    fontWeight: '600',
  },
  avatarMarkerCircle: {
    borderWidth: 2.5,
    borderRadius: 18,
    padding: 1,
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  movingSubIconWrap: {
    position: 'absolute',
    bottom: -3,
    right: -3,
    backgroundColor: '#F59E0B',
    borderRadius: 6,
    width: 13,
    height: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pinPointerArrow: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 4.5,
    borderRightWidth: 4.5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },

  // Map Overlays
  mapStatusOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    gap: 2,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  mapStatusTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  overlayLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  overlayLiveText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  overlayCountText: {
    fontSize: 10,
    fontWeight: '600',
  },

  mapZoomControls: {
    position: 'absolute',
    top: 12,
    right: 12,
    gap: 6,
  },
  zoomBtn: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },

  recenterButton: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  recenterText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // Member Filter Chips Row
  memberFilterRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingTop: 2,
  },
  filterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
  },
  filterChipDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterChipText: {
    fontSize: 12,
  },
  filterChipBattery: {
    fontSize: 10,
    fontWeight: '600',
  },

  // Bottom Sheet Modal
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetBackdropPress: {
    flex: 1,
  },
  bottomSheetContainer: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    gap: 16,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  sheetDragBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sheetHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  sheetNameCol: {
    gap: 3,
    flex: 1,
  },
  sheetNameBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetMemberName: {
    fontWeight: '800',
  },
  sheetRelationBadge: {
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  sheetRelationText: {
    fontSize: 10,
    fontWeight: '700',
  },
  sheetLiveStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  sheetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sheetStatusText: {
    fontSize: 11.5,
    fontWeight: '700',
  },
  sheetCloseBtn: {
    padding: 4,
  },

  // Telemetry Grid inside Sheet
  sheetTelemetryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  sheetTelemetryTile: {
    flexBasis: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  tileLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  tileValue: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Sheet Action Row
  sheetActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sheetPrimaryBtn: {
    flex: 1.4,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
  },
  sheetPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sheetSecondaryBtn: {
    flex: 1.3,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
  },
  sheetSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sheetIconOnlyBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
});
