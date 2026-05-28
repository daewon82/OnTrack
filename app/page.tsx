"use client";

import { useEffect, useState, useMemo } from "react";
import { StationPicker } from "@/components/StationPicker";
import { FavoriteChips } from "@/components/FavoriteChips";
import { ArrivalsCard } from "@/components/ArrivalsCard";
import { WeatherCard } from "@/components/WeatherCard";
import { VisitorCounter } from "@/components/VisitorCounter";
import {
  loadSettings,
  saveSettings,
  newFavorite,
  autoLabel,
  type Settings,
  type Favorite,
  type Transfer,
} from "@/lib/settings";
import {
  approxTravelSec,
  sameNameOnLine,
  findTransferCandidates,
  inferNextTransferTarget,
  determineDirection,
  directionToInoutTag,
  stationKey,
  STATIONS,
  type Station,
} from "@/data/stations";
import {
  findTransferHint,
  findExitHint,
  findArrivalHint,
  formatBoardingPosition,
} from "@/data/boarding-hints";

export default function Home() {
  const [settings, setSettings] = useState<Settings>(() => ({
    version: 2,
    favorites: [],
    activeId: null,
  }));
  const [hydrated, setHydrated] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    // 헤더 시계 — 1초마다
    const t = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  // "출발 N분 전" 계산용 — 3초마다 갱신 (ArrivalsCard에 prop으로 전달)
  const [etaNow, setEtaNow] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setEtaNow(new Date()), 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    setSettings(loadSettings());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) saveSettings(settings);
  }, [settings, hydrated]);

  const active = useMemo<Favorite | null>(
    () => settings.favorites.find((f) => f.id === settings.activeId) ?? null,
    [settings],
  );

  const updateActive = (patch: Partial<Favorite>) => {
    setSettings((s) => {
      if (!s.activeId) return s;
      return {
        ...s,
        favorites: s.favorites.map((f) => {
          if (f.id !== s.activeId) return f;
          const next = { ...f, ...patch };
          const oldAuto = autoLabel(f);
          if (f.label === oldAuto || f.label === "새 즐겨찾기") {
            next.label = autoLabel(next);
          }
          return next;
        }),
      };
    });
  };

  const updateTransfer = (patch: Partial<Transfer> | null) => {
    setSettings((s) => {
      if (!s.activeId) return s;
      return {
        ...s,
        favorites: s.favorites.map((f) => {
          if (f.id !== s.activeId) return f;
          if (patch === null) return { ...f, transfer: null };
          const base: Transfer = f.transfer ?? {
            at: null,
            finalDirection: null,
            walkMinutes: 0,
          };
          return { ...f, transfer: { ...base, ...patch } };
        }),
      };
    });
  };

  const addFavorite = () => {
    const f = newFavorite();
    setSettings((s) => ({ ...s, favorites: [...s.favorites, f], activeId: f.id }));
  };
  const selectFavorite = (id: string) =>
    setSettings((s) => ({ ...s, activeId: id }));
  const renameFavorite = (id: string, label: string) =>
    setSettings((s) => ({
      ...s,
      favorites: s.favorites.map((f) => (f.id === id ? { ...f, label } : f)),
    }));
  const deleteFavorite = (id: string) =>
    setSettings((s) => {
      const favorites = s.favorites.filter((f) => f.id !== id);
      const activeId = s.activeId === id ? favorites[0]?.id ?? null : s.activeId;
      return { ...s, favorites, activeId };
    });

  // ─── 환승역을 출발역 노선상의 같은 이름 역으로 자동 매칭 ───
  // 예: 출발=DMC(6호선), 환승=불광(3호선) → 6호선의 "불광"을 찾아 1단계 방향 판정에 사용
  const transferOnOriginLine = useMemo(() => {
    if (!active?.origin || !active?.transfer?.at) return null;
    if (active.origin.line === active.transfer.at.line) return active.transfer.at;
    return sameNameOnLine(active.transfer.at.apiName, active.origin.line);
  }, [active?.origin, active?.transfer?.at]);

  const transferTravelSec = useMemo(() => {
    if (!active?.origin || !transferOnOriginLine) return null;
    return approxTravelSec(active.origin, transferOnOriginLine);
  }, [active?.origin, transferOnOriginLine]);

  // ─── 1단계 카드 boarding hint ─────────────────────────
  const leg1HintLabel = useMemo(() => {
    if (!active?.origin) return null;
    const dirTarget = transferOnOriginLine ?? active?.destination ?? null;
    if (!dirTarget || dirTarget.line !== active.origin.line) return null;
    const dir = determineDirection(active.origin, dirTarget);
    if (!dir) return null;
    const inout = directionToInoutTag(dir);

    // 환승이 있다면 환승 추천
    if (active.transfer?.at) {
      const hint = findTransferHint(
        active.origin.line,
        active.origin.apiName,
        inout,
        active.transfer.at.line,
        active.transfer.at.apiName,
      );
      if (hint) {
        const note = hint.note ? ` · ${hint.note}` : "";
        return `🚪 ${formatBoardingPosition(hint)} — ${active.transfer.at.name} 환승 빠름${note}`;
      }
    }

    // 환승 없으면 도착 출구 추천 (출발역에서 도착역 출구로 가는 경로의 칸)
    // 같은 노선 직통이고 destinationExit 있을 때
    if (
      !active.transfer?.at &&
      active.destination &&
      active.destinationExit &&
      active.origin.line === active.destination.line
    ) {
      // 도착역에서의 출구 hint 사용 (탑승 위치는 출발역에서도 같은 칸/문)
      const exitHint = findExitHint(
        active.destination.line,
        active.destination.apiName,
        inout,
        active.destinationExit,
      );
      if (exitHint) {
        const note = exitHint.note ? ` · ${exitHint.note}` : "";
        return `🚪 ${formatBoardingPosition(exitHint)} — ${active.destination.name} ${active.destinationExit}번 출구 가까움${note}`;
      }
    }

    return null;
  }, [active, transferOnOriginLine]);

  // ─── 2단계 카드 boarding hint ─────────────────────────
  const leg2HintLabel = useMemo(() => {
    if (!active?.transfer?.at) return null;
    const legOrigin = active.transfer.at;
    const dirTarget =
      active.transfer.finalDirection ??
      (active.destination
        ? inferNextTransferTarget(legOrigin, active.destination) ??
          active.destination
        : null);
    if (!dirTarget || dirTarget.line !== legOrigin.line) return null;
    const dir = determineDirection(legOrigin, dirTarget);
    if (!dir) return null;
    const inout = directionToInoutTag(dir);

    // 1순위: 도착 출구 hint (가장 정확)
    if (
      active.destinationExit &&
      active.destination &&
      legOrigin.line === active.destination.line
    ) {
      const exitHint = findExitHint(
        active.destination.line,
        active.destination.apiName,
        inout,
        active.destinationExit,
      );
      if (exitHint) {
        const note = exitHint.note ? ` · ${exitHint.note}` : "";
        return `🚪 ${formatBoardingPosition(exitHint)} — ${active.destination.name} ${active.destinationExit}번 출구 가까움${note}`;
      }
    }

    // 2순위: 환승역에서 도착역 접근 hint (출구 모를 때 fallback)
    if (active.destination && legOrigin.line === active.destination.line) {
      const arrivalHint = findArrivalHint(
        legOrigin.line,
        legOrigin.apiName,
        inout,
        active.destination.apiName,
      );
      if (arrivalHint) {
        const note = arrivalHint.note ? ` · ${arrivalHint.note}` : "";
        return `🚪 ${formatBoardingPosition(arrivalHint)} — ${active.destination.name} 도착 빠름${note}`;
      }
    }

    return null;
  }, [active]);

  // ─── 출발 → 도착 총 소요시간 추정 ─────────────────────────
  const totalTravelSec = useMemo(() => {
    if (!active?.origin || !active?.destination) return null;
    // 환승 없음 + 같은 노선
    if (!active.transfer?.at) {
      if (active.origin.line === active.destination.line) {
        return approxTravelSec(active.origin, active.destination);
      }
      return null;
    }
    // 환승 있음: leg1(출발→환승) + 환승 도보 + leg2(환승→도착)
    const leg1 = transferTravelSec ?? 0;
    const walk = (active.transfer.walkMinutes ?? 0) * 60;
    // leg2: 환승역(도착 노선 측)과 도착역 사이
    let leg2 = 0;
    if (active.transfer.at.line === active.destination.line) {
      leg2 = approxTravelSec(active.transfer.at, active.destination) ?? 0;
    } else {
      // 환승역 노선이 도착 노선과 다르면 도착 노선상의 같은 이름 역 사용
      const destSide = sameNameOnLine(
        active.transfer.at.apiName,
        active.destination.line,
      );
      if (destSide) {
        leg2 = approxTravelSec(destSide, active.destination) ?? 0;
      }
    }
    return leg1 + walk + leg2;
  }, [active, transferTravelSec]);

  return (
    <main className="mx-auto max-w-xl p-4 pb-24">
      <WeatherCard />

      <header className="mb-3 mt-2 flex items-end justify-between">
        <h1 className="text-2xl font-bold tracking-tight">🚇 OnTrack</h1>
        <span className="font-mono text-sm text-neutral-500">
          {now.toLocaleTimeString("ko-KR", { hour12: false })}
        </span>
      </header>

      <FavoriteChips
        favorites={settings.favorites}
        activeId={settings.activeId}
        onSelect={selectFavorite}
        onAdd={addFavorite}
        onRename={renameFavorite}
        onDelete={deleteFavorite}
      />

      {settings.favorites.length === 0 && (
        <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
          위 <span className="font-semibold">+ 추가</span> 버튼으로 첫 즐겨찾기를
          만들어 보세요.
        </div>
      )}

      {active && (
        <>
          <section className="mb-4 space-y-3 rounded-xl bg-white p-4 shadow-sm">
            <StationPicker
              label="출발역"
              value={active.origin}
              onChange={(s) => updateActive({ origin: s })}
              placeholder="예: 삼송, 디지털미디어시티"
            />
            <StationPicker
              label="도착역"
              value={active.destination}
              onChange={(s) => updateActive({ destination: s })}
            />

            {active.destination && (
              <div>
                <label className="mb-1 block text-sm font-medium text-neutral-700">
                  도착 출구 번호 (선택) — 출구에 가장 가까운 탑승 위치 추천
                </label>
                <input
                  type="number"
                  min={1}
                  max={20}
                  inputMode="numeric"
                  placeholder="예: 3"
                  value={active.destinationExit ?? ""}
                  onChange={(e) =>
                    updateActive({
                      destinationExit: e.target.value
                        ? Math.max(1, Math.min(20, Number(e.target.value)))
                        : null,
                    })
                  }
                  className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
                />
              </div>
            )}

            <TransferEditor
              transfer={active.transfer ?? null}
              onChange={updateTransfer}
              transferTravelSec={transferTravelSec}
              origin={active.origin}
              destination={active.destination}
            />

            {totalTravelSec != null && active.origin && active.destination && (
              <div className="rounded-md bg-emerald-50 p-2 text-sm text-emerald-900 ring-1 ring-emerald-100">
                🕒{" "}
                <span className="font-semibold">
                  {active.origin.name.replace(/역$/, "")} →{" "}
                  {active.destination.name.replace(/역$/, "")}
                </span>{" "}
                약{" "}
                <span className="text-lg font-bold">
                  {Math.round(totalTravelSec / 60)}분
                </span>
                {active.transfer?.at && (
                  <span className="ml-1 text-[11px] text-emerald-700">
                    (지하철 {Math.round((transferTravelSec ?? 0) / 60)}분 + 환승{" "}
                    {active.transfer.walkMinutes ?? 0}분 + 지하철{" "}
                    {Math.round(
                      (totalTravelSec -
                        (transferTravelSec ?? 0) -
                        (active.transfer.walkMinutes ?? 0) * 60) /
                        60,
                    )}
                    분)
                  </span>
                )}
              </div>
            )}
          </section>

          {active.origin ? (
            <>
              <ArrivalsCard
                title={active.transfer?.at ? "1단계 — 출발" : undefined}
                origin={active.origin}
                directionTarget={transferOnOriginLine ?? active.destination}
                thresholdSec={0}
                thresholdLabel={`${active.origin.name} 출발 시간표`}
                now={etaNow}
                highlightFromMinutes={10}
                minCount={5}
                boardingHintLabel={leg1HintLabel}
              />

              {active.transfer?.at && (
                <ArrivalsCard
                  title="2단계 — 환승 후"
                  origin={active.transfer.at}
                  directionTarget={
                    active.transfer.finalDirection ??
                    (active.destination
                      ? inferNextTransferTarget(
                          active.transfer.at,
                          active.destination,
                        ) ?? active.destination
                      : null)
                  }
                  exactTerminal={!!active.transfer.finalDirection}
                  // 1단계와 동일하게 — 보정 없이 현재 시각 기준 모든 미래 열차 표시
                  thresholdSec={0}
                  thresholdLabel={
                    transferTravelSec != null
                      ? `${active.transfer.at.name} 출발 시간표 · 환승역까지 약 ${Math.round(transferTravelSec / 60)}분 (도착 후 판단)`
                      : `${active.transfer.at.name} 출발 시간표`
                  }
                  now={etaNow}
                  minCount={4}
                  boardingHintLabel={leg2HintLabel}
                />
              )}
            </>
          ) : (
            <div className="rounded-xl bg-blue-50 p-4 text-sm text-blue-900">
              출발역을 선택하면 실시간 도착 정보가 표시됩니다.
            </div>
          )}
        </>
      )}

      <footer className="mt-6 text-center text-xs text-neutral-400">
        1분마다 자동 갱신 · ↻ 버튼으로 수동 갱신
        <VisitorCounter />
      </footer>
    </main>
  );
}

