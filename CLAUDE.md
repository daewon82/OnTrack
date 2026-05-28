# OnTrack — 프로젝트 가이드

> 출퇴근 지하철 시간표 PWA. Next.js 15 App Router · Vercel 배포.
> 도메인: https://ontrack-wheat.vercel.app

---

## 🎯 핵심 동작 규칙 (사용자 요구사항)

이 규칙들은 **명시적 합의 사항**이라 코드 변경 시 절대 깨면 안 됨.

### 1. 날씨 카드
- **당일을 시작일로 Open-Meteo API에서 받을 수 있는 최대 일수(`forecast_days=16`) 모두 가져와 표시**
- 비 오는 날은 **빨간색**으로 강조 (배경 + 글씨)
- "오늘" 표시 (파란 ring)
- 비 판정: `precipitation_sum ≥ 0.2mm` OR `precipitation_probability_max ≥ 50%` OR WMO 코드가 비 관련

### 2. 1·2단계 카드 — 데이터 출처
- **정규 시간표만 사용 (실시간 미사용)** — 혼선 방지
- 출처: 서울 OpenAPI `SearchSTNTimeTableByIDService`
- 시간표 API가 0건이면 빈 화면 + 안내 (외부 의존)

### 3. 1단계 카드 (출발역)
- **반드시 10분 이상 출발 전 데이터 1개 이상 표시** (highlightFromMinutes=10)
- minCount = 5, 10분 이상 항목까지 슬라이스 확장 (cap 12)
- ✨ 추천 라벨 + 그라데이션 강조

### 4. 2단계 카드 (환승 후)
- minCount = 4
- 하이라이트 없음 (1단계만 강조)
- exactTerminal: 사용자가 종착방향 설정 시 그 종착만 정확 일치

### 5. 시간 표시
- **모든 시각은 "출발 N분 전" (현재 시각 기준)**
- thresholdSec=0 — 보정 없음. 환승 소요시간은 라벨로만 안내.
- 60초마다 자동 갱신, ↻ 수동 갱신 버튼 있음

### 6. 환승 추천 칩
- ⭐ 도착 노선과 직접 환승: 강조 그룹
- ⏱ 최소시간: 출발→환승+환승→도착 정거장 합 최소
- 🔄 최소환승: 출발→환승역 가장 가까운
- 그 외 환승역: 다른 노선 갈아탈 때 (다중 환승)

### 7. 즐겨찾기
- localStorage 저장 (`ontrack:settings:v1`)
- 활성 칩에 ✕ 버튼으로 즉시 삭제 (confirm)
- 더블탭/우클릭으로 이름 변경
- 자동 라벨: "○○ → ○○" (양역 정해지면)

### 8. 최적 탑승 위치 힌트 (Boarding Hints)
- 출처: [data/boarding-hints.ts](data/boarding-hints.ts) 정적 데이터
- 1단계 카드: 환승역까지 가장 가까운 탑승 차량/문 추천 ("🚪 4-2번 칸 — 불광 환승 빠름")
- 2단계 카드: 도착 출구 입력 시 그 출구에 가까운 탑승 위치 추천
- 즐겨찾기에 `destinationExit` 필드로 출구 번호 저장
- 데이터 부족 시 표시 안 됨 (조용히 숨김)
- 사용자 답사·피드백으로 점진적 보강 예정

### 9. 방문자 카운터
- abacus.jasoncameron.dev 무료 익명 카운터
- 화면 진입 시 PV +1, UV는 24시간에 1회 (localStorage 디덤)
- 푸터에 "👥 누적 방문 N명 · 조회 M회"

---

## 🛠 기술 스택

- **Next.js 15** App Router + TypeScript
- **Tailwind CSS** 3
- **Vercel** (프로덕션 배포, Functions, ISR)
- **PWA**: app/manifest.ts + app/icon.tsx + app/apple-icon.tsx

---

## 🔌 데이터 출처

