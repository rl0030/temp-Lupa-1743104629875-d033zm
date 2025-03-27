import React, {useEffect, useState} from 'react';
import Background from '../../components/Background';
import {
  Avatar,
  Box,
  Button,
  ButtonText,
  HStack,
  SafeAreaView,
  ScrollView,
  Text,
  View,
  VStack,
} from '@gluestack-ui/themed';
import {useNavigation, useRoute} from '@react-navigation/native';
import SearchInput from '../../components/SearchInput/SearchInputV1';
import useCollectionsSearch from '../../hooks/queries/useSearchUsers';
import {Studio} from '../../types/user';
import {getGoogleMapsAPIKey} from '../../api/env';
import {PlaceResult} from '../Settings/UpdateHomeGym';
import {LupaStudioInterface} from '../../types/studio';
import {
  convertPlacesResultToLupaStudioInterface,
  getLupaStudioLocationFromPlaceResult,
} from '../../util/lupa';
import {Pressable} from 'react-native';
import OutlinedText from '../../components/Typography/OutlinedText';
import MapPinIcon from '../../assets/icons/MapPinIcon';
import ScrollableHeader from '../../components/ScrollableHeader';
import {format, isValid, parse} from 'date-fns';

const FormattedDateTime = ({date, startTime, endTime}) => {
  let formattedDate = '';
  let formattedTime = 'Unable to provide time information';

  try {
    // Parse and format the date
    const parsedDate = parse(date, 'yyyy-MM-dd', new Date());
    if (isValid(parsedDate)) {
      formattedDate = format(parsedDate, 'EEEE, MMMM d');
    } else {
      throw new Error('Invalid date');
    }

    // Parse and format the times
    const parsedStartTime = parse(startTime, 'HH:mm', new Date());
    const parsedEndTime = parse(endTime, 'HH:mm', new Date());

    if (isValid(parsedStartTime) && isValid(parsedEndTime)) {
      const formattedStartTime = format(parsedStartTime, 'h a');
      const formattedEndTime = format(parsedEndTime, 'h a');
      formattedTime = `${formattedStartTime} - ${formattedEndTime}`;
    } else {
      throw new Error('Invalid time');
    }
  } catch (error) {
    console.error('Error formatting date or time:', error);
  }

  // Combine the formatted date and time
  const formattedDateTime = formattedDate
    ? `${formattedDate} | ${formattedTime}`
    : formattedTime;

  return (
    <Text fontWeight="$bold" style={{fontSize: 12, textAlign: 'center'}}>
      {formattedDateTime}
    </Text>
  );
};

const StudioSelectionCards = ({
  isLupaStudio,
  studio,
  desiredDate,
  desiredStartTime,
  desiredEndTime,
}) => {
  console.log(studio?.photos?.[0]?.photo_reference);
  return (
    <Box
      style={{
        borderRadius: 8,
        backgroundColor: '#03063D',
        display: 'flex',
        justifyContent: 'space-between',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 10,
        paddingVertical: 10,
      }}>
      <Avatar>
        <Avatar.Image
          source={
            isLupaStudio
              ? studio?.photos[0]
              : `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${
                  studio?.photos?.[0]?.photo_reference
                }&key=${getGoogleMapsAPIKey()}`
          }
        />
      </Avatar>

      <HStack alignItems="center">
        <Box sx={{width: 260}}>
          <Text
            color="$light100"
            fontWeight="$bold"
            style={{fontSize: 14, textAlign: 'center'}}>
            {studio.name}
          </Text>
          <Text
            color="$light400"
            fontWeight="$bold"
            style={{fontSize: 14, textAlign: 'center'}}>
            {studio.formatted_address}
          </Text>

          <FormattedDateTime
            date={desiredDate}
            startTime={desiredStartTime}
            endTime={desiredEndTime}
          />
        </Box>

        <MapPinIcon />
      </HStack>
      {isLupaStudio ? (
        <VStack alignItems="center">
          <Text fontWeight="$bold" style={{fontSize: 10}}>
            Lease Fee
          </Text>
          <Text fontWeight="$bold" style={{color: '#226416', fontSize: 20}}>
            {studio?.pricing?.leasing_fee}
          </Text>
        </VStack>
      ) : (
        <View />
      )}
    </Box>
  );
};

