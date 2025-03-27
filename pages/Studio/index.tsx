import React, {useEffect, useState} from 'react';
import Background from '../../components/Background';
import {
  HStack,
  Image,
  Heading,
  SafeAreaView,
  Text,
  View,
  Box,
  VStack,
} from '@gluestack-ui/themed';
import SkinnyMapIcon from '../../assets/icons/SkinnyMapPinIcon.png';
import {LupaUser, Studio} from '../../types/user';
import {getStudio, getUsers} from '../../api';
import {useRoute} from '@react-navigation/native';
import {screenWidth} from '../../constant/size';
import OutlinedText from '../../components/Typography/OutlinedText';
import UserHeader from '../../containers/UserHeader';
import ScrollableHeader from '../../components/ScrollableHeader';

export default function StudioProfile() {
  const route = useRoute();
  const {uid} = route?.params;
  const [studio, setStudio] = useState<Studio | null>(null);

  useEffect(() => {
    async function load() {
      const studio = await getStudio(uid);
      const studioMembers = await getUsers(studio?.trainers);

      setStudio({
        ...studio,
        trainers: studioMembers,
      });
    }

    load();
  }, []);

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <ScrollableHeader showBackButton />
        <View style={{flex: 1, padding: 10}}>
          <Heading color="$white" fontSize={28} style={{fontWeight: '600'}}>
            {studio?.name ?? 'Unknown Studio Name'}
          </Heading>

          <Image
            source={{uri: studio?.picture}}
            style={{width: screenWidth, height: 223}}
          />

          <HStack
            marginVertical={10}
            alignItems="center"
            justifyContent="flex-start">
            <Image source={SkinnyMapIcon} style={{width: 29, height: 29}} />
            <Text color="$white" fontSize={18} style={{fontWeight: '800'}}>
              {studio?.formatted_address ?? 'Unknown address'}
            </Text>
          </HStack>

          <Box
            marginVertical={30}
            style={{
              padding: 20,
              borderRadius: 12,
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: 'rgba(100, 100, 100, 0.5)',
            }}>
            <Text fontSize={18} style={{fontWeight: '600'}}>
              {studio?.description ?? 'No Studio Description'}
            </Text>
          </Box>

          <View>
            <OutlinedText fontSize={25} textColor="white" outlineColor="black">
              Meet Our Trainers
            </OutlinedText>
            <VStack alignItems="flex-start">
              {(!Array.isArray(studio?.trainers) ||
                studio?.trainers?.length == 0) && (
                <Text py={10}>This studio hasn't added any trainers.</Text>
              )}
              {studio?.trainers?.map((trainer: LupaUser) => {
                <UserHeader
                  name={trainer.name}
                  photo_url={trainer?.picture}
                  key={trainer?.uid}
                  role="trainer"
                />;
              })}
            </VStack>
          </View>
        </View>
      </SafeAreaView>
    </Background>
  );
}
