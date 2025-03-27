import React, {useEffect, useState} from 'react';
import {Alert, Pressable, SafeAreaView, StyleSheet, View} from 'react-native';
import Background from '../../components/Background';
import {
  HStack,
  VStack,
  ScrollView,
  Text,
  Heading,
  Box,
} from '@gluestack-ui/themed';

import {useNavigation} from '@react-navigation/native';
import {auth} from '../../services/firebase';

import AsyncStorage from '@react-native-community/async-storage';
import SearchInput from '../../components/SearchInput/SearchInputV1';
import useCollectionsSearch from '../../hooks/queries/useSearchUsers';
import {getPack, getProgram, getUser} from '../../api';
import {
  LupaUser,
  Pack,
  ScheduledMeetingClientType,
  SessionPackage,
  Studio,
} from '../../types/user';
import {ProgramDetailsWithTrainerName} from '../../types/program';
import SmallProgramDisplay from '../../containers/ProgramDisplay/SmallProgramDisplay';
import {screenWidth} from '../../constant/size';
import {screensEnabled} from 'react-native-screens';
import {ViewMode} from '../BuildTool';
import ProgramDisplay from '../../containers/ProgramDisplay';
import BasicUserCard from '../../containers/UserCard/Basic';
import BasicStudioCard from '../../containers/UserCard/BasicStudioCard';
import {GradientScreen} from '../../containers/Conversation';
import PackMemberHeader from '../../containers/Packs/GradientHeader';
import ScrollableHeader from '../../components/ScrollableHeader';
import {ProfileMode} from '../../util/mode';

const loadItemData = async (type: string, uid: string) => {
  switch (type) {
    case 'user':
      return await getUser(uid);
    case 'program':
      return await getProgram(uid);
    case 'pack':
      return await getPack(uid);
    default:
      return;
  }
};

interface IRecentSearchesProps {
  searches: Array<{type: string; item: string}>;
  onSelectSearch: (search: {type: string; item: string}) => void;
}

function RecentSearches({searches, onSelectSearch}: IRecentSearchesProps) {
  const [loadedItems, setLoadedItems] = useState({});

  useEffect(() => {
    // Load data for each search item
    searches.forEach(search => {
      loadItemData(search.type, search.item).then(data => {
        setLoadedItems(prev => ({...prev, [search.item]: data}));
      });
    });
  }, [searches]);

  const renderSearchItem = (search: {type: any; item: any}) => {
    const item = loadedItems[search.item];
    if (!item) return null; // Item not loaded yet

    switch (search.type) {
      case 'user':
        return (
          <Box style={{}}>
            <Pressable onPress={() => onSelectSearch(search)}>
              <BasicUserCard user={item} hasIcon={false} />
            </Pressable>
          </Box>
        );
      case 'program':
        return (
          <Pressable onPress={() => onSelectSearch(search)}>
            <SmallProgramDisplay
              containerWidth={screenWidth}
              program={{program: item?.program, trainer: item?.trainer}}
            />
          </Pressable>
        );
      case 'pack':
        return (
          <Pressable onPress={() => onSelectSearch(search)}>
            <Text>{item.name}</Text>
          </Pressable>
        );
      default:
        return null;
    }
  };

  return (
    <VStack space="md" style={{}}>
      <Text padding={10} fontSize={16} bold color="$white">
        Recent Searches
      </Text>
      {searches.map((search, index) => (
        <View
          key={index}
          style={{width: screenWidth - 20, justifyContent: 'center'}}>
          {renderSearchItem(search)}
        </View>
      ))}
    </VStack>
  );
}

