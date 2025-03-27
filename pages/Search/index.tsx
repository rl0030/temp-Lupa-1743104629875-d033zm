import React, {useEffect, useMemo, useState} from 'react';
import {Pressable, SafeAreaView, StyleSheet, View} from 'react-native';
import Background from '../../components/Background';
import {
  HStack,
  Box,
  Heading,
  ImageBackground,
  Input,
  InputField,
  ScrollView,
  VStack,
  Text,
  InputIcon,
  FlatList,
  InputSlot,
  SearchIcon,
  Divider,
} from '@gluestack-ui/themed';
import {screenWidth} from '../../constant/size';
import {FITNESS_CATEGORIES} from '../../constant/lupa';
import CategoryCardOrangeBackground from '../../assets/images/category_card_orange_background.png';
import CategoryCardBlueBackground from '../../assets/images/category_card_blue_background.png';
import CategoryCardPurpleBackground from '../../assets/images/category_card_green_background.png';
import CategoryCardGreenBackground from '../../assets/images/category_card_purple_background.png';
import InputV2 from '../../components/Input/InputV2';
import useSearchUsers from '../../hooks/queries/useSearchUsers';
import {Program, ProgramDetailsWithTrainerName} from '../../types/program';
import {
  LupaUser,
  ScheduledMeetingClientType,
  SessionPackage,
} from '../../types/user';
import BasicUserCard from '../../containers/UserCard/Basic';
import ProgramDisplay from '../../containers/ProgramDisplay';
import {useNavigation} from '@react-navigation/native';
import {auth} from '../../services/firebase';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import {useRecoilValue} from 'recoil';
import useProgramSuggestions from '../../hooks/lupa/useProgramSuggestions';
import {userDataAtom} from '../../state/recoil/userState';
import useUser from '../../hooks/useAuth';
import {getPack, getProgram, getUser} from '../../api';
import {ViewMode} from '../BuildTool';
import SmallProgramDisplay from '../../containers/ProgramDisplay/SmallProgramDisplay';
import AsyncStorage from '@react-native-community/async-storage';
import ScrollableHeader from '../../components/ScrollableHeader';
import { useSelector } from 'react-redux';
import { RootState } from '../../services/redux/store';

const SearchInput = ({value, onChangeText, onFocus, onBlur, customStyles}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleFocus = () => {
    setIsFocused(true);
    onFocus();
  };

  const handleBlur = () => {
    setIsFocused(false);
    onBlur();
  };

  const handleClose = () => {
    onChangeText('');
    handleBlur();
  };

  const focusedStyles = {
    border: 'none',
  };

  return (
    <Input
      style={[
        {marginHorizontal: 25, borderRadius: 8},
        !isFocused ? focusedStyles : customStyles,
      ]}
      backgroundColor="$white"
      variant="rounded"
      size="md"
      isDisabled={false}
      isInvalid={false}
      isReadOnly={false}>
      <InputSlot pl="$3">
        <InputIcon
          as={SearchIcon}
          color={isFocused ? '$white' : '$coolGray600'}
        />
      </InputSlot>
      <InputField
        onPress={handleFocus}
        value={value}
        placeholder="What kind of workout would you like?"
        onChangeText={onChangeText}
        onFocus={handleFocus}
        onBlur={handleBlur}
      />
      <InputSlot pr="$3">
        {!isFocused ? (
          <InputIcon
            as={() => (
              <MaterialCommunityIcon
                size={18}
                color={!isFocused ? '$white' : '$coolGray600'}
                name="microphone"
              />
            )}
          />
        ) : (
          <Pressable onPress={handleClose}>
            <InputIcon
              as={() => (
                <MaterialCommunityIcon color="white" size={18} name="close" />
              )}
            />
          </Pressable>
        )}
      </InputSlot>
    </Input>
  );
};

const loadItemData = async (type, uid) => {
  switch (type) {
    case 'user':
      return await getUser(uid);
    case 'program':
      return await getProgram(uid);
    case 'pack':
      return await getPack(uid);
    default:
      return null;
  }
};

const IMAGE_SOURCES = [
  CategoryCardBlueBackground,
  CategoryCardOrangeBackground,
  CategoryCardGreenBackground,
  CategoryCardPurpleBackground,
];

