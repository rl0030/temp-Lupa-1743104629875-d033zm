import {
  AddIcon,
  EditIcon,
  HStack,
  Heading,
  Icon,
  SafeAreaView,
  ScrollView,
  Text,
  VStack,
  View,
} from '@gluestack-ui/themed';
import React, {useEffect} from 'react';
import {Pressable, StyleSheet} from 'react-native';
import {screenWidth} from '../../constant/size';
import usePrograms, {
  useGetPurchasedPrograms,
} from '../../hooks/lupa/usePrograms';
import {auth} from '../../services/firebase';
import ProgramDisplay from '../../containers/ProgramDisplay';
import Background from '../../components/Background';
import {Program} from '../../types/program';
import {ViewMode} from '../BuildTool';
import ScrollableHeader from '../../components/ScrollableHeader';

export default function AthleteMyPrograms({navigation}) {
  const authUserUid: string = auth?.currentUser?.uid ?? '';

  const {data: myPrograms, refetch} = useGetPurchasedPrograms(authUserUid);
  useEffect(() => {
    refetch();
  }, []);
  return (
    <Background>
      <SafeAreaView style={styles.safeAreaView}>
        <ScrollableHeader showBackButton />
        <HStack
          py={5}
          px={10}
          alignItems="center"
          justifyContent="space-between">
          <Heading size="xl" color="rgba(67, 116, 170, 0.7)">
            My Programs
          </Heading>
        </HStack>

        <ScrollView contentContainerStyle={{padding: 10}}>
          <View>
            <VStack space="md" alignItems="center">
              {myPrograms?.length === 0 && (
                <Text alignSelf="flex-start">
                  You have not purchased any programs.
                </Text>
              )}
              {myPrograms?.map(({program, trainer}) => {
                return (
                  <Pressable
                    key={program.uid}
                    onPress={() =>
                      navigation.navigate('ProgramAthleteView', {
                        mode: ViewMode.PREVIEW,
                        navigation,
                        program,
                      })
                    }>
                    <View style={{alignSelf: 'center'}}>
                      <ProgramDisplay size="sm" program={{program, trainer}} />
                    </View>
                  </Pressable>
                );
              })}
            </VStack>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const styles = StyleSheet.create({
  safeAreaView: {
    flex: 1,
    padding: 10,
  },
});
