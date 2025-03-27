import {UID, Timestamp} from './common';
import {Persona} from '../constant/persona';
import {Program} from './program';
import {PlaceResult} from '../pages/Settings/UpdateHomeGym';
import { SessionPackageType } from '../hooks/lupa/sessions/useSessionPackagePurchase';
import { FieldValue } from 'firebase/firestore';

export type Studio = {
  picture: string;
  name: string;
  uid: string;
  id?: string;
  description: string;
  hours_of_operation: Array<any>;
  trainers: Array<UID>;
  owner_uid: string;
  location: {
    formatted_address: string;
  },
  pricing: {
    leasing_fee: number;
  }
}

export type TrainingLocation = "Client Home" | "Trainer Home" | "Outdoor" | "Virtual Training";
export type LupaUser = {
  id?: string;
  is_onboarding_completed: boolean;
  username: string;
  email: string;
  number: string;
  picture: string;
  name: string;
  role: Persona;
  uid: UID;
  time_created_utc: number;
  createdAt: FieldValue;
  timeZone: 'America/New_York';
  biography?: string;
  interest?: string[];
  training_locations?: TrainingLocation[];
  location: {
    longitude: number;
    latitude: number;
    timeZone: '';
  };
  settings: {
    blocked_uids: Array<string>;
  };
  interactions: {
    favorites: [];
  };
  fitness_profile: {
    languages_spoken: [],
    medical_conditions: []
  }
  lupa_metadata: {
    path: string | null;
  }
};

export type TrainerCertification = {
  firstName: string;
  lastName: string;
  certificationId: string;
  lupa_certification_string: string;
};

export type TrainerMetadata = {
  uid: string;
  user_uid: string; // Reference to a LupaUser
  clients: Array<UID>; // Trainer's clients
  hourly_rate: number;
  home_gym: PlaceResult;
  is_verified: boolean;
  is_checked: boolean;
};

export type Pack = {
  id?: string;
  owner: string;
  uid: string;
  name: string;
  members: Array<UID>;
  pending_invites: Array<UID>;
  creator: UID;
  package_uid: string | null;
  created_at: Timestamp;
  greeting_message: string;
  is_live: boolean;
  external_invites: {
    email: string;
    status: 'pending' | 'accepted';
  }[];
};

export enum ScheduledMeetingClientType {
  User = 'user',
  Pack = 'pack',
}

/**
 * ScheduledMeeting and ScheduledVideoMeeting are the same type. A type key has to be added to give a distinction
 * between the two so we know when to present the Agora video functionality.
 */

// scheduled_sessions collection
export type ScheduledMeeting = {
  uid: string; // UID for the meeting
  trainer_uid: UID; // UID for the trainer
  clients: Array<UID>; // Array of UIDs for all client attending. At min one if this meeting is 1-1 and at min 2 if this meeting is for a pack.
  start_time: Timestamp;
  end_time: Timestamp;
  date: Timestamp;
  programs: [];
  status: 'scheduled' | 'completed' | 'cancelled';
  package_uid: string | null; // If this is a part of a package.
  availability_uid: string;
  price: number | null; // Default to hourly rate if this meeting does not have a price
  session_note: string;
  clientType: ScheduledMeetingClientType;
  type: SessionPackageType;
  video_channel_id?: string;
};

export type SessionPackage = {
  name: string;
  num_sessions: number;
  status: 'complete' | 'incomplete';
  scheduled_meeting_uids: Array<UID>;
};

export type PurchasedSessionPackage = SessionPackage & {
  clientType: ScheduledMeetingClientType | null;
  client: UID; // WIll be a pack ID or a Lupa user id. }
  purchase_uid: string; // should be the original packge uid
  uid: string; // the uid of this package
  trainer_uid: UID;
};

// ClientProgram's use a custom id such that the
// id equals `clientUID_programUID`
export type ClientProgram = {
  client_uid: UID;
  program_uid: UID;
  purchase_date: Timestamp;
  program_data: Program; // Snapshot of the program data at the time of purchase
};

export type TrainerAvailability = {
  date: string;
  startTime: string;
  endTime: string;
  uid: string;
  trainer_uid: string;
  isBooked: boolean;
  price?: number; // Defaults to the trainer's hourly price (See TrainerMetadata['hourly_rate'])
  package_uid: string | null; // If this availability is scheduled for a certain session package
  scheduled_meeting_uid: string | null; // If this availability slot has been scheduled
};

export enum UserActivity {
  Session = 'Session',
  Bootcamp = 'Bootcamp',
  Seminar = 'Seminar'
}

export type UserScheduledEvent = {
  date: string;
  startTime: string;
  endTime: string;
  uid: string;
  user_uid: string;
  type: 'Session' | 'Bootcamp' | 'Seminar';
  event_uid: string; // the acitivty id
  package_uid: string | null; // If this availability is scheduled for a certain package
};

export type PackScheduledEvent = {
  date: string;
  startTime: string;
  endTime: string;
  uid: string;
  pack_uid: string;
  package_uid: string | null;
  type: 'Session' | 'SessionPackage';
  event_uid: string;
};
