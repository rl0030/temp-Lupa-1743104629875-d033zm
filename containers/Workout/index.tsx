import React from 'react';
import {View, Box} from '@gluestack-ui/themed';

interface IWorkoutItemProps {}

function WorkoutItem(props: IWorkoutItemProps) {
  return (
    <View>
      <Box bg="$secondary500" p="$5"></Box>
    </View>
  );
}

export default WorkoutItem;
