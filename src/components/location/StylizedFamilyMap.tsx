import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { FamilyPlace, SharingDuration } from '@/types';
import { FamilyAvatar } from '@/components/ui/FamilyAvatar';

export const StylizedFamilyMap: React.FC = () => {
  const { colors, isDark, isElderly } = useAppTheme();
  const { places, members, activeUser, checkIn, updateLocationSharing } = useFamily();
  const [selectedPlace, setSelectedPlace] = useState<FamilyPlace | null>(places[0]);

  const handleSelectPlace = (place: FamilyPlace) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    setSelectedPlace(place);
  };

  const handleCheckIn = (placeId: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch (e) {}
    }
    checkIn(activeUser.id, placeId);
  };

  const handleDurationChange = (duration: SharingDuration) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }
    updateLocationSharing(activeUser.id, duration);
  };

  const durations: Array<{ id: SharingDuration; label: string }> = [
    { id: '1h', label: '1 Hour' },
    { id: 'tonight', label: 'Until Tonight' },
    { id: 'always', label: 'Always' },
    { id: 'off', label: 'Off' },
  ];

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: colors.cardBackground,
          borderColor: colors.border,
        },
      ]}>
      {/* Map Header & Opt-In Controls */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Ionicons name="navigate-circle" size={22} color={colors.brandAccent} />
          <View>
            <Text
              style={[
                styles.headerTitle,
                { color: colors.text, fontSize: isElderly ? 18 : 15 },
              ]}>
              Privacy-First Family Places
            </Text>
            <Text
              style={[
                styles.headerSub,
                { color: colors.textSecondary, fontSize: isElderly ? 14 : 12 },
              ]}>
              Your location is {activeUser.isSharingLocation ? 'shared' : 'private'} ({activeUser.sharingDuration})
            </Text>
          </View>
        </View>
      </View>

      {/* Duration Control Pills */}
      <View style={styles.durationRow}>
        {durations.map((d) => {
          const isSelected = activeUser.sharingDuration === d.id;
          return (
            <Pressable
              key={d.id}
              onPress={() => handleDurationChange(d.id)}
              style={({ pressed }) => [
                styles.durationPill,
                {
                  backgroundColor: isSelected ? colors.brandAccent : isDark ? 'rgba(255, 255, 255, 0.03)' : colors.separator,
                  borderColor: isSelected ? colors.brandAccent : isDark ? 'rgba(130, 140, 255, 0.22)' : colors.border,
                  opacity: pressed ? 0.75 : 1,
                },
              ]}>
              <Text
                style={[
                  styles.durationPillText,
                  {
                    color: isSelected ? '#FFFFFF' : colors.textSecondary,
                    fontSize: isElderly ? 14 : 12,
                  },
                ]}>
                {d.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* Interactive Stylized Vector Canvas */}
      <View
        style={[
          styles.mapCanvas,
          {
            backgroundColor: isDark ? '#141A4A' : isElderly ? '#1E293B' : '#F1F5F9',
            borderColor: colors.borderSubtle,
          },
        ]}>
        {/* Subtle decorative gridlines */}
        <View style={styles.gridLineHorizontal1} />
        <View style={styles.gridLineHorizontal2} />
        <View style={styles.gridLineVertical1} />
        <View style={styles.gridLineVertical2} />

        {/* Family Places Pins */}
        {places.map((place) => {
          const isSelected = selectedPlace?.id === place.id;
          const membersHere = members.filter(
            (m) => m.currentPlaceId === place.id && m.isSharingLocation
          );

          const posX = place?.coords?.x ?? 50;
          const posY = place?.coords?.y ?? 50;

          return (
            <Pressable
              key={place.id}
              onPress={() => handleSelectPlace(place)}
              style={[
                styles.placePin,
                {
                  left: `${posX}%`,
                  top: `${posY}%`,
                  backgroundColor: isSelected ? colors.brand : colors.cardBackground,
                  borderColor: isSelected ? colors.brandAccent : colors.border,
                  transform: [{ scale: isSelected ? 1.1 : 1 }],
                },
              ]}>
              <Text style={{ fontSize: 16 }}>{place.emoji}</Text>
              <Text
                style={[
                  styles.pinLabel,
                  {
                    color: isSelected ? '#FFFFFF' : colors.text,
                    fontSize: isElderly ? 12 : 10,
                  },
                ]}>
                {place.name}
              </Text>

              {membersHere.length > 0 && (
                <View style={styles.membersOverlap}>
                  {membersHere.map((m) => (
                    <FamilyAvatar
                      key={m.id}
                      member={m}
                      size="sm"
                      showStatus={false}
                      style={{ marginRight: -4 }}
                    />
                  ))}
                </View>
              )}
            </Pressable>
          );
        })}
      </View>

      {/* Selected Place Details Card */}
      {selectedPlace && (
        <View
          style={[
            styles.selectedPlaceBar,
            {
              backgroundColor: colors.separator,
              borderColor: colors.borderSubtle,
            },
          ]}>
          <View style={{ flex: 1 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <Text style={{ fontSize: 18 }}>{selectedPlace.emoji}</Text>
              <Text
                style={[
                  styles.selectedName,
                  { color: colors.text, fontSize: isElderly ? 18 : 15 },
                ]}>
                {selectedPlace.name}
              </Text>
            </View>
            <Text
              style={[
                styles.selectedAddress,
                { color: colors.textSecondary, fontSize: isElderly ? 14 : 12 },
              ]}>
              {selectedPlace.address}
            </Text>
          </View>

          <Pressable
            onPress={() => handleCheckIn(selectedPlace.id)}
            style={({ pressed }) => [
              styles.checkInButton,
              {
                backgroundColor: colors.brand,
                opacity: pressed ? 0.8 : 1,
              },
            ]}>
            <Ionicons name="checkmark-done" size={15} color="#FFFFFF" />
            <Text style={styles.checkInButtonText}>Check In</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 16,
    marginVertical: 8,
    gap: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  headerSub: {
    fontWeight: '500',
    marginTop: 1,
  },
  durationRow: {
    flexDirection: 'row',
    gap: 6,
  },
  durationPill: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  durationPillText: {
    fontWeight: '600',
  },
  mapCanvas: {
    height: 190,
    borderRadius: 16,
    borderWidth: 1,
    position: 'relative',
    overflow: 'hidden',
  },
  gridLineHorizontal1: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '33%',
    height: 1,
    backgroundColor: 'rgba(203, 213, 225, 0.4)',
  },
  gridLineHorizontal2: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: '66%',
    height: 1,
    backgroundColor: 'rgba(203, 213, 225, 0.4)',
  },
  gridLineVertical1: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '35%',
    width: 1,
    backgroundColor: 'rgba(203, 213, 225, 0.4)',
  },
  gridLineVertical2: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    left: '68%',
    width: 1,
    backgroundColor: 'rgba(203, 213, 225, 0.4)',
  },
  placePin: {
    position: 'absolute',
    paddingVertical: 4,
    paddingHorizontal: 7,
    borderRadius: 12,
    borderWidth: 1.5,
    alignItems: 'center',
    flexDirection: 'row',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pinLabel: {
    fontWeight: '700',
  },
  membersOverlap: {
    flexDirection: 'row',
    marginLeft: 4,
  },
  selectedPlaceBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    gap: 10,
  },
  selectedName: {
    fontWeight: '700',
  },
  selectedAddress: {
    fontWeight: '500',
    marginTop: 2,
  },
  checkInButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    gap: 5,
  },
  checkInButtonText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
});
