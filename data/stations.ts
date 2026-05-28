export type Station = {
  /** 표시명 (예: "삼송역") */
  name: string;
  /** 노선명 (정규화된 표기 — "8호선", "경의중앙선" 등) */
  line: string;
  /** 서울 열린데이터광장 API 호출용 역명 ("역" 제외) */
  apiName: string;
};

/**
 * 수도권 전철 모든 노선의 역 목록 (역 순서 = 상행 종점 → 하행 종점).
 * 노선 명칭은 정규화된 표기 사용 ("8호선", "경의중앙선", "우이신설선" 등).
 * 서울 API와 매핑은 lib 의 normalize* 함수가 담당.
 */
export const STATIONS: Station[] = [
  // ─────────────────────────────────────────────────────────
  // 1호선 (수도권 — 소요산~인천/신창, 광명/서동탄 지선 일부 포함)
  ...[
    "소요산", "동두천", "보산", "동두천중앙", "지행", "덕정", "덕계", "양주",
    "녹양", "가능", "의정부", "회룡", "망월사", "도봉산", "도봉", "방학",
    "창동", "녹천", "월계", "광운대", "석계", "신이문", "외대앞", "회기",
    "청량리", "제기동", "신설동", "동묘앞", "동대문", "종로5가", "종로3가",
    "종각", "시청", "서울역", "남영", "용산", "노량진", "대방", "신길",
    "영등포", "신도림", "구로", "가산디지털단지", "독산", "금천구청", "석수",
    "관악", "안양", "명학", "금정", "군포", "당정", "의왕", "성균관대",
    "화서", "수원", "세류", "병점", "세마", "오산대", "오산", "진위",
    "송탄", "서정리", "지제", "평택", "성환", "직산", "두정", "천안",
    "봉명", "쌍용", "아산", "탕정", "배방", "온양온천", "신창",
  ].map((n) => ({ name: `${n}역`, line: "1호선", apiName: n })),

  // 2호선 본선 (시청~순환)
  ...[
    "시청", "을지로입구", "을지로3가", "을지로4가", "동대문역사문화공원",
    "신당", "상왕십리", "왕십리", "한양대", "뚝섬", "성수", "건대입구",
    "구의", "강변", "잠실나루", "잠실", "잠실새내", "종합운동장",
    "삼성", "선릉", "역삼", "강남", "교대", "서초", "방배", "사당",
    "낙성대", "서울대입구", "봉천", "신림", "신대방", "구로디지털단지",
    "대림", "신도림", "문래", "영등포구청", "당산", "합정", "홍대입구",
    "신촌", "이대", "아현", "충정로",
  ].map((n) => ({ name: `${n}역`, line: "2호선", apiName: n })),

  // 2호선 성수지선
  ...["성수", "용답", "신답", "용두", "신설동"].map((n) => ({
    name: `${n}역`, line: "2호선(성수지선)", apiName: n,
  })),

  // 2호선 신정지선
  ...["신도림", "도림천", "양천구청", "신정네거리", "까치산"].map((n) => ({
    name: `${n}역`, line: "2호선(신정지선)", apiName: n,
  })),

  // 3호선
  ...[
    "대화", "주엽", "정발산", "마두", "백석", "대곡", "화정", "원당",
    "원흥", "삼송", "지축", "구파발", "연신내", "불광", "녹번", "홍제",
    "무악재", "독립문", "경복궁", "안국", "종로3가", "을지로3가", "충무로",
    "동대입구", "약수", "금호", "옥수", "압구정", "신사", "잠원", "고속터미널",
    "교대", "남부터미널", "양재", "매봉", "도곡", "대치", "학여울", "대청",
    "일원", "수서", "가락시장", "경찰병원", "오금",
  ].map((n) => ({ name: `${n}역`, line: "3호선", apiName: n })),

  // 4호선 (당고개~오이도)
  ...[
    "당고개", "상계", "노원", "창동", "쌍문", "수유", "미아", "미아사거리",
    "길음", "성신여대입구", "한성대입구", "혜화", "동대문", "동대문역사문화공원",
    "충무로", "명동", "회현", "서울역", "숙대입구", "삼각지", "신용산",
    "이촌", "동작", "이수", "사당", "남태령", "선바위", "경마공원", "대공원",
    "과천", "정부과천청사", "인덕원", "평촌", "범계", "금정", "산본",
    "수리산", "대야미", "반월", "상록수", "한대앞", "중앙", "고잔", "초지",
    "안산", "신길온천", "정왕", "오이도",
  ].map((n) => ({ name: `${n}역`, line: "4호선", apiName: n })),

  // 5호선 본선 (방화~하남검단산)
  ...[
    "방화", "개화산", "김포공항", "송정", "마곡", "발산", "우장산", "화곡",
    "까치산", "신정", "목동", "오목교", "양평", "영등포구청", "영등포시장",
    "신길", "여의도", "여의나루", "마포", "공덕", "애오개", "충정로",
    "서대문", "광화문", "종로3가", "을지로4가", "동대문역사문화공원", "청구",
    "신금호", "행당", "왕십리", "마장", "답십리", "장한평", "군자",
    "아차산", "광나루", "천호", "강동", "길동", "굽은다리", "명일", "고덕",
    "상일동", "강일", "미사", "하남풍산", "하남시청", "하남검단산",
  ].map((n) => ({ name: `${n}역`, line: "5호선", apiName: n })),

  // 5호선 마천지선 (강동에서 분기 → 마천)
  ...["강동", "둔촌동", "올림픽공원", "방이", "오금", "개롱", "거여", "마천"].map(
    (n) => ({ name: `${n}역`, line: "5호선(마천지선)", apiName: n }),
  ),

  // 6호선 (응암~봉화산~신내)
  ...[
    "응암", "역촌", "불광", "독바위", "연신내", "구산", "새절", "증산",
    "디지털미디어시티", "월드컵경기장", "마포구청", "망원", "합정", "상수",
    "광흥창", "대흥", "공덕", "효창공원앞", "삼각지", "녹사평", "이태원",
    "한강진", "버티고개", "약수", "청구", "신당", "동묘앞", "창신",
    "보문", "안암", "고려대", "월곡", "상월곡", "돌곶이", "석계", "태릉입구",
    "화랑대", "봉화산", "신내",
  ].map((n) => ({ name: `${n}역`, line: "6호선", apiName: n })),

  // 7호선 (장암~석남)
  ...[
    "장암", "도봉산", "수락산", "마들", "노원", "중계", "하계", "공릉",
    "태릉입구", "먹골", "중화", "상봉", "면목", "사가정", "용마산", "중곡",
    "군자", "어린이대공원", "건대입구", "뚝섬유원지", "청담", "강남구청",
    "학동", "논현", "반포", "고속터미널", "내방", "이수", "남성", "숭실대입구",
    "상도", "장승배기", "신대방삼거리", "보라매", "신풍", "대림", "남구로",
    "가산디지털단지", "철산", "광명사거리", "천왕", "온수", "까치울",
    "부천종합운동장", "춘의", "신중동", "부천시청", "상동", "삼산체육관",
    "굴포천", "부평구청", "산곡", "석남",
  ].map((n) => ({ name: `${n}역`, line: "7호선", apiName: n })),

  // 8호선 (별내~모란)
  ...[
    "별내", "다산", "동구릉", "구리", "장자호수공원", "암사역사공원", "암사",
    "천호", "강동구청", "몽촌토성", "잠실", "석촌", "송파", "가락시장",
    "문정", "장지", "복정", "산성", "남한산성입구", "단대오거리", "신흥",
    "수진", "모란",
  ].map((n) => ({ name: `${n}역`, line: "8호선", apiName: n })),

  // 9호선 (개화~중앙보훈병원)
  ...[
    "개화", "김포공항", "공항시장", "신방화", "마곡나루", "양천향교",
    "가양", "증미", "등촌", "염창", "신목동", "선유도", "당산", "국회의사당",
    "여의도", "샛강", "노량진", "노들", "흑석", "동작", "구반포", "신반포",
    "고속터미널", "사평", "신논현", "언주", "선정릉", "삼성중앙", "봉은사",
    "종합운동장", "삼전", "석촌고분", "석촌", "송파나루", "한성백제",
    "올림픽공원", "둔촌오륜", "중앙보훈병원",
  ].map((n) => ({ name: `${n}역`, line: "9호선", apiName: n })),

  // 경의중앙선 (문산~지평)
  ...[
    "문산", "파주", "월롱", "금촌", "금릉", "운정", "야당", "탄현", "일산",
    "풍산", "백마", "곡산", "대곡", "능곡", "행신", "강매", "화전", "수색",
    "디지털미디어시티", "가좌", "신촌(경의)", "홍대입구", "서강대", "공덕",
    "효창공원앞", "용산", "이촌", "서빙고", "한남", "옥수", "응봉", "왕십리",
    "청량리", "회기", "중랑", "상봉", "망우", "양원", "구리", "도농", "양정",
    "덕소", "도심", "팔당", "운길산", "양수", "신원", "국수", "아신",
    "오빈", "양평", "원덕", "용문", "지평",
  ].map((n) => ({ name: `${n}역`, line: "경의중앙선", apiName: n })),

  // 경춘선 (청량리~춘천)
  ...[
    "청량리", "회기", "중랑", "상봉", "망우", "갈매", "별내", "퇴계원", "사릉",
    "금곡", "평내호평", "천마산", "마석", "대성리", "청평", "상천", "가평",
    "굴봉산", "백양리", "강촌", "김유정", "남춘천", "춘천",
  ].map((n) => ({ name: `${n}역`, line: "경춘선", apiName: n })),

  // 공항철도 (서울역~인천공항2터미널)
  ...[
    "서울역", "공덕", "홍대입구", "디지털미디어시티", "마곡나루", "김포공항",
    "계양", "검암", "청라국제도시", "운서", "공항화물청사", "인천공항1터미널",
    "인천공항2터미널",
  ].map((n) => ({ name: `${n}역`, line: "공항철도", apiName: n })),

  // 수인분당선 (청량리~인천)
  ...[
    "청량리", "왕십리", "서울숲", "압구정로데오", "강남구청", "선정릉", "선릉",
    "한티", "도곡", "구룡", "개포동", "대모산입구", "수서", "복정", "가천대",
    "태평", "모란", "야탑", "이매", "서현", "수내", "정자", "미금", "오리",
    "죽전", "보정", "구성", "신갈", "기흥", "상갈", "청명", "영통", "망포",
    "매탄권선", "수원시청", "매교", "수원", "고색", "오목천", "어천", "야목",
    "사리", "한대앞", "중앙", "고잔", "초지", "안산", "신길온천", "정왕",
    "오이도", "달월", "월곶", "소래포구", "인천논현", "호구포",
    "남동인더스파크", "원인재", "연수", "송도", "인하대", "숭의", "신포",
    "인천",
  ].map((n) => ({ name: `${n}역`, line: "수인분당선", apiName: n })),

  // 신분당선 (강남~광교)
  ...[
    "강남", "양재", "양재시민의숲", "청계산입구", "판교", "정자", "미금", "동천",
    "수지구청", "성복", "상현", "광교중앙", "광교",
  ].map((n) => ({ name: `${n}역`, line: "신분당선", apiName: n })),

  // 우이신설선 (북한산우이~신설동)
  ...[
    "북한산우이", "솔밭공원", "4.19민주묘지", "가오리", "화계", "삼양", "삼양사거리",
    "솔샘", "북한산보국문", "정릉", "성신여대입구", "보문", "신설동",
  ].map((n) => ({ name: `${n}역`, line: "우이신설선", apiName: n })),

  // 김포골드라인 (김포공항~양촌)
  ...[
    "김포공항", "고촌", "풍무", "사우", "김포시청", "마산", "장기", "운양",
    "걸포북변", "양촌",
  ].map((n) => ({ name: `${n}역`, line: "김포골드라인", apiName: n })),

  // 서해선 (소사~원시)
  ...[
    "소사", "소새울", "시흥대야", "신천", "신현", "시흥시청", "시흥능곡",
    "달미", "선부", "초지", "시흥배곧", "시흥월곶", "원시",
  ].map((n) => ({ name: `${n}역`, line: "서해선", apiName: n })),

  // GTX-A (운정중앙~동탄)
  ...[
    "운정중앙", "킨텍스", "대곡", "연신내", "서울역", "수서", "성남", "구성", "동탄",
  ].map((n) => ({ name: `${n}역`, line: "GTX-A", apiName: n })),

  // 신림선 (샛강~관악산)
  ...[
    "샛강", "대방", "서울지방병무청", "보라매", "보라매공원", "보라매병원",
    "당곡", "신림", "서원", "서울대벤처타운", "관악산",
  ].map((n) => ({ name: `${n}역`, line: "신림선", apiName: n })),

  // 인천1호선 (계양~국제업무지구)
  ...[
    "계양", "귤현", "박촌", "임학", "계산", "경인교대입구", "작전", "갈산",
    "부평구청", "부평시장", "부평", "동수", "부평삼거리", "간석오거리",
    "인천시청", "예술회관", "인천터미널", "문학경기장", "선학", "신연수",
    "원인재", "동춘", "동막", "캠퍼스타운", "테크노파크", "지식정보단지",
    "인천대입구", "센트럴파크", "국제업무지구",
  ].map((n) => ({ name: `${n}역`, line: "인천1호선", apiName: n })),

  // 인천2호선 (검단오류~운연)
  ...[
    "검단오류", "왕길", "검단사거리", "마전", "완정", "독정", "검암", "검바위",
    "아시아드경기장", "서구청", "가정", "가정중앙시장", "석남", "서부여성회관",
    "인천가좌", "가재울", "주안국가산단", "주안", "시민공원", "석바위시장",
    "인천시청", "석천사거리", "모래내시장", "만수", "남동구청", "인천대공원",
    "운연",
  ].map((n) => ({ name: `${n}역`, line: "인천2호선", apiName: n })),
];

