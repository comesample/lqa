// ============================================================
// 공통 UI 프리미티브 (단일 출처)
// - LQA(App.jsx) 적용 완료. 신규/NQA 화면은 여기서 import.
// - FQA(FqaScreens/FqaAiGen)는 자체 톤 변형(Badge/Btn 음영 차이)을 유지 중이며,
//   공통으로 완전히 동일한 Card만 이관함. 나머지는 추후 정합성 검토 후 통합 예정.
// ============================================================
import { X } from "lucide-react";
import { C } from "./theme.js";

export function Badge({ kind = "info", children }) {
  const m = {
    pass: "bg-emerald-900 text-emerald-300", fail: "bg-red-900 text-red-300",
    warn: "bg-amber-900 text-amber-300", info: "bg-slate-700 text-slate-300",
    active: "bg-teal-900 text-teal-300", draft: "bg-slate-700 text-slate-400",
    crit: "bg-red-900 text-red-300", major: "bg-amber-900 text-amber-300", minor: "bg-slate-700 text-slate-300",
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

export function Field({ label, children }) {
  return <div><div className="text-xs font-semibold text-slate-400 mb-1.5">{label}</div>{children}</div>;
}

export function Btn({ kind = "ghost", icon: Icon, children, onClick, className = "" }) {
  const m = {
    primary: "bg-teal-600 hover:bg-teal-500 text-white",
    ghost: "bg-slate-800 hover:bg-slate-700 text-slate-200",
    danger: "bg-red-600 hover:bg-red-500 text-white",
    soft: "bg-slate-800 hover:bg-slate-700 text-slate-300",
  };
  return (
    <button onClick={onClick} className={"inline-flex items-center justify-center gap-2 rounded-lg text-sm font-semibold px-3 py-2 " + (m[kind] || m.ghost) + " " + className}>
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

export function Toggle({ on, onClick }) {
  return (
    <button onClick={onClick} className={"w-9 h-5 rounded-full p-0.5 " + (on ? "bg-teal-500" : "bg-slate-700")}>
      <span className="block w-4 h-4 rounded-full bg-white" style={{ transform: on ? "translateX(16px)" : "translateX(0px)", transition: "transform .15s" }} />
    </button>
  );
}

export function Modal({ title, children, onClose }) {
  return (
    <div className="fixed inset-0 z-40 bg-black bg-opacity-60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="w-full max-w-xl rounded-xl border border-slate-800 bg-slate-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-800">
          <h3 className="font-semibold text-slate-100">{title}</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
        </div>
        <div className="p-5 overflow-y-auto" style={{ maxHeight: "78vh" }}>{children}</div>
      </div>
    </div>
  );
}
