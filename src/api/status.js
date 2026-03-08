// api/statuses.js
import { kv } from "@vercel/kv";

const STATUS_KEY  = "leadflow:statuses";
const OUTREACH_KEY= "leadflow:outreach";
const DAILY_KEY   = "leadflow:daily";
const HISTORY_KEY = "leadflow:daily_history"; // NEW: { "YYYY-MM-DD": { job, build_no_demo, build_demo } }

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(200).end();

  // ── GET ──────────────────────────────────────────────────────────────────
  if (req.method === "GET") {
    try {
      const [statuses, outreach, daily, history] = await Promise.all([
        kv.get(STATUS_KEY),
        kv.get(OUTREACH_KEY),
        kv.get(DAILY_KEY),
        kv.get(HISTORY_KEY),   // NEW
      ]);
      return res.status(200).json({
        statuses: statuses || {},
        outreach: outreach || [],
        daily:    daily    || null,
        history:  history  || {},  // NEW
      });
    } catch (err) {
      console.error("KV GET error:", err);
      return res.status(500).json({ error: "Failed to load data" });
    }
  }

  // ── POST ─────────────────────────────────────────────────────────────────
  if (req.method === "POST") {
    try {
      const body = req.body;
      if (typeof body !== "object" || Array.isArray(body))
        return res.status(400).json({ error: "Expected a JSON object" });

      const ops = [];

      if (body.statuses !== undefined) {
        if (typeof body.statuses !== "object" || Array.isArray(body.statuses))
          return res.status(400).json({ error: "statuses must be an object" });
        ops.push(kv.set(STATUS_KEY, body.statuses));
      }

      if (body.outreach !== undefined) {
        if (!Array.isArray(body.outreach))
          return res.status(400).json({ error: "outreach must be an array" });
        ops.push(kv.set(OUTREACH_KEY, body.outreach.slice(0, 500)));
      }

      // ── daily (today's counter + goal) ───────────────────────────────────
      if (body.daily !== undefined) {
        if (typeof body.daily !== "object" || Array.isArray(body.daily))
          return res.status(400).json({ error: "daily must be an object" });

        const incoming     = body.daily;
        const incomingDate = incoming.date;
        const existing     = await kv.get(DAILY_KEY);

        let toSave;
        if (existing && existing.date === incomingDate) {
          toSave = {
            date: incomingDate,
            counts: {
              job:           Math.max(existing.counts?.job           || 0, incoming.counts?.job           || 0),
              build_no_demo: Math.max(existing.counts?.build_no_demo || 0, incoming.counts?.build_no_demo || 0),
              build_demo:    Math.max(existing.counts?.build_demo    || 0, incoming.counts?.build_demo    || 0),
            },
            goal: incoming.goal || existing.goal || 10,
          };
        } else {
          toSave = {
            date:   incomingDate,
            counts: incoming.counts || { job: 0, build_no_demo: 0, build_demo: 0 },
            goal:   incoming.goal   || (existing ? existing.goal : 10),
          };
        }
        ops.push(kv.set(DAILY_KEY, toSave));

        // ── NEW: also merge today into history ────────────────────────────
        // We do a read-modify-write on the history object.
        // Only update the date being pushed (never clobber other days).
        const existingHistory = await kv.get(HISTORY_KEY) || {};
        const prevDay = existingHistory[incomingDate] || { job: 0, build_no_demo: 0, build_demo: 0 };
        existingHistory[incomingDate] = {
          job:           Math.max(prevDay.job           || 0, toSave.counts.job           || 0),
          build_no_demo: Math.max(prevDay.build_no_demo || 0, toSave.counts.build_no_demo || 0),
          build_demo:    Math.max(prevDay.build_demo    || 0, toSave.counts.build_demo    || 0),
        };
        ops.push(kv.set(HISTORY_KEY, existingHistory));
      }

      // ── NEW: allow client to directly patch history (e.g. manual edits) ──
      if (body.history !== undefined) {
        if (typeof body.history !== "object" || Array.isArray(body.history))
          return res.status(400).json({ error: "history must be an object" });
        // Merge with existing rather than replace to be safe
        const existingHistory = await kv.get(HISTORY_KEY) || {};
        const merged = { ...existingHistory };
        for (const [date, counts] of Object.entries(body.history)) {
          const prev = merged[date] || { job: 0, build_no_demo: 0, build_demo: 0 };
          merged[date] = {
            job:           Math.max(prev.job           || 0, counts.job           || 0),
            build_no_demo: Math.max(prev.build_no_demo || 0, counts.build_no_demo || 0),
            build_demo:    Math.max(prev.build_demo    || 0, counts.build_demo    || 0),
          };
        }
        ops.push(kv.set(HISTORY_KEY, merged));
      }

      await Promise.all(ops);
      return res.status(200).json({ ok: true });
    } catch (err) {
      console.error("KV SET error:", err);
      return res.status(500).json({ error: "Failed to save data" });
    }
  }

  return res.status(405).json({ error: "Method not allowed" });
}