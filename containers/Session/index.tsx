import React from 'react';
import {View, Box, Text} from '@gluestack-ui/themed';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import {Pressable} from 'react-native';

interface ISessionItemProps {
  onRemove: () => void;
  onPress: () => void;
  onUpdate: () => void;
  sessionIndex: number;
  isRemoveable: boolean;
}

function SessionItem(props: ISessionItemProps) {
  const {onRemove, onPress, onUpdate, isRemoveable, sessionIndex} = props;
  return (
    <Pressable onPress={onPress}>
      <View >
        <Box bg="$secondary500" p="$3" width={'auto'} style={{ borderRadius: 3, alignItems: 'center', justifyContent: 'center' }}>
          {
            isRemoveable && (
              <MaterialIcon
              onPress={onRemove}
              color='red'
              size={15}
              name="remove-circle"
              style={{position: 'absolute', right: -6, top: -6}}
            />
            )
          }
            <Text color='$white'>
              Session {sessionIndex + 1}
            </Text>
        </Box>
      </View>
    </Pressable>
  );
}

export default SessionItem;
