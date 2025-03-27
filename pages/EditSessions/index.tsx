import React, { useCallback, useEffect, useState, useMemo, useLayoutEffect, memo } from 'react';
import {
  SafeAreaView,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
  Alert,
} from 'react-native';
import Background from '../../components/Background';
import {
  Box,
  Button,
  ButtonText,
  HStack,
  Heading,
  Text,
  VStack,
  Divider,
} from '@gluestack-ui/themed';
import { screenWidth } from '../../constant/size';
import { NavigationProp, useNavigation, useRoute } from '@react-navigation/native';
import LoadingScreen from '../../components/LoadingScreen';
import Icon from 'react-native-vector-icons/Feather';
import * as ImagePicker from 'react-native-image-picker';
import ExerciseDisplay from '../../containers/Exercise/ExerciseDisplay';
import ExerciseAssetDisplay from '../../containers/Exercise/ExerciseAssetDisplay';
import {
  uploadProgramAssetToFirebaseStorage,
  uploadVideoToStorage,
} from '../../services/firebase/storage';
import OutlinedText from '../../components/Typography/OutlinedText';
import SimpleIcons from 'react-native-vector-icons/SimpleLineIcons';
import ScrollableHeader from '../../components/ScrollableHeader';
import uuid from 'react-native-uuid'
import { ProgramProvider, useProgramOperations } from '../../context/ProgramProvider';
import { Exercise } from '../../types/program';
import { useFetchExerciseLibraryWithRedux } from '../../hooks/lupa/programs/useExerciseLibrary';
const weekNumbers = [
  'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen', 'Twenty',
];

interface EditSessionsProps {
  route: {
    params: {
      programId: string;
      weekIndex: number;
      sessionIndex: number;
    };
  };
  navigation: NavigationProp<any>;
}

