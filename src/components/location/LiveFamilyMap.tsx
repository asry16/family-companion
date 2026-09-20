import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
  ScrollView,
  Image,
  DimensionValue,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { FamilyMember } from '@/types';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';
import {
  lon2tile,
  lat2tile,
  getTileUrl,
  watchLocation,
  LiveLocation,
  MapTileMode,
  getOsmAttribution,
} from '@/services/locationService';

interface LiveFamilyMapProps {
  onMemberPress?: (member: FamilyMember) => void;
  showFocusBar?: boolean;
}

export const LiveFamilyMap: React.FC<LiveFamilyMapProps> = ({
  onMemberPress,
  showFocusBar = true,
}) => {
  const { colors, isElderly, isDark } = useAppTheme();
  const { members, activeUser, sendFamilyPing } = useFamily();

  // Selected or focused member on map
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Map mode: OpenStreetMap / Satellite
  const [mapStyle, setMapStyle] = useState<MapTileMode>(isDark ? 'osm-dark' : 'osm-positron');

  // Live Location & Layout State
  const [liveLoc, setLiveLoc] = useState<LiveLocation | null>(null);
  const [mapLayout, setMapLayout] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

  // Simulated live pulse animation state
  const [pulseTick, setPulseTick] = useState(0);

  useEffect(() => {
    const unsub = watchLocation((loc) => {
      setLiveLoc(loc);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setPulseTick((p) => (p + 1) % 100);
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const handleSelectMember = (member: FamilyMember) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
    setSelectedMemberId(selectedMemberId === member.id ? null : member.id);
    if (onMemberPress) {
      onMemberPress(member);
    }
  };

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  const handleCall = (phone: string, name: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    Linking.openURL(`tel:${phone}`).catch(() => {
      alert(`Calling ${name} at ${phone}...`);
    });
  };

  const handlePing = (memberId: string, name: string) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    sendFamilyPing(memberId, 'Location check-in request from live map.');
    alert(`Ping sent to ${name}!`);
  };

  const baseLat = liveLoc?.latitude ?? activeUser?.coords?.latitude ?? 28.5498;
  const baseLon = liveLoc?.longitude ?? activeUser?.coords?.longitude ?? 77.2005;
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

  const mapTiles = useMemo(() => {
    const tiles: Array<{ x: number; y: number; url: string; key: string }> = [];
    for (let dy = -halfSpanY; dy <= halfSpanY; dy++) {
      for (let dx = -halfSpanX; dx <= halfSpanX; dx++) {
        const tx = (centerTileX + dx + 16384) % 16384;
        const ty = (centerTileY + dy + 16384) % 16384;
        const url = getTileUrl(tx, ty, tileZoom, mapStyle, isDark);
        tiles.push({ x: dx, y: dy, url, key: `${tx}_${ty}_${mapStyle}_${isDark ? 'dark' : 'light'}` });
      }
    }
    return tiles;
  }, [centerTileX, centerTileY, mapStyle, isDark, halfSpanX, halfSpanY]);

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}>
      {/* Map Header with Live Radar Beacon & Style Switcher */}
      <View style={styles.mapHeader}>
        <View style={styles.beaconTitleRow}>
          <View style={[styles.beaconDotWrap, { backgroundColor: colors.greenSoft }]}>
            <View style={[styles.beaconDot, { backgroundColor: colors.green }]} />
          </View>
          <View>
            <Text style={[styles.mapTitle, { color: colors.text, fontSize: isElderly ? 18 : 15 }]}>
              Real-Time Family Live Map
            </Text>
            <Text style={[styles.mapSub, { color: colors.textSecondary }]}>
              {humanPlace} • {members.length} broadcasting
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            setMapStyle((prev) => {
              if (prev === 'osm-dark' || prev === 'osm-positron') return 'osm-standard';
              if (prev === 'osm-standard') return 'satellite';
              return isDark ? 'osm-dark' : 'osm-positron';
            });
          }}
          style={[
            styles.mapStyleToggle,
            { backgroundColor: colors.separator, borderColor: colors.border },
          ]}>
          <Ionicons
            name={mapStyle === 'satellite' ? 'earth-outline' : 'layers-outline'}
            size={13}
            color={colors.textSecondary}
          />
          <Text style={[styles.mapStyleText, { color: colors.textSecondary }]}>
            {mapStyle === 'satellite' ? 'Satellite' : mapStyle === 'osm-standard' ? 'OSM Standard' : 'OSM Canvas'}
          </Text>
        </Pressable>
      </View>

      {/* Member Focus Filter Bar */}
      {showFocusBar && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.memberFilterRow}>
          <Pressable
            onPress={() => {
              triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
              setSelectedMemberId(null);
            }}
            style={[
              styles.filterPill,
              {
                backgroundColor: !selectedMemberId
                  ? colors.brandAccent
                  : isDark
                  ? 'rgba(255, 255, 255, 0.03)'
                  : colors.separator,
                borderColor: !selectedMemberId
                  ? colors.brandAccent
                  : isDark
                  ? 'rgba(130, 140, 255, 0.22)'
                  : colors.border,
              },
            ]}>
            <Text
              style={[
                styles.filterPillText,
                {
                  color: !selectedMemberId
                    ? '#FFFFFF'
                    : colors.text,
                  fontWeight: !selectedMemberId ? '800' : '600',
                },
              ]}>
              All ({members.length})
            </Text>
          </Pressable>

          {members.map((member) => {
            const isFocused = selectedMemberId === member.id;
            return (
              <Pressable
                key={member.id}
                onPress={() => handleSelectMember(member)}
                style={[
                  styles.filterPill,
                  {
                    backgroundColor: isFocused
                      ? colors.brandAccent
                      : isDark
                      ? 'rgba(255, 255, 255, 0.03)'
                      : colors.separator,
                    borderColor: isFocused
                      ? colors.brandAccent
                      : isDark
                      ? 'rgba(130, 140, 255, 0.22)'
                      : colors.border,
                  },
                ]}>
                <View
                  style={[
                    styles.miniBatteryDot,
                    {
                      backgroundColor:
                        isFocused
                          ? '#FFFFFF'
                          : member.batteryLevel > 50 || member.isCharging
                          ? colors.green
                          : member.batteryLevel > 20
                          ? colors.yellow
                          : colors.red,
                    },
                  ]}
                />
                <Text
                  style={[
                    styles.filterPillText,
                    {
                      color: isFocused
                        ? '#FFFFFF'
                        : colors.text,
                      fontWeight: isFocused ? '800' : '600',
                    },
                  ]}>
                  {member.name}
                </Text>
                {member.ringerMode === 'silent' && (
                  <Ionicons
                    name="volume-mute"
                    size={11}
                    color={
                      isFocused
                        ? isDark
                          ? '#000000'
                          : '#FFFFFF'
                        : colors.red
                    }
                  />
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      )}

      {/* Live Map Canvas */}
      <View
        onLayout={(e) => {
          const { width, height } = e.nativeEvent.layout;
          if (width > 0 && height > 0) {
            setMapLayout((prev) => (prev.width === width && prev.height === height ? prev : { width, height }));
          }
        }}
        style={[
          styles.canvas,
          {
            backgroundColor:
              mapStyle === 'satellite'
                ? (isDark ? '#0B1030' : '#0F172A')
                : isDark
                ? '#141A4A'
                : isElderly
                ? '#1E293B'
                : '#F1F5F9',
            borderColor: colors.borderSubtle,
          },
        ]}>
        {/* Real Free ArcGIS Raster Tiles */}
        <View style={StyleSheet.absoluteFill}>
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

        {/* Live Pins for ALL Family Members */}
        {members.map((member, idx) => {
          const isSelf = member.isSelf || member.id === activeUser?.id;
          let pinLeft: DimensionValue = `${member.coords?.x ?? (50 + ((idx * 28 + 15) % 60) - 30)}%`;
          let pinTop: DimensionValue = `${member.coords?.y ?? (48 + ((idx * 34 + 10) % 50) - 25)}%`;

          if (isSelf) {
            pinLeft = centerX;
            pinTop = centerY;
          } else if (
            member.coords?.latitude &&
            member.coords?.longitude &&
            (member.coords.latitude !== baseLat || member.coords.longitude !== baseLon)
          ) {
            const memTileX = lon2tile(member.coords.longitude, tileZoom);
            const memTileY = lat2tile(member.coords.latitude, tileZoom);
            const deltaX = (memTileX - centerTileX) * 256;
            const deltaY = (memTileY - centerTileY) * 256;
            pinLeft = centerX + Math.max(-160, Math.min(160, deltaX));
            pinTop = centerY + Math.max(-100, Math.min(100, deltaY));
          }

          const isSelected = selectedMemberId === member.id;
          const isTransit = member.availability === 'in_transit';

          const ringColor = isTransit
            ? colors.yellow
            : member.availability === 'available'
            ? colors.green
            : colors.blue;

          return (
            <Pressable
              key={member.id}
              onPress={() => handleSelectMember(member)}
              style={[
                styles.liveMemberPinWrap,
                {
                  left: pinLeft,
                  top: pinTop,
                  zIndex: isSelected ? 30 : 10,
                  transform: [
                    { translateX: -24 },
                    { translateY: -46 },
                    { scale: isSelected ? 1.15 : 1 },
                  ],
                },
              ]}>
              {/* Radar Pulsing Rings */}
              <View
                style={[
                  styles.radarPulseRing,
                  {
                    borderColor: ringColor,
                    transform: [{ scale: 1 + (pulseTick % 3) * 0.15 }],
                    opacity: 0.8 - (pulseTick % 3) * 0.25,
                  },
                ]}
              />

              {/* Pin Callout Badge */}
              <View
                style={[
                  styles.pinBadge,
                  {
                    backgroundColor: isSelected
                      ? colors.brandAccent
                      : colors.cardBackground,
                    borderColor: isSelected
                      ? colors.brandAccent
                      : colors.border,
                  },
                ]}>
                <View style={styles.pinBadgeTopRow}>
                  <Text
                    style={[
                      styles.pinName,
                      { color: isSelected ? '#FFFFFF' : colors.text },
                    ]}>
                    {member.name}
                  </Text>
                  {/* Silent / Sound Status Icon */}
                  <Ionicons
                    name={
                      member.ringerMode === 'silent'
                        ? 'volume-mute'
                        : member.ringerMode === 'vibrate'
                        ? 'radio'
                        : 'volume-high'
                    }
                    size={10}
                    color={
                      member.ringerMode === 'silent'
                        ? colors.red
                        : isSelected
                        ? '#FFFFFF'
                        : colors.textSecondary
                    }
                  />
                </View>

                {/* Battery & Charging */}
                <View style={styles.pinBatteryRow}>
                  <Ionicons
                    name={member.isCharging ? 'flash' : 'battery-charging'}
                    size={9}
                    color={
                      isSelected && isDark
                        ? '#000000'
                        : member.batteryLevel > 50 || member.isCharging
                        ? colors.green
                        : colors.yellow
                    }
                  />
                  <Text
                    style={[
                      styles.pinBatteryText,
                      {
                        color: isSelected
                          ? isDark
                            ? '#000000'
                            : '#FFFFFF'
                          : colors.textSecondary,
                      },
                    ]}>
                    {member.batteryLevel}%
                  </Text>
                </View>
              </View>

              {/* Pin Avatar with Presence Halo */}
              <View style={[styles.pinAvatarWrap, { borderColor: ringColor }]}>
                <FamilyAvatar member={member} size="sm" showStatus={false} />
                {isTransit && (
                  <View style={[styles.transitMiniPin, { backgroundColor: colors.yellow }]}>
                    <Ionicons name="car" size={8} color="#000000" />
                  </View>
                )}
              </View>

              {/* Pin Pointer Stem */}
              <View
                style={[
                  styles.pinPointerStem,
                  { borderTopColor: ringColor },
                ]}
              />
            </Pressable>
          );
        })}

        {/* Legal OpenStreetMap Attribution */}
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
            {getOsmAttribution(mapStyle)}
          </Text>
        </View>
      </View>

      {/* Selected Member Live Telemetry Card (Opens on Pin or Chip Tap) */}
      {selectedMember && (
        <View
          style={[
            styles.selectedCard,
            {
              backgroundColor: colors.background,
              borderColor: colors.border,
            },
          ]}>
          <View style={styles.selectedTopRow}>
            <FamilyAvatar member={selectedMember} size="md" />
            <View style={{ flex: 1, gap: 2 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text style={[styles.selectedName, { color: colors.text }]}>
                  {selectedMember.name}
                </Text>
                <View
                  style={[
                    styles.roleBadge,
                    { backgroundColor: colors.separator },
                  ]}>
                  <Text style={[styles.roleBadgeText, { color: colors.textSecondary }]}>
                    {selectedMember.relation}
                  </Text>
                </View>
              </View>
              <Text style={[styles.selectedLocation, { color: colors.textSecondary }]}>
                📍 {selectedMember.humanLocation} • {selectedMember.statusMessage}
              </Text>
            </View>

            <Pressable
              onPress={() => setSelectedMemberId(null)}
              hitSlop={8}>
              <Ionicons name="close-circle" size={20} color={colors.textMuted} />
            </Pressable>
          </View>

          {/* Telemetry Strip: Ringer Mode + Battery % + Device */}
          <View style={styles.telemetryRow}>
            {/* Ringer */}
            <View
              style={[
                styles.telemetryPill,
                {
                  backgroundColor:
                    selectedMember.ringerMode === 'silent'
                      ? colors.redSoft
                      : selectedMember.ringerMode === 'vibrate'
                      ? colors.yellowSoft
                      : colors.blueSoft,
                  borderColor:
                    selectedMember.ringerMode === 'silent'
                      ? colors.redBorder
                      : selectedMember.ringerMode === 'vibrate'
                      ? colors.yellowBorder
                      : colors.blueBorder,
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
                size={12}
                color={
                  selectedMember.ringerMode === 'silent'
                    ? colors.red
                    : selectedMember.ringerMode === 'vibrate'
                    ? colors.yellow
                    : colors.blue
                }
              />
              <Text
                style={[
                  styles.telemetryPillText,
                  {
                    color:
                      selectedMember.ringerMode === 'silent'
                        ? colors.red
                        : selectedMember.ringerMode === 'vibrate'
                        ? colors.yellow
                        : colors.blue,
                  },
                ]}>
                {selectedMember.ringerMode === 'silent'
                  ? 'Silent Mode'
                  : selectedMember.ringerMode === 'vibrate'
                  ? 'Vibrate'
                  : 'Ringer On'}
              </Text>
            </View>

            {/* Battery */}
            <View
              style={[
                styles.telemetryPill,
                {
                  backgroundColor:
                    selectedMember.batteryLevel > 50 || selectedMember.isCharging
                      ? colors.greenSoft
                      : selectedMember.batteryLevel > 20
                      ? colors.yellowSoft
                      : colors.redSoft,
                  borderColor:
                    selectedMember.batteryLevel > 50 || selectedMember.isCharging
                      ? colors.greenBorder
                      : selectedMember.batteryLevel > 20
                      ? colors.yellowBorder
                      : colors.redBorder,
                },
              ]}>
              <Ionicons
                name={selectedMember.isCharging ? 'flash' : 'battery-charging'}
                size={12}
                color={
                  selectedMember.batteryLevel > 50 || selectedMember.isCharging
                    ? colors.green
                    : colors.yellow
                }
              />
              <Text
                style={[
                  styles.telemetryPillText,
                  {
                    color:
                      selectedMember.batteryLevel > 50 || selectedMember.isCharging
                        ? colors.green
                        : colors.yellow,
                  },
                ]}>
                {selectedMember.isCharging
                  ? `⚡ Charging (${selectedMember.batteryLevel}%)`
                  : `${selectedMember.batteryLevel}% Battery`}
              </Text>
            </View>

            {/* Device */}
            {selectedMember.deviceModel && (
              <View
                style={[
                  styles.telemetryPill,
                  { backgroundColor: colors.separator, borderColor: colors.border },
                ]}>
                <Ionicons name="phone-portrait-outline" size={11} color={colors.textSecondary} />
                <Text style={[styles.telemetryPillText, { color: colors.textSecondary }]}>
                  {selectedMember.deviceModel}
                </Text>
              </View>
            )}
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtonsRow}>
            <Pressable
              onPress={() => handleCall(selectedMember.phone, selectedMember.name)}
              style={({ pressed }) => [
                styles.cardActionBtn,
                {
                  backgroundColor: colors.greenSoft,
                  borderColor: colors.greenBorder,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Ionicons name="call" size={14} color={colors.green} />
              <Text style={[styles.cardActionText, { color: colors.green }]}>
                Call {selectedMember.name}
              </Text>
            </Pressable>

            <Pressable
              onPress={() => handlePing(selectedMember.id, selectedMember.name)}
              style={({ pressed }) => [
                styles.cardActionBtn,
                {
                  backgroundColor: colors.blueSoft,
                  borderColor: colors.blueBorder,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Ionicons name="paper-plane" size={14} color={colors.blue} />
              <Text style={[styles.cardActionText, { color: colors.blue }]}>
                Check In Ping
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 22,
    borderWidth: 1,
    padding: 16,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 3,
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  beaconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  beaconDotWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  beaconDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  mapTitle: {
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  mapSub: {
    fontSize: 11,
    marginTop: 1,
  },
  mapStyleToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
  },
  mapStyleText: {
    fontSize: 11,
    fontWeight: '700',
  },
  memberFilterRow: {
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 2,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
  },
  miniBatteryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  filterPillText: {
    fontSize: 12,
    fontWeight: '700',
  },

  // Map Canvas
  canvas: {
    height: 240,
    borderRadius: 18,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  mapRasterTile: {
    position: 'absolute',
    width: 256,
    height: 256,
  },

  // Member Live Pins
  liveMemberPinWrap: {
    position: 'absolute',
    alignItems: 'center',
  },
  radarPulseRing: {
    position: 'absolute',
    bottom: 2,
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  pinBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    marginBottom: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pinBadgeTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  pinName: {
    fontSize: 10,
    fontWeight: '800',
  },
  pinBatteryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    marginTop: 1,
  },
  pinBatteryText: {
    fontSize: 9,
    fontWeight: '600',
  },
  pinAvatarWrap: {
    padding: 2,
    borderRadius: 22,
    borderWidth: 2,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  transitMiniPin: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 14,
    height: 14,
    borderRadius: 7,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#FFFFFF',
  },
  pinPointerStem: {
    width: 0,
    height: 0,
    borderLeftWidth: 4,
    borderRightWidth: 4,
    borderTopWidth: 5,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },

  // Selected Member Card
  selectedCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    gap: 10,
    marginTop: 2,
  },
  selectedTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  selectedName: {
    fontSize: 15,
    fontWeight: '800',
  },
  roleBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  roleBadgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  selectedLocation: {
    fontSize: 12,
  },
  telemetryRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  telemetryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
  },
  telemetryPillText: {
    fontSize: 11,
    fontWeight: '700',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 2,
  },
  cardActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 9,
    borderRadius: 12,
    borderWidth: 1,
    gap: 6,
  },
  cardActionText: {
    fontSize: 12,
    fontWeight: '700',
  },
  osmAttributionBadge: {
    position: 'absolute',
    bottom: 8,
    left: 8,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: StyleSheet.hairlineWidth,
    zIndex: 10,
  },
  osmAttributionText: {
    fontSize: 9,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});
