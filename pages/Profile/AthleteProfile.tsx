import React, {useEffect, useState} from 'react';
import Background from '../../components/Background';
import {
  ActionSheetIOS,
  Platform,
  Pressable,
  SafeAreaView,
  StyleSheet,
} from 'react-native';
import globalStyles from '../../styles';
import {ButtonGroup, Chip, Divider} from '@rneui/themed';
import {screenWidth} from '../../constant/size';
import FeatherIcon from 'react-native-vector-icons/Feather';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {auth, db} from '../../services/firebase';
import {LupaUser} from '../../types/user';
import {
  Heading,
  ScrollView,
  VStack,
  Text,
  HStack,
  AvatarFallbackText,
  View,
  Input,
  InputField,
  Avatar,
  Icon,
  Textarea,
  TextareaInput,
  Box,
  CheckIcon,
  Checkbox,
  CheckboxIcon,
  CheckboxIndicator,
  CheckboxLabel,
  ButtonText,
  Button,
  SettingsIcon,
  AvatarImage,
  AddIcon,
  FavouriteIcon,
  ButtonIcon,
  Image,
} from '@gluestack-ui/themed';
import useUser from '../../hooks/useAuth';
import {useNavigation, useRoute} from '@react-navigation/native';
import AvailabilityForm from '../../containers/TrainerCalendar/AvailabilityForm';
import usePrograms from '../../hooks/lupa/usePrograms';
import {blockUser, isUserBlocked, unblockUser} from '../../api/user';
import {ProfileMode} from '../../util/mode';
import UserHeader from '../../containers/UserHeader';
import EnhancedButton from '../../components/Button/GluestackEnhancedButton';
import {doc, updateDoc} from 'firebase/firestore';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import useUserPosition from '../../hooks/useUserPosition';
import {getCityName} from '../../util/location';
import {requestLocationPermission} from '../../util/permissions';
import {format} from 'date-fns';
import EmailIcon from '../../assets/icons/EmailIcon.png'

interface IAthleteProfileProps {}

