import React, { memo } from 'react';
import { View, Pressable, Image, StyleSheet, Alert } from 'react-native';
import { HStack, VStack, Text, AlertCircleIcon } from '@gluestack-ui/themed';
import { NavigationProp, useNavigation } from '@react-navigation/native';
import { Program } from '../../types/program';
import { auth } from '../../services/firebase';

import ShareArrowRight from '../../assets/icons/ShareArrowRight.png';
import BarbellIcon from '../../assets/icons/Barbell.png';
import PlusIcon from '../../assets/icons/Plus.png';
import PublishIcon from '../../assets/icons/program_preview/AddUserIcon.png';
import HighlighterIcon from '../../assets/icons/program_preview/HighlighterIcon.png';
import { ViewMode } from '.';
import CalendarThirtyOneIcon from '../../assets/icons/CalendarThirtyOneIcon';

interface ActionButtonsProps {
  program: Program;
  shareProgram: () => void;
  togglePublish: () => void;
  navigation: NavigationProp<any>;
}

const ActionButtons: React.FC<ActionButtonsProps> = memo(({
  program,
  shareProgram,
  togglePublish,
  navigation,
}) => {
  const navigation_in = useNavigation()
  const scheduleSessions = () => {
    navigation_in.navigate('ScheduleSessions')
  }
  return (
    <View style={styles.actionButtonsContainer}>
      <Pressable
        style={styles.reportButton}
        onPress={() => Alert.alert(
          'Request Received',
          'This program has been marked as having inappropriate content. We will review it as soon as possible.',
        )}>
        <HStack py={6} alignItems="center" space="sm">
          <AlertCircleIcon color="$blue600" />
          <Text size="sm" color="$blue600">Report Inappropriate Content</Text>
        </HStack>
      </Pressable>
      
      <HStack alignItems="center" justifyContent="flex-end" space="md">
      <Pressable onPress={scheduleSessions}>
          <VStack alignItems="center" space="xs">
            <Image source={CalendarThirtyOneIcon} style={styles.actionIcon} />
            <Text color="#2D8BFA" fontSize={12} fontWeight="400">Share</Text>
          </VStack>
        </Pressable>

        <Pressable onPress={shareProgram}>
          <VStack alignItems="center" space="xs">
            <Image source={ShareArrowRight} style={styles.actionIcon} />
            <Text color="#2D8BFA" fontSize={12} fontWeight="400">Share</Text>
          </VStack>
        </Pressable>

        {auth?.currentUser?.uid === program?.metadata?.owner && (
          <>
            <Pressable onPress={() => navigation.navigate('LinkToClient', { programToLink: program })}>
              <VStack alignItems="center" space="xs">
                <HStack alignItems="center" space="xs">
                  <Image source={BarbellIcon} style={styles.actionIcon} />
                  <Image source={PlusIcon} style={styles.actionIcon} />
                </HStack>
                <Text color="#2D8BFA" fontSize={12} textAlign="center" width={65} fontWeight="400">
                  Link to Client
                </Text>
              </VStack>
            </Pressable>

            <Pressable onPress={togglePublish}>
              <VStack alignItems="center" space="xs">
                <Image source={PublishIcon} style={styles.actionIcon} />
                <Text color="#2D8BFA" width={65} textAlign="center" fontSize={12} fontWeight="400">
                  {!program?.metadata?.is_published ? 'Publish to Profile' : 'Unpublish'}
                </Text>
              </VStack>
            </Pressable>

            <Pressable onPress={() => navigation.navigate('Details', { programId: program?.uid, mode: ViewMode.EDIT })}>
              <VStack alignItems="center" space="xs">
                <Image source={HighlighterIcon} style={styles.actionIcon} />
                <Text color="#2D8BFA" fontSize={12} fontWeight="400">Edit</Text>
              </VStack>
            </Pressable>
          </>
        )}
      </HStack>
    </View>
  );
});

const styles = StyleSheet.create({
  actionButtonsContainer: {
    paddingVertical: 10,
    paddingBottom: 15,
  },
  reportButton: {
    alignSelf: 'flex-end',
    marginVertical: 5,
  },
  actionIcon: {
    width: 32,
    height: 28,
  },
});

export default ActionButtons;