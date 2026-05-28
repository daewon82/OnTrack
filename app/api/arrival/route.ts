import { NextRequest, NextResponse } from "next/server";

/**
 * 서울 열린데이터광장 - 지하철 실시간 도착정보 프록시
 *
 * Endpoint:
 *   http://swopenapi.seoul.go.kr/api/subway/{KEY}/json/realtimeStationArrival/0/20/{STATION_NAME}
 *
 * 환경변수:
 *   SEOUL_OPENAPI_KEY  (없으면 모의 데이터 반환)
 */

export const dynamic = "force-dynamic";

type RawArrival = {
  subwayId: string;          // 1001(1호선) ~ 1009(9호선), 1063(경의중앙), 1065(공항철도) 등
  trainLineNm?: string;      // "오금행 - 지축방면"
  bstatnNm?: string;         // 종착역명
  arvlMsg2?: string;         // "잠시후 도착", "5분 후 (XX역)" 등
  arvlMsg3?: string;         // 현재 위치 역명
  barvlDt?: string;          // 도착 예정 초 (0이면 알 수 없음)
  recptnDt?: string;         // 응답 시각
  updnLine?: string;         // "상행"/"하행"
  arvlCd?: string;           // 0:진입,1:도착,2:출발,3:전역출발,4:전역진입,5:전역도착,99:운행중
};

export type Arrival = {
  line: string;
  destination: string;       // bstatnNm
  direction: string;         // 상행/하행
  message: string;           // 화면 표시용 메시지
  /** 도착까지 남은 초 (없으면 null) */
  etaSec: number | null;
  trainLine: string;         // 행선/방면
  arvlCd: string;
};

const SUBWAY_ID_TO_LINE: Record<string, string> = {
  "1001": "1호선", "1002": "2호선", "1003": "3호선", "1004": "4호선",
  "1005": "5호선", "1006": "6호선", "1007": "7호선", "1008": "8호선",
  "1009": "9호선", "1063": "경의중앙선", "1065": "공항철도",
  "1067": "경춘선", "1075": "수인분당선", "1077": "신분당선",
  "1092": "우이신설선", "1093": "서해선", "1094": "김포골드라인",
};

/**
 * 메시지에서 명시적 분 수 / 정거장 수를 추출.
 * - "5분 후 (역명)" → 300
 * - "[3]번째 전역 (역명)" → 360 (정거장당 2분 추정)
 */
function parseExplicitEtaFromMessage(msg: string): number | null {
  if (!msg) return null;
  const minMatch = msg.match(/(\d+)\s*분/);
  if (minMatch) return Number(minMatch[1]) * 60;
  const stMatch = msg.match(/\[?(\d+)\]?\s*(?:번째)?\s*전역/);
  if (stMatch) return Number(stMatch[1]) * 120;
  return null;
}

/**
 * arvlCd (도착코드) 기반 ETA 추정.
 *  0: 당역 진입, 1: 당역 도착, 2: 당역 출발(이미 떠남)
 *  3: 전역 출발, 4: 전역 진입, 5: 전역 도착
 */
function etaFromArvlCd(code: string): number | null {
  switch (code) {
    case "0": return 20;
    case "1": return 5;
    case "2": return null;
    case "3": return 30;
    case "4": return 90;
    case "5": return 60;
    default: return null;
  }
}

function toArrival(r: RawArrival): Arrival {
  const etaSecRaw = Number(r.barvlDt ?? 0);
  const message = r.arvlMsg2 ?? "";
  const arvlCd = r.arvlCd ?? "";
  // 우선순위: barvlDt > 메시지의 명시적 숫자 > 도착코드
  const etaSec =
    etaSecRaw > 0
      ? etaSecRaw
      : parseExplicitEtaFromMessage(message) ?? etaFromArvlCd(arvlCd);
  return {
    line: SUBWAY_ID_TO_LINE[r.subwayId] ?? r.subwayId,
    destination: r.bstatnNm ?? "",
    direction: r.updnLine ?? "",
    message,
    etaSec,
    trainLine: r.trainLineNm ?? "",
    arvlCd,
  };
}

/** API 키 없을 때 미리보기용 가짜 데이터 */
function mockArrivals(stationName: string, line: string): Arrival[] {
  const now = new Date();
  return [3, 7, 12, 18, 25].map((min, i) => ({
    line,
    destination: line === "3호선" ? "오금" : line === "6호선" ? "봉화산" : "종착",
    direction: i % 2 === 0 ? "상행" : "하행",
    message: `${min}분 후 도착 (모의)`,
    etaSec: min * 60,
    trainLine: `${stationName} 방면`,
    arvlCd: "99",
  }));
}

export async function GET(req: NextRequest) {
  const station = req.nextUrl.searchParams.get("station")?.trim();
  const line = req.nextUrl.searchParams.get("line")?.trim() ?? "";
  if (!station) {
    return NextResponse.json({ error: "station required" }, { status: 400 });
  }

  const key = process.env.SEOUL_OPENAPI_KEY;
  if (!key) {
    return NextResponse.json({
      arrivals: mockArrivals(station, line),
      mock: true,
      note: "SEOUL_OPENAPI_KEY 미설정. .env.local 에 키 추가 시 실데이터로 전환됩니다.",
    });
  }

  const url = `http://swopenapi.seoul.go.kr/api/subway/${encodeURIComponent(
    key,
  )}/json/realtimeStationArrival/0/20/${encodeURIComponent(station)}`;

  try {
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json()) as {
      errorMessage?: { code?: string; message?: string };
      realtimeArrivalList?: RawArrival[];
    };

    if (json.errorMessage && json.errorMessage.code !== "INFO-000") {
      return NextResponse.json(
        {
          error: json.errorMessage.message,
          code: json.errorMessage.code,
          arrivals: [],
        },
        { status: 502 },
      );
    }

    const all = (json.realtimeArrivalList ?? []).map(toArrival);
    const filtered = line ? all.filter((a) => a.line === line) : all;
    return NextResponse.json({ arrivals: filtered, mock: false });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message, arrivals: [] },
      { status: 500 },
    );
  }
}
