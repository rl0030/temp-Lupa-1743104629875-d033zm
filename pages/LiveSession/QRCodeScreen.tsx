import React, { useEffect, useState } from 'react';
import { View, Text } from 'react-native';
import QRCode from 'react-qr-code';
import { useNavigation, useRoute } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LiveSessionParamList } from '../navigation/LiveSessionNavigator';
import LoadingScreen from '../../components/LoadingScreen';
import { realtime_db } from '../../services/firebase/realtime_database';
import { child, off, onValue, ref, set } from 'firebase/database';

type QRCodeScreenNavigationProp = StackNavigationProp<LiveSessionParamList, 'QRCode'>;

const QRCodeScreen = () => {
  const route = useRoute()
  const { sessionUid } = route?.params
  const navigation = useNavigation<QRCodeScreenNavigationProp>();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const sessionRef = ref(realtime_db, `sessions/${sessionUid}`);
    set(sessionRef, {
      workoutState: {
        selectedWeekIndex: 0,
        selectedSessionIndex: 0,
        currentExerciseIndex: 0,
        currentSetIndex: 0,
        isRestTime: false,
        restTimeRemaining: 30,
        isWorkoutComplete: false,
        showInstructions: true,
      },
      sessionMetadata: {
        is_complete: false,
        is_paused: true  // Start the session as paused
      }
    }).then(() => setIsLoading(false))
      .catch(error => {
        console.error('Error initializing session:', error);
        setIsLoading(false);
      });

     
    const metadataRef = child(sessionRef, 'sessionMetadata')
 
    onValue(metadataRef, (snapshot) => {
      const data = snapshot.val();
      if (data && data.is_complete) {
        navigation.navigate('LiveSessionComplete', { sessionUid });
      }
    });

    return () => {
      off(metadataRef)
    };
  }, []);

  if (isLoading) {
    return <LoadingScreen />;
  }

  return (
    <View style={{flex: 1, justifyContent: 'center', alignItems: 'center'}}>
      <Text>Scan this QR code to join the session</Text>
      <QRCode value={sessionUid} size={200} />
      <Text>Session ID: {sessionUid}</Text>
    </View>
  );
};

export default QRCodeScreen;