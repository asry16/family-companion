import React from 'react';
import { View, Text, StyleSheet, Pressable, Platform, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as DocumentPicker from 'expo-document-picker';
import { useAppTheme } from '@/context/ThemeContext';
import { MemoryItem } from '@/types';

interface VaultActionsBarProps {
  onAddDetails: () => void;
  onScanPress?: () => void;
  onAddFiles: (item: Omit<MemoryItem, 'id'>) => void;
}

// Reference-matched action definitions (Scan removed per user request)
const ACTIONS = [
  {
    id: 'files',
    icon: 'folder-open-outline' as const,
    label: 'Add from Files',
    subtitle: 'PDF, images & documents',
    lightIconColor: '#7C5CE0',
    darkIconColor:  '#8B7CF6',
    lightBg:   'rgba(124,92,224,0.12)',
    darkBg:    'rgba(139,124,246,0.18)',
    lightBorder: 'rgba(124,92,224,0.22)',
    darkBorder:  'rgba(139,124,246,0.35)',
    fullWidth: true,
  },
  {
    id: 'details',
    icon: 'create-outline' as const,
    label: 'Save Details',
    subtitle: 'Location & notes',
    lightIconColor: '#16A34A',
    darkIconColor:  '#4ADE80',
    lightBg:   'rgba(22,163,74,0.12)',
    darkBg:    'rgba(74,222,128,0.18)',
    lightBorder: 'rgba(22,163,74,0.20)',
    darkBorder:  'rgba(74,222,128,0.32)',
    fullWidth: false,
  },
  {
    id: 'star',
    icon: 'star-outline' as const,
    label: 'Star Important',
    subtitle: 'Shared with family',
    lightIconColor: '#D97706',
    darkIconColor:  '#FBBF24',
    lightBg:   'rgba(217,119,6,0.12)',
    darkBg:    'rgba(251,191,36,0.18)',
    lightBorder: 'rgba(217,119,6,0.22)',
    darkBorder:  'rgba(251,191,36,0.32)',
    fullWidth: false,
  },
] as const;

export const VaultActionsBar: React.FC<VaultActionsBarProps> = ({
  onAddDetails, onScanPress, onAddFiles,
}) => {
  const { colors, isDark } = useAppTheme();

  const tap = (fn: () => void, s = Haptics.ImpactFeedbackStyle.Medium) => {
    if (Platform.OS !== 'web') { try { Haptics.impactAsync(s); } catch (_) {} }
    fn();
  };

  const handleFiles = async () => {
    tap(() => {});
    if (Platform.OS === 'web') {
      Alert.alert('Not available', 'Use the mobile app to pick files.');
      return;
    }
    try {
      const res = await DocumentPicker.getDocumentAsync({ copyToCacheDirectory: true });
      if (!res.canceled && res.assets?.length) {
        const a = res.assets[0];
        const ext = (a.name?.split('.').pop() || '').toLowerCase();
        const fileType: MemoryItem['fileType'] =
          ext === 'pdf' ? 'pdf' : ['jpg','jpeg','png','gif','webp'].includes(ext) ? 'image' : 'other';
        onAddFiles({
          title: a.name || 'Uploaded File',
          category: 'documents',
          savedLocation: 'Family Vault — Files',
          lastVerified: 'Just now',
          notes: 'File uploaded from device',
          tags: ['file', fileType],
          relatedMemberIds: [],
          emoji: fileType === 'pdf' ? '📄' : fileType === 'image' ? '🖼️' : '📁',
          fileUri: a.uri, fileType, fileName: a.name,
        });
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (_) {}
      }
    } catch (_) {}
  };

  const handleStar = () => {
    Alert.alert('⭐ Star Important Items',
      'Tap the ☆ star icon on any saved item to mark it important. Starred items appear at the top for everyone in your family.',
      [{ text: 'Got it' }]);
  };

  const handlePress = (id: string) => {
    switch (id) {
      case 'files':   handleFiles(); break;
      case 'scan':    if (onScanPress) tap(onScanPress); break;
      case 'details': tap(onAddDetails); break;
      case 'star':    handleStar(); break;
    }
  };

  // Glass card bg and border tokens
  const cardBg = isDark ? 'rgba(20, 27, 74, 0.76)' : 'rgba(255, 255, 255, 0.78)';
  const cardBorder = isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.15)';

  return (
    <View style={styles.wrapper}>
      <View style={styles.grid}>
        {ACTIONS.map((a) => {
          const iconColor = isDark ? a.darkIconColor : a.lightIconColor;
          const boxBg     = isDark ? a.darkBg : a.lightBg;
          const boxBorder = isDark ? a.darkBorder : a.lightBorder;

          return (
            <Pressable
              key={a.id}
              onPress={() => handlePress(a.id)}
              style={({ pressed }) => [
                styles.card,
                a.fullWidth ? { width: '100%' } : { width: '48.2%' },
                {
                  backgroundColor: cardBg,
                  borderColor: cardBorder,
                  opacity: pressed ? 0.84 : 1,
                  transform: [{ scale: pressed ? 0.975 : 1 }],
                  shadowColor: isDark ? 'rgba(0, 0, 10, 0.35)' : '#6E5ADC',
                },
              ]}>
              {/* Colored rounded-square icon box */}
              <View style={[styles.iconBox, { backgroundColor: boxBg, borderColor: boxBorder }]}>
                <Ionicons name={a.icon} size={20} color={iconColor} />
              </View>

              {/* Text */}
              <View style={styles.textCol}>
                <Text numberOfLines={1} style={[styles.label, { color: colors.text }]}>
                  {a.label}
                </Text>
                <Text numberOfLines={1} style={[styles.sublabel, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
                  {a.subtitle}
                </Text>
              </View>

              {/* Chevron */}
              <Ionicons name="chevron-forward" size={15} color={isDark ? colors.textTertiary : '#7A7DB0'} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: { paddingHorizontal: 16, marginTop: 4, marginBottom: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 13,
    borderRadius: 20,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 10,
    elevation: 3,
  },
  iconBox: {
    width: 42, height: 42,
    borderRadius: 13,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textCol: { flex: 1, gap: 2 },
  label:    { fontSize: 13, fontWeight: '700', letterSpacing: -0.2 },
  sublabel: { fontSize: 11, fontWeight: '500' },
});
