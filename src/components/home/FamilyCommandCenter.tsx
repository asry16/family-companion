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
  Modal,
  Image,
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

export function getMemberPresence(member?: FamilyMember | null, isDark: boolean = false): PresenceInfo {
  if (!member) {
    return {
      status: 'OFFLINE',
      label: 'OFFLINE',
      badgeColor: isDark ? '#94A3B8' : '#64748B',
      badgeBg: isDark ? 'rgba(148, 163, 184, 0.16)' : 'rgba(100, 116, 139, 0.12)',
      isLive: false,
    };
  }

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
    badgeColor: isDark ? '#8B7CF6' : '#2563EB', // Violet / Royal Blue
    badgeBg: isDark ? 'rgba(139, 124, 246, 0.18)' : 'rgba(37, 99, 235, 0.12)',
    isLive: true,
  };
}

import {
  lon2tile,
  lat2tile,
  getTileUrl,
  watchLocation,
  LiveLocation,
  MapTileMode,
  getOsmAttribution,
} from '@/services/locationService';

export interface FamilyCommandCenterProps {
  isFullScreen?: boolean;
}

export const FamilyCommandCenter: React.FC<FamilyCommandCenterProps> = ({ isFullScreen = false }) => {
  const router = useRouter();
  const { colors, isDark, isElderly } = useAppTheme();
  const { members, activeUser, places, sendFamilyPing, updateFamilyMember } = useFamily();

  // Selected member for map focus & bottom sheet
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);

  // Invite Modal State
  const [inviteModalVisible, setInviteModalVisible] = useState(false);

  // Real GPS & Location State
  const [liveLoc, setLiveLoc] = useState<LiveLocation | null>(null);
  const [locationPermissionNeeded, setLocationPermissionNeeded] = useState<boolean>(false);
  const [realUserCoords, setRealUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [gpsAccuracy, setGpsAccuracy] = useState<number | null>(null);
  const [isGpsLive, setIsGpsLive] = useState<boolean>(false);

  // Container dimensions for responsive tile centering
  const [mapLayout, setMapLayout] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Interactive Map State: Pan & Zoom
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });

  // Map mode: OpenStreetMap / Satellite
  const [mapMode, setMapMode] = useState<MapTileMode>(isDark ? 'osm-dark' : 'osm-standard');

  // Animation drivers
  const pulseAnim = useRef(new Animated.Value(0)).current;
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

  // Request real device location
  // Request real device location
  const handleRequestLocation = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocationPermissionNeeded(false);
          setIsGpsLive(true);
          setGpsAccuracy(Math.round(position.coords.accuracy || 10));
          setRealUserCoords({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        () => {
          setLocationPermissionNeeded(false);
        },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocationPermissionNeeded(false);
    }
  };

  // Live Location continuous watch via unified locationService
  useEffect(() => {
    const unsub = watchLocation((loc) => {
      setLiveLoc(loc);
      setIsGpsLive(loc.source === 'gps');
      setGpsAccuracy(loc.accuracy || null);
      setRealUserCoords({
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
      setLocationPermissionNeeded(false);
      if (activeUser?.id && updateFamilyMember) {
        updateFamilyMember(activeUser.id, {
          coords: { x: 50, y: 50, latitude: loc.latitude, longitude: loc.longitude },
          humanLocation: loc.humanLocation,
          lastUpdated: 'Just now',
        });
      }
    });

    return () => unsub();
  }, [activeUser?.id, updateFamilyMember]);

  // Ensure active user is displayed if members list is empty
  const displayMembers: FamilyMember[] = useMemo(() => {
    if (members && Array.isArray(members) && members.length > 0) {
      return members;
    }
    if (activeUser) {
      return [activeUser];
    }
    return [];
  }, [members, activeUser]);

  // Home location coordinates from places
  const homePlace = useMemo<FamilyPlace>(() => {
    const found = places && Array.isArray(places)
      ? places.find((p) => p.type === 'home' || p.id === 'place_home')
      : undefined;

    return {
      id: found?.id || 'place_home',
      name: found?.name || 'Home',
      type: 'home',
      address: found?.address || 'Family Sanctuary',
      emoji: found?.emoji || '🏡',
      coords: {
        x: typeof found?.coords?.x === 'number' ? found.coords.x : 50,
        y: typeof found?.coords?.y === 'number' ? found.coords.y : 50,
      },
    };
  }, [places]);

  // Family status counts
  const statusSummary = useMemo(() => {
    let safeCount = 0;
    let homeCount = 0;
    let liveCount = 0;
    let latestActivity = '2 min ago';

    displayMembers.forEach((m) => {
      const presence = getMemberPresence(m, isDark);
      if (presence.status !== 'OFFLINE') {
        safeCount += 1;
      }
      if (presence.status === 'HOME') {
        homeCount += 1;
      }
      if (presence.isLive) {
        liveCount += 1;
      }
      if (m.lastUpdated && m.lastUpdated !== 'Just now') {
        latestActivity = m.lastUpdated;
      }
    });

    return {
      safeCount: Math.max(safeCount, 1),
      homeCount: Math.max(homeCount, 1),
      liveCount: Math.max(liveCount, 1),
      latestActivity,
      broadcastingCount: liveCount || 1,
    };
  }, [displayMembers, isDark]);

  // Real base coordinates for map tiles (User live coordinates or default)
  // Real base coordinates for map tiles (User live coordinates or default)
  const baseLat = liveLoc?.latitude ?? realUserCoords?.latitude ?? activeUser?.coords?.latitude ?? 28.5498;
  const baseLon = liveLoc?.longitude ?? realUserCoords?.longitude ?? activeUser?.coords?.longitude ?? 77.2005;
  const humanPlace = liveLoc?.humanLocation || activeUser?.humanLocation || 'Live Safe Zone';
  const tileZoom = 14;
  const centerTileX = lon2tile(baseLon, tileZoom);
  const centerTileY = lat2tile(baseLat, tileZoom);

  // Dynamic layout calculations for full coverage without black gaps
  const containerW = mapLayout.width > 0 ? mapLayout.width : 500;
  const containerH = mapLayout.height > 0 ? mapLayout.height : (isFullScreen ? 440 : 280);
  const centerX = Math.round(containerW / 2);
  const centerY = Math.round(containerH / 2);

  // Determine horizontal and vertical tile span needed to fill container plus buffer for panning
  const halfSpanX = Math.max(2, Math.ceil(containerW / 512) + 1);
  const halfSpanY = Math.max(1, Math.ceil(containerH / 512) + 1);

  // Generate tile grid without any watermarks or API key requirements (using fast ArcGIS World Dark/Light Gray Base)
  const mapTiles = useMemo(() => {
    const tiles: Array<{ x: number; y: number; url: string; key: string }> = [];
    for (let dy = -halfSpanY; dy <= halfSpanY; dy++) {
      for (let dx = -halfSpanX; dx <= halfSpanX; dx++) {
        const tx = (centerTileX + dx + 16384) % 16384;
        const ty = (centerTileY + dy + 16384) % 16384;
        const url = getTileUrl(tx, ty, tileZoom, mapMode, isDark);
        tiles.push({ x: dx, y: dy, url, key: `${tx}_${ty}_${mapMode}_${isDark ? 'dark' : 'light'}` });
      }
    }
    return tiles;
  }, [centerTileX, centerTileY, mapMode, isDark, halfSpanX, halfSpanY]);

  // Pan gesture responder for the interactive map
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderMove: (_, gestureState) => {
        setPanOffset((prev) => ({
          x: Math.min(Math.max(prev.x + gestureState.dx * 0.35, -280), 280),
          y: Math.min(Math.max(prev.y + gestureState.dy * 0.35, -280), 280),
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

  // Open directions in external maps app
  const handleOpenDirections = (member: FamilyMember) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const coords = member.coords;
    let url = '';
    if (coords?.latitude && coords?.longitude) {
      url = Platform.select({
        ios: `maps:0,0?q=${encodeURIComponent(member.name)}@${coords.latitude},${coords.longitude}`,
        android: `geo:0,0?q=${coords.latitude},${coords.longitude}(${encodeURIComponent(member.name)})`,
        default: `https://www.google.com/maps/search/?api=1&query=${coords.latitude},${coords.longitude}`,
      }) || '';
    } else {
      url = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(member.humanLocation || member.name)}`;
    }
    Linking.openURL(url).catch(() => {
      alert(`Navigating to ${member.name}'s location...`);
    });
  };

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

  const handlePingMember = (member: FamilyMember) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    sendFamilyPing(member.id, 'Live status check from Family Command Center.');
    alert(`Status check sent to ${member.name}`);
  };

  return (
    <View style={styles.commandCenterWrap}>
      {/* ========================================================================= */}
      {/* 1. LIVE CIRCLE HEADER                                                     */}
      {/* ========================================================================= */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.headerLeftCol}>
          <Text style={[styles.headerMainTitle, { color: colors.text, fontSize: isElderly ? 18 : 15 }]}>
            LIVE CIRCLE
          </Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Everyone’s presence, at a glance
          </Text>
        </View>

        <Pressable
          onPress={() => router.push('/(tabs)/family')}
          hitSlop={10}
          style={styles.seeAllBtn}>
          <Text style={[styles.seeAllText, { color: colors.brandAccent }]}>
            See all →
          </Text>
        </Pressable>
      </View>

      {/* ========================================================================= */}
      {/* 1. HORIZONTAL MEMBER PRESENCE CARDS ROW                                   */}
      {/* ========================================================================= */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.presenceScrollRow}>
        {displayMembers.map((member) => {
          const presence = getMemberPresence(member, isDark);
          const isSelected = selectedMember?.id === member.id;
          const memberName = (member?.name || 'Member').split(' ')[0];

          return (
            <Pressable
              key={member.id}
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                setSelectedMember(member);
                const memberX = member.coords?.x ?? 50;
                const memberY = member.coords?.y ?? 50;
                setPanOffset({
                  x: (50 - memberX) * 1.8,
                  y: (50 - memberY) * 1.8,
                });
              }}
              style={({ pressed }) => [
                styles.memberPresenceCard,
                {
                  backgroundColor: isSelected
                    ? colors.brandAccent
                    : isDark
                    ? 'rgba(20, 27, 74, 0.72)'
                    : '#FFFFFF',
                  borderColor: isSelected
                    ? colors.brandAccent
                    : presence.isLive
                    ? isDark
                      ? 'rgba(52, 211, 153, 0.45)'
                      : 'rgba(16, 185, 129, 0.35)'
                    : isDark
                    ? 'rgba(130, 140, 255, 0.22)'
                    : 'rgba(0, 0, 0, 0.06)',
                  shadowColor: isSelected
                    ? colors.brandAccent
                    : presence.isLive
                    ? isDark
                      ? '#34D399'
                      : '#10B981'
                    : isDark
                    ? 'rgba(0, 0, 10, 0.35)'
                    : '#64748B',
                  shadowOpacity: isSelected ? 0.35 : presence.isLive ? (isDark ? 0.3 : 0.15) : 0.06,
                  shadowRadius: isSelected ? 12 : presence.isLive ? 10 : 6,
                  opacity: pressed ? 0.92 : 1,
                  transform: [{ scale: pressed ? 0.98 : 1 }],
                },
              ]}>
              {/* Left: Avatar */}
              <View style={styles.cardAvatarCol}>
                <FamilyAvatar member={member} size="md" showStatus={false} />
              </View>

              {/* Center: Name, HOME, Active time */}
              <View style={styles.cardCenterCol}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.cardNameText,
                    {
                      color: isSelected ? '#FFFFFF' : colors.text,
                      fontWeight: isSelected ? '800' : '700',
                    },
                  ]}>
                  {memberName}
                </Text>
                <Text
                  style={[
                    styles.cardStatusText,
                    {
                      color: isSelected
                        ? isDark
                          ? '#000000'
                          : '#FFFFFF'
                        : presence.badgeColor,
                      fontWeight: '800',
                    },
                  ]}>
                  {presence.label}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.cardActiveText,
                    {
                      color: isSelected
                        ? isDark
                          ? '#000000'
                          : 'rgba(255, 255, 255, 0.9)'
                        : colors.textSecondary,
                      fontWeight: isSelected ? '700' : '500',
                    },
                  ]}>
                  Active {member.lastUpdated || '2 min ago'}
                </Text>
              </View>

              {/* Right: Top Live Indicator + Bottom Battery */}
              <View style={styles.cardRightCol}>
                {presence.isLive ? (
                  <View
                    style={[
                      styles.liveDotRing,
                      {
                        borderColor: isSelected
                          ? isDark
                            ? 'rgba(0, 0, 0, 0.35)'
                            : 'rgba(255, 255, 255, 0.5)'
                          : isDark
                          ? 'rgba(52, 211, 153, 0.3)'
                          : 'rgba(16, 185, 129, 0.25)',
                      },
                    ]}>
                    <Animated.View
                      style={[
                        styles.liveDotCore,
                        {
                          backgroundColor: isSelected
                            ? isDark
                              ? '#000000'
                              : '#FFFFFF'
                            : isDark
                            ? '#34D399'
                            : '#10B981',
                          transform: [
                            {
                              scale: pulseAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [0.8, 1.25],
                              }),
                            },
                          ],
                        },
                      ]}
                    />
                  </View>
                ) : (
                  <View
                    style={[
                      styles.liveDotCore,
                      {
                        backgroundColor: isSelected
                          ? isDark
                            ? '#000000'
                            : '#FFFFFF'
                          : '#94A3B8',
                      },
                    ]}
                  />
                )}

                <View style={styles.batteryRow}>
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
                      isSelected
                        ? isDark
                          ? '#000000'
                          : '#FFFFFF'
                        : member.batteryLevel > 50 || member.isCharging
                        ? '#10B981'
                        : '#F59E0B'
                    }
                  />
                  <Text
                    style={[
                      styles.batteryNumber,
                      {
                        color: isSelected
                          ? isDark
                            ? '#000000'
                            : '#FFFFFF'
                          : member.batteryLevel > 50 || member.isCharging
                          ? isDark
                            ? '#34D399'
                            : '#059669'
                          : isDark
                          ? '#FBBF24'
                          : '#D97706',
                        fontWeight: isSelected ? '800' : '700',
                      },
                    ]}>
                    {member.batteryLevel}%
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })}

        {/* Compact "+ Add Member" card at the end */}
        <Pressable
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            setInviteModalVisible(true);
          }}
          style={({ pressed }) => [
            styles.compactAddCard,
            {
              backgroundColor: isDark ? 'rgba(20, 27, 74, 0.72)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(0, 0, 0, 0.08)',
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <View
            style={[
              styles.compactAddCircle,
              { backgroundColor: isDark ? 'rgba(139, 124, 246, 0.15)' : '#EFF6FF' },
            ]}>
            <Ionicons name="add" size={20} color={isDark ? '#8B7CF6' : colors.brandAccent} />
          </View>
          <Text style={[styles.compactAddText, { color: colors.text }]}>
            Add Member
          </Text>
          <Text style={[styles.compactAddSubText, { color: colors.textSecondary }]}>
            Invite family
          </Text>
        </Pressable>
      </ScrollView>

      {/* ========================================================================= */}
      {/* 2. FAMILY STATUS COMPACT SUMMARY CARD                                     */}
      {/* ========================================================================= */}
      <View
        style={[
          styles.familyStatusCard,
          {
            backgroundColor: isDark ? 'rgba(20, 27, 74, 0.72)' : '#FFFFFF',
            borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(0, 0, 0, 0.06)',
            shadowColor: isDark ? '#000000' : '#64748B',
          },
        ]}>
        <Text style={[styles.familyStatusTitle, { color: colors.textMuted }]}>
          FAMILY STATUS
        </Text>

        <View style={styles.statusMetricsRow}>
          {/* Safe */}
          <View style={styles.statusPillItem}>
            <View style={[styles.statusIconDot, { backgroundColor: '#10B981' }]} />
            <Text style={[styles.statusItemText, { color: colors.text }]}>
              {statusSummary.safeCount} Safe
            </Text>
          </View>

          {/* Home */}
          <View style={styles.statusPillItem}>
            <Text style={{ fontSize: 13 }}>🏠</Text>
            <Text style={[styles.statusItemText, { color: colors.text }]}>
              {statusSummary.homeCount} Home
            </Text>
          </View>

          {/* Live */}
          <View style={styles.statusPillItem}>
            <Text style={{ fontSize: 13 }}>⚡</Text>
            <Text style={[styles.statusItemText, { color: isDark ? '#8B7CF6' : '#2563EB', fontWeight: '700' }]}>
              Live
            </Text>
          </View>
        </View>

        <Text style={[styles.statusActivityText, { color: colors.textSecondary }]}>
          Last activity · {statusSummary.latestActivity}
        </Text>
      </View>

      {/* ========================================================================= */}
      {/* 3. LIVE FAMILY MAP HERO SECTION                                           */}
      {/* ========================================================================= */}
      <View style={styles.mapSectionHeaderRow}>
        <Text style={[styles.mapHeaderTitle, { color: colors.text, fontSize: isElderly ? 18 : 15 }]}>
          LIVE FAMILY MAP
        </Text>

        {!isFullScreen && (
          <Pressable
            onPress={() => router.push('/(tabs)/family')}
            hitSlop={10}>
            <Text style={[styles.fullScreenLinkText, { color: isDark ? '#8B7CF6' : colors.brandAccent }]}>
              Full screen →
            </Text>
          </Pressable>
        )}
      </View>

      {/* Interactive Map Card */}
      <View
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width > 0 && height > 0) {
            setMapLayout((prev) =>
              prev.width === width && prev.height === height ? prev : { width, height }
            );
          }
        }}
        style={[
          styles.mapHeroCard,
          isFullScreen && { height: 480 },
          {
            backgroundColor: isDark ? '#141A4A' : '#EFF6FF',
            borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(37, 99, 235, 0.15)',
            shadowColor: isDark ? 'rgba(0, 0, 10, 0.35)' : '#1E293B',
          },
        ]}
        {...panResponder.panHandlers}>
        {/* Real Map Tiles or Permission Block */}
        {locationPermissionNeeded ? (
          <View style={styles.permissionNeededWrap}>
            <View style={[styles.permissionIconCircle, { backgroundColor: isDark ? 'rgba(139, 124, 246, 0.15)' : '#EFF6FF' }]}>
              <Ionicons name="location-outline" size={28} color={colors.brandAccent} />
            </View>
            <Text style={[styles.permissionTitle, { color: colors.text }]}>
              Location access needed
            </Text>
            <Text style={[styles.permissionSub, { color: colors.textSecondary }]}>
              Allow location to see your live position
            </Text>
            <Pressable
              onPress={handleRequestLocation}
              style={({ pressed }) => [
                styles.enableLocationBtn,
                {
                  backgroundColor: colors.brandAccent,
                  opacity: pressed ? 0.88 : 1,
                },
              ]}>
              <Ionicons name="navigate" size={14} color="#FFFFFF" />
              <Text style={[styles.enableLocationBtnText, { color: '#FFFFFF' }]}>
                Enable Location
              </Text>
            </Pressable>
          </View>
        ) : (
          <Animated.View
            style={[
              styles.mapCanvasPlane,
              {
                transform: [
                  { translateX: panOffset.x },
                  { translateY: panOffset.y },
                  { scale: zoomLevel },
                ],
              },
            ]}>
            {/* Real Map Raster Tiles (Full Coverage Grid without Watermarks) */}
            <View style={styles.tileGridContainer}>
              {mapTiles.map((tile) => (
                <Image
                  key={tile.key}
                  source={{ uri: tile.url }}
                  style={[
                    styles.mapRasterTile,
                    {
                      left: centerX + tile.x * 256 - 128,
                      top: centerY + tile.y * 256 - 128,
                    },
                  ]}
                  resizeMode="cover"
                />
              ))}
            </View>

            {/* Home Location Marker */}
            {homePlace && (
              <View
                style={[
                  styles.homeMarkerWrap,
                  {
                    left: centerX - 38,
                    top: centerY - 28,
                  },
                ]}>
                <View
                  style={[
                    styles.homeHalo,
                    {
                      backgroundColor: isDark
                        ? 'rgba(56, 189, 248, 0.18)'
                        : 'rgba(37, 99, 235, 0.12)',
                    },
                  ]}
                />
                <View
                  style={[
                    styles.homeBadge,
                    {
                      backgroundColor: isDark ? '#141A4A' : '#FFFFFF',
                      borderColor: isDark ? '#8B7CF6' : '#2563EB',
                    },
                  ]}>
                  <Text style={{ fontSize: 11 }}>🏠</Text>
                  <Text style={[styles.homeBadgeText, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
                    Home
                  </Text>
                </View>
              </View>
            )}

            {/* Live Family Member Markers */}
            {displayMembers.map((member, idx) => {
              const presence = getMemberPresence(member, isDark);
              const isFocused = selectedMember?.id === member.id;
              const isSelf = member.isSelf || member.id === activeUser?.id;
              let posX = centerX;
              let posY = centerY;
              if (isSelf) {
                posX = centerX;
                posY = centerY;
              } else if (
                member.coords?.latitude &&
                member.coords?.longitude &&
                (member.coords.latitude !== baseLat || member.coords.longitude !== baseLon)
              ) {
                const memTileX = lon2tile(member.coords.longitude, tileZoom);
                const memTileY = lat2tile(member.coords.latitude, tileZoom);
                const deltaX = (memTileX - centerTileX) * 256;
                const deltaY = (memTileY - centerTileY) * 256;
                posX = centerX + Math.max(-200, Math.min(200, deltaX));
                posY = centerY + Math.max(-120, Math.min(120, deltaY));
              } else {
                posX = centerX + (idx % 2 === 0 ? 55 : -55) * idx;
                posY = centerY + (idx % 2 === 0 ? -38 : 42) * idx;
              }
              const memberName = (member?.name || 'Member').split(' ')[0];

              return (
                <Pressable
                  key={member.id}
                  onPress={() => openMemberSheet(member)}
                  style={[
                    styles.markerPinWrap,
                    {
                      left: posX,
                      top: posY,
                      zIndex: isFocused ? 50 : 20,
                    },
                  ]}>
                  {/* Pulsing mint ring for members broadcasting live */}
                  {presence.isLive && (
                    <Animated.View
                      style={[
                        styles.markerPulseHalo,
                        {
                          borderColor: isDark ? '#34D399' : '#10B981',
                          shadowColor: isDark ? '#34D399' : '#10B981',
                          transform: [
                            {
                              scale: pulseAnim.interpolate({
                                inputRange: [0, 1],
                                outputRange: [1, 1.5],
                              }),
                            },
                          ],
                          opacity: pulseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0.85, 0.1],
                          }),
                        },
                      ]}
                    />
                  )}

                  {/* Circular Avatar Marker */}
                  <View
                    style={[
                      styles.avatarMarkerBorder,
                      {
                        borderColor: isDark ? '#34D399' : '#10B981',
                        backgroundColor: isDark ? '#141A4A' : '#FFFFFF',
                      },
                    ]}>
                    <FamilyAvatar member={member} size="sm" showStatus={false} />
                  </View>

                  {/* Name Label */}
                  <View
                    style={[
                      styles.markerNameBadge,
                      {
                        backgroundColor: isFocused
                          ? isDark
                            ? '#8B7CF6'
                            : colors.brandAccent
                          : isDark
                          ? 'rgba(20, 27, 74, 0.92)'
                          : '#FFFFFF',
                        borderColor: isFocused
                          ? isDark
                            ? '#8B7CF6'
                            : colors.brandAccent
                          : isDark
                          ? 'rgba(130, 140, 255, 0.25)'
                          : 'rgba(0, 0, 0, 0.1)',
                      },
                    ]}>
                    <View
                      style={[
                        styles.markerLiveDot,
                        {
                          backgroundColor: isFocused
                            ? isDark
                              ? '#000000'
                              : '#FFFFFF'
                            : isDark
                            ? '#34D399'
                            : '#10B981',
                        },
                      ]}
                    />
                    <Text
                      style={[
                        styles.markerNameText,
                        {
                          color: isFocused ? '#FFFFFF' : colors.text,
                          fontWeight: isFocused ? '800' : '700',
                        },
                      ]}>
                      {memberName}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </Animated.View>
        )}

        {/* Top-Left Overlay: 🟢 LIVE & member count */}
        <View
          style={[
            styles.overlayLiveCard,
            {
              backgroundColor: isDark ? 'rgba(20, 27, 74, 0.92)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark ? 'rgba(140, 150, 255, 0.25)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}>
          <View style={styles.overlayLiveRow}>
            <View style={[styles.liveMiniDot, { backgroundColor: isDark ? '#34D399' : '#10B981' }]} />
            <Text style={[styles.overlayLiveText, { color: isDark ? '#34D399' : '#059669' }]}>
              LIVE
            </Text>
            {isGpsLive ? (
              <Text style={{ fontSize: 9, color: isDark ? '#8B7CF6' : '#2563EB', fontWeight: '700', marginLeft: 4 }}>
                • GPS Live
              </Text>
            ) : (
              <Text style={{ fontSize: 9, color: isDark ? '#8B7CF6' : '#2563EB', fontWeight: '700', marginLeft: 4 }}>
                • Network Live
              </Text>
            )}
          </View>
          <Text style={[styles.overlaySubText, { color: colors.text, maxWidth: 170 }]} numberOfLines={1}>
            {humanPlace}
          </Text>
        </View>

        {/* Top-Right Controls Row: Mode Toggle & Full Screen */}
        <View style={styles.overlayControlsRow}>
          {/* Map Style Toggle: OSM Canvas vs Standard vs Satellite */}
          <Pressable
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setMapMode((m) => {
                if (m === 'osm-dark') return 'osm-standard';
                if (m === 'osm-standard') return 'satellite';
                return isDark ? 'osm-dark' : 'osm-standard';
              });
            }}
            style={({ pressed }) => [
              styles.overlayMapModeBtn,
              {
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(0, 0, 0, 0.08)',
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <Ionicons
              name={mapMode === 'satellite' ? 'earth-outline' : 'layers-outline'}
              size={13}
              color={colors.text}
            />
            <Text style={[styles.overlayMapModeText, { color: colors.text }]}>
              {mapMode === 'satellite' ? 'Satellite' : mapMode === 'osm-standard' ? 'OSM Standard' : 'Dark Canvas'}
            </Text>
          </Pressable>

          {/* Full screen button if not in full screen mode */}
          {!isFullScreen && (
            <Pressable
              onPress={() => router.push('/(tabs)/family')}
              style={({ pressed }) => [
                styles.overlayFullScreenBtn,
                {
                  backgroundColor: isDark ? 'rgba(20, 27, 74, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(0, 0, 0, 0.08)',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <Ionicons name="expand" size={13} color={colors.text} />
              <Text style={[styles.overlayFullScreenText, { color: colors.text }]}>
                Full screen
              </Text>
            </Pressable>
          )}
        </View>

        {/* Zoom Controls (Right cluster) */}
        <View style={styles.mapZoomCluster}>
          <Pressable
            onPress={handleZoomIn}
            style={({ pressed }) => [
              styles.mapZoomBtn,
              {
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(0, 0, 0, 0.08)',
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <Ionicons name="add" size={16} color={colors.text} />
          </Pressable>
          <Pressable
            onPress={handleZoomOut}
            style={({ pressed }) => [
              styles.mapZoomBtn,
              {
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.92)' : 'rgba(255, 255, 255, 0.95)',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(0, 0, 0, 0.08)',
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <Ionicons name="remove" size={16} color={colors.text} />
          </Pressable>
        </View>

        {/* Bottom-Left: Legal OpenStreetMap Attribution */}
        <View
          pointerEvents="none"
          style={[
            styles.osmAttributionBadge,
            {
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.70)' : 'rgba(255, 255, 255, 0.75)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}>
          <Text
            style={[
              styles.osmAttributionText,
              { color: isDark ? 'rgba(203, 213, 225, 0.8)' : 'rgba(71, 85, 105, 0.8)' },
            ]}>
            {getOsmAttribution(mapMode)}
          </Text>
        </View>

        {/* Bottom-Right Overlay: ⊙ Recenter */}
        <Pressable
          onPress={handleRecenter}
          style={({ pressed }) => [
            styles.overlayRecenterBtn,
            {
              backgroundColor: isDark ? 'rgba(20, 27, 74, 0.85)' : 'rgba(255, 255, 255, 0.95)',
              borderColor: isDark ? 'rgba(139, 124, 246, 0.50)' : 'rgba(37, 99, 235, 0.2)',
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <Ionicons
            name="locate-outline"
            size={14}
            color={isDark ? '#8B7CF6' : colors.brandAccent}
          />
          <Text
            style={[
              styles.overlayRecenterText,
              { color: isDark ? '#8B7CF6' : colors.brandAccent },
            ]}>
            ⊙ Recenter
          </Text>
        </Pressable>
      </View>

      {/* ========================================================================= */}
      {/* 4. MEMBER FILTER CHIPS BELOW MAP: [ All (1) ] [ 🟢 Member ]               */}
      {/* ========================================================================= */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.memberChipsRow}>
        {/* All Chip */}
        <Pressable
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            setSelectedMember(null);
            setPanOffset({ x: 0, y: 0 });
          }}
          style={[
            styles.chipPill,
            {
              backgroundColor: !selectedMember
                ? colors.brandAccent
                : isDark
                ? 'rgba(255, 255, 255, 0.03)'
                : '#F1F5F9',
              borderColor: !selectedMember
                ? colors.brandAccent
                : isDark
                ? 'rgba(130, 140, 255, 0.22)'
                : '#E2E8F0',
            },
          ]}>
          <Text
            style={[
              styles.chipText,
              {
                color: !selectedMember
                  ? '#FFFFFF'
                  : colors.text,
                fontWeight: !selectedMember ? '800' : '600',
              },
            ]}>
            All ({displayMembers.length})
          </Text>
        </Pressable>

        {/* Individual Member Chips */}
        {displayMembers.map((member) => {
          const presence = getMemberPresence(member, isDark);
          const isCurrent = selectedMember?.id === member.id;
          const memberName = (member?.name || 'Member').split(' ')[0];

          return (
            <Pressable
              key={member.id}
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                if (selectedMember?.id === member.id) {
                  openMemberSheet(member);
                } else {
                  setSelectedMember(member);
                  const memberX = member.coords?.x ?? 50;
                  const memberY = member.coords?.y ?? 50;
                  setPanOffset({
                    x: (50 - memberX) * 1.8,
                    y: (50 - memberY) * 1.8,
                  });
                }
              }}
              style={[
                styles.chipPill,
                {
                  backgroundColor: isCurrent
                    ? colors.brandAccent
                    : isDark
                    ? 'rgba(255, 255, 255, 0.03)'
                    : '#F1F5F9',
                  borderColor: isCurrent
                    ? colors.brandAccent
                    : isDark
                    ? 'rgba(130, 140, 255, 0.22)'
                    : '#E2E8F0',
                },
              ]}>
              <View
                style={[
                  styles.chipLiveDot,
                  {
                    backgroundColor: isCurrent
                      ? '#FFFFFF'
                      : isDark
                      ? '#34D399'
                      : '#10B981',
                  },
                ]}
              />
              <Text
                style={[
                  styles.chipText,
                  {
                    color: isCurrent
                      ? isDark
                        ? '#000000'
                        : '#FFFFFF'
                      : colors.text,
                    fontWeight: isCurrent ? '800' : '600',
                  },
                ]}>
                {memberName}
              </Text>
            </Pressable>
          );
        })}
      </ScrollView>

      {/* ========================================================================= */}
      {/* 5. MAP MEMBER BOTTOM SHEET MODAL                                          */}
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
                styles.sheetContainer,
                {
                  backgroundColor: isDark ? 'rgba(20, 27, 74, 0.96)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.25)' : 'rgba(0, 0, 0, 0.08)',
                  transform: [{ translateY: sheetTranslateY }],
                },
              ]}>
              {/* Drag handle bar */}
              <View
                style={[
                  styles.dragBar,
                  { backgroundColor: isDark ? 'rgba(255, 255, 255, 0.2)' : '#CBD5E1' },
                ]}
              />

              {/* Member Title: Name \n 🟢 Live · Home */}
              <View style={styles.sheetTopRow}>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.sheetName,
                      { color: colors.text, fontSize: isElderly ? 22 : 19 },
                    ]}>
                    {selectedMember.name}
                  </Text>

                  <View style={styles.sheetLiveRow}>
                    <View style={[styles.sheetDot, { backgroundColor: isDark ? '#34D399' : '#10B981' }]} />
                    <Text
                      style={[
                        styles.sheetLiveStatusText,
                        { color: isDark ? '#34D399' : '#059669' },
                      ]}>
                      Live · {selectedMember.humanLocation || 'Sanctuary'}
                    </Text>
                  </View>
                </View>

                <Pressable
                  onPress={closeMemberSheet}
                  hitSlop={12}
                  style={styles.sheetCloseBtn}>
                  <Ionicons name="close-circle" size={24} color={colors.textMuted} />
                </Pressable>
              </View>

              {/* Details: Location + Updated + Battery */}
              <View style={styles.sheetDetailsBlock}>
                <View style={styles.sheetDetailLine}>
                  <Ionicons name="location-sharp" size={15} color={colors.textSecondary} />
                  <Text style={[styles.sheetDetailText, { color: colors.textSecondary }]}>
                    📍 {selectedMember.humanLocation || humanPlace} • {selectedMember.lastUpdated || 'Just now'}
                  </Text>
                </View>

                <View style={styles.sheetDetailLine}>
                  <Ionicons
                    name={selectedMember.isCharging ? 'flash' : 'battery-charging'}
                    size={15}
                    color="#10B981"
                  />
                  <Text style={[styles.sheetDetailText, { color: colors.textSecondary }]}>
                    Battery {selectedMember.batteryLevel}%
                  </Text>
                </View>
              </View>

              {/* Action Buttons: [ View Profile ] [ Directions ] */}
              <View style={styles.sheetActionsRow}>
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
                  <Text
                    style={[
                      styles.sheetPrimaryBtnText,
                      { color: '#FFFFFF' },
                    ]}>
                    View Profile
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => handleOpenDirections(selectedMember)}
                  style={({ pressed }) => [
                    styles.sheetSecondaryBtn,
                    {
                      backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : '#F1F5F9',
                      borderColor: isDark ? 'rgba(255, 255, 255, 0.12)' : '#E2E8F0',
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <Text
                    style={[
                      styles.sheetSecondaryBtnText,
                      { color: colors.text },
                    ]}>
                    Directions
                  </Text>
                </Pressable>

                {/* Call icon button */}
                <Pressable
                  onPress={() => handleCallMember(selectedMember.phone, selectedMember.name)}
                  style={({ pressed }) => [
                    styles.sheetIconBtn,
                    {
                      backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : '#ECFDF5',
                      borderColor: isDark ? 'rgba(16, 185, 129, 0.3)' : '#A7F3D0',
                      opacity: pressed ? 0.85 : 1,
                    },
                  ]}>
                  <Ionicons name="call" size={17} color="#10B981" />
                </Pressable>

                {/* Ping icon button */}
                <Pressable
                  onPress={() => handlePingMember(selectedMember)}
                  style={({ pressed }) => [
                    styles.sheetIconBtn,
                    {
                      backgroundColor: isDark ? 'rgba(245, 158, 11, 0.15)' : '#FFFBEB',
                      borderColor: isDark ? 'rgba(245, 158, 11, 0.3)' : '#FDE68A',
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

      {/* Unified Family Invite Modal */}
      <FamilyInviteModal
        visible={inviteModalVisible}
        onClose={() => setInviteModalVisible(false)}
        initialTab="invite"
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
    marginVertical: 8,
    gap: 12,
  },

  // 1. LIVE CIRCLE Header
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginBottom: 2,
  },
  headerLeftCol: {
    gap: 2,
  },
  headerMainTitle: {
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  seeAllBtn: {
    paddingVertical: 3,
    paddingHorizontal: 6,
  },
  seeAllText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Presence Cards Row
  presenceScrollRow: {
    paddingHorizontal: 16,
    gap: 12,
    paddingBottom: 2,
  },
  memberPresenceCard: {
    width: 228,
    borderRadius: 22,
    borderWidth: 1.5,
    padding: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  cardAvatarCol: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardCenterCol: {
    flex: 1,
    gap: 2,
  },
  cardNameText: {
    fontSize: 14.5,
    fontWeight: '700',
  },
  cardStatusText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  cardActiveText: {
    fontSize: 10,
    fontWeight: '500',
  },
  cardRightCol: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    height: '100%',
    paddingVertical: 2,
  },
  liveDotRing: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  liveDotCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  batteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  batteryNumber: {
    fontSize: 10.5,
    fontWeight: '700',
  },

  // Compact Add Member Card
  compactAddCard: {
    width: 104,
    borderRadius: 22,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    gap: 4,
  },
  compactAddCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  compactAddText: {
    fontSize: 11.5,
    fontWeight: '700',
    textAlign: 'center',
  },
  compactAddSubText: {
    fontSize: 9.5,
    fontWeight: '500',
  },

  // 2. Family Status Card
  familyStatusCard: {
    marginHorizontal: 16,
    borderRadius: 22,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 6,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  familyStatusTitle: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  statusMetricsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginVertical: 2,
  },
  statusPillItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIconDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  statusItemText: {
    fontSize: 13,
    fontWeight: '600',
  },
  statusActivityText: {
    fontSize: 11,
    fontWeight: '500',
  },

  // 3. Live Family Map Header
  mapSectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    marginTop: 4,
  },
  mapHeaderTitle: {
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  fullScreenLinkText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Interactive Map Card
  mapHeroCard: {
    marginHorizontal: 16,
    height: 280,
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 4,
  },
  mapCanvasPlane: {
    ...StyleSheet.absoluteFill,
  },
  tileGridContainer: {
    ...StyleSheet.absoluteFill,
  },
  mapRasterTile: {
    position: 'absolute',
    width: 256,
    height: 256,
  },

  // Home marker
  homeMarkerWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -24 }, { translateY: -24 }],
  },
  homeHalo: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  homeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 2,
  },
  homeBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },

  // Member pin on map
  markerPinWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateX: -20 }, { translateY: -30 }],
  },
  markerPulseHalo: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  avatarMarkerBorder: {
    borderWidth: 2.5,
    borderRadius: 18,
    padding: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 5,
    elevation: 3,
  },
  markerNameBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    marginTop: 2,
  },
  markerLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  markerNameText: {
    fontSize: 9.5,
    fontWeight: '700',
  },

  // Location Permission Needed View
  permissionNeededWrap: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    gap: 8,
  },
  permissionIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  permissionTitle: {
    fontSize: 14.5,
    fontWeight: '800',
  },
  permissionSub: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  enableLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 12,
    marginTop: 6,
  },
  enableLocationBtnText: {
    fontSize: 12.5,
    fontWeight: '700',
  },

  // Overlays
  overlayLiveCard: {
    position: 'absolute',
    top: 10,
    left: 10,
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
  overlayLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  liveMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  overlayLiveText: {
    fontSize: 10.5,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  overlaySubText: {
    fontSize: 9.5,
    fontWeight: '600',
  },
  overlayControlsRow: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    zIndex: 10,
  },
  overlayMapModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  overlayMapModeText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  overlayFullScreenBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  overlayFullScreenText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  mapZoomCluster: {
    position: 'absolute',
    right: 10,
    top: 52,
    gap: 6,
    zIndex: 10,
  },
  mapZoomBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  overlayRecenterBtn: {
    position: 'absolute',
    bottom: 10,
    right: 10,
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
  overlayRecenterText: {
    fontSize: 11,
    fontWeight: '700',
  },

  // 4. Member Chips Below Map
  memberChipsRow: {
    paddingHorizontal: 16,
    gap: 8,
    paddingTop: 2,
  },
  chipPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    borderWidth: 1,
  },
  chipLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  chipText: {
    fontSize: 12,
  },

  // 5. Member Tap Bottom Sheet
  sheetBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetBackdropPress: {
    flex: 1,
  },
  sheetContainer: {
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    gap: 14,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
  },
  dragBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 4,
  },
  sheetTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  sheetName: {
    fontWeight: '800',
  },
  sheetLiveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 3,
  },
  sheetDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  sheetLiveStatusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  sheetCloseBtn: {
    padding: 2,
  },
  sheetDetailsBlock: {
    gap: 6,
    paddingVertical: 4,
  },
  sheetDetailLine: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sheetDetailText: {
    fontSize: 12.5,
    fontWeight: '500',
  },
  sheetActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  sheetPrimaryBtn: {
    flex: 1.4,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetPrimaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sheetSecondaryBtn: {
    flex: 1.3,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetSecondaryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sheetIconBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  osmAttributionBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 20,
  },
  osmAttributionText: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});
