import React from 'react';
import { View, Text, StyleSheet, Image, ViewStyle } from 'react-native';
import { useAppTheme } from '@/context/ThemeContext';
import { FamilyMember } from '@/types';
import { StatusDot } from './StatusDot';

interface FamilyAvatarProps {
  member: FamilyMember;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showStatus?: boolean;
  style?: ViewStyle;
}

export const FamilyAvatar: React.FC<FamilyAvatarProps> = ({
  member,
  size = 'md',
  showStatus = true,
  style,
}) => {
  const { colors, isElderly } = useAppTheme();

  const dimensions = {
    sm: { container: 36, font: 14, dot: 10, borderWidth: 2 },
    md: { container: 48, font: 18, dot: 13, borderWidth: 2.5 },
    lg: { container: 60, font: 22, dot: 15, borderWidth: 3 },
    xl: { container: 76, font: 28, dot: 18, borderWidth: 3.5 },
  }[size];

  const getStatusColor = () => {
    switch (member.availability) {
      case 'available':
        return colors.green;
      case 'in_transit':
        return colors.yellow;
      case 'busy':
        return colors.blue;
      case 'offline':
      default:
        return colors.textMuted;
    }
  };

  return (
    <View style={[styles.wrapper, style]}>
      <View
        style={[
          styles.avatarContainer,
          {
            width: dimensions.container,
            height: dimensions.container,
            borderRadius: dimensions.container / 2,
            backgroundColor: member.avatarColor || colors.brandAccent,
            borderColor: isElderly ? colors.border : colors.cardBackground,
            borderWidth: isElderly ? 2 : 1,
          },
        ]}>
        {member.photoUrl ? (
          <Image
            source={{ uri: member.photoUrl }}
            style={{
              width: dimensions.container,
              height: dimensions.container,
              borderRadius: dimensions.container / 2,
            }}
          />
        ) : (
          <Text
            style={[
              styles.initials,
              {
                fontSize: dimensions.font,
                color: '#FFFFFF',
              },
            ]}>
            {member.initials || member.name.charAt(0)}
          </Text>
        )}
      </View>

      {showStatus && member.isSharingLocation && (
        <StatusDot
          size={dimensions.dot}
          color={getStatusColor()}
          pulsing={member.availability === 'available'}
          style={styles.statusDot}
          dotStyle={{
            borderColor: colors.cardBackground,
            borderWidth: dimensions.borderWidth,
          }}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  initials: {
    fontWeight: '700',
    textAlign: 'center',
  },
  statusDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
  },
});