/**
 * 같은 이름의 역이 여러 노선에 있을 수 있어 (line, apiName) 단위로 식별
 */
export function stationKey(s: Pick<Station, "line" | "apiName">) {
  return `${s.line}::${s.apiName}`;
}

/** 한 노선의 역을 정의된 순서대로 반환 (상행/하행 판정용) */
export function lineStations(line: string): Station[] {
  return STATIONS.filter((s) => s.line === line);
}

/**
 * 같은 이름(apiName)을 가진 역이 지정 노선에 있으면 반환.
 * - 예: 3호선 불광 → 6호선의 "불광"을 찾아 반환 (환승 방향 자동 매칭용)
 */
export function sameNameOnLine(apiName: string, line: string): Station | null {
  return STATIONS.find((s) => s.line === line && s.apiName === apiName) ?? null;
}

export type TransferCandidate = {
  station: Station;
  /** 도착 노선과 직접 환승 가능 여부 (한 번 환승으로 도착) */
  direct: boolean;
  /** 출발역 → 환승역 정거장 수 */
  originGap: number | null;
  /** 환승역(도착 노선 측) → 도착역 정거장 수 */
  destGap: number | null;
  /** 총 정거장 수 (originGap + destGap) — 최소시간 판단용 */
  totalGap: number | null;
  /** ⏱ 직접 환승 후보 중 totalGap 최소 */
  isMinTime?: boolean;
  /** 🔄 직접 환승 후보 중 originGap 최소 (가장 빨리 갈아탐) */
  isMinTransfer?: boolean;
};

