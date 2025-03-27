import React, {useEffect} from 'react';
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
  VStack,
  AvatarImage,
  Textarea,
  Avatar,
  AvatarGroup,
  Divider,
  TextareaInput,
} from '@gluestack-ui/themed';
import {useNavigation} from '@react-navigation/native';
import useCreateNotifications from '../../hooks/lupa/notifications/useManagedNotifications';
import {auth} from '../../services/firebase';
import {GradientScreen} from '../../containers/Conversation';
import OutlinedText from '../../components/Typography/OutlinedText';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import useUser from '../../hooks/useAuth';
import ScrollableHeader from '../../components/ScrollableHeader';
import {sendExternalPackInvitations} from '../../functions/lib';
import {useRecoilValue} from 'recoil';
import {userDataAtom} from '../../state/recoil/userState';
import {onSendExternalPackInvites} from '../../api/firestore-httpsCallable/packs';
import {LupaUser} from '../../types/user';
import {getCityName} from '../../util/location';
import PackMemberHeader from '../../containers/Packs/GradientHeader';
import SendSMS from 'react-native-sms';

const renderAvatarSlot = (invitedUsers, index) => {
  const user = invitedUsers[index];
  if (!user) {
    return null;
  }
  return (
    <View
      style={{
        flex: 1,
        width: '100%',
        flexDirection: 'row',
        //   aspectRatio: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        // backgroundColor: 'rgba(3, 6, 61, 0.4)',
        padding: 5,
      }}>
      <Avatar style={{borderWidth: 1, borderColor: '#FFF', px: 10}}>
        <AvatarImage source={{uri: user?.picture}} />
      </Avatar>
      <View>
        <Text
          pl={15}
          bold
          color="$white"
          size="md"
          numberOfLines={1}
          ellipsizeMode="tail">
          {user?.name}
        </Text>

        <HStack alignItems="center">
          <Text
            pl={15}
            color="$light400"
            size="xs"
            numberOfLines={1}
            ellipsizeMode="tail">
            Confirmed
          </Text>
          <MaterialIcons name="check" color="rgba(105, 218, 77, 1)" />
        </HStack>
      </View>
    </View>
  );
};

const MeetThePackScreen = ({route}) => {
  const {invitedUsers, externalInvitedUsers, packName, uid, greetingMessage} =
    route.params;
  const navigation = useNavigation();
  const {createPackInviteNotifications} = useCreateNotifications();
  const lupaUser = useRecoilValue(userDataAtom);

  const handleSendInvitations = async () => {
    // Create pack notification for internal users.
    await createPackInviteNotifications.mutateAsync({
      sender: auth?.currentUser?.uid as string,
      packUid: uid,
      userUids: invitedUsers,
      message: `${lupaUser?.name} invited you to join a Pack!`,
    });
  
    // Separate the external users into email and phone arrays
    const externalEmailInvitations = [];
    const externalPhoneInvitations = [];
  
    externalInvitedUsers.forEach((user) => {
      if (user?.email) {
        externalEmailInvitations.push(user);
      } else if (user?.phone) {
        externalPhoneInvitations.push(user);
      }
    });
  
    try {
      // Send email invitations
      if (externalEmailInvitations.length > 0) {
        const emailResult = await onSendExternalPackInvites({
          packName: packName,
          inviter: lupaUser?.name,
          invitees: externalEmailInvitations,
          inviterDocId: lupaUser?.id,
          packId: uid,
          headerInformation: {
            name: lupaUser?.name,
            username: lupaUser?.username,
            role: lupaUser?.role,
            photo_url: lupaUser?.picture,
            created_at: lupaUser?.time_created_utc,
            city_name: (await getCityName()) || '',
          },
        });
  
        if (emailResult.success) {
          console.log('All email invitations sent successfully');
        } else {
          console.log('Some email invitations failed to send');
          console.log(emailResult.results);
        }
      }
  
      // Send phone invitations
      if (externalPhoneInvitations.length > 0) {
        const phoneResults = await Promise.all(externalPhoneInvitations.map(invitee => 
          new Promise((resolve) => {
            SendSMS.send({
              body: `${lupaUser?.name} has invited you to join the pack "${packName}". Download our app to join!`,
              recipients: [invitee.phone],
              successTypes: ['sent', 'queued'],
              allowAndroidSendWithoutReadPermission: true,
            }, (completed, cancelled, error) => {
              if (completed) {
                console.debug('Successfully sent SMS to recipient: ', invitee.phone)
                resolve({ success: true, phone: invitee.phone });
              } else if (cancelled) {
                console.debug('SMS queued for recipient: ', invitee.phone)
                resolve({ success: false, phone: invitee.phone, error: 'SMS sending cancelled' });
              } else if (error) {
                console.debug('SMS failed for recipient: ', invitee.phone)
                resolve({ success: false, phone: invitee.phone, error: error });
              }
            });
          })
        ));
  
        const successfulSMS = phoneResults.filter(result => result.success);
        const failedSMS = phoneResults.filter(result => !result.success);
  
        console.log(`${successfulSMS.length} SMS invitations sent successfully`);
        if (failedSMS.length > 0) {
          console.log(`${failedSMS.length} SMS invitations failed to send`);
          console.log('Failed SMS invitations:', failedSMS);
        }
      }
  
    } catch (error) {
      console.error('Error sending invitations:', error);
    }
  };

  useEffect(() => {
    handleSendInvitations();
  }, [uid]);

  // const onSend = () => {
  //   handleSendInvitations();
  // };

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <ScrollableHeader />
        <View style={styles.container}>
          <View style={styles.blueSquare}>
            <View style={{marginVertical: 30}}>
              <OutlinedText
                fontSize={30}
                style={{fontWeight: '800'}}
                textColor="black"
                outlineColor="white">
                Invitations Sent!
              </OutlinedText>
            </View>

            <View
              style={{
                ...styles.blueSquare,
                padding: 12,
                borderRadius: 10,
                alignItems: 'center',
                width: '100%',
                backgroundColor: 'rgba(3, 6, 61, 0.50)',
              }}>
              <PackMemberHeader members={invitedUsers} />
              <Heading py={10} size="2xl" color="$white">
                Meet Your Pack
              </Heading>
              <Divider style={{width: '100%', borderBottomColor: 'white'}} />
              <VStack
                style={{
                  width: '100%',
                  //aspectRatio: 1,
                  //  maxWidth: 200,
                  alignSelf: 'center',
                }}
                my={10}
                space="md">
                <HStack
                  style={{width: '100%'}}
                  space="md"
                  justifyContent="center">
                  {[0, 1].map(index => renderAvatarSlot(invitedUsers, index))}
                </HStack>
                <HStack space="md" justifyContent="center">
                  {[2, 3].map(index => renderAvatarSlot(invitedUsers, index))}
                </HStack>
              </VStack>
            </View>

            <Textarea mt={20} color="$white" textAlign="center">
              <TextareaInput
                value={greetingMessage ?? 'You didnt add a greeting message!'}
              />
            </Textarea>
          </View>
        </View>
        <Button
          my={10}
        //  onPress={onSend}
          onPress={() => navigation.navigate('MessagesHome')}
          style={{
            borderRadius: 10,
            borderWidth: 1,
            height: 50,
            borderColor: '#646464',
            backgroundColor: 'rgba(108, 108, 108, 0.50)',
          }}>
          <ButtonText>Home</ButtonText>
        </Button>
      </SafeAreaView>
    </Background>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  blueSquare: {
    padding: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
});

export default MeetThePackScreen;
