export type CpmTask = {
  id: string;
  duration: number;
  /** Relative day from project anchor (optional hard start). */
  fixedStart?: number;
};

export type CpmEdge = {
  from: string;
  to: string;
  lag?: number;
};

export type CpmTaskResult = {
  ES: number;
  EF: number;
  LS: number;
  LF: number;
  slack: number;
  critical: boolean;
};

export type CpmResult = {
  byId: Record<string, CpmTaskResult>;
  projectDuration: number;
  criticalPath: string[];
};

export class CpmError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CpmError";
  }
}
