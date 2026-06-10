"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Download } from "lucide-react";

interface SessionRow {
  user_name: string;
  user_id: string;
  session_id: string;
  round: number;
  origin: string;
  destination: string;
  chosen_route: string;
  predicted_time: number | null;
  realized_time: number | null;
  decision_latency: number | null;
  route_a_flow: number | null;
  route_b_flow: number | null;
  route_c_flow: number | null;
  route_path: string[];
  initial_choice: string | null;
  final_choice: string | null;
  choice_reason: string | null;
  choice_reason_text: string | null;
  created_at: string;
}

export function SessionDataTable({ roomId }: { roomId: string }) {
  const [rows, setRows] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
useEffect(() => {
    const fetchData = () => {
      fetch(`/api/admin/session-data?room_id=${roomId}`)
        .then(r => r.json())
        .then(data => {
          if (data.status === "success") setRows(data.rows);
        })
        .catch(console.error)
        .finally(() => setLoading(false));
    };

    fetchData();
    const interval = setInterval(fetchData, 3000);
    return () => clearInterval(interval);
  }, [roomId]);

  const downloadCSV = () => {
    const headers = [
      "Player", "Session ID", "Round", "Origin", "Destination",
      "Chosen Route", "Initial Choice", "Final Choice", "Predicted Time", "Realized Time", "Decision Latency (s)",
      "Route Path", "Choice Reason", "Choice Reason Detail", "Timestamp"
    ];

    const csvRows = rows.map(r => [
      r.user_name,
      r.session_id,
      r.round,
      r.origin,
      r.destination,
      r.chosen_route,
      r.initial_choice ?? "",
      r.final_choice ?? "",
      r.predicted_time?.toFixed(2) ?? "",
      r.realized_time?.toFixed(2) ?? "",
      r.decision_latency?.toFixed(2) ?? "",
      r.route_a_flow ?? "",
      r.route_b_flow ?? "",
      r.route_c_flow ?? "",
      r.route_path?.join(" -> ") ?? "",
      r.choice_reason ?? "",
      r.choice_reason_text ?? "",
      new Date(r.created_at).toLocaleString(),
    ].map(v => `"${v}"`).join(","));

    const csv = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `session_${roomId}_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center text-muted-foreground">
          No data yet. Data appears here as players complete rounds.
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Session Data — Room {roomId}</CardTitle>
        <Button size="sm" variant="outline" onClick={downloadCSV}>
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b bg-muted/50">
                {[
                  "Player", "Round", "From", "To", "Route",
                  "Initial", "Final", "Predicted", "Realized", "Δ%", "Latency",
                  "A Flow", "B Flow", "C Flow",
                  "Path", "Reason", "Detail", "Time"
                ].map(h => (
                  <th key={h} className="px-3 py-2 text-left font-medium text-muted-foreground whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const diff = row.realized_time != null && row.predicted_time != null
                  ? row.realized_time - row.predicted_time
                  : null;
                const pct = diff != null && row.predicted_time
                  ? (Math.abs(diff) / row.predicted_time * 100).toFixed(1)
                  : null;

                return (
                  <tr
                    key={i}
                    className={`border-b hover:bg-muted/30 transition-colors ${
                      i % 2 === 0 ? "" : "bg-muted/10"
                    }`}
                  >
                    <td className="px-3 py-2 font-medium whitespace-nowrap">{row.user_name}</td>
                    <td className="px-3 py-2">
                      <Badge variant="outline">R{row.round}</Badge>
                    </td>
                    <td className="px-3 py-2 font-mono text-xs">{row.origin}</td>
                    <td className="px-3 py-2 font-mono text-xs">{row.destination}</td>
                    <td className="px-3 py-2">
                      <Badge className={
                        row.chosen_route === "Route A" ? "bg-blue-500/10 text-blue-700 border-blue-200" :
                        row.chosen_route === "Route B" ? "bg-violet-500/10 text-violet-700 border-violet-200" :
                        "bg-orange-500/10 text-orange-700 border-orange-200"
                      } variant="outline">
                        {row.chosen_route}
                      </Badge>
                    </td>
                    <td className="px-3 py-2 text-xs">{row.initial_choice ?? "—"}</td>
                    <td className={`px-3 py-2 text-xs font-medium ${
                      row.final_choice && row.initial_choice && row.final_choice !== row.initial_choice
                        ? 'text-orange-600' : 'text-muted-foreground'
                    }`}>
                      {row.final_choice ?? "—"}
                      {row.final_choice && row.initial_choice && row.final_choice !== row.initial_choice && (
                        <span className="ml-1 text-orange-400">↑</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-blue-700 font-medium">
                      {row.predicted_time?.toFixed(2) ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-green-700 font-medium">
                      {row.realized_time?.toFixed(2) ?? "—"}
                    </td>
                    <td className={`px-3 py-2 text-xs font-medium ${
                      diff == null ? "text-muted-foreground" :
                      diff > 0 ? "text-red-500" : "text-green-600"
                    }`}>
                      {pct != null ? `${diff! > 0 ? "+" : "-"}${pct}%` : "—"}
                    </td>
                    <td className="px-3 py-2 text-muted-foreground">
                      {row.decision_latency?.toFixed(1) ?? "—"}s
                    </td>
                    <td className="px-3 py-2 text-xs">{row.route_a_flow ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">{row.route_b_flow ?? "—"}</td>
                    <td className="px-3 py-2 text-xs">{row.route_c_flow ?? "—"}</td>
                    <td className="px-3 py-2 font-mono text-xs text-muted-foreground max-w-32 truncate">
                      {row.route_path?.join("→") ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs">{row.choice_reason ?? "—"}</td>
                    <td className="px-3 py-2 text-xs text-muted-foreground max-w-24 truncate">
                      {row.choice_reason_text ?? "—"}
                    </td>
                    <td className="px-3 py-2 text-xs text-muted-foreground whitespace-nowrap">
                      {new Date(row.created_at).toLocaleTimeString()}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          {rows.length} rows · {new Set(rows.map(r => r.session_id)).size} players · {new Set(rows.map(r => r.round)).size} rounds
        </p>
      </CardContent>
    </Card>
  );
}