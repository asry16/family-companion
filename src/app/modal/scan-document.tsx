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
import { useAppTheme } from '@/context/ThemeContext';
import { useFamily } from '@/context/FamilyContext';
import { useVoice } from '@/context/VoiceContext';
import { DocumentCard } from '@/components/cards/DocumentCard';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { FamilyDocument } from '@/types';

export default function ScanDocumentModal() {
  const router = useRouter();
  const { colors, isElderly } = useAppTheme();
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
          Scan & Add Family Document
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
              <Text style={styles.scanningText}>AI Document Processing...</Text>
              <Text style={styles.scanningSub}>Cataloging into encrypted Family Vault</Text>
            </View>
          ) : (
            <View style={styles.viewfinderCenter}>
              <Ionicons name="camera-outline" size={44} color="#94A3B8" />
              <Text style={styles.viewfinderHint}>
                Align bill, prescription, policy, or document within frame
              </Text>
            </View>
          )}
        </View>

        {/* Document Details Form */}
        <Text
          style={[
            styles.sectionTitle,
            { color: colors.text, fontSize: isElderly ? 18 : 14 },
          ]}>
          DOCUMENT DETAILS
        </Text>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Title / Name</Text>
          <TextInput
            value={title}
            onChangeText={setTitle}
            placeholder="e.g., Home Electricity Bill, Health Card"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
          />
        </View>

        <View style={styles.inputRow}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Provider / Authority</Text>
            <TextInput
              value={provider}
              onChangeText={setProvider}
              placeholder="e.g. Utility Corp, Clinic"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
            />
          </View>
          <View style={{ width: 120 }}>
            <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Amount (₹)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Due Date / Expiry</Text>
          <TextInput
            value={dueDate}
            onChangeText={setDueDate}
            placeholder="e.g. 25th of every month, Oct 2026"
            placeholderTextColor={colors.textMuted}
            style={[styles.input, { backgroundColor: colors.cardBackground, color: colors.text, borderColor: colors.border }]}
          />
        </View>

        <PrimaryButton
          label={isScanning ? "Processing..." : "Save to Family Vault"}
          onPress={handleSaveDocument}
          disabled={!title.trim() || isScanning}
        />

        {/* Extracted Document Preview */}
        {scannedDoc && (
          <View style={styles.extractedSection}>
            <View style={styles.successBanner}>
              <Ionicons name="checkmark-circle" size={18} color="#10B981" />
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
  inputGroup: {
    gap: 6,
  },
  inputRow: {
    flexDirection: 'row',
    gap: 12,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  input: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 15,
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
