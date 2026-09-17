import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useVoice } from '@/context/VoiceContext';
import { DocumentCard } from '@/components/cards/DocumentCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { initialDocuments } from '@/data/mockFamilyData';

export default function ScanDocumentModal() {
  const router = useRouter();
  const { colors, isElderly } = useAppTheme();
  const { addDocument, executeDocumentAction } = useFamily();
  const { speak } = useVoice();

  const [isScanning, setIsScanning] = useState(false);
  const [scannedDoc, setScannedDoc] = useState<any | null>(null);

  const handleSimulateScan = (docPreset: any) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (e) {}
    }
    setIsScanning(true);
    setScannedDoc(null);

    setTimeout(() => {
      setIsScanning(false);
      setScannedDoc(docPreset);
      addDocument(docPreset);
      speak(`Document scanned. Extracted ${docPreset.title} for ${docPreset.currency || '₹'}${docPreset.amount || ''}`);
    }, 1200);
  };

  const handleAction = (actionId: string) => {
    if (scannedDoc) {
      executeDocumentAction(scannedDoc.id, actionId);
      speak('Action confirmed and synced to FamilyOS.');
      setTimeout(() => {
        router.back();
      }, 500);
    }
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Modal Navigation Bar */}
      <View
        style={[
          styles.navBar,
          {
            backgroundColor: colors.cardBackground,
            borderBottomColor: colors.borderSubtle,
          },
        ]}>
        <Text
          style={[
            styles.navTitle,
            { color: colors.text, fontSize: isElderly ? 22 : 17 },
          ]}>
          Scan Document or Bill
        </Text>
        <Pressable
          onPress={() => router.back()}
          hitSlop={12}
          style={styles.closeBtn}>
          <Ionicons name="close" size={24} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}>
        {/* Camera Viewfinder Simulator */}
        <View
          style={[
            styles.viewfinder,
            {
              backgroundColor: isElderly ? '#0F172A' : '#0B0F19',
              borderColor: colors.border,
            },
          ]}>
          {/* Target Corners */}
          <View style={[styles.corner, styles.cornerTL, { borderColor: colors.brandAccent }]} />
          <View style={[styles.corner, styles.cornerTR, { borderColor: colors.brandAccent }]} />
          <View style={[styles.corner, styles.cornerBL, { borderColor: colors.brandAccent }]} />
          <View style={[styles.corner, styles.cornerBR, { borderColor: colors.brandAccent }]} />

          {isScanning ? (
            <View style={styles.scanningState}>
              <View style={[styles.scanLine, { backgroundColor: colors.brandAccent }]} />
              <Ionicons name="sparkles" size={32} color={colors.brandAccent} />
              <Text style={styles.scanningText}>AI Optical Character Recognition...</Text>
              <Text style={styles.scanningSub}>Extracting amount, due dates & provider</Text>
            </View>
          ) : (
            <View style={styles.viewfinderCenter}>
              <Ionicons name="camera-outline" size={44} color="#94A3B8" />
              <Text style={styles.viewfinderHint}>
                Align bill, prescription, or receipt within frame
              </Text>
            </View>
          )}
        </View>

        {/* Preset Scan Triggers */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontSize: isElderly ? 18 : 14 },
          ]}>
          SIMULATE SAMPLE DOCUMENT OCR
        </Text>
        <View style={styles.presetButtonsRow}>
          <Pressable
            onPress={() => handleSimulateScan(initialDocuments[0])}
            style={({ pressed }) => [
              styles.presetBtn,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Text style={{ fontSize: 20 }}>💡</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.presetTitle, { color: colors.text }]}>
                Electricity Bill
              </Text>
              <Text style={[styles.presetSub, { color: colors.textSecondary }]}>
                ₹2,340 • Due 25 Sep
              </Text>
            </View>
            <Ionicons name="scan" size={16} color={colors.brandAccent} />
          </Pressable>

          <Pressable
            onPress={() => handleSimulateScan(initialDocuments[1])}
            style={({ pressed }) => [
              styles.presetBtn,
              {
                backgroundColor: colors.cardBackground,
                borderColor: colors.border,
                opacity: pressed ? 0.75 : 1,
              },
            ]}>
            <Text style={{ fontSize: 20 }}>🩺</Text>
            <View style={{ flex: 1 }}>
              <Text style={[styles.presetTitle, { color: colors.text }]}>
                Doctor Prescription
              </Text>
              <Text style={[styles.presetSub, { color: colors.textSecondary }]}>
                Cardiology • Max Healthcare
              </Text>
            </View>
            <Ionicons name="scan" size={16} color={colors.brandAccent} />
          </Pressable>
        </View>

        {/* Extracted Document Preview with 1-Tap Actions */}
        {scannedDoc && (
          <View style={styles.extractedSection}>
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
              <Text style={styles.successText}>AI Extraction Complete</Text>
            </View>
            <DocumentCard
              document={scannedDoc}
              onActionPress={handleAction}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  navTitle: {
    fontWeight: '700',
  },
  closeBtn: {
    padding: 4,
  },
  content: {
    padding: 20,
    gap: 16,
    paddingBottom: 40,
  },
  viewfinder: {
    height: 220,
    borderRadius: 20,
    borderWidth: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  corner: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderWidth: 3,
  },
  cornerTL: { top: 16, left: 16, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 16, right: 16, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 16, left: 16, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 16, right: 16, borderLeftWidth: 0, borderTopWidth: 0 },
  viewfinderCenter: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 30,
  },
  viewfinderHint: {
    color: '#94A3B8',
    textAlign: 'center',
    fontSize: 13,
    fontWeight: '500',
  },
  scanningState: {
    alignItems: 'center',
    gap: 8,
  },
  scanLine: {
    width: 160,
    height: 2,
    borderRadius: 1,
    marginBottom: 10,
  },
  scanningText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  scanningSub: {
    color: '#94A3B8',
    fontSize: 12,
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: 0.5,
    marginTop: 4,
  },
  presetButtonsRow: {
    gap: 10,
  },
  presetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 16,
    borderWidth: 1,
    gap: 12,
  },
  presetTitle: {
    fontWeight: '700',
    fontSize: 15,
  },
  presetSub: {
    fontSize: 12,
    marginTop: 2,
  },
  extractedSection: {
    gap: 10,
    marginTop: 8,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    alignSelf: 'flex-start',
  },
  successText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 13,
  },
});
