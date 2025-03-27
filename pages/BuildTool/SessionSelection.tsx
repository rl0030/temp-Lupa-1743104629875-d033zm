import React from 'react';
import {View, ScrollView, StyleSheet, Pressable} from 'react-native';
import {
  Text,
  VStack,
  HStack,
  Image,
  SafeAreaView,
  Box,
  Button,
  ButtonText,
} from '@gluestack-ui/themed';
import Background from '../../components/Background';
import {Program, Exercise, SessionItem} from '../../types/program';
import OutlinedText from '../../components/Typography/OutlinedText';
import {useNavigation} from '@react-navigation/native';
import ExerciseSummaryItem from '../../containers/Workout/ExerciseDetails';
import ScrollableHeader from '../../components/ScrollableHeader';

interface SessionSelectionProps {
  route: {
    params: {
      program: Program;
      selectedWeek: number;
      selectedSession: number;
    };
  };
}

const weekNumbers = [
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
  'Eleven',
  'Twelve',
  'Thirteen',
  'Fourteen',
  'Fifteen',
  'Sixteen',
  'Seventeen',
  'Eighteen',
  'Nineteen',
  'Twenty',
];

const SessionSelection: React.FC<SessionSelectionProps> = ({route}) => {
  const {program, selectedWeek, selectedSession} = route.params;
  const session = program.weeks[selectedWeek]?.sessions[selectedSession];

  const navigation = useNavigation();
  const {navigate} = navigation;
  return (
    <Background>
      <SafeAreaView style={styles.container}>
        <ScrollableHeader showBackButton />
        <View style={styles.container}>
          <ScrollView>
            <OutlinedText
              textColor="black"
              outlineColor="white"
              fontSize={30}
              style={{fontWeight: '900', width: '100%'}}>
              {program.metadata.name}
            </OutlinedText>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.weekView}>
              <HStack space="md" p={4}>
                <OutlinedText
                  textColor="#03063D"
                  fontSize={22}
                  style={{fontWeight: '900'}}
                  outlineColor="white">
                  Week {weekNumbers[selectedWeek] || selectedWeek + 1}
                </OutlinedText>
                {program.weeks[selectedWeek]?.sessions.map(
                  (_, sessionIndex) => (
                    <Pressable
                      key={sessionIndex}
                      onPress={() => {
                        // Handle session selection if needed
                      }}>
                      <Box
                        width={50}
                        height={50}
                        borderRadius={10}
                        borderWidth={1}
                        borderColor={
                          sessionIndex === selectedSession
                            ? '$white'
                            : 'transparent'
                        }
                        bg={
                          sessionIndex === selectedSession
                            ? 'rgba(255, 255, 255, 0.3)'
                            : 'rgba(255, 255, 255, 0.1)'
                        }
                        justifyContent="center"
                        alignItems="center"
                        position="relative">
                        <Text
                          position="absolute"
                          bottom={2}
                          right={4}
                          color={
                            sessionIndex === selectedSession
                              ? '#FFFFFF'
                              : '#646464'
                          }
                          fontSize={26}
                          fontWeight="400">
                          {String.fromCharCode(97 + sessionIndex)}
                        </Text>
                      </Box>
                    </Pressable>
                  ),
                )}
              </HStack>
            </ScrollView>

            <VStack space="md" my={20}>
              {session?.items?.map((item: SessionItem, index: number) => {
                if (item?.type != 'exercise') {
                  return;
                }

                return <ExerciseSummaryItem item={item} index={index} />;
              })}
            </VStack>
          </ScrollView>

          <Button
            onPress={() =>
              navigate('LiveWorkout', {
                program: program,
                selectedSession: selectedSession,
                selectedWeek: selectedWeek,
              })
            }
            style={{
              height: 70,
              backgroundColor: 'rgba(20, 174, 92, 0.70)',
              borderColor: 'rgba(0, 0, 0, 1)',
              borderWidth: 1,
            }}>
            <OutlinedText
              style={{fontSize: 25, fontWeight: '900'}}
              fontSize={30}
              textColor="white"
              outlineColor="black">
              Begin Workout
            </OutlinedText>
          </Button>
        </View>
      </SafeAreaView>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  weekView: {
    marginTop: 10,
    marginBottom: 10,
  },
  programName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: 'white',
    marginBottom: 8,
  },
  weekSession: {
    fontSize: 18,
    color: 'white',
    marginBottom: 16,
  },
  exerciseCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    width: 325,
    height: 59,
  },
  exerciseImage: {
    width: 59,
    height: 59,
    backgroundColor: '#eee',
    borderWidth: 1,
    borderRadius: 8,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  exerciseDescription: {
    fontSize: 14,
    color: 'white',
    marginTop: 4,
  },
  exerciseDetail: {
    fontSize: 14,
    color: 'white',
  },
});

export default SessionSelection;
