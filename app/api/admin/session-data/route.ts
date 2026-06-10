import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const roomId = request.nextUrl.searchParams.get("room_id");
    if (!roomId) return NextResponse.json({ error: "Missing room_id" }, { status: 400 });

    const result = await pool.query(`
      SELECT
        s.user_name,
        s.user_id,
        s.id as session_id,
        rl.round,
        rl.origin,
        rl.destination,
        rl.chosen_route,
        rl.initial_choice,
        rl.final_choice,
        rl.predicted_time,
        rl.realized_time,
        rl.decision_latency,
        rl.route_a_flow,
        rl.route_b_flow,
        rl.route_c_flow,
        rl.route_path,
        rl.choice_reason,
        rl.choice_reason_text,
        rl.created_at
      FROM simulation_sessions s
      JOIN round_logs rl ON rl.session_id = s.id
      WHERE s.room_id = $1
      ORDER BY s.user_name ASC, rl.round ASC
    `, [roomId]);

    const rows = result.rows.map((r: any) => ({
      ...r,
      predicted_time: r.predicted_time ? parseFloat(r.predicted_time) : null,
      realized_time: r.realized_time ? parseFloat(r.realized_time) : null,
      decision_latency: r.decision_latency ? parseFloat(r.decision_latency) : null,
      route_a_flow: r.route_a_flow ? parseFloat(r.route_a_flow) : null,
      route_b_flow: r.route_b_flow ? parseFloat(r.route_b_flow) : null,
      route_c_flow: r.route_c_flow ? parseFloat(r.route_c_flow) : null,
      initial_choice: r.initial_choice,
      final_choice: r.final_choice,
    }));

    return NextResponse.json({ status: "success", rows });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}