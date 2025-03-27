import React, {useState} from 'react';
import {TouchableOpacity, View, StyleSheet} from 'react-native';
import {Avatar, AvatarImage, Text} from '@gluestack-ui/themed'

export default function ClickableUserCard({user, onPress}) {
  const [isSelected, setIsSelected] = useState(false);

  const handlePress = () => {
    setIsSelected(!isSelected);
    onPress(user);
  };

  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.selectedCard]}
      onPress={handlePress}>
      <Avatar size='sm'>
        <AvatarImage  source={{uri: user.picture }}  />
      </Avatar>
      <View style={styles.userInfo}>
        <Text color='$white' style={styles.name}>{user.name}</Text>
        <Text color='$white' style={styles.username}>{user.username}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 10,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: 'white',
  },
  userInfo: {
    marginLeft: 10,
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  username: {
    fontSize: 14,
  },
});

