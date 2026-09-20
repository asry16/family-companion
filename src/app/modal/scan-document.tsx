import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  Pressable,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useVoice } from '@/context/VoiceContext';
import { DocumentCard } from '@/components/cards/DocumentCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { LightBackdrop, DarkBackdrop } from '@/components/ui';
import { FamilyDocument } from '@/types';

export default function ScanDocumentModal() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark, isElderly } = useAppTheme();
  const { addDocument, executeDocumentAction } = useFamily();
  const { speak } = useVoice();

  const [title, setTitle] = useState('');
  const [type, setType] = useState<FamilyDocument['type']>('receipt');
  const [amount, setAmount] = useState('');
  const [provider, setProvider] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [notes, setNotes] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scannedDoc, setScannedDoc] = useState<FamilyDocument | null>(null);

  const handleClose = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    router.back();
  };

  const handleSaveDocument = () => {
    if (!title.trim()) return;

    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
      } catch (e) {}
    }

    setIsScanning(true);
    setTimeout(() => {
      setIsScanning(false);
      const newDoc: FamilyDocument = {
        id: `doc_${Date.now()}`,
        title: title.trim(),
        type,
        amount: amount.trim() ? parseFloat(amount.trim()) : undefined,
        currency: '₹',
        dueDate: dueDate.trim() || undefined,
        provider: provider.trim() || undefined,
        scannedAt: 'Just now',
        status: 'pending',
        fields: [],
        suggestedActions: [],
        notes: notes.trim() || undefined,
      };

      addDocument(newDoc);
      setScannedDoc(newDoc);
      speak(`Saved ${newDoc.title} to Family Vault.`);
    }, 600);
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

  const docTypes: { id: FamilyDocument['type']; label: string; icon: any }[] = [
    { id: 'receipt', label: 'Receipt', icon: 'receipt-outline' },
    { id: 'electricity_bill', label: 'Bill', icon: 'flash-outline' },
    { id: 'medical_prescription', label: 'Medical', icon: 'medkit-outline' },
    { id: 'insurance', label: 'Insurance', icon: 'shield-checkmark-outline' },
  ];

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <LightBackdrop />
      <DarkBackdrop />

      {/* Modern Frosted Header */}
      <View
        style={[
          styles.navBar,
          {
            paddingTop: insets.top > 0 ? insets.top + 8 : 16,
            borderBottomColor: isDark ? 'rgba(130, 140, 255, 0.14)' : 'rgba(124, 92, 224, 0.10)',
          },
        ]}>
        <View>
          <Text
            style={[
              styles.navTitle,
              { color: colors.text, fontSize: isElderly ? 22 : 18 },
            ]}>
            Add Family Document
          </Text>
          <Text style={[styles.navSubtitle, { color: isDark ? colors.textMuted : colors.textSecondary }]}>
            AI scan, catalog & track in vault
          </Text>
        </View>

        <Pressable
          onPress={handleClose}
          hitSlop={8}
          style={[
            styles.closeBtn,
            {
              backgroundColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(124, 92, 224, 0.08)',
              borderColor: isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.16)',
            },
          ]}>
          <Ionicons name="close" size={19} color={colors.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 36 }]}
        showsVerticalScrollIndicator={false}>
        {/* Camera Viewfinder Simulator */}
        <View
          style={[
            styles.viewfinder,
            {
              backgroundColor: isDark ? 'rgba(12, 17, 45, 0.90)' : '#0F172A',
              borderColor: isDark ? 'rgba(130, 140, 255, 0.25)' : 'rgba(124, 92, 224, 0.20)',
            },
          ]}>
          {/* Target Corners */}
          <View style={[styles.corner, styles.cornerTL, { borderColor: '#8A6BF2' }]} />
          <View style={[styles.corner, styles.cornerTR, { borderColor: '#8A6BF2' }]} />
          <View style={[styles.corner, styles.cornerBL, { borderColor: '#8A6BF2' }]} />
          <View style={[styles.corner, styles.cornerBR, { borderColor: '#8A6BF2' }]} />

          {isScanning ? (
            <View style={styles.scanningState}>
              <View style={[styles.scanLine, { backgroundColor: '#8A6BF2' }]} />
              <Ionicons name="sparkles" size={32} color="#A594FD" />
              <Text style={styles.scanningText}>AI Document Processing...</Text>
              <Text style={styles.scanningSub}>Cataloging into encrypted Family Vault</Text>
            </View>
          ) : (
            <View style={styles.viewfinderCenter}>
              <View style={styles.camIconCircle}>
                <Ionicons name="camera-outline" size={32} color="#A594FD" />
              </View>
              <Text style={styles.viewfinderHint}>
                Align bill, prescription, policy, or document within frame
              </Text>
            </View>
          )}
        </View>

        {/* Document Type Selector Chips */}
        <View style={styles.typeSelectorRow}>
          {docTypes.map((dt) => {
            const isSelected = type === dt.id;
            return (
              <Pressable
                key={dt.id}
                onPress={() => {
                  if (Platform.OS !== 'web') {
                    try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
                  }
                  setType(dt.id);
                }}
                style={[
                  styles.typeChip,
                  {
                    backgroundColor: isSelected
                      ? (isDark ? '#8A6BF2' : '#7C5CE0')
                      : (isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(255, 255, 255, 0.82)'),
                    borderColor: isSelected
                      ? 'transparent'
                      : (isDark ? 'rgba(130, 140, 255, 0.22)' : 'rgba(124, 92, 224, 0.16)'),
                  },
                ]}>
                <Ionicons
                  name={dt.icon}
                  size={14}
                  color={isSelected ? '#FFFFFF' : (isDark ? '#A594FD' : '#6E5ADC')}
                />
                <Text
                  style={[
                    styles.typeChipText,
                    {
                      color: isSelected ? '#FFFFFF' : (isDark ? '#C7CEEA' : '#4E5375'),
                      fontWeight: isSelected ? '700' : '600',
                    },
                  ]}>
                  {dt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>

        {/* Document Details Form */}
        <Text
          style={[
            styles.sectionTitle,
            { color: isDark ? '#A594FD' : '#7C5CE0', fontSize: isElderly ? 16 : 12 },
          ]}>
          DOCUMENT DETAILS
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Title / Name</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Home Electricity Bill, Health Card"
            placeholderTextColor={isDark ? 'rgba(160, 170, 210, 0.6)' : '#94A3B8'}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 247, 255, 0.85)',
                color: colors.text,
                borderColor: isDark ? 'rgba(130, 140, 255, 0.25)' : 'rgba(124, 92, 224, 0.20)',
              },
            ]}
          />
        </View>

        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Provider / Authority</Text>
            <TextInput
              value={provider}
              onChangeText={setProvider}
              placeholder="e.g. Utility Corp, Clinic"
              placeholderTextColor={isDark ? 'rgba(160, 170, 210, 0.6)' : '#94A3B8'}
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 247, 255, 0.85)',
                  color: colors.text,
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.25)' : 'rgba(124, 92, 224, 0.20)',
                },
              ]}
            />
          </View>
          <View style={{ width: 120 }}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Amount (₹)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={isDark ? 'rgba(160, 170, 210, 0.6)' : '#94A3B8'}
              style={[
                styles.input,
                {
                  backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 247, 255, 0.85)',
                  color: colors.text,
                  borderColor: isDark ? 'rgba(130, 140, 255, 0.25)' : 'rgba(124, 92, 224, 0.20)',
                },
              ]}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Due Date / Expiry</Text>
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="e.g. 25th of every month, Oct 2026"
            placeholderTextColor={isDark ? 'rgba(160, 170, 210, 0.6)' : '#94A3B8'}
            style={[
              styles.input,
              {
                backgroundColor: isDark ? 'rgba(255, 255, 255, 0.05)' : 'rgba(245, 247, 255, 0.85)',
                color: colors.text,
                borderColor: isDark ? 'rgba(130, 140, 255, 0.25)' : 'rgba(124, 92, 224, 0.20)',
              },
            ]}
          />
        </View>

        <View style={{ marginTop: 4 }}>
          <PrimaryButton
            label={isScanning ? "Processing..." : "Save to Family Vault"}
            onPress={handleSaveDocument}
            disabled={!title.trim() || isScanning}
          />
        </View>

        {/* Extracted Document Preview */}
        {scannedDoc && (
          <View style={styles.extractedSection}>
            <View
              style={[
                styles.successBanner,
                {
                  backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.10)',
                  borderColor: isDark ? 'rgba(16, 185, 129, 0.35)' : 'rgba(16, 185, 129, 0.25)',
                },
              ]}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.successText}>Document Added to Vault</Text>
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
    paddingBottom: 14,
    borderBottomWidth: 1,
  },
  navTitle: {
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  navSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 18,
    gap: 16,
    maxWidth: 520,
    width: '100%',
    alignSelf: 'center',
  },
  viewfinder: {
    height: 200,
    borderRadius: 24,
    borderWidth: 1,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  camIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(138, 107, 242, 0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  corner: {
    position: 'absolute',
    width: 22,
    height: 22,
    borderWidth: 3,
    borderRadius: 3,
  },
  cornerTL: { top: 14, left: 14, borderRightWidth: 0, borderBottomWidth: 0 },
  cornerTR: { top: 14, right: 14, borderLeftWidth: 0, borderBottomWidth: 0 },
  cornerBL: { bottom: 14, left: 14, borderRightWidth: 0, borderTopWidth: 0 },
  cornerBR: { bottom: 14, right: 14, borderLeftWidth: 0, borderTopWidth: 0 },
  viewfinderCenter: {
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 30,
  },
  viewfinderHint: {
    color: '#CBD5E1',
    textAlign: 'center',
    fontSize: 12.5,
    fontWeight: '500',
    lineHeight: 18,
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
  typeSelectorRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeChip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingVertical: 10,
    borderRadius: 999,
    borderWidth: 1,
  },
  typeChipText: {
    fontSize: 12,
  },
  sectionTitle: {
    fontWeight: '800',
    letterSpacing: 0.6,
    marginTop: 2,
  },
  inputGroup: {
    gap: 6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 12.5,
    fontWeight: '700',
  },
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 16,
    borderWidth: 1,
    fontSize: 14,
  },
  extractedSection: {
    gap: 10,
    marginTop: 8,
  },
  successBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  successText: {
    color: '#10B981',
    fontWeight: '700',
    fontSize: 12.5,
  },
});

