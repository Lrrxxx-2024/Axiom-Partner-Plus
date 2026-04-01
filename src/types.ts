export type AgentMode = 'UNDERSTAND' | 'PROPOSE' | 'DEBATE' | 'EXECUTE' | 'CRITIQUE';
export type ExecuteType = 'image' | 'video' | 'text' | 'storyboard';

export interface AgentState {
  mode: AgentMode;
  monologue: string;
  brief: string;
  aesthetic: string;
  confidence: number;
  hasDisagreement: boolean;
  executeType?: ExecuteType;
}

export interface Message {
  id: string;
  role: 'user' | 'agent';
  content: string;
  image?: string;
  video?: string;
  storyboard?: string[]; // 24-frame sequence
  state?: AgentState;
}

export function createMessage(role: 'user' | 'agent', content: string, extra?: Partial<Message>): Message {
  return {
    id: crypto.randomUUID(),
    role,
    content,
    ...extra,
  };
}