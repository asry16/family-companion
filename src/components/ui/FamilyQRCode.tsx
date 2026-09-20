import React, { useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  Share,
  Platform,
} from 'react-native';
import QRCode from 'qrcode';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';

interface FamilyQRCodeProps {
  familyCode: string;
  familyName: string;
  size?: number;
  onCopied?: () => void;
}

export const FamilyQRCode: React.FC<FamilyQRCodeProps> = ({
  familyCode,
  familyName,
  size = 220,
  onCopied,
}) => {
  const { colors, isDark, isElderly } = useAppTheme();

  // Generate QR Matrix
  const qrGrid = useMemo(() => {
    try {
      const payload = `kinly://join?code=${encodeURIComponent(familyCode)}&family=${encodeURIComponent(familyName)}`;
      const qr = QRCode.create(payload, { errorCorrectionLevel: 'M' });
      const moduleCount = qr.modules.size;
      const matrix: boolean[][] = [];

      for (let r = 0; r < moduleCount; r++) {
        const row: boolean[] = [];
        for (let c = 0; c < moduleCount; c++) {
          row.push(Boolean(qr.modules.get(r, c)));
        }
        matrix.push(row);
      }
      return matrix;
    } catch {
      return [];
    }
  }, [familyCode, familyName]);

  const moduleSize = qrGrid.length > 0 ? size / qrGrid.length : 8;

  const triggerHaptic = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch {}
    }
  };

  const handleCopyCode = async () => {
    triggerHaptic();
    try {
      if (Platform.OS === 'web' && navigator.clipboard) {
        await navigator.clipboard.writeText(familyCode);
      }
      onCopied?.();
    } catch {}
  };

  const handleShare = async () => {
    triggerHaptic();
    try {
      await Share.share({
        title: `Join our family on Kinly!`,
        message: `Join our family space "${familyName}" on Kinly using family code: ${familyCode}\n\nDownload Kinly FamilyOS to stay in sync!`,
      });
    } catch {}
  };

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: isDark ? 'rgba(20, 27, 74, 0.95)' : colors.cardBackground,
          borderColor: isDark ? 'rgba(130, 140, 255, 0.25)' : colors.border,
        },
      ]}>
      {/* Header Info */}
      <View style={styles.headerBlock}>
        <View
          style={[
            styles.emblemBadge,
            { backgroundColor: isDark ? 'rgba(139, 124, 246, 0.18)' : colors.brandAccent + '15' },
          ]}>
          <Ionicons name="qr-code" size={20} color={colors.brandAccent} />
        </View>
        <Text style={[styles.title, { color: colors.text }]}>
          {familyName}
        </Text>
        <Text style={[styles.subtitle, { color: isDark ? colors.textTertiary : colors.textSecondary }]}>
          Scan this QR code with another device to join this family circle.
        </Text>
      </View>

      {/* QR Code Container (Always crisp white background for optical scanning reliability) */}
      <View style={styles.qrOuterCard}>
        <View style={[styles.qrMatrixFrame, { width: size + 24, height: size + 24 }]}>
          {qrGrid.map((row, rIdx) => (
            <View key={`r_${rIdx}`} style={{ flexDirection: 'row', height: moduleSize }}>
              {row.map((cell, cIdx) => (
                <View
                  key={`c_${rIdx}_${cIdx}`}
                  style={{
                    width: moduleSize,
                    height: moduleSize,
                    backgroundColor: cell ? '#0F172A' : '#FFFFFF',
                  }}
                />
              ))}
            </View>
          ))}

          {/* Center Brand Jewel */}
          <View style={styles.centerJewelWrap}>
            <View style={[styles.centerJewel, { backgroundColor: colors.brandAccent }]}>
              <Ionicons name="people" size={14} color="#FFFFFF" />
            </View>
          </View>
        </View>
      </View>

      {/* Code Display Chip */}
      <View
        style={[
          styles.codePill,
          {
            backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : colors.borderSubtle,
            borderColor: isDark ? 'rgba(140, 150, 255, 0.25)' : colors.border,
          },
        ]}>
        <Text style={[styles.codeLabel, { color: isDark ? colors.textTertiary : colors.textSecondary }]}>
          FAMILY CODE
        </Text>
        <Text style={[styles.codeValue, { color: colors.text }]}>
          {familyCode}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionsRow}>
        <Pressable
          onPress={handleCopyCode}
          style={({ pressed }) => [
            styles.actionButton,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.03)' : colors.borderSubtle,
              borderColor: isDark ? 'rgba(139, 124, 246, 0.50)' : colors.border,
              opacity: pressed ? 0.75 : 1,
            },
          ]}>
          <Ionicons name="copy-outline" size={16} color={isDark ? '#8B7CF6' : colors.text} />
          <Text style={[styles.actionText, { color: isDark ? '#8B7CF6' : colors.text }]}>
            Copy Code
          </Text>
        </Pressable>

        <Pressable
          onPress={handleShare}
          style={({ pressed }) => [
            styles.actionButton,
            styles.shareActionButton,
            {
              backgroundColor: colors.brandAccent,
              borderColor: colors.brandAccent,
              opacity: pressed ? 0.85 : 1,
            },
          ]}>
          <Ionicons name="share-social-outline" size={16} color={colors.buttonTextOnAccent} />
          <Text style={[styles.actionText, { color: colors.buttonTextOnAccent }]}>
            Share Invite
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 24,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: 'center',
    gap: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  headerBlock: {
    alignItems: 'center',
    gap: 6,
  },
  emblemBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 16,
  },
  qrOuterCard: {
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
  },
  qrMatrixFrame: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  centerJewelWrap: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerJewel: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  codePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 9999,
    borderWidth: 1,
  },
  codeLabel: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  codeValue: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 9999,
    borderWidth: 1,
    gap: 8,
  },
  shareActionButton: {
    borderWidth: 0,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '700',
  },
});
