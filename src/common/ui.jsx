// ============================================================
// 공통 UI 프리미티브 (단일 출처)
// - LQA(App.jsx) 적용 완료. 신규/NQA 화면은 여기서 import.
// - LQA · FQA · 관리자 콘솔 전 영역이 이 단일 출처를 사용(2026-07-01 통일).
// ============================================================
import { useState } from "react";
import { X, Search } from "lucide-react";
import { C } from "./theme.js";

export function Badge({ kind = "info", children }) {
  const m = {
    pass: "bg-emerald-900 text-emerald-300", fail: "bg-red-900 text-red-300",
    warn: "bg-amber-900 text-amber-300", info: "bg-slate-700 text-slate-300",
    active: "bg-teal-900 text-teal-300", draft: "bg-slate-700 text-slate-400",
    crit: "bg-red-900 text-red-300", major: "bg-amber-900 text-amber-300", minor: "bg-slate-700 text-slate-300",
    teal: "bg-teal-900 text-teal-300", live: "bg-red-900 text-red-300",
  };
  return <span className={"px-2 py-0.5 rounded text-xs font-semibold " + (m[kind] || m.info)}>{children}</span>;
}

export function ScoreBar({ label, value, color }) {
  return (
    <div className="mb-2">
      <div className="flex justify-between text-xs mb-1"><span className="text-slate-400">{label}</span><span className="text-slate-100 font-semibold">{value}</span></div>
      <div className="h-2 rounded bg-slate-800"><div className="h-2 rounded" style={{ width: value + "%", background: color || C.teal }} /></div>
    </div>
  );
}

export function Card({ children, className = "" }) {
  return <div className={"rounded-xl border border-slate-800 bg-slate-900 " + className}>{children}</div>;
}

export function Field({ label, children, hint }) {
  return <div><div className="text-xs font-semibold text-slate-400 mb-1.5">{label}</div>{children}{hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}</div>;
}

export function Btn({ kind = "ghost", icon: Icon, children, onClick, disabled, className = "" }) {
  const m = {
    primary: "bg-teal-600 hover:bg-teal-500 text-white",
    ghost: "bg-slate-800 hover:bg-slate-700 text-slate-200",
    danger: "bg-red-600 hover:bg-red-500 text-white",
    soft: "bg-slate-800 hover:bg-slate-700 text-slate-300",
  };
  return (
    <button onClick={onClick} disabled={disabled} className={"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg text-sm font-semibold px-3 py-2 disabled:opacity-40 disabled:cursor-not-allowed " + (m[kind] || m.ghost) + " " + className}>
      {Icon && <Icon size={15} />}{children}
    </button>
  );
}

export function Input(props) {
  return <input {...props} className={"w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-teal-500 " + (props.className || "")} />;
}

export function Select({ children, ...p }) {
  return <select {...p} className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 outline-none focus:border-teal-500">{children}</select>;
}

export function Toggle({ on, onClick, disabled }) {
  return (
    <button onClick={disabled ? undefined : onClick} disabled={disabled} className={"w-9 h-5 rounded-full p-0.5 " + (on ? "bg-teal-500" : "bg-slate-700") + (disabled ? " opacity-50 cursor-not-allowed" : "")}>
      <span className="block w-4 h-4 rounded-full bg-white" style={{ transform: on ? "translateX(16px)" : "translateX(0px)", transition: "transform .15s" }} />
    </button>
  );
}

export function Modal({ title, children, onClose, wide }) {
  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-60 flex items-center justify-center p-4" onClick={onClose}>
      <div className={"w-full rounded-xl border border-slate-800 bg-slate-900 shadow-xl " + (wide ? "max-w-5xl" : "max-w-xl")} onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <h3 className="font-semibold text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
        </div>
        <div className="px-5 py-4 overflow-y-auto" style={{ maxHeight: "84vh" }}>{children}</div>
      </div>
    </div>
  );
}

// 화면 상단 툴바 — 좌: 설명 / 우: 액션 (전 화면 공통 골격)
export function PageToolbar({ desc, children }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="text-sm text-slate-400">{desc}</div>
      <div className="flex items-center gap-2 shrink-0">{children}</div>
    </div>
  );
}

// 빈 상태 — 아이콘 + 제목 + 보조 문구 (공통)
export function EmptyState({ icon: Icon, title, hint }) {
  return (
    <div className="py-12 text-center">
      {Icon && <Icon size={26} className="text-slate-600 mx-auto mb-2.5" />}
      <div className="text-slate-300 font-medium text-sm">{title}</div>
      {hint && <div className="text-xs text-slate-500 mt-1">{hint}</div>}
    </div>
  );
}

// 검색 입력 — 아이콘 내장, Input/Select와 동일 톤 (공통)
export function SearchInput({ value, onChange, placeholder, className = "" }) {
  return (
    <div className={"flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 focus-within:border-teal-500 " + className}>
      <Search size={15} className="text-slate-500 shrink-0" />
      <input value={value} onChange={onChange} placeholder={placeholder} className="bg-transparent text-sm text-slate-200 placeholder-slate-500 outline-none flex-1 w-full" />
    </div>
  );
}

// 세그먼트 컨트롤 (탭형 토글)
export function Seg({ options, value, onChange }) {
  return (
    <div className="inline-flex rounded-lg bg-slate-800 p-0.5">
      {options.map((o) => <button key={o} onClick={() => onChange(o)} className={"rounded-md px-3 py-1.5 text-xs font-medium transition " + (value === o ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-200")}>{o}</button>)}
    </div>
  );
}

// 현재 시각을 "YYYY-MM-DD HH:mm" 로 포맷 (실행 이력 시각 표기 통일용)
export const fmtTs = (d) => { const z = (n) => String(n).padStart(2, "0"); return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()) + " " + z(d.getHours()) + ":" + z(d.getMinutes()); };
export const nowStamp = () => fmtTs(new Date());
export const stampPlus = (sec) => fmtTs(new Date(Date.now() + (sec || 0) * 1000));

// 실행 이력 "시각" 셀 — 시작(전체 일시) / 종료(같은 날이면 시간만) 2줄 표시 (전 도메인 공통)
export function RunTime({ start, end }) {
  if (!start || start === "-") return <span className="text-slate-600">-</span>;
  let endTxt = "";
  if (end && end !== "-") endTxt = end.slice(0, 10) === start.slice(0, 10) ? end.slice(11) : end;
  return (
    <div className="leading-tight">
      <div className="text-slate-300">{start}</div>
      <div className="text-xs text-slate-500">{endTxt ? "~ " + endTxt : "~ —"}</div>
    </div>
  );
}

// 로컬 토스트 (화면 자체 알림용) — 전역 context toast와 별개로 필요한 화면에서 사용
export function useToast() { const [m, setM] = useState(""); return [m, (t) => { setM(t); setTimeout(() => setM(""), 2000); }]; }
export function Toast({ msg }) { return msg ? <div className="fixed bottom-5 right-5 z-50 rounded-lg border border-teal-700 bg-teal-900 px-4 py-2.5 text-sm text-teal-100 shadow-xl">{msg}</div> : null; }
// end of ui.jsx
export const backTo = (w) => { const s = String(w); const c = s.charCodeAt(s.length - 1); const jong = c >= 0xAC00 && c <= 0xD7A3 ? (c - 0xAC00) % 28 : -1; return s + (jong === 0 || jong === 8 ? "로" : "으로"); };
