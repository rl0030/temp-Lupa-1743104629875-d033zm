// trainerState.js
import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { persistAtom } = recoilPersist({
  key: 'trainerMetadata',
  storage: AsyncStorage,
});

export const TRAINER_METADATA_ATOM_KEY = 'trainer_metadata_atom';

export const trainerMetadataAtom = atom({
  key: TRAINER_METADATA_ATOM_KEY,
  default: null,
  effects_UNSTABLE: [persistAtom],
});

