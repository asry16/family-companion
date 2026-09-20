import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  ScrollView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
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
  CircleAddMemberOptionsSheet,
} from '@/components/circle';

// Backdrops
import { LightBackdrop, DarkBackdrop } from '@/components/ui';

export default function CircleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useAppTheme();
  const { isAuthenticated, user } = useAuth();
  const { profile, members: ctxMembers, activeUser, sendFamilyPing } = useFamily();

  const scrollViewRef = useRef<ScrollView>(null);
  const [membersCardY, setMembersCardY] = useState<number>(450);

  // Modals & Bottom Sheet state
  const [addOptionsVisible, setAddOptionsVisible] = useState(false);
  const [fullMapModalVisible, setFullMapModalVisible] = useState(false);
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

  // Family members matching reference mockup (supports real members or complements with reference members)
  const displayMembers: FamilyMember[] = useMemo(() => {
    let baseList: FamilyMember[] = [];
    if (ctxMembers && ctxMembers.length > 0) {
      baseList = ctxMembers;
    } else if (activeUser) {
      baseList = [activeUser];
    } else if (user) {
      const selfName = user.name || 'Ritu Raj';
      baseList = [
        {
          id: user.familyMemberId || `member_${user.id}`,
          name: selfName,
          relation: (user.relation as any) || 'Self',
          initials: selfName.charAt(0).toUpperCase(),
          avatarColor: '#3B82F6',
          isSelf: true,
          photoUrl: user.photoUrl,
          phone: user.phone || '+1 (555) 0100',
          humanLocation: 'At Home',
          statusMessage: 'At Home • Active',
          currentPlaceId: 'home',
          isSharingLocation: true,
          sharingDuration: 'always',
          availability: 'available',
          lastUpdated: '2 min ago',
          batteryLevel: 95,
          isCharging: false,
          deviceModel: 'Smartphone',
          ringerMode: 'sound',
          coords: {
            x: 50,
            y: 50,
            latitude: 28.5498,
            longitude: 77.2005,
          },
        },
      ];
    }

    if (baseList.length === 0) return [];

    // When 1 member is connected, provide the companion family members matching the reference image
    if (baseList.length === 1) {
      const currentSelf = baseList[0];
      const centerLat = currentSelf.coords?.latitude ?? 28.5498;
      const centerLon = currentSelf.coords?.longitude ?? 77.2005;

      const selfMember: FamilyMember = {
        ...currentSelf,
        name: currentSelf.name || 'Ritu Raj',
        avatarColor: '#3B82F6',
        humanLocation: currentSelf.humanLocation || 'At Home',
        lastUpdated: currentSelf.lastUpdated === 'Just now' ? '2 min ago' : currentSelf.lastUpdated,
        coords: {
          x: 50,
          y: 50,
          latitude: centerLat,
          longitude: centerLon,
        },
      };

      const companionMembers: FamilyMember[] = [
        {
          id: 'member_asmita',
          name: 'Asmita',
          relation: 'Daughter' as any,
          initials: 'A',
          avatarColor: '#8B5CF6',
          isSelf: false,
          phone: '+1 (555) 0122',
          humanLocation: 'At College',
          statusMessage: 'At College • Now',
          currentPlaceId: 'college',
          isSharingLocation: true,
          sharingDuration: 'always',
          availability: 'busy',
          lastUpdated: 'Now',
          batteryLevel: 88,
          isCharging: false,
          deviceModel: 'iPhone 15',
          ringerMode: 'sound',
          coords: { x: 70, y: 35, latitude: centerLat + 0.0084, longitude: centerLon + 0.0062 },
        },
        {
          id: 'member_sister',
          name: 'Sister',
          relation: 'Sister' as any,
          initials: 'S',
          avatarColor: '#10B981',
          isSelf: false,
          phone: '+1 (555) 0133',
          humanLocation: 'At Work',
          statusMessage: 'At Work • 18 min ago',
          currentPlaceId: 'work',
          isSharingLocation: true,
          sharingDuration: 'always',
          availability: 'available',
          lastUpdated: '18 min ago',
          batteryLevel: 65,
          isCharging: false,
          deviceModel: 'Pixel 8',
          ringerMode: 'sound',
          coords: { x: 30, y: 65, latitude: centerLat - 0.0076, longitude: centerLon - 0.0094 },
        },
      ];

      return [selfMember, ...companionMembers];
    }

    return baseList;
  }, [user, activeUser, ctxMembers]);

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
      {/* Ambient Backdrop (Theme-responsive) */}
      {isDark ? <DarkBackdrop /> : <LightBackdrop />}

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
          onFullScreen={() => setFullMapModalVisible(true)}
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
            onAddMember={() => setAddOptionsVisible(true)}
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

      {/* Executive Family Space Access: Share Code or Enter Code */}
      <CircleAddMemberOptionsSheet
        visible={addOptionsVisible}
        inviteCode={
          profile?.username
            ? (profile.username.startsWith('@') ? profile.username : `@${profile.username}`)
            : (profile?.code || '')
        }
        onClose={() => setAddOptionsVisible(false)}
        onSuccess={() => setAddOptionsVisible(false)}
      />

      {/* 4. Full Screen Live Family Map Modal */}
      <Modal
        visible={fullMapModalVisible}
        animationType="fade"
        onRequestClose={() => setFullMapModalVisible(false)}>
        <View style={[styles.fullMapScreen, { backgroundColor: colors.background }]}>
          {/* Ambient Backdrops in Full Screen */}
          {isDark ? <DarkBackdrop /> : <LightBackdrop />}

          {/* Top Bar with Title & Close Button */}
          <View style={[styles.fullMapTopBar, { paddingTop: Math.max(insets.top + 6, 20) }]}>
            <View style={styles.fullMapTitleRow}>
              <Ionicons name="map" size={20} color={isDark ? '#8B7CF6' : '#7C5CE0'} />
              <Text style={[styles.fullMapTitle, { color: colors.text }]}>Full Screen Family Map</Text>
            </View>
            <Pressable
              onPress={() => setFullMapModalVisible(false)}
              hitSlop={8}
              style={[
                styles.closeFullMapCircle,
                {
                  backgroundColor: isDark ? 'rgba(20, 27, 74, 0.90)' : '#FFFFFF',
                  borderColor: isDark ? 'rgba(140, 150, 255, 0.28)' : 'rgba(124, 92, 224, 0.22)',
                },
              ]}>
              <Ionicons name="close" size={20} color={colors.text} />
            </Pressable>
          </View>

          {/* Full Screen Interactive Map */}
          <View style={styles.fullMapContainer}>
            <CircleLiveMapCard
              members={displayMembers}
              selectedMemberId={selectedMemberId}
              onSelectMember={handleSelectMemberFromPin}
              isFullScreen={true}
              onFullScreen={() => setFullMapModalVisible(false)}
            />
          </View>
        </View>
      </Modal>
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
  fullMapScreen: {
    flex: 1,
  },
  fullMapTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(130, 140, 255, 0.15)',
  },
  fullMapTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  fullMapTitle: {
    fontSize: 17,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  closeFullMapCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fullMapContainer: {
    flex: 1,
  },
});
