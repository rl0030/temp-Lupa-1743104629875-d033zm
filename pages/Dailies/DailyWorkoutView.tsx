import React, { useState } from 'react';
import Background from '../../components/Background';
import {
  Button,
  ButtonText,
  HStack,
  SafeAreaView,
  Text,
  ScrollView,
  Textarea,
  TextareaInput,
  View,
  VStack,
} from '@gluestack-ui/themed';
import ScrollableHeader from '../../components/ScrollableHeader';
import {Image, Pressable, StyleSheet} from 'react-native';
import Share from 'react-native-share';
import ShareArrowRight from '../../assets/icons/ShareArrowRight.png';
import {Daily} from '../../types/activities/dailies';
import Video from 'react-native-video';
import {SessionItem} from '../../types/program';
import OutlinedText from '../../components/Typography/OutlinedText';
import ExerciseSummaryItem from '../../containers/Workout/ExerciseDetails';
import {Chip} from '@rneui/base';
import {screenWidth} from '../../constant/size';
import UserHeader from '../../containers/UserHeader';
import useUser from '../../hooks/useAuth';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Modal as RNModal } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

function DailyWorkoutView() {
    const route = useRoute()
    const navigation = useNavigation()
    const { daily } = route?.params
    const [isVideoFullScreen, setIsVideoFullScreen] = useState(false);
  const {data: trainerData} = useUser(daily?.trainer_uid);
  const renderMediaView = () => {
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
          alt="dailies image"
          resizeMode="cover"
          source={{
            uri: daily?.media,
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
    );
  };

  const share = async () => {
    const shareOptions = {
      message: `Check out this awesome daily workout`,
      title: 'Share Daily Workout',
      url: `lupa://daily/${daily.id}`,
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
  
  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <View style={{flex: 1, padding: 10 }}>
          <ScrollView showsHorizontalScrollIndicator>
            <ScrollableHeader showBackButton />
            <HStack alignItems="center" justifyContent="space-between">
              <OutlinedText
                textColor="black"
                outlineColor="white"
                fontSize={30}
                style={{paddingHorizontal: 0, fontWeight: '900'}}>
               {new Date(daily.date?.seconds * 1000).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}
              </OutlinedText>

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
            {renderMediaView()}
            <View style={{marginTop: 0, marginBottom: 6, minHeight: 20}}>
              <HStack space="md" flexWrap="wrap">
                {daily?.tags?.map((category: string) => (
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
              <TextareaInput
                style={{color: '#FFF'}}
                value={daily?.description ?? ''}
              />
            </Textarea>

            <VStack space="md" my={20}>
              {daily?.items.map((item: SessionItem, index: number) => {
                if (item?.type == 'asset') {
                  return (
                    <View style={{marginLeft: 10, borderRadius: 10, overflow: 'hidden'}}>
                      <Video
                        paused
                        style={{  height: 86, borderRadius: 12}}
                        source={{uri: item?.data?.uri}}
                      />
                    </View>
                  );
                }

                return <ExerciseSummaryItem item={item} index={index} />;
              })}
            </VStack>

            <Button
            onPress={() => navigation.navigate('LiveWorkout', {
                /* Claude look here */
                program: {
                  weeks: [{
                    sessions: [{
                      items: daily.items
                    }]
                  }]
                },
                selectedWeek: 0,
                selectedSession: 0,
                trainer: trainerData
              })}
              style={{
                backgroundColor: 'rgba(20, 174, 92, 0.70)',
                height: 68,
            
              }}>
              <ButtonText>
                <OutlinedText
                  fontSize={30}
                  style={{fontWeight: '700'}}
                  outlineColor="black"
                  textColor="white">
                  Begin Workout
                </OutlinedText>
              </ButtonText>
            </Button>
          </ScrollView>
        </View>
      </SafeAreaView>

      <RNModal
  visible={isVideoFullScreen}
  onRequestClose={() => setIsVideoFullScreen(false)}
  animationType="fade"
  supportedOrientations={['portrait', 'landscape']}
>
  <View style={{ flex: 1, backgroundColor: 'black' }}>
    <Video
      source={{ uri: daily?.media }}
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

export default DailyWorkoutView;
