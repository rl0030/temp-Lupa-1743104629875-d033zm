import {UID} from './common';
import {ScheduledMeetingClientType} from './user';

enum NotificationType {
  USER_SESSION_PACKAGE_PURCHASE = 'USER_SESSION_PACKAGE_PURCHASE',
  PACK_SESSION_PACKAGE_PURCHASE = 'PACK_SESSION_PACKAGE_PURCHASE',
  USER_SESSION_PACKAGE_INVITE = 'USER_SESSION_PACKAGE_INVITE',
  PACK_SESSION_PACKAGE_INVITE = 'PACK_SESSION_PACKAGE_INVITE',
  SESSION_PACKAGE_INVITE = 'SESSION_PACKAGE_INVITE',
  SESSION_SCHEDULED = 'SESSION_SCHEDULED',
  BOOTCAMP_JOINED = 'BOOTCAMP_JOINED',
  BOOTCAMP_PARTICIPANT_ADDED = 'BOOTCAMP_PARTICIPANT_ADDED',
  SEMINARS_JOINED = 'SEMINAR_JOINED',
  SEMINAR_PARTICIPANT_ADDED = 'SEMINAR_PARTICIPANT_ADDED',
  PACK_LIVE='PACK_LIVE',
  PACK_MEMBER_JOINED='PACK_MEMBER_JOINED',
  USER_PROGRAM_PURCHASE='USER_PROGRAM_PURCHASE'
}

// UserSessionPackagePurchaseNotificationMetadata
type UserSessionPackagePurchaseMetadata = {
  packageUid: string;
  packageName: string;
  clientType: ScheduledMeetingClientType;
  purchaser: UID;
  trainerUid: UID;
  packUid: UID | null;
};

type PackSessionPackagePurchaseNotificationMetadata = {}

type UserSessionPackageInviteNotificationMetadata = {}

type PackSessionPackageInviteNotificationMetadata = {}

export { NotificationType };  
export type { UserSessionPackagePurchaseMetadata };

