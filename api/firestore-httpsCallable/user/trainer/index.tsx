import {httpsCallable, Functions} from 'firebase/functions';
import {functionsInstance} from '../../../../services/firebase/functions';

interface InviteeData {
  email: string;
  // Add any other properties that might be needed
}

interface SendExternalTrainerInviteParams {
  packName: string;
  inviter: string;
  invitees: InviteeData[];
  inviterDocId: string;
  packId: string;
  headerInformation: {
    name: string;
    username: string;
    role: 'trainer' | 'athlete';
    photo_url: string;
    created_at: string;
    city_name: string;
  };
}

interface InvitationResult {
  success: boolean;
  email: string;
  error?: string;
}

interface SendExternalTrainerInvitesResult {
  success: boolean;
  results: InvitationResult[];
}

const sendExternalTrainerInvites = httpsCallable<
  SendExternalTrainerInviteParams,
  SendExternalTrainerInvitesResult
>(functionsInstance, 'sendExternalTrainerInvitations');

export const onSendExternalTrainerInvites = async (
  params: SendExternalTrainerInviteParams,
): Promise<SendExternalTrainerInvitesResult> => {
  try {
    const result = await sendExternalTrainerInvites(params);
    return result.data;
  } catch (error) {
    console.error('Error sending external trainer invites:', error);
    throw error;
  }
};
