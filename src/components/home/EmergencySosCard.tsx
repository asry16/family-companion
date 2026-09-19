import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppTheme } from '@/context/ThemeContext';
import { Button } from '@/components/ui';

interface EmergencySosCardProps {
  onTriggerSos: (reason: string, details: string) => void;
  onOpenSosModal?: () => void;
}

export const EmergencySosCard: React.FC<EmergencySosCardProps> = ({
  onTriggerSos,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();


  return (
    <LinearGradient
      colors={
        isDark
          ? ['rgba(240, 82, 77, 0.18)', 'rgba(120, 20, 30, 0.22)', 'rgba(15, 26, 58, 0.85)']
          : ['#FFEFF4', '#FFE6F0']
      }
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[
        styles.cardContainer,
        {
          borderColor: isDark ? 'rgba(240, 82, 77, 0.35)' : '#F9CFE0',
          shadowColor: isDark ? colors.red : '#FF4D7A',
        },
      ]}>
      <View style={styles.cardInnerRow}>
        {/* Left Content Column */}
        <View style={styles.leftCol}>
          {/* Header Row: Red Warning-Triangle Icon + "Need Help?" */}
          <View style={styles.titleRow}>
            <View style={[styles.triangleBadge, { backgroundColor: isDark ? 'rgba(240, 82, 77, 0.22)' : '#FFE4E6' }]}>
              <Ionicons name="warning" size={15} color={colors.red} />
            </View>
            <Text style={[styles.titleText, { color: isDark ? '#FFFFFF' : '#9F1239', fontSize: isElderly ? 20 : 17.5 }]}>
              Need Help?
            </Text>
          </View>

          {/* Subtitle */}
          <Text style={[styles.subtitleText, { color: isDark ? 'rgba(255, 255, 255, 0.75)' : '#E11D48' }]}>
            Hold for 2 seconds to alert your circle
          </Text>

          {/* Bottom Row of Small Icon Chips: GPS • 1m accuracy • Circle notified */}
          <View style={styles.bottomChipsRow}>
            <View style={styles.chipItem}>
              <Ionicons name="navigate" size={11} color={colors.red} />
              <Text style={[styles.chipText, { color: isDark ? '#FDA4AF' : '#9F1239' }]}>
                GPS
              </Text>
            </View>

            <Text style={[styles.dotSeparator, { color: isDark ? '#FDA4AF' : '#F472B6' }]}>•</Text>

            <View style={styles.chipItem}>
              <Ionicons name="locate" size={11} color={colors.red} />
              <Text style={[styles.chipText, { color: isDark ? '#FDA4AF' : '#9F1239' }]}>
                1m accuracy
              </Text>
            </View>

            <Text style={[styles.dotSeparator, { color: isDark ? '#FDA4AF' : '#F472B6' }]}>•</Text>

            <View style={styles.chipItem}>
              <Ionicons name="people" size={11} color={colors.red} />
              <Text style={[styles.chipText, { color: isDark ? '#FDA4AF' : '#9F1239' }]}>
                Circle notified
              </Text>
            </View>
          </View>
        </View>

        {/* Right Content Column: Large Circular "SOS" Button with Two Soft Concentric Glow Rings */}
        <View style={styles.sosButtonArea}>
          <Button
            variant="sos"
            title="SOS"
            onHoldComplete={() => {
              onTriggerSos('Urgent Emergency', '2s Hold-to-confirm triggered from Home Screen');
            }}
          />
        </View>

      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    borderRadius: 26,
    borderWidth: 1,
    padding: 16,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 4,
  },
  cardInnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  leftCol: {
    flex: 1,
    gap: 5,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  triangleBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  subtitleText: {
    fontSize: 12,
    fontWeight: '500',
    lineHeight: 16,
  },
  bottomChipsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 4,
    flexWrap: 'wrap',
  },
  chipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
  },
  chipText: {
    fontSize: 10.5,
    fontWeight: '600',
  },
  dotSeparator: {
    fontSize: 9,
  },

  // SOS button right area
  sosButtonArea: {
    width: 80,
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
});
