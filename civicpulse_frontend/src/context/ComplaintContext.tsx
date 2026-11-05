import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Complaint, ComplaintHistoryEntry, Department, RepairEvidence, CitizenFeedback, IssueCategory, PriorityLevel, ComplaintStatus } from '../types';
import { initialComplaints, initialDepartments } from '../utils/mockData';
import { generateTrackingId, calculateDistanceMeters } from '../utils/helpers';
import { isFirebaseConfigured, db } from '../config/firebase';
import { collection, onSnapshot, doc, setDoc, deleteDoc, updateDoc } from 'firebase/firestore';

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
      city?: string;
      neighborhood?: string;
      suburb?: string;
      state?: string;
      postcode?: string;
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
  deleteComplaint: (complaintId: string) => Promise<boolean>;
  mergeDuplicateComplaints: () => number;
}

const ComplaintContext = createContext<ComplaintContextType | undefined>(undefined);

const STORAGE_KEY = 'cityresolve_complaints_v1';
const HISTORY_STORAGE_KEY = 'cityresolve_history_v1';

export const ComplaintProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [complaints, setComplaints] = useState<Complaint[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) || localStorage.getItem('civicpulse_complaints_v1');
      if (saved) {
        const parsed: Complaint[] = JSON.parse(saved);
        // Ensure city area details exist on previous complaints as well
        return parsed.map((c) => ({
          ...c,
          location: {
            ...c.location,
            city: c.location?.city || 'New York',
            suburb: c.location?.suburb || 'Lower Manhattan',
            neighborhood: c.location?.neighborhood || 'Civic Center',
            state: c.location?.state || 'NY',
            postcode: c.location?.postcode || '10007',
          },
        }));
      }
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
      city?: string;
      neighborhood?: string;
      suburb?: string;
      state?: string;
      postcode?: string;
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

          if (isFirebaseConfigured && db) {
            try {
              updateDoc(doc(db, 'complaints', complaintId), {
                citizenConfirmationCount: updated.citizenConfirmationCount,
                confirmedByCitizenUids: updated.confirmedByCitizenUids,
              });
            } catch (err) {
              console.warn('Firebase confirmation sync failed:', err);
            }
          }

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

  const deleteComplaint = async (complaintId: string): Promise<boolean> => {
    const target = complaints.find((c) => c.id === complaintId);
    setComplaints((prev) => prev.filter((item) => item.id !== complaintId));

    if (target) {
      logHistory(
        complaintId,
        'Complaint Purged',
        target.status,
        'Deleted',
        'Administrator',
        'admin',
        `Municipal Administrator permanently purged complaint #${target.trackingId}.`
      );
    }

    if (isFirebaseConfigured && db) {
      try {
        await deleteDoc(doc(db, 'complaints', complaintId));
      } catch (err) {
        console.warn('Firebase document delete failed:', err);
      }
    }

    showToast(`Complaint #${target?.trackingId || complaintId} permanently removed.`, 'info');
    return true;
  };

  /**
   * Auto-Deduplication: Scans complaints and merges existing duplicates.
   * Two complaints are duplicates when:
   *   - Same category
   *   - Within 200m or same address
   *   - Neither is Resolved
   */
  const mergeDuplicateComplaints = useCallback((): number => {
    let mergedCount = 0;

    setComplaints((prev) => {
      const sorted = [...prev].sort(
        (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      );

      const removedIds = new Set<string>();
      const updatedMap = new Map<string, Complaint>();

      for (const c of sorted) {
        updatedMap.set(c.id, { ...c });
      }

      for (let i = 0; i < sorted.length; i++) {
        const kept = sorted[i];
        if (removedIds.has(kept.id)) continue;

        for (let j = i + 1; j < sorted.length; j++) {
          const candidate = sorted[j];
          if (removedIds.has(candidate.id)) continue;
          if (candidate.status === 'Resolved' || kept.status === 'Resolved') continue;
          if (candidate.category !== kept.category) continue;

          let isDuplicate = false;
          let dist = 9999;

          if (
            kept.location?.latitude && kept.location?.longitude &&
            candidate.location?.latitude && candidate.location?.longitude
          ) {
            dist = calculateDistanceMeters(
              kept.location.latitude,
              kept.location.longitude,
              candidate.location.latitude,
              candidate.location.longitude
            );
          }

          const addrA = (kept.location?.address || '').toLowerCase();
          const addrB = (candidate.location?.address || '').toLowerCase();
          const isSameSpot = dist <= 75 || (addrA.length > 5 && addrA === addrB);

          // Verify that they describe the SAME problem defect, not different problems!
          if (isSameSpot) {
            const wordsA = (kept.description || '').toLowerCase().split(/[\W_]+/).filter((w) => w.length >= 3);
            const wordsB = new Set((candidate.description || '').toLowerCase().split(/[\W_]+/).filter((w) => w.length >= 3));
            const sharedCount = wordsA.filter((w) => wordsB.has(w)).length;

            // Only mark duplicate if they share at least 2 problem description words
            if (sharedCount >= 2 || (kept.description && kept.description === candidate.description)) {
              isDuplicate = true;
            }
          }

          if (isDuplicate) {
            const keptEntry = updatedMap.get(kept.id)!;
            keptEntry.citizenConfirmationCount =
              (keptEntry.citizenConfirmationCount || 1) + Math.max(candidate.citizenConfirmationCount || 1, 1);
            keptEntry.confirmedByCitizenUids = [
              ...(keptEntry.confirmedByCitizenUids || []),
              ...(candidate.confirmedByCitizenUids || []),
            ];
            updatedMap.set(kept.id, keptEntry);

            removedIds.add(candidate.id);
            mergedCount++;

            if (isFirebaseConfigured && db) {
              deleteDoc(doc(db, 'complaints', candidate.id)).catch((err) =>
                console.warn('Failed to delete merged duplicate from Firestore:', err)
              );
            }
          }
        }
      }

      if (removedIds.size === 0) return prev;

      for (const [id, complaint] of updatedMap.entries()) {
        if (!removedIds.has(id) && isFirebaseConfigured && db) {
          setDoc(doc(db, 'complaints', id), complaint).catch((err) =>
            console.warn('Failed to update merged complaint in Firestore:', err)
          );
        }
      }

      return sorted.filter((c) => !removedIds.has(c.id)).map((c) => updatedMap.get(c.id) || c);
    });

    return mergedCount;
  }, []);

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
        deleteComplaint,
        mergeDuplicateComplaints,
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