function CategoryCard(props: {
  category: string;
  large?: boolean;
  onPress: (input: string) => void;
}) {
  const {category, onPress, large} = props;

  const getBackgroundImage = () => {
    const randomIndex = Math.floor(Math.random() * IMAGE_SOURCES.length);
    return IMAGE_SOURCES[randomIndex];
  };

  return (
    <Pressable
      style={{width: '46%'}}
      onPress={() => {
        onPress(category);
      }}>
      <Box
        marginVertical={5}
        width="100%"
        height={large ? 131 : 83}
        borderRadius={10}>
        <ImageBackground
          resizeMode="cover"
          imageStyle={{borderRadius: 10}}
          style={{padding: 10, borderRadius: 10, flex: 1}}
          source={getBackgroundImage()}>
          <Heading color="$white">{category}</Heading>
        </ImageBackground>
      </Box>
    </Pressable>
  );
}

export default function Search() {
  const navigation = useNavigation();
  const {navigate} = navigation;

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchInput, setSearchInput] = useState<string>('');

  const MemoizedCategoryCard = useMemo(() => CategoryCard, []);
  const memoizedCategories = useMemo(() => {
    return FITNESS_CATEGORIES.slice(0, 4).map((category, idx) => {
      return (
        <MemoizedCategoryCard
          category={category}
          onPress={() => navigate('ActiveSearch')}
        />
      );
    });
  }, []);

  const memoizedCategoriesLarge = useMemo(() => {
    return FITNESS_CATEGORIES.map((category, idx) => {
      return (
        <MemoizedCategoryCard
          large
          category={category}
          onPress={() => navigate('ActiveSearch')}
        />
      );
    });
  }, []);

  const lupaUser = useSelector(
    (state: RootState) => state.user.userData,
  ) as LupaUser
  
  const programSuggestions = useProgramSuggestions(lupaUser);
  const validSuggestions = programSuggestions.filter(
    suggestion => lupaUser?.uid !== suggestion?.trainer?.uid,
  );

  return (
    <Background>
      <SafeAreaView style={styles.safeAreaView}>
        <View style={{flex: 1, alignItems: 'center'}}>
          <ScrollView contentContainerStyle={{alignItems: 'center'}}>
            <ScrollableHeader
              onBack={() => {
                setIsSearchFocused(false);
              }}
            />
            <View style={styles.primaryContainer}>
              <View>
                <Pressable onPress={() => navigate('ActiveSearch')}>
                  <SearchInput
                    value={searchInput}
                    onChangeText={text => setSearchInput(text)}
                    onFocus={() => {
                      setIsSearchFocused(prevState => true);
                      if (isSearchFocused) {
                        navigate('ActiveSearch');
                      }
                    }}
                    onBlur={() => setIsSearchFocused(false)}
                  />
                </Pressable>
              </View>

              <VStack space="xl">
                <View style={{width: '100%'}}>
                  <Heading size="sm" p={10} color="$white">
                    Top Categories
                  </Heading>
                  <HStack
                    style={{width: '100%'}}
                    alignItems="center"
                    flexWrap="wrap"
                    justifyContent="space-around">
                    {memoizedCategories}
                  </HStack>
                </View>

                <View>
                  <Heading size="sm" p={10} color="$white">
                    Picked For You
                  </Heading>

                  {Array.isArray(validSuggestions) &&
                    validSuggestions.length === 0 && (
                      <Text px={10} color="$white">
                        We couldn't find any program suggestions for you at this
                        time.
                      </Text>
                    )}

                  <FlatList
                    horizontal
                    data={validSuggestions}
                    keyExtractor={item => item.program.uid}
                    renderItem={({
                      item: {program, trainer, matchingCategories},
                    }) => {
                      if (
                        program.metadata.owner ===
                        (auth?.currentUser?.uid as string)
                      ) {
                        return null;
                      }

                      return (
                        <Pressable
                          onPress={() =>
                            navigation.navigate('ProgramView', {
                              programId: program?.uid,
                              mode: ViewMode.PREVIEW,
                            })
                          }>
                          <View
                            style={{
                              alignSelf: 'center',
                            }}>
                            <ProgramDisplay
                              containerWidth={screenWidth - 10}
                              rounded
                              program={{
                                program,
                                trainer,
                              }}
                            />
                          </View>
                        </Pressable>
                      );
                    }}
                  />
                </View>

                <View>
                  <Heading size="sm" p={10} color="$white">
                    Browse All Categories
                  </Heading>
                  <HStack
                    alignItems="center"
                    flexWrap="wrap"
                    justifyContent="space-around">
                    {memoizedCategoriesLarge}
                  </HStack>
                </View>
              </VStack>
            </View>
          </ScrollView>
        </View>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    alignItems: 'center',
  },
  primaryContainer: {
    width: screenWidth - 10,
    flex: 1,
  },
});