/**
 * 출발 노선상의 환승 가능 역들.
 * - 출발역 자체 + 출발 노선과 같은 노선의 역은 제외
 * - 도착 노선과 직접 환승 가능한 역은 direct=true
 * - 직접 환승 후보 중:
 *    isMinTime: 출발→환승+환승→도착 정거장 합 최소 (⏱ 최소시간)
 *    isMinTransfer: 출발→환승역 정거장 최소 (🔄 가장 빨리 갈아탐)
 */
export function findTransferCandidates(
  origin: Station,
  destination: Station | null,
): TransferCandidate[] {
  if (!origin) return [];
  if (destination && origin.line === destination.line) return [];

  const otherLineNames = new Set(
    STATIONS.filter((s) => s.line !== origin.line).map((s) => s.apiName),
  );
  const transferStations = lineStations(origin.line).filter(
    (s) => s.apiName !== origin.apiName && otherLineNames.has(s.apiName),
  );

  const destNames = destination
    ? new Set(lineStations(destination.line).map((s) => s.apiName))
    : new Set<string>();

  const candidates: TransferCandidate[] = transferStations.map((s) => {
    const direct = destNames.has(s.apiName);
    const originGap = stationGap(origin, s);
    let destGap: number | null = null;
    if (direct && destination) {
      const destSide = sameNameOnLine(s.apiName, destination.line);
      if (destSide) destGap = stationGap(destSide, destination);
    }
    const totalGap =
      originGap != null && destGap != null ? originGap + destGap : null;
    return { station: s, direct, originGap, destGap, totalGap };
  });

  // direct 우선 정렬
  candidates.sort((a, b) => Number(b.direct) - Number(a.direct));

  // 라벨 부여 (direct 후보들에 한해서)
  let minTimeIdx = -1;
  let minTimeVal = Infinity;
  let minTransferIdx = -1;
  let minTransferVal = Infinity;
  candidates.forEach((c, i) => {
    if (!c.direct) return;
    if (c.totalGap != null && c.totalGap < minTimeVal) {
      minTimeVal = c.totalGap;
      minTimeIdx = i;
    }
    if (c.originGap != null && c.originGap < minTransferVal) {
      minTransferVal = c.originGap;
      minTransferIdx = i;
    }
  });
  if (minTimeIdx >= 0) candidates[minTimeIdx].isMinTime = true;
  if (minTransferIdx >= 0) candidates[minTransferIdx].isMinTransfer = true;

  return candidates;
}

