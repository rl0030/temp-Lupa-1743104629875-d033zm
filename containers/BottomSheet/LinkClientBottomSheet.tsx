import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  HStack,
  Heading,
  Button,
  SafeAreaView,
  Avatar,
  Text,
  Input,
  VStack,
  View,
  InputField,
  AvatarImage,
  ButtonText,
  Divider,
  CheckboxGroup,
  Checkbox,
  CheckboxIndicator,
  CheckboxIcon,
  CheckboxLabel,
  CheckIcon,
} from '@gluestack-ui/themed';
import { Pressable, StyleSheet, ScrollView } from 'react-native';
import { screenWidth } from '../../constant/size';
import { auth } from '../../services/firebase';
import { Program } from '../../types/program';
import { LupaUser, Pack } from '../../types/user';
import { TrainerClientRelationship } from '../../hooks/lupa/trainer/useTrainerClientRelationship';
import BottomSheet from '@gorhom/bottom-sheet';
import { UseMutateAsyncFunction } from '@tanstack/react-query';
import { primaryColor } from '../../lupa_theme';

interface ILinkClientBottomSheet {
  isOpen: boolean;
  clientSearchQuery: string;
  clients: (LupaUser | Pack)[];
  onLinkClient: UseMutateAsyncFunction<void, Error, TrainerClientRelationship, unknown>;
  setSelectedClient: (selectedType: LupaUser | Pack) => void;
  selectedClient: LupaUser | Pack;
  onClose: () => void;
  hasClose: boolean;
  createdPrograms: { program: Program; trainer: LupaUser }[];
}

export default function LinkClientBottomSheet({
  createdPrograms,
  onClose,
  selectedClient,
  setSelectedClient,
  hasClose,
  clients,
  isOpen,
  onLinkClient,
}: ILinkClientBottomSheet) {
  const bottomSheetRef = useRef<BottomSheet>(null);
  const [selectedPrograms, setSelectedPrograms] = useState<string[]>([]);
  const [clientSearchQuery, setClientSearchQuery] = useState<string>('');

  const filteredClients = clients?.filter((client: LupaUser) =>
    client.name.toLowerCase().includes(clientSearchQuery.toLowerCase()),
  );

  useEffect(() => {
    onClose()
    //bottomSheetRef.current?.close()
  }, [])

  // useEffect(() => {
  //   if (isOpen) {
  //     bottomSheetRef.current?.expand();
  //   } else {
  //      bottomSheetRef.current?.forceClose();
  //    }
  // }, [isOpen]);

  const handleSheetChanges = useCallback((index: number) => {}, []);

  //bottomSheetRef.current?.expand()
  
  const handleSaveLinkedPrograms = () => {
    if (selectedClient) {
      onLinkClient({
        client_uid: selectedClient?.uid,
        trainer_uid: auth?.currentUser?.uid as string,
        linked_programs: selectedPrograms,
      });
      onClose();
    }
  };

  return (
    <BottomSheet
      snapPoints={['10%', '70%']}
      ref={bottomSheetRef}
      onChange={handleSheetChanges}
    >
      <SafeAreaView style={styles.bottomSheetContainer}>
        <Input
          alignSelf="center"
          mb={10}
          variant="rounded"
          style={{ width: '90%', backgroundColor: '#eee' }}
        >
          <InputField
            value={clientSearchQuery}
            onChangeText={setClientSearchQuery}
            placeholder="Search clients"
          />
        </Input>

        <ScrollView horizontal >
          {filteredClients?.map((client: LupaUser) => (
            <Pressable key={client.uid} onPress={() => setSelectedClient(client)}>
              <VStack alignItems="center" space="sm" mx={2}>
                <Avatar
                  style={{
                    borderWidth: 2,
                    borderColor: selectedClient.uid === client.uid ? primaryColor : '#aaa',
                  }}
                  size="sm"
                >
                  <AvatarImage source={{ uri: client.picture }} />
                </Avatar>
                <Text
                  style={{ color: selectedClient.uid === client.uid ? primaryColor : '#aaa' }}
                  size="sm"
                >
                  {client.name}
                </Text>
              </VStack>
            </Pressable>
          ))}
          {filteredClients?.length === 0 && <Text>No clients available</Text>}
        </ScrollView>

        <Divider />

        {selectedClient && (
          <>
            <View py={10} px={10}>
              <Heading size="sm">Select Programs For {selectedClient.name}</Heading>
              <Text>
                {selectedClient.name} will only have access to these programs during live sessions.
              </Text>
            </View>
            <ScrollView contentContainerStyle={{ marginHorizontal: 10 }}>
              <CheckboxGroup value={selectedPrograms} onChange={setSelectedPrograms}>
                <VStack space="md" p={4}>
                  {createdPrograms.programs?.map(program => (
                    <Checkbox key={program.uid} value={program.uid}>
                      <CheckboxIndicator mr="$2">
                        <CheckboxIcon as={CheckIcon} />
                      </CheckboxIndicator>
                      <CheckboxLabel>{program.metadata.name}</CheckboxLabel>
                    </Checkbox>
                  ))}
                </VStack>
              </CheckboxGroup>
            </ScrollView>
          </>
        )}

        <View style={styles.buttonContainer}>
          {selectedClient && (
            <Button onPress={() => {
              handleSaveLinkedPrograms()
              bottomSheetRef.current?.snapToIndex(0)
            }} mt={4}>
              <ButtonText>Save</ButtonText>
            </Button>
          )}
          {hasClose && (
            <Button variant="outline" onPress={onClose} mt={4}>
              <ButtonText>Close</ButtonText>
            </Button>
          )}
        </View>
      </SafeAreaView>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  bottomSheetContainer: {
    padding: 20,
    flex: 1,
    backgroundColor: '#FFF',
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 10,
    alignSelf: 'center',
    width: screenWidth - 20,
  },
});