import React, {useCallback, useState} from 'react';
import Background from '../../components/Background';
import {
  SafeAreaView,
  ScrollView,
  View,
  Pressable,
  Text,
  HStack,
  VStack,
  Image,
  Input,
  Textarea,
  TextareaInput,
  InputField,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import ScrollableHeader from '../../components/ScrollableHeader';
import UserHeader from '../../containers/UserHeader';
import {useRecoilState} from 'recoil';
import {userDataAtom} from '../../state/recoil/userState';
import EvilIcons from 'react-native-vector-icons/EvilIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';
import SimpleIcons from 'react-native-vector-icons/SimpleLineIcons';
import Icon from 'react-native-vector-icons/Feather';
import LinearGradient from 'react-native-linear-gradient';
import * as ImagePicker from 'react-native-image-picker';
import {Alert, StyleSheet} from 'react-native';
import {Chip} from '@rneui/themed';
import {storeMediaFromBase64} from '../../services/firebase/storage';
import {screenWidth} from '../../constant/size';
import Barbell from '../../assets/icons/Barbell.png';
import SelectProgramCategories from '../../containers/modal/SelectProgramCategories';
import uuid from 'react-native-uuid';
import {OutlinedInput} from '../../components/Input/OutlinedInput';
import OutlinedText from '../../components/Typography/OutlinedText';
import {format} from 'date-fns';
import ShareArrowRight from '../../assets/icons/ShareArrowRight.png';
import Share from 'react-native-share';
import ExerciseDisplay from '../../containers/Exercise/ExerciseDisplay';
import ExerciseAssetDisplay from '../../containers/Exercise/ExerciseAssetDisplay';
import {Exercise} from '../../types/program';
import FeatherIcon from 'react-native-vector-icons/Feather';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useCreateDaily} from '../../hooks/activities/dailies';
import {Timestamp} from 'firebase/firestore';
import Video from 'react-native-video';
import useUser from '../../hooks/useAuth';
import { auth } from '../../services/firebase';

export enum DailiesMode {
  Create,
  View,
}

export interface DailyState {
  items: Array<any>;
  title: string;
  description: string;
  tags: Array<string>;
  media: string;
  trainer_uid: string;
  date?: Timestamp; // Added in API
  date_utc?: string; // Added in API
  date_only?: string; // Added in API
}

