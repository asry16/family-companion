import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Image,
  ScrollView,
  Animated,
  PanResponder,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { FamilyMember } from '@/types';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';
import { GlassCard } from '@/components/ui/GlassCard';

import { lon2tile, lat2tile, getTileUrl, watchLocation, LiveLocation } from '@/services/locationService';

interface CircleLiveMapCardProps {
  onFullScreen?: () => void;
}

export const CircleLiveMapCard: React.FC<CircleLiveMapCardProps> = ({ onFullScreen }) => {
  const { colors, isDark, isElderly } = useAppTheme();
  const { members, activeUser, places, updateFamilyMember } = useFamily();

  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [mapMode, setMapMode] = useState<'streets' | 'satellite'>('streets');

  // Real GPS & Layout State
  const [liveLoc, setLiveLoc] = useState<LiveLocation | null>(null);
  const [realUserCoords, setRealUserCoords] = useState<{ latitude: number; longitude: number } | null>(null);
  const [isGpsLive, setIsGpsLive] = useState<boolean>(false);
  const [mapLayout, setMapLayout] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Radar / Beacon continuous animation
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

  // Live Location Watch (GPS + Instant IP Fallback + ArcGIS Reverse Geocoding)
  useEffect(() => {
    const unsub = watchLocation((loc) => {
      setLiveLoc(loc);
      setIsGpsLive(loc.source === 'gps');
      setRealUserCoords({
        latitude: loc.latitude,
        longitude: loc.longitude,
      });
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

  // Pan gesture responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderMove: (_, gestureState) => {
        setPanOffset((prev) => ({
          x: Math.min(Math.max(prev.x + gestureState.dx * 0.35, -240), 240),
          y: Math.min(Math.max(prev.y + gestureState.dy * 0.35, -240), 240),
        }));
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  // Zoom controls
  const handleZoomIn = () => {
    triggerHaptic();
    setZoomLevel((z) => Math.min(Number((z + 0.2).toFixed(2)), 2.0));
  };

  const handleZoomOut = () => {
    triggerHaptic();
    setZoomLevel((z) => Math.max(Number((z - 0.2).toFixed(2)), 0.8));
  };

  const handleRecenter = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedMemberId(null);
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const broadcastingCount = members.length > 0 ? members.length : 1;

  // Coordinates and dimensions
  const baseLat = liveLoc?.latitude ?? realUserCoords?.latitude ?? activeUser?.coords?.latitude ?? 28.5498;
  const baseLon = liveLoc?.longitude ?? realUserCoords?.longitude ?? activeUser?.coords?.longitude ?? 77.2005;
  const humanPlace = liveLoc?.humanLocation || activeUser?.humanLocation || 'Live Safe Zone';
  const tileZoom = 14;
  const centerTileX = lon2tile(baseLon, tileZoom);
  const centerTileY = lat2tile(baseLat, tileZoom);

  const containerW = mapLayout.width > 0 ? mapLayout.width : 400;
  const containerH = mapLayout.height > 0 ? mapLayout.height : 240;
  const centerX = Math.round(containerW / 2);
  const centerY = Math.round(containerH / 2);

  const halfSpanX = Math.max(2, Math.ceil(containerW / 512) + 1);
  const halfSpanY = Math.max(1, Math.ceil(containerH / 512) + 1);

  // Free, ultra-crisp ArcGIS tiles without watermarks or API keys
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

  // Selected member for highlight
  const displayMembers = members.length > 0 ? members : (activeUser ? [activeUser] : []);
  const selectedMember = displayMembers.find((m) => m.id === selectedMemberId);
  const homePlace = places.find((p) => p.type === 'home' || p.name.toLowerCase().includes('home'));

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
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width > 0 && height > 0) {
            setMapLayout((prev) =>
              prev.width === width && prev.height === height ? prev : { width, height }
            );
          }
        }}
        style={[
          styles.mapContainer,
          {
            backgroundColor: isDark ? '#141A4A' : '#EFF6FF',
            borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(20, 32, 58, 0.1)',
          },
        ]}
        {...panResponder.panHandlers}>
        {/* Animated Map Surface Canvas */}
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
          {/* Real Free High-Performance ArcGIS Tiles */}
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

          {/* HOME MARKER: Blue circle with house icon */}
          <View
            style={[
              styles.homeMarkerWrap,
              {
                left: centerX - 60,
                top: centerY - 40,
              },
            ]}>
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
                  backgroundColor: isDark ? 'rgba(20, 27, 74, 0.90)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.20)',
                },
              ]}>
              <Text style={[styles.homeLabelText, { color: colors.text }]}>
                {homePlace?.name || 'Home'}
              </Text>
            </View>
          </View>

          {/* FAMILY MEMBER MARKERS */}
          {displayMembers.map((member, idx) => {
            const isSelected = selectedMemberId === member.id;
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
              posX = centerX + Math.max(-160, Math.min(160, deltaX));
              posY = centerY + Math.max(-90, Math.min(90, deltaY));
            } else {
              posX = centerX + (idx % 2 === 0 ? 55 : -55) * idx;
              posY = centerY + (idx % 2 === 0 ? -35 : 40) * idx;
            }

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
                    left: posX,
                    top: posY,
                    zIndex: isSelected ? 30 : 15,
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
                    {member.name.split(' ')[0]}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </Animated.View>

        {/* OVERLAYS: */}
        {/* Top-Left: Green "LIVE" Pill + "GPS Live" / "IP Live" + live place */}
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
            {isGpsLive ? (
              <Text style={{ fontSize: 9, color: colors.blue, fontWeight: '700', marginLeft: 2 }}>
                • GPS
              </Text>
            ) : (
              <Text style={{ fontSize: 9, color: colors.blue, fontWeight: '700', marginLeft: 2 }}>
                • IP
              </Text>
            )}
          </View>
          <Text
            numberOfLines={1}
            style={[
              styles.broadcastingText,
              { color: isDark ? colors.textMuted : colors.textSecondary, maxWidth: 160 },
            ]}>
            {humanPlace}
          </Text>
        </View>

        {/* Top-Right Controls: Satellite / Canvas Toggle */}
        <View style={styles.topRightRow}>
          <Pressable
            onPress={() => {
              triggerHaptic();
              setMapMode((m) => (m === 'streets' ? 'satellite' : 'streets'));
            }}
            style={({ pressed }) => [
              styles.mapModeBtn,
              {
                backgroundColor: isDark ? 'rgba(15, 26, 58, 0.90)' : 'rgba(255, 255, 255, 0.92)',
                borderColor: isDark ? 'rgba(255, 255, 255, 0.15)' : 'rgba(124, 92, 224, 0.14)',
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <Ionicons
              name={mapMode === 'satellite' ? 'map-outline' : 'earth-outline'}
              size={12}
              color={colors.text}
            />
            <Text style={[styles.mapModeText, { color: colors.text }]}>
              {mapMode === 'satellite' ? 'Canvas' : 'Satellite'}
            </Text>
          </Pressable>
        </View>

        {/* Right Controls: Zoom +/- and Locate Target Buttons */}
        <View style={styles.rightControlsCluster}>
          <Pressable
            onPress={handleZoomIn}
            style={[
              styles.controlCircleBtn,
              {
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.85)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.15)',
              },
            ]}>
            <Ionicons name="add" size={16} color={colors.text} />
          </Pressable>

          <Pressable
            onPress={handleZoomOut}
            style={[
              styles.controlCircleBtn,
              {
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.85)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.15)',
              },
            ]}>
            <Ionicons name="remove" size={16} color={colors.text} />
          </Pressable>

          <Pressable
            onPress={() => {
              triggerHaptic();
              if (activeUser) {
                setSelectedMemberId(activeUser.id);
                setPanOffset({ x: 0, y: 0 });
              }
            }}
            style={[
              styles.controlCircleBtn,
              {
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.85)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.15)',
              },
            ]}>
            <Ionicons name="locate" size={14} color={isDark ? colors.brandAccent : '#7C5CE0'} />
          </Pressable>
        </View>

        {/* Bottom-Right: "Recenter" Pill */}
        {!selectedMember && (
          <Pressable
            onPress={handleRecenter}
            style={[
              styles.recenterPill,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(255, 255, 255, 0.94)',
                borderColor: isDark ? 'rgba(139, 124, 246, 0.50)' : 'rgba(124, 92, 224, 0.20)',
              },
            ]}>
            <Ionicons name="compass-outline" size={13} color={isDark ? '#8B7CF6' : '#7C5CE0'} />
            <Text style={[styles.recenterText, { color: isDark ? '#8B7CF6' : '#7C5CE0' }]}>Recenter</Text>
          </Pressable>
        )}

        {/* Selected Member Floating Telemetry Card */}
        {selectedMember && (
          <View
            style={[
              styles.selectedTelemetryBar,
              {
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.95)' : 'rgba(255, 255, 255, 0.96)',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.25)' : 'rgba(124, 92, 224, 0.25)',
              },
            ]}>
            <FamilyAvatar member={selectedMember} size="sm" showStatus={false} />
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.selectedBarName, { color: colors.text }]} numberOfLines={1}>
                {selectedMember.name} • <Text style={{ color: colors.green, fontWeight: '700' }}>Live</Text>
              </Text>
              <Text style={[styles.selectedBarLoc, { color: isDark ? colors.textTertiary : colors.textSecondary }]} numberOfLines={1}>
                📍 {selectedMember.humanLocation || humanPlace}
              </Text>
            </View>
            <Pressable
              onPress={() => setSelectedMemberId(null)}
              hitSlop={8}
              style={{ padding: 4 }}>
              <Ionicons name="close-circle" size={18} color={isDark ? colors.textTertiary : colors.textMuted} />
            </Pressable>
          </View>
        )}
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
            setPanOffset({ x: 0, y: 0 });
          }}
          style={[
            styles.filterChip,
            {
              backgroundColor: !selectedMemberId
                ? undefined
                : isDark
                ? 'rgba(255, 255, 255, 0.03)'
                : 'rgba(124, 92, 224, 0.08)',
              borderColor: !selectedMemberId
                ? 'transparent'
                : isDark
                ? 'rgba(130, 140, 255, 0.22)'
                : 'rgba(124, 92, 224, 0.15)',
              overflow: 'hidden',
            },
          ]}>
          {!selectedMemberId && (
            <LinearGradient
              colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
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
        {displayMembers.map((m) => {
          const isSelected = selectedMemberId === m.id;
          return (
            <Pressable
              key={m.id}
              onPress={() => {
                triggerHaptic();
                setSelectedMemberId(isSelected ? null : m.id);
                setPanOffset({ x: 0, y: 0 });
              }}
              style={[
                styles.filterChip,
                {
                  backgroundColor: isSelected
                    ? undefined
                    : isDark
                    ? 'rgba(255, 255, 255, 0.03)'
                    : 'rgba(124, 92, 224, 0.08)',
                  borderColor: isSelected
                    ? 'transparent'
                    : isDark
                    ? 'rgba(130, 140, 255, 0.22)'
                    : 'rgba(124, 92, 224, 0.15)',
                  overflow: 'hidden',
                },
              ]}>
              {isSelected && (
                <LinearGradient
                  colors={isDark ? ['#4F8EF7', '#8B6CF0'] : ['#4F8EF7', '#8A6BF2']}
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
                {m.name.split(' ')[0]}
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
    height: 240,
    borderRadius: 20,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
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
  topRightRow: {
    position: 'absolute',
    top: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mapModeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4.5,
    borderRadius: 10,
    borderWidth: 1,
  },
  mapModeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  rightControlsCluster: {
    position: 'absolute',
    right: 10,
    top: 46,
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
  selectedTelemetryBar: {
    position: 'absolute',
    bottom: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
  },
  selectedBarName: {
    fontSize: 12,
    fontWeight: '700',
  },
  selectedBarLoc: {
    fontSize: 10.5,
    marginTop: 2,
  },
});
