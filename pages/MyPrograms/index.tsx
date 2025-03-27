import {
  AddIcon,
  EditIcon,
  HStack,
  Heading,
  Button,
  Icon,
  SafeAreaView,
  Avatar,
  Image,
  Text,
  Input,
  VStack,
  Divider,
  Box,
  View,
  InputField,
  AvatarImage,
  ButtonText,
  CheckIcon,
  CheckboxIcon,
  RemoveIcon,
  RefreshControl,
} from '@gluestack-ui/themed';
import React, {useEffect, useState, useRef, useCallback} from 'react';
import {Pressable, StyleSheet, ScrollView} from 'react-native';
import {screenWidth} from '../../constant/size';
import usePrograms, {useCreatedPrograms} from '../../hooks/lupa/usePrograms';
import {auth} from '../../services/firebase';

import ProgramDisplay from '../../containers/ProgramDisplay';
import Background from '../../components/Background';
import {Program} from '../../types/program';
import useUser from '../../hooks/useAuth';
import useLinkClient from '../../hooks/lupa/programs/useLinkClient';
import {LupaUser} from '../../types/user';
import {useTrainerClients} from '../../hooks/lupa/useTrainer';
import useTrainerClientRelationship from '../../hooks/lupa/trainer/useTrainerClientRelationship';
import {currentUser} from '../../services/firebase/auth';
import LinkClientBottomSheet from '../../containers/BottomSheet/LinkClientBottomSheet';
import BottomSheet, {BottomSheetView} from '@gorhom/bottom-sheet';
import {ViewMode} from '../BuildTool';
import Barbell from '../../assets/icons/Barbell.png';
import Plus from '../../assets/icons/Plus.png';
import ScrollableHeader from '../../components/ScrollableHeader';
import SmallProgramDisplay from '../../containers/ProgramDisplay/SmallProgramDisplay';
import ExerciseLibraryBookIcon from '../../assets/icons/ExerciseLibraryBook';

