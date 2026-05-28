"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import {
  determineDirection,
  terminalMatchesDirection,
  directionToInoutTag,
  type Station,
} from "@/data/stations";
import type { TimetableEntry } from "@/app/api/timetable/route";

function normalize(s: string): string {
  return s.replace(/\s+/g, "").replace(/역$/, "");
}

type TimetableResponse = {
  entries: TimetableEntry[];
  error?: string;
  note?: string;
};

type Props = {
  /** 카드 제목 (예: "1단계: DMC 출발") */
  title?: string;
  origin: Station;
  /** 방향 필터링용 도착 또는 환승역 */
  directionTarget: Station | null;
  /** true면 directionTarget의 종착명과 정확 일치하는 열차만 (예: 대화행만) */
  exactTerminal?: boolean;
  /** ETA가 이 값(초) 이상인 열차만 표시 */
  thresholdSec: number;
  /** 임계 의미 설명 */
  thresholdLabel: string;
  now: Date;
  /** 표시할 최소 열차 수 */
  minCount?: number;
  /** ETA가 이 분 이상인 첫 번째 열차를 시각적으로 강조 */
  highlightFromMinutes?: number;
  /** 최적 탑승 위치 표시 텍스트 (예: "🚪 4-2번 칸 — 불광 환승") */
  boardingHintLabel?: string | null;
};

type DisplayItem = {
  at: Date;
  destination: string;
  express?: boolean;
  trainNo?: string;
};

/** "HH:MM:SS" + 오늘 → Date */
function timeStringToDate(hhmmss: string, ref: Date): Date {
  const [h, m, s] = hhmmss.split(":").map(Number);
  const d = new Date(ref);
  if (h >= 24) {
    d.setDate(d.getDate() + 1);
    d.setHours(h - 24, m, s ?? 0, 0);
  } else {
    d.setHours(h, m, s ?? 0, 0);
    if (d.getTime() < ref.getTime() - 6 * 3600 * 1000) {
      d.setDate(d.getDate() + 1);
    }
  }
  return d;
}

