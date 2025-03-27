import React, {useEffect, useState} from 'react';
import {StyleSheet, FlatList, Pressable} from 'react-native';
import {
  Text,
  SafeAreaView,
  View,
  Input,
  InputField,
  Heading,
  InputSlot,
  InputIcon,
  SearchIcon,
  HStack,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import useCollectionsSearch from '../../hooks/queries/useSearchUsers';
import ClickableUserCard from '../../containers/ClickableUserCard';
import {LupaUser} from '../../types/user';
import {useNavigation, useRoute} from '@react-navigation/native';
import Background from '../../components/Background';
import BasicUserCard from '../../containers/UserCard/Basic';
import MaterialCommunityIcon from 'react-native-vector-icons/MaterialCommunityIcons';
import ScrollableHeader from '../../components/ScrollableHeader';
import OutlinedText from '../../components/Typography/OutlinedText';
import CirclesThreePlus from '../../assets/icons/CircleThreePlus';
import EntypoIcon from 'react-native-vector-icons/Entypo';

const UserSearchScreen = () => {
  const [searchQuery, setSearchQuery] = useState<string>('');
  const {data: searchResults, refetch: onRefreshSearchResults} =
    useCollectionsSearch(searchQuery, [
      {collectionName: 'users', collectionFields: ['name']},
    ]);
  const navigation = useNavigation();
  const route = useRoute();
  const onUserSelect = route.params?.onUserSelect;
  const mainText = route.params?.mainText ?? '';
  const outlinedText = route?.params?.outlinedText ?? false;
  const IconProp = route?.params?.IconProp ?? <div />
  const searchBarPermanentLabel = route?.params?.searchBarPermanentLabel as string ?? ''
const showExternalInviteButton = route?.params?.showExternalInviteButton ?? false
const headerText = route?.params?.headerText ?? ''
const showIcon = route?.params?.showIcon ?? false
  useEffect(() => {
    onRefreshSearchResults();
  }, [searchQuery]);

  const handleSearch = (query: string) => {
    setSearchQuery(query);
  };

  const handleUserPress = (user: LupaUser) => {
    route?.params?.onUserSelect(user);

    //navigation.goBack();
  };

  const handleExternalUserPress = (user: LupaUser) => {
    route?.params?.onUserSelect(user);
    navigation.navigate('CreatePack')
    //navigation.goBack();
  };

  const onMicPress = () => {};
  const [searchInput, setSearchInput] = useState('');
  return (
    <Background>
      <View style={{flex: 1}}>
        <SafeAreaView style={{flex: 1}}>
          <ScrollableHeader showBackButton />
          <View style={styles.container}>
            <HStack alignItems='center'>
            {outlinedText ? (
                <OutlinedText
                  fontSize={30}
                  textColor="black"
                  outlineColor="white"
                  style={{
                    fontWeight: '700',
                    paddingTop: 10,
                    paddingBottom: 10,
                    paddingLeft: 27,
                    alignSelf: 'flex-start',
                    paddingRight: 10
                  }}>
                  {headerText}
                </OutlinedText>
              ) : (
                <Heading pr={10} py={10} pl={27} alignSelf="flex-start" color="$white">
                  {headerText}
                </Heading>
              )}

{showIcon && <CirclesThreePlus /> }
            </HStack>
         

            <HStack alignItems="center" justifyContent='space-between'>
              
                <Heading py={10} pl={27} alignSelf="flex-start" color="$white">
           {mainText}
                </Heading>
          

          {
            showExternalInviteButton && (
<Pressable
            onPress={() => navigation.navigate('PackInviteExternalUserView', {
              handleUserPress: handleExternalUserPress
            })}>
            <HStack alignItems="center">
              <Text
                width={100}
                textAlign="center"
                color="#BDBDBD"
                fontWeight="800"
                fontSize={12}>
               Invite with Phone Number or Email
              </Text>
              <EntypoIcon
                size={20}
                name="chevron-thin-right"
                color="rgba(189, 189, 189, 1)"
              />
            </HStack>
          </Pressable>
            )
          }

            </HStack>

            {/* <Input mb={20} size="sm" style={{backgroundColor: '#FFF'}}>
              <InputField
                color="$black"
                placeholder="Search users"
                value={searchQuery}
                onChangeText={handleSearch}
              />
            </Input> */}

<Text>
{searchBarPermanentLabel}
</Text>
        
            <Input
              style={{marginHorizontal: 25, borderRadius: 8 ,marginBottom: 10}}
              backgroundColor="$white"
              variant="rounded"
              size="md"
              isDisabled={false}
              isInvalid={false}
              isReadOnly={false}>
              <InputSlot pl="$3">
                <InputIcon as={SearchIcon} color="$coolGray600" />
              </InputSlot>
              <InputField
                value={searchInput}
                placeholder="Search"
                onChangeText={text => setSearchInput(text)}
                onClearText={() => setSearchInput('')}
              />
              <InputSlot pr="$3" onPress={onMicPress}>
                <InputIcon
                  color="$coolGray600"
                  as={() => (
                    <MaterialCommunityIcon
                      size={18}
                      color="grey"
                      name="microphone"
                    />
                  )}
                  color="$gray500"
                />
              </InputSlot>
            </Input>

            <FlatList
              data={searchResults?.users}
              renderItem={({item: user}) => (
                <Pressable onPress={() => handleUserPress(user)}>
                  <View style={{marginVertical: 5}}>
                    <BasicUserCard user={user} hasIcon={false} />
                  </View>
                </Pressable>
              )}
              keyExtractor={user => user.id}
            />
          </View>
        </SafeAreaView>
      </View>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  searchInput: {
    height: 40,
    borderWidth: 1,
    color: '#FFF',
    borderColor: 'gray',
    borderRadius: 8,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
});

export default UserSearchScreen;
