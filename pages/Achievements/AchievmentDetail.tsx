import React from 'react';
import Background from '../../components/Background';
import {
  HStack,
  Image,
  SafeAreaView,
  ScrollView,
  Text,
  VStack,
  View,
  Heading,
} from '@gluestack-ui/themed';
import ScrollableHeader from '../../components/ScrollableHeader';
import {ProgressComponent} from '../../containers/AchievementDisplay';
import {useRoute} from '@react-navigation/native';
import {Achievement, getAchievementImage, getAchievementImageByTierNumber} from '../../types/achievements';
import PlusCircleIcon from '../../assets/icons/achievements/PlusCircleIcon';

export default function AchievementsDetailView() {
  const route = useRoute();
  const {achievement} = route.params as {achievement: Achievement};

  const getNextTier = (currentTier: string) => {
    const tiers = [
      'Bronze',
      'Silver',
      'Gold',
      'Platinum',
      'Amethyst',
      'Sapphire',
      'Diamond',
      'Onyx',
    ];
    const currentIndex = tiers.indexOf(currentTier);
    return currentIndex < tiers.length - 1
      ? tiers[currentIndex + 1]
      : 'Max Tier';
  };

  const nextTier = getNextTier(achievement.tier);

  const Badge = getAchievementImageByTierNumber(achievement.tier ?? 0)
  const NextBadgeTier = getAchievementImage(nextTier ?? "bronze")
  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <View style={{flex: 1, padding: 10}}>
          <ScrollableHeader showBackButton />

          <HStack justifyContent="space-between" alignItems="center">
            <Heading
              size="2xl"
              px={10}
              fontWeight="900"
              fontSize={26}
              color="rgb(189, 189, 189)">
              {achievement.exerciseCategory}
            </Heading>

            {/* <HStack space="md">
              <VStack space="sm">
                <PlusCircleIcon />
                <Text style={{width: 62, color: '#2D8BFA', fontSize: 11}}>
                  Place Trophy in Profile Showcase
                </Text>
              </VStack>
            </HStack> */}
          </HStack>

          <Text
            style={{
              textAlign: 'center',
              color: 'white',
              fontSize: 20,
              marginVertical: 10,
            }}>
            {achievement.tier} - {achievement.exerciseCategory}
          </Text>

          <View
            style={{
              borderRadius: 10,
              borderColor: '#000',
              backgroundColor: 'rgba(3,6,61,.75)',
              padding: 15,
              marginVertical: 10,
            }}>
            <VStack space="sm" alignItems="center">
              <Image
                source={{uri: 'https://placeholder.com/150'}} // Replace with actual achievement image
                alt="achievement image"
                style={{width: 150, height: 150, borderRadius: 75}}
              />

              <Text style={{color: 'white', fontSize: 18}}>
                Completed {achievement.currentSets} Sets of{' '}
                {achievement.exerciseCategory}
              </Text>

              <Text style={{color: 'white', fontSize: 16}}>
                {achievement.currentSets}/{achievement.currentSets} // Assuming
                the achievement is completed
              </Text>

              <Text style={{color: 'white', fontSize: 14}}>Achieved On:</Text>
              <Text style={{color: 'white', fontSize: 14}}>
                {new Date(achievement.achievedAt).toLocaleString()}
              </Text>
            </VStack>
          </View>

          <ProgressComponent
            current={achievement.currentSets}
            max={achievement.currentSets}
          />

          <HStack my={3} justifyContent="space-between" alignItems="center">
            <VStack alignItems="center">
              <Text style={{color: 'white'}}>Current Tier</Text>
              <Text style={{color: 'white', fontSize: 18}}>
                {achievement.tier}
              </Text>
             <Badge />
            </VStack>

            <VStack alignItems="center">
              <Text style={{color: 'white'}}>Next Tier:</Text>
              <Text style={{color: 'white', fontSize: 18}}>{nextTier}</Text>
             <NextBadgeTier />
            </VStack>
          </HStack>
        </View>
      </SafeAreaView>
    </Background>
  );
}
