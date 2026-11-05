export type UserRole = 'citizen' | 'worker' | 'admin';

export type IssueCategory =
  | 'Roads'
  | 'Garbage'
  | 'Water Supply'
  | 'Drainage'
  | 'Streetlights'
  | 'Other';

export type PriorityLevel = 'Low' | 'Medium' | 'High' | 'Urgent';

export type ComplaintStatus =
  | 'Pending'
  | 'Assigned'
  | 'In Progress'
  | 'Evidence Submitted'
  | 'Under Verification'
  | 'Resolved'
  | 'Reopened';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  workerId?: string;
  accountStatus: 'active' | 'suspended';
  avatar?: string;
}

export interface ComplaintLocation {
  address: string;
  latitude: number;
  longitude: number;
  ward: string;
  city?: string;
  neighborhood?: string;
  suburb?: string;
  state?: string;
  postcode?: string;
}

export interface AISummary {
  category: IssueCategory;
  urgency: PriorityLevel;
  keySummary: string;
  keywords: string[];
}

export interface AIVerificationResult {
  status: 'Verified' | 'Needs Review' | 'Not Verified';
  confidenceScore: number;
  matchSummary: string;
  explanation: string;
  checkedAt: string;
}

export interface RepairEvidence {
  evidenceId: string;
  complaintId: string;
  trackingId: string;
  workerId: string;
  workerName: string;
  afterPhotoUrl: string;
  workerLocation: {
    latitude: number;
    longitude: number;
    distanceFromOriginalMeters: number;
  };
  serverTimestamp: string;
  repairNotes: string;
  aiVerification: AIVerificationResult;
  adminDecision: 'Pending' | 'Approved' | 'Rejected' | 'More Evidence Requested';
  adminDecisionNote?: string;
  adminId?: string;
  reviewedAt?: string;
}

export interface CitizenFeedback {
  feedbackId: string;
  complaintId: string;
  citizenId: string;
  rating: number; // 1-5
  comments: string;
  isReopened: boolean;
  reopenReason?: string;
  createdAt: string;
}

export interface ComplaintHistoryEntry {
  historyId: string;
  complaintId: string;
  action: string;
  previousStatus: string;
  newStatus: string;
  actorId: string;
  actorName: string;
  actorRole: 'citizen' | 'worker' | 'admin' | 'system_ai';
  note: string;
  timestamp: string;
}

export interface Complaint {
  id: string;
  trackingId: string;
  citizenId: string;
  citizenName: string;
  title: string;
  description: string;
  voiceTranscript?: string;
  category: IssueCategory;
  priority: PriorityLevel;
  status: ComplaintStatus;
  originalPhotoUrl: string;
  location: ComplaintLocation;
  aiSummary: AISummary;
  assignedDepartmentId?: string;
  assignedDepartmentName?: string;
  assignedWorkerId?: string;
  assignedWorkerName?: string;
  duplicateMasterId?: string;
  citizenConfirmationCount: number;
  confirmedByCitizenUids?: string[];
  slaDeadline: string;
  createdAt: string;
  updatedAt: string;
  repairEvidence?: RepairEvidence;
  feedback?: CitizenFeedback;
}

export interface Department {
  id: string;
  name: string;
  code: string;
  activeWorkerCount: number;
}
