"use client";

import { useEffect, useState } from "react";

/**
 * 방문자 카운터 — abacus.jasoncameron.dev (무료 익명 카운터 API)
 *
 * - PV (Page View): 페이지 로드마다 +1 (새로고침 포함)
 * - UV (Unique Visitor): 24시간에 1회만 +1 (localStorage 기반 디덤)
 *
 * abacus API:
 *   GET /hit/<ns>/<key>  → {value: N}  (카운터 +1 후 값 반환)
 *   GET /get/<ns>/<key>  → {value: N}  (값만 조회)
 */

const NS = "ontrack-wheat";
const KEY_PV = "pv-total";
const KEY_UV = "uv-total";
const LAST_VISIT_KEY = "ontrack:lastVisit";
const UV_WINDOW_MS = 24 * 60 * 60 * 1000;

const ABACUS = "https://abacus.jasoncameron.dev";

type Stats = { pv: number | null; uv: number | null };

async function fetchValue(path: string): Promise<number | null> {
  try {
    const res = await fetch(`${ABACUS}${path}`, { cache: "no-store" });
    if (!res.ok) return null;
    const json = (await res.json()) as { value?: number };
    return typeof json.value === "number" ? json.value : null;
  } catch {
    return null;
  }
}

export function VisitorCounter() {
  const [stats, setStats] = useState<Stats>({ pv: null, uv: null });

  useEffect(() => {
    let cancelled = false;

    async function run() {
      // 1) PV: 항상 +1
      const pv = await fetchValue(`/hit/${NS}/${KEY_PV}`);

      // 2) UV: 24시간 이내 재방문이면 +0 (조회만), 아니면 +1
      let uv: number | null = null;
      try {
        const last = Number(localStorage.getItem(LAST_VISIT_KEY) || "0");
        const now = Date.now();
        if (now - last >= UV_WINDOW_MS) {
          uv = await fetchValue(`/hit/${NS}/${KEY_UV}`);
          localStorage.setItem(LAST_VISIT_KEY, String(now));
        } else {
          uv = await fetchValue(`/get/${NS}/${KEY_UV}`);
        }
      } catch {
        uv = await fetchValue(`/get/${NS}/${KEY_UV}`);
      }

      if (!cancelled) setStats({ pv, uv });
    }

    run();
    return () => {
      cancelled = true;
    };
  }, []);

  if (stats.pv == null && stats.uv == null) return null;

  return (
    <div className="mt-2 text-center text-xs text-neutral-400">
      👥 누적 방문{" "}
      <span className="font-semibold text-neutral-600">
        {stats.uv?.toLocaleString() ?? "-"}
      </span>
      명 · 조회{" "}
      <span className="font-semibold text-neutral-600">
        {stats.pv?.toLocaleString() ?? "-"}
      </span>
      회
    </div>
  );
}