export default function AthleteProfile(
  props: IAthleteProfileProps,
): React.ReactNode {
  const navigation = useNavigation();
  const {navigate} = navigation;



  const route = useRoute();
  const {uid, mode} = route.params as {uid: string; mode: ProfileMode};
  const {data: lupaUser, refetch} = useUser(uid);
  const {data: viewerData} = useUser(auth?.currentUser?.uid as string);

  const [isFavorited, setIsFavorited] = useState(false);
  const toggleFavorite = async () => {
    try {
      const currentUserUid = auth?.currentUser?.uid as string;
      const userRef = doc(db, 'users', currentUserUid);

      if (isFavorited) {
        // Remove from favorites
        await updateDoc(userRef, {
          interactions: {
            favorites: arrayRemove(uid),
          },
        });
      } else {
        // Add to favorites
        await updateDoc(userRef, {
          interactions: {
            favoritses: arrayUnion(uid),
          },
        });
      }

      // Toggle the local state
      setIsFavorited(!isFavorited);

      // Refetch user data
      refetch();
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  useEffect(() => {
    const checkFavoriteStatus = async () => {
      const currentUserUid = auth?.currentUser?.uid as string;
      const userDoc = await getDoc(doc(db, 'users', viewerData?.id));
      const userData = userDoc.data();
      setIsFavorited(userData?.favorite_trainers?.includes(uid) || false);
    };

    checkFavoriteStatus();
  }, [uid]);

  useEffect(() => {
    refetch();
  }, [uid, auth?.currentUser?.uid as string]);

  async function handleOnBlocked() {
    const checkBlockedStatus = await isUserBlocked(
      auth?.currentUser?.uid as string,
      uid,
    );

    if (checkBlockedStatus) {
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        navigation.navigate('Search');
      }
    }
  }

  const handleOnBlockUser = async (userToBlock: string) => {
    await blockUser(auth?.currentUser?.uid as string, userToBlock).then(() =>
      refetch(),
    );
  };

  // const handleUnblockUser = async () => {
  //   await unblockUser(auth?.currentUser?.uid as string, userToBlock).then(() => refetch());
  // };

  useEffect(() => {
    console.debug('Refreshing profile data');
    handleOnBlocked().then(() => {
      refetch();
    });
  }, [auth?.currentUser?.uid as string, uid]);

  const startChat = () => {
    navigation.navigate('PrivateChat', {userId: uid});
  };

  const isOwnerViewing: boolean = uid === (auth?.currentUser?.uid as string);

  const renderProfileInteractions = () => {
    //Check if the current user is viewing their profile
    if (isOwnerViewing) {
      return null;
    }

    return (
      <View style={{width: screenWidth - 20}}>
        <Divider style={{marginVertical: 10}} />

        <View style={styles.buttonRow}>
          {!isOwnerViewing && (
            <EnhancedButton
              textColor="white"
              outlineColor="black"
              outlineText
              fontSize={15}
              variant="solid"
              onPress={toggleFavorite}
              leftIcon={FavouriteIcon}
              leftIconColor="$red500"
              style={{flex: 1, backgroundColor: '#FCFF6A', borderRadius: 10}}>
              {isFavorited ? 'Unfavorite' : 'Favorite'}
            </EnhancedButton>
            // <Button
            //   style={{...styles.interactionButton, backgroundColor: '#FCFF6A'}}
            //   onPress={toggleFavorite}
            //   variant={'solid'}>
            //   <ButtonText>{isFavorited ? 'Unfavorite' : 'Favorite'}</ButtonText>
            // </Button>
          )}

          <Button style={{...styles.interactionButton, borderRadius: 10,  backgroundColor: 'rgba(0, 122, 255, 0.50)' }} onPress={startChat}>
          <Image source={EmailIcon} style={{ width: 30, height: 20}} />
          <ButtonText style={{ marginLeft: 4 }}>Message</ButtonText>
          </Button>
          <Button
            style={{...styles.interactionButton, maxWidth: 80, borderRadius: 10}}
            onPress={() => handleOnBlockUser(uid)}>
            <ButtonText style={{fontSize: 15}}>Block</ButtonText>
          </Button>
        </View>
      </View>
    );
  };

  const renderInteractions = () => {
    if (
      isOwnerViewing &&
      mode !== ProfileMode.Edit &&
      (!lupaUser?.biography || lupaUser?.biography?.trim().length === 0)
    ) {
      return;
    }

    return (
      <View style={[styles.section, styles.interactionSection]}>
        <HStack
          style={{width: '100%', paddingHorizontal: 20}}
          alignItems="center"
          justifyContent="space-between">
          {mode == ProfileMode.Edit ? (
            <UserHeader
              highlightAthlete
              photo_url={lupaUser?.picture}
              role={lupaUser?.role}
              name={lupaUser?.name}
              avatarProps={{size: 'md'}}
              username={lupaUser?.username}
            />
          ) : (
            <View style={{height: 0}}>
              {lupaUser?.biography && (
                <Text
                  style={{
                    textAlign: 'start',
                  }}>
                  {lupaUser?.biography ?? ''}
                </Text>
              )}
            </View>
          )}

          {mode == ProfileMode.Edit && (
            <Button
              onPress={onSaveEditProfile}
              size="sm"
              variant="contained"
              borderRadius={20}>
              <ButtonText>Save</ButtonText>
            </Button>
          )}
        </HStack>

        <Divider
          style={{marginVertical: 10, marginTop: 18}}
          bgColor="$grey200"
        />
        {renderProfileInteractions()}
        <Divider />
      </View>
    );
  };

  const [editProfileState, setEditProfileState] = useState({
    name: lupaUser?.name,
    aboutMe: lupaUser?.biography,
    email: lupaUser?.email,
    phone: lupaUser?.number,
    picture: '',
  });

  const onSaveEditProfile = () => {
    const {
      name,
      aboutMe,
      email,
      phone,
      hourlyTrainingRate,
      allowPackTraining,
      allow12SessionDiscount,
      picture,
    } = editProfileState;

    updateDoc(doc(db, 'users', lupaUser?.id), {
      name,
      biography: aboutMe ?? '',
      email,
      phone,
      picture,
    });

   

    navigation.goBack();
  };

  const handleImagePicker = () => {
    launchImageLibrary({mediaType: 'photo', includeBase64: true}, response => {
      if (response.assets && response.assets[0].base64) {
        updateProfilePicture(response.assets[0].base64);
      }
    });
  };

  const handleCameraCapture = () => {
    launchCamera({mediaType: 'photo', includeBase64: true}, response => {
      if (response.assets && response.assets[0].base64) {
        updateProfilePicture(response.assets[0].base64);
      }
    });
  };

  const updateProfilePicture = base64Image => {
    setEditProfileState(prevState => ({
      ...prevState,
      picture: `data:image/jpeg;base64,${base64Image}`,
    }));
  };

  const showImagePickerOptions = () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Take Photo', 'Choose from Library', 'Cancel'],
          cancelButtonIndex: 2,
        },
        buttonIndex => {
          if (buttonIndex === 0) {
            handleCameraCapture();
          } else if (buttonIndex === 1) {
            handleImagePicker();
          }
        },
      );
    } else {
      console.log('Action sheet not implemented for Android');
    }
  };

  async function checkLocationPermissions() {
    const isLocationPermitted = await requestLocationPermission();
    return isLocationPermitted; 
  }

  const {data: userPosition, refetch: onRefetchUserPosition} =
    useUserPosition();

  const [cityName, setCityName] = useState<string | null>(null);

  // Set the current user's city name
  async function getUserCityName() {
    const name = await getCityName();

    if (name) {
      setCityName(name);
    } else {
      setCityName(null);
    }
  }

  useEffect(() => {
    checkLocationPermissions().then(isPermitted => {
      if (isPermitted) {
        getUserCityName();
        onRefetchUserPosition();
      }
    });
  }, []);

  return (
    <Background>
      <SafeAreaView style={styles.safeAreaView}>
        <View style={{ flex: 1, width: screenWidth }}>


        <ScrollView contentContainerStyle={{ width: '100%' }}>
          <VStack space="xl" alignItems='flex-start' style={{ width: '100%' }}>
            {mode == ProfileMode.Normal && (
              <View style={[styles.row, styles.section]}>
                <Avatar size="md" style={{width: 116, height: 116}}>
                  <AvatarImage source={{uri: lupaUser?.picture}} />
                </Avatar>
                <View>
                  <HStack alignItems="center">
                    <Heading color="$white" size="xl">
                      Meet {lupaUser?.name}!
                    </Heading>
                  </HStack>
                  <Text
                    style={{
                      paddingVertical: 1.6,
                      color: '#BDBDBD',
                      fontStyle: 'normal',
                      fontWeight: '800',
                      lineHeight: '22px',
                    }}>
                    {lupaUser?.name}
                  </Text>
                  <Text
                    style={{
                      paddingVertical: 1.6,
                      color: '#BDBDBD',
                      fontSize: '22px',
                      fontStyle: 'normal',
                      fontWeight: '800',
                      lineHeight: '22px',
                    }}>
                    @{lupaUser?.username}
                  </Text>
                  <Text
                    style={{
                      paddingVertical: 1.6,
                      color: '#BDBDBD',
                      fontSize: '22px',
                      fontStyle: 'normal',
                      fontWeight: '800',
                      lineHeight: '22px',
                    }}>
                    {cityName}
                  </Text>
                  <Text
                    size="md"
                    style={{
                      paddingVertical: 1.6,
                      color: '#FFF',
                      fontStyle: 'normal',
                      fontWeight: '800',
                      lineHeight: '22px',
                    }}>
                  Athlete Since{' '}
                    {format(lupaUser?.time_created_utc ?? new Date(), "MMM ''yy")}
                  </Text>
                </View>
              </View>
            )}

            {renderInteractions()}

            {mode == ProfileMode.Normal ? (
              <View style={{ paddingHorizontal: 10}}>
                {lupaUser?.interest && (
                  <>
                    <Heading
                      color="$white"
                      style={{fontSize: 20, fontWeight: '800'}}>
                      {isOwnerViewing ? 'My ' : ''} Interest and Areas of Focus
                    </Heading>

                    <HStack space="sm" my={10} flexWrap='wrap'>
                      {lupaUser?.interest?.map(interest => (
                        <Chip
                          key={interest}
                          title={interest}
                          titleStyle={{
                            fontWeight: '800',
                            fontSize: 18,
                          }}
                          containerStyle={{
                            borderRadius: 10,
                          }}
                          buttonStyle={{
                            borderRadius: 10,
                            backgroundColor: 'rgba(30, 139, 12, 0.50)',
                            color: '#FFF',
                          }}
                        />
                      ))}
                    </HStack>
                  </>
                )}
              </View>
            ) : (
              <VStack space="xl" style={{width: '100%'}}>
                <View my={50} style={{width: '100%'}}>
                  <Avatar alignSelf="center" size="2xl">
                    <AvatarFallbackText>{lupaUser?.name}</AvatarFallbackText>
                    <AvatarImage source={{uri: lupaUser?.picture}} />
                  </Avatar>
                  <Button
                    onPress={showImagePickerOptions}
                    size="sm"
                    fontWeight="200"
                    variant="link">
                    <ButtonText>Edit</ButtonText>
                  </Button>
                </View>

                <Input
                  variant="rounded"
                  style={{borderRadius: 0, backgroundColor: '#FFF'}}>
                  <InputField
                    placeholder="Name"
                    value={editProfileState.name}
                    onChangeText={text =>
                      setEditProfileState({...editProfileState, name: text})
                    }
                  />
                </Input>

                <Textarea style={{borderRadius: 0, backgroundColor: '#FFF'}}>
                  <TextareaInput
                    placeholder="About me"
                    value={editProfileState.aboutMe}
                    onChangeText={text =>
                      setEditProfileState({
                        ...editProfileState,
                        aboutMe: text,
                      })
                    }
                  />
                </Textarea>

                <Input
                  variant="rounded"
                  style={{borderRadius: 0, backgroundColor: '#FFF'}}>
                  <InputField
                    placeholder="Edit Phone"
                    value={editProfileState.phone}
                    onChangeText={text =>
                      setEditProfileState({...editProfileState, phone: text})
                    }
                  />
                </Input>

                <Input
                  variant="rounded"
                  style={{borderRadius: 0, backgroundColor: '#FFF'}}>
                  <InputField
                    placeholder="Edit Email"
                    value={editProfileState.email}
                    onChangeText={text =>
                      setEditProfileState({...editProfileState, email: text})
                    }
                  />
                </Input>
              </VStack>
            )}
          </VStack>
        </ScrollView>
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    alignSelf: 'center',
    width: screenWidth,
  },
  icon: {
    marginRight: 30,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
  },
  section: {
    paddingVertical: 20,
    width: screenWidth - 20,
    alignSelf: 'center',
  },
  interactionSection: {
    backgroundColor: 'rgba(3, 6, 61, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    borderRadius: 10,
  },
  buttonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: screenWidth - 20,
  },
  button: {
    paddingHorizontal: 10,
    width: 160,
  },
  interactionButton: {
    flex: 1,
    marginHorizontal: 10,
    height: 32,
    borderRadius: 10,
    backgroundColor: 'rgba(0, 122, 255, 0.50)',
  },
});
