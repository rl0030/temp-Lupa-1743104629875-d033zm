import { ExerciseCategory } from "./program"

export namespace FirebaseDatabaseTypes {
    export enum LupaCollections {
        USERS='users',
        PACKS='packs',
        NOTIFICATIONS='notifications',
        EXERCISE_LIBRARY='exercise_library',
        ACHIEVEMENTS='achievements',
        USER_ACHIEVEMENT_PROGRESS='user_achievement_progress',
    }
}

export namespace FirebaseRealtimeDatabaseReferences {
    export const userExerciseSetsRef = (userId: string, exerciseCategory: ExerciseCategory) => `/userExerciseSets/${userId}/${exerciseCategory}`
}

export {}