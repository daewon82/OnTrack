# OnTrack 🚇

내가 탈 수 있는 지하철 시간표를 자동으로 보여주는 출퇴근 웹앱.

- 출발역 / 도착역을 한 번 저장하면 localStorage에 보관 → 다음 방문 시 자동 로드
- 도보 시간(기본 10분)을 반영해 **"탑승 가능 / 도보 시간 부족"** 라벨 표시
- 실시간 도착 정보는 서울 열린데이터광장 API 사용 (무료)
- API 키 미설정 시 모의 데이터로 UI 미리보기 가능

## 시작하기

```bash
pnpm install     # 또는 npm install
pnpm dev         # http://localhost:3000
```

## 실데이터 연결

1. https://data.seoul.go.kr/ 가입
2. "지하철 실시간 도착정보" 서비스 신청 → 인증키 발급
3. `.env.local.example` 을 `.env.local` 로 복사 후 키 입력
   ```
   SEOUL_OPENAPI_KEY=발급받은키
   ```
4. `pnpm dev` 재시작

## 주요 파일

- [app/page.tsx](app/page.tsx) — 메인 화면 (출발역/도착역/도보 시간 + 실시간 도착)
- [app/api/arrival/route.ts](app/api/arrival/route.ts) — 서울 열린데이터광장 프록시
- [components/StationPicker.tsx](components/StationPicker.tsx) — 역 검색/선택 컴포넌트
- [data/stations.ts](data/stations.ts) — 역 목록 (1~9호선 + 경의중앙 + 공항철도, 샘플)
- [lib/settings.ts](lib/settings.ts) — localStorage 설정 보관

## 홈 화면에 추가 (앱처럼 사용)

이건 **PWA(Progressive Web App)** 입니다. 앱스토어 등록 불필요, 비용 0원.

- **iPhone (Safari)**: 공유 버튼 → "홈 화면에 추가"
- **Android (Chrome)**: 우상단 메뉴 → "홈 화면에 추가" / "앱 설치"

추가 후엔 홈 화면 아이콘으로 실행되고 풀스크린(주소창 없음)으로 동작합니다.

## 다음 단계 후보

- 정적 시간표(첫차/막차) 백업 — 종점역에서 실시간 정보가 비는 경우 대비
- 환승 경로 (출발/도착이 다른 노선일 때 환승역 포함 전체 시간 계산)
- iOS 단축어 위치 트리거 → 삼송/DMC 진입 시 자동 오픈
- 도보 시간을 Google Maps Distance Matrix API로 자동 계산
- 캘린더 연동 (회의 시작 시각 역산)
- 서비스 워커로 오프라인 캐시 (설정값과 마지막 조회 결과)
