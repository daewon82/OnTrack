"use client";

import { useEffect, useMemo, useState } from "react";
import { searchStations, type Station, stationKey } from "@/data/stations";
import type { SearchedStation } from "@/app/api/search-station/route";

type Props = {
  label: string;
  value: Station | null;
  onChange: (s: Station | null) => void;
  placeholder?: string;
  /** true면 값 옆에 ✕ 버튼 노출 → null 로 초기화 가능 */
  clearable?: boolean;
};

type Result = Station & { source: "static" | "api" };

export function StationPicker({
  label,
  value,
  onChange,
  placeholder,
  clearable = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [apiResults, setApiResults] = useState<SearchedStation[]>([]);
  const [apiLoading, setApiLoading] = useState(false);

  // 정적 검색 (즉시)
  const staticResults = useMemo(() => searchStations(query), [query]);

  // 동적 API 검색 (디바운스 300ms)
  useEffect(() => {
    const q = query.trim();
    if (q.length < 1) {
      setApiResults([]);
      return;
    }
    const handle = setTimeout(async () => {
      setApiLoading(true);
      try {
        const res = await fetch(`/api/search-station?q=${encodeURIComponent(q)}`);
        const json = (await res.json()) as { stations?: SearchedStation[] };
        setApiResults(json.stations ?? []);
      } catch {
        setApiResults([]);
      } finally {
        setApiLoading(false);
      }
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  // 정적 + 동적 결과 합침 (정적 우선, 중복 제거)
  const merged: Result[] = useMemo(() => {
    const seen = new Set<string>();
    const out: Result[] = [];
    for (const s of staticResults) {
      const k = `${s.line}::${s.apiName}`;
      seen.add(k);
      out.push({ ...s, source: "static" });
    }
    for (const a of apiResults) {
      const k = `${a.line}::${a.apiName}`;
      if (seen.has(k)) continue;
      seen.add(k);
      out.push({ name: a.name, line: a.line, apiName: a.apiName, source: "api" });
    }
    return out;
  }, [staticResults, apiResults]);

  return (
    <div className="relative">
      <label className="block text-sm font-medium text-neutral-700 mb-1">
        {label}
      </label>

      {value && !open ? (
        <div className="flex items-center justify-between rounded-lg border border-neutral-300 bg-white px-3 py-2">
          <div>
            <div className="font-medium">{value.name}</div>
            <div className="text-xs text-neutral-500">{value.line}</div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              className="text-sm text-blue-600 hover:underline"
              onClick={() => {
                setOpen(true);
                setQuery("");
              }}
            >
              변경
            </button>
            {clearable && (
              <button
                type="button"
                className="rounded-full px-2 text-sm text-neutral-400 hover:bg-neutral-100 hover:text-red-500"
                onClick={() => {
                  onChange(null);
                  setOpen(false);
                  setQuery("");
                }}
                aria-label="지우기"
                title="지우기"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      ) : (
        <input
          autoFocus={open}
          type="text"
          inputMode="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setOpen(true)}
          placeholder={placeholder ?? "역 이름 검색 (예: 잠실, 정자, 강남)"}
          className="w-full rounded-lg border border-neutral-300 bg-white px-3 py-2 outline-none focus:border-blue-500"
        />
      )}

      {open && query && (
        <div className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-neutral-200 bg-white shadow-lg">
          {merged.length === 0 ? (
            <div className="p-3 text-sm text-neutral-500">
              {apiLoading ? "검색 중…" : "검색 결과 없음"}
            </div>
          ) : (
            <>
              {merged.map((s) => (
                <button
                  key={stationKey(s) + ":" + s.source}
                  type="button"
                  onClick={() => {
                    onChange({ name: s.name, line: s.line, apiName: s.apiName });
                    setOpen(false);
                    setQuery("");
                  }}
                  className="flex w-full items-center justify-between px-3 py-2 text-left hover:bg-neutral-50"
                >
                  <span className="font-medium">{s.name}</span>
                  <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                    {s.line}
                  </span>
                </button>
              ))}
              {apiLoading && (
                <div className="border-t border-neutral-100 p-2 text-center text-[11px] text-neutral-400">
                  검색 중…
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
