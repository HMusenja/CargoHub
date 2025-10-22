/* ==================================================================
File: src/context/DriverContext.jsx
================================================================== */

import React, { createContext, useContext, useReducer, useCallback } from "react";
import { driverApi } from "../api/driverApi";


const initialState = {
assignments: { date: null, pickups: [], deliveries: [] },
loading: false,
error: null,
};

function reducer(state, action) {
switch (action.type) {
case "FETCH_START":
return { ...state, loading: true, error: null };
case "FETCH_SUCCESS":
return { ...state, loading: false, assignments: action.payload };
case "FETCH_ERROR":
return { ...state, loading: false, error: action.error };
case "POD_SUBMIT_START":
return { ...state, loading: true, error: null };
case "POD_SUBMIT_SUCCESS": {
// optimistic update: remove from deliveries or mark as delivered
const updated = { ...state.assignments };
const { shipmentId } = action.payload;
// remove from deliveries list if present
updated.deliveries = updated.deliveries.filter((d) => d.shipmentId !== shipmentId);
// add to pickups/deliveries? we mark as delivered implicitly by removal
return { ...state, loading: false, assignments: updated };
}
case "POD_SUBMIT_ERROR":
return { ...state, loading: false, error: action.error };
default:
return state;
}
}
const DriverContext = createContext(null);

export function DriverProvider({ children }) {
const [state, dispatch] = useReducer(reducer, initialState);


const fetchAssignments = useCallback(async ({ date, type } = {}) => {
dispatch({ type: "FETCH_START" });
try {
const data = await driverApi.getAssignments({ date, type });
// ensure shape
const assignments = {
date: data.date || date || null,
pickups: Array.isArray(data.pickups) ? data.pickups : [],
deliveries: Array.isArray(data.deliveries) ? data.deliveries : [],
};
dispatch({ type: "FETCH_SUCCESS", payload: assignments });
return assignments;
} catch (err) {
console.error("fetchAssignments error", err);
dispatch({ type: "FETCH_ERROR", error: err });
throw err;
}
}, []);


const submitPOD = useCallback(async (shipmentId, payload) => {
dispatch({ type: "POD_SUBMIT_START" });
try {
const res = await driverApi.postPOD(shipmentId, payload);
// optimistic update: remove from deliveries
dispatch({ type: "POD_SUBMIT_SUCCESS", payload: { shipmentId } });
return res;
} catch (err) {
console.error("submitPOD error", err);
dispatch({ type: "POD_SUBMIT_ERROR", error: err });
throw err;
}
}, []);


const value = {
assignments: state.assignments,
loading: state.loading,
error: state.error,
fetchAssignments,
submitPOD,
};


return <DriverContext.Provider value={value}>{children}</DriverContext.Provider>;
}

export function useDriver() {
const ctx = useContext(DriverContext);
if (!ctx) throw new Error("useDriver must be used within DriverProvider");
return ctx;
}