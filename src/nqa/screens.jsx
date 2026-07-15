import { useState, useEffect } from "react";
import { useApp } from "../common/context.js";
import { VarRefInput } from "../common/VarRefInput.jsx";
import { DatasetPicker } from "../common/DatasetPicker.jsx";
import { Card, PageToolbar, Badge, Btn, Field, Input, Select, Toggle, Seg, Toast, useToast, RunTime, stampPlus } from "../common/ui.jsx";
import { Gauge, Plus, X, Save, Smartphone, Cpu, Wifi, Package, Upload, Link2, CheckCircle2, Globe, Monitor, Server, Zap, Activity, AlertTriangle, TrendingUp, Bug } from "lucide-react";
import { NQA_SUBTYPES, NQA_PLATFORMS, NQA_PLAT_K, NQA_TIERS, NQA_TOOLS, NQA_TOOL_METRICS, NQA_NETWORKS, NQA_STARTS, NQA_THERMAL_LEVELS, NQA_PROVIDERS, NQA_DEV_STATUS, NQA_DEV_ST_K, NQA_CAP_LABELS, NQA_PROVIDER_CAPS, NQA_SCN_SOURCES, NQA_SCN_SRC_K, NQA_MARKERS, NQA_SCN_TEMPLATES, NQA_BROWSERS, NQA_VIEWPORTS, NQA_WEB_NET, NQA_CPU_THROTTLE, NQA_CACHE, NQA_PROTOCOLS, NQA_LOAD_ENVS, NQA_HTTP_METHODS, NQA_AUTH_TYPES, NQA_MAX_AGENTS, NQA_LOAD_UNITS, NQA_LOAD_SHAPES } from "./data.js";

const NQA_META = {
  "nqa-dashboard": ["대시보드", "부하 KPI · SLA 위반 추이 · 대상별 처리량/지연 요약"],
  "nqa-targets": ["대상·환경", "부하 대상(SUT) · 인증 · 부하 생성 인프라"],
  "nqa-scenarios": ["측정 시나리오", "부하 대상 선택 · 워크로드(비율 혼합/순차 진행) · 부하 형상(VU/RPS 램프·지속)"],
  "nqa-plan": ["측정 계획", "측정 시나리오 + SLA 판정 임계(합격/불합격) — 계획이 아우름"],
  "nqa-run": ["측정 실행", "부하 주입 + 실시간 관측(RPS/에러율/p95)"],
  "nqa-history": ["실행 이력", "부하 실행 이력 · 처리량·p95·에러율·SLA 결과"],
  "nqa-trend": ["성능 추이", "회차/빌드 간 처리량·p95·에러율 추이 · 성능 회귀 감지"],
};

