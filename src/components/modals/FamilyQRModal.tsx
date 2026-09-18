import React from 'react';
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FamilyQRCode } from '@/components/ui/FamilyQRCode';
import { useAppTheme } from '@/context/ThemeContext';

interface FamilyQRModalProps {
  visible: boolean;
  familyCode: string;
  familyName: string;
  onClose: () => void;
}

export const FamilyQRModal: React.FC<FamilyQRModalProps> = ({
  visible,
  familyCode,
  familyName,
  onClose,
}) => {
  const { colors } = useAppTheme();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.modalBackdrop}>
        <Pressable style={styles.backdropPressable} onPress={onClose} />
        
        <View style={styles.contentWrap}>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={[styles.closeButton, { backgroundColor: colors.cardBackground, borderColor: colors.border }]}>
            <Ionicons name="close" size={20} color={colors.text} />
          </Pressable>

          <FamilyQRCode
            familyCode={familyCode}
            familyName={familyName}
            size={200}
          />
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  backdropPressable: {
    ...StyleSheet.absoluteFill,
  },
  contentWrap: {
    width: '100%',
    maxWidth: 380,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    top: -16,
    right: -10,
    zIndex: 10,
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
});
