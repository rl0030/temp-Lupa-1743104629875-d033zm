import React, {useState, useEffect, useCallback, useMemo} from 'react';
import {View, Pressable, StyleSheet, ScrollView, FlatList} from 'react-native';
import {
  Box,
  HStack,
  Input,
  InputField,
  ModalBody,
  ModalContent,
  ModalFooter,
  Button,
  ButtonText,
  Modal,
  ModalHeader,
  Text,
  VStack,
  Icon,
  InputIcon,
  InputSlot,
  SearchIcon,
} from '@gluestack-ui/themed';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import * as ImagePicker from 'react-native-image-picker';
import {Exercise} from '../../types/program';
import Video from 'react-native-video';
import LoaderKit from 'react-native-loader-kit';
import {screenWidth} from '../../constant/size';
import debounce from 'lodash/debounce';
import ExerciseAutocomplete from './ExerciseAutoComplete';
import { useFetchExerciseLibraryWithRedux } from '../../hooks/lupa/programs/useExerciseLibrary';

interface IExerciseDisplayProps {
  exercise: Exercise;
  editable: boolean;
  onSelectExerciseImage: (
    uuid: string,
    response: ImagePicker.ImagePickerResponse,
    setIsLoading: (isLoading: boolean) => void,
    isSuperset?: boolean,
  ) => void;
  onUpdateExerciseProperty: (
    exerciseUid: string,
    property: keyof Exercise,
    value: any,
    isSuperset: boolean,
  ) => void;
  onRemove: (exerciseUid: string) => void;
  onAddSuperset: (exerciseUid: string) => void;
  showBorder?: boolean;
  isSuperset: boolean;
}

const pressableColor = '$blue600';

