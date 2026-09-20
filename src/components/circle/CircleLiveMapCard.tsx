import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Image,
  Animated,
  PanResponder,
  useWindowDimensions,
  AccessibilityInfo,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { FamilyMember } from '@/types';
import {
  lon2tile,
  lat2tile,
  getTileUrl,
  watchLocation,
  LiveLocation,
  MapTileMode,
  getOsmAttribution,
  getLocationPermissionStatus,
  requestLocationPermission,
} from '@/services/locationService';
import { CircleTokens } from '@/constants/theme';

interface CircleLiveMapCardProps {
  members?: FamilyMember[];
  selectedMemberId?: string | null;
  onSelectMember?: (memberId: string) => void;
  onPressViewList?: () => void;
  onFullScreen?: () => void;
  isFullScreen?: boolean;
}

const MEMBER_ACCENT_COLORS = ['#4F8EF7', '#8B6CF0', '#2DD4BF', '#F59E0B'];

export const CircleLiveMapCard: React.FC<CircleLiveMapCardProps> = ({
  members: propMembers,
  selectedMemberId,
  onSelectMember,
  onPressViewList,
  onFullScreen,
  isFullScreen = false,
}) => {
  const { height: windowHeight } = useWindowDimensions();
  const { colors, isDark } = useAppTheme();
  const { members: ctxMembers, activeUser, places } = useFamily();

  // Clamped height when normal, or 100% when full screen
  const mapHeight = isFullScreen
    ? '100%'
    : Math.min(
        Math.max(CircleTokens.mapHeightMin, Math.round(windowHeight * CircleTokens.mapHeightRatio)),
        CircleTokens.mapHeightMax
      );

  const displayMembers = useMemo(() => {
    const list = propMembers && propMembers.length > 0 ? propMembers : ctxMembers;
    if (list && list.length > 0) return list;
    if (activeUser) return [activeUser];
    return [];
  }, [propMembers, ctxMembers, activeUser]);

  // Live Location from GPS
  const [liveLoc, setLiveLoc] = useState<LiveLocation | null>(null);
  const [isGpsLive, setIsGpsLive] = useState<boolean>(true);
  const [tileMode, setTileMode] = useState<MapTileMode>(isDark ? 'osm-dark' : 'osm-standard');
  const [tileError, setTileError] = useState<boolean>(false);
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cardLayout, setCardLayout] = useState<{ width: number; height: number }>({ width: 0, height: 0 });
  const [reducedMotion, setReducedMotion] = useState<boolean>(false);

  // Cycle through map layers: Dark Canvas -> Official OSM Standard -> Satellite
  const cycleMapMode = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setTileMode((prev) => {
      if (prev === 'osm-dark') return 'osm-standard';
      if (prev === 'osm-standard') return 'satellite';
      return isDark ? 'osm-dark' : 'osm-standard';
    });
  };

  // Check reduced motion preference
  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then((enabled) => {
      setReducedMotion(enabled);
    });
  }, []);

  // Top-left live green dot pulse
  const greenPulseAnim = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    if (reducedMotion) return;
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(greenPulseAnim, {
          toValue: 0.35,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(greenPulseAnim, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [greenPulseAnim, reducedMotion]);

  // Staggered ground ring pulse animations (3 members)
  const ringAnim1 = useRef(new Animated.Value(0)).current;
  const ringAnim2 = useRef(new Animated.Value(0)).current;
  const ringAnim3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (reducedMotion) return;
    const createLoop = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const loop1 = createLoop(ringAnim1, 0);
    const loop2 = createLoop(ringAnim2, 600);
    const loop3 = createLoop(ringAnim3, 1200);

    loop1.start();
    loop2.start();
    loop3.start();

    return () => {
      loop1.stop();
      loop2.stop();
      loop3.stop();
    };
  }, [ringAnim1, ringAnim2, ringAnim3, reducedMotion]);

  // Check location permission
  const [needsPermissionPrompt, setNeedsPermissionPrompt] = useState(false);

  useEffect(() => {
    getLocationPermissionStatus().then((status) => {
      if (status === 'prompt') {
        setNeedsPermissionPrompt(true);
      }
    });
  }, []);

  // Watch GPS location
  useEffect(() => {
    const unsub = watchLocation((loc) => {
      setLiveLoc(loc);
      setIsGpsLive(loc.source === 'gps');
      if (loc.source === 'gps') {
        setNeedsPermissionPrompt(false);
      }
    });
    return () => unsub();
  }, []);

  const handleRequestLiveLocation = async () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    const granted = await requestLocationPermission();
    if (granted) {
      setNeedsPermissionPrompt(false);
      setIsGpsLive(true);
    } else {
      setNeedsPermissionPrompt(false);
    }
  };

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  // Pan Responder
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 3 || Math.abs(gestureState.dy) > 3;
      },
      onPanResponderMove: (_, gestureState) => {
        setPanOffset((prev) => ({
          x: Math.min(Math.max(prev.x + gestureState.dx * 0.35, -200), 200),
          y: Math.min(Math.max(prev.y + gestureState.dy * 0.35, -150), 150),
        }));
      },
      onPanResponderRelease: () => {},
    })
  ).current;

  // Zoom controls
  const handleZoomIn = () => {
    triggerHaptic();
    setZoomLevel((z) => Math.min(Number((z + 0.2).toFixed(2)), 1.8));
  };

  const handleZoomOut = () => {
    triggerHaptic();
    setZoomLevel((z) => Math.max(Number((z - 0.2).toFixed(2)), 0.8));
  };

  // Locate button: Recenter map to center
  const handleLocate = () => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1);
  };

  // Map Tile Coordinates Calculation
  const baseLat = liveLoc?.latitude || 37.7749;
  const baseLon = liveLoc?.longitude || -122.4194;
  const tileZoom = 14;

  const centerTileX = lon2tile(baseLon, tileZoom);
  const centerTileY = lat2tile(baseLat, tileZoom);

  // 3x3 Tile Grid
  const mapTiles = useMemo(() => {
    const tiles: Array<{ x: number; y: number; tileX: number; tileY: number; url: string; key: string }> = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const tx = centerTileX + dx;
        const ty = centerTileY + dy;
        tiles.push({
          x: dx,
          y: dy,
          tileX: tx,
          tileY: ty,
          url: getTileUrl(tx, ty, tileZoom, tileMode, isDark),
          key: `${tx}_${ty}_${tileMode}_${isDark ? 'dark' : 'light'}`,
        });
      }
    }
    return tiles;
  }, [centerTileX, centerTileY, tileMode, isDark]);

  const centerX = cardLayout.width > 0 ? cardLayout.width / 2 : 180;
  const centerY = cardLayout.height > 0 ? cardLayout.height / 2 : (typeof mapHeight === 'number' ? mapHeight / 2 : 200);

  // Pin positions calculation
  const memberPositions = useMemo(() => {
    return displayMembers.map((member, idx) => {
      const isSelf = member.isSelf || member.id === activeUser?.id;
      let posX = centerX;
      let posY = centerY;

      if (isSelf) {
        posX = centerX;
        posY = centerY + 10;
      } else if (idx === 1) {
        posX = centerX - 95;
        posY = centerY - 55;
      } else if (idx === 2) {
        posX = centerX + 90;
        posY = centerY + 45;
      } else {
        const angle = (idx * (2 * Math.PI)) / displayMembers.length;
        posX = centerX + Math.cos(angle) * 80;
        posY = centerY + Math.sin(angle) * 60;
      }

      const accentColor = MEMBER_ACCENT_COLORS[idx % MEMBER_ACCENT_COLORS.length];
      const ringAnim = idx === 0 ? ringAnim1 : idx === 1 ? ringAnim2 : ringAnim3;
      // If position is on right side of centerX, flip bubble to left to prevent boundary clipping
      const isBubbleOnLeft = posX > centerX + 10;

      return {
        member,
        posX,
        posY,
        accentColor,
        ringAnim,
        isBubbleOnLeft,
      };
    });
  }, [displayMembers, activeUser?.id, centerX, centerY, ringAnim1, ringAnim2, ringAnim3]);

  // Center map on specific member if selected
  const handlePinPress = (memberId: string, posX: number, posY: number) => {
    triggerHaptic();
    // Center pan toward marker
    setPanOffset({
      x: (centerX - posX) * 0.7,
      y: (centerY - posY) * 0.7,
    });
    if (onSelectMember) {
      onSelectMember(memberId);
    }
  };

  return (
    <View style={[styles.cardOuterWrapper, isFullScreen && styles.cardOuterWrapperFullScreen]}>
      <View
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width > 0 && height > 0) {
            setCardLayout({ width, height });
          }
        }}
        style={[
          styles.mapContainer,
          {
            height: mapHeight,
            borderRadius: isFullScreen ? 0 : CircleTokens.mapCardRadius,
            borderWidth: isFullScreen ? 0 : 1,
            backgroundColor: '#0F1535',
            borderColor: 'rgba(130, 140, 255, 0.22)',
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
          
          {/* ArcGIS Raster Tiles Grid or Fallback Illustration */}
          {!tileError ? (
            <View style={styles.tileGridContainer}>
              {mapTiles.map((tile) => (
                <Image
                  key={tile.key}
                  source={{ uri: tile.url }}
                  onError={() => setTileError(true)}
                  style={[
                    styles.rasterTile,
                    {
                      left: centerX + tile.x * 256 - 128,
                      top: centerY + tile.y * 256 - 128,
                    },
                  ]}
                  resizeMode="cover"
                />
              ))}
            </View>
          ) : (
            /* Fallback vector map styling when offline */
            <View
              style={[
                styles.fallbackMapSurface,
                { backgroundColor: isDark ? '#141A4A' : '#E8EEF8' },
              ]}>
              <View
                style={[
                  styles.fallbackRoadHorizontal,
                  { backgroundColor: isDark ? '#2A3080' : '#CBD5E1' },
                ]}
              />
              <View
                style={[
                  styles.fallbackRoadVertical,
                  { backgroundColor: isDark ? '#2A3080' : '#CBD5E1' },
                ]}
              />
              <View
                style={[
                  styles.fallbackParkPatch,
                  { backgroundColor: isDark ? '#1C4B4A' : '#D1FAE5' },
                ]}
              />
            </View>
          )}

          {/* Member Pins */}
          {memberPositions.map(({ member, posX, posY, accentColor, ringAnim, isBubbleOnLeft }) => {
            const isSelected = selectedMemberId === member.id;
            const initials = member.name.charAt(0).toUpperCase();
            const locationPlace = member.humanLocation || 'At Home';
            const locationTime = member.lastUpdated || 'Just now';

            return (
              <View
                key={member.id}
                style={[
                  styles.pinMarkerWrapper,
                  {
                    left: posX - 22,
                    top: posY - 46,
                    zIndex: isSelected ? 40 : 20,
                  },
                ]}>
                
                {/* Ground Pulsing Ring */}
                <Animated.View
                  style={[
                    styles.groundPulseRing,
                    {
                      borderColor: accentColor,
                      backgroundColor: `${accentColor}25`,
                      transform: [
                        {
                          scale: ringAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1.0, 1.6],
                          }),
                        },
                      ],
                      opacity: ringAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.45, 0],
                      }),
                    },
                  ]}
                />

                {/* Teardrop Pin Container */}
                <Pressable
                  onPress={() => handlePinPress(member.id, posX, posY)}
                  hitSlop={8}
                  style={styles.teardropContainer}>
                  {/* Pin Body */}
                  <View
                    style={[
                      styles.pinTeardropCircle,
                      {
                        borderColor: accentColor,
                        backgroundColor: isDark ? '#141B4A' : '#FFFFFF',
                        shadowColor: accentColor,
                      },
                    ]}>
                    {member.photoUrl ? (
                      <Image
                        source={{ uri: member.photoUrl }}
                        style={styles.pinAvatarImage}
                        resizeMode="cover"
                      />
                    ) : (
                      <Text style={[styles.pinInitialText, { color: accentColor }]}>
                        {initials}
                      </Text>
                    )}
                    {/* Small Green Online Dot */}
                    <View style={[styles.pinOnlineDot, { backgroundColor: colors.green }]} />
                  </View>

                  {/* Teardrop Point Tail */}
                  <View style={[styles.pinPointTail, { borderTopColor: accentColor }]} />
                </Pressable>

                {/* Name & Telemetry Glass Bubble (hidden when zoomed out < 0.9) */}
                {zoomLevel >= 0.9 && (
                  <Pressable
                    onPress={() => handlePinPress(member.id, posX, posY)}
                    style={[
                      styles.nameBubble,
                      isBubbleOnLeft ? styles.nameBubbleLeft : styles.nameBubbleRight,
                      {
                        backgroundColor: 'rgba(20, 27, 74, 0.85)',
                        borderColor: isSelected
                          ? accentColor
                          : 'rgba(130, 140, 255, 0.3)',
                      },
                    ]}>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.bubbleNameText,
                        { color: colors.text, fontWeight: isSelected ? '700' : '600' },
                      ]}>
                      {member.name.split(' ')[0]}
                    </Text>
                    <Text
                      numberOfLines={1}
                      style={[
                        styles.bubbleDetailsText,
                        { color: isDark ? colors.textMuted : colors.textSecondary },
                      ]}>
                      {locationPlace} • {locationTime}
                    </Text>
                  </Pressable>
                )}
              </View>
            );
          })}
        </Animated.View>

        {/* OVERLAYS */}
        {/* 1. Top-Left: Glass Pill "Live Location" or "Enable Live GPS" */}
        {needsPermissionPrompt ? (
          <Pressable
            onPress={handleRequestLiveLocation}
            style={({ pressed }) => [
              styles.topLeftPill,
              {
                backgroundColor: isDark ? 'rgba(139, 124, 246, 0.28)' : 'rgba(124, 92, 224, 0.15)',
                borderColor: isDark ? '#8B7CF6' : '#7C5CE0',
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <Ionicons name="navigate" size={12} color={isDark ? '#A594FD' : '#7C5CE0'} />
            <Text style={[styles.topLeftPillText, { color: isDark ? '#A594FD' : '#7C5CE0', fontWeight: '700' }]}>
              Enable Live GPS
            </Text>
          </Pressable>
        ) : (
          <View
            style={[
              styles.topLeftPill,
              {
                backgroundColor: 'rgba(20, 27, 74, 0.6)',
                borderColor: 'rgba(130, 140, 255, 0.3)',
              },
            ]}>
            <Animated.View
              style={[
                styles.overlayGreenDot,
                { backgroundColor: colors.green, opacity: greenPulseAnim },
              ]}
            />
            <Text style={[styles.topLeftPillText, { color: colors.text }]}>
              Live Location
            </Text>
          </View>
        )}

        {/* 2. Top-Right: Full Screen Option Pill & View List Pill */}
        <View style={styles.topRightActionsRow}>
          {onFullScreen && (
            <Pressable
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                onFullScreen();
              }}
              hitSlop={6}
              accessibilityLabel={isFullScreen ? 'Exit Full Screen' : 'View Full Screen Map'}
              style={({ pressed }) => [
                styles.topRightPill,
                {
                  backgroundColor: isDark ? 'rgba(20, 27, 74, 0.88)' : 'rgba(255, 255, 255, 0.92)',
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.35)' : 'rgba(124, 92, 224, 0.28)',
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Ionicons
                name={isFullScreen ? 'contract-outline' : 'expand-outline'}
                size={13}
                color={isDark ? '#C9CEFF' : '#5B628F'}
              />
              <Text
                style={[
                  styles.topRightPillText,
                  { color: isDark ? '#C9CEFF' : '#5B628F' },
                ]}>
                {isFullScreen ? 'Exit' : 'Full Screen'}
              </Text>
            </Pressable>
          )}

          {onPressViewList && (
            <Pressable
              onPress={() => {
                triggerHaptic();
                onPressViewList();
              }}
              hitSlop={6}
              style={({ pressed }) => [
                styles.topRightPill,
                {
                  backgroundColor: 'rgba(20, 27, 74, 0.6)',
                  borderColor: 'rgba(130, 140, 255, 0.3)',
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Ionicons
                name="people-outline"
                size={13}
                color={isDark ? '#8B7CF6' : '#7C5CE0'}
              />
              <Text
                style={[
                  styles.topRightPillText,
                  { color: isDark ? '#8B7CF6' : '#7C5CE0' },
                ]}>
                View List
              </Text>
              <Ionicons
                name="chevron-down"
                size={12}
                color={isDark ? '#8B7CF6' : '#7C5CE0'}
              />
            </Pressable>
          )}
        </View>

        {/* 3. Bottom-Left: Green Glass Pill "Live • GPS" */}
        <View
          style={[
            styles.bottomLeftPill,
            {
              backgroundColor: 'rgba(20, 27, 74, 0.6)',
              borderColor: 'rgba(130, 140, 255, 0.3)',
            },
          ]}>
          <View style={[styles.bottomLeftDot, { backgroundColor: isDark ? '#34D399' : '#059669' }]} />
          <Text
            style={[
              styles.bottomLeftPillText,
              { color: isDark ? '#34D399' : '#059669' },
            ]}>
            Live • {isGpsLive ? 'GPS' : 'Network'}
          </Text>
        </View>

        {/* 4. Right Side: Full Screen + Layer Switcher + 40px Locate Button + Grouped Vertical Zoom Control */}
        <View style={styles.rightControlsContainer}>
          {/* 40px Circular Full Screen Toggle Button */}
          {onFullScreen && (
            <Pressable
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                onFullScreen();
              }}
              hitSlop={6}
              accessibilityLabel={isFullScreen ? 'Exit Full Screen' : 'View Full Screen Map'}
              style={({ pressed }) => [
                styles.locateButton,
                {
                  backgroundColor: 'rgba(20, 27, 74, 0.6)',
                  borderColor: 'rgba(130, 140, 255, 0.3)',
                  opacity: pressed ? 0.8 : 1,
                },
              ]}>
              <Ionicons
                name={isFullScreen ? 'contract-outline' : 'expand-outline'}
                size={18}
                color={isDark ? '#C9CEFF' : '#5B628F'}
              />
            </Pressable>
          )}

          {/* Map Layer Switcher Button */}
          <Pressable
            onPress={cycleMapMode}
            hitSlop={6}
            accessibilityLabel={`Map style: ${tileMode}`}
            style={({ pressed }) => [
              styles.locateButton,
              {
                backgroundColor: 'rgba(20, 27, 74, 0.6)',
                borderColor: 'rgba(130, 140, 255, 0.3)',
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <Ionicons
              name={tileMode === 'satellite' ? 'earth' : 'layers-outline'}
              size={18}
              color={tileMode === 'satellite' ? '#2DD4BF' : isDark ? '#C9CEFF' : '#5B628F'}
            />
          </Pressable>

          {/* 40px Circular Locate Button */}
          <Pressable
            onPress={handleLocate}
            hitSlop={6}
            accessibilityLabel="Recenter Map"
            style={({ pressed }) => [
              styles.locateButton,
              {
                backgroundColor: 'rgba(20, 27, 74, 0.6)',
                borderColor: 'rgba(130, 140, 255, 0.3)',
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <Ionicons
              name="navigate-outline"
              size={18}
              color={isDark ? '#C9CEFF' : '#5B628F'}
            />
          </Pressable>

          {/* Grouped Vertical +/- Zoom Control */}
          <View
            style={[
              styles.zoomGroup,
              {
                backgroundColor: 'rgba(20, 27, 74, 0.6)',
                borderColor: 'rgba(130, 140, 255, 0.3)',
              },
            ]}>
            <Pressable
              onPress={handleZoomIn}
              hitSlop={4}
              accessibilityLabel="Zoom In"
              style={({ pressed }) => [
                styles.zoomBtn,
                { opacity: pressed ? 0.6 : 1 },
              ]}>
              <Ionicons
                name="add"
                size={18}
                color={isDark ? '#F2F4FF' : '#334155'}
              />
            </Pressable>
            <View
              style={[
                styles.zoomDivider,
                {
                  backgroundColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.18)',
                },
              ]}
            />
            <Pressable
              onPress={handleZoomOut}
              hitSlop={4}
              accessibilityLabel="Zoom Out"
              style={({ pressed }) => [
                styles.zoomBtn,
                { opacity: pressed ? 0.6 : 1 },
              ]}>
              <Ionicons
                name="remove"
                size={18}
                color={isDark ? '#F2F4FF' : '#334155'}
              />
            </Pressable>
          </View>
        </View>

        {/* 5. Legal OpenStreetMap Attribution */}
        <View
          style={[
            styles.osmAttributionBadge,
            {
              pointerEvents: 'none',
              backgroundColor: isDark ? 'rgba(15, 23, 42, 0.70)' : 'rgba(255, 255, 255, 0.75)',
              borderColor: isDark ? 'rgba(255, 255, 255, 0.10)' : 'rgba(0, 0, 0, 0.08)',
            },
          ]}>
          <Text
            style={[
              styles.osmAttributionText,
              { color: isDark ? 'rgba(203, 213, 225, 0.8)' : 'rgba(71, 85, 105, 0.8)' },
            ]}>
            {getOsmAttribution(tileMode)}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardOuterWrapper: {
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  cardOuterWrapperFullScreen: {
    paddingHorizontal: 0,
    marginVertical: 0,
    flex: 1,
    height: '100%',
  },
  mapContainer: {
    borderRadius: CircleTokens.mapCardRadius,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 4,
  },
  mapCanvasPlane: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  tileGridContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  },
  rasterTile: {
    position: 'absolute',
    width: 256,
    height: 256,
  },
  fallbackMapSurface: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    overflow: 'hidden',
  },
  fallbackRoadHorizontal: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '48%',
    height: 14,
  },
  fallbackRoadVertical: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '42%',
    width: 14,
  },
  fallbackParkPatch: {
    position: 'absolute',
    right: 24,
    top: 24,
    width: 90,
    height: 70,
    borderRadius: 16,
    opacity: 0.6,
  },
  pinMarkerWrapper: {
    position: 'absolute',
    width: 44,
    height: 52,
    alignItems: 'center',
  },
  groundPulseRing: {
    position: 'absolute',
    bottom: -6,
    width: 32,
    height: 18,
    borderRadius: 16,
    borderWidth: 2,
    alignSelf: 'center',
  },
  teardropContainer: {
    alignItems: 'center',
    width: 44,
  },
  pinTeardropCircle: {
    width: CircleTokens.mapPinAvatarSize + 4,
    height: CircleTokens.mapPinAvatarSize + 4,
    borderRadius: (CircleTokens.mapPinAvatarSize + 4) / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },
  pinAvatarImage: {
    width: CircleTokens.mapPinAvatarSize,
    height: CircleTokens.mapPinAvatarSize,
    borderRadius: CircleTokens.mapPinAvatarSize / 2,
  },
  pinInitialText: {
    fontSize: 16,
    fontWeight: '700',
  },
  pinOnlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  pinPointTail: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
  nameBubble: {
    position: 'absolute',
    top: 2,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 90,
    maxWidth: 130,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  nameBubbleRight: {
    left: 48,
  },
  nameBubbleLeft: {
    right: 48,
  },
  bubbleNameText: {
    fontSize: 13,
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  bubbleDetailsText: {
    fontSize: 10.5,
    marginTop: 1,
    includeFontPadding: false,
  },
  topLeftPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  overlayGreenDot: {
    width: 6.5,
    height: 6.5,
    borderRadius: 3.5,
  },
  topLeftPillText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
    includeFontPadding: false,
  },
  topRightActionsRow: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    zIndex: 10,
  },
  topRightPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
  },
  topRightPillText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: -0.1,
    includeFontPadding: false,
  },
  bottomLeftPill: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: 14,
    borderWidth: 1,
  },
  bottomLeftDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bottomLeftPillText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.2,
    includeFontPadding: false,
  },
  rightControlsContainer: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    alignItems: 'center',
    gap: 8,
  },
  locateButton: {
    width: CircleTokens.headerButtonSize,
    height: CircleTokens.headerButtonSize,
    borderRadius: CircleTokens.headerButtonSize / 2,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  zoomGroup: {
    width: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
  },
  zoomBtn: {
    width: 36,
    height: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  zoomDivider: {
    width: 24,
    height: 1,
  },
  osmAttributionBadge: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    transform: [{ translateX: -100 }],
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  osmAttributionText: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});
