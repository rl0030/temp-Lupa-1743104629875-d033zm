import { supabase } from '../../services/supabase';
import { MessageType, UserMessageType } from '../../util/messages';

export const sendUserMessage = async (
  senderUid: string,
  receiverUid: string,
  text: string,
  type: UserMessageType = UserMessageType.NORMAL,
  metadata: Object = {}
) => {
  try {
    // Get the sender and receiver user IDs from the auth table
    const { data: senderData, error: senderError } = await supabase
      .from('users')
      .select('id')
      .eq('uid', senderUid)
      .single();
      
    if (senderError) {
      throw senderError;
    }
    
    const { data: receiverData, error: receiverError } = await supabase
      .from('users')
      .select('id')
      .eq('uid', receiverUid)
      .single();
      
    if (receiverError) {
      throw receiverError;
    }
    
    // Insert the message
    const { data: message, error: messageError } = await supabase
      .from('private_messages')
      .insert({
        sender_id: senderData.id,
        receiver_id: receiverData.id,
        text,
        type,
        metadata,
        timestamp: Date.now()
      })
      .select()
      .single();
      
    if (messageError) {
      throw messageError;
    }
    
    // Update or create the conversation records
    const { error: senderConversationError } = await supabase
      .from('conversations')
      .upsert({
        user_id: senderData.id,
        other_user_id: receiverData.id,
        last_message_id: message.id,
        updated_at: new Date()
      });
      
    if (senderConversationError) {
      throw senderConversationError;
    }
    
    const { error: receiverConversationError } = await supabase
      .from('conversations')
      .upsert({
        user_id: receiverData.id,
        other_user_id: senderData.id,
        last_message_id: message.id,
        updated_at: new Date()
      });
      
    if (receiverConversationError) {
      throw receiverConversationError;
    }
    
    return message;
  } catch (error) {
    console.error('Error sending user message:', error);
    throw error;
  }
};

export const sendPackMessage = async (
  senderUid: string,
  packId: string,
  text: string,
  type: MessageType = MessageType.NORMAL,
  metadata: Object = {}
) => {
  try {
    // Get the sender user ID from the auth table
    const { data: senderData, error: senderError } = await supabase
      .from('users')
      .select('id')
      .eq('uid', senderUid)
      .single();
      
    if (senderError) {
      throw senderError;
    }
    
    // Get the pack ID
    const { data: packData, error: packError } = await supabase
      .from('packs')
      .select('id')
      .eq('uid', packId)
      .single();
      
    if (packError) {
      throw packError;
    }
    
    // Insert the message
    const { data: message, error: messageError } = await supabase
      .from('pack_messages')
      .insert({
        pack_id: packData.id,
        sender_id: senderData.id,
        text,
        type,
        metadata,
        timestamp: Date.now()
      })
      .select()
      .single();
      
    if (messageError) {
      throw messageError;
    }
    
    // Update pack conversation for all members
    const { data: packMembers, error: membersError } = await supabase
      .from('packs')
      .select('members, owner')
      .eq('id', packData.id)
      .single();
      
    if (membersError) {
      throw membersError;
    }
    
    // Get all member IDs including the owner
    const allMembers = [...packMembers.members, packMembers.owner];
    
    // Update conversation for each member
    for (const memberId of allMembers) {
      const { data: memberData } = await supabase
        .from('users')
        .select('id')
        .eq('uid', memberId)
        .single();
        
      if (memberData) {
        await supabase
          .from('pack_conversations')
          .upsert({
            user_id: memberData.id,
            pack_id: packData.id,
            last_message_id: message.id,
            updated_at: new Date()
          });
      }
    }
    
    return message;
  } catch (error) {
    console.error('Error sending pack message:', error);
    throw error;
  }
};