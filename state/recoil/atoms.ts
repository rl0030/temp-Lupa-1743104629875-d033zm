import { atom } from 'recoil'
import { recoilPersist } from 'recoil-persist'
import AsyncStorage from '@react-native-community/async-storage'
import { ICreationState } from '../../pages/BuildTool'
import { Program } from '../../types/program'

const {  persistAtom  } = recoilPersist({
    key: 'Lupa',
    storage: AsyncStorage,
    converter: JSON
})

// The program creation atom holds an array of programs that
// are currently being created. This enables the functionality
// of persisting programs before they have been saved as drafts
export const PROGRAM_CREATION_ATOM_KEY = 'program_careation_atom'
export const programCreationAtom = atom<Array<Program>>({
    key: PROGRAM_CREATION_ATOM_KEY,
    default: [],
    effects_UNSTABLE: [persistAtom]
})