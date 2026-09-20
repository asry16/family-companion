import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Switch,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { GlassCard } from '@/components/ui/GlassCard';

export const SettingsPrivacySection: React.FC = () => {
  const { colors, isDark, isElderly } = useAppTheme();
  const accentViolet = isDark ? '#8B7CF6' : colors.purple;

  const [ghostMode, setGhostMode] = useState(false);
  const [preciseLocation, setPreciseLocation] = useState(true);
  const [geofenceAlerts, setGeofenceAlerts] = useState(true);
  const [batterySharing, setBatterySharing] = useState(true);

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Light) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(style);
      } catch (e) {}
    }
  };

  const handleGhostModeToggle = (value: boolean) => {
    triggerHaptic(Haptics.ImpactFeedbackStyle.Medium);
    setGhostMode(value);
    if (value) {
      Alert.alert(
        'Ghost Mode Enabled',
        'Your live location is temporarily frozen for all family circle members until disabled.',
        [{ text: 'Got it' }]
      );
    }
  };

  return (
    <GlassCard
      borderRadius={26}
      style={styles.cardWrapper}
      contentStyle={styles.cardContent}>
      
      {/* Header */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeftCol}>
          <View style={styles.titleWithIcon}>
            <Ionicons
              name="shield-checkmark-sharp"
              size={18}
              color={accentViolet}
            />
            <Text
              style={[
                styles.mainTitle,
                { color: colors.text, fontSize: isElderly ? 17 : 14.5 },
              ]}>
              FAMILY PLACES & PRIVACY CONTROLS
            </Text>
          </View>
          <Text
            style={[
              styles.subtitle,
              { color: isDark ? colors.textMuted : colors.textSecondary },
            ]}>
            Manage geofencing, location sharing, and security safeguards
          </Text>
        </View>
      </View>

      {/* Places Preview Pills */}
      <View style={styles.placesContainer}>
        <Text style={[styles.sectionLabel, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
          SAVED PLACES
        </Text>
        <View style={styles.placesRow}>
          <View
            style={[
              styles.placePill,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(20, 32, 58, 0.04)',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.20)',
              },
            ]}>
            <Ionicons name="home" size={14} color={colors.green} />
            <Text style={[styles.placePillText, { color: colors.text }]}>Home (150m)</Text>
          </View>
          <View
            style={[
              styles.placePill,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(20, 32, 58, 0.04)',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.20)',
              },
            ]}>
            <Ionicons name="briefcase" size={14} color={colors.blue} />
            <Text style={[styles.placePillText, { color: colors.text }]}>Work Office (200m)</Text>
          </View>
          <View
            style={[
              styles.placePill,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(20, 32, 58, 0.04)',
                borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.20)',
              },
            ]}>
            <Ionicons name="school" size={14} color={colors.purple} />
            <Text style={[styles.placePillText, { color: colors.text }]}>School (100m)</Text>
          </View>
        </View>
      </View>

      {/* Privacy Toggles */}
      <View style={styles.controlsStack}>
        {/* Ghost Mode */}
        <View
          style={[
            styles.toggleRow,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(20, 32, 58, 0.02)',
              borderColor: isDark ? 'rgba(130, 140, 255, 0.16)' : 'rgba(124, 92, 224, 0.12)',
            },
          ]}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(139, 124, 246, 0.15)' : 'rgba(124, 92, 224, 0.10)' }]}>
            <Ionicons name="eye-off" size={16} color={accentViolet} />
          </View>
          <View style={styles.toggleTextCol}>
            <Text style={[styles.toggleTitle, { color: colors.text }]}>Ghost Mode</Text>
            <Text style={[styles.toggleSubtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
              Pause live location updates temporarily
            </Text>
          </View>
          <Switch
            value={ghostMode}
            onValueChange={handleGhostModeToggle}
            trackColor={{ false: isDark ? '#2A3060' : '#D1D5DB', true: '#1E3A8A' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Precise Location */}
        <View
          style={[
            styles.toggleRow,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(20, 32, 58, 0.02)',
              borderColor: isDark ? 'rgba(130, 140, 255, 0.16)' : 'rgba(124, 92, 224, 0.12)',
            },
          ]}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(30, 58, 138, 0.25)' : 'rgba(30, 58, 138, 0.12)' }]}>
            <Ionicons name="locate" size={16} color={isDark ? '#60A5FA' : '#1E3A8A'} />
          </View>
          <View style={styles.toggleTextCol}>
            <Text style={[styles.toggleTitle, { color: colors.text }]}>Precise GPS</Text>
            <Text style={[styles.toggleSubtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
              {preciseLocation ? 'High-accuracy real-time GPS coordinates' : 'Approximate neighborhood level'}
            </Text>
          </View>
          <Switch
            value={preciseLocation}
            onValueChange={(val) => {
              triggerHaptic();
              setPreciseLocation(val);
            }}
            trackColor={{ false: isDark ? '#2A3060' : '#D1D5DB', true: '#1E3A8A' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Geofence Arrival / Departure Alerts */}
        <View
          style={[
            styles.toggleRow,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(20, 32, 58, 0.02)',
              borderColor: isDark ? 'rgba(130, 140, 255, 0.16)' : 'rgba(124, 92, 224, 0.12)',
            },
          ]}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(30, 58, 138, 0.25)' : 'rgba(30, 58, 138, 0.12)' }]}>
            <Ionicons name="notifications" size={16} color={isDark ? '#60A5FA' : '#1E3A8A'} />
          </View>
          <View style={styles.toggleTextCol}>
            <Text style={[styles.toggleTitle, { color: colors.text }]}>Arrival & Departure Alerts</Text>
            <Text style={[styles.toggleSubtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
              Notify family when entering or leaving saved places
            </Text>
          </View>
          <Switch
            value={geofenceAlerts}
            onValueChange={(val) => {
              triggerHaptic();
              setGeofenceAlerts(val);
            }}
            trackColor={{ false: isDark ? '#2A3060' : '#D1D5DB', true: '#1E3A8A' }}
            thumbColor="#FFFFFF"
          />
        </View>

        {/* Battery & Activity Sharing */}
        <View
          style={[
            styles.toggleRow,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : 'rgba(20, 32, 58, 0.02)',
              borderColor: isDark ? 'rgba(130, 140, 255, 0.16)' : 'rgba(124, 92, 224, 0.12)',
            },
          ]}>
          <View style={[styles.iconCircle, { backgroundColor: isDark ? 'rgba(30, 58, 138, 0.25)' : 'rgba(30, 58, 138, 0.12)' }]}>
            <Ionicons name="battery-charging" size={16} color={isDark ? '#60A5FA' : '#1E3A8A'} />
          </View>
          <View style={styles.toggleTextCol}>
            <Text style={[styles.toggleTitle, { color: colors.text }]}>Battery & Sound Sharing</Text>
            <Text style={[styles.toggleSubtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
              Share device telemetry with family members
            </Text>
          </View>
          <Switch
            value={batterySharing}
            onValueChange={(val) => {
              triggerHaptic();
              setBatterySharing(val);
            }}
            trackColor={{ false: isDark ? '#2A3060' : '#D1D5DB', true: '#1E3A8A' }}
            thumbColor="#FFFFFF"
          />
        </View>
      </View>
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
    gap: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 8,
  },
  headerLeftCol: {
    flex: 1,
    gap: 3,
  },
  titleWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  mainTitle: {
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  subtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  placesContainer: {
    gap: 4,
  },
  placesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  placePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  placePillText: {
    fontSize: 12,
    fontWeight: '600',
  },
  controlsStack: {
    gap: 8,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 16,
    borderWidth: 1,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  toggleTextCol: {
    flex: 1,
    gap: 2,
  },
  toggleTitle: {
    fontWeight: '700',
    fontSize: 13.5,
    letterSpacing: -0.1,
  },
  toggleSubtitle: {
    fontSize: 11.5,
    fontWeight: '500',
  },
});