function SubSwitch() {
  const { toast } = useApp();
  return (
    <div className="flex items-center gap-1.5">
      {NQA_SUBTYPES.map((s) => (
        <button
          key={s.id}
          onClick={() => { if (!s.ready) toast(s.label + "은 비활성 상태입니다 (준비 중)", "info"); }}
          className={"rounded-lg px-3 py-1.5 text-xs font-semibold " + (s.ready ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-800")}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

/* ═══════════ 측정 대상·환경 (부하 대상 SUT · 인증 · 부하 생성 인프라) — 기능 QA 독립 ═══════════ */
const M_LK = { GET: "info", POST: "pass", PUT: "warn", DELETE: "fail", PATCH: "warn" };
/* 엔드포인트에 상관(추출→참조)이 있는가 — 워크로드 모드(비율 혼합/순차 진행) 자동 판정 기준 */
const epCorrelated = (eps) => {
  const produced = new Set((eps || []).flatMap((ep) => (ep.extracts || []).map((x) => x.var).filter(Boolean)));
  if (!produced.size) return false;
  return (eps || []).some((ep) => { const txt = (ep.body || "") + " " + ((ep.headers || []).map((h) => h.v).join(" ")); return (txt.match(/\$\{([a-zA-Z0-9_]+)\}/g) || []).some((m) => produced.has(m.replace(/\$\{|\}/g, ""))); });
};
export function NqaTargetScreen() {
  const { nqaSystems, addNqaSystem, updateNqaSystem, removeNqaSystem, variables } = useApp();
  const [msg, flash] = useToast();
  const systems = nqaSystems || [];
  const [sel, setSel] = useState(0);
  const sys = systems[sel] || systems[0] || {};
  const [draft, setDraft] = useState({});
  const cfg = { ...sys, ...draft };
  const dirty = Object.keys(draft).length > 0;
  const setCfg = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const saveCfg = () => { if (!(cfg.baseUrl || "").trim()) { flash("Base URL을 입력하세요"); return; } updateNqaSystem(sys.id, draft); setDraft({}); flash("설정 저장됨"); };
  const guardSwitch = (fn) => { if (dirty && !window.confirm("저장하지 않은 변경이 있습니다. 이동하시겠습니까?")) return; setDraft({}); fn(); };
  useEffect(() => { setDraft({}); setChk(null); }, [sys.id]);
  const choose = (i) => guardSwitch(() => setSel(i));
  const [modal, setModal] = useState(false);
  const [nf, setNf] = useState({ name: "", baseUrl: "", protocol: "HTTP/HTTPS", env: "스테이징" });
  const [chk, setChk] = useState(null);
  const loadgen = cfg.loadgen || {};
  const auth = cfg.auth || {};
  const secretRef = (val, setVal, ph) => <VarRefInput value={val} onChange={setVal} placeholder={ph} />;
  const runCheck = () => { setChk({ s: "run" }); setTimeout(() => { setChk({ s: cfg.baseUrl ? "ok" : "warn", m: (cfg.baseUrl ? "대상 접근 OK" : "⚠ Base URL 없음") + " · 부하 생성 워커 " + (loadgen.agents || 1) }); }, 800); };
  const addSut = () => {
    if (!nf.name.trim()) { flash("대상 이름을 입력하세요"); return; }
    if (!nf.baseUrl.trim()) { flash("Base URL을 입력하세요"); return; }
    guardSwitch(() => { const ns = { id: Date.now(), name: nf.name, subtype: "load", baseUrl: nf.baseUrl, protocol: nf.protocol, env: nf.env, loadgen: { tool: "JMeter", agents: 1 }, auth: { type: "Bearer 토큰", ref: "" } }; addNqaSystem(ns); setSel(0); setModal(false); flash("부하 대상이 추가되었습니다"); });
  };
  const delSut = (i, sy) => { if (systems.length <= 1) { flash("최소 1개 대상은 유지해야 합니다"); return; } if (!window.confirm(sy.name + " 대상을 삭제할까요?")) return; guardSwitch(() => { removeNqaSystem(sy.id); setSel(0); flash(sy.name + " 삭제됨"); }); };
  if (!systems.length) return <div className="p-8 text-center text-sm text-slate-500">부하 대상이 없습니다.</div>;
  return (
    <div className="space-y-4">
      <PageToolbar desc="부하 대상(SUT) · 인증 · 부하 생성 인프라" />
      <SubSwitch />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-3">
          <Btn kind="primary" icon={Plus} className="w-full" onClick={() => { setNf({ name: "", baseUrl: "", protocol: "HTTP/HTTPS", env: "스테이징" }); setModal(true); }}>부하 대상 추가</Btn>
          {systems.map((sy, i) => (
            <Card key={sy.id} className={"cursor-pointer p-3 " + (sel === i ? "border-teal-500" : "hover:border-slate-700")}>
              <div onClick={() => choose(i)}>
                <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-100">{sy.name}</span><div className="flex items-center gap-1.5"><Badge kind="warn">부하</Badge><button onClick={(e) => { e.stopPropagation(); delSut(i, sy); }} className="text-slate-500 hover:text-red-400" title="대상 삭제"><X size={12} /></button></div></div>
                <div className="mt-1 truncate text-xs text-slate-500">{sy.baseUrl}</div>
                <div className="mt-1 text-xs text-slate-500">{sy.protocol} · {sy.env}</div>
              </div>
            </Card>
          ))}
        </div>
        <div className="col-span-9 space-y-3">
          <Card className="flex items-center justify-between gap-3 p-3">
            <div className="flex min-w-0 flex-1 items-center gap-2"><Server size={16} className="shrink-0 text-teal-400" /><div className="w-56 shrink-0"><Input value={cfg.name || ""} onChange={(e) => setCfg({ name: e.target.value })} className="text-base font-semibold" /></div><span className="shrink-0"><Badge kind="info">{sys.protocol}</Badge></span><span className="shrink-0"><Badge kind="info">{cfg.env}</Badge></span><span className="truncate text-xs text-slate-500">{cfg.baseUrl}</span></div>
            <div className="flex shrink-0 items-center gap-2">{dirty && <span className="text-xs text-amber-300">미저장 변경</span>}<Btn icon={Link2} onClick={runCheck}>{chk && chk.s === "run" ? "확인 중…" : "연결 확인"}</Btn><Btn kind="primary" icon={Save} onClick={saveCfg} disabled={!dirty}>설정 저장</Btn></div>
          </Card>
          <div className="text-xs text-slate-500">생성 <span className="text-slate-400">{sys.createdBy || "—"}</span> · {sys.createdAt || "—"} · 수정 <span className="text-slate-400">{sys.updatedBy || "—"}</span> · {sys.updatedAt || "—"}</div>
          {chk && chk.s !== "run" && <div className={"flex items-center gap-2 rounded-lg border px-3 py-2 text-xs " + (chk.s === "ok" ? "border-emerald-800 bg-emerald-950 text-emerald-300" : "border-amber-800 bg-amber-950 text-amber-300")}>{chk.s === "ok" && <CheckCircle2 size={13} />}{chk.m}</div>}
          <Card className="p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Server size={15} className="text-teal-400" />대상 시스템 (SUT)</div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Base URL / 게이트웨이"><Input value={cfg.baseUrl || ""} onChange={(e) => setCfg({ baseUrl: e.target.value })} placeholder="https://api-stg.tworld.co.kr" /></Field>
              <Field label="프로토콜"><div className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-sm text-slate-300">{cfg.protocol || "HTTP/HTTPS"}</div></Field>
              <Field label="환경"><Select value={cfg.env || ""} onChange={(e) => setCfg({ env: e.target.value })}>{NQA_LOAD_ENVS.map((p) => <option key={p}>{p}</option>)}</Select></Field>
            </div>
          </Card>
          <Card className="p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Link2 size={15} className="text-teal-400" />인증 <span className="text-xs font-normal text-slate-500">· 이 대상의 모든 요청에 자동 주입</span></div>
            <Field label="인증 방식"><div style={{ maxWidth: 260 }}><Select value={auth.type || ""} onChange={(e) => setCfg({ auth: { ...auth, type: e.target.value } })}>{NQA_AUTH_TYPES.map((t) => <option key={t}>{t}</option>)}</Select></div></Field>
            {auth.type === "Bearer 토큰" && <Field label="토큰 (변수 참조)">{secretRef(auth.ref, (val) => setCfg({ auth: { ...auth, ref: val } }), "${stg_tworld_token}")}</Field>}
            {auth.type === "API Key" && <div className="grid grid-cols-2 gap-3"><Field label="헤더명"><Input value={auth.keyName || ""} onChange={(e) => setCfg({ auth: { ...auth, keyName: e.target.value } })} placeholder="X-API-Key" /></Field><Field label="키 값 (변수 참조)">{secretRef(auth.ref, (val) => setCfg({ auth: { ...auth, ref: val } }), "${api_key}")}</Field></div>}
            {auth.type === "OAuth 2.0 (client credentials)" && <div className="space-y-1.5"><div className="grid grid-cols-2 gap-3"><Field label="토큰 URL"><Input value={auth.tokenUrl || ""} onChange={(e) => setCfg({ auth: { ...auth, tokenUrl: e.target.value } })} placeholder="https://auth.../token" /></Field><Field label="scope"><Input value={auth.scope || ""} onChange={(e) => setCfg({ auth: { ...auth, scope: e.target.value } })} placeholder="read write" /></Field><Field label="client id"><Input value={auth.clientId || ""} onChange={(e) => setCfg({ auth: { ...auth, clientId: e.target.value } })} /></Field></div><Field label="client secret (변수 참조)">{secretRef(auth.ref, (val) => setCfg({ auth: { ...auth, ref: val } }), "${client_secret}")}</Field><div className="text-xs text-slate-500">테스트 시작 시 토큰을 1회 발급 · 만료 시 자동 갱신 · 전 VU 공유(서비스 계정).</div></div>}
            {auth.type && auth.type !== "없음" && <div className="text-xs text-slate-500">시크릿은 공통 <span className="text-slate-300">변수</span> 화면의 값을 <span className="font-mono text-teal-400">{"${키}"}</span>로 참조 · 실행 시 환경 값으로 치환됩니다. <span className="text-slate-600">러너가 해당 환경 변수에 접근 가능해야 함.</span></div>}
            <div className="rounded-lg bg-slate-800 p-2.5 text-xs text-slate-400">여기 인증은 이 대상의 <span className="text-slate-300">모든 요청에 기본 적용</span>됩니다. VU별 세션 로그인은 <span className="text-slate-300">측정 시나리오</span>의 로그인 엔드포인트 · 데이터셋 · 상관으로 구성하세요.</div>
          </Card>
          <Card className="p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Cpu size={15} className="text-teal-400" />부하 생성 인프라</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="부하 생성 엔진"><div className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-sm text-slate-300">JMeter</div></Field>
              <Field label="부하 생성기 수 (워커)" hint={"인스턴스당 1 Pod · 최대 " + NQA_MAX_AGENTS + " (테넌트 쿼터)"}><Input type="number" min={1} max={NQA_MAX_AGENTS} value={loadgen.agents || 1} onChange={(e) => setCfg({ loadgen: { ...loadgen, agents: +e.target.value || 1 } })} className="w-24" /></Field>
            </div>
            {(loadgen.agents || 0) > NQA_MAX_AGENTS ? <div className="rounded-lg border border-amber-800 bg-amber-950 px-2.5 py-1.5 text-xs text-amber-300">테넌트 부하 생성 한도({NQA_MAX_AGENTS}) 초과 — 초과분은 큐잉되거나 거절됩니다.</div> : <div className="text-xs text-slate-500">컨트롤러(마스터) 1 + 워커 {loadgen.agents || 1} · 고 RPS는 워커를 늘려 수평 분산(테넌트 쿼터 내).</div>}
          </Card>
          <div className="text-xs text-slate-500">엔드포인트(요청)·데이터·부하 형상·SLA는 <span className="text-slate-400">측정 시나리오/계획</span>에서 정의합니다. 대상·환경은 "어디에 붙고 · 어떻게 인증할지"를 담습니다. <span className="text-slate-600">· 부하는 스테이징/개발 대상 · 기능 QA와 완전 독립</span></div>
        </div>
      </div>
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-semibold text-slate-100">부하 대상 추가</div>
            <Field label="대상 이름"><Input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder="T월드 API 부하" /></Field>
            <Field label="Base URL / 게이트웨이"><Input value={nf.baseUrl} onChange={(e) => setNf({ ...nf, baseUrl: e.target.value })} placeholder="https://api-stg.tworld.co.kr" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="프로토콜"><div className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-sm text-slate-300">HTTP/HTTPS</div></Field>
              <Field label="환경"><Select value={nf.env} onChange={(e) => setNf({ ...nf, env: e.target.value })}>{NQA_LOAD_ENVS.map((p) => <option key={p}>{p}</option>)}</Select></Field>
            </div>
            <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setModal(false)}>취소</Btn><Btn kind="primary" icon={Plus} onClick={addSut}>추가</Btn></div>
          </div>
        </div>
      )}
      <Toast msg={msg} />
    </div>
  );
}

/* ═══════════ 측정 시나리오 (부하 · 대상 선택 + 워크로드 + 부하 형상) ═══════════ */
const SHAPE_PROFILES = {
  "스테디": [[0, 0], [8, 90], [92, 90], [100, 0]],
  "램프업": [[0, 0], [72, 100], [90, 100], [100, 0]],
  "스파이크": [[0, 22], [44, 22], [50, 100], [56, 22], [100, 22]],
  "스트레스": [[0, 0], [12, 32], [32, 32], [38, 58], [58, 58], [64, 82], [82, 82], [88, 100], [100, 100]],
  "소크": [[0, 0], [9, 68], [94, 68], [100, 0]],
};
function ShapeChart({ shape }) {
  const pts = SHAPE_PROFILES[shape] || SHAPE_PROFILES["스테디"];
  const line = pts.map((p) => p[0] + "," + (38 - p[1] / 100 * 34).toFixed(1)).join(" ");
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-16 w-full rounded-lg bg-slate-950">
      <polygon points={"0,38 " + line + " 100,38"} fill="#134e4a" opacity="0.45" />
      <polyline points={line} fill="none" stroke="#2dd4bf" strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}
export function NqaScenarioScreen() {
  const { nqaScenarios, addNqaScenario, updateNqaScenario, removeNqaScenario, nqaSystems, datasets, nqaScnFocus, setNqaScnFocus } = useApp();
  const [msg, flash] = useToast();
  const list = nqaScenarios || [];
  const systems = (nqaSystems || []).filter((s) => s.subtype === "load");
  const [sel, setSel] = useState(0);
  useEffect(() => { if (nqaScnFocus != null) { const i = list.findIndex((s) => s.id === nqaScnFocus); if (i >= 0) setSel(i); if (setNqaScnFocus) setNqaScnFocus(null); } }, [nqaScnFocus]);
  const scn = list[sel] || list[0] || {};
  const [draft, setDraft] = useState({});
  const cfg = { ...scn, ...draft };
  const dirty = Object.keys(draft).length > 0;
  const setScn = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const sut = systems.find((s) => s.id === cfg.sutId) || {};
  const endpoints = cfg.endpoints || [];
  const wsum = endpoints.reduce((a, e) => a + (e.weight || 0), 0);
  const selDataset = (datasets || []).find((d) => d.name === cfg.dataset);
  const feedCols = selDataset ? selDataset.columns : [];
  const usedRowVars = [...new Set(endpoints.flatMap((ep) => { const txt = (ep.body || "") + " " + ((ep.headers || []).map((h) => h.v).join(" ")); return (txt.match(/\$\{row\.([a-zA-Z0-9_]+)\}/g) || []).map((x) => x.replace(/\$\{row\.|\}/g, "")); }))];
  const missingCols = usedRowVars.filter((v) => !feedCols.includes(v));
  const producedVars = [...new Set(endpoints.flatMap((ep) => (ep.extracts || []).map((x) => x.var).filter(Boolean)))];
  const usedCorrVars = [...new Set(endpoints.flatMap((ep) => { const txt = (ep.body || "") + " " + ((ep.headers || []).map((h) => h.v).join(" ")); return (txt.match(/\$\{([a-zA-Z0-9_]+)\}/g) || []).map((x) => x.replace(/\$\{|\}/g, "")); }))];
  const missingVars = usedCorrVars.filter((v) => !producedVars.includes(v));
  const hasCorrelation = usedCorrVars.some((v) => producedVars.includes(v));
  const journey = cfg.journey || [];
  const isJourney = hasCorrelation || !!cfg.forceOrder;
  const unit = cfg.unit || "가상 사용자(VU)";
  const isVu = unit.indexOf("VU") >= 0;
  const totalMin = (cfg.rampUp || 0) + (cfg.sustain || 0) + (cfg.rampDown || 0);
  const shapeHint = (NQA_LOAD_SHAPES.find((s) => s.id === cfg.shape) || {}).hint || "";
  const saveCfg = () => {
    if (!cfg.sutId) { flash("부하 대상을 선택하세요"); return; }
    if (isJourney && journey.length === 0) { flash("순차 진행에 스텝을 1개 이상 추가하세요"); return; }
    if (!cfg.peak) { flash("피크 부하를 입력하세요"); return; }
    updateNqaScenario(scn.id, draft); setDraft({}); flash("시나리오 저장됨");
  };
  const guardSwitch = (fn) => { if (dirty && !window.confirm("저장하지 않은 변경이 있습니다. 이동하시겠습니까?")) return; setDraft({}); fn(); };
  useEffect(() => { setDraft({}); }, [scn.id]);
  const choose = (i) => guardSwitch(() => setSel(i));
  const [modal, setModal] = useState(false);
  const [nf, setNf] = useState({ name: "", sutId: 0, shape: "스테디" });
  const [epModal, setEpModal] = useState(false);
  const [ef, setEf] = useState({ method: "GET", path: "", weight: 10, headers: [], body: "", expect: 200, extracts: [] });
  const openModal = () => { setNf({ name: "", sutId: (systems[0] || {}).id || 0, shape: "스테디" }); setModal(true); };
  const create = () => {
    if (!nf.sutId) { flash("부하 대상을 선택하세요"); return; }
    const s0 = systems.find((s) => s.id === nf.sutId) || {};
    const name = nf.name.trim() || (s0.name || "부하") + " 부하";
    const id = Math.max(0, ...list.map((x) => x.id)) + 1;
    const ns = { id, name, sutId: nf.sutId, unit: "가상 사용자(VU)", shape: nf.shape, peak: 500, rampUp: 3, sustain: 15, rampDown: 2, thinkTime: 2, status: "초안", endpoints: [], dataset: "", forceOrder: false, journey: [] };
    guardSwitch(() => { addNqaScenario(ns); setSel(0); setModal(false); flash(name + " 생성 (초안)"); });
  };
  const delScn = (i, s) => { if (list.length <= 1) { flash("최소 1개 시나리오는 유지해야 합니다"); return; } if (!window.confirm(s.name + " 시나리오를 삭제할까요?")) return; guardSwitch(() => { removeNqaScenario(s.id); setSel(0); flash(s.name + " 삭제됨"); }); };
  const setJourney = (j) => setScn({ journey: j });
  const addJourneyStep = () => { const e0 = endpoints[0]; if (!e0) { flash("엔드포인트를 먼저 추가하세요"); return; } setJourney([...journey, { method: e0.method, path: e0.path }]); };
  const addEp = () => { if (!ef.path.trim()) { flash("경로를 입력하세요"); return; } setScn({ endpoints: [...endpoints, { ...ef, weight: +ef.weight || 0, expect: +ef.expect || 200 }] }); setEpModal(false); setEf({ method: "GET", path: "", weight: 10, headers: [], body: "", expect: 200, extracts: [] }); flash("엔드포인트가 추가되었습니다"); };
  const delEp = (idx) => setScn({ endpoints: endpoints.filter((_, j) => j !== idx) });
  const normalize = () => { if (!wsum) return; setScn({ endpoints: endpoints.map((e) => ({ ...e, weight: Math.round((e.weight || 0) / wsum * 100) })) }); flash("비율 100%로 정규화됨"); };
  const updJourney = (i, patch) => setJourney(journey.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const delJourney = (i) => setJourney(journey.filter((_, j) => j !== i));
  const mvJourney = (i, d) => { const j = i + d; if (j < 0 || j >= journey.length) return; const a = journey.slice(); const t = a[i]; a[i] = a[j]; a[j] = t; setJourney(a); };
  if (!list.length) return <div className="p-8 text-center text-sm text-slate-500">측정 시나리오가 없습니다.</div>;
  return (
    <div className="space-y-4">
      <PageToolbar desc="부하 대상 선택 · 워크로드(비율 혼합/순차 진행) · 부하 형상(VU/RPS 램프·지속)" />
      <SubSwitch />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-3">
          <Btn kind="primary" icon={Plus} className="w-full" onClick={openModal}>새 시나리오</Btn>
          {list.map((s, i) => {
            const su = systems.find((x) => x.id === s.sutId) || {};
            const j = epCorrelated(s.endpoints) || s.forceOrder;
            return (
              <Card key={s.id} className={"cursor-pointer p-3 " + (sel === i ? "border-teal-500" : "hover:border-slate-700")}>
                <div onClick={() => choose(i)}>
                  <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-100">{s.name}</span><button onClick={(e) => { e.stopPropagation(); delScn(i, s); }} className="text-slate-500 hover:text-red-400" title="삭제"><X size={12} /></button></div>
                  <div className="mt-1 flex flex-wrap items-center gap-1"><Badge kind="info">{su.name || "대상 미지정"}</Badge><Badge kind={j ? "active" : "info"}>{j ? "순차 진행" : "비율 혼합"}</Badge></div>
                  <div className="mt-1 text-xs text-slate-500">{s.shape} · 피크 {s.peak} {(s.unit || "").indexOf("VU") >= 0 ? "VU" : "RPS"}</div>
                  <div className="mt-0.5 text-xs text-slate-600">수정 {s.updatedBy || "—"} · {s.updatedAt || "—"}</div>
                </div>
              </Card>
            );
          })}
        </div>
        <div className="col-span-9 space-y-3">
          <Card className="flex flex-wrap items-center justify-between gap-2 p-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5"><div className="w-64 shrink-0"><Input value={cfg.name || ""} onChange={(e) => setScn({ name: e.target.value })} /></div><span className="shrink-0"><Badge kind="info">{sut.name || "대상 미지정"}</Badge></span><span className="shrink-0"><Badge kind={isJourney ? "active" : "info"}>{isJourney ? "순차 진행" : "비율 혼합"}</Badge></span></div>
            <div className="flex items-center gap-3">{dirty && <span className="text-xs text-amber-300">미저장 변경</span>}<Btn kind="primary" icon={Save} onClick={saveCfg} disabled={!dirty}>시나리오 저장</Btn></div>
          </Card>

          <div className="flex items-center gap-3 text-xs text-slate-500"><span>생성 <span className="text-slate-400">{cfg.createdBy || "—"}</span> · {cfg.createdAt || "—"}</span><span className="text-slate-600">·</span><span>수정 <span className="text-slate-400">{cfg.updatedBy || "—"}</span> · {cfg.updatedAt || "—"}</span></div>
          <Card className="p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Link2 size={15} className="text-teal-400" />부하 대상 <span className="text-xs font-normal text-slate-500">· 부하를 보낼 대상 시스템</span></div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="대상(SUT)" hint="생성 시 확정 · 변경 불가"><div className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-sm text-slate-300">{sut.name || "대상 미지정"}</div></Field>
              <Field label="연결"><div className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-xs text-slate-400">{sut.protocol || "-"} · {sut.env || "-"} · 인증 {(sut.auth || {}).type || "-"}</div></Field>
            </div>
            {sut.baseUrl && <div className="truncate font-mono text-xs text-slate-500">{sut.baseUrl}</div>}
            <div className="text-xs text-slate-500">엔드포인트는 이 대상 기준으로 작성됩니다. 다른 시스템은 새 시나리오로 만드세요.</div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Zap size={15} className="text-teal-400" />요청 엔드포인트 <span className="text-xs font-normal text-slate-500">· 이 시나리오가 보낼 요청</span><span className="text-xs" style={{ color: wsum === 100 ? "#34d399" : "#fbbf24" }}>비율 {wsum}%{wsum !== 100 ? " ⚠" : ""}</span>{endpoints.length > 0 && wsum !== 100 && wsum > 0 && <button onClick={normalize} className="text-xs text-teal-400 hover:underline">100%로 정규화</button>}</div>
              <Btn icon={Plus} onClick={() => { setEf({ method: "GET", path: "", weight: 10, headers: [], body: "", expect: 200, extracts: [] }); setEpModal(true); }}>엔드포인트 추가</Btn>
            </div>
            {endpoints.length === 0 ? <div className="rounded-lg bg-slate-800 p-3 text-xs text-slate-500">엔드포인트가 없습니다 — 부하를 걸 요청을 추가하세요.</div> : (
              <div className="space-y-1.5">
                {endpoints.map((ep, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                    <Badge kind={M_LK[ep.method] || "info"}>{ep.method}</Badge>
                    <span className="font-mono text-xs text-slate-300">{ep.path}</span>
                    {ep.body && <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">본문</span>}
                    {(ep.extracts && ep.extracts.length > 0) && <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-teal-300">추출 {ep.extracts.length}</span>}
                    <div className="flex-1" />
                    <span className="text-xs text-slate-500">→ {ep.expect || 200}</span>
                    <span className="text-xs text-slate-400">비율 {ep.weight || 0}%</span>
                    <button onClick={() => delEp(idx)} className="text-slate-500 hover:text-red-400" title="삭제"><X size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </Card>
          <Card className="p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Link2 size={15} className="text-teal-400" />테스트 데이터 <span className="text-xs font-normal text-slate-500">· VU별로 서로 다른 값 공급</span></div>
            <Field label="데이터셋" hint="공통 데이터셋 메뉴에서 관리 · 컬럼이 ${row.X} 매핑 기준"><DatasetPicker value={cfg.dataset || ""} onChange={(v) => setScn({ dataset: v })} noneLabel="선택 안 함" /></Field>
            {selDataset && <div className="text-xs text-slate-500">컬럼: <span className="text-slate-300">{selDataset.columns.join(", ")}</span> · {(selDataset.rowCount != null ? selDataset.rowCount : selDataset.rows.length).toLocaleString()}행{selDataset.desc ? " · " + selDataset.desc : ""}</div>}
            {usedRowVars.length > 0 && <div className="text-xs text-slate-500">본문/헤더 참조: <span className="text-slate-300">{usedRowVars.join(", ")}</span>{!cfg.dataset ? <span className="text-amber-300"> · ⚠ 데이터셋 미선택</span> : missingCols.length > 0 && <span className="text-amber-300"> · ⚠ 데이터셋에 없는 컬럼: {missingCols.join(", ")}</span>}</div>}
          </Card>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Package size={15} className="text-teal-400" />워크로드 <span className="text-xs font-normal text-slate-500">· {isJourney ? "순차 진행 (정해진 순서)" : "비율 혼합 (무순서·비율)"}</span></div>
              {hasCorrelation ? <span className="text-xs text-teal-400">상관 감지 → 순차 진행 자동</span> : <div className="flex items-center gap-2 text-xs text-slate-400"><span>순서 강제</span><Toggle on={!!cfg.forceOrder} onClick={() => setScn({ forceOrder: !cfg.forceOrder })} /></div>}
            </div>
            {isJourney && missingVars.length > 0 && <div className="rounded-lg border border-amber-800 bg-amber-950 px-2.5 py-1.5 text-xs text-amber-300">⚠ 미정의 상관 변수: {missingVars.map((v) => "${" + v + "}").join(", ")} — 엔드포인트 추출(extract)로 생산되지 않았습니다.</div>}
            {!isJourney ? (
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500">정한 비율(가중치)대로 무순서로 요청을 보냅니다.</div>
                {endpoints.length === 0 ? <div className="rounded-lg bg-slate-800 p-3 text-xs text-slate-500">엔드포인트가 없습니다 — 위 &quot;요청 엔드포인트&quot;에서 추가하세요.</div> : endpoints.map((ep, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                    <Badge kind={M_LK[ep.method] || "info"}>{ep.method}</Badge>
                    <span className="flex-1 truncate font-mono text-slate-300">{ep.path}</span>
                    <span className="text-xs text-slate-500">{ep.weight || 0}%</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <div className="text-xs text-slate-500">정해진 순서대로 진행 — 상관(추출값)이 이 순서로 흐릅니다.</div>
                  <Btn icon={Plus} onClick={addJourneyStep}>스텝 추가</Btn>
                </div>
                {journey.length === 0 ? <div className="rounded-lg bg-slate-800 p-3 text-xs text-slate-500">스텝이 없습니다 — 엔드포인트를 순서대로 배치하세요.</div> : journey.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-xs text-slate-400">{i + 1}</span>
                    <div className="flex-1"><Select value={s.method + " " + s.path} onChange={(e) => { const ep = endpoints.find((x) => x.method + " " + x.path === e.target.value); if (ep) updJourney(i, { method: ep.method, path: ep.path }); }}>{endpoints.map((ep, j) => <option key={j} value={ep.method + " " + ep.path}>{ep.method} {ep.path}</option>)}</Select></div>
                    <button onClick={() => mvJourney(i, -1)} className="text-xs text-slate-500 hover:text-slate-300">▲</button><button onClick={() => mvJourney(i, 1)} className="text-xs text-slate-500 hover:text-slate-300">▼</button>
                    <button onClick={() => delJourney(i)} className="text-slate-500 hover:text-red-400"><X size={13} /></button>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><TrendingUp size={15} className="text-teal-400" />부하 형상 <span className="text-xs font-normal text-slate-500">· 얼마나 · 어떤 곡선으로</span></div>
              <Seg options={NQA_LOAD_UNITS} value={unit} onChange={(v) => setScn({ unit: v })} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="부하 유형"><Select value={cfg.shape || "스테디"} onChange={(e) => setScn({ shape: e.target.value })}>{NQA_LOAD_SHAPES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</Select></Field>
              <Field label={isVu ? "피크 VU" : "목표 RPS"}><Input type="number" value={cfg.peak || 0} onChange={(e) => setScn({ peak: Number(e.target.value) })} /></Field>
            </div>
            {shapeHint && <div className="text-xs text-slate-500">{shapeHint}</div>}
            <ShapeChart shape={cfg.shape || "스테디"} />
            <div className="grid grid-cols-4 gap-2">
              <Field label="램프업(분)"><Input type="number" value={cfg.rampUp || 0} onChange={(e) => setScn({ rampUp: Number(e.target.value) })} /></Field>
              <Field label="지속(분)"><Input type="number" value={cfg.sustain || 0} onChange={(e) => setScn({ sustain: Number(e.target.value) })} /></Field>
              <Field label="램프다운(분)"><Input type="number" value={cfg.rampDown || 0} onChange={(e) => setScn({ rampDown: Number(e.target.value) })} /></Field>
              <Field label={isVu ? "생각시간(초)" : "생각시간(RPS 무관)"}><Input type="number" value={cfg.thinkTime || 0} onChange={(e) => setScn({ thinkTime: Number(e.target.value) })} disabled={!isVu} /></Field>
            </div>
            <div className="rounded-lg bg-slate-800 p-2.5 text-xs text-slate-400">총 {totalMin}분 · 피크 {cfg.peak || 0} {isVu ? "VU" : "RPS"} · {isVu ? "닫힌 모델(VU+생각시간)" : "열린 모델(도착률 고정)"}. SLA 합격 임계는 <span className="text-slate-300">측정 계획</span>에서 판정합니다.</div>
          </Card>
        </div>
      </div>
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setModal(false)}>
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-semibold text-slate-100">새 부하 시나리오</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="이름 (비우면 자동)"><Input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder="시나리오 이름" /></Field>
              <Field label="부하 대상"><Select value={nf.sutId || ""} onChange={(e) => setNf({ ...nf, sutId: Number(e.target.value) })}><option value="">선택하세요</option>{systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
            </div>
            <div className="rounded-lg bg-slate-800 p-2.5 text-xs text-slate-400">생성 후 &quot;요청 엔드포인트&quot;에서 요청을 추가합니다. 워크로드(비율 혼합/순차 진행)·부하 형상은 상세에서 설정합니다.</div>
            <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setModal(false)}>취소</Btn><Btn kind="primary" icon={Plus} onClick={create}>생성</Btn></div>
          </div>
        </div>
      )}
      {epModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEpModal(false)}>
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-3" style={{ maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-semibold text-slate-100">요청 엔드포인트 추가</div>
            <div className="grid grid-cols-4 gap-3">
              <Field label="메서드"><Select value={ef.method} onChange={(e) => setEf({ ...ef, method: e.target.value })}>{NQA_HTTP_METHODS.map((m) => <option key={m}>{m}</option>)}</Select></Field>
              <div className="col-span-2"><Field label="경로"><Input value={ef.path} onChange={(e) => setEf({ ...ef, path: e.target.value })} placeholder="/v1/plans" /></Field></div>
              <Field label="비율(%)"><Input type="number" value={ef.weight} onChange={(e) => setEf({ ...ef, weight: e.target.value })} /></Field>
            </div>
            <Field label="요청 헤더">
              {(ef.headers || []).map((h, i) => (<div key={i} className="mb-1.5 flex gap-2"><Input value={h.k} onChange={(e) => setEf({ ...ef, headers: ef.headers.map((x, j) => (j === i ? { ...x, k: e.target.value } : x)) })} placeholder="Header" /><Input value={h.v} onChange={(e) => setEf({ ...ef, headers: ef.headers.map((x, j) => (j === i ? { ...x, v: e.target.value } : x)) })} placeholder="Value (예: Bearer ${token})" /><button onClick={() => setEf({ ...ef, headers: ef.headers.filter((_, j) => j !== i) })} className="px-1 text-slate-500 hover:text-red-400"><X size={14} /></button></div>))}
              <button onClick={() => setEf({ ...ef, headers: [...(ef.headers || []), { k: "", v: "" }] })} className="text-xs text-teal-400">+ 헤더 추가</button>
            </Field>
            <Field label="요청 본문 (Body) · 파라미터화 지원"><textarea value={ef.body} onChange={(e) => setEf({ ...ef, body: e.target.value })} rows={3} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-mono text-slate-200 outline-none focus:border-teal-500" placeholder={'{ "phone": "${row.phone}" }'} /></Field>
            <Field label="응답 추출 (상관)" hint="JSONPath로 값 추출 → 다음 요청에 재사용">
              {(ef.extracts || []).map((x, i) => (<div key={i} className="mb-1.5 flex gap-2"><Input value={x.var} onChange={(e) => setEf({ ...ef, extracts: ef.extracts.map((y, j) => (j === i ? { ...y, var: e.target.value } : y)) })} placeholder="변수명 (token)" /><Input value={x.path} onChange={(e) => setEf({ ...ef, extracts: ef.extracts.map((y, j) => (j === i ? { ...y, path: e.target.value } : y)) })} placeholder="$.data.token" /><button onClick={() => setEf({ ...ef, extracts: ef.extracts.filter((_, j) => j !== i) })} className="px-1 text-slate-500 hover:text-red-400"><X size={14} /></button></div>))}
              <button onClick={() => setEf({ ...ef, extracts: [...(ef.extracts || []), { var: "", path: "" }] })} className="text-xs text-teal-400">+ 추출 추가</button>
            </Field>
            <Field label="기대 상태코드"><Input type="number" value={ef.expect} onChange={(e) => setEf({ ...ef, expect: e.target.value })} className="w-28" /></Field>
            <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setEpModal(false)}>취소</Btn><Btn kind="primary" icon={Plus} onClick={addEp}>추가</Btn></div>
          </div>
        </div>
      )}
      <Toast msg={msg} />
    </div>
  );
}

export function NqaPlanScreen() {
  const { nqaPlans, addNqaPlan, updateNqaPlan, removeNqaPlan, nqaScenarios, nqaSystems, jiraConfig } = useApp();
  const [msg, flash] = useToast();
  const list = nqaPlans || [];
  const scns = nqaScenarios || [];
  const systems = nqaSystems || [];
  const [sel, setSel] = useState(0);
  const pl = list[sel] || list[0] || {};
  const [draft, setDraft] = useState({});
  const cfg = { ...pl, ...draft };
  const dirty = Object.keys(draft).length > 0;
  const setPlan = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setSla = (patch) => setPlan({ sla: { ...(cfg.sla || {}), ...patch } });
  const jgc = jiraConfig || {};
  const cjira = cfg.jira || { override: false };
  const setJira = (patch) => setPlan({ jira: { ...cjira, ...patch } });
  const toggleJira = () => setPlan({ jira: cjira.override ? { override: false } : { override: true, project: cjira.project || jgc.project || "", issueType: cjira.issueType || jgc.issueType || "Bug", assignee: cjira.assignee != null ? cjira.assignee : (jgc.assignee || ""), labels: cjira.labels != null ? cjira.labels : (jgc.labels || ""), titleTpl: cjira.titleTpl || jgc.titleTpl || "" } });
  const scn = scns.find((s) => s.id === cfg.scenarioId) || {};
  const sut = systems.find((s) => s.id === scn.sutId) || {};
  const sla = cfg.sla || {};
  const num = (v) => (v === "" || v == null ? "" : Number(v));
  const saveCfg = () => { if (!cfg.scenarioId) { flash("측정 시나리오를 선택하세요"); return; } updateNqaPlan(pl.id, draft); setDraft({}); flash("측정 계획 저장됨"); };
  const guardSwitch = (fn) => { if (dirty && !window.confirm("저장하지 않은 변경이 있습니다. 이동하시겠습니까?")) return; setDraft({}); fn(); };
  useEffect(() => { setDraft({}); }, [pl.id]);
  const choose = (i) => guardSwitch(() => setSel(i));
  const [modal, setModal] = useState(false);
  const [nf, setNf] = useState({ name: "", scenarioId: 0 });
  const nfSut = systems.find((x) => x.id === ((scns.find((s) => s.id === nf.scenarioId) || {}).sutId)) || {};
  const openModal = () => { setNf({ name: "", scenarioId: (scns[0] || {}).id || 0 }); setModal(true); };
  const create = () => {
    if (!nf.scenarioId) { flash("측정 시나리오를 선택하세요"); return; }
    const s0 = scns.find((s) => s.id === nf.scenarioId) || {};
    const name = nf.name.trim() || (s0.name || "부하") + " 계획";
    const id = Math.max(0, ...list.map((x) => x.id)) + 1;
    const np = { id, name, scenarioId: nf.scenarioId, status: "초안", sla: { p95: 2000, p99: 3000, errRate: 1.0, minRps: 500 } };
    guardSwitch(() => { addNqaPlan(np); setSel(0); setModal(false); flash(name + " 생성 (초안)"); });
  };
  const delPlan = (i, p) => { if (list.length <= 1) { flash("최소 1개 계획은 유지해야 합니다"); return; } if (!window.confirm(p.name + " 계획을 삭제할까요?")) return; guardSwitch(() => { removeNqaPlan(p.id); setSel(0); flash(p.name + " 삭제됨"); }); };
  if (!list.length) return <div className="p-8 text-center text-sm text-slate-500">측정 계획이 없습니다.</div>;
  const workloadTxt = scn.id ? (((epCorrelated(scn.endpoints) || scn.forceOrder) ? "순차 진행" : "비율 혼합") + " · " + scn.shape + " · 피크 " + scn.peak + " " + ((scn.unit || "").indexOf("VU") >= 0 ? "VU" : "RPS")) : "";
  const slaParts = [];
  if (sla.p95) slaParts.push("p95 ≤ " + sla.p95 + "ms");
  if (sla.p99) slaParts.push("p99 ≤ " + sla.p99 + "ms");
  if (sla.errRate !== "" && sla.errRate != null) slaParts.push("에러율 ≤ " + sla.errRate + "%");
  if (sla.minRps) slaParts.push("처리량 ≥ " + sla.minRps + " RPS");
  const slaText = slaParts.length ? slaParts.join(" · ") : "임계 미설정";
  return (
    <div className="space-y-4">
      <PageToolbar desc="측정 시나리오 + SLA 판정 임계(합격/불합격) — 계획이 아우름" />
      <SubSwitch />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-3">
          <Btn kind="primary" icon={Plus} className="w-full" onClick={openModal}>새 계획</Btn>
          {list.map((p, i) => {
            const ps = scns.find((s) => s.id === p.scenarioId) || {};
            const pu = systems.find((s) => s.id === ps.sutId) || {};
            return (
              <Card key={p.id} className={"cursor-pointer p-3 " + (sel === i ? "border-teal-500" : "hover:border-slate-700")}>
                <div onClick={() => choose(i)}>
                  <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-100">{p.name}</span><div className="flex items-center gap-1.5"><Badge kind={p.status === "활성" ? "pass" : "draft"}>{p.status}</Badge><button onClick={(e) => { e.stopPropagation(); delPlan(i, p); }} className="text-slate-500 hover:text-red-400" title="삭제"><X size={12} /></button></div></div>
                  <div className="mt-1 flex flex-wrap items-center gap-1"><Badge kind="info">{pu.name || "대상 미지정"}</Badge></div>
                  <div className="mt-1 text-xs text-slate-500">p95 ≤ {(p.sla || {}).p95}ms · 에러 ≤ {(p.sla || {}).errRate}%</div>
                  <div className="mt-0.5 text-xs text-slate-600">수정 {p.updatedBy || "—"} · {p.updatedAt || "—"}</div>
                </div>
              </Card>
            );
          })}
        </div>
        <div className="col-span-9 space-y-3">
          <Card className="flex flex-wrap items-center justify-between gap-2 p-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5"><div className="w-64 shrink-0"><Input value={cfg.name || ""} onChange={(e) => setPlan({ name: e.target.value })} /></div><span className="shrink-0"><Badge kind="info">{sut.name || "대상 미지정"}</Badge></span></div>
            <div className="flex items-center gap-3"><div className="flex items-center gap-2 text-sm text-slate-300"><span>{cfg.status === "활성" ? "활성" : "초안"}</span><Toggle on={cfg.status === "활성"} onClick={() => setPlan({ status: cfg.status === "활성" ? "초안" : "활성" })} /></div>{dirty && <span className="text-xs text-amber-300">미저장 변경</span>}<Btn kind="primary" icon={Save} onClick={saveCfg} disabled={!dirty}>계획 저장</Btn></div>
          </Card>
          <div className="text-xs text-slate-500">생성 <span className="text-slate-400">{pl.createdBy || "—"}</span> · {pl.createdAt || "—"} · 수정 <span className="text-slate-400">{pl.updatedBy || "—"}</span> · {pl.updatedAt || "—"}</div>

          <Card className="p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Link2 size={15} className="text-teal-400" />측정 시나리오 <span className="text-xs font-normal text-slate-500">· 대상·워크로드·부하 형상 포함</span></div>
            <Field label="측정 시나리오"><Select value={cfg.scenarioId || ""} onChange={(e) => setPlan({ scenarioId: Number(e.target.value) })}><option value="">선택하세요</option>{scns.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
            {scn.id ? (
              <div className="rounded-lg bg-slate-800 p-2.5 text-xs text-slate-400">대상 환경 <span className="text-slate-200">{sut.name}</span> · {sut.env || "-"} · <span className="font-mono">{sut.baseUrl}</span><br />워크로드 <span className="text-slate-300">{workloadTxt}</span></div>
            ) : <div className="rounded-lg border border-amber-800 bg-amber-950 px-2.5 py-1.5 text-xs text-amber-300">시나리오를 선택하면 대상 환경·부하 형상이 계획에 반영됩니다.</div>}
          </Card>

          <Card className="p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Activity size={15} className="text-teal-400" />SLA 판정 임계 <span className="text-xs font-normal text-slate-500">· 합격/불합격 기준</span></div>
            <div className="grid grid-cols-4 gap-3">
              <Field label="p95 응답 ≤ (ms)"><Input type="number" value={sla.p95 ?? ""} onChange={(e) => setSla({ p95: num(e.target.value) })} /></Field>
              <Field label="p99 응답 ≤ (ms)" hint="비우면 미적용"><Input type="number" value={sla.p99 ?? ""} onChange={(e) => setSla({ p99: num(e.target.value) })} /></Field>
              <Field label="에러율 ≤ (%)"><Input type="number" value={sla.errRate ?? ""} onChange={(e) => setSla({ errRate: num(e.target.value) })} /></Field>
              <Field label="최소 처리량 ≥ (RPS)" hint="비우면 미적용"><Input type="number" value={sla.minRps ?? ""} onChange={(e) => setSla({ minRps: num(e.target.value) })} /></Field>
            </div>
            <div className="text-xs text-slate-500">측정 구간 = 워밍업(초기 램프업) 제외, 목표 부하 도달 이후 구간에서 집계 · 지표 = 전체 트랜잭션 기준 p95/p99·에러율·처리량 · 에러 = 연결 실패·타임아웃·HTTP 5xx·검증 실패.</div>
            <div className="rounded-lg border border-emerald-900 bg-emerald-950 px-2.5 py-1.5 text-xs text-emerald-300">합격 조건: <span className="text-emerald-100">{slaText}</span> 를 모두 만족</div>
          </Card>
          {(jgc.connected !== false) && (
          <Card className="mt-3 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-200"><Bug size={15} className="text-amber-400" />결함 트래커 (Jira)</div>
              <div className="flex items-center gap-2 text-xs text-slate-400">이 계획 재정의 <Toggle on={!!cjira.override} onClick={toggleJira} /></div>
            </div>
            {!cjira.override ? (
              <div className="mt-2 rounded-lg bg-slate-800 p-3 text-xs text-slate-400">전역 Jira 설정 사용 · 프로젝트 <span className="text-slate-300">{jgc.project || "—"}</span> · 이슈유형 {jgc.issueType || "—"} <span className="text-slate-600">(결함 화면의 Jira 연동에서 관리)</span></div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="text-xs text-slate-500">연결(URL·인증)은 전역, 이 계획의 결함 라우팅만 재정의합니다.</div>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="프로젝트 키"><Input value={cjira.project || ""} onChange={(e) => setJira({ project: e.target.value })} placeholder="PERFQA" /></Field>
                  <Field label="이슈 유형"><Select value={cjira.issueType || "Bug"} onChange={(e) => setJira({ issueType: e.target.value })}><option>Bug</option><option>Task</option><option>Story</option></Select></Field>
                  <Field label="기본 담당자"><Input value={cjira.assignee || ""} onChange={(e) => setJira({ assignee: e.target.value })} placeholder="assignee" /></Field>
                </div>
                <Field label="라벨 (쉼표 구분)"><Input value={cjira.labels || ""} onChange={(e) => setJira({ labels: e.target.value })} placeholder="nqa, load" /></Field>
              </div>
            )}
          </Card>
          )}
        </div>
      </div>
      {modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={() => setModal(false)}>
          <div className="w-full max-w-md space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold text-slate-100">새 측정 계획</div>
            <Field label="이름 (비우면 자동)"><Input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder="계획 이름" /></Field>
            <Field label="측정 시나리오"><Select value={nf.scenarioId || ""} onChange={(e) => setNf({ ...nf, scenarioId: Number(e.target.value) })}><option value="">선택하세요</option>{scns.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
            {nf.scenarioId ? <div className="text-xs text-slate-500">→ 대상 환경 <span className="text-slate-300">{nfSut.name || "-"}</span> ({nfSut.env || "-"})</div> : null}
            <div className="rounded-lg bg-slate-800 p-2.5 text-xs text-slate-400">SLA 임계는 생성 후 기본값으로 채워지며, 상세에서 조정합니다.</div>
            <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setModal(false)}>취소</Btn><Btn kind="primary" icon={Plus} onClick={create}>생성</Btn></div>
          </div>
        </div>
      )}
      <Toast msg={msg} />
    </div>
  );
}

/* ═══════════ 측정 실행 · 실행 이력 · 성능 추이 ═══════════ */
const nqaNow = () => { const d = new Date(); const z = (n) => String(n).padStart(2, "0"); return d.getFullYear() + "-" + z(d.getMonth() + 1) + "-" + z(d.getDate()) + " " + z(d.getHours()) + ":" + z(d.getMinutes()); };
const simResult = (scn, sla) => {
  const isVu = (scn.unit || "").indexOf("VU") >= 0;
  const peak = scn.peak || 500;
  const rps = Math.round((isVu ? peak * 0.8 : peak) * (0.9 + Math.random() * 0.15));
  const p95 = Math.round((sla.p95 || 1500) * (0.7 + Math.random() * 0.55));
  const p50 = Math.round(p95 * (0.35 + Math.random() * 0.1));
  const p99 = Math.round(p95 * (1.4 + Math.random() * 0.3));
  const errRate = +(Math.random() * 1.6).toFixed(2);
  const durMin = (scn.rampUp || 0) + (scn.sustain || 0) + (scn.rampDown || 0);
  const totalReq = Math.round(rps * durMin * 60);
  const breaches = [];
  if (sla.p95 && p95 > sla.p95) breaches.push("p95 " + p95 + " > " + sla.p95 + "ms");
  if (sla.p99 && p99 > sla.p99) breaches.push("p99 " + p99 + " > " + sla.p99 + "ms");
  if (sla.errRate != null && sla.errRate !== "" && errRate > sla.errRate) breaches.push("에러율 " + errRate + " > " + sla.errRate + "%");
  if (sla.minRps && rps < sla.minRps) breaches.push("처리량 " + rps + " < " + sla.minRps + " RPS");
  return { rps, errRate, p50, p95, p99, throughput: rps, totalReq, verdict: breaches.length ? "불합격" : "합격", breaches };
};

export function NqaRunScreen({ nav }) {
  const { nqaPlans, nqaScenarios, nqaSystems, nqaRuns, addNqaRun, updateNqaRun, removeNqaRun, currentUser, defects, addDefect, jiraConfig } = useApp();
  const jrOf = (pl) => ((jiraConfig && jiraConfig.connected !== false) ? ((pl && pl.jira && pl.jira.override) ? pl.jira : jiraConfig) : {});
  const [msg, flash] = useToast();
  const plans = (nqaPlans || []).filter((p) => p.status === "활성");
  const [planId, setPlanId] = useState((plans[0] || {}).id || 0);
  const plan = plans.find((p) => p.id === planId) || plans[0] || {};
  const scn = (nqaScenarios || []).find((s) => s.id === plan.scenarioId) || {};
  const sut = (nqaSystems || []).find((s) => s.id === scn.sutId) || {};
  const sla = plan.sla || {};
  const [live, setLive] = useState(null);
  const [resv, setResv] = useState(false);
  const [when, setWhen] = useState("");
  const running = live && !live.done;
  const durMin = (scn.rampUp || 0) + (scn.sustain || 0) + (scn.rampDown || 0);
  const runNow = () => {
    if (running) return;
    if (!plan.id) { flash("실행할 계획을 선택하세요"); return; }
    const target = simResult(scn, sla);
    const runId = "RUN-" + nqaNow().slice(5, 16).replace(/[- :]/g, "");
    const no = (nqaRuns || []).filter((r) => r.planId === plan.id).length + 1;
    setLive({ progress: 0, rps: 0, err: 0, p95: 0, target, runId, done: false });
    let prog = 0;
    const step = () => {
      prog += 12 + Math.random() * 8;
      if (prog >= 100) {
        setLive((l) => ({ ...(l || {}), progress: 100, rps: target.rps, err: target.errRate, p95: target.p95, done: true }));
        addNqaRun({ id: runId, planId: plan.id, no, startedAt: nqaNow(), endedAt: stampPlus(durMin * 60), durationSec: durMin * 60, status: "완료", by: currentUser || "이민준", result: target });
        flash("측정 완료 · " + target.verdict);
        return;
      }
      const f = prog / 100;
      setLive((l) => ({ ...(l || {}), progress: Math.round(prog), rps: Math.round(target.rps * f), err: +(target.errRate * f).toFixed(2), p95: Math.round(target.p95 * f) }));
      setTimeout(step, 340);
    };
    setTimeout(step, 340);
  };
  const regDefect = () => {
    if (!live || !live.done || live.target.verdict !== "불합격") return;
    if ((defects || []).some((d) => d.tc === live.runId)) { flash("이미 결함이 등록된 실행입니다"); return; }
    { const jr = jrOf(plan); addDefect({ key: (jr.project || "DEF") + "-" + (2000 + (defects || []).length), tc: live.runId, sev: "Major", title: "SLA 불합격 · " + (plan.name || "부하") + " · " + live.target.breaches.join(", "), status: "Open", domain: "NQA", project: jr.project || "", assignee: jr.assignee || "" }); }
    flash("결함 등록됨 · " + live.runId);
  };
  const padz = (n) => String(n).padStart(2, "0");
  const fmtDt = (d) => d.getFullYear() + "-" + padz(d.getMonth() + 1) + "-" + padz(d.getDate()) + "T" + padz(d.getHours()) + ":" + padz(d.getMinutes());
  const presetTonight = () => { const d = new Date(); d.setHours(22, 0, 0, 0); return fmtDt(d); };
  const presetTomorrow = () => { const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(2, 0, 0, 0); return fmtDt(d); };
  const presetPlus1 = () => { const d = new Date(Date.now() + 3600000); d.setSeconds(0, 0); return fmtDt(d); };
  const scheduled = (nqaRuns || []).filter((r) => r.status === "예약").slice().sort((a, b) => (a.scheduledAt || "").localeCompare(b.scheduledAt || ""));
  const openResv = () => { setWhen(presetTonight()); setResv(true); };
  const reserve = () => {
    if (!plan.id) { flash("계획을 선택하세요"); return; }
    if (!when) { flash("실행 시각을 지정하세요"); return; }
    const at = when.replace("T", " ");
    addNqaRun({ id: "RUN-" + when.replace(/[-T:]/g, "").slice(0, 12), planId: plan.id, no: (nqaRuns || []).filter((r) => r.planId === plan.id).length + 1, status: "예약", scheduledAt: at, by: currentUser || "이민준" });
    setResv(false); flash("예약됨 · " + at);
  };
  const promote = (r) => { const p = (nqaPlans || []).find((x) => x.id === r.planId) || {}; const s = (nqaScenarios || []).find((x) => x.id === p.scenarioId) || {}; const target = simResult(s, p.sla || {}); updateNqaRun(r.id, { status: "완료", startedAt: nqaNow(), endedAt: stampPlus(900), durationSec: 900, result: target }); flash("실행 완료 · " + target.verdict); };
  const cancelResv = (r) => { removeNqaRun(r.id); flash("예약 취소됨"); };
  if (!plans.length) return <div className="space-y-4"><PageToolbar desc="부하 주입 + 실시간 관측(RPS/에러율/p95)" /><SubSwitch /><div className="p-8 text-center text-sm text-slate-500">활성 상태인 측정 계획이 없습니다 — 측정 계획에서 계획을 활성화하세요.</div></div>;
  return (
    <div className="space-y-4">
      <PageToolbar desc="부하 주입 + 실시간 관측(RPS/에러율/p95)" />
      <SubSwitch />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 space-y-3">
          <Card className="p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Gauge size={15} className="text-teal-400" />실행할 계획</div>
            <Field label="측정 계획" hint="활성 상태인 계획만 실행 가능"><Select value={planId} onChange={(e) => { setPlanId(Number(e.target.value)); setLive(null); }}>{plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></Field>
            <div className="rounded-lg bg-slate-800 p-2.5 text-xs text-slate-400">시나리오 <span className="text-slate-200">{scn.name || "-"}</span> · 대상 <span className="text-slate-200">{sut.name || "-"}</span> ({sut.env || "-"})<br />합격 기준 p95 ≤ {sla.p95}ms · 에러율 ≤ {sla.errRate}%{sla.minRps ? " · 처리량 ≥ " + sla.minRps + " RPS" : ""}</div>
            <div className="flex gap-2"><Btn kind="primary" icon={Gauge} onClick={runNow} disabled={running}>{running ? "실행 중…" : "즉시 실행"}</Btn><Btn icon={Zap} onClick={openResv} disabled={running}>예약 실행</Btn></div>
            <div className="text-xs text-slate-500">{sut.env || "스테이징"} 대상에 부하를 주입합니다 · 운영 환경은 부하 대상에서 제외됩니다.</div>
          </Card>
          {scheduled.length > 0 && (
            <Card className="p-4 space-y-2">
              <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Zap size={15} className="text-teal-400" />예약된 실행 <span className="text-xs font-normal text-slate-500">· {scheduled.length}건</span></div>
              {scheduled.map((r) => { const p = (nqaPlans || []).find((x) => x.id === r.planId) || {}; return (
                <div key={r.id} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                  <Badge kind="warn">예약</Badge>
                  <div className="min-w-0 flex-1"><div className="truncate text-slate-300">{p.name || "-"}</div><div className="text-xs text-slate-500">{r.scheduledAt}</div></div>
                  <button onClick={() => promote(r)} className="text-xs text-teal-400 hover:underline">지금 실행</button>
                  <button onClick={() => cancelResv(r)} className="text-slate-500 hover:text-red-400" title="예약 취소"><X size={13} /></button>
                </div>
              ); })}
            </Card>
          )}
        </div>
        <div className="col-span-7 space-y-3">
          {!live ? (
            <Card className="flex flex-col items-center justify-center gap-2 p-10 text-center"><div className="flex h-12 w-12 items-center justify-center rounded-full bg-slate-800"><Activity size={22} className="text-teal-400" /></div><div className="text-sm text-slate-400">계획을 선택하고 &quot;즉시 실행&quot;을 누르면 실시간 관측이 시작됩니다.</div></Card>
          ) : (
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between"><div className="text-sm font-semibold text-slate-200">{live.done ? "측정 완료" : "부하 주입 · 실시간 관측"}</div>{live.done && <Badge kind={live.target.verdict === "합격" ? "pass" : "fail"}>{live.target.verdict}</Badge>}</div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-teal-500" style={{ width: live.progress + "%" }} /></div>
              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-lg bg-slate-800 p-2.5"><div className="text-xs text-slate-500">처리량</div><div className="text-lg font-semibold text-slate-100">{live.rps} <span className="text-xs text-slate-500">RPS</span></div></div>
                <div className="rounded-lg bg-slate-800 p-2.5"><div className="text-xs text-slate-500">에러율</div><div className={"text-lg font-semibold " + (live.done && sla.errRate != null && live.err > sla.errRate ? "text-red-400" : "text-slate-100")}>{live.err}<span className="text-xs text-slate-500">%</span></div></div>
                <div className="rounded-lg bg-slate-800 p-2.5"><div className="text-xs text-slate-500">p95</div><div className={"text-lg font-semibold " + (live.done && sla.p95 && live.p95 > sla.p95 ? "text-red-400" : "text-slate-100")}>{live.p95}<span className="text-xs text-slate-500">ms</span></div></div>
              </div>
              {live.done && (<>
                <div className="grid grid-cols-4 gap-2 text-xs">
                  <div className="rounded bg-slate-800 px-2 py-1.5"><span className="text-slate-500">p50 </span><span className="text-slate-200">{live.target.p50}ms</span></div>
                  <div className="rounded bg-slate-800 px-2 py-1.5"><span className="text-slate-500">p99 </span><span className="text-slate-200">{live.target.p99}ms</span></div>
                  <div className="rounded bg-slate-800 px-2 py-1.5"><span className="text-slate-500">총요청 </span><span className="text-slate-200">{live.target.totalReq.toLocaleString()}</span></div>
                  <div className="rounded bg-slate-800 px-2 py-1.5"><span className="text-slate-500">소요 </span><span className="text-slate-200">{durMin}분</span></div>
                </div>
                {live.target.breaches.length > 0 ? <div className="rounded-lg border border-red-900 bg-red-950 px-2.5 py-2 text-xs text-red-300">불합격 — {live.target.breaches.join(" · ")}</div> : <div className="rounded-lg border border-emerald-900 bg-emerald-950 px-2.5 py-2 text-xs text-emerald-300">합격 — 모든 SLA 임계 충족</div>}
                <div className="flex justify-end gap-2">{live.target.verdict === "불합격" && <Btn icon={Bug} onClick={regDefect}>결함 등록</Btn>}<Btn icon={TrendingUp} onClick={() => nav && nav("nqa-history")}>실행 이력에서 보기</Btn></div>
              </>)}
            </Card>
          )}
        </div>
      </div>
      {resv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setResv(false)}>
          <div className="w-full max-w-sm space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-semibold text-slate-100">예약 실행</div>
            <div className="text-xs text-slate-500">{plan.name || "-"} 을(를) 지정 시각에 1회 실행합니다.</div>
            <div className="flex flex-wrap gap-1.5">
              <button onClick={() => setWhen(presetTonight())} className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700">오늘 22:00</button>
              <button onClick={() => setWhen(presetTomorrow())} className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700">내일 02:00</button>
              <button onClick={() => setWhen(presetPlus1())} className="rounded-full border border-slate-700 bg-slate-800 px-2.5 py-1 text-xs text-slate-300 hover:bg-slate-700">1시간 후</button>
            </div>
            <Field label="실행 시각"><input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-teal-500" /></Field>
            <div className="text-xs text-slate-500">부하는 보통 야간·오프피크에 예약합니다.</div>
            <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setResv(false)}>취소</Btn><Btn kind="primary" icon={Zap} onClick={reserve}>예약</Btn></div>
          </div>
        </div>
      )}
      <Toast msg={msg} />
    </div>
  );
}

export function NqaHistoryScreen() {
  const { nqaRuns, nqaPlans, defects, addDefect, jiraConfig } = useApp();
  const [msg, flash] = useToast();
  const runs = (nqaRuns || []).filter((r) => r.status === "완료");
  const [open, setOpen] = useState(null);
  const planName = (id) => ((nqaPlans || []).find((p) => p.id === id) || {}).name || "-";
  const regDefect = (r) => { if ((r.result || {}).verdict !== "불합격") return; if ((defects || []).some((d) => d.tc === r.id)) { flash("이미 결함이 등록된 실행입니다"); return; } const jr = (() => { if (!(jiraConfig && jiraConfig.connected !== false)) return {}; const pl = (nqaPlans || []).find((p) => p.id === r.planId); return (pl && pl.jira && pl.jira.override) ? pl.jira : jiraConfig; })(); addDefect({ key: (jr.project || "DEF") + "-" + (2000 + (defects || []).length), tc: r.id, sev: "Major", title: "SLA 불합격 · " + planName(r.planId) + " · " + ((r.result || {}).breaches || []).join(", "), status: "Open", domain: "NQA", project: jr.project || "", assignee: jr.assignee || "" }); flash("결함 등록됨 · " + r.id); };
  return (
    <div className="space-y-4">
      <PageToolbar desc="부하 실행 이력 · 처리량·p95·에러율·SLA 결과" />
      <SubSwitch />
      <Card className="overflow-hidden p-0">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-800 text-xs text-slate-500"><th className="px-3 py-2 text-left">회차</th><th className="px-3 py-2 text-left">계획</th><th className="px-3 py-2 text-left">시각</th><th className="px-3 py-2 text-right">처리량</th><th className="px-3 py-2 text-right">p95</th><th className="px-3 py-2 text-right">에러율</th><th className="px-3 py-2 text-center">판정</th></tr></thead>
          <tbody>
            {runs.length === 0 ? <tr><td colSpan={7} className="px-3 py-6 text-center text-xs text-slate-600">실행 이력이 없습니다.</td></tr> : runs.map((r) => (
              <tr key={r.id} className="cursor-pointer border-b border-slate-800 last:border-0 hover:bg-slate-800/50" onClick={() => setOpen(r)}>
                <td className="px-3 py-2 font-mono text-xs text-slate-300">{r.id}</td>
                <td className="px-3 py-2 text-slate-300">{planName(r.planId)} <span className="text-xs text-slate-500">#{r.no}</span></td>
                <td className="px-3 py-2 text-xs"><RunTime start={r.startedAt} end={r.endedAt} /></td>
                <td className="px-3 py-2 text-right text-slate-300">{(r.result || {}).rps} RPS</td>
                <td className="px-3 py-2 text-right text-slate-300">{(r.result || {}).p95}ms</td>
                <td className="px-3 py-2 text-right text-slate-300">{(r.result || {}).errRate}%</td>
                <td className="px-3 py-2 text-center"><Badge kind={(r.result || {}).verdict === "합격" ? "pass" : "fail"}>{(r.result || {}).verdict}</Badge></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      {open && (
        <div className="fixed inset-0 z-40 flex justify-end bg-black/50" onClick={() => setOpen(null)}>
          <div className="h-full w-full max-w-md space-y-3 overflow-y-auto border-l border-slate-700 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between"><div className="text-sm font-semibold text-slate-100">{open.id}</div><button onClick={() => setOpen(null)} className="text-slate-500 hover:text-red-400"><X size={16} /></button></div>
            <div className="text-xs text-slate-500">{planName(open.planId)} · #{open.no} · {open.startedAt} · 실행자 {open.by || "-"}</div>
            <div><Badge kind={(open.result || {}).verdict === "합격" ? "pass" : "fail"}>{(open.result || {}).verdict}</Badge></div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[["처리량", (open.result || {}).rps + " RPS"], ["에러율", (open.result || {}).errRate + "%"], ["p50", (open.result || {}).p50 + "ms"], ["p95", (open.result || {}).p95 + "ms"], ["p99", (open.result || {}).p99 + "ms"], ["총 요청", ((open.result || {}).totalReq || 0).toLocaleString()]].map(([k, v]) => <div key={k} className="rounded bg-slate-800 px-2.5 py-1.5"><span className="text-slate-500">{k} </span><span className="text-slate-200">{v}</span></div>)}
            </div>
            {((open.result || {}).breaches || []).length > 0 ? <div className="rounded-lg border border-red-900 bg-red-950 px-2.5 py-2 text-xs text-red-300">위반: {open.result.breaches.join(" · ")}</div> : <div className="rounded-lg border border-emerald-900 bg-emerald-950 px-2.5 py-2 text-xs text-emerald-300">모든 SLA 임계 충족</div>}
            {(open.result || {}).verdict === "불합격" && <div className="flex justify-end"><Btn icon={Bug} onClick={() => regDefect(open)}>결함 등록</Btn></div>}
          </div>
        </div>
      )}
      <Toast msg={msg} />
    </div>
  );
}

export function NqaTrendScreen() {
  const { nqaRuns, nqaPlans } = useApp();
  const plans = nqaPlans || [];
  const [planId, setPlanId] = useState((plans[0] || {}).id || 0);
  const plan = plans.find((p) => p.id === planId) || {};
  const sla = plan.sla || {};
  const runs = (nqaRuns || []).filter((r) => r.planId === planId && r.status === "완료").slice().sort((a, b) => a.no - b.no);
  const maxP95 = Math.max(sla.p95 || 0, ...runs.map((r) => (r.result || {}).p95 || 0), 1);
  const withReg = runs.map((r, i) => {
    const prevPass = runs.slice(0, i).reverse().find((x) => (x.result || {}).verdict === "합격");
    const base = prevPass ? (prevPass.result || {}).p95 : null;
    const cur = (r.result || {}).p95 || 0;
    const deltaPct = base ? Math.round(((cur - base) / base) * 100) : null;
    return { ...r, base, deltaPct, regression: base != null && deltaPct > 10 };
  });
  return (
    <div className="space-y-4">
      <PageToolbar desc="회차/빌드 간 처리량·p95·에러율 추이 · 성능 회귀 감지" />
      <SubSwitch />
      <Card className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><TrendingUp size={15} className="text-teal-400" />p95 추이 <span className="text-xs font-normal text-slate-500">· 회차별</span></div>
          <div style={{ maxWidth: 280 }}><Select value={planId} onChange={(e) => setPlanId(Number(e.target.value))}>{plans.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</Select></div>
        </div>
        {runs.length === 0 ? <div className="rounded-lg bg-slate-800 p-4 text-center text-xs text-slate-500">이 계획의 실행 이력이 없습니다.</div> : (
          <div>
            <div className="flex items-end gap-3 border-b border-slate-800 pb-2" style={{ height: 168 }}>
              {withReg.map((r) => { const p = (r.result || {}).p95 || 0; const h = Math.round((p / maxP95) * 128); const pass = (r.result || {}).verdict === "합격"; return (
                <div key={r.id} className="flex flex-1 flex-col items-center justify-end gap-1">
                  {r.regression && <div className="text-xs font-semibold text-amber-400">▲{r.deltaPct}%</div>}
                  <div className={"text-xs " + (r.regression ? "text-amber-300" : "text-slate-400")}>{p}</div>
                  <div className={"w-full rounded-t " + (!pass ? "bg-red-600" : r.regression ? "bg-amber-500" : "bg-teal-600")} style={{ height: h }} />
                  <div className="text-xs text-slate-500">#{r.no}</div>
                </div>
              ); })}
            </div>
            <div className="mt-1 text-xs text-slate-500">{sla.p95 ? <>SLA 기준선 p95 ≤ <span className="text-teal-300">{sla.p95}ms</span> · </> : null}<span className="text-red-300">빨강</span>=불합격 · <span className="text-amber-300">노랑</span>=회귀(직전 통과 대비 p95 +10% 초과)</div>
            <div className="mt-3 overflow-hidden rounded-lg border border-slate-800">
              <table className="w-full text-xs"><thead><tr className="border-b border-slate-800 text-slate-500"><th className="px-2 py-1.5 text-left">회차</th><th className="px-2 py-1.5 text-right">처리량</th><th className="px-2 py-1.5 text-right">p95</th><th className="px-2 py-1.5 text-right">에러율</th><th className="px-2 py-1.5 text-center">직전 대비</th><th className="px-2 py-1.5 text-center">판정</th></tr></thead>
              <tbody>{withReg.slice().reverse().map((r) => <tr key={r.id} className="border-b border-slate-800 last:border-0"><td className="px-2 py-1.5 text-slate-400">#{r.no} · {r.startedAt}</td><td className="px-2 py-1.5 text-right text-slate-300">{(r.result || {}).rps}</td><td className="px-2 py-1.5 text-right text-slate-300">{(r.result || {}).p95}ms</td><td className="px-2 py-1.5 text-right text-slate-300">{(r.result || {}).errRate}%</td><td className="px-2 py-1.5 text-center">{r.deltaPct == null ? <span className="text-slate-600">기준</span> : r.regression ? <span className="font-semibold text-amber-400">▲{r.deltaPct}% 회귀</span> : <span className="text-slate-500">{r.deltaPct >= 0 ? "+" : ""}{r.deltaPct}%</span>}</td><td className="px-2 py-1.5 text-center"><Badge kind={(r.result || {}).verdict === "합격" ? "pass" : "fail"}>{(r.result || {}).verdict}</Badge></td></tr>)}</tbody></table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

export function NqaDashboardScreen({ nav }) {
  const { nqaRuns, nqaPlans, nqaScenarios, nqaSystems, defects } = useApp();
  const plans = nqaPlans || [];
  const completed = (nqaRuns || []).filter((r) => r.status === "완료");
  const regMap = {};
  const byPlan = {};
  completed.forEach((r) => { (byPlan[r.planId] = byPlan[r.planId] || []).push(r); });
  Object.keys(byPlan).forEach((pid) => {
    const sorted = byPlan[pid].slice().sort((a, b) => (a.startedAt || "").localeCompare(b.startedAt || ""));
    sorted.forEach((r, i) => {
      const prevPass = sorted.slice(0, i).reverse().find((x) => (x.result || {}).verdict === "합격");
      const base = prevPass ? (prevPass.result || {}).p95 : null;
      const cur = (r.result || {}).p95 || 0;
      const deltaPct = base ? Math.round(((cur - base) / base) * 100) : null;
      regMap[r.id] = { deltaPct, regression: base != null && deltaPct > 10 };
    });
  });
  const desc = completed.slice().sort((a, b) => (b.startedAt || "").localeCompare(a.startedAt || ""));
  const asc = completed.slice().sort((a, b) => (a.startedAt || "").localeCompare(b.startedAt || "")).slice(-12);
  const recent = desc.slice(0, 10);
  const passN = recent.filter((r) => (r.result || {}).verdict === "합격").length;
  const rate = recent.length ? Math.round((passN / recent.length) * 100) : 0;
  const openDef = (defects || []).filter((d) => d.domain === "NQA" && d.status !== "Resolved" && d.status !== "Closed").length;
  const regCount = completed.filter((r) => (regMap[r.id] || {}).regression).length;
  const activeN = plans.filter((p) => p.status === "활성").length;
  const last = desc[0];
  const planName = (id) => (plans.find((p) => p.id === id) || {}).name || "-";
  const sutOfPlan = (id) => { const p = plans.find((x) => x.id === id) || {}; const s = (nqaScenarios || []).find((x) => x.id === p.scenarioId) || {}; return (nqaSystems || []).find((x) => x.id === s.sutId) || {}; };
  const maxP95 = Math.max(1, ...asc.map((r) => (r.result || {}).p95 || 0));
  const latestOf = (pid) => desc.find((r) => r.planId === pid);
  return (
    <div className="space-y-4">
      <PageToolbar desc="부하 KPI · SLA 판정 추이 · 계획별 처리량/지연 요약" />
      <SubSwitch />
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-4"><div className="flex items-center gap-2 text-xs text-slate-500"><CheckCircle2 size={14} className="text-teal-400" />SLA 합격률</div><div className="mt-1 text-2xl font-semibold text-slate-100">{rate}<span className="text-sm text-slate-500">%</span></div><div className="text-xs text-slate-500">최근 {recent.length}회 중 {passN} 합격</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-xs text-slate-500"><Bug size={14} className="text-red-400" />미해결 성능 결함</div><div className={"mt-1 text-2xl font-semibold " + (openDef > 0 ? "text-red-300" : "text-slate-100")}>{openDef}</div><div className="text-xs text-slate-500">SLA 불합격 결함 (Open)</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-xs text-slate-500"><TrendingUp size={14} className="text-amber-400" />성능 회귀</div><div className={"mt-1 text-2xl font-semibold " + (regCount > 0 ? "text-amber-300" : "text-slate-100")}>{regCount}</div><div className="text-xs text-slate-500">직전 통과 대비 p95 +10% 초과</div></Card>
        <Card className="p-4"><div className="flex items-center gap-2 text-xs text-slate-500"><Gauge size={14} className="text-teal-400" />활성 계획</div><div className="mt-1 text-2xl font-semibold text-slate-100">{activeN}</div><div className="truncate text-xs text-slate-500">{last ? "최근: " + planName(last.planId) + " · " + (last.result || {}).verdict + " · " + (last.startedAt || "").slice(5, 10) : "실행 이력 없음"}</div></Card>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Card className="p-4 space-y-2">
          <div className="text-sm font-semibold text-slate-200">SLA 판정 추이 <span className="text-xs font-normal text-slate-500">· 최근 {asc.length}회</span></div>
          {asc.length === 0 ? <div className="rounded-lg bg-slate-800 p-4 text-center text-xs text-slate-500">실행 이력이 없습니다.</div> : (
            <div className="flex flex-wrap gap-1.5">{asc.map((r) => { const pass = (r.result || {}).verdict === "합격"; return <div key={r.id} className={"flex w-16 flex-col items-center justify-center rounded py-1 text-xs " + (pass ? "bg-emerald-950 text-emerald-300" : "bg-red-950 text-red-300")} title={planName(r.planId) + " · " + r.startedAt}>{pass ? "합격" : "불합격"}<span className="text-slate-500">{(r.startedAt || "").slice(5, 10)}</span></div>; })}</div>
          )}
        </Card>
        <Card className="p-4 space-y-2">
          <div className="text-sm font-semibold text-slate-200">p95 추이 <span className="text-xs font-normal text-slate-500">· 최근 {asc.length}회</span></div>
          {asc.length === 0 ? <div className="rounded-lg bg-slate-800 p-4 text-center text-xs text-slate-500">실행 이력이 없습니다.</div> : (
            <div className="flex items-end gap-2" style={{ height: 96 }}>{asc.map((r) => { const p = (r.result || {}).p95 || 0; const h = Math.round((p / maxP95) * 76); const pass = (r.result || {}).verdict === "합격"; const reg = (regMap[r.id] || {}).regression; return <div key={r.id} className="flex flex-1 flex-col items-center justify-end"><div className={"w-full rounded-t " + (!pass ? "bg-red-600" : reg ? "bg-amber-500" : "bg-teal-600")} style={{ height: h }} title={(r.result || {}).p95 + "ms"} /></div>; })}</div>
          )}
        </Card>
      </div>
      <Card className="p-4 space-y-2">
        <div className="text-sm font-semibold text-slate-200">계획별 최근 판정</div>
        <div className="overflow-hidden rounded-lg border border-slate-800">
          <table className="w-full text-sm"><thead><tr className="border-b border-slate-800 text-xs text-slate-500"><th className="px-3 py-2 text-left">계획</th><th className="px-3 py-2 text-left">대상 환경</th><th className="px-3 py-2 text-left">최근 실행</th><th className="px-3 py-2 text-right">p95</th><th className="px-3 py-2 text-right">에러율</th><th className="px-3 py-2 text-center">회귀</th><th className="px-3 py-2 text-center">판정</th></tr></thead>
          <tbody>{plans.length === 0 ? <tr><td colSpan={7} className="px-3 py-6 text-center text-xs text-slate-600">계획이 없습니다.</td></tr> : plans.map((p) => { const r = latestOf(p.id); const su = sutOfPlan(p.id); const reg = r ? (regMap[r.id] || {}) : {}; return (
            <tr key={p.id} className="border-b border-slate-800 last:border-0">
              <td className="px-3 py-2 text-slate-300">{p.name}{p.status !== "활성" && <span className="ml-1 text-xs text-slate-600">(초안)</span>}</td>
              <td className="px-3 py-2 text-xs text-slate-500">{su.name || "-"} · {su.env || "-"}</td>
              <td className="px-3 py-2 text-xs text-slate-500">{r ? r.startedAt : "미실행"}</td>
              <td className="px-3 py-2 text-right text-slate-300">{r ? (r.result || {}).p95 + "ms" : "—"}</td>
              <td className="px-3 py-2 text-right text-slate-300">{r ? (r.result || {}).errRate + "%" : "—"}</td>
              <td className="px-3 py-2 text-center">{r ? (reg.regression ? <span className="font-semibold text-amber-400">▲{reg.deltaPct}%</span> : reg.deltaPct != null ? <span className="text-slate-500">{reg.deltaPct >= 0 ? "+" : ""}{reg.deltaPct}%</span> : <span className="text-slate-600">기준</span>) : "—"}</td>
              <td className="px-3 py-2 text-center">{r ? <Badge kind={(r.result || {}).verdict === "합격" ? "pass" : "fail"}>{(r.result || {}).verdict}</Badge> : <span className="text-xs text-slate-600">—</span>}</td>
            </tr>
          ); })}</tbody></table>
        </div>
        <div className="flex justify-end gap-2"><Btn icon={Gauge} onClick={() => nav && nav("nqa-run")}>측정 실행</Btn><Btn icon={TrendingUp} onClick={() => nav && nav("nqa-trend")}>성능 추이</Btn></div>
      </Card>
    </div>
  );
}

export function NqaScreen({ view }) {
  const [label, desc] = NQA_META[view] || ["", ""];
  const active = (NQA_SUBTYPES.find((s) => s.ready) || {}).label || "성능";
  return (
    <div className="space-y-4">
      <PageToolbar desc={desc} />
      <SubSwitch />
      <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800"><Gauge size={22} className="text-teal-400" /></div>
        <div className="text-sm font-semibold text-slate-200">{active} · {label}</div>
        <div className="max-w-md text-xs text-slate-500">{desc}</div>
        <Badge kind="warn">준비 중 — 다음 단계에서 구현</Badge>
      </Card>
    </div>
  );
}
