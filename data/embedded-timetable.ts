/**
 * 임베드 정규 시간표 (서울 OpenAPI 시간표 endpoint 장애 시 폴백).
 *
 * 데이터 입력 형식:
 *   - 노선별로 양 종점에서 출발하는 시간표
 *   - 첫차/막차 + 시간대별 배차 간격
 *   - 평일 기준 (토/일은 추후 보강)
 *
 * 중간역 시각은 (종점 출발 + 종점→해당역 소요시간) 로 자동 추정.
 *
 * ⚠️ 데이터 정확도는 위키/공식 자료 참고한 근사치 — ±2~3분 오차 가능.
 */

import {
  lineStations,
  SECONDS_PER_HOP,
  type Station,
} from "./stations";

export type IntervalSpec = {
  from: string; // "07:00"
  to: string; // "09:00"
  minutes: number;
};

export type ScheduleConfig = {
  firstTrain: string; // "05:30"
  lastTrain: string; // "23:55"
  intervals: IntervalSpec[];
};

export type LineSchedule = {
  /** 노선명 (data/stations.ts의 line 표기와 일치) */
  line: string;
  /** 종점 출발지의 apiName (예: "대화") */
  fromTerminal: string;
  /** 도착 종점의 apiName (= 종착역, "오금") */
  toTerminal: string;
  weekday: ScheduleConfig;
};

// ─────────────────────────────────────────────────────────
// 시간 유틸
// ─────────────────────────────────────────────────────────

function parseTimeToSec(hhmm: string): number {
  const [h, m, s = 0] = hhmm.split(":").map(Number);
  return h * 3600 + m * 60 + (s || 0);
}

