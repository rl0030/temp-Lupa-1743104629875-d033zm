import React from 'react';
import { View } from 'react-native';
import { VStack, Text, HStack } from '@gluestack-ui/themed';
import OutlinedText from '../../components/Typography/OutlinedText';

const calculateSessionStats = (exercises) => {
  return {
    // Total reps of each exercise
    exerciseReps: exercises.reduce((acc, exercise) => {
      const totalReps = exercise.sets * exercise.reps;
      if (!acc[exercise.name]) {
        acc[exercise.name] = totalReps;
      } else {
        acc[exercise.name] += totalReps;
      }
      return acc;
    }, {}),
    
    // Total weight moved per exercise (sets * reps * weight)
    exerciseWeight: exercises.reduce((acc, exercise) => {
      const totalWeight = exercise.sets * exercise.reps * exercise.weight_in_pounds;
      if (!acc[exercise.name]) {
        acc[exercise.name] = totalWeight;
      } else {
        acc[exercise.name] += totalWeight;
      }
      return acc;
    }, {}),
    
    // Total session weight
    totalSessionWeight: exercises.reduce((sum, exercise) => 
      sum + (exercise.sets * exercise.reps * exercise.weight_in_pounds), 0)
  };
};

const SessionRecords = ({ exercises }) => {
  const stats = calculateSessionStats(exercises);
  
  // Find exercise with most reps
  const mostReps = Object.entries(stats.exerciseReps)
    .reduce((max, [name, reps]) => 
      reps > (max?.reps || 0) ? { name, reps } : max, null);
    
  // Find exercise with most weight moved
  const mostWeight = Object.entries(stats.exerciseWeight)
    .reduce((max, [name, weight]) => 
      weight > (max?.weight || 0) ? { name, weight } : max, null);

  return (
    <VStack space="md" width="100%" mt={30} mb={6}>
      <OutlinedText
        textColor="rgb(189, 189, 189)"
        outlineColor="black"
        fontSize={26}
        style={{ fontWeight: '900', marginBottom: 20 }}>
        Session Records
      </OutlinedText>

      {/* Most Reps Record */}
      <View 
        style={{
          borderRadius: 10,
          borderColor: '#000',
          backgroundColor: 'rgba(3,6,61,.75)',
          padding: 15,
          marginBottom: 10,
        }}>
        <VStack space="sm" alignItems="center">
          <OutlinedText
            textColor="white"
            outlineColor="black"
            fontSize={20}
            style={{ fontWeight: 'bold' }}>
            Most Reps in Session
          </OutlinedText>
          
          <Text style={{ color: 'white', fontSize: 18, marginTop: 5 }}>
            {mostReps?.name ?? "-"}: {mostReps?.reps ?? "-"} reps
          </Text>
        </VStack>
      </View>

      {/* Most Weight Record */}
      <View 
        style={{
          borderRadius: 10,
          borderColor: '#000',
          backgroundColor: 'rgba(3,6,61,.75)',
          padding: 15,
          marginBottom: 10,
        }}>
        <VStack space="sm" alignItems="center">
          <OutlinedText
            textColor="white"
            outlineColor="black"
            fontSize={20}
            style={{ fontWeight: 'bold' }}>
            Most Weight Moved
          </OutlinedText>
          
          <Text style={{ color: 'white', fontSize: 18, marginTop: 5 }}>
            {mostWeight?.name ?? "-"}: {mostWeight?.weight.toLocaleString() ?? "-"}lbs
          </Text>
        </VStack>
      </View>

      {/* Total Session Volume */}
      <View 
        style={{
          borderRadius: 10,
          borderColor: '#000',
          backgroundColor: 'rgba(3,6,61,.75)',
          padding: 15,
        }}>
        <VStack space="sm" alignItems="center">
          <OutlinedText
            textColor="white"
            outlineColor="black"
            fontSize={20}
            style={{ fontWeight: 'bold' }}>
            Total Session Volume
          </OutlinedText>
          
          <Text style={{ color: 'white', fontSize: 18, marginTop: 5 }}>
            {stats.totalSessionWeight.toLocaleString()} lbs
          </Text>
        </VStack>
      </View>
    </VStack>
  );
};

export default SessionRecords;