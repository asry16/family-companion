import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Linking,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { FamilyMember } from '@/types';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';

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

  // Map mode: 'live' or 'places'
  const [mapStyle, setMapStyle] = useState<'streets' | 'satellite'>('streets');

  // Simulated live pulse animation state
  const [pulseTick, setPulseTick] = useState(0);

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
              {members.length} members broadcasting live GPS & telemetry
            </Text>
          </View>
        </View>

        <Pressable
          onPress={() => {
            triggerHaptic(Haptics.ImpactFeedbackStyle.Light);
            setMapStyle(mapStyle === 'streets' ? 'satellite' : 'streets');
          }}
          style={[
            styles.mapStyleToggle,
            { backgroundColor: colors.separator, borderColor: colors.border },
          ]}>
          <Ionicons
            name={mapStyle === 'streets' ? 'layers-outline' : 'map-outline'}
            size={13}
            color={colors.textSecondary}
          />
          <Text style={[styles.mapStyleText, { color: colors.textSecondary }]}>
            {mapStyle === 'streets' ? 'Vector' : 'Satellite'}
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
                  ? isDark
                    ? '#38BDF8'
                    : colors.brandAccent
                  : colors.separator,
                borderColor: !selectedMemberId
                  ? isDark
                    ? '#38BDF8'
                    : colors.brandAccent
                  : colors.border,
              },
            ]}>
            <Text
              style={[
                styles.filterPillText,
                {
                  color: !selectedMemberId
                    ? isDark
                      ? '#000000'
                      : '#FFFFFF'
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
                      ? isDark
                        ? '#38BDF8'
                        : colors.brandAccent
                      : colors.separator,
                    borderColor: isFocused
                      ? isDark
                        ? '#38BDF8'
                        : colors.brandAccent
                      : colors.border,
                  },
                ]}>
                <View
                  style={[
                    styles.miniBatteryDot,
                    {
                      backgroundColor:
                        isFocused && isDark
                          ? '#000000'
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
                        ? isDark
                          ? '#000000'
                          : '#FFFFFF'
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
        style={[
          styles.canvas,
          {
            backgroundColor:
              mapStyle === 'satellite'
                ? '#0F172A'
                : isElderly
                ? '#1E293B'
                : '#F1F5F9',
            borderColor: colors.borderSubtle,
          },
        ]}>
        {/* Map Roads & Waterway Accents */}
        <View style={[styles.riverBand, { backgroundColor: mapStyle === 'satellite' ? '#1E293B' : '#E0F2FE' }]} />
        <View style={[styles.roadHorizontal, { backgroundColor: mapStyle === 'satellite' ? '#334155' : '#E2E8F0' }]} />
        <View style={[styles.roadVertical, { backgroundColor: mapStyle === 'satellite' ? '#334155' : '#E2E8F0' }]} />
        <View style={[styles.roadDiagonal, { backgroundColor: mapStyle === 'satellite' ? '#334155' : '#E2E8F0' }]} />
        <View style={[styles.parkPatch, { backgroundColor: mapStyle === 'satellite' ? 'rgba(16, 185, 129, 0.08)' : '#DCFCE7' }]} />

        {/* Live Pins for ALL Family Members */}
        {members.map((member, idx) => {
          const fallbackX = 50 + ((idx * 28 + 15) % 60) - 30;
          const fallbackY = 48 + ((idx * 34 + 10) % 50) - 25;
          const coordsX = member.coords?.x ?? fallbackX;
          const coordsY = member.coords?.y ?? fallbackY;
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
                  left: `${coordsX}%`,
                  top: `${coordsY}%`,
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
                      ? isDark
                        ? '#38BDF8'
                        : colors.brand
                      : colors.cardBackground,
                    borderColor: isSelected
                      ? isDark
                        ? '#38BDF8'
                        : colors.brandAccent
                      : colors.border,
                  },
                ]}>
                <View style={styles.pinBadgeTopRow}>
                  <Text
                    style={[
                      styles.pinName,
                      { color: isSelected ? (isDark ? '#000000' : '#FFFFFF') : colors.text },
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
                        ? isDark
                          ? '#000000'
                          : '#FFFFFF'
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
  riverBand: {
    position: 'absolute',
    top: '35%',
    left: 0,
    right: 0,
    height: 22,
    transform: [{ rotate: '-8deg' }],
  },
  roadHorizontal: {
    position: 'absolute',
    top: '55%',
    left: 0,
    right: 0,
    height: 6,
  },
  roadVertical: {
    position: 'absolute',
    left: '48%',
    top: 0,
    bottom: 0,
    width: 6,
  },
  roadDiagonal: {
    position: 'absolute',
    left: '20%',
    top: 0,
    bottom: 0,
    width: 4,
    transform: [{ rotate: '45deg' }],
  },
  parkPatch: {
    position: 'absolute',
    top: 15,
    left: 15,
    width: 80,
    height: 60,
    borderRadius: 12,
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
});