export default function ActiveSearchView() {
  const navigation = useNavigation();
  const {navigate} = navigation;

  const [recentSearches, setRecentSearches] = useState<
    {type: string; item: string | any}[]
  >([]);

  useEffect(() => {
    // Load recent searches from local storage
    const loadRecentSearches = async () => {
      try {
        const storedRecentSearches = await AsyncStorage.getItem(
          'recentSearches',
        );

        if (storedRecentSearches) {
          setRecentSearches(JSON.parse(storedRecentSearches));
        }
      } catch (error) {
        console.error('Error loading recent searches:', error);
      }
    };
    loadRecentSearches();
  }, []);

  const addToRecentSearches = async (type: string, item: string) => {
    try {
      setRecentSearches(prev => {
        const newSearch = {type, item};
        const filteredSearches = prev.filter(s => s.item !== item);
        const updatedSearches = [newSearch, ...filteredSearches].slice(0, 5); // Keep only the 5 most recent

        // Save recent searches to local storage
        AsyncStorage.setItem('recentSearches', JSON.stringify(updatedSearches));

        return updatedSearches;
      });
    } catch (error) {
      console.error('Error saving recent searches:', error);
    }
  };

  const onSelectSearch = async (search: {
    type: any;
    item: {role: string; uid: any};
  }) => {
    Alert.alert(search.item?.uid, "")
    // Navigate to the appropriate screen based on the search type
    switch (search.type) {

      case 'user':
        const user = await getUser(search.item);
        navigate(
          user?.role === 'trainer' ? 'TrainerProfile' : 'AthleteProfile',
          {
            uid: search.item,
            mode: ProfileMode.Normal,
          },
        );
        break;
      case 'program':
        navigate('ProgramView', {
          programId: search.item?.uid,
          mode: ViewMode.PREVIEW,
        });
        break;
      case 'pack':
        navigate('PurchaseHome', {
          uid: search.item.uid,
          productType: 'package',
          clientType: ScheduledMeetingClientType.User,
        });
        break;
      case 'studio':
        navigate('StudioView', {
          uid: search.item.uid,
        });
      default:
        break;
    }
  };

  const [searchInput, setSearchInput] = useState('');

  const {
    data: searchResults,
    refetch: onSearch,
    isLoading: isLoadingSearchResults,
  } = useCollectionsSearch(searchInput, [
    {collectionName: 'users', collectionFields: ['name']},
    {collectionName: 'programs', collectionFields: ['metadata.name']},
    {collectionName: 'packages', collectionFields: ['name']},
    {collectionName: 'packs', collectionFields: ['name']},
    {collectionName: 'studios', collectionFields: ['name']},
  ]);

  console.log('@@@@')
  console.log(searchResults)

  useEffect(() => {
    onSearch();
  }, [searchInput]);

  return (
    <Background>
      <SafeAreaView style={styles.safeAreaView}>
        <ScrollableHeader showBackButton />
        <View style={styles.container}>
          <View style={{marginHorizontal: 10}}>
            <SearchInput
              value={searchInput}
              placeholder="What kind of would you would like?"
              onChangeText={(text: React.SetStateAction<string>) =>
                setSearchInput(text)
              }
              variant="focused"
              onFocus={() => {}}
              onBlur={() => {}}
            />
          </View>
          <View style={{flex: 1}}>
            {searchInput.length > 0 ? (
              <ScrollView>
                <VStack>
                  <Text padding={10} fontSize={16} bold color="$white">
                    Profile
                  </Text>
                  <VStack space="md">
                    {searchResults?.users?.length === 0 && (
                      <Text padding={10}>
                        No users were found from your search query
                      </Text>
                    )}
                    {searchResults?.users?.map((user: LupaUser) => {
                      return (
                        <Pressable
                        key={user?.uid}
                        onPress={() => {
                          addToRecentSearches('user', user.uid);
                          navigation.navigate(
                            user?.role == 'trainer' ? 'TrainerProfile' : 'AthleteProfile',
                            {
                              uid: user.uid,
                              mode: ProfileMode.Normal,
                            }
                          );
                        }}
                      >
                        <BasicUserCard
                          user={user}
                          onPressIcon={() => {}}
                          CustomIcon="close-box-outline"
                          iconColor="#00FF00"
                          iconSize={28}
                        />
                      </Pressable>
                      );
                    })}
                  </VStack>
                </VStack>

                <VStack>
                  <Text padding={10} fontSize={16} bold color="$white">
                    Packs
                  </Text>
                  <VStack space="md">
                    {searchResults?.packs?.length === 0 && (
                      <Text padding={10}>
                        No packs were found from your search query
                      </Text>
                    )}
                    {searchResults?.packs?.map((pack: Pack) => {
                      return (
                        <Pressable
                          onPress={() => {
                            //   addToRecentSearches('user', user.uid);
                            // navigate(
                            //   user.role === 'trainer'
                            //     ? 'TrainerProfile'
                            //     : 'AthleteProfile',
                            //   {uid: user.uid},
                            // );
                          }}>
                          <PackMemberHeader
                            members={pack.members}
                          />
                        </Pressable>
                      );
                    })}
                  </VStack>
                </VStack>

                <VStack>
                  <Text padding={10} fontSize={16} bold color="$white">
                    Programs
                  </Text>
                  <VStack space="md">
                    {searchResults?.programs?.length === 0 && (
                      <Text padding={10}>
                        No programs were found from your search query
                      </Text>
                    )}
                    {searchResults?.programs?.map(
                      (program: ProgramDetailsWithTrainerName) => {
                        if (
                          program.program.metadata.owner ===
                          auth?.currentUser?.uid
                        ) {
                          // return null;
                        }

                        return (
                          <View
                            style={{
                              width: screenWidth,
                              alignSelf: 'center',
                              justifyContent: 'center',
                              alignItems: 'center',
                            }}>
                            <Pressable
                              onPress={() => {
                                // addToRecentSearches(
                                //   'program',
                                //   program.program.uid,
                                // );
console.log(program?.program?.uid)

                                navigate('ProgramView', {
                                  programId: program.program?.uid,
                                  mode: ViewMode.PREVIEW,
                                });
                              }}>
                              <SmallProgramDisplay
                                containerWidth={screenWidth - 10}
                                program={{
                                  program: program.program,
                                  trainer: program.trainer,
                                }}
                              />
                            </Pressable>
                          </View>
                        );
                      },
                    )}
                  </VStack>
                </VStack>

                <VStack>
                  <Text padding={10} fontSize={16} bold color="$white">
                    Studios
                  </Text>
                  <VStack space="md">
                    {searchResults?.studios?.length === 0 && (
                      <Text padding={10}>
                        No studios were found from your search query
                      </Text>
                    )}
                    {searchResults?.studios?.map((studio: Studio) => {
                      return (
                        <View
                          style={{
                            width: screenWidth,
                            alignSelf: 'center',
                            justifyContent: 'center',
                            alignItems: 'center',
                          }}>
                          <Pressable
                            onPress={() => {
                              addToRecentSearches('studio', studio.uid);
                              navigate('StudioView', {
                                uid: Studio.uid,
                              });
                            }}>
                            <BasicStudioCard user={studio} />
                          </Pressable>
                        </View>
                      );
                    })}
                  </VStack>
                </VStack>

                {/* <VStack>
                  <Text padding={10} fontSize={16} bold color="$white">
                    Packages
                  </Text>
                  <VStack space="md">
                    {searchResults?.packages.length === 0 && (
                      <Text padding={10}>No packages were found from your search query</Text>
                    )}
                    {searchResults?.packages?.map(
                      (packageData: SessionPackage) => {
                        return (
                          <Pressable
                            onPress={() => {
                                addToRecentSearches('package', `default-package`);
                              navigate('PurchaseHome', {
                                uid: packageData.uid,
                                productType: 'package',
                                clientType: ScheduledMeetingClientType.User,
                              })
                            }}>
                            <Text>{packageData.name}</Text>
                          </Pressable>
                        );
                      },
                    )}
                  </VStack>
                </VStack> */}
              </ScrollView>
            ) : (
              <RecentSearches
                searches={recentSearches}
                onSelectSearch={onSelectSearch}
              />
            )}
          </View>
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
  container: {
    width: '100%',
    flex: 1,
  },
});