export function ArrivalsCard({
  title,
  origin,
  directionTarget,
  exactTerminal = false,
  thresholdSec,
  thresholdLabel,
  now,
  minCount = 3,
  highlightFromMinutes,
  boardingHintLabel,
}: Props) {
  const [timetable, setTimetable] = useState<TimetableResponse | null>(null);
  const [loading, setLoading] = useState(false);

  // 정적 시간표 INOUT_TAG 결정 (origin과 directionTarget 같은 노선일 때만)
  const inoutTag = useMemo(() => {
    if (!directionTarget || directionTarget.line !== origin.line) return null;
    const dir = determineDirection(origin, directionTarget);
    return dir ? directionToInoutTag(dir) : null;
  }, [origin, directionTarget]);

  const fetchTimetable = useCallback(async () => {
    if (!inoutTag) {
      setTimetable({ entries: [] });
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(
        `/api/timetable?station=${encodeURIComponent(origin.apiName)}&line=${encodeURIComponent(origin.line)}&inout=${inoutTag}`,
        { cache: "no-store" },
      );
      const json = (await res.json()) as TimetableResponse;
      setTimetable(json);
    } catch (e) {
      setTimetable({ entries: [], error: (e as Error).message });
    } finally {
      setLoading(false);
    }
  }, [origin, inoutTag]);

  useEffect(() => {
    fetchTimetable();
    const t = setInterval(fetchTimetable, 60_000);
    return () => clearInterval(t);
  }, [fetchTimetable]);

  // ─── 필터 + 정렬 ────────────────────────────────────────
  const items: DisplayItem[] = useMemo(() => {
    const entries = timetable?.entries ?? [];

    // 종착/방향 필터
    const direction =
      directionTarget && directionTarget.line === origin.line
        ? determineDirection(origin, directionTarget)
        : null;
    const passDirection = (destination: string) => {
      if (!directionTarget) return true;
      if (exactTerminal) {
        return normalize(destination) === normalize(directionTarget.apiName);
      }
      if (direction) {
        return terminalMatchesDirection(origin, direction, destination);
      }
      return true;
    };

    // DisplayItem 변환
    const all: DisplayItem[] = entries
      .filter((e) => passDirection(e.destination))
      .map((e) => ({
        at: timeStringToDate(e.leftTime || e.arriveTime, now),
        destination: e.destination,
        express: e.express,
        trainNo: e.trainNo,
      }));

    // 임계 이후만
    const thresholdAt = new Date(now.getTime() + thresholdSec * 1000);
    const future = all.filter((it) => it.at.getTime() >= thresholdAt.getTime());

    // 시각순 정렬 (이미 정렬돼있지만 안전)
    future.sort((a, b) => a.at.getTime() - b.at.getTime());

    // 기본 슬라이스
    const baseCount = minCount;
    const sliced = future.slice(0, baseCount);

    // highlightFromMinutes 보장
    if (highlightFromMinutes != null) {
      const thresholdMs = now.getTime() + highlightFromMinutes * 60 * 1000;
      const inSlice = sliced.some((it) => it.at.getTime() >= thresholdMs);
      if (!inSlice) {
        const hiIdx = future.findIndex((it) => it.at.getTime() >= thresholdMs);
        if (hiIdx >= 0) {
          const newCount = Math.min(hiIdx + 1, 12);
          return future.slice(0, newCount);
        }
      }
    }

    return sliced;
  }, [
    timetable,
    now,
    origin,
    directionTarget,
    exactTerminal,
    thresholdSec,
    minCount,
    highlightFromMinutes,
  ]);

  const noCommonLine =
    !exactTerminal && directionTarget && directionTarget.line !== origin.line;

  return (
    <section className="mb-4 rounded-xl bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div>
          {title && (
            <div className="mb-0.5 text-xs font-semibold text-blue-600">
              {title}
            </div>
          )}
          <h2 className="font-semibold">
            {origin.name}{" "}
            <span className="text-sm text-neutral-500">({origin.line})</span>
          </h2>
        </div>
        <button
          onClick={fetchTimetable}
          className="text-sm text-blue-600 hover:underline"
        >
          {loading ? "불러오는 중…" : "↻ 새로고침"}
        </button>
      </div>

      {timetable?.error && (
        <div className="mb-3 rounded-lg bg-red-50 p-2 text-xs text-red-900">
          {timetable.error}
        </div>
      )}
      {timetable && !timetable.error && timetable.entries.length === 0 && (
        <div className="mb-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-800">
          이 노선의 정규 시간표 데이터가 없습니다. 출처(서울 OpenAPI) 측 미제공
          또는 일시 장애 가능.
        </div>
      )}
      {noCommonLine && (
        <div className="mb-2 rounded-lg bg-amber-50 p-2 text-xs text-amber-900">
          출발/도착 노선이 달라 방향 자동 필터가 적용되지 않습니다.
        </div>
      )}

      <div className="mb-2 text-xs text-neutral-400">
        {thresholdLabel}
        {" · "}
        {exactTerminal && directionTarget
          ? `${directionTarget.name} 행만 표시`
          : directionTarget
            ? `${directionTarget.name} 방향만 표시`
            : "전체 방향"}
      </div>

      {boardingHintLabel && (
        <div className="mb-2 rounded-md bg-gradient-to-r from-amber-50 to-orange-50 p-2 text-sm text-amber-900 ring-1 ring-amber-200">
          {boardingHintLabel}
        </div>
      )}

      {items.length === 0 ? (
        <div className="py-6 text-center text-sm text-neutral-500">
          표시할 열차가 없습니다.
        </div>
      ) : (
        (() => {
          const highlightIdx =
            highlightFromMinutes != null
              ? items.findIndex(
                  (it) =>
                    (it.at.getTime() - now.getTime()) / 1000 >=
                    highlightFromMinutes * 60,
                )
              : -1;

          return (
            <ul className="divide-y divide-neutral-100">
              {items.map((it, i) => {
                const etaSec = Math.max(
                  0,
                  Math.round((it.at.getTime() - now.getTime()) / 1000),
                );
                const highlight = i === highlightIdx;
                return (
                  <li
                    key={`${it.trainNo ?? ""}-${i}`}
                    className={
                      "flex items-center justify-between py-3 transition " +
                      (highlight
                        ? "-mx-2 my-1 rounded-xl bg-gradient-to-r from-emerald-50 via-sky-50 to-violet-50 px-3 ring-2 ring-emerald-400/70 shadow-md animate-pulse-soft"
                        : "")
                    }
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 font-medium">
                        {it.destination}행
                        {it.express && (
                          <span className="rounded bg-orange-100 px-1 text-[10px] font-bold text-orange-700">
                            급행
                          </span>
                        )}
                        {highlight && (
                          <span className="rounded-full bg-gradient-to-r from-emerald-500 to-sky-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-sm">
                            ✨ 추천
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="ml-3 text-right">
                      <div
                        className={
                          "font-mono text-lg leading-none " +
                          (highlight
                            ? "bg-gradient-to-r from-emerald-600 to-sky-600 bg-clip-text font-bold text-transparent"
                            : "")
                        }
                      >
                        출발 {Math.round(etaSec / 60)}분 전
                      </div>
                      <div className="mt-1 font-mono text-xs text-neutral-500">
                        {it.at.toLocaleTimeString("ko-KR", {
                          hour: "2-digit",
                          minute: "2-digit",
                          hour12: false,
                        })}
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          );
        })()
      )}
    </section>
  );
}
