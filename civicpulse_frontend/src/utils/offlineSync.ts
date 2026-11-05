/**
 * offlineSync.ts
 *
 * Offline-first complaint caching with IndexedDB and auto-sync on reconnect.
 * Uses the browser's native IndexedDB API — no external libraries required.
 *
 * DB name : CityResolveOfflineDB  (version 1)
 * Store   : offlineComplaints
 */

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface OfflineComplaintPayload {
  offlineId: string;
  title: string;
  description: string;
  voiceTranscript?: string;
  category: string;
  priority: string;
  photoBase64: string;
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
    category: string;
    urgency: string;
    keySummary: string;
    keywords: string[];
  };
  gpsTimestamp: string; // hardware GPS timestamp
  createdAt: string;
  syncStatus: 'pending' | 'synced' | 'failed';
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DB_NAME = 'CityResolveOfflineDB';
const DB_VERSION = 1;
const STORE_NAME = 'offlineComplaints';
const LOG_PREFIX = '[OfflineSync]';

/** Interval (ms) for the periodic sync check. */
const PERIODIC_SYNC_INTERVAL = 30_000; // 30 seconds

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Generate a simple unique ID for offline entries. */
function generateOfflineId(): string {
  return `offline_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`;
}

// ---------------------------------------------------------------------------
// Database initialisation
// ---------------------------------------------------------------------------

/**
 * Opens (or creates) the CityResolveOfflineDB IndexedDB database.
 * Creates the `offlineComplaints` object store on first run / version upgrade.
 */
export function initOfflineDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      const msg = `${LOG_PREFIX} IndexedDB is not available in this environment.`;
      console.error(msg);
      reject(new Error(msg));
      return;
    }

    console.log(`${LOG_PREFIX} Opening database "${DB_NAME}" v${DB_VERSION}…`);
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // Create the object store if it doesn't already exist
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        const store = db.createObjectStore(STORE_NAME, { keyPath: 'offlineId' });

        // Index on syncStatus so we can quickly query pending / synced entries
        store.createIndex('syncStatus', 'syncStatus', { unique: false });
        // Index on createdAt for chronological ordering
        store.createIndex('createdAt', 'createdAt', { unique: false });

        console.log(`${LOG_PREFIX} Object store "${STORE_NAME}" created with indexes.`);
      }
    };

    request.onsuccess = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      console.log(`${LOG_PREFIX} Database opened successfully.`);
      resolve(db);
    };

    request.onerror = (event) => {
      const error = (event.target as IDBOpenDBRequest).error;
      console.error(`${LOG_PREFIX} Failed to open database:`, error);
      reject(error);
    };
  });
}

// ---------------------------------------------------------------------------
// CRUD helpers (all obtain their own short-lived DB connection)
// ---------------------------------------------------------------------------

/**
 * Save a complaint payload to IndexedDB for later sync.
 * Returns the generated `offlineId`.
 */
export async function saveComplaintOffline(
  payload: Omit<OfflineComplaintPayload, 'offlineId' | 'createdAt' | 'syncStatus'>,
): Promise<string> {
  const db = await initOfflineDB();

  const offlineId = generateOfflineId();
  const entry: OfflineComplaintPayload = {
    ...payload,
    offlineId,
    createdAt: new Date().toISOString(),
    syncStatus: 'pending',
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const request = store.add(entry);

    request.onsuccess = () => {
      console.log(`${LOG_PREFIX} Complaint saved offline — id: ${offlineId}`);
      resolve(offlineId);
    };

    request.onerror = (event) => {
      const error = (event.target as IDBRequest).error;
      console.error(`${LOG_PREFIX} Failed to save complaint offline:`, error);
      reject(error);
    };

    tx.oncomplete = () => db.close();
  });
}

/**
 * Retrieve all complaints whose `syncStatus` is `'pending'`.
 */
export async function getPendingComplaints(): Promise<OfflineComplaintPayload[]> {
  const db = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('syncStatus');
    const request = index.getAll(IDBKeyRange.only('pending'));

    request.onsuccess = () => {
      const results: OfflineComplaintPayload[] = request.result;
      console.log(`${LOG_PREFIX} Found ${results.length} pending complaint(s).`);
      resolve(results);
    };

    request.onerror = (event) => {
      const error = (event.target as IDBRequest).error;
      console.error(`${LOG_PREFIX} Failed to fetch pending complaints:`, error);
      reject(error);
    };

    tx.oncomplete = () => db.close();
  });
}

/**
 * Mark a single offline complaint as `'synced'`.
 */
export async function markAsSynced(offlineId: string): Promise<void> {
  const db = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const getReq = store.get(offlineId);

    getReq.onsuccess = () => {
      const entry: OfflineComplaintPayload | undefined = getReq.result;
      if (!entry) {
        console.warn(`${LOG_PREFIX} No entry found for offlineId "${offlineId}".`);
        resolve();
        return;
      }

      entry.syncStatus = 'synced';
      const putReq = store.put(entry);

      putReq.onsuccess = () => {
        console.log(`${LOG_PREFIX} Marked "${offlineId}" as synced.`);
        resolve();
      };

      putReq.onerror = (event) => {
        const error = (event.target as IDBRequest).error;
        console.error(`${LOG_PREFIX} Failed to mark "${offlineId}" as synced:`, error);
        reject(error);
      };
    };

    getReq.onerror = (event) => {
      const error = (event.target as IDBRequest).error;
      console.error(`${LOG_PREFIX} Failed to read entry "${offlineId}":`, error);
      reject(error);
    };

    tx.oncomplete = () => db.close();
  });
}

