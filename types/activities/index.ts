export type UserScheduledEvent = {
    date: Date | string;
    startTime: Date | string;
    endTime: Date | string;
    uid: string;
    user_uid: string;
    type: LupaActivity;
    event_uid: string; // the acitivty id
    package_uid: string | null; // If this availability is scheduled for a certain package
  };
  

export enum LupaActivity { 
  SESSION='Session',
  BOOTCAMP='Bootcamp',
  SEMINAR='Seminar'
}