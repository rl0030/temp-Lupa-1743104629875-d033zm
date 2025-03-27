// renderFunctions.ts

import React, { useCallback, useMemo } from 'react';
import { View, Pressable, Image, ScrollView } from 'react-native';
import { Text, Box, Button, ButtonText, ButtonIcon, AddIcon, HStack, VStack } from '@gluestack-ui/themed';
import LinearGradient from 'react-native-linear-gradient';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import ProgramDisplay from '../../containers/ProgramDisplay';
import { screenWidth } from '../../constant/size';
import { ActivityIndicator } from 'react-native';
// Import your icons
import Barbell from '../../assets/icons/Barbell.png';
import { ViewMode } from '.';
import { Program, ProgramDetailsWithTrainerName, SessionItem, Week } from '../../types/program';
import { LupaUser } from '../../types/user';

export const renderMediaView = (mode: ViewMode, program: Program, trainer: LupaUser, selectProgramMedia: () => void, isMediaLoading: boolean) => {
  if (mode === ViewMode.CREATE || mode === ViewMode.EDIT) {
    return (
      <Pressable
        style={styles.mediaContainer}
        onPress={selectProgramMedia}>
        {!program?.metadata.media ? (
          <LinearGradient
            colors={['rgba(196, 196, 196, 0.74)', '#5E5E5E']}
            style={styles.mediaPlaceholder}>
            {isMediaLoading ? (
              <ActivityIndicator size="large" color="#1A9DFD" />
            ) : (
              <>
                <EvilIcons name="plus" size={80} color="#1A9DFD" />
                <Image
                  source={Barbell}
                  style={styles.barbellIcon}
                />
              </>
            )}
          </LinearGradient>
        ) : (
          <View style={styles.mediaImageContainer}>
            {isMediaLoading ? (
              <View style={[styles.mediaImage, styles.loadingContainer]}>
                <ActivityIndicator size="large" color="#1A9DFD" />
              </View>
            ) : (
              <Image
                style={styles.mediaImage}
                source={{ uri: program?.metadata?.media }}
              />
            )}
            <View style={styles.mediaOverlay} />
          </View>
        )}
      </Pressable>
    );
  } else {
    return (
      <View style={styles.programDisplayContainer}>
        <ProgramDisplay
          program={{
            program: program,
            trainer: {
              name: trainer?.name,
              uid: trainer?.uid,
              picture: trainer?.picture
            },
          }}
        />
      </View>
    );
  }
}

export const renderWeeksAndSessions = (
  program: Program,
  mode: ViewMode,
  addWeek: () => void,
  addSession: (weekIdx: number) => void,
  removeSession: (weekIdx: number, sessionIdx: number) => void,
  navigate: any
) => {

  const weekNumbers = [
    'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
    'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty',
  ];

  return (
    <View>
      <VStack space="md">
        {program?.weeks?.map((week: Week, weekIdx: number) => (
          <View key={weekIdx}>
            <HStack space="md" alignItems="center" justifyContent="space-between">
              <VStack alignItems="flex-start" flex={1}>
                <Text color="#fff" fontSize={22} fontWeight="900" paddingBottom={12}>
                  Week {weekNumbers[weekIdx] || weekIdx + 1}
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <HStack space="xl" p={4}>
                    {week?.sessions?.map((_: any, sessionIdx: number) => (
                      <Pressable
                        key={sessionIdx}
                        onPress={() => navigate.navigate(
                          (mode == ViewMode.CREATE || mode == ViewMode.EDIT) ? 'Sessions' : 'SessionSelection',
                          (mode == ViewMode.CREATE || mode == ViewMode.EDIT) ?
                          { programId: program?.uid, weekIndex: weekIdx, sessionIndex: sessionIdx }
                            : { program: program, selectedWeek: weekIdx, selectedSession: sessionIdx }
                            
                        )}>
                        <Box
                          width={50}
                          height={50}
                          borderRadius={10}
                          borderWidth={1}
                          bg="rgba(255, 255, 255, 0.1)"
                          justifyContent="center"
                          alignItems="center"
                          position="relative">
                          <Text
                            position="absolute"
                            bottom={2}
                            right={4}
                            color="#646464"
                            fontSize={26}
                            fontWeight="500">
                            {String.fromCharCode(97 + sessionIdx)}
                          </Text>
                        </Box>
                      </Pressable>
                    ))}
                  </HStack>
                </ScrollView>
              </VStack>
              {(mode === ViewMode.CREATE || mode === ViewMode.EDIT) && (
                <VStack>
                  <Pressable onPress={() => addSession(weekIdx)}>
                    <Box
                      width={30}
                      height={30}
                      marginVertical={2}
                      borderRadius={5}
                      borderWidth={1}
                      bg="rgba(255, 255, 255, 0.1)"
                      justifyContent="center"
                      alignItems="center">
                      <Text color="#2D8BFA" fontSize={20}>+</Text>
                    </Box>
                  </Pressable>
                  <Pressable onPress={() => removeSession(weekIdx, week.sessions.length - 1)}>
                    <Box
                      width={30}
                      height={30}
                      marginVertical={2}
                      borderRadius={5}
                      borderWidth={1}
                      bg="rgba(255, 255, 255, 0.1)"
                      justifyContent="center"
                      alignItems="center">
                      <Text color="#FF0000" fontSize={20}>-</Text>
                    </Box>
                  </Pressable>
                </VStack>
              )}
            </HStack>
          </View>
        ))}
      </VStack>
      {(mode === ViewMode.CREATE || mode === ViewMode.EDIT) && (
        <Button
          onPress={addWeek}
          size="md"
          variant="link"
          alignSelf="flex-start"
          action="primary"
          isDisabled={false}
          isFocusVisible={false}>
          <ButtonText fontWeight="$medium">Add Week</ButtonText>
          <ButtonIcon as={AddIcon} />
        </Button>
      )}
    </View>
  );
}

const styles = {
  mediaContainer: {
    borderRadius: 8,
    width: '100%',
    height: '100%',
  },
  mediaPlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  barbellIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 44,
    height: 44,
  },
  mediaImageContainer: {
    borderRadius: 8,
    width: '100%',
    height: '100%',
  },
  mediaImage: {
    borderRadius: 8,
    width: '100%',
    height: '100%',
  },
  mediaOverlay: {
    position: 'absolute',
    borderRadius: 8,
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  programDisplayContainer: {
    alignItems: 'center',
  },
  sessionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  sessionBox: {
    width: 50,
    height: 50,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 10,
  },
  sessionText: {
    position: 'absolute',
    bottom: 2,
    right: 4,
    color: '#646464',
    fontSize: 26,
    fontWeight: '500',
  },
  sessionControls: {
    flexDirection: 'column',
  },
  controlButton: {
    width: 30,
    height: 30,
    marginVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    fontSize: 20,
    color: '#2D8BFA',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
};