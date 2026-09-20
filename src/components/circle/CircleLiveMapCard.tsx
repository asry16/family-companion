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
import Svg, { Path, Rect } from 'react-native-svg';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { FamilyMember } from '@/types';
import {
  lon2tile,
  lat2tile,
  lon2tileFraction,
  lat2tileFraction,
  latLonToPixelOffset,
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

const MEMBER_ACCENT_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B'];

const VectorMapCanvas = ({ width, height, isDark }: { width: number; height: number; isDark: boolean }) => {
  const w = width > 0 ? width : 380;
  const h = height > 0 ? height : 340;

  if (isDark) {
    return (
      <View style={[StyleSheet.absoluteFill, { backgroundColor: '#0F1535' }]}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} style={StyleSheet.absoluteFill}>
          <Rect x="0" y="0" width={w} height={h} fill="#0F1535" />
          <Rect x={w * 0.08} y={h * 0.08} width={w * 0.22} height={h * 0.20} rx={10} fill="#142838" opacity={0.6} />
          <Rect x={w * 0.06} y={h * 0.44} width={w * 0.25} height={h * 0.22} rx={10} fill="#142838" opacity={0.6} />
          <Path d={`M -30,${h * 0.32} L ${w + 30},${h * 0.52}`} stroke="#1E2568" strokeWidth="14" fill="none" />
          <Path d={`M ${w * 0.16},-30 L ${w * 0.55},${h + 30}`} stroke="#1E2568" strokeWidth="14" fill="none" />
          <Path d={`M -30,${h * 0.68} L ${w + 30},${h * 0.72}`} stroke="#1E2568" strokeWidth="9" fill="none" />
          <Path d={`M ${w * 0.45},-30 L -30,${h * 0.50}`} stroke="#1E2568" strokeWidth="9" fill="none" />
          <Path
            d={`M ${w * 0.82},-30 C ${w * 0.76},${h * 0.20} ${w * 0.68},${h * 0.36} ${w * 0.60},${h * 0.52} C ${w * 0.52},${h * 0.68} ${w * 0.46},${h * 0.84} ${w * 0.36},${h + 30}`}
            stroke="#1E3A8A"
            strokeWidth="30"
            strokeLinecap="round"
            fill="none"
          />
        </Svg>
      </View>
    );
  }

  // Light Mode vector map matching reference image exactly
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: '#F0F3FA' }]}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${w} ${h}`} style={StyleSheet.absoluteFill}>
        {/* Soft pastel canvas ground */}
        <Rect x="0" y="0" width={w} height={h} fill="#F0F3FA" />

        {/* Soft green park patches */}
        <Rect x={w * 0.08} y={h * 0.08} width={w * 0.22} height={h * 0.20} rx={10} fill="#DCFCE7" stroke="#BBF7D0" strokeWidth={1} opacity={0.9} />
        <Rect x={w * 0.06} y={h * 0.44} width={w * 0.25} height={h * 0.22} rx={10} fill="#DCFCE7" stroke="#BBF7D0" strokeWidth={1} opacity={0.9} />
        <Rect x={w * 0.42} y={h * 0.72} width={w * 0.24} height={h * 0.20} rx={10} fill="#DCFCE7" stroke="#BBF7D0" strokeWidth={1} opacity={0.7} />

        {/* Crisp white street grid with delicate road borders */}
        <Path d={`M -30,${h * 0.32} L ${w + 30},${h * 0.52}`} stroke="rgba(215, 222, 235, 0.7)" strokeWidth="18" fill="none" />
        <Path d={`M -30,${h * 0.32} L ${w + 30},${h * 0.52}`} stroke="#FFFFFF" strokeWidth="14" fill="none" />

        <Path d={`M ${w * 0.16},-30 L ${w * 0.55},${h + 30}`} stroke="rgba(215, 222, 235, 0.7)" strokeWidth="18" fill="none" />
        <Path d={`M ${w * 0.16},-30 L ${w * 0.55},${h + 30}`} stroke="#FFFFFF" strokeWidth="14" fill="none" />

        <Path d={`M -30,${h * 0.68} L ${w + 30},${h * 0.72}`} stroke="rgba(215, 222, 235, 0.5)" strokeWidth="12" fill="none" />
        <Path d={`M -30,${h * 0.68} L ${w + 30},${h * 0.72}`} stroke="#FFFFFF" strokeWidth="9" fill="none" />

        <Path d={`M ${w * 0.45},-30 L -30,${h * 0.50}`} stroke="rgba(215, 222, 235, 0.5)" strokeWidth="12" fill="none" />
        <Path d={`M ${w * 0.45},-30 L -30,${h * 0.50}`} stroke="#FFFFFF" strokeWidth="9" fill="none" />

        <Path d={`M ${w * 0.58},${h * 0.22} L ${w * 0.90},${h * 0.05}`} stroke="#FFFFFF" strokeWidth="7" fill="none" />
        <Path d={`M 20,${h * 0.18} L ${w * 0.38},${h * 0.20}`} stroke="#FFFFFF" strokeWidth="7" fill="none" />
        <Path d={`M ${w * 0.18},${h * 0.62} L ${w * 0.52},${h * 0.58}`} stroke="#FFFFFF" strokeWidth="7" fill="none" />
        <Path d={`M ${w * 0.72},${h * 0.48} L ${w * 0.98},${h * 0.72}`} stroke="#FFFFFF" strokeWidth="8" fill="none" />

        {/* Winding Blue River traversing right side toward bottom matching reference picture */}
        <Path
          d={`M ${w * 0.82},-30 C ${w * 0.76},${h * 0.20} ${w * 0.68},${h * 0.36} ${w * 0.60},${h * 0.52} C ${w * 0.52},${h * 0.68} ${w * 0.46},${h * 0.84} ${w * 0.36},${h + 30}`}
          stroke="#93C5FD"
          strokeWidth="38"
          strokeLinecap="round"
          fill="none"
          opacity={0.5}
        />
        <Path
          d={`M ${w * 0.82},-30 C ${w * 0.76},${h * 0.20} ${w * 0.68},${h * 0.36} ${w * 0.60},${h * 0.52} C ${w * 0.52},${h * 0.68} ${w * 0.46},${h * 0.84} ${w * 0.36},${h + 30}`}
          stroke="#BFDBFE"
          strokeWidth="30"
          strokeLinecap="round"
          fill="none"
        />
        <Path
          d={`M ${w * 0.82},-30 C ${w * 0.76},${h * 0.20} ${w * 0.68},${h * 0.36} ${w * 0.60},${h * 0.52} C ${w * 0.52},${h * 0.68} ${w * 0.46},${h * 0.84} ${w * 0.36},${h + 30}`}
          stroke="#DBEAFE"
          strokeWidth="12"
          strokeLinecap="round"
          fill="none"
          opacity={0.7}
        />
      </Svg>
    </View>
  );
};

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

  // Sync tile mode when theme changes
  useEffect(() => {
    setTileMode(isDark ? 'osm-dark' : 'osm-standard');
  }, [isDark]);

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

  // Map Tile Coordinates Calculation (uses real live GPS or active user coordinates)
  const baseLat = liveLoc?.latitude ?? activeUser?.coords?.latitude ?? 28.5498;
  const baseLon = liveLoc?.longitude ?? activeUser?.coords?.longitude ?? 77.2005;
  const tileZoom = 14;

  const centerFracX = lon2tileFraction(baseLon, tileZoom);
  const centerFracY = lat2tileFraction(baseLat, tileZoom);
  const centerTileX = Math.floor(centerFracX);
  const centerTileY = Math.floor(centerFracY);

  // 5x5 Tile Grid with exact fractional pixel alignment
  const mapTiles = useMemo(() => {
    const tiles: Array<{
      offsetX: number;
      offsetY: number;
      url: string;
      key: string;
    }> = [];
    for (let dy = -2; dy <= 2; dy++) {
      for (let dx = -2; dx <= 2; dx++) {
        const tx = (centerTileX + dx + 16384) % 16384;
        const ty = (centerTileY + dy + 16384) % 16384;
        const offsetX = (tx - centerFracX) * 256;
        const offsetY = (ty - centerFracY) * 256;
        tiles.push({
          offsetX,
          offsetY,
          url: getTileUrl(tx, ty, tileZoom, tileMode, isDark),
          key: `${tx}_${ty}_${tileMode}_${isDark ? 'dark' : 'light'}`,
        });
      }
    }
    return tiles;
  }, [centerTileX, centerTileY, centerFracX, centerFracY, tileMode, isDark]);

  const centerX = cardLayout.width > 0 ? cardLayout.width / 2 : 180;
  const centerY = cardLayout.height > 0 ? cardLayout.height / 2 : (typeof mapHeight === 'number' ? mapHeight / 2 : 200);

  // Pin positions calculated from actual GPS coordinates or relative offsets
  const memberPositions = useMemo(() => {
    return displayMembers.map((member, idx) => {
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
        const { dx, dy } = latLonToPixelOffset(
          member.coords.latitude,
          member.coords.longitude,
          baseLat,
          baseLon,
          tileZoom
        );
        const maxOffset = isFullScreen ? 280 : 150;
        posX = centerX + Math.max(-maxOffset, Math.min(maxOffset, dx));
        posY = centerY + Math.max(-maxOffset, Math.min(maxOffset, dy));
      } else {
        const angle = (idx * (2 * Math.PI)) / (displayMembers.length || 1);
        posX = centerX + Math.cos(angle) * 70;
        posY = centerY + Math.sin(angle) * 50;
      }

      const accentColor =
        idx === 0
          ? '#3B82F6'
          : idx === 1
          ? '#8B5CF6'
          : idx === 2
          ? '#10B981'
          : MEMBER_ACCENT_COLORS[idx % MEMBER_ACCENT_COLORS.length];
      const ringAnim = idx === 0 ? ringAnim1 : idx === 1 ? ringAnim2 : ringAnim3;

      return {
        member,
        posX,
        posY,
        accentColor,
        ringAnim,
      };
    });
  }, [displayMembers, activeUser?.id, centerX, centerY, baseLat, baseLon, isFullScreen, ringAnim1, ringAnim2, ringAnim3]);

  // Center map on specific member if selected
  const handlePinPress = (memberId: string, posX: number, posY: number) => {
    triggerHaptic();
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
            borderRadius: isFullScreen ? 0 : 24,
            borderWidth: isFullScreen ? 0 : 1,
            backgroundColor: isDark ? '#0F1535' : '#FFFFFF',
            borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(20, 32, 58, 0.08)',
            shadowColor: '#64748B',
            shadowOpacity: isDark ? 0.18 : 0.08,
            shadowRadius: 14,
            elevation: 3,
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
          
          {/* Real Raster Map Tiles (Light / Dark OSM / Satellite) */}
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
                      left: centerX + tile.offsetX,
                      top: centerY + tile.offsetY,
                    },
                  ]}
                  resizeMode="cover"
                />
              ))}
            </View>
          ) : (
            <VectorMapCanvas
              width={cardLayout.width || 380}
              height={typeof mapHeight === 'number' ? mapHeight : 340}
              isDark={isDark}
            />
          )}

          {/* Member Pins with Callout Speech Bubbles */}
          {memberPositions.map(({ member, posX, posY, accentColor, ringAnim }) => {
            const isSelected = selectedMemberId === member.id;
            const initials = member.name.charAt(0).toUpperCase();
            const locationPlace = member.humanLocation || 'At Home';
            const locationTime = member.lastUpdated || 'Just now';

            // Determine location context icon
            const lowerLoc = locationPlace.toLowerCase();
            const iconName: keyof typeof Ionicons.glyphMap = lowerLoc.includes('home')
              ? 'home'
              : lowerLoc.includes('college') || lowerLoc.includes('school') || lowerLoc.includes('class')
              ? 'school'
              : lowerLoc.includes('work') || lowerLoc.includes('office')
              ? 'briefcase'
              : 'location';

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
                
                {/* Ground Pulsing Halo */}
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
                            outputRange: [1.0, 1.7],
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
                  {/* Pin Body: Solid circle with bold white initial */}
                  <View
                    style={[
                      styles.pinTeardropCircle,
                      {
                        borderColor: '#FFFFFF',
                        backgroundColor: accentColor,
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
                      <Text style={[styles.pinInitialText, { color: '#FFFFFF' }]}>
                        {initials}
                      </Text>
                    )}
                    {/* Small Green Online Dot */}
                    <View
                      style={[
                        styles.pinOnlineDot,
                        {
                          backgroundColor: '#10B981',
                          borderColor: isDark ? '#141B4A' : '#FFFFFF',
                        },
                      ]}
                    />
                  </View>

                  {/* Teardrop Point Tail */}
                  <View style={[styles.pinPointTail, { borderTopColor: accentColor }]} />
                </Pressable>

                {/* Connected Callout Speech Bubble (to the right matching reference) */}
                {zoomLevel >= 0.8 && (
                  <Pressable
                    onPress={() => handlePinPress(member.id, posX, posY)}
                    style={[
                      styles.nameBubble,
                      styles.nameBubbleRight,
                      {
                        backgroundColor: isDark ? 'rgba(20, 27, 74, 0.90)' : '#FFFFFF',
                        borderColor: isSelected
                          ? accentColor
                          : isDark
                          ? 'rgba(130, 140, 255, 0.3)'
                          : 'rgba(20, 32, 58, 0.08)',
                        shadowColor: '#64748B',
                        shadowOpacity: isDark ? 0.2 : 0.10,
                      },
                    ]}>
                    <View style={styles.bubbleTopRow}>
                      <View style={styles.bubbleGreenDot} />
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.bubbleNameText,
                          {
                            color: isDark ? '#FFFFFF' : '#1E293B',
                            fontWeight: isSelected ? '700' : '600',
                          },
                        ]}>
                        {member.name}
                      </Text>
                    </View>
                    <View style={styles.bubbleBottomRow}>
                      <Ionicons
                        name={iconName}
                        size={10.5}
                        color={isDark ? '#A594FD' : '#7C5CE0'}
                      />
                      <Text
                        numberOfLines={1}
                        style={[
                          styles.bubbleDetailsText,
                          { color: isDark ? '#94A3B8' : '#64748B' },
                        ]}>
                        {locationPlace} • {locationTime}
                      </Text>
                    </View>
                  </Pressable>
                )}
              </View>
            );
          })}
        </Animated.View>

        {/* OVERLAYS */}
        {/* 1. Top-Left: Pill "Live Location" or "Enable Live GPS" */}
        {needsPermissionPrompt ? (
          <Pressable
            onPress={handleRequestLiveLocation}
            style={({ pressed }) => [
              styles.topLeftPill,
              {
                backgroundColor: isDark ? 'rgba(139, 124, 246, 0.28)' : '#EDE9FE',
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
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.85)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.3)' : 'rgba(20, 32, 58, 0.08)',
                shadowColor: '#64748B',
                shadowOpacity: isDark ? 0 : 0.08,
                shadowRadius: 4,
                elevation: 2,
              },
            ]}>
            <Animated.View
              style={[
                styles.overlayGreenDot,
                { backgroundColor: '#10B981', opacity: greenPulseAnim },
              ]}
            />
            <Text style={[styles.topLeftPillText, { color: isDark ? '#FFFFFF' : '#1E293B' }]}>
              Live Location
            </Text>
          </View>
        )}

        {/* 2. Top-Right: "View List >" Pill matching reference picture */}
        <View style={styles.topRightActionsRow}>
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
                  backgroundColor: isDark ? 'rgba(20, 27, 74, 0.85)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.3)' : 'rgba(20, 32, 58, 0.08)',
                  shadowColor: '#64748B',
                  shadowOpacity: isDark ? 0 : 0.08,
                  shadowRadius: 4,
                  elevation: 2,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Ionicons
                name="people"
                size={14}
                color={isDark ? '#A594FD' : '#7C5CE0'}
              />
              <Text
                style={[
                  styles.topRightPillText,
                  { color: isDark ? '#A594FD' : '#7C5CE0' },
                ]}>
                View List
              </Text>
              <Ionicons
                name="chevron-forward"
                size={12}
                color={isDark ? '#A594FD' : '#7C5CE0'}
              />
            </Pressable>
          )}

          {isFullScreen && onFullScreen && (
            <Pressable
              onPress={() => {
                triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
                onFullScreen();
              }}
              hitSlop={6}
              style={({ pressed }) => [
                styles.topRightPill,
                {
                  backgroundColor: isDark ? 'rgba(20, 27, 74, 0.85)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.35)' : 'rgba(20, 32, 58, 0.08)',
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Ionicons name="contract-outline" size={13} color={isDark ? '#C9CEFF' : '#5B628F'} />
              <Text style={[styles.topRightPillText, { color: isDark ? '#C9CEFF' : '#5B628F' }]}>Exit</Text>
            </Pressable>
          )}
        </View>

        {/* 3. Bottom-Left: Pill "Live • GPS" matching reference picture */}
        <View
          style={[
            styles.bottomLeftPill,
            {
              backgroundColor: isDark ? 'rgba(20, 27, 74, 0.85)' : '#FFFFFF',
              borderColor: isDark ? 'rgba(130, 140, 255, 0.3)' : 'rgba(20, 32, 58, 0.08)',
              shadowColor: '#64748B',
              shadowOpacity: isDark ? 0 : 0.08,
              shadowRadius: 4,
              elevation: 2,
            },
          ]}>
          <View style={[styles.bottomLeftDot, { backgroundColor: '#10B981' }]} />
          <Text
            style={[
              styles.bottomLeftPillText,
              { color: isDark ? '#34D399' : '#1E293B' },
            ]}>
            Live • {isGpsLive ? 'GPS' : 'Network'}
          </Text>
        </View>

        {/* 4. Right Side: Circular Locate Button + Segmented Zoom Control */}
        <View style={styles.rightControlsContainer}>
          {/* Circular Locate Button */}
          <Pressable
            onPress={handleLocate}
            hitSlop={6}
            accessibilityLabel="Recenter Map"
            style={({ pressed }) => [
              styles.locateButton,
              {
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.85)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.3)' : 'rgba(20, 32, 58, 0.08)',
                shadowColor: '#64748B',
                shadowOpacity: isDark ? 0 : 0.08,
                shadowRadius: 4,
                elevation: 2,
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <Ionicons
              name="locate-outline"
              size={18}
              color={isDark ? '#C9CEFF' : '#334155'}
            />
          </Pressable>

          {/* Grouped Vertical +/- Zoom Control */}
          <View
            style={[
              styles.zoomGroup,
              {
                backgroundColor: isDark ? 'rgba(20, 27, 74, 0.85)' : '#FFFFFF',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.3)' : 'rgba(20, 32, 58, 0.08)',
                shadowColor: '#64748B',
                shadowOpacity: isDark ? 0 : 0.08,
                shadowRadius: 4,
                elevation: 2,
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
                  backgroundColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(20, 32, 58, 0.08)',
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

        {/* 5. Legal OpenStreetMap Attribution in dark mode */}
        {isDark && (
          <View
            style={[
              styles.osmAttributionBadge,
              {
                pointerEvents: 'none',
                backgroundColor: 'rgba(15, 23, 42, 0.70)',
                borderColor: 'rgba(255, 255, 255, 0.10)',
              },
            ]}>
            <Text style={[styles.osmAttributionText, { color: 'rgba(203, 213, 225, 0.8)' }]}>
              {getOsmAttribution(tileMode)}
            </Text>
          </View>
        )}
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
    borderRadius: 24,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 3,
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
  pinMarkerWrapper: {
    position: 'absolute',
    width: 44,
    height: 52,
    alignItems: 'center',
  },
  groundPulseRing: {
    position: 'absolute',
    bottom: -6,
    width: 34,
    height: 20,
    borderRadius: 17,
    borderWidth: 2,
    alignSelf: 'center',
  },
  teardropContainer: {
    alignItems: 'center',
    width: 44,
  },
  pinTeardropCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pinAvatarImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  pinInitialText: {
    fontSize: 16,
    fontWeight: '800',
  },
  pinOnlineDot: {
    position: 'absolute',
    bottom: -1,
    right: -1,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    borderWidth: 1.5,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    borderWidth: 1,
    minWidth: 84,
    maxWidth: 145,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 3,
  },
  nameBubbleRight: {
    left: 44,
  },
  nameBubbleLeft: {
    right: 44,
  },
  bubbleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  bubbleGreenDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
  },
  bubbleNameText: {
    fontSize: 12,
    letterSpacing: -0.2,
    includeFontPadding: false,
  },
  bubbleBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  bubbleDetailsText: {
    fontSize: 10,
    fontWeight: '500',
    includeFontPadding: false,
  },
  topLeftPill: {
    position: 'absolute',
    top: 12,
    left: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
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
    gap: 5,
    paddingHorizontal: 11,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  topRightPillText: {
    fontSize: 12,
    fontWeight: '700',
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
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 18,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  zoomGroup: {
    width: 38,
    borderRadius: 19,
    borderWidth: 1,
    alignItems: 'center',
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  zoomBtn: {
    width: 38,
    height: 34,
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