/**
 * Delete all complaints that have already been synced.
 */
export async function deleteSyncedComplaints(): Promise<void> {
  const db = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readwrite');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('syncStatus');
    const cursorReq = index.openCursor(IDBKeyRange.only('synced'));

    let deletedCount = 0;

    cursorReq.onsuccess = (event) => {
      const cursor = (event.target as IDBRequest<IDBCursorWithValue | null>).result;
      if (cursor) {
        cursor.delete();
        deletedCount++;
        cursor.continue();
      } else {
        console.log(`${LOG_PREFIX} Cleaned up ${deletedCount} synced complaint(s).`);
        resolve();
      }
    };

    cursorReq.onerror = (event) => {
      const error = (event.target as IDBRequest).error;
      console.error(`${LOG_PREFIX} Failed to delete synced complaints:`, error);
      reject(error);
    };

    tx.oncomplete = () => db.close();
  });
}

/**
 * Returns the number of complaints still pending sync.
 */
export async function getOfflineCount(): Promise<number> {
  const db = await initOfflineDB();

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_NAME, 'readonly');
    const store = tx.objectStore(STORE_NAME);
    const index = store.index('syncStatus');
    const countReq = index.count(IDBKeyRange.only('pending'));

    countReq.onsuccess = () => {
      console.log(`${LOG_PREFIX} Pending complaint count: ${countReq.result}`);
      resolve(countReq.result);
    };

    countReq.onerror = (event) => {
      const error = (event.target as IDBRequest).error;
      console.error(`${LOG_PREFIX} Failed to count pending complaints:`, error);
      reject(error);
    };

    tx.oncomplete = () => db.close();
  });
}

// ---------------------------------------------------------------------------
// Connectivity helpers
// ---------------------------------------------------------------------------

/**
 * Simple wrapper around `navigator.onLine`.
 */
export function isOnline(): boolean {
  return typeof navigator !== 'undefined' ? navigator.onLine : true;
}

// ---------------------------------------------------------------------------
// Auto-sync
// ---------------------------------------------------------------------------

/** Track the periodic interval so we can clear it if needed. */
let periodicSyncInterval: ReturnType<typeof setInterval> | null = null;

/**
 * Register an auto-sync mechanism that:
 *   1. Listens for the browser `online` event and syncs all pending complaints.
 *   2. Runs a periodic check every 30 seconds in case events are missed.
 *
 * @param syncFn — A function that attempts to sync a single complaint payload.
 *                 Should return `true` on success, `false` on failure.
 */
export function setupAutoSync(
  syncFn: (payload: OfflineComplaintPayload) => Promise<boolean>,
): void {
  /**
   * Internal routine that pulls every pending complaint and attempts to sync
   * it via the provided `syncFn`. Successful entries are marked as synced and
   * subsequently cleaned up.
   */
  const attemptSync = async (): Promise<void> => {
    if (!isOnline()) {
      console.log(`${LOG_PREFIX} Device is offline — skipping sync attempt.`);
      return;
    }

    console.log(`${LOG_PREFIX} Starting auto-sync of pending complaints…`);

    try {
      const pending = await getPendingComplaints();

      if (pending.length === 0) {
        console.log(`${LOG_PREFIX} No pending complaints to sync.`);
        return;
      }

      console.log(`${LOG_PREFIX} Attempting to sync ${pending.length} complaint(s)…`);

      let syncedCount = 0;
      let failedCount = 0;

      for (const complaint of pending) {
        try {
          const success = await syncFn(complaint);

          if (success) {
            await markAsSynced(complaint.offlineId);
            syncedCount++;
            console.log(
              `${LOG_PREFIX} Successfully synced "${complaint.offlineId}".`,
            );
          } else {
            failedCount++;
            console.warn(
              `${LOG_PREFIX} syncFn returned false for "${complaint.offlineId}".`,
            );
          }
        } catch (err) {
          failedCount++;
          console.error(
            `${LOG_PREFIX} Error syncing "${complaint.offlineId}":`,
            err,
          );
        }
      }

      console.log(
        `${LOG_PREFIX} Sync complete — ${syncedCount} synced, ${failedCount} failed.`,
      );

      // Clean up entries that were successfully synced
      if (syncedCount > 0) {
        await deleteSyncedComplaints();
      }
    } catch (err) {
      console.error(`${LOG_PREFIX} Auto-sync encountered an error:`, err);
    }
  };

  // 1. Listen for the browser "online" event
  if (typeof window !== 'undefined') {
    window.addEventListener('online', () => {
      console.log(`${LOG_PREFIX} Device came online — triggering sync.`);
      attemptSync();
    });

    console.log(`${LOG_PREFIX} Registered "online" event listener for auto-sync.`);
  }

  // 2. Set up a periodic sync check every 30 seconds
  if (periodicSyncInterval !== null) {
    clearInterval(periodicSyncInterval);
  }

  periodicSyncInterval = setInterval(() => {
    console.log(`${LOG_PREFIX} Periodic sync check triggered.`);
    attemptSync();
  }, PERIODIC_SYNC_INTERVAL);

  console.log(
    `${LOG_PREFIX} Periodic sync scheduled every ${PERIODIC_SYNC_INTERVAL / 1000}s.`,
  );
}
