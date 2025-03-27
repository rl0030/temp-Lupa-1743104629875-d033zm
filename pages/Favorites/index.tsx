import React, {useState} from 'react';
import {
  Button,
  ButtonText,
  HStack,
  View,
  FlatList,
  Text,
  SafeAreaView,
} from '@gluestack-ui/themed';
import Background from '../../components/Background';
import SearchInput from '../../components/SearchInput/SearchInputV1';
import BasicUserCard from '../../containers/UserCard/Basic';
import useUser from '../../hooks/useAuth';
import {auth} from '../../services/firebase';
import LoadingScreen from '../../components/LoadingScreen';
import {useFavorites} from '../../hooks/lupa/user/useFavorites';
import {useNavigation} from '@react-navigation/native';
import {LupaUser} from '../../types/user';
import ScrollableHeader from '../../components/ScrollableHeader';

export default function FavoriteUsers() {
  const [searchBarVariant, setSearchBarVariant] = useState('normal');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const {data: lupaUser, isLoading: isUserLoading} = useUser(
    auth?.currentUser?.uid,
  );
  const {data: favorites, isLoading: isFavoritesLoading} = useFavorites(
    lupaUser?.id,
  );

  const filteredFavorites: LupaUser[] = favorites?.filter(favorite =>
    favorite.name.toLowerCase().includes(searchInput.toLowerCase()),
  );

  const navigation = useNavigation();

  if (isUserLoading || isFavoritesLoading) {
    return <LoadingScreen />;
  }

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <ScrollableHeader showBackButton />
        <View style={{flex: 1, padding: 16}}>
          <SearchInput
            value={searchInput}
            onChangeText={text => setSearchInput(text)}
            onFocus={() => {
              setIsSearchFocused(true);
              setSearchBarVariant('focused');
            }}
            placeholder="Search Favorites"
            onBlur={() => {
              setIsSearchFocused(false);
              setSearchBarVariant('normal');
            }}
            variant={searchBarVariant}
          />

          <FlatList
            data={filteredFavorites}
            keyExtractor={item => item.uid}
            renderItem={({item}: {item: LupaUser}) => (
              <BasicUserCard
                user={item}
                onPress={() => {
                  /* Handle press */
                  navigation.navigate('UserProfile', {
                    uid: item.uid,
                  });
                }}
              />
            )}
            ListEmptyComponent={
              <View
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  alignItems: 'center',
                  marginTop: 20,
                }}>
                <Text>You have not added any favorites.</Text>
              </View>
            }
          />
        </View>
      </SafeAreaView>
    </Background>
  );
}