/**
 * 출발→도착 진행 방향 판정.
 */
export type LineDirection = "forward" | "backward";

export function determineDirection(
  origin: Station,
  destination: Station,
): LineDirection | null {
  if (origin.line !== destination.line) return null;
  const stations = lineStations(origin.line);
  const oi = stations.findIndex((s) => s.apiName === origin.apiName);
  const di = stations.findIndex((s) => s.apiName === destination.apiName);
  if (oi < 0 || di < 0 || oi === di) return null;
  return di > oi ? "forward" : "backward";
}

export function terminalMatchesDirection(
  origin: Station,
  direction: LineDirection,
  terminalApiName: string,
): boolean {
  const stations = lineStations(origin.line);
  const oi = stations.findIndex((s) => s.apiName === origin.apiName);
  const ti = stations.findIndex((s) => s.apiName === terminalApiName);
  if (oi < 0 || ti < 0) return true;
  return direction === "forward" ? ti > oi : ti < oi;
}

/**
 * 같은 노선에서 두 역 간 정거장 수 (절대값).
 */
export function stationGap(origin: Station, dest: Station): number | null {
  if (origin.line !== dest.line) return null;
  const stations = lineStations(origin.line);
  const oi = stations.findIndex((s) => s.apiName === origin.apiName);
  const di = stations.findIndex((s) => s.apiName === dest.apiName);
  if (oi < 0 || di < 0) return null;
  return Math.abs(di - oi);
}

