import React from 'react';
import { View, StyleSheet, SafeAreaView } from 'react-native';
import { ElderlyDashboard } from '@/components/simple/ElderlyDashboard';

export default function SimpleModeScreen() {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <ElderlyDashboard />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  container: {
    flex: 1,
  },
});
