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
  const { colors, isElderly } = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        <Pressable
          style={[
            styles.card,
            {
              backgroundColor: colors.cardBackground,
              borderColor: colors.border,
            },
          ]}
          onPress={(e) => e.stopPropagation()}>
          <View
            style={[
              styles.iconWrapper,
              {
                backgroundColor:
                  variant === 'red'
                    ? colors.redSoft
                    : variant === 'green'
                    ? colors.greenSoft
                    : colors.blueSoft,
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
                color: colors.textSecondary,
                fontSize: isElderly ? 18 : 15,
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
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    alignItems: 'center',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
    elevation: 10,
  },
  iconWrapper: {
    width: 64,
    height: 64,
    borderRadius: 32,
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
    gap: 10,
  },
});
