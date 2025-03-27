import React, {useEffect, useState} from 'react';
import Background from '../../components/Background';
import {
  SafeAreaView,
  ScrollView,
  View,
  Heading,
  Text,
  HStack,
} from '@gluestack-ui/themed';
import ScrollableHeader from '../../components/ScrollableHeader';
import {screenWidth} from '../../constant/size';
import Achievement from '../../components/Achievement';
import {auth} from '../../services/firebase';
import ProgressTracker from '../../containers/AchievementDisplay';
import {
  useGetAchievements,
  useGetRecentAchievements,
  useGetUserAchievementProgress,
} from '../../hooks/lupa/achievements';
import {ExerciseCategory} from '../../types/program';
import { useNavigation } from '@react-navigation/native';

export default function AchievementsView() {
  const navigation = useNavigation();
  const userId = auth.currentUser?.uid as string;
  const [categories, setCategories] = useState<ExerciseCategory[]>([]);

  const {data: allAchievements, isLoading: isLoadingAll} = useGetAchievements({
    userId,
  });
  const {data: recentAchievements, isLoading: isLoadingRecent} =
    useGetRecentAchievements({userId});

  useEffect(() => {
    if (allAchievements) {
      const uniqueCategories = [
        ...new Set(allAchievements.map(a => a.exerciseCategory)),
      ];
      setCategories(uniqueCategories);
    }
  }, [allAchievements]);

  const renderProgressTrackers = () => {
    return categories.map(category => (
      <ProgressTrackerForCategory
        key={category}
        category={category}
        userId={userId}
      />
    ));
  };

  const navigateToAchievementDetail = achievement => {
    navigation.navigate('AchievementsDetail', {achievement});
  };

  const renderCategoryAchievements = () => {
    return categories.map(category => (
      <View key={category} style={{marginBottom: 20}}>
        <Heading
          size="lg"
          px={10}
          fontWeight="700"
          fontSize={18}
          color="rgb(189, 189, 189)">
          {category}
        </Heading>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{paddingLeft: 10}}>
          <HStack space="sm">
            {allAchievements
              ?.filter(a => a.exerciseCategory === category)
              .map(achievement => (
                <Pressable
                  key={achievement.uid}
                  onPress={() => navigateToAchievementDetail(achievement)}>
                  <Achievement
                    title={`${achievement.tier} ${achievement.exerciseCategory}`}
                    dateAchieved={new Date(
                      achievement.achievedAt,
                    ).toLocaleDateString()}
                  />
                </Pressable>
              ))}
          </HStack>
        </ScrollView>
      </View>
    ));
  };

  return (
    <Background>
      <SafeAreaView style={{flex: 1}}>
        <ScrollView>
          <ScrollableHeader showBackButton />

          <View style={{width: screenWidth}}>
            <Heading
              size="2xl"
              px={10}
              fontWeight="900"
              fontSize={26}
              color="rgb(189, 189, 189)">
              My Achievements
            </Heading>
          </View>

          {isLoadingAll ? (
            <Text px={10} color="white">
              Loading achievements...
            </Text>
          ) : (
            renderProgressTrackers()
          )}

          <View style={{width: screenWidth, marginTop: 20}}>
            <Heading
              size="xl"
              px={10}
              fontWeight="800"
              fontSize={22}
              color="rgb(189, 189, 189)">
              Recents
            </Heading>
          </View>

          {isLoadingRecent ? (
            <Text px={10} color="white">
              Loading recent achievements...
            </Text>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={{paddingLeft: 10}}>
              <HStack space="sm">
                {recentAchievements?.map(achievement => (
                  <Achievement
                    key={achievement.uid}
                    title={`${achievement.tier} ${achievement.exerciseCategory}`}
                    dateAchieved={new Date(
                      achievement.achievedAt,
                    ).toLocaleDateString()}
                  />
                ))}
              </HStack>
            </ScrollView>
          )}

          {renderCategoryAchievements()}
        </ScrollView>
      </SafeAreaView>
    </Background>
  );
}

const ProgressTrackerForCategory = ({category, userId}) => {
  const {data: progress, isLoading} = useGetUserAchievementProgress({
    userId,
    category,
  });

  if (isLoading) {
    return (
      <Text px={10} color="white">
        Loading progress...
      </Text>
    );
  }

  if (!progress) {
    return null;
  }

  return (
    <ProgressTracker
      current={progress.currentSets}
      max={progress.setsToNextTier + progress.currentSets}
      title={`${category} - ${progress.currentTier}`}
    />
  );
};
