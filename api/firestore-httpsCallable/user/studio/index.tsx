import { httpsCallable } from "firebase/functions";
import { functionsInstance } from "../../../../services/firebase/functions";

export const createStudio = httpsCallable(functionsInstance, 'createStudio');
