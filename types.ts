
export enum Severity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface Vulnerability {
  id: string;
  title: string;
  severity: Severity;
  description: string;
  vector: string;
  exploitInfo: string;
  remediation: string;
  patchingSteps: string[];
  reference?: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

export interface LogEntry {
  timestamp: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}
