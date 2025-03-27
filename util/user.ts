import {LupaUser, TrainerMetadata} from '../types/user';

export const getMissingUserFieldsForCompleteProfile = (lupaUser: LupaUser) => {
  const missingFields = [];

  if (!lupaUser?.picture) {
    missingFields.push('Avatar');
  }

  if (!lupaUser?.biography) {
    missingFields.push('Biography');
  }

  return missingFields;
};
export const getMissingTrainerFieldsForCompleteProfile = (
  lupaUser: LupaUser,
  trainerMetadata: TrainerMetadata,
) => {
  const missingUserFields = getMissingUserFieldsForCompleteProfile(lupaUser);

  const missingFields = [];
  if (!trainerMetadata?.home_gym) {
    missingFields.push('Home Gym');
  }

  return missingFields.concat(missingUserFields);
};
