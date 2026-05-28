import { NextRequest, NextResponse } from "next/server";
import {
  generateEmbeddedTimetable,
  hasEmbeddedSchedule,
} from "@/data/embedded-timetable";
import { STATIONS } from "@/data/stations";

/**
 * 서울 열린데이터광장 - 정적 지하철 시간표 프록시
 *
 * 두 단계로 호출:
 *   1) SearchInfoBySubwayNameService - 역명으로 STATION_CD 조회 (노선 필터)
 *   2) SearchSTNTimeTableByIDService - STATION_CD + 요일 + 상하행 으로 시간표
 *
 * Query params:
 *   - station: 역명 (예: "디지털미디어시티")
 *   - line:    노선명 (예: "6호선") — 서버에서 "06호선" 형태로 변환
 *   - inout:   1=상행/내선, 2=하행/외선
 *   - day:     1=평일, 2=토, 3=일/공휴일 (생략 시 오늘 날짜로 자동)
 *
 * 환경변수 SEOUL_OPENAPI_KEY 사용 (실시간 키와 호환됨)
 */

export const dynamic = "force-dynamic";

const STATIC_API_BASE = "http://openapi.seoul.go.kr:8088";

type SubwayNameRow = {
  STATION_CD: string;
  STATION_NM: string;
  LINE_NUM: string; // "06호선", "공항철도" 등
  FR_CODE: string;
};

type TimetableRow = {
  STATION_CD: string;
  STATION_NM: string;
  LINE_NUM: string;
  TRAIN_NO: string;
  ARRIVETIME: string; // "HH:MM:SS"
  LEFTTIME: string;
  ORIGINSTATION: string;
  DESTSTATION: string;
  SUBWAYSNAME: string; // 출발역
  SUBWAYENAME: string; // 종착역명 ⭐
  WEEK_TAG: string;
  INOUT_TAG: string;
  EXPRESS_YN?: string;
};

export type TimetableEntry = {
  trainNo: string;
  arriveTime: string;     // "HH:MM:SS"
  leftTime: string;       // "HH:MM:SS"
  destination: string;    // 종착역명 (예: "응암", "대화")
  origin: string;
  express: boolean;
};

/**
 * 내부 표기 → 서울 API 표기
 * "6호선" → "06호선", "경의중앙선" → "경의선", "우이신설선" → "우이신설경전철", ...
 */
function normalizeLineName(line: string): string {
  const m = line.match(/^(\d+)호선$/);
  if (m) return m[1].padStart(2, "0") + "호선";
  if (line === "경의중앙선") return "경의선";
  if (line === "우이신설선") return "우이신설경전철";
  if (line === "김포골드라인") return "김포도시철도";
  // 2호선 지선도 본선과 같은 시간표 — 일단 "02호선"으로
  if (line.startsWith("2호선")) return "02호선";
  // 5호선 지선도 본선과 같은 시간표
  if (line.startsWith("5호선")) return "05호선";
  return line;
}

/** Vercel 서버는 UTC 기준이라 KST(UTC+9)로 시각/요일 보정 */
function kstNow(): Date {
  return new Date(Date.now() + 9 * 3600 * 1000);
}
function kstTimeString(d: Date = kstNow()): string {
  return d.toISOString().slice(11, 19); // "HH:MM:SS"
}
function kstHour(d: Date = kstNow()): number {
  return d.getUTCHours();
}

function todayWeekTag(): "1" | "2" | "3" {
  const d = kstNow().getUTCDay(); // 0=일, 6=토
  if (d === 0) return "3";
  if (d === 6) return "2";
  return "1";
}

