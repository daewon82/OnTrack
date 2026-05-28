"use client";

import type { Station } from "@/data/stations";

/**
 * 환승 정보 (1회 환승만 지원).
 * - at: 환승 후 노선의 환승역 (예: 3호선 불광)
 * - finalDirection: 종착 방향 (예: 대화). 미지정 시 destination 으로 방향 판정
 * - walkMinutes: 환승역에서 다른 노선 승강장까지 도보 시간
 */
export type Transfer = {
  at: Station | null;
  finalDirection: Station | null;
  walkMinutes: number;
};

export type Favorite = {
  id: string;
  label: string;
  origin: Station | null;
  destination: Station | null;
  /** 출발역까지 도보 시간 (분) */
  walkMinutes: number;
  /** 환승 정보 (선택) */
  transfer?: Transfer | null;
  /** 도착역 출구 번호 (선택) — 출구별 최적 탑승 위치 추천에 사용 */
  destinationExit?: number | null;
};

export type Settings = {
  version: 2;
  favorites: Favorite[];
  activeId: string | null;
};

const KEY = "ontrack:settings:v1"; // v1 키 그대로 사용 (migrate)
const DEFAULT_WALK = 10;

function uid() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

function emptySettings(): Settings {
  return { version: 2, favorites: [], activeId: null };
}

export function autoLabel(fav: Pick<Favorite, "origin" | "destination">) {
  const o = fav.origin?.name?.replace(/역$/, "") ?? "";
  const d = fav.destination?.name?.replace(/역$/, "") ?? "";
  if (o && d) return `${o} → ${d}`;
  if (o) return `${o} 출발`;
  return "새 즐겨찾기";
}

export function newFavorite(): Favorite {
  return {
    id: uid(),
    label: "새 즐겨찾기",
    origin: null,
    destination: null,
    walkMinutes: DEFAULT_WALK,
  };
}

/** v1 형식을 v2 favorites 배열로 변환 */
function migrateV1(raw: unknown): Settings | null {
  if (!raw || typeof raw !== "object") return null;
  const obj = raw as {
    origin?: Station | null;
    destination?: Station | null;
    walkMinutes?: number;
  };
  if (!("origin" in obj || "destination" in obj || "walkMinutes" in obj)) return null;
  const fav: Favorite = {
    id: uid(),
    label: "기본",
    origin: obj.origin ?? null,
    destination: obj.destination ?? null,
    walkMinutes: typeof obj.walkMinutes === "number" ? obj.walkMinutes : DEFAULT_WALK,
  };
  return { version: 2, favorites: [fav], activeId: fav.id };
}

export function loadSettings(): Settings {
  if (typeof window === "undefined") return emptySettings();
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return emptySettings();
    const parsed = JSON.parse(raw) as Settings | unknown;
    if (
      parsed &&
      typeof parsed === "object" &&
      (parsed as Settings).version === 2 &&
      Array.isArray((parsed as Settings).favorites)
    ) {
      return parsed as Settings;
    }
    const migrated = migrateV1(parsed);
    if (migrated) return migrated;
    return emptySettings();
  } catch {
    return emptySettings();
  }
}

export function saveSettings(s: Settings) {
  if (typeof window === "undefined") return;
  localStorage.setItem(KEY, JSON.stringify(s));
}

export function getActive(s: Settings): Favorite | null {
  return s.favorites.find((f) => f.id === s.activeId) ?? null;
}
