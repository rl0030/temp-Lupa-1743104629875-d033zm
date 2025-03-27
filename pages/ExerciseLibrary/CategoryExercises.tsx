import React, {FC, useCallback, useEffect, useMemo, useRef, useState} from 'react';
import {
  Box,
  VStack,
  Heading,
  Input,
  Button,
  ButtonText,
  InputField,
} from '@gluestack-ui/themed';
import {useNavigation} from '@react-navigation/native';
import {
  Pressable,
  Image,
  Text,
  SafeAreaView,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import Background from '../../components/Background';
import useExerciseLibrary, {useFetchExerciseLibrary, useFetchExerciseLibraryWithRedux} from '../../hooks/lupa/programs/useExerciseLibrary';
import {Exercise, ExerciseCategory} from '../../types/program';
import ScrollableHeader from '../../components/ScrollableHeader';
import {PlusIcon} from '../../assets/icons/activities';
import BottomSheet, {BottomSheetBackdrop} from '@gorhom/bottom-sheet';
import {launchImageLibrary} from 'react-native-image-picker';
import OutlinedText from '../../components/Typography/OutlinedText';
import { auth } from '../../services/firebase';
import { storeMediaFromUri, uploadProgramAssetToFirebaseStorage } from '../../services/firebase/storage';
import uuid from 'react-native-uuid';
import Video from 'react-native-video';

const CategoryExercises: FC<{
  route: {params: {category: ExerciseCategory}};
}> = ({route}) => {
  const {category} = route.params;
  const navigation = useNavigation();
  const {data: exerciseLibrary, refetch: onRefetchExerciseLibrary} =
    useFetchExerciseLibrary([category]);
  const [newExercise, setNewExercise] = useState<Partial<Exercise>>({category, unique_uid: uuid.v4() });
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const bottomSheetRef = useRef<BottomSheet>(null);
  const snapPoints = useMemo(() => ['55%', '75%'], []);

  const categoryExercises = exerciseLibrary?.[category] || [];
 
  const handleSheetChanges = useCallback((index: number) => {

  }, []);

  useEffect(() => {
    onRefetchExerciseLibrary()
  }, [])

  const renderBackdrop = useCallback(
    props => (
      <BottomSheetBackdrop
        {...props}
        disappearsOnIndex={0}
        appearsOnIndex={1}
      />
    ),
    [],
  );

  const openVideoPicker = async () => {
    const options = {
      mediaType: 'video',
      videoQuality: 'medium', 
    };

    launchImageLibrary({ ...options, includeBase64: true }, async response => {
     
      if (response.didCancel) {
  
      } else if (response.errorMessage) {

      } else if (response.assets && response.assets[0]?.uri) {

        const uri = await uploadProgramAssetToFirebaseStorage(response.assets[0], "", "", 0, 0)

        setSelectedImage(uri); // We'll keep this name for consistency, but it now holds a video URI
        setNewExercise(prev => ({...prev, media_uri_as_base64: uri}));
      }
    });
  };

  const { refetch: onRefetchLibraryPersistence } = useFetchExerciseLibraryWithRedux()
  const { addExercise } = useExerciseLibrary()

  const handleAddExercise = () => {
    // Implement the logic to add the exercise to your library
    console.log('New exercise:', newExercise);
    addExercise(auth?.currentUser?.uid, category, newExercise.name, newExercise.description, newExercise.media_uri_as_base64, newExercise?.unique_uid).catch((error) => {
        console.error(error)
    }).then(() => {
        onRefetchLibraryPersistence()
    })


    bottomSheetRef.current?.close();
    // Reset form and selected image
    setNewExercise({category});
    setSelectedImage(null);
  };

  const renderExerciseItem = ({item: exercise}) => (
    <Pressable
    style={{ width: '48%' }}
      onPress={() => {
        /* Handle exercise selection */
      }}>
      <Box height={80} width="100%" marginBottom={4} borderRadius={10} overflow="hidden">
        {exercise.media_uri_as_base64 ? (
          <Video
            source={{uri: exercise.media_uri_as_base64}}
            style={{width: '100%', height: 100}}
            resizeMode="cover"
            paused={true} // Paused by default
          />
        ) : (
          <Box width="100%" height={100} backgroundColor="gray.200" alignItems="center" justifyContent="center">
            <Text>No Video</Text>
          </Box>
        )}
        <Text style={styles.exerciseName}>{exercise.name}</Text>
      </Box>
    </Pressable>
  );

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <ScrollableHeader showBackButton />
        <VStack padding={4} space={4}>
          <Heading
            px={10}
            py={5}
            fontSize={28}
            fontWeight="900"
            color="rgba(67, 116, 170, 0.7)">
            {category} Exercises
          </Heading>
          <FlatList
            style={{padding: 10}}
            data={[
              ...categoryExercises,
              {name: 'Add New', isPlaceholder: true},
            ]}
            renderItem={({item}) =>
              item.isPlaceholder ? (
                <Pressable
                  style={{width: '48%', marginVertical: 5}}
                  onPress={() => bottomSheetRef.current?.expand()}>
         
                  <Box style={styles.addButton}>
                    <Box style={styles.plusIconContainer}>
                      <PlusIcon color="#1A9DFD" />
                    </Box>
                  </Box>
                </Pressable>
              ) : (
                renderExerciseItem({item})
              )
            }
            keyExtractor={item => item.uid || 'new'}
            numColumns={2}
            columnWrapperStyle={{justifyContent: 'space-between'}}
          />
        </VStack>

        <BottomSheet
          ref={bottomSheetRef}
          index={-1}
          snapPoints={snapPoints}
          onChange={handleSheetChanges}
          backdropComponent={renderBackdrop}
          enablePanDownToClose>
          <VStack padding={4} flex={1} justifyContent="space-between">
            <VStack space={4}>
              <Heading alignSelf='center' pb={10} fontSize={20} fontWeight="700">
                Add a New {category} Exercise
              </Heading>
              <Pressable onPress={openVideoPicker} style={styles.videoSelector}>
              {selectedImage ? (
                <Video
                  source={{uri: selectedImage}}
                  style={styles.selectedVideo}
                  resizeMode="cover"
                  paused={true}
                />
              ) : (
                <Box style={styles.plusIconContainer}>
                  <PlusIcon color="#1A9DFD" />
                </Box>
              )}
            </Pressable>
              <VStack space="md">
                <Input>
                  <InputField
                    value={newExercise.name}
                    placeholder="Exercise Name"
                    onChangeText={text =>
                      setNewExercise(prev => ({...prev, name: text}))
                    }
                  />
                </Input>
                <Input>
                  <InputField
                    placeholder="Exercise Description"
                    value={newExercise.description}
                    onChangeText={text =>
                      setNewExercise(prev => ({...prev, description: text}))
                    }
                  />
                </Input>
              </VStack>
            </VStack>
            <Button
              action="positive"
              style={{
                height: 70,

                backgroundColor: '#2D8BFA',
                borderColor: 'rgba(0, 0, 0, 1)',
              }}
              onPress={handleAddExercise}>
              <ButtonText>
                <OutlinedText
                  style={{fontSize: 25, fontWeight: '800'}}
                  fontSize={25}
                  textColor="white"
                  outlineColor="black">
                  Add Exercise
                </OutlinedText>
              </ButtonText>
            </Button>
          </VStack>
        </BottomSheet>
      </SafeAreaView>
    </Background>
  );
};

const styles = StyleSheet.create({
  exerciseName: {
    color: 'white',
    padding: 8,
    backgroundColor: 'rgba(0,0,0,0.5)',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  categoryText: {
    fontSize: 12,
    color: '#1A9DFD',
    paddingVertical: 2,
    paddingHorizontal: 6,
  },
  addButton: {
    height: 80,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    borderColor: 'white',
    borderWidth: 1,
    borderRadius: 10,
    overflow: 'hidden',
  },
  plusIconContainer: {
    borderRadius: 99,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 5,
    borderWidth: 1,
    borderColor: '#1A9DFD',
  },
  imageSelector: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#eee',
  },
  selectedImage: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  buttonText: {
    color: 'white',
    fontWeight: 'bold',
  },
  videoSelector: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: '#eee',
  },
  selectedVideo: {
    width: '100%',
    height: '100%',
    borderRadius: 10,
  },
  uploadText: {
    marginTop: 8,
    fontSize: 16,
    color: '#1A9DFD',
  },
});

export default CategoryExercises;