function EditSessions() {
  const route = useRoute()
  const navigation = useNavigation()
  const { programId, weekIndex, sessionIndex } = route.params;

  const {
    program,
    isLoading,
    error,
    loadProgram,
    updateExercise,
    addExercise,
    saveProgram,
    removeExercise,
    addSuperset,
    removeSuperset,
    addAsset,
    removeAsset,
  } = useProgramOperations();
console.log(program?.weeks[0]?.sessions[0]?.items)
  const [localUpdateTrigger, setLocalUpdateTrigger] = useState(0);

  useEffect(() => {
    if (programId && (!program || program.uid !== programId)) {
      loadProgram(programId);
    }
  }, [programId, loadProgram, program]);

  const currentSession = useMemo(() => {

    if (!program || !program?.weeks || program?.weeks?.length <= weekIndex) {
     
      return null;
    }
    const week = program?.weeks[weekIndex];

    if (!week?.sessions || week?.sessions.length <= sessionIndex) {

      return null;
    }

    return week.sessions[sessionIndex];
  }, [programId, program, weekIndex, sessionIndex]);


  const handleSaveExercise = useCallback(() => {
    const programToUpdate = program;
    const newExercise: Exercise = {
      description: '',
      media_uri_as_base64: '',
      name: `Exercise ${programToUpdate?.weeks?.[weekIndex]?.sessions?.[sessionIndex]?.items?.length + 1 ?? ''}`,
      uid: programToUpdate?.uid,
      unique_uid: String(uuid.v4()),
      intensity: 0,
      resttime: 30,
      weight_in_pounds: 0,
      sets: 3,
      reps: 3,
      tempo: '3-1-2',
    };
  
    addExercise(weekIndex, sessionIndex, newExercise);
  }, [addExercise, weekIndex, sessionIndex, programId]);

  const onUpdateExerciseProperty = useCallback((
    exerciseId: string,
    property: string,
    value: any,
    isSuperset: boolean = false
  ) => {
    updateExercise(weekIndex, sessionIndex, exerciseId, { [property]: value });
  }, [updateExercise, weekIndex, sessionIndex]);

  const onSelectExerciseImage = useCallback(async (
    exerciseId: string,
    response: ImagePicker.ImagePickerResponse,
    setLoading: (isLoading: boolean) => void,
    isSuperset: boolean = false
  ) => {
    setLoading(true);
    try {
      if (Array.isArray(response.assets) && response.assets.length > 0) {
        const asset = response.assets[0];
        const base64 = asset?.base64;
        const isBase64Valid = !!base64;
  
        const exerciseMediaUri = await uploadVideoToStorage(
          `${programId}/exercises/${exerciseId}.mp4`,
          isBase64Valid ? base64 : asset?.uri,
        );
  
        updateExercise(weekIndex, sessionIndex, exerciseId, { media_uri_as_base64: exerciseMediaUri }, isSuperset);
      }
    } catch (error) {
      console.error("Error in onSelectExerciseImage:", error);
    }
    setLoading(false);

  }, [updateExercise, programId, weekIndex, sessionIndex]);

  const onAddProgramMedia = useCallback(async () => {
    try {
      const cameraRollOptions: ImagePicker.ImageLibraryOptions = {
        mediaType: 'video',
        videoQuality: 'high',
        presentationStyle: 'fullScreen',
        selectionLimit: 1,
        includeBase64: true,
      };
  
      const { assets, didCancel, errorCode } = await ImagePicker.launchImageLibrary(cameraRollOptions);
  
      if (didCancel || errorCode || !assets) return;
  
      const media = assets[0];
      const { uri } = media;
  
      if (!uri) throw new Error('Invalid uri');
  
      const downloadUrl = await uploadProgramAssetToFirebaseStorage(
       assets[0],
        programId,
        program?.name,
        weekIndex,
        sessionIndex,
      );
  
      addAsset(weekIndex, sessionIndex, { uri, downloadUrl });

    } catch (error) {
      console.error('Error adding program media:', error);
      Alert.alert('Error', 'Failed to add media. Please try again.');
    }
  }, [addAsset, programId, weekIndex, sessionIndex]);

  const onAddSuperset = useCallback((parentExerciseId: string) => {
    const newExercise = {
      description: '',
      media_uri_as_base64: '',
      name: 'Superset Exercise',
      program_uid: programId,
      intensity: 0,
      resttime: 0,
      weight_in_pounds: 0,
      sets: 0,
      reps: 0,
      tempo: '0-0-0',
    };
    
    addSuperset(weekIndex, sessionIndex, parentExerciseId, newExercise);

  }, [addSuperset, weekIndex, sessionIndex, programId]);

  const renderWeekSessions = () => (
    <View style={{ width: screenWidth - 20, alignSelf: 'center' }}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <HStack alignItems="flex-start" space="lg">
          <OutlinedText
            textColor="#03063D"
            fontSize={22}
            style={{ fontWeight: '900' }}
            outlineColor="white">
            Week {weekNumbers[weekIndex] || weekIndex + 1}
          </OutlinedText>
  
          {program?.weeks[weekIndex]?.sessions.map((session, index) => (
            <Pressable
              key={index}
              style={styles.sessionButton}
              onPress={() => {
                navigation.navigate('EditSessions', {
                  programId: programId,
                  weekIndex: weekIndex,
                  sessionIndex: index,
                });
              }}>
              <Box
                width={50}
                height={50}
                borderRadius={10}
                borderWidth={1}
                bg={index === sessionIndex ? 'rgba(255, 255, 255, 0.3)' : 'rgba(255, 255, 255, 0.1)'}
                justifyContent="center"
                alignItems="center"
                position='relative'>
                <Text
                  bottom={5}
                  right={6}
                  position='absolute'
                  color={index === sessionIndex ? '#FFFFFF' : '#646464'}
                  fontSize={16}
                  fontWeight="bold">
                  {session.name}
                </Text>
              </Box>
            </Pressable>
          ))}
        </HStack>
      </ScrollView>
  
      <OutlinedText textColor="#03063D" outlineColor="white" fontSize={20}>
        Session {currentSession?.name}
      </OutlinedText>
      <Divider style={{ width: 90 }} />
    </View>
  );

  const renderSessionItems = useMemo(() => {
    if (!currentSession || !currentSession.items) {
      console.log('No current session or items');
      return null;
    }

    return (
      <VStack space="md">
        {currentSession.items
          .sort((a, b) => a.position - b.position)
          .map((item) => {
 
            if (item.type === 'exercise') {
              return (
                <View key={`${item.data.unique_uid}-${localUpdateTrigger}`} style={styles.exerciseContainer}>
                  <ExerciseDisplay
                    exercise={item.data}
                    onRemove={() => removeExercise(weekIndex, sessionIndex, item.data.unique_uid)}
                    editable={true}
                    onSelectExerciseImage={onSelectExerciseImage}
                    onUpdateExerciseProperty={onUpdateExerciseProperty}
                    onAddSuperset={() => onAddSuperset(item.data.unique_uid)}
                    isSuperset={false}
                  />
                </View>
              );
            } else if (item.type === 'asset') {
              return (
                <View key={`${item.data.id}-${localUpdateTrigger}`} style={{ marginHorizontal: 20, borderRadius: 20 }}>
                  <ExerciseAssetDisplay
                    editable={true}
                    onRemove={() => removeAsset(weekIndex, sessionIndex, item.data.id)}
                    media_uri_base_64={item.data.uri}
                  />
                </View>
              );
            }
            return null;
          })}
      </VStack>
    );
  }, [program?.uid, program, weekIndex, sessionIndex, removeExercise, onSelectExerciseImage, onUpdateExerciseProperty, onAddSuperset, removeAsset])

  if (!program || isLoading) {
    return <LoadingScreen />;
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error}</Text>
      </View>
    );
  }

  return (
    <Background>
      <SafeAreaView style={styles.safeArea}>
        <ScrollableHeader showBackButton />
        <VStack flex={1} space="md">
          <Heading
            color="$white"
            style={{
              borderColor: '#2D8BFA',
              borderWidth: 1,
              marginHorizontal: 10,
              marginVertical: 10,
              color: '#2D8BFA',
              fontSize: 30,
              borderRadius: 20,
              padding: 10,
            }}>
            {program?.metadata?.name || 'Unknown Program Name'}
          </Heading>

          {renderWeekSessions()}

          <ScrollView contentContainerStyle={{ paddingTop: 8 }} showsVerticalScrollIndicator={false}>
            {renderSessionItems}

            <View
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                borderColor: 'rgba(189, 189, 189, 0.70)',
                borderWidth: 1,
                width: screenWidth - 30,
                alignSelf: 'center',
                marginTop: 20,
                height: 100,
                borderRadius: 10,
                zIndex: 0,
              }}>
              <Pressable onPress={handleSaveExercise}>
                <VStack alignItems="center">
                  <Icon
                    name="plus"
                    color="#2D8BFA"
                    size={28}
                    style={{paddingVertical: 5}}
                  />
                  <Text style={{fontSize: 18}} color="#2D8BFA">
                    Add Exercises
                  </Text>
                </VStack>
              </Pressable>

              <Pressable onPress={onAddProgramMedia}>
                <VStack alignItems="center">
                  <SimpleIcons
                    name="picture"
                    color="#2D8BFA"
                    size={28}
                    style={{paddingVertical: 5}}
                  />
                  <Text color="#2D8BFA" style={{fontSize: 18}}>
                    Add Media
                  </Text>
                </VStack>
              </Pressable>
            </View>
          </ScrollView>
        </VStack>
      </SafeAreaView>
    </Background>
  );
}

export default EditSessions

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  exerciseContainer: {
    // Add styles for exercise container if needed
  },
  sessionButton: {
    // Add styles for session button if needed
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
  },
  errorText: {
    color: 'red',
    fontSize: 16,
    textAlign: 'center',
    marginHorizontal: 20,
  },
});