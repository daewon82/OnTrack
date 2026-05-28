"use client";

import { useEffect, useState } from "react";
import type { WeatherResponse } from "@/app/api/weather/route";

export function WeatherCard() {
  const [data, setData] = useState<WeatherResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetch("/api/weather", { cache: "no-store" });
        if (!res.ok) throw new Error(`status ${res.status}`);
        const json = (await res.json()) as WeatherResponse;
        if (!cancelled) setData(json);
      } catch (e) {
        if (!cancelled) setError((e as Error).message);
      }
    }
    load();
    // 1시간마다 갱신
    const t = setInterval(load, 60 * 60 * 1000);
    return () => {
      cancelled = true;
      clearInterval(t);
    };
  }, []);

  if (error) {
    return (
      <div className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-900">
        날씨: {error}
      </div>
    );
  }
  if (!data) {
    return (
      <div className="mb-3 rounded-xl bg-white p-3 shadow-sm">
        <div className="text-sm text-neutral-400">날씨 불러오는 중…</div>
      </div>
    );
  }

  const { current, today, week } = data;

  return (
    <section className="mb-4 rounded-xl bg-white p-3 shadow-sm">
      {/* 오늘 */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-3xl leading-none">{current.icon}</span>
          <div>
            <div className="font-semibold">
              {current.text}
              {current.rainingNow && (
                <span className="ml-2 rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-bold text-red-700">
                  지금 비
                </span>
              )}
            </div>
            <div className="text-xs text-neutral-500">
              현재 {current.temp}°
              {today.willRain && !current.rainingNow && (
                <span className="ml-2 text-red-600">
                  오늘 비 예보 (확률 {today.precipProb}%, {today.precipMm}mm)
                </span>
              )}
              {!today.willRain && (
                <span className="ml-2 text-neutral-400">
                  오늘 {today.tempMin}° / {today.tempMax}°
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 주간/장기 예보 — 16일까지 가로 스크롤 */}
      <div className="-mx-3 mt-3 overflow-x-auto border-t border-neutral-100 pt-3">
        <div className="flex gap-1 px-3">
          {week.map((d) => (
            <div
              key={d.date}
              className={
                "flex w-12 shrink-0 flex-col items-center rounded-md py-1 text-center text-xs " +
                (d.willRain ? "bg-red-50 text-red-600 font-semibold" : "text-neutral-700") +
                (d.isToday ? " ring-1 ring-blue-300" : "")
              }
              title={`${d.date} · 강수확률 ${d.precipProb}% · ${d.precipMm}mm`}
            >
              <span
                className={
                  "text-[11px] " +
                  (d.isToday ? "font-bold text-blue-600" : "text-neutral-500")
                }
              >
                {d.isToday
                  ? "오늘"
                  : `${d.dayName}${new Date(d.date + "T00:00:00Z").getUTCDate()}`}
              </span>
              <span className="my-0.5 text-base leading-none">{d.icon}</span>
              <span className="text-[10px] tabular-nums">
                {d.tempMin}°/{d.tempMax}°
              </span>
            </div>
          ))}
        </div>
        <div className="mt-1 px-3 text-[10px] text-neutral-400">
          ← {week.length}일 예보 · 옆으로 밀어서 확인 →
        </div>
      </div>
    </section>
  );
}
