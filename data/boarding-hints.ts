/**
 * 최적 탑승 위치 힌트 데이터
 *
 * 각 (노선, 출발역, 방향) 별로:
 * - transferTo: 환승역에 가장 가까운 차량/문 번호
 * - exitTo:     도착 출구에 가장 가까운 차량/문 번호
 *
 * 표기: car = 차량 번호 (앞에서 1), door = 차량 내 문 번호 (보통 1~4)
 * 예: "4-2" = 4번째 칸 2번째 문
 *
 * ⚠️ 초기 데이터는 일반적으로 알려진 정보 + 추정치. 정확도 보장 안 됨.
 *    사용자 답사 + 피드백으로 정밀화 필요.
 */

export type BoardingPosition = {
  car: number;
  door: number;
  note?: string;
};

export type TransferHint = BoardingPosition & {
  /** 환승할 노선 */
  transferLine: string;
  /** 환승역 apiName */
  transferAt: string;
};

export type ExitHint = BoardingPosition & {
  exitNo: number;
};

export type ArrivalHint = BoardingPosition & {
  /** 이 칸/문에 타면 빠르게 접근할 수 있는 도착역 apiName */
  arrivalAt: string;
};

export type StationBoardingHints = {
  /** 노선명 (예: "3호선") */
  line: string;
  /** 역 apiName (예: "삼송") */
  station: string;
  /** 진행 방향: "1"=상행, "2"=하행 */
  direction: "1" | "2";
  /** 환승 추천 (여러 환승역) */
  transfers?: TransferHint[];
  /** 출구 추천 (여러 출구) */
  exits?: ExitHint[];
  /** 도착역 접근 추천 (출구 미지정 시 fallback) */
  arrivals?: ArrivalHint[];
};

// ─────────────────────────────────────────────────────────
// 초기 데이터 — 사용자 출퇴근 경로 위주
// ─────────────────────────────────────────────────────────

