import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Platform,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { useAppTheme } from '@/context/ThemeContext';
import { MemoryItem } from '@/types';

interface VaultActionsBarProps {
  onAddDetails: () => void;
  onScanPress: () => void;
  onAddFiles: (item: Omit<MemoryItem, 'id'>) => void;
}

const ACTIONS = [
  {
    id: 'files',
    icon: 'folder-open-outline' as const,
    label: 'Add from Files',
    subtitle: 'PDF, images & docs',
    color: '#3B82F6',
    darkColor: '#60A5FA',
    bg: 'rgba(59,130,246,0.14)',
    darkBg: 'rgba(96,165,250,0.16)',
    border: 'rgba(59,130,246,0.25)',
    darkBorder: 'rgba(96,165,250,0.30)',
  },
  {
    id: 'scan',
    icon: 'scan-outline' as const,
    label: 'Scan Document',
    subtitle: 'Camera or gallery',
    color: '#7C5CE0',
    darkColor: '#A78BFA',
    bg: 'rgba(124,92,224,0.14)',
    darkBg: 'rgba(167,139,250,0.16)',
    border: 'rgba(124,92,224,0.25)',
    darkBorder: 'rgba(167,139,250,0.30)',
  },
  {
    id: 'details',
    icon: 'create-outline' as const,
    label: 'Save Details',
    subtitle: 'Location & notes',
    color: '#059669',
    darkColor: '#34D399',
    bg: 'rgba(16,185,129,0.14)',
    darkBg: 'rgba(52,211,153,0.16)',
    border: 'rgba(16,185,129,0.25)',
    darkBorder: 'rgba(52,211,153,0.30)',
  },
  {
    id: 'star',
    icon: 'star-outline' as const,
    label: 'Star Important',
    subtitle: 'Shared with family',
    color: '#D97706',
    darkColor: '#FBBF24',
    bg: 'rgba(217,119,6,0.14)',
    darkBg: 'rgba(251,191,36,0.16)',
    border: 'rgba(217,119,6,0.25)',
    darkBorder: 'rgba(251,191,36,0.30)',
  },
] as const;

export const VaultActionsBar: React.FC<VaultActionsBarProps> = ({
  onAddDetails,
  onScanPress,
  onAddFiles,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  const triggerHaptic = (style: Haptics.ImpactFeedbackStyle = Haptics.ImpactFeedbackStyle.Medium) => {
    if (Platform.OS !== 'web') {
      try { Haptics.impactAsync(style); } catch (e) {}
    }
  };

  const handleFilePicker = async () => {
    triggerHaptic();
    if (Platform.OS === 'web') {
      Alert.alert('File Picker', 'File picking is not available on web. Please use the mobile app.');
      return;
    }
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/*', 'application/msword', '*/*'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const asset = result.assets[0];
        const ext = asset.name?.split('.').pop()?.toLowerCase() || '';
        const fileType: MemoryItem['fileType'] =
          ext === 'pdf' ? 'pdf' :
          ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext) ? 'image' : 'other';

        onAddFiles({
          title: asset.name || 'Uploaded File',
          category: 'documents',
          savedLocation: 'Family Vault — Files',
          lastVerified: 'Just now',
          notes: `File uploaded from device`,
          tags: ['file', fileType, 'upload'],
          relatedMemberIds: [],
          emoji: fileType === 'pdf' ? '📄' : fileType === 'image' ? '🖼️' : '📁',
          fileUri: asset.uri,
          fileType,
          fileName: asset.name,
        });

        if (Platform.OS !== 'web') {
          try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
        }
      }
    } catch (err) {
      // Cancelled or permission denied — silent fail
    }
  };

  const handleStar = () => {
    triggerHaptic();
    Alert.alert(
      '⭐ Star Important Items',
      'Tap the star (☆) icon on any saved item below to mark it as important. Starred items appear at the top and are highlighted for all family members.',
      [{ text: 'Got it', style: 'default' }]
    );
  };

  const handlePress = (id: string) => {
    switch (id) {
      case 'files':
        handleFilePicker();
        break;
      case 'scan':
        triggerHaptic();
        onScanPress();
        break;
      case 'details':
        triggerHaptic();
        onAddDetails();
        break;
      case 'star':
        handleStar();
        break;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.grid}>
        {ACTIONS.map((action) => {
          const color = isDark ? action.darkColor : action.color;
          const bg = isDark ? action.darkBg : action.bg;
          const border = isDark ? action.darkBorder : action.border;

          return (
            <Pressable
              key={action.id}
              onPress={() => handlePress(action.id)}
              style={({ pressed }) => [
                styles.actionCard,
                {
                  backgroundColor: isDark ? colors.cardBackground : '#FFFFFF',
                  borderColor: isDark ? 'rgba(130,140,255,0.20)' : 'rgba(124,92,224,0.12)',
                  opacity: pressed ? 0.85 : 1,
                  transform: [{ scale: pressed ? 0.97 : 1 }],
                },
              ]}>
              {/* Icon Circle */}
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: bg, borderColor: border },
                ]}>
                <Ionicons name={action.icon} size={20} color={color} />
              </View>

              {/* Labels */}
              <View style={styles.labelStack}>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.actionLabel,
                    { color: colors.text, fontSize: isElderly ? 14 : 12.5 },
                  ]}>
                  {action.label}
                </Text>
                <Text
                  numberOfLines={1}
                  style={[
                    styles.actionSub,
                    { color: isDark ? colors.textMuted : colors.textSecondary },
                  ]}>
                  {action.subtitle}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    marginVertical: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  actionCard: {
    width: '48%',
    borderRadius: 20,
    borderWidth: 1.2,
    padding: 14,
    gap: 10,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  labelStack: {
    flex: 1,
    gap: 2,
  },
  actionLabel: {
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  actionSub: {
    fontSize: 11,
    fontWeight: '500',
  },
});
