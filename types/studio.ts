// A wrapper type that any studio/gym results from external APIs

import {UID} from './common';

// can use to make itself compatible with Lupa
export interface LupaStudioInterface {
  name: string;
  description: string;
  id: string;
  uid: string;
  trainers: Array<UID>;
  hours_of_operation: Array<Map<string, Array<string>>>;
  owner_lupa_uid: string;
  pricing: {
    leasing_fee: number;
  };
  formatted_address: string;
  geometry: LupaStudioLocation;
  photos_formatted: Array<Record<string, string>>;
  photos: Array<string>;
}

export type LupaStudioLocation = {
  name: string;
  geometry: {
    location: {
      lat: number;
      lng: number;
    }
  };
  formatted_address: string;
  photos: Array<string>;
}
