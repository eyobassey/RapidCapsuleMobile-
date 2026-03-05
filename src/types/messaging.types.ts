export type MessageType = 'text' | 'image' | 'file' | 'video' | 'voice_note' | 'system';
export type ConversationType = 'patient_specialist' | 'patient_admin' | 'specialist_admin';
export type ParticipantRole = 'patient' | 'specialist' | 'admin';
export type PresenceStatus = 'online' | 'offline' | 'away';
export type RestrictionStatus = 'none' | 'read_only' | 'blocked';

export interface Participant {
  user: string | UserSnippet;
  role: ParticipantRole;
}

export interface UserSnippet {
  _id: string;
  user_type: string;
  email: string;
  profile: {
    first_name: string;
    last_name: string;
    profile_photo?: string | null;
  };
  specialty?: string;
}

export interface Attachment {
  original_name: string;
  s3_key: string;
  url: string;
  mime_type: string;
  size_bytes: number;
  duration_seconds?: number;
  thumbnail_url?: string;
  thumbnail_s3_key?: string;
}

export interface LinkPreview {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  domain?: string;
  site_name?: string;
  type?: string;
  video_embed_url?: string;
}

export interface MessageStatus {
  sent_at: string;
  delivered_at?: string;
  read_at?: string;
}

export interface Message {
  _id: string;
  conversation: string;
  sender: string | UserSnippet;
  type: MessageType;
  content: string;
  attachments: Attachment[];
  link_previews: LinkPreview[];
  reply_to?: string | Message;
  status: MessageStatus;
  is_deleted: boolean;
  deleted_at?: string;
  deleted_by?: string;
  created_at: string;
  updated_at: string;
}

export interface LastMessage {
  content: string;
  sender: string;
  sent_at: string;
  type: MessageType;
}

export interface Conversation {
  _id: string;
  participants: Participant[];
  type: ConversationType;
  last_message?: LastMessage;
  unread_counts: Record<string, number>;
  is_active: boolean;
  is_archived: boolean;
  consent_given: Array<{user: string; given_at: string; ip_address: string}>;
  created_at: string;
  updated_at: string;
}

export interface ConversationsPaginated {
  data: Conversation[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    pages: number;
  };
}

export interface MessagesCursorPage {
  data: Message[];
  has_more: boolean;
  cursor: string | null;
}

export interface MessagingRestriction {
  status: RestrictionStatus;
  reason?: string;
  restricted_by?: string;
  restricted_at?: string;
  expires_at?: string;
  message_cap?: {
    enabled: boolean;
    limit?: number;
    period?: 'daily' | 'monthly';
    current_count?: number;
    period_start?: string;
  };
}