const GymSelection = () => {
  const apiKey = getGoogleMapsAPIKey();
  const navigation = useNavigation();
  const route = useRoute();
  const {onSelectGym, desiredDate, desiredStartTime, desiredEndTime} =
    route.params;

  const [searchInput, setSearchInput] = useState<string>('');
  const [placesSearchResults, setPlacesSearchResults] = useState<any>([]);

  const {
    data: searchResults,
    refetch: onSearch,
    isLoading: isLoadingSearchResults,
  } = useCollectionsSearch(searchInput, [
    {collectionName: 'studios', collectionFields: ['name']},
  ]);

  const [selectedStudio, setSelectedStudio] =
    useState<LupaStudioInterface | null>(null);
  const onSelectStudio = (
    studioOrPlaceResult: LupaStudioInterface | PlaceResult,
  ) => {
    let isLupaStudio: boolean = false;
    if (
      Object.keys(studioOrPlaceResult).includes('pricing') &&
      Object.keys(studioOrPlaceResult?.pricing).includes('leasing_fee')
    ) {
      isLupaStudio = true;
    }

    if (!onSelectGym) {
      throw new Error('onSelectGym callback parameter does not exist.');
    }

    let result: LupaStudioInterface;

    if (isLupaStudio) {
      result = studioOrPlaceResult as LupaStudioInterface;
    } else {
      result = convertPlacesResultToLupaStudioInterface(
        studioOrPlaceResult as PlaceResult,
      );
    }

    setSelectedStudio(result);
  };

  const onConfirm = () => {
    if (onSelectGym) {
      onSelectGym(selectedStudio);
    }
    console.log('GOBACK');
    navigation.goBack();
  };

  const handleGymSearch = async () => {
    try {
      // Perform Text Search request based on search query
      const textSearchUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        searchInput,
      )}&type=stadium,park,campground,university&key=${apiKey}`;
      const textSearchResponse = await fetch(textSearchUrl);
      const textSearchData = await textSearchResponse.json();

      if (textSearchData.results.length === 0) {
        setPlacesSearchResults([]);
        return;
      }

      setPlacesSearchResults(textSearchData.results);
    } catch (error) {
      console.log('Error searching for gyms:', error);
    }
  };

  useEffect(() => {
    onSearch();
    handleGymSearch();
  }, [searchInput]);

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <ScrollableHeader showBackButton />
        <SearchInput
          isVoiceEnabled={false}
          isFocused={false}
          containerStyles={{
            marginHorizontal: 20,
            marginRight: 30,
            marginBottom: 10,
          }}
          placeholder="Search gyms or enter a custom address"
          value={searchInput}
          onChangeText={(text: string) => setSearchInput(text)}
        />
        <ScrollView>
          <VStack space="xs" marginHorizontal={5}>
            {searchResults?.studios?.map((studio: LupaStudioInterface) => {
              return (
                <VStack>
                  <Pressable onPress={() => onSelectStudio(studio)}>
                    <StudioSelectionCards
                      key={studio?.uid}
                      desiredDate={desiredDate}
                      desiredStartTime={desiredStartTime}
                      desiredEndTime={desiredEndTime}
                      isLupaStudio={true}
                      studio={studio}
                    />
                  </Pressable>
                  {selectedStudio && selectedStudio?.id === studio?.uid && (
                    <View
                      style={{
                        borderRadius: 8,
                        backgroundColor: '#03063D',
                      }}>
                      <Button
                        isDisabled={!selectedStudio}
                        m={5}
                        fontSize={16}
                        outlineText
                        fontWeight="800"
                        bgColor="rgba(0, 122, 255, 0.5)"
                        textColor="white"
                        outlineColor="black"
                        onPress={onConfirm}>
                        <ButtonText>
                          <OutlinedText
                            textColor="white"
                            outlineColor="black"
                            fontSize={20}
                            style={{fontWeight: '800'}}>
                            Confirm
                          </OutlinedText>
                        </ButtonText>
                      </Button>
                    </View>
                  )}
                </VStack>
              );
            })}
            {placesSearchResults.map((place: PlaceResult) => {
              return (
                <VStack>
                  <Pressable onPress={() => onSelectStudio(place)}>
                    <StudioSelectionCards
                      key={place.place_id}
                      desiredStartTime={desiredStartTime}
                      desiredEndTime={desiredEndTime}
                      desiredDate={desiredDate}
                      isLupaStudio={false}
                      studio={place}
                    />
                  </Pressable>

                  {selectedStudio && selectedStudio?.id === place?.place_id && (
                    <View
                      style={{
                        borderRadius: 8,
                        backgroundColor: '#03063D',
                        alignItems: 'center',
                      }}>
                      <Text
                        style={{
                          fontSize: 13,
                          color: 'white',
                          fontWeight: 'bold',
                        }}>
                        This location has a $25 leasing fee. Is that okay?
                      </Text>

                      <Button
                        style={{
                          alignSelf: 'center',
                          height: 30,
                          width: 140,
                          borderRadius: 6,
                        }}
                        isDisabled={!selectedStudio}
                        m={5}
                        fontSize={16}
                        outlineText
                        fontWeight="800"
                        bgColor="#226416"
                        textColor="white"
                        outlineColor="black"
                        marginBottom={20}
                        onPress={onConfirm}>
                        <ButtonText>
                          <OutlinedText
                            textColor="white"
                            outlineColor="black"
                            fontSize={20}
                            style={{fontWeight: '800'}}>
                            Confirm
                          </OutlinedText>
                        </ButtonText>
                      </Button>
                    </View>
                  )}
                </VStack>
              );
            })}
          </VStack>
          {searchResults?.studios?.length === 0 &&
            searchInput.trim().length === 0 && (
              <Text paddingVertical={10} textAlign="center" color="$light100">
                Sorry we cannot find any Lupa studios related to your search. "
                {searchInput}"
              </Text>
            )}
          {selectedStudio && selectedStudio.pricing?.leasing_fee === 0 && (
            <Text>This studio has a leasing fee of 0.</Text>
          )}
          {selectedStudio && (
            <Button
              isDisabled={!selectedStudio}
              m={5}
              fontSize={16}
              outlineText
              fontWeight="800"
              bgColor="rgba(0, 122, 255, 0.5)"
              textColor="white"
              outlineColor="black"
              onPress={onConfirm}>
              <ButtonText>
                <OutlinedText
                  textColor="white"
                  outlineColor="black"
                  fontSize={20}
                  style={{fontWeight: '800'}}>
                  Confirm
                </OutlinedText>
              </ButtonText>
            </Button>
          )}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
};

export default GymSelection;
