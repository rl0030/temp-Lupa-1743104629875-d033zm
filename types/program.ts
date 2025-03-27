import {Timestamp} from 'firebase/firestore';

export type SessionItem = {
  type: 'exercise' | 'asset';
  data:
    | Exercise
    | {base64: string; uri: string; downloadUrl: string; id: string};
  position: number;
};

export type Session = {
  items: SessionItem[];
};

export type Week = {
  sessions: Array<Session>;
};

export type Weeks = Array<Week>;

export enum ExerciseCategory {
  Barbell = "Barbell",
  Dumbbell = "Dumbbell",
  Kettlebell = "Kettlebell",
  Calisthenics = "Bodyweight/Calisthenics",
  Cables = "Cables",
  Machine = "Machine",
  Cardio = "Cardio",
  MedicineBall = "Medicine Ball",
  ExerciseBall = "Exercise Ball",
  Steppe = "Steppe",
  FoamRoller = "Foam Roller",
  HexBar = "Hex Bar",
  ExerciseBands = "Exercise Bands",
  TRX = "TRX",
  AbRoller = "Ab Roller",
  BattleRopes = "Battle Ropes",
  Custom = "Custom"
}

export type Exercise = {
  name: string;
  description: string;
  program_uid?: string | null;
  uid: string; // This uid is unique uid of the workout stored in the Lupa workout database
  unique_uid?: string | null; // A UID assigned when the user adds the exercise to the workout
  media_uri_as_base64?: string;
  intensity?: number;
  weight_in_pounds?: number;
  sets?: number;
  tempo: number;
  reps?: number;
  resttime?: number;
  superset?: Exercise;
  category: ExerciseCategory;
};

// Lupa program structures
export type Program = {
  version: number;
  id?: string; // document id
  uid: string; // A UID assigned upon creation of the program
  weeks: Weeks; // Program information
  metadata: {
    is_published: boolean;
    name: string;
    description: string;
    owner: string;
    categories: Array<string>;
    media: string;
  };
  sessionMetadata: {
    averageWorkoutDuration: number;
  };
  pricing: {
    value: number;
  };
};

export type ProgramDetailsWithTrainerName = {
  program: Program;
  trainer: {name: string; uid: string; picture: string};
};


// Snapshot of V1 Program
// {
//   version: number;
//   id: string | null; // document id
//   uid: string; // Assigned upon creation of the program
//   weeks: Weeks; // Program information
//   metadata: {
//     name: string;
//     description: string;
//     owner: string;
//     categories: Array<string>,
//     media: string;
//   },
//   sessionMetadata: {
//     averageWorkoutDuration: number;
//   },
//   pricing: {
//     value: number;
//   }
// };
