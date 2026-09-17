import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';

import {
  PasswordCriteria,
  evaluatePasswordCriteria,
  evaluatePasswordStrength,
} from '@/utils/passwordStrength';

export {
  PasswordCriteria,
  evaluatePasswordCriteria,
  evaluatePasswordStrength,
};

interface PasswordStrengthMeterProps {
  password: string;
}

export const PasswordStrengthMeter: React.FC<PasswordStrengthMeterProps> = ({ password }) => {
  const { colors, isElderly } = useAppTheme();

  const criteria = useMemo(() => evaluatePasswordCriteria(password), [password]);

  const { score, label, color, bgColor } = useMemo(() => {
    if (!password) {
      return {
        score: 0,
        label: 'Required',
        color: colors.textMuted,
        bgColor: colors.separator,
      };
    }

    let count = 0;
    if (criteria.hasMinLength) count++;
    if (criteria.hasLower) count++;
    if (criteria.hasUpper) count++;
    if (criteria.hasNumber) count++;
    if (criteria.hasSpecial) count++;

    if (count <= 2) {
      return { score: 1, label: 'Weak', color: colors.red, bgColor: colors.redSoft };
    }
    if (count === 3) {
      return { score: 2, label: 'Fair', color: colors.yellow, bgColor: colors.yellowSoft };
    }
    if (count === 4) {
      return { score: 3, label: 'Good', color: colors.blue, bgColor: colors.blueSoft };
    }
    return { score: 4, label: 'Strong', color: colors.green, bgColor: colors.greenSoft };
  }, [password, criteria, colors]);

  if (!password) return null;

  return (
    <View style={styles.container}>
      {/* Sleek Header with 4-Segment Bar and Status Pill */}
      <View style={styles.topRow}>
        <View style={styles.barSegmentsRow}>
          {[1, 2, 3, 4].map((seg) => {
            const filled = score >= seg;
            return (
              <View
                key={seg}
                style={[
                  styles.segment,
                  {
                    backgroundColor: filled ? color : colors.border,
                  },
                ]}
              />
            );
          })}
        </View>

        <View
          style={[
            styles.statusPill,
            { backgroundColor: bgColor, borderColor: color },
          ]}>
          <Text
            style={[
              styles.statusPillText,
              { color, fontSize: isElderly ? 13 : 11 },
            ]}>
            {label}
          </Text>
        </View>
      </View>

      {/* Minimalist Micro-Check Badges in a Row */}
      <View style={styles.criteriaGrid}>
        <CriterionChip
          label="8+ chars"
          met={criteria.hasMinLength}
          colors={colors}
        />
        <CriterionChip
          label="Aa letters"
          met={criteria.hasUpper && criteria.hasLower}
          colors={colors}
        />
        <CriterionChip
          label="123 number"
          met={criteria.hasNumber}
          colors={colors}
        />
        <CriterionChip
          label="#$! symbol"
          met={criteria.hasSpecial}
          colors={colors}
        />
      </View>
    </View>
  );
};

const CriterionChip: React.FC<{
  label: string;
  met: boolean;
  colors: any;
}> = ({ label, met, colors }) => {
  return (
    <View
      style={[
        styles.chip,
        {
          backgroundColor: met ? colors.greenSoft : colors.separator,
          borderColor: met ? colors.greenBorder : 'transparent',
        },
      ]}>
      <Ionicons
        name={met ? 'checkmark-circle' : 'ellipse-outline'}
        size={11}
        color={met ? colors.green : colors.textMuted}
      />
      <Text
        style={[
          styles.chipText,
          {
            color: met ? colors.text : colors.textMuted,
            fontWeight: met ? '600' : '500',
          },
        ]}>
        {label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 8,
    marginTop: 6,
    marginBottom: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  barSegmentsRow: {
    flex: 1,
    flexDirection: 'row',
    gap: 5,
    height: 4,
  },
  segment: {
    flex: 1,
    height: '100%',
    borderRadius: 2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusPillText: {
    fontWeight: '700',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  },
  criteriaGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 0.5,
  },
  chipText: {
    fontSize: 11,
  },
});
