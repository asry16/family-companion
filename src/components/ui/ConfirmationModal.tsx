import React from 'react';
import { View, Text, StyleSheet, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppTheme } from '@/context/ThemeContext';
import { PrimaryButton } from './PrimaryButton';
import { SecondaryButton } from './SecondaryButton';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  iconName?: keyof typeof Ionicons.glyphMap;
  variant?: 'brand' | 'green' | 'red';
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  description,
  confirmLabel = 'Yes, Proceed',
  cancelLabel = 'Cancel',
  iconName = 'help-circle-outline',
  variant = 'brand',
  onConfirm,
  onCancel,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <Pressable
        style={[
          styles.overlay,
          {
            backgroundColor: isDark
              ? 'rgba(7, 13, 43, 0.78)'
              : 'rgba(31, 27, 109, 0.45)',
          },
        ]}
        onPress={onCancel}>
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: isDark
                ? 'rgba(20, 27, 74, 0.94)'
                : 'rgba(255, 255, 255, 0.94)',
              borderColor: isDark
                ? 'rgba(130, 140, 255, 0.25)'
                : 'rgba(124, 92, 224, 0.18)',
              shadowColor: isDark ? 'rgba(0, 0, 10, 0.50)' : '#6E5ADC',
            },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor:
                  variant === 'red'
                    ? isDark
                      ? 'rgba(255, 77, 122, 0.18)'
                      : 'rgba(225, 29, 72, 0.10)'
                    : variant === 'green'
                    ? isDark
                      ? 'rgba(45, 212, 191, 0.18)'
                      : 'rgba(46, 191, 142, 0.10)'
                    : isDark
                    ? 'rgba(139, 124, 246, 0.18)'
                    : 'rgba(124, 92, 224, 0.10)',
                borderColor:
                  variant === 'red'
                    ? isDark
                      ? 'rgba(255, 77, 122, 0.40)'
                      : 'rgba(225, 29, 72, 0.25)'
                    : variant === 'green'
                    ? isDark
                      ? 'rgba(45, 212, 191, 0.40)'
                      : 'rgba(46, 191, 142, 0.25)'
                    : isDark
                    ? 'rgba(139, 124, 246, 0.40)'
                    : 'rgba(124, 92, 224, 0.22)',
              },
            ]}>
            <Ionicons
              name={iconName}
              size={32}
              color={
                variant === 'red'
                  ? colors.red
                  : variant === 'green'
                  ? colors.green
                  : isDark
                  ? '#8B7CF6'
                  : colors.blue
              }
            />
          </View>

          <Text
            style={[
              styles.title,
              {
                color: colors.text,
                fontSize: isElderly ? 24 : 19,
              },
            ]}>
            {title}
          </Text>

          <Text
            style={[
              styles.description,
              {
                color: isDark ? colors.textMuted : colors.textSecondary,
                fontSize: isElderly ? 18 : 14.5,
              },
            ]}>
            {description}
          </Text>

          <View style={styles.buttonStack}>
            <PrimaryButton
              label={confirmLabel}
              onPress={onConfirm}
              variant={variant}
              size={isElderly ? 'elderly' : 'normal'}
            />
            <SecondaryButton
              label={cancelLabel}
              onPress={onCancel}
              size={isElderly ? 'elderly' : 'normal'}
            />
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 28,
    padding: 26,
    borderWidth: 1,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.35,
    shadowRadius: 28,
    elevation: 10,
  },
  iconWrapper: {
    width: 68,
    height: 68,
    borderRadius: 34,
    borderWidth: 1.5,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
    letterSpacing: -0.3,
  },
  description: {
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonStack: {
    width: '100%',
    gap: 12,
  },
});