/**
 * 출발→도착 추정 소요시간(초). 정거장당 평균 2분.
 */
export const SECONDS_PER_HOP = 120;
export function approxTravelSec(origin: Station, dest: Station): number | null {
  const gap = stationGap(origin, dest);
  return gap == null ? null : gap * SECONDS_PER_HOP;
}

/**
 * 다중 환승 시 다음 환승역 자동 추론.
 * - legOrigin: 환승 후 탑승할 노선의 역 (예: 2호선 홍대입구)
 * - finalDest: 최종 도착역 (예: 1호선 부천)
 *
 * legOrigin 과 finalDest 가 같은 노선이면 finalDest 그대로.
 * 다른 노선이면 legOrigin 노선상의 finalDest 노선과 직접 환승 가능한 역 중
 * 가장 가까운 것을 반환 (예: 홍대입구 → 신도림 자동 선택).
 *
 * 환승 후보가 없으면 null (방향 판정 불가 — fallback 동작).
 */
export function inferNextTransferTarget(
  legOrigin: Station,
  finalDest: Station,
): Station | null {
  if (legOrigin.line === finalDest.line) return finalDest;
  const candidates = findTransferCandidates(legOrigin, finalDest).filter(
    (c) => c.direct,
  );
  if (candidates.length === 0) return null;
  let best: Station | null = null;
  let bestGap = Infinity;
  for (const c of candidates) {
    const g = stationGap(legOrigin, c.station);
    if (g != null && g < bestGap) {
      bestGap = g;
      best = c.station;
    }
  }
  return best;
}

/**
 * 진행 방향(forward/backward)을 서울 시간표 API 의 INOUT_TAG (1=상행, 2=하행)로 변환.
 * 본 데이터의 역 배열은 모두 "상행 종점부터" 시작하도록 구성됨:
 *  - backward (인덱스 감소 = 상행 종점 쪽) → INOUT 1
 *  - forward  (인덱스 증가 = 하행 종점 쪽) → INOUT 2
 * 2호선 순환선은 별도 매핑 필요 (지금은 미지원).
 */
export function directionToInoutTag(direction: LineDirection): "1" | "2" {
  return direction === "backward" ? "1" : "2";
}

export function searchStations(query: string, limit = 12): Station[] {
  const q = query.trim();
  if (!q) return [];
  const lower = q.toLowerCase();
  return STATIONS.filter((s) => {
    return (
      s.name.includes(q) ||
      s.apiName.includes(q) ||
      s.name.toLowerCase().includes(lower) ||
      s.line.includes(q)
    );
  }).slice(0, limit);
}
