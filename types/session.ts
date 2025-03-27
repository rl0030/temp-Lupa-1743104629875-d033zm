import { Timestamp } from "firebase/firestore";
import { UID } from "./common";

export const UNSCHEDULED_SESSION_UID = 0;

export enum ScheduledMeetingClientType {
    User = 'user',
    Pack = 'pack',
  }

  export enum SessionPackageType {
    IN_PERSON,
    VIDEO
  }

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

  