import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppTheme } from '@/context/ThemeContext';
import { TabBarTokens } from '@/constants/theme';
import { useFamily } from '@/context/FamilyContext';
import { useAuth } from '@/context/AuthContext';
import { FamilyMember } from '@/types';

// Circle Screen Components
import {
  CircleHeader,
  CircleSafetyBanner,
  CircleLiveMapCard,
  CircleMembersCard,
  CircleMemberDetailSheet,
} from '@/components/circle';

// Backdrops & Modals
import { LightBackdrop, DarkBackdrop } from '@/components/ui';
import { FamilyQRModal } from '@/components/modals/FamilyQRModal';

export default function CircleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { isAuthenticated, user } = useAuth();
  const { profile, members: ctxMembers, activeUser, sendFamilyPing } = useFamily();

  const scrollViewRef = useRef<ScrollView>(null);
  const [membersCardY, setMembersCardY] = useState<number>(450);

  // Modals & Bottom Sheet state
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedMember, setSelectedMember] = useState<FamilyMember | null>(null);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

  // Time ticker to update relative times every minute
  const [minuteTick, setMinuteTick] = useState<number>(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setMinuteTick((t) => t + 1);
    }, 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!isAuthenticated) router.replace('/login');
  }, [isAuthenticated]);

  // Compute 3 members with distinct statuses and dynamic relative times
  const displayMembers: FamilyMember[] = useMemo(() => {
    const selfName = user?.name || activeUser?.name || 'Sarah (Mom)';
    const selfPhoto = user?.photoUrl || activeUser?.photoUrl;

    const baseMembers: FamilyMember[] = [
      {
        id: activeUser?.id || 'member-self',
        name: selfName,
        relation: 'Self',
        initials: selfName.charAt(0).toUpperCase(),
        avatarColor: '#4F8EF7',
        isSelf: true,
        photoUrl: selfPhoto,
        phone: user?.phone || '+1 (555) 234-5678',
        humanLocation: 'At Home',
        statusMessage: 'At Home • Relaxing',
        currentPlaceId: 'home',
        isSharingLocation: true,
        sharingDuration: 'always',
        availability: 'available',
        lastUpdated: minuteTick === 0 ? 'Just now' : `${minuteTick} min ago`,
        batteryLevel: 88,
        isCharging: false,
        deviceModel: 'iPhone 15 Pro',
        ringerMode: 'sound',
        coords: { x: 50, y: 50, latitude: 37.7749, longitude: -122.4194 },
      },
      {
        id: 'member-2',
        name: 'Michael',
        relation: 'Spouse',
        initials: 'M',
        avatarColor: '#8B6CF0',
        isSelf: false,
        phone: '+1 (555) 345-6789',
        humanLocation: 'Whole Foods Market',
        statusMessage: 'Picking up groceries',
        currentPlaceId: 'market',
        isSharingLocation: true,
        sharingDuration: 'always',
        availability: 'available',
        lastUpdated: `${minuteTick + 2} min ago`,
        batteryLevel: 64,
        isCharging: false,
        deviceModel: 'Pixel 8',
        ringerMode: 'vibrate',
        coords: { x: 42, y: 38, latitude: 37.7849, longitude: -122.4094 },
      },
      {
        id: 'member-3',
        name: 'Emma',
        relation: 'Daughter',
        initials: 'E',
        avatarColor: '#2DD4BF',
        isSelf: false,
        phone: '+1 (555) 456-7890',
        humanLocation: 'Lincoln High School',
        statusMessage: 'In Chemistry class',
        currentPlaceId: 'school',
        isSharingLocation: true,
        sharingDuration: 'always',
        availability: 'busy',
        lastUpdated: `${minuteTick + 12} min ago`,
        batteryLevel: 42,
        isCharging: true,
        deviceModel: 'iPhone 13',
        ringerMode: 'silent',
        coords: { x: 62, y: 64, latitude: 37.7649, longitude: -122.4294 },
      },
    ];

    if (ctxMembers && ctxMembers.length >= 3) {
      return ctxMembers;
    }

    return baseMembers;
  }, [user, activeUser, ctxMembers, minuteTick]);

  if (!isAuthenticated) return null;

  // Handlers
  const handleSelectMember = (member: FamilyMember) => {
    setSelectedMember(member);
    setSelectedMemberId(member.id);
    setSheetVisible(true);
  };

  const handleSelectMemberFromPin = (memberId: string) => {
    setSelectedMemberId(memberId);
    const found = displayMembers.find((m) => m.id === memberId);
    if (found) {
      setSelectedMember(found);
      setSheetVisible(true);
    }
  };

  const handleScrollToMembers = () => {
    scrollViewRef.current?.scrollTo({
      y: membersCardY - 10,
      animated: true,
    });
  };

  const handleAskStatus = (targetMember: FamilyMember) => {
    sendFamilyPing(
      targetMember.id,
      `Quick check-in ping from family: hope everything is going smoothly!`
    );
  };

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      {/* Ambient Backdrops */}
      <LightBackdrop />
      <DarkBackdrop />

      {/* 1. Header: 40px back, 44px group icon, title, subtitle with pulsing green dot, 3 right buttons */}
      <CircleHeader
        onBack={() => router.navigate('/(tabs)')}
        onOpenSettings={() => router.push({ pathname: '/modal/family-settings', params: { fromTab: 'circle' } })}
        onOpenNotifications={() => router.push('/modal/notifications')}
      />

      {/* Main Scrollable Content */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: TabBarTokens.getScrollBottomPadding(insets.bottom) },
        ]}
        showsVerticalScrollIndicator={false}>
        
        {/* 2. Safety Banner (~72px, 48px green gradient shield, data-driven) */}
        <CircleSafetyBanner
          onPress={() => router.push({ pathname: '/modal/family-settings', params: { fromTab: 'circle' } })}
        />

        {/* 3. Live Map Card (radius 28, height clamp 320-440, ArcGIS tiles, teardrop pins with pulses) */}
        <CircleLiveMapCard
          members={displayMembers}
          selectedMemberId={selectedMemberId}
          onSelectMember={handleSelectMemberFromPin}
          onPressViewList={handleScrollToMembers}
        />

        {/* 4. Family Members Card (72px row cards, header with "+ Add Member" pill) */}
        <View
          onLayout={(e) => {
            setMembersCardY(e.nativeEvent.layout.y);
          }}>
          <CircleMembersCard
            members={displayMembers}
            currentUserId={activeUser?.id || user?.familyMemberId}
            selectedMemberId={selectedMemberId}
            onSelectMember={handleSelectMember}
            onAddMember={() => router.push({ pathname: '/modal/family-settings', params: { fromTab: 'circle' } })}
          />
        </View>
      </ScrollView>

      {/* Member Detail Bottom Sheet */}
      <CircleMemberDetailSheet
        visible={sheetVisible}
        member={selectedMember}
        isSelf={selectedMember?.isSelf || selectedMember?.id === activeUser?.id}
        onClose={() => {
          setSheetVisible(false);
        }}
        onAskStatus={handleAskStatus}
      />

      {/* Family QR Modal */}
      <FamilyQRModal
        visible={qrModalVisible}
        onClose={() => setQrModalVisible(false)}
        familyCode={profile?.code || 'KINLY-2026'}
        familyName={profile?.name || 'Kinly Family'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 4,
    gap: 10,
    maxWidth: 500,
    width: '100%',
    alignSelf: 'center',
  },
});
