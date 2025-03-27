import { httpsCallable, Functions } from 'firebase/functions';
import { functionsInstance } from '../../../services/firebase/functions';

interface InviteeData {
  email: string;
  // Add any other properties that might be needed
}

interface SendExternalPackInviteParams {
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
  }
}

interface InvitationResult {
  success: boolean;
  email: string;
  error?: string;
}

interface SendExternalPackInvitesResult {
  success: boolean;
  results: InvitationResult[];
}

const sendExternalPackInvites = httpsCallable<SendExternalPackInviteParams, SendExternalPackInvitesResult>(
  functionsInstance,
  'sendExternalPackInvitations'
);

export const onSendExternalPackInvites = async (params: SendExternalPackInviteParams): Promise<SendExternalPackInvitesResult> => {
  try {
    const result = await sendExternalPackInvites(params);
    return result.data;
  } catch (error) {
    console.error('Error sending external pack invites:', error);
    throw error;
  }
};