// ──────────────────────────────────────────────────────────
function TransferEditor({
  transfer,
  onChange,
  transferTravelSec,
  origin,
  destination,
}: {
  transfer: Transfer | null;
  onChange: (patch: Partial<Transfer> | null) => void;
  transferTravelSec: number | null;
  origin: Station | null;
  destination: Station | null;
}) {
  if (transfer == null) {
    return (
      <button
        type="button"
        onClick={() => onChange({ walkMinutes: 0 })}
        className="w-full rounded-lg border border-dashed border-neutral-300 py-2 text-sm text-neutral-600 hover:border-blue-500 hover:text-blue-600"
      >
        + 환승 추가
      </button>
    );
  }

  // 출발 노선의 모든 환승역 (도착 노선과 직접 환승 가능한 것은 direct=true)
  const candidates = origin ? findTransferCandidates(origin, destination) : [];
  const directCandidates = candidates.filter((c) => c.direct);
  const otherCandidates = candidates.filter((c) => !c.direct);

  // 칩 클릭 시: direct=true 인 경우 도착 노선 측 station 사용 (다음 노선 타게 되니까)
  // direct=false 인 경우엔 같은 이름의 다른 노선 station 중 임의 — 사용자가 picker에서 정확히 고르도록
  function selectCandidate(c: { station: Station; direct: boolean }) {
    if (c.direct && destination) {
      onChange({ at: sameNameOnLine(c.station.apiName, destination.line) ?? c.station });
    } else {
      // 다른 노선의 같은 역 중 첫 번째 매칭 사용
      const other = STATIONS.find(
        (s) => s.apiName === c.station.apiName && s.line !== origin?.line,
      );
      onChange({ at: other ?? c.station });
    }
  }

  return (
    <div className="space-y-3 rounded-lg border border-neutral-200 bg-neutral-50 p-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-neutral-700">환승 정보</span>
        <button
          type="button"
          onClick={() => onChange(null)}
          className="text-xs text-red-500 hover:underline"
        >
          제거
        </button>
      </div>

      {candidates.length > 0 && !transfer?.at && (
        <div className="space-y-2 rounded-md bg-white p-2 ring-1 ring-blue-100">
          {directCandidates.length > 0 && destination && (
            <div>
              <div className="mb-1 text-[11px] font-semibold text-blue-700">
                ⭐ {destination.line}으로 직접 환승
              </div>
              <div className="flex flex-wrap gap-1.5">
                {directCandidates.map((c) => (
                  <button
                    key={stationKey(c.station)}
                    type="button"
                    onClick={() => selectCandidate(c)}
                    className={
                      "rounded-full border px-3 py-1 text-xs font-medium hover:bg-blue-100 " +
                      (c.isMinTime || c.isMinTransfer
                        ? "border-blue-500 bg-gradient-to-r from-blue-50 to-emerald-50 text-blue-800 shadow-sm"
                        : "border-blue-300 bg-blue-50 text-blue-700")
                    }
                  >
                    {c.station.name}
                    {c.totalGap != null && (
                      <span className="ml-1 text-[10px] text-blue-500">
                        총 {c.totalGap}정거장
                      </span>
                    )}
                    {c.isMinTime && (
                      <span className="ml-1 rounded bg-emerald-500 px-1 text-[9px] font-bold text-white">
                        ⏱ 최소시간
                      </span>
                    )}
                    {c.isMinTransfer && (
                      <span className="ml-1 rounded bg-blue-500 px-1 text-[9px] font-bold text-white">
                        🔄 최소환승
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}
          {otherCandidates.length > 0 && (
            <div>
              <div className="mb-1 text-[11px] font-semibold text-neutral-500">
                {directCandidates.length > 0
                  ? "그 외 환승역 (다른 노선 갈아탈 때)"
                  : `${origin?.line}의 환승역들`}
              </div>
              <div className="flex flex-wrap gap-1.5">
                {otherCandidates.map((c) => (
                  <button
                    key={stationKey(c.station)}
                    type="button"
                    onClick={() => selectCandidate(c)}
                    className="rounded-full border border-neutral-300 bg-white px-3 py-1 text-xs text-neutral-700 hover:border-neutral-400"
                  >
                    {c.station.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <StationPicker
        label="환승역 (다른 노선의 같은 환승역)"
        value={transfer?.at ?? null}
        onChange={(s) => onChange({ at: s })}
        placeholder="예: 불광 (3호선)"
        clearable
      />

      <StationPicker
        label="종착 방향 (선택) — 비우면 같은 방향 모두 표시"
        value={transfer?.finalDirection ?? null}
        onChange={(s) => onChange({ finalDirection: s })}
        placeholder="예: 대화 (특정 행만 타고 싶을 때)"
        clearable
      />

      {transferTravelSec != null && (
        <div className="rounded-md bg-blue-50 p-2 text-sm text-blue-900">
          🚇 환승역까지 소요시간 약{" "}
          <span className="font-semibold">
            {Math.round(transferTravelSec / 60)}분
          </span>
          <div className="mt-0.5 text-[11px] text-blue-700">
            정거장 수 × 2분 추정 — 환승 도보는 본인 판단
          </div>
        </div>
      )}
    </div>
  );
}
