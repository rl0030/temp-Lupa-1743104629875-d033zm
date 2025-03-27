import React from 'react';
import {StyleSheet} from 'react-native';
import Background from '../../components/Background';
import {
  Button,
  ButtonText,
  Text,
  Heading,
  View,
  SafeAreaView,
  HStack,
  AvatarImage,
  Avatar,
} from '@gluestack-ui/themed';
import {useNavigation} from '@react-navigation/native';
import useDeclinePackInvitation, {
  useAcceptPackInvitation,
} from '../../hooks/lupa/packs/usePackUtilities';

const AcceptInvitationScreen = ({route}) => {
  const {pack} = route.params;
  const navigation = useNavigation();
  const {mutate: acceptInvitation} = useAcceptPackInvitation();
  const {mutate: declineInvitation} = useDeclinePackInvitation();

  const handleAcceptInvitation = () => {
    acceptInvitation({packId: pack.id});
    // Navigate to the next screen or show a success message
    navigation.navigate('MyPacks');
  };

  const handleDeclineInvitation = () => {
    declineInvitation({packId: pack.id});
    // Navigate back or show a message
    navigation.navigate('Home');
  };

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <View style={styles.container}>
          <View style={styles.blueSquare}>
            <Heading size="xl" color="$white" mb={4}>
              Pack Invitation
            </Heading>
            <HStack space="lg" justifyContent="center">
              {pack.members.map(user => (
                <Avatar key={user.id} style={{width: 60, height: 60}}>
                  <AvatarImage source={{uri: user.picture}} />
                </Avatar>
              ))}
            </HStack>
            <Text mt={4} color="$white" textAlign="center">
              Pack Name: {pack.name}
            </Text>
          </View>
        </View>
        <Button my={4} onPress={handleAcceptInvitation}>
          <ButtonText>Accept Invitation</ButtonText>
        </Button>
        <Button variant="outline" onPress={handleDeclineInvitation}>
          <ButtonText>Decline Invitation</ButtonText>
        </Button>
      </SafeAreaView>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 10,
  },
  blueSquare: {
    backgroundColor: '$blue500',
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
});

export default AcceptInvitationScreen;
