import React, { createContext, useContext, useState, useEffect } from 'react';
import { Complaint, ComplaintHistoryEntry, Department, RepairEvidence, CitizenFeedback, IssueCategory, PriorityLevel, ComplaintStatus } from '../types';
import { initialComplaints, initialDepartments } from '../utils/mockData';
import { generateTrackingId } from '../utils/helpers';
import { isFirebaseConfigured, db } from '../config/firebase';
import { collection, onSnapshot, doc, setDoc } from 'firebase/firestore';

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'info' | 'warning' | 'error';
}

interface ComplaintContextType {
  complaints: Complaint[];
  departments: Department[];
  history: ComplaintHistoryEntry[];
  toasts: ToastMessage[];
  showToast: (message: string, type?: ToastMessage['type']) => void;
  removeToast: (id: string) => void;
  submitComplaint: (data: {
    title: string;
    description: string;
    voiceTranscript?: string;
    category: IssueCategory;
    priority: PriorityLevel;
    originalPhotoUrl: string;
    location: {
      address: string;
      latitude: number;
      longitude: number;
      ward: string;
    };
    aiSummary: {
      category: IssueCategory;
      urgency: PriorityLevel;
      keySummary: string;
      keywords: string[];
    };
  }) => Promise<Complaint>;
  confirmExistingIssue: (complaintId: string, citizenUid: string) => void;
  assignDepartmentAndWorker: (
    complaintId: string,
    departmentId: string,
    departmentName: string,
    workerId?: string,
    workerName?: string,
    note?: string
  ) => void;
  updateStatus: (complaintId: string, status: ComplaintStatus, note?: string) => void;
  submitEvidence: (complaintId: string, evidence: Omit<RepairEvidence, 'evidenceId' | 'adminDecision'>) => Promise<void>;
  reviewEvidenceDecision: (
    complaintId: string,
    decision: 'Approved' | 'Rejected' | 'More Evidence Requested',
    note?: string
  ) => void;
  reopenComplaint: (complaintId: string, reason: string) => void;
  submitFeedback: (complaintId: string, rating: number, comments: string) => void;
}

const ComplaintContext = createContext<ComplaintContextType | undefined>(undefined);

const STORAGE_KEY = 'civicpulse_complaints_v1';
const HISTORY_STORAGE_KEY = 'civicpulse_history_v1';

