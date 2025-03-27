import React, {useState, useRef, useEffect} from 'react';
import {
  SafeAreaView,
  View,
  Text,
  VStack,
  Button,
  HStack,
  Textarea,
  TextareaInput,
  Box,
  Image,
  ImageBackground,
  ScrollView,
  ButtonText,
  Modal,
  ModalBody,
  CloseIcon,
  Heading,
  Input,
  InputField,
  InputIcon,
  Icon as GlueIcon,
  InputSlot,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@gluestack-ui/themed';
import Background from '../../components/Background';
import MapView, {Region} from 'react-native-maps';
import {getGoogleMapsAPIKey} from '../../api/env';
import {getPhotoUrl, PlaceResult} from '../Settings/UpdateHomeGym';
import {useNavigation, useRoute} from '@react-navigation/native';
import useUser from '../../hooks/useAuth';
import {auth} from '../../services/firebase';
import {useTrainerMetadata} from '../../hooks/lupa/useTrainer';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import IonIcon from 'react-native-vector-icons/Ionicons';
import {format} from 'date-fns';
import PriceDisplay from '../../containers/PriceDisplay';
import {screenWidth} from '../../constant/size';
import {Chip} from '@rneui/themed';
import OutlinedText from '../../components/Typography/OutlinedText';
import SelectProgramCategories from '../../containers/modal/SelectProgramCategories';
import {Alert, Pressable, StyleSheet} from 'react-native';
import {storeMediaFromBase64} from '../../services/firebase/storage';
import {ImagePickerResponse} from 'react-native-image-picker';
import UserHeader from '../../containers/UserHeader';
import LinearGradient from 'react-native-linear-gradient';
import SimpleIcons from 'react-native-vector-icons/SimpleLineIcons';
import * as ImagePicker from 'react-native-image-picker';
import ScrollableHeader from '../../components/ScrollableHeader';
import Share from 'react-native-share';
import ShareArrowRight from '../../assets/icons/ShareArrowRight.png';
import DateTimePicker from '@react-native-community/datetimepicker';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {
  useBootcampPurchase,
  useCreateBootcamp,
  useGetBootcamp,
} from '../../hooks/activities/bootcamps';
import {Bootcamp} from '../../types/activities/bootcamps';
import uuid from 'react-native-uuid';
import LoadingScreen from '../../components/LoadingScreen';
import Video from 'react-native-video';
import {OutlinedInput} from '../../components/Input/OutlinedInput';
import {calculateLupaProgramServiceFee} from '../../services/stripe';
import useCreatePaymentIntent from '../../hooks/stripe/useCreatePaymentIntent';
import useGetEmphemeralKey from '../../hooks/stripe/useGetEmphemeralKey';
import useCreateStripeUser from '../../hooks/stripe/useCreateCustomer';
import useCustomerDetails from '../../hooks/stripe/useCustomerDetails';
import {useStripe} from '@stripe/stripe-react-native';
import useUserStripeDetails from '../../hooks/stripe/useUserStripeDetails';
import { Modal as RNModal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { formatPrice } from '../../util/number';
import CalendarThirtyOneIcon from '../../assets/icons/CalendarThirtyOneIcon';
import ClockIcon from '../../assets/icons/ClockIcon';
import MapPinIcon from '../../assets/icons/MapPinIcon';

export enum BootcampViewMode {
  CREATE,
  VIEW,
}

export default function BootcampView() {
  const route = useRoute();
  const {mode, uid} = route?.params;
  const [isVideoFullScreen, setIsVideoFullScreen] = useState(false);
  const {initPaymentSheet, presentPaymentSheet} = useStripe();
  const {data: customerObject, isFetching: isFetchingCustomerDetails} =
    useCustomerDetails(auth?.currentUser?.uid);
  const {mutateAsync: onCreateStripeUser, isPending: isCreateCustomerPending} =
    useCreateStripeUser();
  const {refetch: onGetEmphemeralKey, isPending: isEmpheralKeyPending} =
    useGetEmphemeralKey(auth?.currentUser?.uid);
  const {
    mutateAsync: onCreatePaymentIntent,
    isPending: isFetchingCreatePayment,
  } = useCreatePaymentIntent();

  const {data: bootcampData} = useGetBootcamp(uid);

  const {
    isLoading: isLoadingTrainerStripeDetails,
    data: trainerStripeDetails,
    refetch: onRefetchTrainerStripeDetails,
  } = useUserStripeDetails(bootcampData?.trainer_uid);
  const {mutateAsync: onCreateBootcamp, isPending: isPendingBootcampCreation} =
    useCreateBootcamp();

  const [isPurchasing, setIsPurchasing] = useState(false);
  const {
    mutateAsync: purchaseBootcamp,
    isPending: isPurchasePending,
    isSuccess: isPurchaseSuccessful,
  } = useBootcampPurchase();
  const {data: currentUser} = useUser(auth?.currentUser?.uid as string);

  const {data: trainerData} = useUser(auth?.currentUser?.uid as string);
  const {data: trainerMetadata} = useTrainerMetadata(
    auth?.currentUser?.uid as string,
  );

  const [region, setRegion] = useState({
    longitude: trainerMetadata?.home_gym?.geometry?.location?.lng,
    latitude: trainerMetadata?.home_gym?.geometry?.location?.lat,
  });

  const onRegionChange = (region: Region) => {
    console.debug(`Region Change: `, region);
    setRegion({...region});
  };

  const [
    isSelectProgramCategoriesModalOpen,
    setSelectProgramCategoriesModalOpen,
  ] = useState<boolean>(false);

  const [name, setName] = useState('');
  const [availableSlots, setAvailableSlots] = useState(16);
  const [showSlotsModal, setShowSlotsModal] = useState(false);
  const [initialPrice, setInitialPrice] = useState(15.0);
  const [categories, setCategories] = useState([]);
  const [description, setDescription] = useState('');
  const [showDateModal, setShowDateModal] = useState(false);
  const [showTimeModal, setShowTimeModal] = useState(false);
  const [showGymModal, setShowGymModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedTime, setSelectedTime] = useState(new Date());
  const [selectedGym, setSelectedGym] = useState(
    trainerMetadata?.home_gym?.name || 'No Home Gym',
  );

  const [searchResults, setSearchResults] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedStartTime, setSelectedStartTime] = useState(new Date());
  const [selectedEndTime, setSelectedEndTime] = useState(new Date());

  const dateRef = useRef(null);

  const onCheckedCategoriesUpdated = (categories: Array<string>) => {
    setCategories([...categories]);
  };

  const handleGymSearch = async () => {
    try {
      const apiKey = getGoogleMapsAPIKey();

      // Perform Text Search request based on search query
      const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        searchQuery,
      )}&type=gym&key=${apiKey}`;
      const textSearchResponse = await fetch(textSearchUrl);
      const textSearchData = await textSearchResponse.json();

      if (textSearchData.results.length === 0) {
        setSearchResults([]);
        return;
      }

      setSearchResults(textSearchData.results);
    } catch (error) {
      console.log('Error searching for gyms:', error);
    }
  };

  const handleGymSelect = (gym: PlaceResult) => {
    setSelectedGym(gym);
    setShowGymModal(false);
  };


  const navigation = useNavigation();
  const {navigate} = navigation;

  const [media, setMedia] = useState(null);

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
        const media: ImagePickerResponse.Asset = assets[0];

        if (media?.uri) {
          const {uri} = media;
          const downloadUrl = await storeMediaFromBase64(
            uri,
            `bootcamps/${Math.random().toString()}.mp4`,
          );
          setMedia(downloadUrl);
        }
      }
    } catch (error) {
      console.error(error);
      //  Alert.alert('Error', 'Failed to select video');
    }
  };

  const renderMediaView = () => {

    if (media) {
      return (
        <View style={styles.mediaContainer}>
          <Video
            paused
            style={{
              alignSelf: 'center',
              borderRadius: 8,
              width: '100%',
              height: '100%',
            }}
            alt="bootcamp image"
            resizeMode="cover"
            source={{
              uri: media,
            }}
          />
          <View style={styles.shadowyView} />
          <Pressable
            style={styles.playIconOverlay}
            onPress={() => setIsVideoFullScreen(true)}
          >
            <Ionicons name="play-circle-outline" size={60} color="white" />
          </Pressable>
          <View style={{position: 'absolute', bottom: 20, left: 10}}>
            <UserHeader
              size="large"
              role="trainer"
              name={trainerData?.name}
              photo_url={trainerData?.picture}
            />
          </View>
        </View>
      )
    } else {
      return (
        <View style={{position: 'relative', alignSelf: 'center'}}>
          <Pressable style={styles.mediaContainer} onPress={selectDailyMedia}>
            <LinearGradient
              colors={['rgba(196, 196, 196, 0.74)', '#5E5E5E']}
              style={styles.gradientContainer}>
              <SimpleIcons name="plus" size={80} color="#1A9DFD" />
            </LinearGradient>
          </Pressable>

          <View style={{position: 'absolute', bottom: 20, left: 10}}>
            <UserHeader
              size="large"
              role="trainer"
              name={trainerData?.name}
              photo_url={trainerData?.picture}
            />
          </View>
        </View>
      );
    }
  };

  const share = async () => {
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

  const handleSaveAndShare = async () => {
    try {
      if (!trainerData || !selectedGym) {
        throw new Error('Missing required data');
      }

      const newBootcamp: Omit<Bootcamp, 'id'> = {
        uid: String(uuid.v4()),
        start_time: selectedStartTime.toUTCString(),
        end_time: selectedEndTime.toUTCString(),
        date: selectedDate.toISOString(),
        date_in_utc: selectedDate.toUTCString(),
        name,
        user_slots: [],
        pricing: {value: initialPrice},
        location: {
          lng: selectedGym.geometry.location.lng,
          lat: selectedGym.geometry.location.lat,
          gym_name: selectedGym.name,
        },
        trainer_uid: trainerData.uid,
        metadata: {trainer_uid: trainerData.uid},
        description: description,
        categories: categories,
        media: media,
        max_slots: availableSlots,
      };

      await onCreateBootcamp(newBootcamp);

      // Navigate Home
      navigation.navigate('Main');

      // Optionally, you can implement the share functionality here
      const shareOptions = {
        message: `Check out this awesome bootcamp: ${newBootcamp.name}`,
        title: 'Share Bootcamp',
        url: `lupa://bootcamp/${newBootcamp.uid}`,
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
    } catch (error) {
      console.error('Error creating bootcamp:', error);
    }
  };

  useEffect(() => {
    if (mode === BootcampViewMode.VIEW && bootcampData) {
      setAvailableSlots(bootcampData?.user_slots?.length);
      setInitialPrice(bootcampData?.pricing?.value);
      setCategories(bootcampData?.categories || []);
      setDescription(bootcampData?.description || '');
      setSelectedDate(new Date(bootcampData?.date));
      setSelectedStartTime(new Date(bootcampData?.start_time));
      setSelectedEndTime(new Date(bootcampData?.end_time));
      setSelectedGym(bootcampData?.location);
      setMedia(bootcampData?.media);

      onRefetchTrainerStripeDetails();
    }

    if (customerObject?.deleted || !customerObject) {
      onCreateStripeUser({
        name: currentUser?.name,
        email: currentUser?.email,
        uid: currentUser.uid,
      }).catch(error => console.log(error));
    }

    return () => {
      setIsPurchasing(false);
    };
  }, [mode, bootcampData, customerObject]);

  const renderEditableContent = () => (
    <>
      {renderMediaView()}
      <View style={{marginTop: 0, marginBottom: 6, minHeight: 20}}>
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
          {categories?.map((category: string) => (
            <Chip
              key={category}
              title={category}
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

      <Textarea
        sx={{
          _input: {
            color: '$white',
          },
          color: '$white',
        }}
        color="$white"
        style={{
          color: '$white',
          borderRadius: 15,
          width: screenWidth - 20,
          alignSelf: 'center',
        }}>
        <TextareaInput
          sx={{
            _input: {
              color: '$white',
            },
            color: '$white',
          }}
          color="$white"
          style={{color: '$white'}}
          onChangeText={text => setDescription(text)}
          value={description}
          placeholder="Add a brief bootcamp note"
        />
      </Textarea>

      <View style={{marginTop: 16, width: screenWidth - 20}}>
        <HStack alignItems="center" justifyContent="space-between" width="100%">
          <VStack style={{flex: 2}} ml={20} space={'lg'}>
            <HStack space="sm" alignItems="center">
             <CalendarThirtyOneIcon />
              <Text fontWeight="$semibold" color="$white">
                {format(selectedDate, 'MM/dd/yyyy')}
              </Text>
              <Button variant="link" onPress={() => setShowDateModal(true)}>
                <Text color="rgba(45, 139, 250, 1)">Edit</Text>
              </Button>
            </HStack>

            <HStack space="sm" alignItems="center">
             <ClockIcon />
              <Text fontWeight="$semibold" color="$white">
                {format(selectedStartTime, 'hh:mm a')} -{' '}
                {format(selectedEndTime, 'hh:mm a')}
              </Text>
              <Button variant="link" onPress={() => setShowTimeModal(true)}>
                <Text color="rgba(45, 139, 250, 1)">Edit</Text>
              </Button>
            </HStack>

            <HStack space="md" alignItems="center">
             <MapPinIcon />
              <Text fontWeight="$semibold" color="$white">
                {!selectedGym?.name ? 'No Home Gym' : selectedGym?.name}
              </Text>
              <Button variant="link" onPress={() => setShowGymModal(true)}>
                <Text color="rgba(45, 139, 250, 1)">Edit</Text>
              </Button>
            </HStack>
          </VStack>

          <View style={{marginRight: 15}}>
            <PriceDisplay
              initialPrice={initialPrice}
              icon="bootcamp"
              productText="Bootcamp"
              priceTextColor="#69DA4D"
            />
          </View>
        </HStack>
      </View>

      <Pressable
        style={{width: '100%'}}
        onPress={() => setShowSlotsModal(true)}>
        <Box
          alignSelf="center"
          style={{
            marginTop: 25,
            padding: 10,
            height: 70,
            width: screenWidth - 80,
            borderRadius: 10,
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: 'rgba(73, 190, 255, 0.4)',
          }}>
          <OutlinedText
            outlineColor="#000"
            textColor="#2D8BFA"
            fontSize={20}
            style={{fontWeight: '900', flexWrap: 'wrap'}}>
            {availableSlots === null
              ? 'Edit Available Slots ex. 12 or 16 max'
              : `Available Slots: ${availableSlots}`}
          </OutlinedText>
        </Box>
      </Pressable>
    </>
  );

  const renderViewOnlyContent = () => (
    <>
      {renderMediaView()}
      <View style={{marginTop: 0, marginBottom: 6, minHeight: 20}}>
        <HStack space="md" flexWrap="wrap">
          {categories?.map((category: string) => (
            <Chip
              key={category}
              title={category}
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

      <Textarea isReadOnly style={{marginBottom: 0, borderRadius: 12}}>
        <TextareaInput style={{color: '#FFF'}} value={description} />
      </Textarea>

      <View style={{marginTop: 16, width: screenWidth - 20}}>
        <HStack alignItems="center" justifyContent="space-between" width="100%">
          <VStack style={{flex: 2}} ml={20} space={'lg'}>
            <HStack space="sm" alignItems="center">
              <CalendarThirtyOneIcon />
              <Text fontWeight="$semibold" color="$white">
                {format(bootcampData?.date ?? new Date(), 'MM/dd/yyyy')}
              </Text>
            </HStack>

            <HStack space="sm" alignItems="center">
             <ClockIcon />
              <Text fontWeight="$semibold" color="$white">
                {format(bootcampData?.start_time ?? new Date(), 'hh:mm a')} -{' '}
                {format(bootcampData?.end_time ?? new Date(), 'hh:mm a')}
              </Text>
            </HStack>

            <HStack space="md" alignItems="center">
             <MapPinIcon />
              <Text fontWeight="$semibold" color="$white">
                {bootcampData?.location?.gym_name}
              </Text>
            </HStack>
          </VStack>

          <View style={{marginRight: 15}}>
            <PriceDisplay
              initialPrice={formatPrice(initialPrice)}
              icon="bootcamp"
              productText="Bootcamp"
              priceTextColor="#69DA4D"
            />
          </View>
        </HStack>
      </View>

      <View
        style={{
          width: screenWidth - 40,
          alignSelf: 'center',
          backgroundColor: 'red',
          justifyContent: 'center',
          alignItems: 'center',
          height: 230,
          borderRadius: 20,
          marginVertical: 12,
        }}>
        <MapView
          cacheEnabled
          style={styles.map}
          region={region}
          onRegionChange={onRegionChange}
          initialRegion={{
            ...region,
          }}
        />
      </View>

      <Box
        alignSelf="center"
        style={{
          marginTop: 5,
          padding: 10,
          height: 70,
          maxWidth: screenWidth - 40,
          borderRadius: 10,
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: 'rgba(73, 190, 255, 0.50)',
        }}>
        <OutlinedText
          outlineColor="#000"
          textColor="#FFF"
          fontSize={20}
          style={{fontWeight: '900', textAlign: 'center', flexWrap: 'wrap'}}>
          {bootcampData?.user_slots?.length ?? 0} /{' '}
          {bootcampData?.max_slots ?? 16} Slots Available
        </OutlinedText>
      </Box>
    </>
  );

  const handleJoinSession = async () => {
    if (!isPurchasing) {
      setIsPurchasing(true);
    } else {
      if (!trainerStripeDetails?.stripe_account_id) {
        Alert.alert('Error', 'Unable to process payment at this time.');
        return;
      }

      try {
        const priceInCents = Math.round(
          calculateLupaProgramServiceFee(bootcampData.pricing.value) * 100,
        );

        const serviceFee = calculateLupaProgramServiceFee(
          bootcampData.pricing.value,
        );
        // Create the stripe payment intent
        const paymentIntentData = await onCreatePaymentIntent({
          price: bootcampData.pricing.value,
          product_uid: bootcampData.uid,
          metadata: {},
          seller_id: trainerStripeDetails.stripe_account_id,
          platform_percentage: 3,
        });

        const {client_secret: paymentIntentClientSecret} = paymentIntentData;

        // Create the Stripe emphemeral key
        const emphemeralKeyData = await onGetEmphemeralKey();
        const {secret: ephemeralKeySecret} = emphemeralKeyData;

        const {error: initPaymentSheetError} = await initPaymentSheet({
          customerId: customerObject?.id,
          customerEphemeralKeySecret: ephemeralKeySecret,
          paymentIntentClientSecret: paymentIntentClientSecret,
          merchantDisplayName: 'Lupa',
          returnURL: 'lupa://stripe-redirect',
        });

        if (initPaymentSheetError) {
          throw initPaymentSheetError;
        }

        // Present the payment sheet
        const {error: presentPaymentSheetError} = await presentPaymentSheet();

        if (presentPaymentSheetError) {
          throw presentPaymentSheetError;
        }

        // If payment is successful, purchase the bootcamp
        await purchaseBootcamp({
          userId: currentUser.uid,
          bootcampId: bootcampData.id,
        });

        // Show success message and navigate back
        Alert.alert('Success', 'You have successfully joined the bootcamp!');
        navigation.goBack();
      } catch (error) {
        console.error('Error purchasing bootcamp:', error);
        Alert.alert(
          'Error',
          error.message || 'Failed to join bootcamp. Please try again.',
        );
      } finally {
        setIsPurchasing(false);
      }
    }
  };

  if (isPendingBootcampCreation) {
    return <LoadingScreen />;
  }

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <ScrollView>
          <ScrollableHeader showBackButton />

          <View style={{flex: 1, padding: 10, paddingHorizontal: 10}}>
            <HStack alignItems="center" justifyContent="space-between">
              {mode == BootcampViewMode.CREATE ? (
                <View
                  style={{
                    width: '80%',
                    borderColor: 'transparent',
                  }}>
                  <Input
                    variant="outline"
                    size="md"
                    style={{
                      color: '$blue500',
                      borderColor: '#2D8BFA',
                      borderRadius: 12,
                      marginBottom: 2,
                      height: 68,
                      marginBottom: 12,
                    }}
                    //  borderColor="$blue200"
                    isDisabled={false}
                    isInvalid={false}
                    isReadOnly={false}>
                    <InputField
                      placeholderTextColor="$blue500"
                      sx={{
                        color: '$blue500',
                        //  borderRadius: 20,
                        p: 10,
                        px: 10,
                        h: 'auto',
                        //  borderColor: '$blue500',
                        //my: 15,
                        //   borderRadius: 12,
                        //  borderWidth: 1,
                        //  borderBottomWidth: 0,
                        padding: 10,
                        //   borderTopWidth: 1,
                        fontSize: 30,
                        fontWeight: '800',
                        _input: {
                          fontSize: 30,
                          color: '$blue500',
                        },
                      }}
                      //     color="$white"
                      placeholder="Bootcamp Name"
                      value={name}
                      onChangeText={setName}
                    />
                  </Input>
                </View>
              ) : (
                <OutlinedText
                  textColor="black"
                  outlineColor="white"
                  fontSize={30}
                  style={{paddingHorizontal: 5, fontWeight: '900'}}>
                  {bootcampData?.name}
                </OutlinedText>
              )}

              <Pressable onPress={share}>
                <VStack alignItems="center" space="sm">
                  <Image
                    source={ShareArrowRight}
                    style={{marginLeft: 6, width: 38, height: 35}}
                  />
                  <Text color="#2D8BFA" fontSize={12} fontWeight="400">
                    Share
                  </Text>
                </VStack>
              </Pressable>
            </HStack>

            {mode == BootcampViewMode.CREATE
              ? renderEditableContent()
              : renderViewOnlyContent()}

            <SelectProgramCategories
              isOpen={isSelectProgramCategoriesModalOpen}
              onClose={() => setSelectProgramCategoriesModalOpen(false)}
              onCheckedCategoriesUpdated={onCheckedCategoriesUpdated}
            />
          </View>

          {mode == BootcampViewMode.VIEW && (
            <Box
              style={{
                borderColor: 'rgba(189, 189, 189, 0.70)',
                borderRadius: 99,
                marginVertical: 10,
                padding: 10,
                borderWidth: 1,
                alignSelf: 'center',
                width: screenWidth - 40,
                justifyContent: 'space-between',
              }}>
              <HStack alignItems="center" justifyContent="space-between">
                <Text
                  fontSize={16}
                  fontWeight="800"
                  color="rgba(189, 189, 189, 0.70)">
                  Appointment#{bootcampData?.uid.substring(0, 5)}
                </Text>
                <Text> - </Text>
                <Text
                  fontSize={16}
                  fontWeight="800"
                  color="rgba(189, 189, 189, 0.70)">
                  Details +1099
                </Text>
              </HStack>
            </Box>
          )}

          {mode == BootcampViewMode.CREATE ? (
            <Button
              isDisabled={isPendingBootcampCreation}
              onPress={handleSaveAndShare}
              style={{
                marginVertical: 10,
                width: screenWidth - 20,
                backgroundColor: 'rgba(73, 190, 255, 0.44)',
                height: 44,
                borderRadius: 10,
                alignSelf: 'center',
              }}>
              <ButtonText>
                <OutlinedText
                  style={{fontWeight: '700'}}
                  textColor="white"
                  outlineColor="black"
                  fontSize={30}
                  fontWeight="700">
                  Save and Share
                </OutlinedText>
              </ButtonText>
            </Button>
          ) : (
            mode == BootcampViewMode.VIEW && (
              <Button
                onPress={handleJoinSession}
                isDisabled={
                  isPurchasePending ||
                  isFetchingCustomerDetails ||
                  isCreateCustomerPending ||
                  isEmpheralKeyPending ||
                  isFetchingCreatePayment ||
                  isLoadingTrainerStripeDetails
                }
                style={{
                  marginVertical: 10,
                  width: screenWidth - 20,
                  backgroundColor: 'rgba(73, 190, 255, 0.80)',
                  height: 82,
                  borderRadius: 10,
                  alignSelf: 'center',
                }}>
                <ButtonText>
                  <OutlinedText
                    style={{fontWeight: '700'}}
                    textColor="white"
                    outlineColor="black"
                    fontSize={30}>
                    {isPurchaseSuccessful
                      ? 'Purchase Complete'
                      : isPurchasing
                      ? `$${bootcampData?.pricing?.value}`
                      : 'Join Session'}
                  </OutlinedText>
                </ButtonText>
              </Button>
            )
          )}
        </ScrollView>

        {showDateModal && (
          <Modal
            size="md"
            isOpen={showDateModal}
            ref={dateRef}
            onClose={() => setShowDateModal(false)}>
            <ModalContent>
              <ModalHeader>
                <Heading size="lg">Edit Date</Heading>
                <ModalCloseButton>
                  <GlueIcon as={CloseIcon} />
                </ModalCloseButton>
              </ModalHeader>
              <ModalBody>
                <DateTimePicker
                  value={selectedDate}
                  mode="date"
                  onChange={(event, date) =>
                    setSelectedDate(date || new Date())
                  }
                />
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="outline"
                  size="sm"
                  action="secondary"
                  mr="$3"
                  onPress={() => setShowDateModal(false)}>
                  <ButtonText>Cancel</ButtonText>
                </Button>
                <Button
                  size="sm"
                  action="positive"
                  borderWidth="$0"
                  onPress={() => setShowDateModal(false)}>
                  <ButtonText>Save</ButtonText>
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}

        {showGymModal && (
          <Modal isOpen={showGymModal} onClose={() => setShowGymModal(false)}>
            <ModalContent>
              <ModalHeader>
                <Heading size="lg">Edit Gym</Heading>
                <ModalCloseButton>
                  <GlueIcon as={CloseIcon} />
                </ModalCloseButton>
              </ModalHeader>
              <ModalBody>
                <Input>
                  <InputField
                    value={searchQuery}
                    onChangeText={text => setSearchQuery(text)}
                    placeholder="Search for a gym"
                  />
                  <InputSlot pr="$3" onPress={handleGymSearch}>
                    <InputIcon
                      color="$coolGray600"
                      as={() => (
                        <MaterialCommunityIcon
                          size={18}
                          color="grey"
                          name="search-web"
                        />
                      )}
                      color="$gray500"
                    />
                  </InputSlot>
                </Input>
                <ScrollView>
                  {searchResults.map(result => (
                    <Pressable
                      key={result.place_id}
                      onPress={() => handleGymSelect(result)}>
                      <ImageBackground
                        source={{
                          uri: getPhotoUrl(result.photos[0].photo_reference),
                        }}
                        style={{
                          marginVertical: 10,
                          borderRadius: 10,
                          height: 200,
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                        }}>
                        <View
                          style={{
                            alignItems: 'center',
                            position: 'absolute',
                            width: '100%',
                            height: '100%',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: 'rgba(0,0,0,0.6)',
                            padding: 10,
                          }}>
                          <Text
                            py={15}
                            size="xl"
                            bold
                            color="$white"
                            textAlign="center">
                            {result.name}
                          </Text>
                          <Text
                            size="sm"
                            bold
                            color="$white"
                            textAlign="center">
                            {result.formatted_address}
                          </Text>
                        </View>
                      </ImageBackground>
                    </Pressable>
                  ))}
                </ScrollView>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="outline"
                  size="sm"
                  action="secondary"
                  mr="$3"
                  onPress={() => setShowGymModal(false)}>
                  <ButtonText>Cancel</ButtonText>
                </Button>
                <Button
                  size="sm"
                  action="positive"
                  borderWidth="$0"
                  onPress={() => {
                    if (selectedGym) {
                      // Update the trainer's home gym here
                      console.log('Selected gym:', selectedGym);
                    }
                    setShowGymModal(false);
                  }}>
                  <ButtonText>Save</ButtonText>
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}

        {showTimeModal && (
          <Modal isOpen={showTimeModal} onClose={() => setShowTimeModal(false)}>
            <ModalContent>
              <ModalHeader>
                <Heading size="lg">Edit Time</Heading>
                <ModalCloseButton>
                  <GlueIcon as={CloseIcon} />
                </ModalCloseButton>
              </ModalHeader>
              <ModalBody>
                <HStack space="md" alignItems="center">
                  <Text>Start Time:</Text>
                  <DateTimePicker
                    value={selectedStartTime}
                    mode="time"
                    onChange={(event, time) =>
                      setSelectedStartTime(time || new Date())
                    }
                  />
                </HStack>
                <HStack space="md" alignItems="center">
                  <Text>End Time:</Text>
                  <DateTimePicker
                    value={selectedEndTime}
                    mode="time"
                    onChange={(event, time) =>
                      setSelectedEndTime(time || new Date())
                    }
                  />
                </HStack>
              </ModalBody>
              <ModalFooter>
                <Button
                  variant="outline"
                  size="sm"
                  action="secondary"
                  mr="$3"
                  onPress={() => setShowTimeModal(false)}>
                  <ButtonText>Cancel</ButtonText>
                </Button>
                <Button
                  size="sm"
                  action="positive"
                  borderWidth="$0"
                  onPress={() => setShowTimeModal(false)}>
                  <ButtonText>Save</ButtonText>
                </Button>
              </ModalFooter>
            </ModalContent>
          </Modal>
        )}

        <Modal isOpen={showSlotsModal} onClose={() => setShowSlotsModal(false)}>
          <ModalContent>
            <ModalHeader>
              <Heading size="lg">Edit Available Slots</Heading>
              <ModalCloseButton>
                <GlueIcon as={CloseIcon} />
              </ModalCloseButton>
            </ModalHeader>
            <ModalBody>
              <Input>
                <InputField
                  value={String(availableSlots)}
                  onChangeText={text => setAvailableSlots(parseInt(text) || 0)}
                  keyboardType="numeric"
                  placeholder="Enter number of slots"
                />
              </Input>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                size="sm"
                action="secondary"
                mr="$3"
                onPress={() => setShowSlotsModal(false)}>
                <ButtonText>Cancel</ButtonText>
              </Button>
              <Button
                size="sm"
                action="positive"
                borderWidth="$0"
                onPress={() => setShowSlotsModal(false)}>
                <ButtonText>Save</ButtonText>
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </SafeAreaView>

      <RNModal
  visible={isVideoFullScreen}
  onRequestClose={() => setIsVideoFullScreen(false)}
  animationType="fade"
  supportedOrientations={['portrait', 'landscape']}
>
  <View style={{ flex: 1, backgroundColor: 'black' }}>
    <Video
      source={{ uri: media }}
      style={{ flex: 1 }}
      resizeMode="contain"
      controls={true}
      onEnd={() => setIsVideoFullScreen(false)}
    />
    <Pressable
      onPress={() => setIsVideoFullScreen(false)}
      style={{
        position: 'absolute',
        top: 40,
        right: 20,
        zIndex: 1,
      }}
    >
      <Ionicons name="close" size={30} color="white" />
    </Pressable>
  </View>
</RNModal>
    </Background>
  );
}

const styles = StyleSheet.create({
  shadowyView: {
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
  mediaContainer: {
    width: screenWidth - 20,
    height: 200,
    borderRadius: 10,
    overflow: 'hidden',
    marginBottom: 10,
  },
  gradientContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  videoContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 20,
  },
  playIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
});
