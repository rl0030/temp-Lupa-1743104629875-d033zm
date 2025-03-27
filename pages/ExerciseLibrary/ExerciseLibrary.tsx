import React, {FC, useEffect, useMemo} from 'react';
import {
  Heading,
  SafeAreaView,
  Text,
  Box,
  HStack,
  Image,
  ScrollView,
} from '@gluestack-ui/themed';
import Background from '../../components/Background';
import {Pressable, StyleSheet} from 'react-native';
import {Exercise, ExerciseCategory} from '../../types/program';
import {useNavigation} from '@react-navigation/native';
import {useFetchExerciseLibrary} from '../../hooks/lupa/programs/useExerciseLibrary';
import {enumToArray} from '../../util/js';
import ScrollableHeader from '../../components/ScrollableHeader';
import Video from 'react-native-video'
interface IExerciseLibraryProps {
  isOpenForSelection?: boolean;
  onSelectExercise?: (exercise: Exercise) => void;
}

const ExerciseLibrary: FC<IExerciseLibraryProps> = props => {
  const navigation = useNavigation();
  const {data: exerciseLibrary, refetch: onRefetchExerciseLibrary} =
    useFetchExerciseLibrary();
  const {isOpenForSelection = false, onSelectExercise} = props;
  const exerciseCategoryValues = useMemo(
    () => enumToArray(ExerciseCategory),
    [],
  );
  console.log(exerciseLibrary);
  useEffect(() => {
    onRefetchExerciseLibrary();
  }, []);
  const onSelect = (exercise: Exercise) => {
    if (isOpenForSelection && onSelectExercise) {
      onSelectExercise(exercise);
      navigation.goBack();
    }
  };

  const navigateToCategory = (category: ExerciseCategory) => {
    navigation.navigate('CategoryExercises', {category});
  };

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
      <ScrollView>
        <ScrollableHeader showBackButton />
        <Heading
          p={10}
          style={{fontSize: 28, fontWeight: '900'}}
          color="rgba(67, 116, 170, 0.7)">
          My Exercise Library
        </Heading>

        <HStack flexWrap="wrap" space="xs" justifyContent="space-evenly">
          {exerciseCategoryValues.map(category => {
            const exercisesInCategory = exerciseLibrary?.[category] || [];
            const firstExerciseInCategory = exercisesInCategory[0] || null;

            return (
              <Pressable
                key={category}
                style={{width: '46%'}}
                onPress={() => navigateToCategory(category)}>
                <Box style={{width: '100%'}}>
                  <Text py={5} fontSize={12} color="$blue500">
                    {category}
                  </Text>
                  <Box
                    style={{
                      height: 80,
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: '100%',
                      borderColor: 'white',
                      borderWidth: 1,
                      borderRadius: 10,
                      overflow: 'hidden',
                    }}>
                    {exercisesInCategory &&
                    firstExerciseInCategory &&
                    firstExerciseInCategory?.media_uri_as_base64 ? (
                      <Video
                      source={{
                        uri: firstExerciseInCategory.media_uri_as_base64,
                      }}
                      style={styles.videoThumbnail}
                      resizeMode="cover"
                      paused={true}
                      muted={true}
                      repeat={true}
                    />
                    ) : (
                      <Text color="$blue500">No exercises</Text>
                    )}
                  </Box>
                </Box>
              </Pressable>
            );
          })}
        </HStack>
        </ScrollView>
      </SafeAreaView>
      
    </Background>
  );
};

const styles = StyleSheet.create({
  videoThumbnail: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
});

export default ExerciseLibrary;