export const ComplaintProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.warn('Could not load complaints from localStorage', e);
    }
    return initialComplaints;
  });

  const [departments] = useState<Department[]>(initialDepartments);
  const [history, setHistory] = useState<ComplaintHistoryEntry[]>(() => {
    try {
      const saved = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return [];
  });

  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Sync to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(complaints));
    } catch (e) {
      console.warn('Could not save complaints to localStorage', e);
    }
  }, [complaints]);

  useEffect(() => {
    try {
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(history));
    } catch (e) {
      console.warn('Could not save history to localStorage', e);
    }
  }, [history]);

  // Optional Live Firestore Sync
  useEffect(() => {
    if (isFirebaseConfigured && db) {
      try {
        const unsub = onSnapshot(collection(db, 'complaints'), (snapshot) => {
          if (!snapshot.empty) {
            const remoteComplaints: Complaint[] = [];
            snapshot.forEach((doc) => remoteComplaints.push(doc.data() as Complaint));
            setComplaints(remoteComplaints);
          }
        });
        return () => unsub();
      } catch (err) {
        console.warn('Firebase snapshot listener failed, using local sync:', err);
      }
    }
  }, []);

  const showToast = (message: string, type: ToastMessage['type'] = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => removeToast(id), 5000);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const logHistory = (
    complaintId: string,
    action: string,
    previousStatus: string,
    newStatus: string,
    actorName: string,
    actorRole: 'citizen' | 'worker' | 'admin' | 'system_ai',
    note: string
  ) => {
    const newEntry: ComplaintHistoryEntry = {
      historyId: `hist-${Date.now()}`,
      complaintId,
      action,
      previousStatus,
      newStatus,
      actorId: `act-${actorRole}`,
      actorName,
      actorRole,
      note,
      timestamp: new Date().toISOString(),
    };
    setHistory((prev) => [newEntry, ...prev]);
  };

  const submitComplaint = async (data: {
    title: string;
    description: string;
    voiceTranscript?: string;
    category: IssueCategory;
    priority: PriorityLevel;
    originalPhotoUrl: string;
    location: {
      address: string;
      latitude: number;
      longitude: number;
      ward: string;
    };
    aiSummary: {
      category: IssueCategory;
      urgency: PriorityLevel;
      keySummary: string;
      keywords: string[];
    };
  }): Promise<Complaint> => {
    const trackingId = generateTrackingId();
    const newComplaint: Complaint = {
      id: `c-${Date.now()}`,
      trackingId,
      citizenId: 'cit-001',
      citizenName: 'Resident (You)',
      title: data.title || `${data.category} Issue at ${data.location.ward}`,
      description: data.description,
      voiceTranscript: data.voiceTranscript,
      category: data.category,
      priority: data.priority,
      status: 'Pending',
      originalPhotoUrl: data.originalPhotoUrl,
      location: data.location,
      aiSummary: data.aiSummary,
      citizenConfirmationCount: 1,
      confirmedByCitizenUids: ['cit-001'],
      slaDeadline: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setComplaints((prev) => [newComplaint, ...prev]);
    logHistory(
      newComplaint.id,
      'Complaint Ingested',
      'None',
      'Pending',
      'Resident',
      'citizen',
      'Citizen reported issue via intake portal.'
    );

    if (isFirebaseConfigured && db) {
      try {
        await setDoc(doc(db, 'complaints', newComplaint.id), newComplaint);
      } catch (err) {
        console.warn('Firebase save failed, stored locally:', err);
      }
    }

    showToast(`Complaint registered! Tracking ID: ${trackingId}`, 'success');
    return newComplaint;
  };

  const confirmExistingIssue = (complaintId: string, citizenUid: string) => {
    setComplaints((prev) =>
      prev.map((item) => {
        if (item.id === complaintId) {
          const already = item.confirmedByCitizenUids?.includes(citizenUid);
          if (already) {
            showToast('You have already confirmed this civic issue.', 'info');
            return item;
          }
          const updated = {
            ...item,
            citizenConfirmationCount: item.citizenConfirmationCount + 1,
            confirmedByCitizenUids: [...(item.confirmedByCitizenUids || []), citizenUid],
          };
          showToast(`Confirmed issue #${item.trackingId}. Thank you for verifying!`, 'success');
          return updated;
        }
        return item;
      })
    );
  };

  const assignDepartmentAndWorker = (
    complaintId: string,
    departmentId: string,
    departmentName: string,
    workerId?: string,
    workerName?: string,
    note?: string
  ) => {
    setComplaints((prev) =>
      prev.map((item) => {
        if (item.id === complaintId) {
          const newStatus: ComplaintStatus = workerId ? 'In Progress' : 'Assigned';
          logHistory(
            item.id,
            'Department & Worker Assignment',
            item.status,
            newStatus,
            'Administrator',
            'admin',
            note || `Assigned to ${departmentName}${workerName ? ` (Worker: ${workerName})` : ''}`
          );
          return {
            ...item,
            status: newStatus,
            assignedDepartmentId: departmentId,
            assignedDepartmentName: departmentName,
            assignedWorkerId: workerId || item.assignedWorkerId,
            assignedWorkerName: workerName || item.assignedWorkerName,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
    showToast(`Complaint updated: assigned to ${departmentName}`, 'success');
  };

  const updateStatus = (complaintId: string, status: ComplaintStatus, note?: string) => {
    setComplaints((prev) =>
      prev.map((item) => {
        if (item.id === complaintId) {
          logHistory(
            item.id,
            `Status Changed to ${status}`,
            item.status,
            status,
            'Administrator',
            'admin',
            note || 'Status updated by municipal officer.'
          );
          return {
            ...item,
            status,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
    showToast(`Status updated to ${status}`, 'info');
  };

  const submitEvidence = async (
    complaintId: string,
    evidenceData: Omit<RepairEvidence, 'evidenceId' | 'adminDecision'>
  ) => {
    const fullEvidence: RepairEvidence = {
      ...evidenceData,
      evidenceId: `ev-${Date.now()}`,
      adminDecision: 'Pending',
    };

    setComplaints((prev) =>
      prev.map((item) => {
        if (item.id === complaintId) {
          logHistory(
            item.id,
            'Repair Evidence Submitted',
            item.status,
            'Evidence Submitted',
            evidenceData.workerName,
            'worker',
            evidenceData.repairNotes
          );
          return {
            ...item,
            status: 'Evidence Submitted',
            repairEvidence: fullEvidence,
            updatedAt: new Date().toISOString(),
          };
        }
        return item;
      })
    );
    showToast(`Repair evidence for ${evidenceData.trackingId} submitted for Admin review!`, 'success');
  };

  const reviewEvidenceDecision = (
    complaintId: string,
    decision: 'Approved' | 'Rejected' | 'More Evidence Requested',
    note?: string
  ) => {
    setComplaints((prev) =>
      prev.map((item) => {
        if (item.id === complaintId && item.repairEvidence) {
          const newStatus: ComplaintStatus =
            decision === 'Approved' ? 'Resolved' : decision === 'Rejected' ? 'In Progress' : 'Under Verification';

          logHistory(
            item.id,
            `Evidence ${decision}`,
            item.status,
            newStatus,
            'Admin Officer',
            'admin',
            note || `Administrator decided: ${decision}`
          );

          return {
            ...item,
            status: newStatus,
            updatedAt: new Date().toISOString(),
            repairEvidence: {
              ...item.repairEvidence,
              adminDecision: decision,
              adminDecisionNote: note,
              adminId: 'adm-882',
              reviewedAt: new Date().toISOString(),
            },
          };
        }
        return item;
      })
    );
    showToast(`Evidence ${decision}! Complaint status updated.`, decision === 'Approved' ? 'success' : 'warning');
  };

  const reopenComplaint = (complaintId: string, reason: string) => {
    setComplaints((prev) =>
      prev.map((item) => {
        if (item.id === complaintId) {
          logHistory(
            item.id,
            'Complaint Reopened by Citizen',
            item.status,
            'Reopened',
            item.citizenName,
            'citizen',
            reason
          );
          return {
            ...item,
            status: 'Reopened',
            updatedAt: new Date().toISOString(),
            feedback: item.feedback
              ? { ...item.feedback, isReopened: true, reopenReason: reason }
              : undefined,
          };
        }
        return item;
      })
    );
    showToast(`Complaint #${complaintId} reopened and returned to Admin review.`, 'warning');
  };

  const submitFeedback = (complaintId: string, rating: number, comments: string) => {
    const newFeedback: CitizenFeedback = {
      feedbackId: `fb-${Date.now()}`,
      complaintId,
      citizenId: 'cit-001',
      rating,
      comments,
      isReopened: false,
      createdAt: new Date().toISOString(),
    };

    setComplaints((prev) =>
      prev.map((item) => {
        if (item.id === complaintId) {
          return {
            ...item,
            feedback: newFeedback,
          };
        }
        return item;
      })
    );
    showToast('Thank you for your rating and feedback!', 'success');
  };

  return (
    <ComplaintContext.Provider
      value={{
        complaints,
        departments,
        history,
        toasts,
        showToast,
        removeToast,
        submitComplaint,
        confirmExistingIssue,
        assignDepartmentAndWorker,
        updateStatus,
        submitEvidence,
        reviewEvidenceDecision,
        reopenComplaint,
        submitFeedback,
      }}
    >
      {children}
    </ComplaintContext.Provider>
  );
};

export const useComplaints = () => {
  const ctx = useContext(ComplaintContext);
  if (!ctx) throw new Error('useComplaints must be used within ComplaintProvider');
  return ctx;
};
