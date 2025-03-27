import {UID} from '../common';

export type PurchaseBootcampVariables = {
  userId: string;
  bootcampId: string;
};

export type Bootcamp = {
  id: string; // matches to uid
  uid: string; // matches to id
  start_time: string;
  end_time: string;
  date: string;
  date_in_utc: string;
  date_only: string;
  name: string;
  user_slots: UID[]; // Array of UIDs
  pricing: {value: number};
  max_slots: number;
  location: {lng: number; lat: number; gym_name: string};
  trainer_uid: string;
  metadata: {};
};
