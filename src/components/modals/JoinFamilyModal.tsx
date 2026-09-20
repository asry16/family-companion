import React from 'react';
import { CircleAddMemberOptionsSheet } from '@/components/circle/CircleAddMemberOptionsSheet';

export interface JoinFamilyModalProps {
  visible: boolean;
  onClose: () => void;
  onSuccess?: (familyName: string) => void;
  initialTab?: 'share' | 'enter';
}

/**
 * JoinFamilyModal
 * Executive household connect modal with two clean options:
 * 1. Enter Family Code
 * 2. Share Family Code
 */
export const JoinFamilyModal: React.FC<JoinFamilyModalProps> = ({
  visible,
  onClose,
  onSuccess,
  initialTab = 'enter',
}) => {
  return (
    <CircleAddMemberOptionsSheet
      visible={visible}
      initialMode={initialTab}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};
