import { createContext, useContext, useMemo, useState, useCallback } from "react";
import { getShipments, postScan, ACTIONABLE_STATUSES } from "@/api/backofficeApi";
import { LANE_TO_STATUS } from "@/pages/backoffice/boardColumns";
import { useToast } from "@/hooks/use-toast";

const BackofficeCtx = createContext(null);

// Smaller size so "Load more" is easy to trigger in dev
export const LANE_PAGE_SIZE = 2;

export function BackofficeProvider({ children }) {
  const { toast } = useToast();

  // Shared filters
  const [search, setSearch] = useState("");
  const [statuses, setStatuses] = useState(ACTIONABLE_STATUSES);

  /**
   * lanes:
   * {
   *   [uiLane]: {
   *     page: number,
   *     totalPages: number,
   *     total: number,
   *     items: any[],
   *     loading: boolean
   *   }
   * }
   */
  const [lanes, setLanes] = useState({});

  const resetBoard = useCallback(() => setLanes({}), []);

  const fetchLane = useCallback(
    async (uiLane, { page } = {}) => {
      // Use functional updates to avoid stale closures
      let nextPage;
      setLanes(prev => {
        const curr = prev[uiLane] || {
          page: 0, totalPages: 0, total: 0, items: [], loading: false,
        };
        nextPage = page ?? (curr.page ? curr.page + 1 : 1);
        return {
          ...prev,
          [uiLane]: { ...curr, loading: true },
        };
      });

      try {
        // Translate UI lane to canonical API status
        const apiStatus = LANE_TO_STATUS[uiLane] || uiLane;

        const resp = await getShipments({
          status: [apiStatus],
          page: nextPage,
          limit: LANE_PAGE_SIZE,
          search,
          sort: "updatedAt:desc",
        });

        setLanes(prev => {
          const prevLane = prev[uiLane] || { items: [] };
          const mergedItems = nextPage === 1 ? resp.data : [...prevLane.items, ...resp.data];
          return {
            ...prev,
            [uiLane]: {
              page: resp.page,
              totalPages: resp.totalPages ?? 0,
              total: resp.total ?? mergedItems.length,
              items: mergedItems,
              loading: false,
            },
          };
        });

        return resp;
      } catch (e) {
        setLanes(prev => {
          const curr = prev[uiLane] || {};
          return { ...prev, [uiLane]: { ...curr, loading: false } };
        });
        const msg = e?.response?.data?.message || e?.message || "Failed to load shipments";
        toast({ variant: "destructive", title: "Load failed", description: msg });
        throw e;
      }
    },
    [search, toast]
  );

  // Scan action shared by Scan tab & future DnD
  const scan = useCallback(
    async ({ ref, status, type, note, location }) => {
      try {
        const res = await postScan({ ref, status, type, note, location });
        toast({ title: `Scanned ${status || type}`, description: `Ref ${ref}` });
        return res;
      } catch (e) {
        const msg = e?.response?.data?.message || e?.message || "Scan failed";
        toast({ variant: "destructive", title: "Scan failed", description: msg });
        throw e;
      }
    },
    [toast]
  );

  const value = useMemo(
    () => ({
      // filters
      search, setSearch,
      statuses, setStatuses,

      // board state
      lanes, resetBoard, fetchLane,

      // actions
      scan,
    }),
    [search, statuses, lanes, resetBoard, fetchLane, scan]
  );

  return <BackofficeCtx.Provider value={value}>{children}</BackofficeCtx.Provider>;
}

export function useBackoffice() {
  const ctx = useContext(BackofficeCtx);
  if (!ctx) throw new Error("useBackoffice must be used within BackofficeProvider");
  return ctx;
}