### 서울 열린데이터광장 (https://data.seoul.go.kr)
- 환경변수: `SEOUL_OPENAPI_KEY` (실시간 지하철 인증키 — 일반 API도 호환됨, 확인됨)
- 일 한도 1,000건 (서비스화 시 캐싱으로 절약)

| 엔드포인트 | 용도 | 비고 |
|---|---|---|
| `realtimeStationArrival` | 실시간 도착 정보 | swopenapi 도메인 |
| `SearchInfoBySubwayNameService` | 역명 검색 + STATION_CD | openapi 도메인 |
| `SearchSTNTimeTableByIDService` | 정적 시간표 | 페이지당 1000건 |

### Open-Meteo (https://open-meteo.com)
- 무료, 키 불필요
- 서울 좌표 고정 (37.5665, 126.978)
- 1시간 캐시

### abacus (https://abacus.jasoncameron.dev)
- 무료 익명 카운터
- namespace: `ontrack-wheat`, key: `pv-total` / `uv-total`

---

## ⚠️ 알려진 데이터 제약

서울 OpenAPI `SearchSTNTimeTableByIDService`가 **데이터 0건**으로 응답하는 노선들:

- **경의중앙선** (코레일 운영)
- **신분당선** (민자)
- **우이신설선** (민자)
- **GTX-A** (민자)
- 1호선/4호선의 코레일 구간 일부 가능성

이 노선들은 실시간 데이터만 사용 가능 → 보통 25분 이내 열차만 표시. 화면에 노란색 안내 자동 노출.

코레일 시간표를 보강하려면 공공데이터포털(data.go.kr)의 별도 API 키 필요. 추후 검토.

---

## 📂 핵심 파일

| 경로 | 역할 |
|---|---|
| [app/page.tsx](app/page.tsx) | 메인 페이지 — 즐겨찾기, 환승, 카드 렌더 |
| [app/layout.tsx](app/layout.tsx) | PWA 메타데이터 |
| [components/ArrivalsCard.tsx](components/ArrivalsCard.tsx) | 시간표 카드 (실시간+시간표 결합) |
| [components/WeatherCard.tsx](components/WeatherCard.tsx) | 날씨 카드 |
| [components/StationPicker.tsx](components/StationPicker.tsx) | 역 검색 (정적+동적 결합) |
| [components/FavoriteChips.tsx](components/FavoriteChips.tsx) | 즐겨찾기 칩 |
| [components/VisitorCounter.tsx](components/VisitorCounter.tsx) | 방문자 카운터 |
| [data/stations.ts](data/stations.ts) | 모든 노선 역 순서 마스터 |
| [lib/settings.ts](lib/settings.ts) | localStorage Settings 스키마 |
| [app/api/arrival/route.ts](app/api/arrival/route.ts) | 실시간 도착 프록시 |
| [app/api/timetable/route.ts](app/api/timetable/route.ts) | 정적 시간표 프록시 |
| [app/api/search-station/route.ts](app/api/search-station/route.ts) | 역명 동적 검색 |
| [app/api/weather/route.ts](app/api/weather/route.ts) | 날씨 프록시 |

---

## 🚀 개발 / 배포

```bash
npm install
npm run dev               # http://localhost:3000
npm run build             # 타입체크 + 프로덕션 빌드
vercel --prod --yes       # Vercel 프로덕션 배포
```

환경변수 (Vercel 프로덕션):
- `SEOUL_OPENAPI_KEY` — 등록됨

---

## 🧪 검증 패턴

새 기능/수정 후 검증:

```bash
# 빌드 통과
npm run build 2>&1 | tail -5

# 프로덕션 배포 후 스모크
curl -sS -o /dev/null -w "home=%{http_code}\n" https://ontrack-wheat.vercel.app/

# 노선 시간표 검증
curl -sS "https://ontrack-wheat.vercel.app/api/timetable?station=삼송&line=3호선&inout=2"
```
