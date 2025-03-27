import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { VStack, Text, HStack, Image, Progress } from '@gluestack-ui/themed';
import OutlinedText from '../../components/Typography/OutlinedText';
import { getCurrentTierForCategory } from '../../api/achievements';
import { UserAchievementProgress, ACHIEVEMENT_REQUIREMENTS, getAchievementImage } from '../../types/achievements';
import { ExerciseCategory } from '../../types/program';

const SessionAchievements = ({ exercises, userId }) => {
  const [categoryProgress, setCategoryProgress] = useState<Map<ExerciseCategory, UserAchievementProgress>>(new Map());

  useEffect(() => {
    const fetchProgress = async () => {
      const categories = new Set(exercises.map(exercise => exercise.category));
      const progressPromises = Array.from(categories).map(async category => {
        const progress = await getCurrentTierForCategory(userId, category);
        return [category, progress];
      });
      const progressResults = await Promise.all(progressPromises);
      setCategoryProgress(new Map(progressResults));
    };

    fetchProgress();
  }, [exercises, userId]);

  if (categoryProgress.size === 0) return null;

  return (
    <VStack space="md" width="100%" mt={4}>
      <OutlinedText
        textColor="rgb(189, 189, 189)"
        outlineColor="black"
        fontSize={26}
        style={{ fontWeight: '900', marginBottom: 20 }}>
        Achievements Progress
      </OutlinedText>

      {Array.from(categoryProgress.entries()).map(([category, progress]) => {
        const currentTierReq = ACHIEVEMENT_REQUIREMENTS.find(req => req.tier === progress.currentTier);
        const nextTierReq = ACHIEVEMENT_REQUIREMENTS.find(req => req.tier === progress.nextTier);
        const progressPercentage = ((nextTierReq.requiredSets - progress.setsToNextTier) / nextTierReq.requiredSets) * 100;


        const Badge = getAchievementImage(currentTierReq?.name ?? "bronze")
        const NextTierBadge = getAchievementImage(nextTierReq?.name ?? "bronze")
        return (
          <View 
            key={category}
            style={{
              borderRadius: 10,
              borderColor: '#000',
              backgroundColor: 'rgba(3,6,61,.75)',
              padding: 15,
              marginBottom: 15,
            }}>
            <VStack space="sm">
              <Text 
                style={{
                  textAlign: 'center',
                  color: 'white',
                  fontSize: 20,
                  marginBottom: 10,
                }}>
                {currentTierReq?.name ?? "bronze"} - {category}
              </Text>

              <VStack space="sm" alignItems="center">
                <Text style={{ color: 'white', fontSize: 18 }}>
                  Completed {progress.currentSets} Sets of {category}
                </Text>

                <Progress
                  value={progressPercentage}
                  size="md"
                  bg="$gray800"
                  width="100%"
                  mb={2}>
                  <Progress.FilledTrack 
                    bg="$blue500" />
                </Progress>

                <Text style={{ color: 'white', fontSize: 14 }}>
                  {progress.currentSets}/{nextTierReq?.requiredSets}
                </Text>
              </VStack>

              <HStack my={3} justifyContent="space-between" alignItems="center">
                <VStack alignItems="center">
                  <Text style={{ color: 'white' }}>Current Tier</Text>
                  <Text style={{ color: 'white', fontSize: 18 }}>
                    {currentTierReq?.name ?? "bronze"}
                  </Text>
                  <Badge />
                </VStack>

                <VStack alignItems="center">
                  <Text style={{ color: 'white' }}>Next Tier:</Text>
                  <Text style={{ color: 'white', fontSize: 18 }}>
                    {nextTierReq?.name ?? "bronze"}
                  </Text>
                  <NextTierBadge />
                </VStack>
              </HStack>
            </VStack>
          </View>
        );
      })}
    </VStack>
  );
};

export default SessionAchievements;