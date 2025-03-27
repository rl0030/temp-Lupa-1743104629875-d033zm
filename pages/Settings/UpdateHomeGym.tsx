import React, {useState} from 'react';
import {GoogleMap, Marker, LoadScript} from '@react-google-maps/api';
import {
  Box,
  Input,
  Button,
  Text,
  VStack,
  Heading,
  InputField,
  ButtonText,
  SafeAreaView,
  View,
  ImageBackground,
  ScrollView,
  CloseIcon,
  Icon,
  ModalBackdrop,
  ModalBody,
  Modal,
  Pressable,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from '@gluestack-ui/themed';
import {useNavigation} from '@react-navigation/native';
import useFirestoreDocumentListener from '../../hooks/firebase/useFirestoreDocumentListener';
import {LupaUser, TrainerMetadata} from '../../types/user';
import {GooglePlacesAutocomplete} from 'react-native-google-places-autocomplete';
import Background from '../../components/Background';
import {getGoogleMapsAPIKey} from '../../api/env';
import {auth} from '../../services/firebase';
import ScrollableHeader from '../../components/ScrollableHeader';

export type PlaceResult = {
  business_status: string;
  formatted_address: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    };
    viewport: {
      northeast: [number, number];
      southwest: [number, number];
    };
  };
  icon: string;
  icon_background_color: string;
  icon_mask_base_uri: string;
  name: string;
  opening_hours: {
    open_now: boolean;
  };
  photos: {
    height: number;
    html_attributions: string[];
    photo_reference: string;
    width: number;
  }[];
  place_id: string;
  plus_code: {
    compound_code: string;
    global_code: string;
  };
  rating: number;
  reference: string;
  types: string[];
  user_ratings_total: number;
};

export const getPhotoUrl = (photoReference: string) => {
  return `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photo_reference=${photoReference}&key=${getGoogleMapsAPIKey()}`;
};

const UpdateHomeGymScreen = () => {
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchParameters, setSearchParameters] = useState({
    query: '',
    postalCode: '',
  });

  const [selectedGym, setSelectedGym] = useState<PlaceResult | null>(null);

  const {document: user, mutateAsync: updateUserDocument} =
    useFirestoreDocumentListener(
      'users',
      'uid',
      auth?.currentUser?.uid as string,
    );

  const {
    document: trainerMetadata,
    mutateAsync: editTrainerMetadataFirestoreDocument,
    loading: isTrainerMetaddataDocumentLoading,
  } = useFirestoreDocumentListener<TrainerMetadata>(
    'trainer_metadata',
    'user_uid',
    auth?.currentUser?.uid as string,
  );

  const [results, setResults] = useState<PlaceResult[]>([]);

  const handleSearch = async () => {
    if (searchParameters.query && searchParameters.postalCode) {
      try {
        const apiKey = getGoogleMapsAPIKey();

        // Perform Text Search request based on name and postal code
        const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
          searchParameters.query,
        )}+in+${encodeURIComponent(
          searchParameters.postalCode,
        )}&type=gym&key=${apiKey}`;
        const textSearchResponse = await fetch(textSearchUrl);
        const textSearchData = await textSearchResponse.json();

        setResults([textSearchData.results[0]]);
      } catch (error) {
        console.log('Error searching for gyms:', error);
      }
    }
  };

  const [showModal, setShowModal] = useState(false);
  const confirmationRef = React.useRef(null);
  const handleSave = async () => {
    if (selectedGym) {
      await editTrainerMetadataFirestoreDocument({home_gym: selectedGym});
      navigation.goBack();
    }
  };

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <ScrollableHeader showBackButton /> 
        <Box flex={1} padding={10}>
          <VStack space="lg" p={4}>
            <View my={20}>
              <Heading color="$white">Update Home Gym</Heading>
              <Text color="$light200">Search and select a home gym</Text>
            </View>

            <Input>
              <InputField
                color="$white"
                value={searchParameters.query}
                onChangeText={text =>
                  setSearchParameters({...searchParameters, query: text})
                }
                placeholder="Search for a gym"
              />
            </Input>
            <Input>
              <InputField
                color="$white"
                value={searchParameters.postalCode}
                onChangeText={text =>
                  setSearchParameters({...searchParameters, postalCode: text})
                }
                placeholder="Set a postal code"
              />
            </Input>
            <Button onPress={handleSearch}>
              <ButtonText>Search</ButtonText>
            </Button>
            <ScrollView>
              {results.map(result => {
                return (
                  <Pressable
                    onPress={() => {
                      setSelectedGym(result);
                      setShowModal(true);
                    }}>
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
                          {result?.name}
                        </Text>
                        <Text size="sm" bold color="$white" textAlign="center">
                          {result?.formatted_address}
                        </Text>
                      </View>
                    </ImageBackground>
                  </Pressable>
                );
              })}
            </ScrollView>
          </VStack>
        </Box>

        <Modal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          finalFocusRef={confirmationRef}>
          <ModalBackdrop />
          <ModalContent>
            <ModalHeader>
              <Heading size="lg">Confirm Home Gym</Heading>
              <ModalCloseButton>
                <Icon as={CloseIcon} />
              </ModalCloseButton>
            </ModalHeader>
            <ModalBody>
              <Text size="sm">
                Are you sure you want to set {selectedGym?.name} as your home
                gym?
              </Text>
              <Text size="sm" bold>
                You can change it later in settings.
              </Text>
            </ModalBody>
            <ModalFooter>
              <Button
                variant="outline"
                size="sm"
                action="secondary"
                mr="$3"
                onPress={() => setShowModal(false)}>
                <ButtonText>Cancel</ButtonText>
              </Button>
              <Button
                size="sm"
                action="positive"
                borderWidth="$0"
                onPress={handleSave}>
                <ButtonText>Set Home Gym</ButtonText>
              </Button>
            </ModalFooter>
          </ModalContent>
        </Modal>
      </SafeAreaView>
    </Background>
  );
};

export default UpdateHomeGymScreen;
