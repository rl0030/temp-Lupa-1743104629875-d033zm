import { atom } from 'recoil';
import { recoilPersist } from 'recoil-persist';
import AsyncStorage from '@react-native-community/async-storage';

const { persistAtom } = recoilPersist({
  key: 'userData',
  storage: AsyncStorage,
  converter: JSON,
});

export const USER_DATA_ATOM_KEY = 'user_data_atom';

export const userDataAtom = atom({
  key: USER_DATA_ATOM_KEY,
  default: null,
  effects_UNSTABLE: [persistAtom],
});