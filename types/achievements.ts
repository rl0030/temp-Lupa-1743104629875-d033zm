// types.ts

import { ExerciseCategory } from "./program";
import BronzeIcon from '../assets/icons/achievements/bronze.svg'
import SilverIcon from '../assets/icons/achievements/silver.svg'
import GoldIcon from '../assets/icons/achievements/gold.svg'
import PlatinumIcon from '../assets/icons/achievements/platinum.svg'
import AmethystIcon from '../assets/icons/achievements/amethyst.svg'
import SapphireIcon from '../assets/icons/achievements/sapphire.svg'
import DiamondIcon from '../assets/icons/achievements/diamond.svg'
import OnyxIcon from '../assets/icons/achievements/onyx.svg'

export enum AchievementTier {
    Bronze = 1,
    Silver = 2,
    Gold = 3,
    Platinum = 4,
    Amethyst = 5,
    Sapphire = 6,
    Diamond = 7,
    Onyx = 8,
  }
  
  export interface AchievementRequirement {
    tier: AchievementTier;
    name: string;
    requiredSets: number;
    estimatedTimeToAchieve: string;
    level: number;
  }
  
  export interface Achievement {
    uid: string;
    userId: string;
    exerciseCategory: ExerciseCategory;
    tier: AchievementTier;
    currentSets: number;
    achievedAt: string; // ISO date string
  }
  
  export interface UserAchievementProgress {
    userId: string;
    exerciseCategory: ExerciseCategory;
    currentTier: AchievementTier;
    currentSets: number;
    nextTier: AchievementTier;
    setsToNextTier: number;
  }
  
  export const ACHIEVEMENT_REQUIREMENTS: AchievementRequirement[] = [
    { tier: AchievementTier.Bronze, name: "Bronze", level: 1, requiredSets: 5, estimatedTimeToAchieve: "1 week" },
    { tier: AchievementTier.Silver, name: "Silver", level: 2, requiredSets: 25, estimatedTimeToAchieve: "2 weeks - 1 month" },
    { tier: AchievementTier.Gold, name: "Gold", level: 3, requiredSets: 75, estimatedTimeToAchieve: "1 month - 2 months" },
    { tier: AchievementTier.Platinum, name: "Platinum", level: 4, requiredSets: 250, estimatedTimeToAchieve: "4-6 months" },
    { tier: AchievementTier.Amethyst, name: "Amethyst", level: 5, requiredSets: 750, estimatedTimeToAchieve: "1.5-2.5 years" },
    { tier: AchievementTier.Sapphire, name: "Sapphire", level: 6, requiredSets: 1500, estimatedTimeToAchieve: "3-5 years" },
    { tier: AchievementTier.Diamond, name: "Diamond", level: 7, requiredSets: 6500, estimatedTimeToAchieve: "10.3 years" },
    { tier: AchievementTier.Onyx, name: "Onyx", level: 8, requiredSets: 6500, estimatedTimeToAchieve: "Lifetime achievement" },
  ];



  export const getAchievementImage = (tierName: string) => {
    // Convert tier name to lowercase for case-insensitive comparison
    const normalizedTierName = tierName.toLowerCase();
    
    switch (normalizedTierName) {
      case 'bronze':
        return BronzeIcon
      case 'silver':
        return SilverIcon
      case 'gold':
        return GoldIcon
      case 'platinum':
        return PlatinumIcon
      case 'amethyst':
        return AmethystIcon
      case 'sapphire':
        return SapphireIcon
      case 'diamond':
        return DiamondIcon
      case 'onyx':
        return OnyxIcon
      default:
        return BronzeIcon
    }
   };

   export const getAchievementImageByTierNumber = (tierNumber: number) => {
    
    switch (tierNumber) {
      case 1:
        return BronzeIcon
      case 2:
        return SilverIcon
      case 3:
        return GoldIcon
      case 4:
        return PlatinumIcon
      case 5:
        return AmethystIcon
      case 6:
        return SapphireIcon
      case 7:
        return DiamondIcon
      case 8:
        return OnyxIcon
      default:
        return BronzeIcon
    }
   };