export default function MyPrograms({navigation}) {
  const [refreshing, setRefreshing] = useState(false);
  const [isProgramDialogVisible, setIsProgramDialogVisible] = useState(false);

  const {data: lupaUser, refetch: onRefetchUserData} = useUser(
    auth?.currentUser?.uid,
  );
  const [selectedClient, setSelectedClient] = useState<LupaUser>(null);
  const {data: myPrograms, refetch: onRefetchMyPrograms} = usePrograms(
    auth?.currentUser?.uid as string,
  );
  const {data: createdPrograms, refetch: onRefetchCreatedPrograms} =
    useCreatedPrograms(auth?.currentUser?.uid as string);

  const {data: clients, refetch: onRefetchClients} = useTrainerClients(
    auth?.currentUser?.uid as string,
  );
  const {mutateAsync: onLinkClient} = useLinkClient();

  const [isLinkClientOpen, setIsLinkClientOpen] = useState<boolean>(false);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState<string>('');
  const filteredClients = clients?.filter((client: LupaUser) =>
    client.name.toLowerCase().includes(clientSearchQuery.toLowerCase()),
  );

  const {
    data: trainerClientRelationship,
    refetch: onRefetchTrainerClientRelationship,
  } = useTrainerClientRelationship(
    auth?.currentUser?.uid as string,
    selectedClient?.uid,
  );

  const handleLinkToClientPress = () => {
    navigation.navigate('LinkToClient', {
      programToLink: null,
    });
  };

  const handleSheetChanges = useCallback((index: number) => {}, []);

  const toggleProgramSelection = (programId: string) => {
    if (selectedPrograms.includes(programId)) {
      setSelectedPrograms(selectedPrograms.filter(id => id !== programId));
    } else {
      setSelectedPrograms([...selectedPrograms, programId]);
    }
  };

  const handleSaveLinkedPrograms = () => {
    if (selectedClient) {
      onLinkClient({
        client_uid: selectedClient?.uid,
        trainer_uid: auth?.currentUser?.uid as string,
        linked_programs: selectedPrograms,
        uid: trainerClientRelationship?.uid,
      });

      bottomSheetRef.current?.close();
    }
  };

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    Promise.all([
      onRefetchUserData(),
      onRefetchMyPrograms(),
      onRefetchCreatedPrograms(),
      onRefetchClients(),
      onRefetchTrainerClientRelationship(),
    ]).then(() => setRefreshing(false));
  }, [
    onRefetchUserData,
    onRefetchMyPrograms,
    onRefetchCreatedPrograms,
    onRefetchClients,
    onRefetchTrainerClientRelationship,
  ]);

  const createdProgramsPublished = createdPrograms.programs?.filter(
    (program: Program) => program?.metadata.is_published === true,
  );
  const createdProgramsUnpublished = createdPrograms.programs?.filter(
    (program: Program) => program?.metadata.is_published === false,
  );

  return (
    <Background>
      <SafeAreaView style={styles.safeAreaView}>
        <ScrollView
          refreshControl={
            <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#ffffff']} // for Android
            tintColor="#ffffff" // for iOS
            title="Refreshing your dashboard" // iOS only
            titleColor="#ffffff" // iOS only
            progressBackgroundColor="#000000" // Android only
          />
          }>
          <ScrollableHeader showBackButton />
          <HStack
            px={10}
            pt={3}
            pb={13}
            alignItems="center"
            justifyContent="space-between">
            <Heading
              style={{fontSize: 28, fontWeight: '900'}}
              color="rgba(67, 116, 170, 0.7)">
              My Programs
            </Heading>

            {lupaUser?.role === 'trainer' && (
              <Box display='flex' alignItems='center' flexDirection='row'>
                <Pressable
                  onPress={() =>
                    navigation.navigate('ExerciseLibrary')
                  }>
                  <VStack space="sm" alignItems="center">
                   <ExerciseLibraryBookIcon />
                    <Text
                      style={{fontSize: 12, textAlign: 'center', width: 100}}
                      color="#2D8BFA"
                      textAlign="center">
                      My Exercise Library
                    </Text>
                  </VStack>
                </Pressable>

                <Pressable
                  onPress={() =>
                    navigation.navigate('ProgramView', {
                      mode: ViewMode.CREATE,
                    })
                  }>
                  <VStack space="sm" alignItems="center">
                    <Icon color="$white" as={EditIcon} w="$28" h="$28" />
                    <Text
                      style={{fontSize: 12, textAlign: 'center', width: 100}}
                      color="#2D8BFA"
                      textAlign="center">
                      Create New Program
                    </Text>
                  </VStack>
                </Pressable>
              </Box>
            )}
          </HStack>

          <ScrollView contentContainerStyle={{paddingHorizontal: 10}}>
            {lupaUser?.role === 'trainer' && (
              <View mb={10}>
                <Heading
                  pb={20}
                  color="$white"
                  fontSize={22}
                  style={{fontWeight: '900'}}>
                  ACTIVE NOW
                </Heading>
                <VStack space="md" alignItems="center">
                  {createdProgramsPublished?.length === 0 && (
                    <Text alignSelf="flex-start" color="$textLight200">
                      {' '}
                      No active programs exist.
                    </Text>
                  )}
                  {createdProgramsPublished?.map(program => {
                    return (
                      <Pressable
                        onPress={() =>
                          navigation.navigate('ProgramView', {
                            programId: program?.uid,
                            mode: ViewMode.PREVIEW,
                          })
                        }>
                        <View key={program.uid} style={{alignSelf: 'center'}}>
                          <SmallProgramDisplay
                            containerWidth={screenWidth - 20}
                            size="sm"
                            program={{
                              program: program,
                              trainer: createdPrograms.trainer,
                            }}
                          />
                        </View>
                      </Pressable>
                    );
                  })}
                </VStack>
              </View>
            )}

            {lupaUser?.role === 'trainer' && (
              <View my={20}>
                <Heading
                  color="$white"
                  pb={20}
                  fontSize={22}
                  style={{fontWeight: '900'}}>
                  PAST PROGRAMS
                </Heading>
                <VStack space="md" alignItems="center">
                  {createdProgramsUnpublished?.length === 0 && (
                    <Text color="$textLight200" alignSelf="flex-start">
                      {' '}
                      All programs are published
                    </Text>
                  )}
                  {createdProgramsUnpublished?.map(program => {
                    return (
                      <Pressable
                        onPress={() =>
                          navigation.navigate('ProgramView', {
                            mode: ViewMode.PREVIEW,
                            programId: program?.uid,
                          })
                        }>
                        <View key={program.uid} style={{alignSelf: 'center'}}>
                          <SmallProgramDisplay
                            containerWidth={screenWidth - 20}
                            size="sm"
                            program={{
                              program: program,
                              trainer: createdPrograms.trainer,
                            }}
                          />
                        </View>
                      </Pressable>
                    );
                  })}
                </VStack>
              </View>
            )}

            <View mb={20}>
              <Heading
                color="$white"
                pb={20}
                fontSize={22}
                style={{fontWeight: '900'}}>
                PURCHASED PROGRAMS
              </Heading>
              <VStack space="md" alignItems="center">
                {myPrograms.programs?.length === 0 && (
                  <Text color="$textLight200" alignSelf="flex-start">
                    {' '}
                    You have not purchased a program.
                  </Text>
                )}
                {myPrograms.programs?.map(program => {
                  return (
                    <Pressable
                      onPress={() =>
                        navigation.navigate('ProgramView', {
                          program: program,
                          mode: ViewMode.PREVIEW,
                        })
                      }>
                      <View key={program.uid} style={{alignSelf: 'center'}}>
                        <SmallProgramDisplay
                          containerWidth={screenWidth - 20}
                          size="sm"
                          program={{
                            program: program,
                            trainer: myPrograms.trainer,
                          }}
                        />
                      </View>
                    </Pressable>
                  );
                })}
              </VStack>
            </View>
          </ScrollView>

          {/* Bottom Sheet */}
          <BottomSheet
            snapPoints={['56%']}
            ref={bottomSheetRef}
            onChange={handleSheetChanges}
            index={isLinkClientOpen ? 0 : -1}
            enablePanDownToClose>
            <BottomSheetView>
              <SafeAreaView style={styles.bottomSheetContainer}>
                <Input
                  alignSelf="center"
                  mb={4}
                  variant="rounded"
                  style={{width: '90%', backgroundColor: '#eee'}}>
                  <InputField
                    value={clientSearchQuery}
                    onChangeText={setClientSearchQuery}
                    placeholder="Search clients"
                  />
                </Input>

                <View>
                  <Heading px={10}>Clients</Heading>
                  <ScrollView horizontal contentContainerStyle={{padding: 10}}>
                    {filteredClients?.map((client: LupaUser) => (
                      <Pressable
                        key={client.uid}
                        onPress={() => setSelectedClient(client)}>
                        <VStack alignItems="center" space="sm" mx={2}>
                          <Avatar size="sm">
                            <AvatarImage source={{uri: client.picture}} />
                          </Avatar>
                          <Text size="sm">{client.name}</Text>
                        </VStack>
                      </Pressable>
                    ))}
                    {filteredClients?.length === 0 && (
                      <Text>No clients available</Text>
                    )}
                  </ScrollView>
                </View>
                <Divider />

                {selectedClient && (
                  <>
                    <Heading mt={4} px={10}>
                      Select Programs
                    </Heading>
                    <ScrollView>
                      {createdPrograms.programs?.map(program => (
                        <Pressable
                          style={{padding: 10}}
                          key={program.uid}
                          onPress={() => toggleProgramSelection(program.uid)}>
                          <HStack
                            alignItems="center"
                            justifyContent="space-between"
                            p={2}>
                            <Text
                              color={
                                selectedPrograms.includes(program.uid)
                                  ? '$blue600'
                                  : '$black'
                              }>
                              {program.metadata.name}
                            </Text>
                            <Icon
                              as={
                                selectedPrograms.includes(program.uid)
                                  ? RemoveIcon
                                  : CheckIcon
                              }
                              size="sm"
                            />
                          </HStack>
                        </Pressable>
                      ))}
                    </ScrollView>
                  </>
                )}
                <View
                  style={{
                    position: 'absolute',
                    bottom: 10,
                    alignSelf: 'center',
                    width: screenWidth - 20,
                  }}>
                  {selectedClient && (
                    <Button
                      style={{}}
                      onPress={handleSaveLinkedPrograms}
                      mt={4}>
                      <ButtonText>Save</ButtonText>
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    onPress={() => {
                      setIsLinkClientOpen(false);
                      bottomSheetRef.current?.close();
                    }}
                    mt={4}>
                    <ButtonText>Close</ButtonText>
                  </Button>
                </View>
              </SafeAreaView>
            </BottomSheetView>
          </BottomSheet>

          {isProgramDialogVisible && (
            <View style={styles.dialogOverlay}>
              <View style={styles.dialog}>
                <Heading size="md" mb={4}>
                  Select a Program
                </Heading>
                <ScrollView>
                  {createdPrograms.programs?.map(program => (
                    <Pressable
                      key={program.uid}
                      onPress={() => {
                        setIsProgramDialogVisible(false);
                        navigation.navigate('LinkToClient', {
                          programToLink: program,
                        });
                      }}
                      style={styles.programItem}>
                      <Text>{program.metadata.name}</Text>
                    </Pressable>
                  ))}
                </ScrollView>
                <Button onPress={() => setIsProgramDialogVisible(false)} mt={4}>
                  <ButtonText>Cancel</ButtonText>
                </Button>
              </View>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    padding: 10,
  },
  bottomSheetContainer: {
    padding: 20,
    backgroundColor: '#FFF',
  },
  dialogOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dialog: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 10,
    width: '80%',
    maxHeight: '80%',
  },
  programItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