export default function Dailies() {
  const route = useRoute();
  const {mode} = route?.params;

  const {mutateAsync: onCreateDaily, isPending: isCreateDailyPending} =
    useCreateDaily();

  const [
    isSelectProgramCategoriesModalOpen,
    setSelectProgramCategoriesModalOpen,
  ] = useState(false);
 // const [lupaUserState, setLupaUserState] = useRecoilState(userDataAtom);
  const { data: lupaUserState } = useUser(auth?.currentUser?.uid as string)
  const [dailyState, setDailyState] = useState({
    items: [],
    title: '',
    description: '',
    tags: [],
    media: null,
    trainer_uid: lupaUserState?.uid,
  });

  const onCheckedCategoriesUpdated = (categories: Array<string>) => {
    setDailyState(prevState => ({
      ...prevState,
      tags: categories,
    }));
  };

  const selectDailyMedia = async () => {

    try {
      const cameraRollOptions: ImagePicker.ImageLibraryOptions = {
        mediaType: 'video',
        videoQuality: 'high',
        presentationStyle: 'fullScreen',
        selectionLimit: 1,
        includeBase64: true,
      };

      const {assets, didCancel, errorCode, errorMessage} =
        await ImagePicker.launchImageLibrary(cameraRollOptions);

      if (didCancel) return;

      if (errorCode || errorMessage) {
        throw new Error(errorCode);
      }

      if (Array.isArray(assets) && assets.length > 0) {
        const media: ImagePicker.Asset = assets[0];

        if (media?.uri) {
          const {uri} = media;
          const downloadUrl = await storeMediaFromBase64(
            uri,
            `dailies/main.mp4`,
          );
          setDailyState(prevState => ({
            ...prevState,
            media: downloadUrl,
          }));
        }
      }
    } catch (error) {
      console.error(error);
      Alert.alert('Error', 'Failed to select video');
    }
  };

  const renderMediaView = () => {
    return (
      <View style={styles.mediaContainer}>
         <View style={styles.shadowyView} />
        {dailyState.media != null ? (
          <Video
            style={styles.videoStyle}
            resizeMode="cover"
            source={{uri: dailyState.media}}
          />
        ) : (
          <Pressable
            style={styles.gradientContainer}
            onPress={selectDailyMedia}>
            <LinearGradient
              colors={['rgba(196, 196, 196, 0.74)', '#5E5E5E']}
              style={styles.gradientContent}>
              <SimpleIcons name="plus" size={80} color="#1A9DFD" />
            </LinearGradient>
          </Pressable>
        )}
       
        <View style={styles.userHeaderContainer}>
          <UserHeader
            size="large"
            role="trainer"
            name={lupaUserState?.name}
            photo_url={lupaUserState?.picture}
          />
        </View>
        <Image source={Barbell} style={styles.barbellIcon} />
      </View>
    );
  };

  const handleSaveExercise = () => {
    const exerciseUid = String(uuid.v4());
    const newExercise = {
      description: '',
      media_uri_as_base64: '',
      name: 'Exercise',
      uid: exerciseUid,
      unique_uid: String(uuid.v4()),
      intensity: 0,
      resttime: 30,
      weight_in_pounds: 0,
      sets: 3,
      reps: 3,
      tempo: '3-1-2',
    };

    setDailyState(prevState => ({
      ...prevState,
      items: [
        ...prevState.items,
        {
          type: 'exercise',
          data: newExercise,
          position: prevState.items.length,
        },
      ],
    }));
  };

  const onAddDailyMedia = async () => {
    try {
      const cameraRollOptions: ImagePicker.ImageLibraryOptions = {
        mediaType: 'video',
        videoQuality: 'high',
        presentationStyle: 'fullScreen',
        selectionLimit: 1,
        includeBase64: true,
      };

      const {assets, didCancel, errorCode, errorMessage} =
        await ImagePicker.launchImageLibrary(cameraRollOptions);

      if (didCancel) return;

      if (errorCode || errorMessage) {
        throw new Error(errorCode || errorMessage);
      }

      if (Array.isArray(assets) && assets.length > 0) {
        const media: ImagePicker.Asset = assets[0];
        const {uri} = media;
        if (!uri) {
          throw new Error('Invalid uri');
        }

        const downloadUrl = await storeMediaFromBase64(
          uri,
          `dailies/${lupaUserState?.uid}/${dailyState.title}-${Date.now()}.mp4`,
        );
        const newMediaItem = {
          id: String(uuid.v4()),
          type: 'asset',
          data: {uri: downloadUrl, id: String(uuid.v4())},
          position: dailyState.items.length,
        };

        setDailyState(prevState => ({
          ...prevState,
          items: [...prevState.items, newMediaItem],
        }));
      }
    } catch (error) {
      console.error('Error adding daily media:', error);
      Alert.alert('Error', 'Failed to add media. Please try again.');
    }
  };

  const renderSessionItems = () => {
    return (
      <VStack space="md">
        {dailyState.items
          .sort((a, b) => a.position - b.position)
          .map((item: Exercise | ImagePicker.Asset, index) => {
            if (item.type === 'exercise') {
              return (
                <View
                key={item.data.unique_uid}
                  style={styles.exerciseContainer}>
                  <ExerciseDisplay
                  isSuperset={false}
                    exercise={item.data}
                    onRemove={() => onRemoveSessionItem(item.position)}
                    editable={true}
                    onSelectExerciseImage={(uuid, response, setLoading) =>
                      onSelectExerciseImage(
                        uuid,
                        response,
                        setLoading,
                      )
                    }
                    onUpdateExerciseProperty={onUpdateExerciseProperty}
                  />
                </View>
              );
            } else if (item.type === 'asset') {
              return (
                <View
                  key={item.data.id || index}
                  style={{marginHorizontal: 20, borderRadius: 20}}>
                  <ExerciseAssetDisplay
                    editable={true}
                    onRemove={() => onRemoveSessionItem(item.position)}
                    media_uri_base_64={item.data.uri}
                  />
                </View>
              );
            }
            return null;
          })}
      </VStack>
    );
  };

  const onRemoveSessionItem = (itemPosition: number) => {
    setDailyState(prevState => ({
      ...prevState,
      items: prevState.items
        .filter(item => item.position !== itemPosition)
        .map((item, index) => ({...item, position: index})),
    }));
  };

  const onUpdateExerciseProperty = (
    exerciseUid: string,
    property: keyof Exercise,
    value: any,
  ) => {
    setDailyState(prevState => ({
      ...prevState,
      items: prevState.items.map(item => {
        if (item.type === 'exercise' && item.data.unique_uid === exerciseUid) {
          return {
            ...item,
            data: {
              ...item.data,
              [property]: value,
            },
          };
        }
        return item;
      }),
    }));
  };

  const onSelectExerciseImage = useCallback(async (
    exerciseUid: string,
    response: ImagePicker.ImagePickerResponse,
    setLoading: (isLoading: boolean) => void,
  ) => {
    setLoading(true);
    try {
      if (response.didCancel) {
        setLoading(false);
        return;
      }
  
      if (response.errorCode || response.errorMessage) {
        console.error(
          'Error selecting exercise image:',
          response.errorCode,
          response.errorMessage,
        );
        setLoading(false);
        return;
      }
  
      if (Array.isArray(response.assets) && response.assets.length > 0) {
        const asset = response.assets[0];
        const base64 = asset?.uri;
  
        if (base64) {
          const exerciseMediaUri = await storeMediaFromBase64(
            base64,
            `dailies/exercises/${exerciseUid}.mp4`,
          );
  
          setDailyState(prevState => ({
            ...prevState,
            items: prevState.items.map(item => {
              if (item.type === 'exercise' && item.data.unique_uid === exerciseUid) {
                return {
                  ...item,
                  data: {
                    ...item.data,
                    media_uri_as_base64: exerciseMediaUri,
                  },
                };
              }
              return item;
            }),
          }));
        }
      }
    } catch (error) {
      console.error('Error in onSelectExerciseImage:', error);
    }
    setLoading(false);
  }, []);

  const shareDaily = async () => {
    const shareOptions = {
      message: `Check out this awesome daily workout: ${dailyState.title}`,
      title: 'Share Daily Workout',
      url: `lupa://daily/${dailyState.id}`,
      type: 'image/jpeg',
      subject: 'New Daily Workout',
      failOnCancel: false,
      showAppsToView: true,
    };

    try {
      const result = await Share.open(shareOptions);
      console.log('Share result:', result);
    } catch (error) {
      if (error.message === 'User did not share') {
        console.log('User cancelled sharing');
      } else {
        console.error('Error sharing:', error.message);
      }
    }
  };

  const navigation = useNavigation();
  const handleSaveAndShare = async () => {
    const id = await onCreateDaily(dailyState);

    // Navigate Home
    navigation.navigate('Main');

    // Optionally, you can implement the share functionality here
    const shareOptions = {
      message: `Check out my daily.`,
      title: 'Share Bootcamp',
      url: `lupa://daily/${id}`,
      type: 'text/plain',
      subject: 'New Bootcamp',
    };

    try {
      const result = await Share.open(shareOptions);
      console.log('Share result:', result);
    } catch (error) {
      if (error.message === 'User did not share') {
        console.log('User cancelled sharing');
      } else {
        console.error('Error sharing:', error);
      }
    }
  };

  const isFormValid = () => {
    return (
      dailyState.media !== null &&
      dailyState.tags.length > 0 &&
      dailyState.description.trim() !== '' &&
      dailyState.items.length > 0
    );
  };

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <ScrollView>
          <ScrollableHeader showBackButton />
          <View style={styles.container}>
            <HStack alignItems="center" justifyContent="space-between">
              <OutlinedText
                textColor="black"
                outlineColor="white"
                fontSize={30}
                style={{paddingHorizontal: 5, fontWeight: '900'}}>
                {format(new Date(), 'EEEE, MMMM do')}
              </OutlinedText>

            </HStack>

            {renderMediaView()}

            <View style={{marginBottom: 6, minHeight: 20}}>
              <HStack space="md" flexWrap="wrap">
                <Chip
                  onPress={() => setSelectProgramCategoriesModalOpen(true)}
                  containerStyle={{
                    color: '#49BEFF',
                    borderColor: '#49BEFF',
                  }}
                  style={{color: '#49BEFF', borderColor: '#49BEFF'}}
                  titleStyle={{
                    color: '#49BEFF',
                    borderColor: '#49BEFF',
                  }}
                  type="outline"
                  title="Add Tags >"
                />
                {dailyState.tags.map((tag: string) => (
                  <Chip
                    key={tag}
                    title={tag}
                    size="sm"
                    titleStyle={{
                      color: '#BDBDBD',
                      fontSize: 16,
                      fontWeight: '600',
                    }}
                    type="outline"
                    containerStyle={{
                      borderColor: '#BDBDBD',
                      borderRadius: 0,
                      marginVertical: 1,
                      width: 'auto',
                    }}
                    buttonStyle={{
                      padding: 7,
                      borderRadius: 8,
                      color: '#BDBDBD',
                      borderColor: '#BDBDBD',
                    }}
                  />
                ))}
              </HStack>
            </View>

            <View style={{marginBottom: 16}}>
              <Textarea
                size="md"
                isReadOnly={false}
                isInvalid={false}
                isDisabled={false}
                width="100%"
                style={{
                  borderRadius: 15,
                  borderColor: 'rgba(189, 189, 189, 0.7)',
                  fontSize: 14,
                }}>
                <TextareaInput
                  style={{fontSize: 14}}
                  color="$white"
                  placeholderTextColor="#FFF"
                  placeholder="Add a brief daily description..."
                  value={dailyState.description}
                  onChangeText={text =>
                    setDailyState(prevState => ({
                      ...prevState,
                      description: text,
                    }))
                  }
                />
              </Textarea>
            </View>

            {renderSessionItems()}

            <View
              style={{
                alignItems: 'center',
                flexDirection: 'row',
                justifyContent: 'space-evenly',
                borderColor: 'rgba(189, 189, 189, 0.70)',
                borderWidth: 1,
                width: screenWidth - 30,
                alignSelf: 'center',
                height: 100,
                borderRadius: 10,
                marginTop: 20,
                marginBottom: 20,
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

              <Pressable onPress={onAddDailyMedia}>
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
          </View>

          <Button
  isDisabled={isCreateDailyPending || !isFormValid()}
  onPress={handleSaveAndShare}
  style={{
    alignSelf: 'center',
    width: screenWidth - 20,
    height: 44,
    borderColor: 'black',
    borderRadius: 12,
    borderWidth: 1,
    backgroundColor: isFormValid() ? 'rgba(73, 190, 255, 0.4)' : 'rgba(189, 189, 189, 0.4)',
  }}>
  <ButtonText>
    <OutlinedText
      textColor="white"
      outline="black"
      fontSize={30}
      style={{fontWeight: '800'}}>
      Save and Share
    </OutlinedText>
  </ButtonText>
</Button>
        </ScrollView>

        <SelectProgramCategories
          isOpen={isSelectProgramCategoriesModalOpen}
          onClose={() => setSelectProgramCategoriesModalOpen(false)}
          onCheckedCategoriesUpdated={onCheckedCategoriesUpdated}
        />
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
  },
  mediaContainer: {
    width: screenWidth - 20,
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  gradientContainer: {
    width: '100%',
    height: '100%',
  },
  gradientContent: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoStyle: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  shadowyView: {
    position: 'absolute',
    borderRadius: 8,
    top: 0,
    bottom: 0,
    right: 0,
    left: 0,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  userHeaderContainer: {
    position: 'absolute',
    bottom: 10,
    left: 10,
  },
  barbellIcon: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 45,
    height: 50,
  },
});
