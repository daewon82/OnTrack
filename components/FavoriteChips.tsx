"use client";

import { useState } from "react";
import type { Favorite } from "@/lib/settings";

type Props = {
  favorites: Favorite[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onAdd: () => void;
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
};

export function FavoriteChips({
  favorites,
  activeId,
  onSelect,
  onAdd,
  onRename,
  onDelete,
}: Props) {
  const [editId, setEditId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");

  const beginEdit = (f: Favorite) => {
    setEditId(f.id);
    setDraft(f.label);
  };
  const commitEdit = () => {
    if (editId && draft.trim()) onRename(editId, draft.trim());
    setEditId(null);
  };

  const handleDelete = (f: Favorite) => {
    if (typeof window !== "undefined") {
      const ok = window.confirm(`"${f.label}" 즐겨찾기를 삭제할까요?`);
      if (!ok) return;
    }
    onDelete(f.id);
    setEditId(null);
  };

  return (
    <div className="-mx-4 mb-4 overflow-x-auto px-4">
      <div className="flex items-center gap-2 whitespace-nowrap">
        {favorites.map((f) => {
          const active = f.id === activeId;
          const editing = f.id === editId;

          if (editing) {
            return (
              <div
                key={f.id}
                className="inline-flex items-center gap-1 rounded-full border border-blue-500 bg-white px-3 py-1.5"
              >
                <input
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commitEdit}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") commitEdit();
                    if (e.key === "Escape") setEditId(null);
                  }}
                  className="w-32 bg-transparent text-sm outline-none"
                />
                <button
                  type="button"
                  onClick={() => handleDelete(f)}
                  className="text-xs text-red-500 hover:underline"
                >
                  삭제
                </button>
              </div>
            );
          }

          return (
            <div
              key={f.id}
              className={
                "inline-flex items-center gap-1 rounded-full border transition " +
                (active
                  ? "border-blue-500 bg-blue-500 text-white"
                  : "border-neutral-300 bg-white text-neutral-700")
              }
            >
              <button
                type="button"
                onClick={() => onSelect(f.id)}
                onDoubleClick={() => beginEdit(f)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  beginEdit(f);
                }}
                className="px-3 py-1.5 text-sm"
                title="더블탭하여 이름 변경"
              >
                {f.label}
              </button>
              {/* 활성 칩에만 ✕ 노출 — 모바일에서도 즉시 삭제 가능 */}
              {active && (
                <button
                  type="button"
                  onClick={() => handleDelete(f)}
                  className="mr-1.5 flex h-5 w-5 items-center justify-center rounded-full text-xs hover:bg-white/20"
                  aria-label={`${f.label} 삭제`}
                  title="삭제"
                >
                  ✕
                </button>
              )}
            </div>
          );
        })}

        <button
          type="button"
          onClick={onAdd}
          className="rounded-full border border-dashed border-neutral-400 bg-white px-3 py-1.5 text-sm text-neutral-600 hover:border-blue-500 hover:text-blue-600"
        >
          + 추가
        </button>
      </div>
      {favorites.length > 0 && (
        <div className="mt-1 px-1 text-[11px] text-neutral-400">
          활성 칩의 ✕ 로 삭제 · 더블탭으로 이름 변경
        </div>
      )}
    </div>
  );
}