export const BOARDING_HINTS: StationBoardingHints[] = [
  // ── 3호선 ─────────────────────────────────────
  {
    line: "3호선",
    station: "삼송",
    direction: "2", // 하행 (오금 방향)
    transfers: [
      { transferLine: "6호선", transferAt: "불광", car: 4, door: 2, note: "환승 통로 가까움" },
      { transferLine: "6호선", transferAt: "연신내", car: 7, door: 3 },
      { transferLine: "2호선", transferAt: "을지로3가", car: 4, door: 3, note: "추정값 (또타지하철 확인 권장)" },
    ],
  },
  {
    line: "3호선",
    station: "불광",
    direction: "1", // 상행 (대화 방향)
    transfers: [
      { transferLine: "6호선", transferAt: "불광", car: 6, door: 2, note: "동일역 환승" },
    ],
    exits: [
      { exitNo: 1, car: 8, door: 1 },
      { exitNo: 2, car: 7, door: 2 },
      { exitNo: 4, car: 2, door: 3 },
    ],
    arrivals: [
      { arrivalAt: "삼송", car: 4, door: 2, note: "추정값 (또타지하철 확인 권장)" },
    ],
  },
  {
    line: "3호선",
    station: "불광",
    direction: "2", // 하행 (오금 방향)
    transfers: [
      { transferLine: "6호선", transferAt: "불광", car: 5, door: 3, note: "동일역 환승" },
    ],
  },
  {
    line: "3호선",
    station: "연신내",
    direction: "1", // 상행
    transfers: [
      { transferLine: "6호선", transferAt: "연신내", car: 6, door: 2 },
    ],
  },
  {
    line: "3호선",
    station: "연신내",
    direction: "2", // 하행
    transfers: [
      { transferLine: "6호선", transferAt: "연신내", car: 5, door: 3 },
    ],
  },

  // ── 6호선 ─────────────────────────────────────
  {
    line: "6호선",
    station: "디지털미디어시티",
    direction: "1", // 상행 (응암 방향)
    transfers: [
      { transferLine: "공항철도", transferAt: "디지털미디어시티", car: 1, door: 1, note: "출발쪽" },
      { transferLine: "경의중앙선", transferAt: "디지털미디어시티", car: 3, door: 2 },
      { transferLine: "3호선", transferAt: "불광", car: 2, door: 2, note: "사용자 확인 — 환승 가장 빠름" },
      { transferLine: "3호선", transferAt: "연신내", car: 5, door: 3 },
    ],
    exits: [
      { exitNo: 2, car: 1, door: 1 },
      { exitNo: 5, car: 4, door: 2 },
      { exitNo: 9, car: 6, door: 3 },
    ],
  },
  {
    line: "6호선",
    station: "디지털미디어시티",
    direction: "2", // 하행 (봉화산 방향)
    transfers: [
      { transferLine: "공항철도", transferAt: "디지털미디어시티", car: 6, door: 4 },
      { transferLine: "경의중앙선", transferAt: "디지털미디어시티", car: 4, door: 3 },
    ],
    exits: [
      { exitNo: 2, car: 6, door: 4 },
      { exitNo: 5, car: 3, door: 3 },
      { exitNo: 9, car: 1, door: 2 },
    ],
  },
  {
    line: "6호선",
    station: "불광",
    direction: "1", // 상행 (응암 방향)
    transfers: [
      { transferLine: "3호선", transferAt: "불광", car: 3, door: 2, note: "동일역 환승" },
    ],
  },
  {
    line: "6호선",
    station: "불광",
    direction: "2", // 하행 (봉화산 방향)
    transfers: [
      { transferLine: "3호선", transferAt: "불광", car: 4, door: 3, note: "동일역 환승" },
    ],
  },
  {
    line: "6호선",
    station: "연신내",
    direction: "1",
    transfers: [
      { transferLine: "3호선", transferAt: "연신내", car: 3, door: 2 },
    ],
  },
  {
    line: "6호선",
    station: "연신내",
    direction: "2",
    transfers: [
      { transferLine: "3호선", transferAt: "연신내", car: 4, door: 3 },
    ],
  },

  // ── 2호선 ─────────────────────────────────────
  {
    line: "2호선",
    station: "홍대입구",
    direction: "1", // 상행 (시청 방향, 외선 내선 단순화)
    transfers: [
      { transferLine: "경의중앙선", transferAt: "홍대입구", car: 3, door: 2 },
      { transferLine: "공항철도", transferAt: "홍대입구", car: 5, door: 3 },
    ],
  },

  // ── 경의중앙선 ─────────────────────────────────
  {
    line: "경의중앙선",
    station: "디지털미디어시티",
    direction: "2", // 용문 방향
    transfers: [
      { transferLine: "6호선", transferAt: "디지털미디어시티", car: 2, door: 1 },
      { transferLine: "공항철도", transferAt: "디지털미디어시티", car: 3, door: 2 },
    ],
  },

  // ── 공항철도 ──────────────────────────────────
  {
    line: "공항철도",
    station: "디지털미디어시티",
    direction: "1", // 서울역 방향
    transfers: [
      { transferLine: "6호선", transferAt: "디지털미디어시티", car: 3, door: 2 },
      { transferLine: "경의중앙선", transferAt: "디지털미디어시티", car: 2, door: 1 },
    ],
  },

  // ── 2호선 환승역에서 도착역 접근 추천 ─────────
  {
    line: "2호선",
    station: "을지로3가",
    direction: "2", // forward: 을지로3가 → 잠실 (idx 2 → 15)
    arrivals: [
      { arrivalAt: "잠실", car: 7, door: 3, note: "추정값 — 잠실 주출구(8/11번) 부근, 또타지하철 확인 권장" },
    ],
  },
];

// ─────────────────────────────────────────────────────────
// 조회 helper
// ─────────────────────────────────────────────────────────

export function findTransferHint(
  line: string,
  station: string,
  direction: "1" | "2",
  transferLine: string,
  transferAt: string,
): TransferHint | null {
  const entry = BOARDING_HINTS.find(
    (h) =>
      h.line === line &&
      h.station === station &&
      h.direction === direction,
  );
  if (!entry?.transfers) return null;
  return (
    entry.transfers.find(
      (t) => t.transferLine === transferLine && t.transferAt === transferAt,
    ) ?? null
  );
}

export function findExitHint(
  line: string,
  station: string,
  direction: "1" | "2",
  exitNo: number,
): ExitHint | null {
  const entry = BOARDING_HINTS.find(
    (h) =>
      h.line === line &&
      h.station === station &&
      h.direction === direction,
  );
  if (!entry?.exits) return null;
  return entry.exits.find((e) => e.exitNo === exitNo) ?? null;
}

export function findArrivalHint(
  line: string,
  station: string,
  direction: "1" | "2",
  arrivalAt: string,
): ArrivalHint | null {
  const entry = BOARDING_HINTS.find(
    (h) =>
      h.line === line &&
      h.station === station &&
      h.direction === direction,
  );
  if (!entry?.arrivals) return null;
  return entry.arrivals.find((a) => a.arrivalAt === arrivalAt) ?? null;
}

export function formatBoardingPosition(p: BoardingPosition): string {
  return `${p.car}-${p.door}번 칸`;
}
