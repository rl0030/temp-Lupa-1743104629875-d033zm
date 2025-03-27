import { Box, Divider, HStack, Image, Pressable, Text, View, VStack } from "@gluestack-ui/themed";
import { useNavigation } from "@react-navigation/native";
import React, { useState } from "react";
import Ionicons from "react-native-vector-icons/Ionicons";
import Video from "react-native-video";
import OutlinedText from "../../components/Typography/OutlinedText";
import useUser from "../../hooks/useAuth";
import { Daily } from "../../types/activities/dailies";
import UserHeader from "../UserHeader";
import { Modal } from 'react-native'
import { BarbellIcon } from "../../assets/icons/activities";

const DailyCard = ({daily}: {daily: Daily}) => {
    const {data: lupaUser} = useUser(daily.trainer_uid);
    const exercisesOnly = daily.items?.filter((exercise) => exercise?.type === 'exercise')
    const navigation = useNavigation()
    const [isVideoFullScreen, setIsVideoFullScreen] = useState(false);

    return (
      <Box
        style={{
          borderRadius: 10,
          backgroundColor: 'rgba(3, 6, 61, 0.59)',
          minHeight: 220,
          padding: 10,
          width: '100%',
        }}>
        <HStack pb={10} alignItems="center" justifyContent="space-between">
          <Text bold style={{ fontSize: 19, fontWeight: '600', color: 'white'}}>
            {new Date(daily.date?.seconds * 1000).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}
          </Text>
        <BarbellIcon width={30} height={30} />
        </HStack>
  
        <HStack alignItems="center" justifyContent="space-between">
          <Pressable onPress={() => setIsVideoFullScreen(true)}>
            <View
              style={{
                backgroundColor: '#BDBDBD',
                width: 108,
                height: 108,
                borderRadius: 108,
                alignItems: 'center',
                justifyContent: 'center',
              }}>
              <Ionicons name="play-outline" size={40} color="#000000" />
            </View>
          </Pressable>
  
          <VStack alignItems="center">
            {exercisesOnly?.map(exercise => {
              return (
                <Box style={{ width: 160, marginVertical: 2,borderRadius: 10, height: 44, backgroundColor: '#BDBDBD', borderColor: '#FFF',borderWidth: 1,  display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexDirection: 'row'}}>
                  <OutlinedText fontSize={17}  textColor='white' outlineColor='black' style={{ marginLeft: 14, width: 90,  fontWeight: '700', textAlign: 'center',}}>{exercise?.data?.name}</OutlinedText>
                  <Box style={{ overflow: 'hidden', borderRadius: 10,  width: 44, height: 44, }}>
                    <Video
                      paused
                      style={{width: '100%', height: '100%', borderRadius: 10,}}
                      source={{uri: exercise?.data?.media_uri_as_base64}}
                    />
                  </Box>
                </Box>
              );
            })}
          </VStack>
  
          <HStack alignItems="center">
            <Pressable onPress={() => navigation.navigate('DailyWorkoutView', { daily })}>
              <Text
                style={{
                  fontSize: 10,
                  textAlign: 'center',
                  width: 50,
                  color: '#BDBDBD',
                }}>
                View Workout
              </Text>
            </Pressable>
            <Ionicons name="chevron-forward" color="#BDBDBD" />
          </HStack>
        </HStack>
        <Divider my='$3' />
        <HStack alignItems="center">
          <UserHeader
            name={lupaUser?.name}
            role="trainer"
            photo_url={lupaUser?.picture}
          />
          <Text fontSize={20} color='$white'> posted a Daily</Text>
        </HStack>
  
        <Modal
          visible={isVideoFullScreen}
          onRequestClose={() => setIsVideoFullScreen(false)}
          animationType="fade"
          supportedOrientations={['portrait', 'landscape']}
        >
          <View style={{ flex: 1, backgroundColor: 'black' }}>
          <Video
  source={{ uri: daily.media }}
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
        </Modal>
      </Box>
    );
  };

  export default DailyCard