function ExerciseDisplay(props: IExerciseDisplayProps) {
  const {
    exercise,
    editable,
    onSelectExerciseImage,
    onUpdateExerciseProperty,
    onRemove,
    onAddSuperset,
    showBorder = true,
    isSuperset,
  } = props;

  if (!exercise) {
    return null;
  }

  const [imageLoading, setImageLoading] = useState<boolean>(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingProperty, setEditingProperty] = useState<keyof Exercise | null>(null);
  const [editingValue, setEditingValue] = useState('');
  const [localExerciseName, setLocalExerciseName] = useState(exercise.name);
  const [selectedExercise, setSelectedExercise] = useState<Exercise | null>(null);
  const [isLibraryModalVisible, setIsLibraryModalVisible] = useState(false);
  const { data: exerciseLibrary } = useFetchExerciseLibraryWithRedux();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    setLocalExerciseName(exercise.name);
  }, [exercise.name]);

  const debouncedUpdateName = useCallback(
    debounce((value: string) => {
      onUpdateExerciseProperty(exercise.unique_uid, 'name', value, isSuperset);
    }, 300),
    [exercise.unique_uid, onUpdateExerciseProperty, isSuperset]
  );

  const handlePropertyChange = useCallback(
    (property: keyof Exercise, value: any) => {
      onUpdateExerciseProperty(
        exercise.unique_uid,
        property,
        value,
        isSuperset,
      );
    },
    [exercise.unique_uid, onUpdateExerciseProperty, isSuperset],
  );

  const openModal = (property: keyof Exercise) => {
    setEditingProperty(property);
    setEditingValue(String(exercise[property] || ''));
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setEditingProperty(null);
    setEditingValue('');
  };

  const saveModal = () => {
    if (editingProperty) {
      handlePropertyChange(editingProperty, editingValue);
    }
    closeModal();
  };

  const renderExerciseMedia = useMemo(() => {
    if (imageLoading) {
      return (
        <Box
          style={{
            width: 86,
            backgroundColor: '#FFF',
            height: 86,
            borderRadius: 10,
            borderColor: '#000',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
          <LoaderKit
            style={{width: 25, height: 25}}
            name={'BallBeat'}
            color={'#1A9DFD'}
          />
        </Box>
      );
    }

    if (exercise.media_uri_as_base64) {
      return (
        <View style={{borderRadius: 10, width: 86, height: 86}}>
          <Video
            source={{
              uri: exercise.media_uri_as_base64,
            }}
            style={styles.video}
            resizeMode="cover"
            muted={true}
            playInBackground={false}
            rate={0.0}
          />
        </View>
      );
    }

    return (
      <Box
        bgColor="grey"
        style={{
          width: 86,
          height: 86,
          borderRadius: 10,
          borderColor: '#000',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
        {editable && <EvilIcons name="plus" size={80} color="#1A9DFD" />}
      </Box>
    );
  }, [imageLoading, exercise.media_uri_as_base64, editable]);

  const handleImagePicker = useCallback(async () => {
    await ImagePicker.launchImageLibrary(
      {selectionLimit: 1, mediaType: 'video', includeBase64: true},
      response =>
        onSelectExerciseImage(
          exercise.unique_uid,
          response,
          setImageLoading,
          isSuperset,
        ),
    );
  }, [exercise.unique_uid, onSelectExerciseImage, isSuperset]);

  const containerStyle = useMemo(
    () => ({
      ...styles.containerWrapper,
      borderRadius: 10,
      borderWidth: showBorder ? 1 : 0,
      borderColor: showBorder ? '#BDBDBDB2' : 'transparent',
      marginBottom: 10,
    }),
    [showBorder],
  );

  const handleNameChange = useCallback((text: string) => {
    setLocalExerciseName(text)
    onUpdateExerciseProperty(exercise.unique_uid, 'name', text, isSuperset);
    setSelectedExercise(null);
  }, [exercise.unique_uid, onUpdateExerciseProperty, isSuperset]);

  const handleSelectExercise = useCallback((selected: Exercise) => {
    setSelectedExercise(selected);
    setLocalExerciseName(selected.name);
    onUpdateExerciseProperty(exercise.unique_uid, 'name', selected.name, isSuperset);
    onUpdateExerciseProperty(exercise.unique_uid, 'unique_uid', selected.unique_uid, isSuperset);
    onUpdateExerciseProperty(exercise.unique_uid, 'category', selected.category, isSuperset);
    
    if (selected.media_uri_as_base64) {
      onUpdateExerciseProperty(exercise.unique_uid, 'media_uri_as_base64', selected.media_uri_as_base64, isSuperset);
    }
  }, [exercise.unique_uid, onUpdateExerciseProperty, isSuperset]);

  const handleOpenLibraryModal = () => {
    setIsLibraryModalVisible(true);
  };

  const handleCloseLibraryModal = () => {
    setIsLibraryModalVisible(false);
    setSearchTerm('');
    setSelectedCategory(null);
  };

  const handleSelectLibraryExercise = (selected: Exercise) => {
    setSelectedExercise(selected)
    handleSelectExercise(selected);
    handleCloseLibraryModal();
  };

  const groupedExercises = useMemo(() => {
    const grouped = {};
    Object.entries(exerciseLibrary || {}).forEach(([category, exercises]) => {
      grouped[category] = exercises;
    });
    return grouped;
  }, [exerciseLibrary]);

  const filteredExercises = useMemo(() => {
    let filtered = Object.entries(groupedExercises);
    
    if (selectedCategory) {
      filtered = filtered.filter(([category]) => category === selectedCategory);
    }

    if (searchTerm) {
      filtered = filtered.map(([category, exercises]) => [
        category,
        exercises.filter((exercise: Exercise) =>
          exercise.name.toLowerCase().includes(searchTerm.toLowerCase())
        ),
      ]);
    }

    return filtered;
  }, [groupedExercises, selectedCategory, searchTerm]);

  const renderCategoryItem = useCallback(({ item: [category, exercises] }: any) => (
    <VStack space="sm" mb={4}>
      <Text fontWeight="bold" fontSize={16} color="#2D8BFA">
        {category}
      </Text>
      {(exercises as Exercise[]).map((exercise: Exercise) => (
        <Pressable
          key={exercise.unique_uid}
          onPress={() => handleSelectLibraryExercise(exercise)}
          style={styles.exerciseItem}
        >
          <Text fontSize={14} color="$gray800">{exercise.name}</Text>
        </Pressable>
      ))}
    </VStack>
  ), [handleSelectLibraryExercise]);

  return (
    <Box>
      {selectedExercise && (
        <HStack style={{ paddingHorizontal: 40}} alignItems='center' justifyContent='space-between'>
          <Text color='#2D8BFA' fontSize={14}>
            {selectedExercise.name} - {selectedExercise.category || ''}
          </Text>
          <Button variant='link' onPress={handleOpenLibraryModal}>
            <ButtonText style={{ textDecorationLine: 'underline'}} color='#2D8BFA' fontWeight='400' fontSize={12}>
              Is this not matching?
            </ButtonText>
          </Button>
        </HStack>
      )}
   
      <View style={containerStyle}>
        {editable && !isSuperset && (
          <MaterialIcon
            onPress={() => onRemove(exercise.unique_uid)}
            style={styles.removeIcon}
            size={28}
            color="red"
            name="remove-circle"
          />
        )}
        <View style={styles.container}>
          <HStack alignItems='center'>
            <VStack alignItems="center">
              <Box style={{ marginBottom: 6 }}>
                <ExerciseAutocomplete
                  value={exercise.name}
                  onChangeText={handleNameChange}
                  onSelectExercise={handleSelectExercise}
                />
              </Box>

              <Pressable
                disabled={imageLoading || editable === false}
                onPress={handleImagePicker}>
                {renderExerciseMedia}
              </Pressable>
            </VStack>

            <VStack marginLeft={12}>
              <Pressable onPress={() => openModal('sets')}>
                <HStack alignItems="center">
                  <Text sx={{width: 50, color: '#FFF', fontSize: 18}}>
                    Sets:{' '}
                  </Text>
                  <Text color={pressableColor}>{exercise.sets || 0}</Text>
                </HStack>
              </Pressable>

              <Pressable onPress={() => openModal('reps')}>
                <HStack alignItems="center">
                  <Text sx={{width: 50, color: '#FFF', fontSize: 18}}>
                    Reps:{' '}
                  </Text>
                  <Text color={pressableColor}>{exercise.reps || 0}</Text>
                </HStack>
              </Pressable>
            </VStack>
          </HStack>

          <VStack space="md">
            <Pressable onPress={() => openModal('resttime')}>
              <Text sx={{color: pressableColor}}>
                Rest Time ({exercise.resttime || 0}s)
              </Text>
            </Pressable>

            <Pressable onPress={() => openModal('tempo')}>
              <Text sx={{color: pressableColor}}>
                Tiempo ({exercise?.tempo || '0-0-0'})
              </Text>
            </Pressable>

            <Pressable onPress={() => openModal('weight_in_pounds')}>
              <Text sx={{color: pressableColor, width: 90}}>
                {exercise?.weight_in_pounds
                  ? `${exercise?.weight_in_pounds} lbs`
                  : 'Intensity % / Weight lbs'}
              </Text>
            </Pressable>
          </VStack>
        </View>

        {exercise.superset && (
          <View style={styles.supersetContainer}>
            <ExerciseDisplay
              showBorder={false}
              exercise={exercise.superset}
              editable={editable}
              onSelectExerciseImage={onSelectExerciseImage}
              onUpdateExerciseProperty={onUpdateExerciseProperty}
              onRemove={() => handlePropertyChange('superset', null)}
              onAddSuperset={() => {}} 
              isSuperset={true}
            />
          </View>
        )}

        {editable && !exercise.superset && !isSuperset && (
          <MaterialIcon
            onPress={() => onAddSuperset(exercise.unique_uid)}
            style={styles.addIcon}
            size={28}
            color="#2D8BFA"
            name="add-circle"
          />
        )}

        <Modal isOpen={modalVisible} onClose={closeModal}>
          <ModalContent>
            <ModalHeader>
              <Text>Edit {editingProperty}</Text>
            </ModalHeader>
            <ModalBody>
              <Input>
                <InputField
                  value={editingValue}
                  onChangeText={setEditingValue}
                  keyboardType={
                    editingProperty === 'name' ? 'default' : 'numeric'
                  }
                />
              </Input>
            </ModalBody>
            <ModalFooter>
              <HStack alignItems="center" space="md">
                <Button style={{borderRadius: 10}} onPress={closeModal}>
                  <ButtonText>Cancel</ButtonText>
                </Button>
                <Button style={{borderRadius: 10}} onPress={saveModal}>
                  <ButtonText>Save</ButtonText>
                </Button>
              </HStack>
            </ModalFooter>
          </ModalContent>
        </Modal>

        <Modal isOpen={isLibraryModalVisible} onClose={handleCloseLibraryModal} size="full">
          <ModalContent>
            <ModalHeader>
              <Text fontSize={20} fontWeight="bold">Exercise Library</Text>
            </ModalHeader>
            <ModalBody>
              <VStack space="md" mb={4}>
              <Input >
                  <InputField
                  style={{ paddingLeft: 5}}
                    placeholder="Search exercises"
                    value={searchTerm}
                    onChangeText={setSearchTerm}
                  />
                </Input>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <HStack space="sm">
                    <Button
                      size="sm"
                      variant='link'
                      onPress={() => setSelectedCategory(null)}
                    >
                      <ButtonText style={{ color: selectedCategory === null ? "#2D8BFA" : "black"}}>All</ButtonText>
                    </Button>
                    {Object.keys(groupedExercises).map((category) => (
                      <Button
                        key={category}
                        size="sm"
                        variant="link"
                        onPress={() => setSelectedCategory(category)}
                      >
                        <ButtonText style={{ color: selectedCategory === category ? "#2D8BFA" : "black"}}>{category}</ButtonText>
                      </Button>
                    ))}
                  </HStack>
                </ScrollView>
              </VStack>
              <FlatList
                data={filteredExercises}
                renderItem={renderCategoryItem}
                keyExtractor={([category]) => category}
                style={styles.libraryScrollView}
              />
            </ModalBody>
            <ModalFooter>
              <Button onPress={handleCloseLibraryModal}>
                <ButtonText>Close</ButtonText>
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </View>
    </Box>
  );
}

const styles = StyleSheet.create({
  containerWrapper: {
    width: screenWidth - 70,
    alignSelf: 'center',
    padding: 10,
    paddingBottom: 30,
  },
  container: {
    alignItems: 'center',
    flexDirection: 'row',
    position: 'relative',
    justifyContent: 'space-evenly',
  },
  video: {
    width: 86,
    overflow: 'hidden',
    height: 86,
    borderRadius: 8,
  },
  supersetSeparator: {
    height: 1,
    backgroundColor: '#2D8BFA',
    width: '100%',
    marginVertical: 5,
  },
  removeIcon: {
    position: 'absolute',
    top: -10,
    right: -10,
    zIndex: 1,
  },
  addIcon: {
    position: 'absolute',
    bottom: -10,
    right: -10,
  },
  supersetContainer: {},
  libraryScrollView: {
    maxHeight: 400,
  },
  exerciseItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});

export default ExerciseDisplay;