import React, { useEffect, useState } from "react";
import { reportApi } from "@/api/reportApi";

export default function ReportsPage() {
  const [range, setRange] = useState("week");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  async function load(rangeArg = range) {
    setLoading(true);
    try {
      const resp = await reportApi.getSummary({ range: rangeArg });
      setData(resp);
    } catch (err) {
      console.error(err);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  if (loading) return <div className="p-4">Loading reports…</div>;
  if (!data) return <div className="p-4 text-red-600">Failed to load reports</div>;

  return (
    <div className="p-6 space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Summary Reports</h1>
        <div className="flex gap-2">
          <button className={`btn ${range==='week'?'btn-primary':''}`} onClick={() => { setRange('week'); load('week'); }}>Week</button>
          <button className={`btn ${range==='month'?'btn-primary':''}`} onClick={() => { setRange('month'); load('month'); }}>Month</button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="card p-4">
          <div className="text-sm text-muted-foreground">Shipments</div>
          <div className="text-xl font-bold">{data.totals.shipmentsCreated}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-muted-foreground">Pickups</div>
          <div className="text-xl font-bold">{data.totals.pickups}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-muted-foreground">Deliveries</div>
          <div className="text-xl font-bold">{data.totals.deliveries}</div>
        </div>
        <div className="card p-4">
          <div className="text-sm text-muted-foreground">Revenue</div>
          <div className="text-xl font-bold">{Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(data.totals.revenue || 0)}</div>
        </div>
      </div>

      <div>
        <h2 className="text-lg font-medium">By Day</h2>
        <div className="mt-2 overflow-auto">
          <table className="w-full table-auto">
            <thead>
              <tr>
                <th className="text-left p-2">Date</th>
                <th className="text-left p-2">Shipments</th>
                <th className="text-left p-2">Pickups</th>
                <th className="text-left p-2">Deliveries</th>
                <th className="text-left p-2">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {data.byDay.map((d) => (
                <tr key={d.date}>
                  <td className="p-2">{d.date}</td>
                  <td className="p-2">{d.shipments}</td>
                  <td className="p-2">{d.pickups}</td>
                  <td className="p-2">{d.deliveries}</td>
                  <td className="p-2">{Intl.NumberFormat('en-GB', { style: 'currency', currency: 'EUR' }).format(d.revenue || 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
