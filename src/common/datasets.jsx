import { useState } from "react";
import { useApp } from "./context.js";
import { Card, PageToolbar, Badge, Btn, Field, Input, Toast, useToast } from "./ui.jsx";
import { Plus, X, Save, Pencil, Search, Upload, Database } from "lucide-react";

const nowStr = () => { const d = new Date(); const p = (n) => String(n).padStart(2, "0"); return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) + " " + p(d.getHours()) + ":" + p(d.getMinutes()); };
const parseCsv = (text) => {
  const lines = String(text || "").split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
  if (!lines.length) return { columns: [], rows: [] };
  const columns = lines[0].split(",").map((c) => c.trim()).filter(Boolean);
  const rows = lines.slice(1).map((ln) => { const cells = ln.split(","); const o = {}; columns.forEach((c, i) => (o[c] = (cells[i] || "").trim())); return o; });
  return { columns, rows };
};
const toCsv = (d) => (d.columns || []).join(",") + "\n" + (d.rows || []).map((r) => (d.columns || []).map((c) => r[c] || "").join(",")).join("\n");

/* 테스트 데이터셋 (공통) — 명명된 표 데이터. NQA 피드/FQA 데이터 드리븐이 이름으로 참조. */
export function DatasetsScreen() {
  const { datasets, addDataset, updateDataset, removeDataset, nqaSystems, fqaCases } = useApp();
  const [msg, flash] = useToast();
  const list = datasets || [];
  const [q, setQ] = useState("");
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState(null);
  const [df, setDf] = useState({ name: "", desc: "", text: "", uploaded: false });
  const ql = q.trim().toLowerCase();
  const shown = !ql ? list : list.filter((d) => d.name.toLowerCase().includes(ql) || (d.desc || "").toLowerCase().includes(ql));
  const refCount = (name) => (nqaSystems || []).filter((s) => (s.auth || {}).dataset === name).length + (fqaCases || []).filter((c) => c.dataset === name).length;
  const rowN = (d) => (d.rowCount != null ? d.rowCount : (d.rows || []).length);
  const openAdd = () => { setEditId(null); setDf({ name: "", desc: "", text: "phone,pw\n", uploaded: false }); setModal(true); };
  const openEdit = (d) => { setEditId(d.id); setDf({ name: d.name, desc: d.desc || "", text: toCsv(d), uploaded: false }); setModal(true); };
  const onFile = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => { setDf((v) => ({ ...v, text: String(r.result || "").replace(/^﻿/, ""), uploaded: true, name: v.name || f.name.replace(/\.[^.]+$/, "") })); }; r.readAsText(f, "utf-8"); };
  const save = () => {
    const name = df.name.trim();
    if (!name) { flash("이름을 입력하세요"); return; }
    if (list.some((d) => d.id !== editId && d.name === name)) { flash("동일 이름 데이터셋이 이미 있습니다"); return; }
    const { columns, rows } = parseCsv(df.text);
    if (!columns.length) { flash("컬럼(첫 줄)이 필요합니다"); return; }
    const t = nowStr();
    const payload = { name, desc: df.desc.trim(), columns, rows, rowCount: rows.length, source: df.uploaded ? "업로드" : "인라인" };
    if (editId) { updateDataset(editId, payload); flash("데이터셋이 수정되었습니다"); }
    else { addDataset({ id: "ds" + Date.now(), ...payload, createdAt: t, updatedAt: t }); flash("데이터셋이 추가되었습니다"); }
    setModal(false);
  };
  const del = (d) => { const n = refCount(d.name); if (n > 0 && !window.confirm(d.name + " 은(는) " + n + "곳에서 참조 중입니다. 삭제 시 참조가 깨질 수 있습니다. 계속할까요?")) return; if (n === 0 && !window.confirm(d.name + " 데이터셋을 삭제할까요?")) return; removeDataset(d.id); flash(d.name + " 삭제됨"); };
  const parsed = parseCsv(df.text);
  return (
    <div className="space-y-4">
      <PageToolbar desc="테스트 데이터셋 (표 데이터) — 대상·시나리오에서 이름으로 참조. 컬럼은 ${row.X} 매핑 기준." />
      <div className="flex items-center justify-between gap-3">
        <div className="relative w-72"><Search size={13} className="absolute left-2.5 top-2.5 text-slate-500" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="이름·설명 검색" className="w-full rounded-lg border border-slate-700 bg-slate-800 py-2 pl-8 pr-3 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-teal-500" /></div>
        <Btn kind="primary" icon={Plus} onClick={openAdd}>데이터셋 추가</Btn>
      </div>
      <Card className="p-4 space-y-1.5">
        <div className="grid grid-cols-12 gap-2 border-b border-slate-800 pb-2 text-xs font-semibold text-slate-500">
          <div className="col-span-3">이름</div><div className="col-span-4">컬럼</div><div className="col-span-1 text-center">행</div><div className="col-span-1 text-center">참조</div><div className="col-span-2">생성 / 변경</div><div className="col-span-1 text-right">관리</div>
        </div>
        {shown.length === 0 ? <div className="p-4 text-center text-xs text-slate-500">{list.length === 0 ? "데이터셋이 없습니다 — 추가하세요." : "검색 결과가 없습니다."}</div> : shown.map((d) => {
          const n = refCount(d.name);
          return (
          <div key={d.id} className="grid grid-cols-12 items-center gap-2 border-b border-slate-800/60 py-1.5 text-sm">
            <div className="col-span-3 min-w-0"><div className="flex items-center gap-1.5 min-w-0"><Database size={12} className="shrink-0 text-teal-400" /><span className="truncate font-mono text-slate-200">{d.name}</span></div>{d.desc && <div className="truncate pl-5 text-xs text-slate-500">{d.desc}</div>}</div>
            <div className="col-span-4 flex flex-wrap gap-1">{(d.columns || []).map((c) => <span key={c} className="rounded bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-slate-400">{c}</span>)}</div>
            <div className="col-span-1 text-center text-xs text-slate-400">{rowN(d).toLocaleString()}</div>
            <div className="col-span-1 text-center" title="이 데이터셋을 참조하는 대상 수"><Badge kind={n > 0 ? "teal" : "draft"}>{n}</Badge></div>
            <div className="col-span-2 text-xs leading-tight text-slate-500"><div>{d.createdAt || "—"}</div><div className="text-slate-400">변경 {d.updatedAt || "—"}</div></div>
            <div className="col-span-1 flex items-center justify-end gap-2"><button onClick={() => openEdit(d)} className="text-slate-500 hover:text-slate-200" title="편집"><Pencil size={13} /></button><button onClick={() => del(d)} className="text-slate-500 hover:text-red-400" title="삭제"><X size={14} /></button></div>
          </div>
          );
        })}
      </Card>
      <div className="rounded-lg border border-slate-800 bg-slate-900 p-3 text-xs text-slate-400">부하 대상의 <span className="text-slate-300">테스트 데이터</span>, 기능 케이스의 데이터 드리븐에서 이 데이터셋을 이름으로 선택합니다. 데이터셋의 컬럼이 본문의 <span className="font-mono text-slate-300">{"${row.컬럼}"}</span> 매핑·검증 기준이 됩니다.</div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setModal(false)}>
          <div className="w-full max-w-2xl rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-semibold text-slate-100">{editId ? "데이터셋 편집" : "새 데이터셋"}</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="이름" hint="참조 이름 (파일명 대신)"><Input value={df.name} onChange={(e) => setDf({ ...df, name: e.target.value })} placeholder="accounts_10k" /></Field>
              <Field label="설명 (선택)"><Input value={df.desc} onChange={(e) => setDf({ ...df, desc: e.target.value })} placeholder="용도 메모" /></Field>
            </div>
            <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-400">데이터 (CSV · 첫 줄=컬럼)</span><label className="flex cursor-pointer items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:border-teal-500"><Upload size={12} />CSV 업로드<input type="file" accept=".csv,.tsv,.txt" className="hidden" onChange={onFile} /></label></div>
            <textarea value={df.text} onChange={(e) => setDf({ ...df, text: e.target.value, uploaded: false })} rows={8} placeholder={"phone,pw\n01012340001,P@ss0001\n01012340002,P@ss0002"} className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 font-mono text-xs text-slate-200 outline-none focus:border-teal-500" />
            <div className="text-xs text-slate-500">컬럼: <span className="text-slate-300">{parsed.columns.join(", ") || "—"}</span> · 행 {parsed.rows.length}개 {df.uploaded && <span className="text-teal-400">· 업로드됨</span>}</div>
            <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setModal(false)}>취소</Btn><Btn kind="primary" icon={Save} onClick={save}>{editId ? "저장" : "추가"}</Btn></div>
          </div>
        </div>
      )}
      <Toast msg={msg} />
    </div>
  );
}
