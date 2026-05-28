import { NextRequest, NextResponse } from "next/server";

/**
 * 서울 열린데이터광장 - 지하철역명 검색 프록시
 *  SearchInfoBySubwayNameService
 *
 * 역명 부분 일치 검색 → 노선별 결과 반환
 * 응답을 우리 Station 타입과 호환되게 정규화
 */

// 검색 결과는 자주 변하지 않으므로 1일 캐시 (CDN/엣지 캐시도 활용)
export const revalidate = 86400;

const STATIC_API_BASE = "http://openapi.seoul.go.kr:8088";

type SubwayNameRow = {
  STATION_CD: string;
  STATION_NM: string;
  LINE_NUM: string; // "08호선", "수인분당선" 등
  FR_CODE: string;
};

export type SearchedStation = {
  /** 표시명: "잠실역" */
  name: string;
  /** 노선명: "8호선", "수인분당선" 등 (정규화됨) */
  line: string;
  /** API 호출용 역명 ("역" 제거): "잠실" */
  apiName: string;
};

/**
 * 서울 API 표기 → 내부 표기
 * "08호선" → "8호선", "경의선" → "경의중앙선", "우이신설경전철" → "우이신설선", ...
 */
function normalizeLineNum(lineNum: string): string {
  const m = lineNum.match(/^0?(\d+)호선$/);
  if (m) return m[1] + "호선";
  if (lineNum === "경의선") return "경의중앙선";
  if (lineNum === "우이신설경전철") return "우이신설선";
  if (lineNum === "김포도시철도") return "김포골드라인";
  return lineNum;
}

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get("q")?.trim();
  if (!q) {
    return NextResponse.json({ stations: [] });
  }

  const key = process.env.SEOUL_OPENAPI_KEY;
  if (!key) {
    return NextResponse.json(
      { stations: [], error: "SEOUL_OPENAPI_KEY 미설정" },
      { status: 500 },
    );
  }

  const url =
    `${STATIC_API_BASE}/${encodeURIComponent(key)}/json/SearchInfoBySubwayNameService` +
    `/1/30/${encodeURIComponent(q)}`;

  try {
    const res = await fetch(url, { next: { revalidate: 86400 } });
    const json = (await res.json()) as {
      SearchInfoBySubwayNameService?: { row?: SubwayNameRow[] };
      RESULT?: { CODE?: string; MESSAGE?: string };
    };
    const rows = json.SearchInfoBySubwayNameService?.row ?? [];
    const stations: SearchedStation[] = rows.map((r) => ({
      name: r.STATION_NM + "역",
      line: normalizeLineNum(r.LINE_NUM),
      apiName: r.STATION_NM,
    }));
    return NextResponse.json({ stations });
  } catch (e) {
    return NextResponse.json(
      { stations: [], error: (e as Error).message },
      { status: 502 },
    );
  }
}
