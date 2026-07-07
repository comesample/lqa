import { useState } from "react";
import { useApp } from "./context.js";
import { Search, ChevronDown, Database, Check } from "lucide-react";

/* 데이터셋 선택 — 검색형 콤보박스(데이터셋 다수 대응). 값 = 데이터셋 이름. 공통 컴포넌트. */
export function DatasetPicker({ value, onChange, allowNone = true, noneLabel = "선택 안 함" }) {
  const { datasets } = useApp();
  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const list = datasets || [];
  const ql = q.trim().toLowerCase();
  const matches = list.filter((d) => !ql || d.name.toLowerCase().includes(ql) || (d.desc || "").toLowerCase().includes(ql));
  const rowN = (d) => (d.rowCount != null ? d.rowCount : (d.rows || []).length);
  const sel = list.find((d) => d.name === value);
  const pick = (name) => { onChange(name); setOpen(false); setQ(""); };
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="flex w-full items-center gap-2 rounded-lg border border-slate-700 bg-slate-800 px-3 py-1.5 text-left text-sm hover:border-teal-500">
        <Database size={13} className="shrink-0 text-teal-400" />
        {sel ? <span className="min-w-0 flex-1 truncate text-slate-200">{sel.name} <span className="text-xs text-slate-500">({rowN(sel).toLocaleString()}행)</span></span> : <span className="min-w-0 flex-1 truncate text-slate-500">{noneLabel}</span>}
        <ChevronDown size={13} className="shrink-0 text-slate-500" />
      </button>
      {open && (<>
        <div className="fixed inset-0 z-20" onClick={() => { setOpen(false); setQ(""); }} />
        <div className="absolute left-0 z-30 mt-1 w-full min-w-72 rounded-lg border border-slate-700 bg-slate-900 shadow-xl">
          <div className="flex items-center gap-1.5 border-b border-slate-800 px-2.5 py-1.5"><Search size={12} className="text-slate-500" /><input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="데이터셋 검색" className="w-full bg-transparent text-xs text-slate-200 placeholder-slate-500 outline-none" /></div>
          <div className="max-h-56 overflow-y-auto py-1">
            {allowNone && <button type="button" onClick={() => pick("")} className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-slate-800"><span className="min-w-0 flex-1 truncate text-xs text-slate-400">{noneLabel}</span>{!value && <Check size={12} className="shrink-0 text-teal-400" />}</button>}
            {matches.length === 0 ? <div className="px-3 py-3 text-center text-xs text-slate-500">일치하는 데이터셋이 없습니다</div> : matches.map((d) => (
              <button key={d.id} type="button" onClick={() => pick(d.name)} className="flex w-full items-center gap-2 px-2.5 py-1.5 text-left hover:bg-slate-800">
                <span className="min-w-0 flex-1 truncate text-xs text-slate-200">{d.name} <span className="text-slate-500">({rowN(d).toLocaleString()}행)</span></span>
                <span className="shrink-0 truncate text-xs text-slate-500" style={{ maxWidth: 120 }}>{(d.columns || []).join(", ")}</span>
                {value === d.name && <Check size={12} className="shrink-0 text-teal-400" />}
              </button>
            ))}
          </div>
          <div className="border-t border-slate-800 px-2.5 py-1 text-right text-xs text-slate-600">{list.length}개 중 {matches.length} 표시</div>
        </div>
      </>)}
    </div>
  );
}
