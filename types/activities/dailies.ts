import { Timestamp } from "firebase/firestore";
import { Exercise, SessionItem } from "../program";

export interface Daily {
    id: string;
    trainerId: string;
    date: Timestamp;
    items: SessionItem[];

    date_utc: string;
    date_only: string;
    description: string;

    media: string;
    tags: string[];
    title: string;
    trainer_uid: string;
    uid: string;
  }
  