function formatSecToHHMMSS(sec: number): string {
  const total = ((sec % 86400) + 86400) % 86400;
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function findIntervalAt(timeSec: number, intervals: IntervalSpec[]): number {
  for (const iv of intervals) {
    const f = parseTimeToSec(iv.from);
    const t = parseTimeToSec(iv.to);
    if (timeSec >= f && timeSec < t) return iv.minutes;
  }
  // 매칭 안 되면 기본 10분
  return 10;
}

/** 종점에서 출발하는 모든 시각(HH:MM:SS) 생성 */
export function generateDepartures(config: ScheduleConfig): string[] {
  const first = parseTimeToSec(config.firstTrain);
  const last = parseTimeToSec(config.lastTrain);
  const out: string[] = [];
  let cur = first;
  let safety = 0;
  while (cur <= last && safety < 1000) {
    out.push(formatSecToHHMMSS(cur));
    const minutes = findIntervalAt(cur, config.intervals);
    cur += minutes * 60;
    safety++;
  }
  return out;
}

// ─────────────────────────────────────────────────────────
// 노선별 시간표 데이터 (배차 간격 기반)
// 출처: 위키피디아 + 서울교통공사·코레일 공식 시간표 (근사치)
// ─────────────────────────────────────────────────────────

const CORE_SCHEDULES: LineSchedule[] = [
  // 3호선 — 대화 ↔ 오금
  {
    line: "3호선",
    fromTerminal: "대화",
    toTerminal: "오금",
    weekday: {
      firstTrain: "05:30",
      lastTrain: "23:50",
      intervals: [
        { from: "05:30", to: "07:00", minutes: 8 },
        { from: "07:00", to: "09:30", minutes: 5 },
        { from: "09:30", to: "17:30", minutes: 7 },
        { from: "17:30", to: "20:00", minutes: 5 },
        { from: "20:00", to: "22:00", minutes: 8 },
        { from: "22:00", to: "24:00", minutes: 10 },
      ],
    },
  },
  {
    line: "3호선",
    fromTerminal: "오금",
    toTerminal: "대화",
    weekday: {
      firstTrain: "05:30",
      lastTrain: "23:50",
      intervals: [
        { from: "05:30", to: "07:00", minutes: 8 },
        { from: "07:00", to: "09:30", minutes: 5 },
        { from: "09:30", to: "17:30", minutes: 7 },
        { from: "17:30", to: "20:00", minutes: 5 },
        { from: "20:00", to: "22:00", minutes: 8 },
        { from: "22:00", to: "24:00", minutes: 10 },
      ],
    },
  },

  // 6호선 — 응암순환(상선) / 봉화산 ↔ 응암
  {
    line: "6호선",
    fromTerminal: "응암",
    toTerminal: "봉화산",
    weekday: {
      firstTrain: "05:30",
      lastTrain: "23:55",
      intervals: [
        { from: "05:30", to: "07:00", minutes: 8 },
        { from: "07:00", to: "09:30", minutes: 6 },
        { from: "09:30", to: "17:30", minutes: 8 },
        { from: "17:30", to: "20:00", minutes: 6 },
        { from: "20:00", to: "22:00", minutes: 9 },
        { from: "22:00", to: "24:00", minutes: 11 },
      ],
    },
  },
  {
    line: "6호선",
    fromTerminal: "봉화산",
    toTerminal: "응암",
    weekday: {
      firstTrain: "05:30",
      lastTrain: "23:55",
      intervals: [
        { from: "05:30", to: "07:00", minutes: 8 },
        { from: "07:00", to: "09:30", minutes: 6 },
        { from: "09:30", to: "17:30", minutes: 8 },
        { from: "17:30", to: "20:00", minutes: 6 },
        { from: "20:00", to: "22:00", minutes: 9 },
        { from: "22:00", to: "24:00", minutes: 11 },
      ],
    },
  },

  // 2호선 본선 (시청 ↔ 시청, 순환선) — 시계/반시계 단순화로 한 방향씩
  {
    line: "2호선",
    fromTerminal: "시청",
    toTerminal: "충정로",
    weekday: {
      firstTrain: "05:30",
      lastTrain: "23:55",
      intervals: [
        { from: "05:30", to: "07:00", minutes: 6 },
        { from: "07:00", to: "09:30", minutes: 3 },
        { from: "09:30", to: "17:30", minutes: 5 },
        { from: "17:30", to: "20:00", minutes: 3 },
        { from: "20:00", to: "22:00", minutes: 6 },
        { from: "22:00", to: "24:00", minutes: 7 },
      ],
    },
  },
  {
    line: "2호선",
    fromTerminal: "충정로",
    toTerminal: "시청",
    weekday: {
      firstTrain: "05:30",
      lastTrain: "23:55",
      intervals: [
        { from: "05:30", to: "07:00", minutes: 6 },
        { from: "07:00", to: "09:30", minutes: 3 },
        { from: "09:30", to: "17:30", minutes: 5 },
        { from: "17:30", to: "20:00", minutes: 3 },
        { from: "20:00", to: "22:00", minutes: 6 },
        { from: "22:00", to: "24:00", minutes: 7 },
      ],
    },
  },

  // 경의중앙선 — 문산 ↔ 용문 (양 종점)
  {
    line: "경의중앙선",
    fromTerminal: "문산",
    toTerminal: "용문",
    weekday: {
      firstTrain: "05:00",
      lastTrain: "23:30",
      intervals: [
        { from: "05:00", to: "07:00", minutes: 15 },
        { from: "07:00", to: "09:30", minutes: 9 },
        { from: "09:30", to: "17:00", minutes: 18 },
        { from: "17:00", to: "20:00", minutes: 9 },
        { from: "20:00", to: "22:00", minutes: 15 },
        { from: "22:00", to: "24:00", minutes: 20 },
      ],
    },
  },
  {
    line: "경의중앙선",
    fromTerminal: "용문",
    toTerminal: "문산",
    weekday: {
      firstTrain: "05:00",
      lastTrain: "23:30",
      intervals: [
        { from: "05:00", to: "07:00", minutes: 15 },
        { from: "07:00", to: "09:30", minutes: 9 },
        { from: "09:30", to: "17:00", minutes: 18 },
        { from: "17:00", to: "20:00", minutes: 9 },
        { from: "20:00", to: "22:00", minutes: 15 },
        { from: "22:00", to: "24:00", minutes: 20 },
      ],
    },
  },

  // 1호선 (소요산 ↔ 인천) — 단순화 (지선 미포함, 본선 위주)
  {
    line: "1호선",
    fromTerminal: "소요산",
    toTerminal: "인천",
    weekday: {
      firstTrain: "05:00",
      lastTrain: "23:30",
      intervals: [
        { from: "05:00", to: "07:00", minutes: 10 },
        { from: "07:00", to: "09:30", minutes: 5 },
        { from: "09:30", to: "17:00", minutes: 8 },
        { from: "17:00", to: "20:00", minutes: 5 },
        { from: "20:00", to: "22:00", minutes: 9 },
        { from: "22:00", to: "24:00", minutes: 12 },
      ],
    },
  },
  {
    line: "1호선",
    fromTerminal: "인천",
    toTerminal: "소요산",
    weekday: {
      firstTrain: "05:00",
      lastTrain: "23:30",
      intervals: [
        { from: "05:00", to: "07:00", minutes: 10 },
        { from: "07:00", to: "09:30", minutes: 5 },
        { from: "09:30", to: "17:00", minutes: 8 },
        { from: "17:00", to: "20:00", minutes: 5 },
        { from: "20:00", to: "22:00", minutes: 9 },
        { from: "22:00", to: "24:00", minutes: 12 },
      ],
    },
  },

  // 4호선 (당고개 ↔ 오이도)
  {
    line: "4호선",
    fromTerminal: "당고개",
    toTerminal: "오이도",
    weekday: {
      firstTrain: "05:30",
      lastTrain: "23:50",
      intervals: [
        { from: "05:30", to: "07:00", minutes: 10 },
        { from: "07:00", to: "09:30", minutes: 5 },
        { from: "09:30", to: "17:30", minutes: 7 },
        { from: "17:30", to: "20:00", minutes: 5 },
        { from: "20:00", to: "22:00", minutes: 8 },
        { from: "22:00", to: "24:00", minutes: 10 },
      ],
    },
  },
  {
    line: "4호선",
    fromTerminal: "오이도",
    toTerminal: "당고개",
    weekday: {
      firstTrain: "05:30",
      lastTrain: "23:50",
      intervals: [
        { from: "05:30", to: "07:00", minutes: 10 },
        { from: "07:00", to: "09:30", minutes: 5 },
        { from: "09:30", to: "17:30", minutes: 7 },
        { from: "17:30", to: "20:00", minutes: 5 },
        { from: "20:00", to: "22:00", minutes: 8 },
        { from: "22:00", to: "24:00", minutes: 10 },
      ],
    },
  },

  // 5호선 (방화 ↔ 하남검단산)
  {
    line: "5호선",
    fromTerminal: "방화",
    toTerminal: "하남검단산",
    weekday: {
      firstTrain: "05:30",
      lastTrain: "23:50",
      intervals: [
        { from: "05:30", to: "07:00", minutes: 8 },
        { from: "07:00", to: "09:30", minutes: 5 },
        { from: "09:30", to: "17:30", minutes: 6 },
        { from: "17:30", to: "20:00", minutes: 5 },
        { from: "20:00", to: "22:00", minutes: 7 },
        { from: "22:00", to: "24:00", minutes: 9 },
      ],
    },
  },
  {
    line: "5호선",
    fromTerminal: "하남검단산",
    toTerminal: "방화",
    weekday: {
      firstTrain: "05:30",
      lastTrain: "23:50",
      intervals: [
        { from: "05:30", to: "07:00", minutes: 8 },
        { from: "07:00", to: "09:30", minutes: 5 },
        { from: "09:30", to: "17:30", minutes: 6 },
        { from: "17:30", to: "20:00", minutes: 5 },
        { from: "20:00", to: "22:00", minutes: 7 },
        { from: "22:00", to: "24:00", minutes: 9 },
      ],
    },
  },

  // 7호선 (장암 ↔ 석남)
  {
    line: "7호선",
    fromTerminal: "장암",
    toTerminal: "석남",
    weekday: {
      firstTrain: "05:30",
      lastTrain: "23:50",
      intervals: [
        { from: "05:30", to: "07:00", minutes: 8 },
        { from: "07:00", to: "09:30", minutes: 5 },
        { from: "09:30", to: "17:30", minutes: 6 },
        { from: "17:30", to: "20:00", minutes: 5 },
        { from: "20:00", to: "22:00", minutes: 7 },
        { from: "22:00", to: "24:00", minutes: 10 },
      ],
    },
  },
  {
    line: "7호선",
    fromTerminal: "석남",
    toTerminal: "장암",
    weekday: {
      firstTrain: "05:30",
      lastTrain: "23:50",
      intervals: [
        { from: "05:30", to: "07:00", minutes: 8 },
        { from: "07:00", to: "09:30", minutes: 5 },
        { from: "09:30", to: "17:30", minutes: 6 },
        { from: "17:30", to: "20:00", minutes: 5 },
        { from: "20:00", to: "22:00", minutes: 7 },
        { from: "22:00", to: "24:00", minutes: 10 },
      ],
    },
  },

  // 8호선 (별내 ↔ 모란)
  {
    line: "8호선",
    fromTerminal: "별내",
    toTerminal: "모란",
    weekday: {
      firstTrain: "05:30",
      lastTrain: "23:30",
      intervals: [
        { from: "05:30", to: "07:00", minutes: 8 },
        { from: "07:00", to: "09:30", minutes: 6 },
        { from: "09:30", to: "17:30", minutes: 8 },
        { from: "17:30", to: "20:00", minutes: 6 },
        { from: "20:00", to: "22:00", minutes: 9 },
        { from: "22:00", to: "24:00", minutes: 10 },
      ],
    },
  },
  {
    line: "8호선",
    fromTerminal: "모란",
    toTerminal: "별내",
    weekday: {
      firstTrain: "05:30",
      lastTrain: "23:30",
      intervals: [
        { from: "05:30", to: "07:00", minutes: 8 },
        { from: "07:00", to: "09:30", minutes: 6 },
        { from: "09:30", to: "17:30", minutes: 8 },
        { from: "17:30", to: "20:00", minutes: 6 },
        { from: "20:00", to: "22:00", minutes: 9 },
        { from: "22:00", to: "24:00", minutes: 10 },
      ],
    },
  },

  // 9호선 (개화 ↔ 중앙보훈병원)
  {
    line: "9호선",
    fromTerminal: "개화",
    toTerminal: "중앙보훈병원",
    weekday: {
      firstTrain: "05:30",
      lastTrain: "23:30",
      intervals: [
        { from: "05:30", to: "07:00", minutes: 8 },
        { from: "07:00", to: "09:30", minutes: 5 },
        { from: "09:30", to: "17:30", minutes: 7 },
        { from: "17:30", to: "20:00", minutes: 5 },
        { from: "20:00", to: "22:00", minutes: 8 },
        { from: "22:00", to: "24:00", minutes: 10 },
      ],
    },
  },
  {
    line: "9호선",
    fromTerminal: "중앙보훈병원",
    toTerminal: "개화",
    weekday: {
      firstTrain: "05:30",
      lastTrain: "23:30",
      intervals: [
        { from: "05:30", to: "07:00", minutes: 8 },
        { from: "07:00", to: "09:30", minutes: 5 },
        { from: "09:30", to: "17:30", minutes: 7 },
        { from: "17:30", to: "20:00", minutes: 5 },
        { from: "20:00", to: "22:00", minutes: 8 },
        { from: "22:00", to: "24:00", minutes: 10 },
      ],
    },
  },

  // 공항철도 (서울역 ↔ 인천공항2터미널)
  {
    line: "공항철도",
    fromTerminal: "서울역",
    toTerminal: "인천공항2터미널",
    weekday: {
      firstTrain: "05:20",
      lastTrain: "23:40",
      intervals: [
        { from: "05:20", to: "07:00", minutes: 10 },
        { from: "07:00", to: "09:30", minutes: 7 },
        { from: "09:30", to: "17:30", minutes: 10 },
        { from: "17:30", to: "20:00", minutes: 7 },
        { from: "20:00", to: "22:00", minutes: 10 },
        { from: "22:00", to: "24:00", minutes: 13 },
      ],
    },
  },
  {
    line: "공항철도",
    fromTerminal: "인천공항2터미널",
    toTerminal: "서울역",
    weekday: {
      firstTrain: "05:20",
      lastTrain: "23:40",
      intervals: [
        { from: "05:20", to: "07:00", minutes: 10 },
        { from: "07:00", to: "09:30", minutes: 7 },
        { from: "09:30", to: "17:30", minutes: 10 },
        { from: "17:30", to: "20:00", minutes: 7 },
        { from: "20:00", to: "22:00", minutes: 10 },
        { from: "22:00", to: "24:00", minutes: 13 },
      ],
    },
  },
];

// ─────────────────────────────────────────────────────────
// 시각 가공 + 외부 API용
// ─────────────────────────────────────────────────────────

function addSeconds(hhmmss: string, sec: number): string {
  const [h, m, s] = hhmmss.split(":").map(Number);
  return formatSecToHHMMSS(h * 3600 + m * 60 + s + sec);
}

/**
 * 특정 역에서 특정 종점 방향의 출발 시각들을 추정.
 * - originStation 노선상에 fromTerminal/toTerminal 모두 있을 때만 동작
 * - 시각 = 종점 출발 시각 + (종점→originStation 정거장 수 × 2분)
 */
function stationDepartures(
  schedule: LineSchedule,
  originStation: Station,
): { departures: string[]; toTerminal: string } | null {
  if (schedule.line !== originStation.line) return null;
  const stations = lineStations(schedule.line);
  const fromIdx = stations.findIndex((s) => s.apiName === schedule.fromTerminal);
  const toIdx = stations.findIndex((s) => s.apiName === schedule.toTerminal);
  const oi = stations.findIndex((s) => s.apiName === originStation.apiName);
  if (fromIdx < 0 || toIdx < 0 || oi < 0) return null;

  // 진행 방향이 fromTerminal→toTerminal 인지 확인
  // origin이 from..to 구간 사이여야 의미 있음
  const goingForward = toIdx > fromIdx;
  if (goingForward) {
    if (oi < fromIdx || oi > toIdx) return null;
  } else {
    if (oi > fromIdx || oi < toIdx) return null;
  }

  const gap = Math.abs(oi - fromIdx);
  const offsetSec = gap * SECONDS_PER_HOP;

  const terminalDepartures = generateDepartures(schedule.weekday);
  const departures = terminalDepartures.map((t) => addSeconds(t, offsetSec));
  return { departures, toTerminal: schedule.toTerminal };
}

export type EmbeddedEntry = {
  trainNo: string;
  arriveTime: string;
  leftTime: string;
  destination: string;
  origin: string;
  express: boolean;
};

/**
 * 임베드 시간표에서 origin 역의 INOUT 방향 시간표 생성.
 * - inout: 1 (상행/backward = 인덱스 작은 쪽), 2 (하행/forward = 인덱스 큰 쪽)
 * - 우리 데이터 배열은 "상행 종점부터 시작" 규칙이므로:
 *     inout=1 → backward → toTerminal 인덱스 작음 (= fromTerminal 인덱스 큼)
 *     inout=2 → forward  → toTerminal 인덱스 큼  (= fromTerminal 인덱스 작음)
 */
export function generateEmbeddedTimetable(
  origin: Station,
  inout: "1" | "2",
): EmbeddedEntry[] {
  const stations = lineStations(origin.line);
  if (stations.length === 0) return [];
  const oi = stations.findIndex((s) => s.apiName === origin.apiName);
  if (oi < 0) return [];

  // 종점 이름 매칭 대신, 노선 인덱스 기반으로 방향 + origin 포함 여부 판정
  // (예: 6호선 stations 마지막은 "신내"인데 schedule toTerminal은 "봉화산" — 정확 일치 X)
  const matching = CORE_SCHEDULES.filter((s) => {
    if (s.line !== origin.line) return false;
    const fromIdx = stations.findIndex((st) => st.apiName === s.fromTerminal);
    const toIdx = stations.findIndex((st) => st.apiName === s.toTerminal);
    if (fromIdx < 0 || toIdx < 0) return false;
    const goingForward = toIdx > fromIdx;
    // inout=1 (backward, 인덱스 감소) — schedule은 인덱스 감소 방향이어야 함
    // inout=2 (forward, 인덱스 증가) — schedule은 인덱스 증가 방향이어야 함
    if (inout === "1" && goingForward) return false;
    if (inout === "2" && !goingForward) return false;
    // origin이 from..to 구간 안 (양 끝 포함)
    if (goingForward) return oi >= fromIdx && oi <= toIdx;
    return oi <= fromIdx && oi >= toIdx;
  });

  const out: EmbeddedEntry[] = [];
  let trainNo = 1;
  for (const sched of matching) {
    const result = stationDepartures(sched, origin);
    if (!result) continue;
    for (const t of result.departures) {
      out.push({
        trainNo: `E${trainNo++}`,
        arriveTime: t,
        leftTime: t,
        destination: result.toTerminal,
        origin: sched.fromTerminal,
        express: false,
      });
    }
  }

  // 시각순 정렬
  out.sort((a, b) => a.leftTime.localeCompare(b.leftTime));
  return out;
}

export function hasEmbeddedSchedule(line: string): boolean {
  return CORE_SCHEDULES.some((s) => s.line === line);
}
