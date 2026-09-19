import React from 'react';
import { Tabs } from 'expo-router';
import { BottomTabBar } from '@/components/navigation';

export default function TabsLayout() {
  return (
    <Tabs
      tabBar={(props) => <BottomTabBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
        }}
      />
      <Tabs.Screen
        name="family"
        options={{
          title: 'Circle',
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: 'Assistant',
        }}
      />
      <Tabs.Screen
        name="memory"
        options={{
          title: 'Vault',
        }}
      />
      <Tabs.Screen
        name="plans"
        options={{
          title: 'Plans',
        }}
      />
    </Tabs>
  );
}
