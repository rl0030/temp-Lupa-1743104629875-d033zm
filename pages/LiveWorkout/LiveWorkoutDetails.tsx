import {useNavigation, useRoute} from '@react-navigation/native';
import React from 'react';
import Background from '../../components/Background';
import {Avatar, AvatarFallbackText, AvatarImage, Box, Button, ButtonText, Image, SafeAreaView, ScrollView, Text, VStack, View} from '@gluestack-ui/themed';
import MainLogo from '../../assets/images/main_logo.png';
import ProgramDisplay from '../../containers/ProgramDisplay';
import useUser from '../../hooks/useAuth';
import { auth } from '../../services/firebase';
import ExerciseSummaryItem from '../../containers/Workout/ExerciseDetails';
import { screenWidth } from '../../constant/size';
import { formatDuration } from '../../util/time';

export default function LiveWorkoutDetails() {
    const navigation = useNavigation()
  const route = useRoute();
  const {program, selectedWeek, selectedSession, workoutTime, completedExercises, trainer} = route?.params;
  const {data: lupaUser} = useUser(auth?.currentUser?.uid);

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <View style={{flex: 1, backgroundColor: 'black', padding: 20 }}>
            <ScrollView>

   
          <VStack alignItems='center' space='xl'>
            <Image source={MainLogo} style={{width: 120, height: 120}} />
            <Avatar size="2xl">
              <AvatarImage source={{uri: lupaUser?.picture}} />
             {!lupaUser?.picture && <AvatarFallbackText>{lupaUser?.name}</AvatarFallbackText>} 
            </Avatar>

            <ProgramDisplay program={{
                program: program,
                trainer: trainer
            }}/>

            <Box
              fontSize={20}
              alignSelf="center"
              style={{
                height: 68,
                justifyContent: 'center',
                width: 331,
                marginTop: 15,
                borderRadius: 10,
                alignItems: 'center',
                backgroundColor: 'rgba(73, 190, 255, 0.4)',
              }}>
              <Text
                width={'100%'}
                pb={10}
                bold
                color="$white"
                style={{textAlign: 'center'}}>
                Session {selectedSession + 1} out of {program?.weeks?.[selectedWeek]?.sessions?.length ?? 0}
              </Text>
            </Box>

            <View style={{ padding: 20}}>
              <Text fontSize={26} fontWeight='800' color='$white' paddingBottom={20} alignSelf='center'>Session Summary</Text>
              <Text fontSize={20} fontWeight='800' alignSelf='flex-start' color='$white'>Session Duration: {formatDuration(workoutTime)}</Text>
              {/* <View marginVertical={10}>
              <Text fontSize={20} fontWeight='800' color='$white'>Workout Metric</Text>
              {
                completedExercises.map((exercise, idx) => {
                    return (
                        <ExerciseSummaryItem item={exercise} index={idx} />
                    )
                })
              }
              </View> */}
       
            </View>
            
          </VStack>
          </ScrollView>
        </View>

        <Button onPress={() => navigation.navigate('Main')} style={{ backgroundColor: 'rgba(108, 108, 108, 0.50)',  borderRadius: 12, height: 50, borderColor: '#646464', borderWidth: 1, width: screenWidth - 20, alignSelf: 'center'}}>
            <ButtonText fontWeight='500' fontSize={25}>
                Home
            </ButtonText>
        </Button>
      </SafeAreaView>
    </Background>
  );
}