export async function GET(req: NextRequest) {
  const station = req.nextUrl.searchParams.get("station")?.trim();
  const lineRaw = req.nextUrl.searchParams.get("line")?.trim();
  const inout = req.nextUrl.searchParams.get("inout")?.trim();
  const dayParam = req.nextUrl.searchParams.get("day")?.trim();

  if (!station || !lineRaw || !inout) {
    return NextResponse.json(
      { error: "station, line, inout required" },
      { status: 400 },
    );
  }
  if (inout !== "1" && inout !== "2") {
    return NextResponse.json({ error: "inout must be 1 or 2" }, { status: 400 });
  }

  const key = process.env.SEOUL_OPENAPI_KEY;
  if (!key) {
    return NextResponse.json(
      { entries: [], note: "SEOUL_OPENAPI_KEY 미설정 — 시간표 조회 불가" },
      { status: 200 },
    );
  }

  const line = normalizeLineName(lineRaw);
  const day = (dayParam === "1" || dayParam === "2" || dayParam === "3"
    ? dayParam
    : todayWeekTag());

  // 1) STATION_CD 조회
  const lookupUrl =
    `${STATIC_API_BASE}/${encodeURIComponent(key)}/json/SearchInfoBySubwayNameService` +
    `/1/10/${encodeURIComponent(station)}`;

  let stationCd: string | null = null;
  try {
    const res = await fetch(lookupUrl, { cache: "no-store" });
    const json = (await res.json()) as {
      SearchInfoBySubwayNameService?: { row?: SubwayNameRow[] };
      RESULT?: { CODE?: string; MESSAGE?: string };
    };
    const rows = json.SearchInfoBySubwayNameService?.row ?? [];
    const match = rows.find((r) => r.LINE_NUM === line);
    stationCd = match?.STATION_CD ?? null;
    if (!stationCd) {
      return NextResponse.json(
        {
          entries: [],
          error: `역 코드를 찾지 못했습니다 (${station} / ${line})`,
          candidates: rows.map((r) => ({ line: r.LINE_NUM, code: r.STATION_CD })),
        },
        { status: 404 },
      );
    }
  } catch (e) {
    return NextResponse.json(
      { entries: [], error: `역 코드 조회 실패: ${(e as Error).message}` },
      { status: 502 },
    );
  }

  // 2) 시간표 조회 — 1번 페이지부터 시작, 마지막 LEFTTIME이 현재 시각보다 이전이면 다음 페이지
  // 짧은 노선 (예: 8호선 ~160건) 도 안전, 긴 노선 (3호선 2600+) 도 필요 시 페이지 추가
  try {
    const nowHHMMSS = kstTimeString();
    const PAGE_SIZE = 1000;
    const MAX_PAGES = 3; // 최대 3,000건 ≈ 하루 전체

    async function fetchPage(startIdx: number) {
      const end = startIdx + PAGE_SIZE - 1;
      const url =
        `${STATIC_API_BASE}/${encodeURIComponent(key!)}/json/SearchSTNTimeTableByIDService` +
        `/${startIdx}/${end}/${encodeURIComponent(stationCd!)}/${day}/${inout}`;
      const res = await fetch(url, { cache: "no-store" });
      const json = (await res.json()) as {
        SearchSTNTimeTableByIDService?: { row?: TimetableRow[] };
      };
      return json.SearchSTNTimeTableByIDService?.row ?? [];
    }

    const rows: TimetableRow[] = [];
    for (let p = 0; p < MAX_PAGES; p++) {
      const pageRows = await fetchPage(p * PAGE_SIZE + 1);
      if (pageRows.length === 0) break;
      rows.push(...pageRows);
      const lastLeft = pageRows[pageRows.length - 1].LEFTTIME;
      // 마지막 시각이 현재 시각 이후면 더 받을 필요 없음
      if (lastLeft >= nowHHMMSS) break;
      if (pageRows.length < PAGE_SIZE) break; // 마지막 페이지
    }
    // API가 같은 train을 여러 번 반환 (LEFTTIME/도착/경유 등) → train_no로 dedup
    const seen = new Set<string>();
    const allEntries: TimetableEntry[] = [];
    for (const r of rows) {
      if (seen.has(r.TRAIN_NO)) continue;
      seen.add(r.TRAIN_NO);
      allEntries.push({
        trainNo: r.TRAIN_NO,
        arriveTime: r.ARRIVETIME,
        leftTime: r.LEFTTIME,
        destination: r.SUBWAYENAME,
        origin: r.SUBWAYSNAME,
        express: r.EXPRESS_YN === "E",
      });
    }
    allEntries.sort((a, b) => a.leftTime.localeCompare(b.leftTime));
    // 현재 시각 이후 다음 30대
    const future = allEntries.filter((e) => e.leftTime >= nowHHMMSS).slice(0, 30);

    // ─── 폴백 ─── 서울 API 응답이 비어있으면 임베드 시간표 사용
    if (future.length === 0 && hasEmbeddedSchedule(lineRaw)) {
      const originStation = STATIONS.find(
        (s) => s.line === lineRaw && s.apiName === station,
      );
      if (originStation) {
        const embedded = generateEmbeddedTimetable(originStation, inout);
        const embFuture = embedded
          .filter((e) => e.leftTime >= nowHHMMSS)
          .slice(0, 30);
        return NextResponse.json({
          entries: embFuture,
          stationCd,
          line,
          day,
          inout,
          source: "embedded",
          note: "서울 OpenAPI 시간표 미응답 → 임베드 시간표 사용 (정확도 ±2~3분)",
        });
      }
    }

    return NextResponse.json({
      entries: future,
      stationCd,
      line,
      day,
      inout,
      source: "seoul-api",
      totalScanned: allEntries.length,
    });
  } catch (e) {
    return NextResponse.json(
      { entries: [], error: `시간표 조회 실패: ${(e as Error).message}` },
      { status: 502 },
    );
  }
}
