// ─── SSE Chunk Types ─────────────────────────────
export type SSEChunkType =
  | 'text'
  | 'done'
  | 'error'
  | 'artifact'
  | 'tool_start'
  | 'tool_done'
  | 'checkup_question'
  | 'suggestions'
  | 'clear_loading'
  | 'clear_artifact';

export interface SSEChunk {
  type: SSEChunkType;
  content?: string;
  conversation_id?: string;
  artifact_type?: string;
  data?: any;
  question?: CheckupQuestion;
  suggestions?: Suggestion[];
  tool?: string;
  message?: string;
}

// ─── Artifacts ───────────────────────────────────
export type ArtifactType =
  | 'health_checkup_start'
  | 'health_checkup_report'
  | 'drug_interaction_report'
  | 'prescription_analysis'
  | 'recovery_dashboard'
  | 'screening_report'
  | 'coping_exercise'
  | 'exercise_step_update'
  | 'exercise_complete'
  | 'safety_plan'
  | 'risk_assessment';

export interface EkaArtifact {
  type: ArtifactType | string;
  data: any;
}

// ─── Checkup Questions ──────────────────────────
export interface CheckupQuestionItem {
  id: string;
  name: string;
  common_name: string;
}

export interface CheckupQuestion {
  type: 'single' | 'group_single' | 'group_multiple';
  text: string;
  items?: CheckupQuestionItem[];
}

// ─── Suggestions ─────────────────────────────────
export interface Suggestion {
  label: string;
  message: string;
}

// ─── Messages ────────────────────────────────────
export interface EkaMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  tools_used?: string[];
  artifact?: EkaArtifact;
  checkup_question?: CheckupQuestion;
  created_at: string;
}

// ─── Conversations ──────────────────────────────
export interface EkaConversation {
  _id: string;
  title: string;
  is_active: boolean;
  tags: string[];
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    tools_used?: string[];
    artifact?: EkaArtifact;
    created_at: string;
  }>;
  created_at: string;
  updated_at: string;
}
