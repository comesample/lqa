import { useState, useEffect } from "react";
import { useApp } from "../common/context.js";
import { VarRefInput } from "../common/VarRefInput.jsx";
import { DatasetPicker } from "../common/DatasetPicker.jsx";
import { Card, PageToolbar, Badge, Btn, Field, Input, Select, Toggle, Seg, Toast, useToast } from "../common/ui.jsx";
import { Gauge, Plus, X, Save, Smartphone, Cpu, Wifi, Package, Upload, Link2, CheckCircle2, Globe, Monitor, Server, Zap, Activity, AlertTriangle, TrendingUp } from "lucide-react";
import { NQA_SUBTYPES, NQA_PLATFORMS, NQA_PLAT_K, NQA_TIERS, NQA_TOOLS, NQA_TOOL_METRICS, NQA_NETWORKS, NQA_STARTS, NQA_THERMAL_LEVELS, NQA_PROVIDERS, NQA_DEV_STATUS, NQA_DEV_ST_K, NQA_CAP_LABELS, NQA_PROVIDER_CAPS, NQA_SCN_SOURCES, NQA_SCN_SRC_K, NQA_MARKERS, NQA_SCN_TEMPLATES, NQA_BROWSERS, NQA_VIEWPORTS, NQA_WEB_NET, NQA_CPU_THROTTLE, NQA_CACHE, NQA_PROTOCOLS, NQA_LOAD_ENVS, NQA_HTTP_METHODS, NQA_APM, NQA_LOADGEN, NQA_APM_AUTO, NQA_AUTH_TYPES, NQA_MAX_AGENTS, NQA_SERVER_TIERS, NQA_WORKLOAD_MODES, NQA_WORKLOAD_K, NQA_LOAD_UNITS, NQA_LOAD_SHAPES, NQA_PLAN_TRIGGERS, NQA_BASELINE_MODES } from "./data.js";

const NQA_META = {
  "nqa-dashboard": ["대시보드", "부하 KPI · SLA 위반 추이 · 대상별 처리량/지연 요약"],
  "nqa-targets": ["대상·환경", "부하 대상(SUT) · 엔드포인트 믹스 · APM 관측 · 부하 생성 인프라 · 가드레일"],
  "nqa-scenarios": ["측정 시나리오", "부하 대상 선택 · 워크로드(믹스/순서 저니) · 부하 형상(VU/RPS 램프·지속)"],
  "nqa-plan": ["측정 계획", "대상 × 시나리오 + SLA 판정 임계 + baseline 대비 — 계획이 아우름"],
  "nqa-run": ["측정 실행", "부하 주입 + 실시간 관측(RPS/에러율/p95/서버 CPU·메모리)"],
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
          onClick={() => { if (!s.ready) toast(s.label + " 테스트는 준비 중입니다 (확장 예정)", "info"); }}
          className={"rounded-lg px-3 py-1.5 text-xs font-semibold " + (s.ready ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-800")}
        >
          {s.label}{!s.ready && " · 준비중"}
        </button>
      ))}
      <span className="ml-1.5 text-xs text-slate-500">비기능 하위 유형</span>
    </div>
  );
}

/* ═══════════ 측정 대상·환경 (부하 · 서버 엔드포인트 + APM 관측) — 기능 QA 독립 ═══════════ */
const M_LK = { GET: "info", POST: "pass", PUT: "warn", DELETE: "fail", PATCH: "warn" };
export function NqaTargetScreen() {
  const { nqaSystems, addNqaSystem, updateNqaSystem, removeNqaSystem, variables, datasets } = useApp();
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
  useEffect(() => { setDraft({}); setChk(null); setSmoke(null); }, [sys.id]);
  const choose = (i) => guardSwitch(() => setSel(i));
  const [modal, setModal] = useState(false);
  const [nf, setNf] = useState({ name: "", baseUrl: "", protocol: "HTTP/HTTPS", env: "스테이징" });
  const [epModal, setEpModal] = useState(false);
  const [ef, setEf] = useState({ method: "GET", path: "", weight: 10, headers: [], body: "", expect: 200, extracts: [] });
  const [svModal, setSvModal] = useState(false);
  const [sf, setSf] = useState({ name: "", tier: "WAS" });
  const [chk, setChk] = useState(null);
  const [smoke, setSmoke] = useState(null);
  const endpoints = cfg.endpoints || [];
  const apm = cfg.apm || {};
  const loadgen = cfg.loadgen || {};
  const auth = cfg.auth || {};
  const guard = cfg.guard || {};
  const servers = apm.servers || [];
  const wsum = endpoints.reduce((a, e) => a + (e.weight || 0), 0);
  const selDataset = (datasets || []).find((d) => d.name === auth.dataset);
  const feedCols = selDataset ? selDataset.columns : [];
  const usedRowVars = [...new Set(endpoints.flatMap((ep) => { const txt = (ep.body || "") + " " + ((ep.headers || []).map((h) => h.v).join(" ")); return (txt.match(/\$\{row\.([a-zA-Z0-9_]+)\}/g) || []).map((x) => x.replace(/\$\{row\.|\}/g, "")); }))];
  const missingCols = usedRowVars.filter((v) => !feedCols.includes(v));
  const producedVars = [...new Set(endpoints.flatMap((ep) => (ep.extracts || []).map((x) => x.var).filter(Boolean)))];
  const usedCorrVars = [...new Set(endpoints.flatMap((ep) => { const txt = (ep.body || "") + " " + ((ep.headers || []).map((h) => h.v).join(" ")); return (txt.match(/\$\{([a-zA-Z0-9_]+)\}/g) || []).map((x) => x.replace(/\$\{|\}/g, "")); }))];
  const missingVars = usedCorrVars.filter((v) => !producedVars.includes(v));
  const secretRef = (val, setVal, ph) => <VarRefInput value={val} onChange={setVal} placeholder={ph} />;
  const normalize = () => { if (!wsum) return; setCfg({ endpoints: endpoints.map((e) => ({ ...e, weight: Math.round((e.weight || 0) / wsum * 100) })) }); flash("믹스 100%로 정규화됨"); };
  const runSmoke = () => { if (!endpoints.length) { flash("엔드포인트를 추가하세요"); return; } setSmoke({ s: "run" }); setTimeout(() => { setSmoke({ s: "done", rows: endpoints.map((ep) => ({ path: ep.method + " " + ep.path, code: ep.expect || 200, extractOk: (ep.extracts || []).length === 0 ? null : true })) }); }, 900); };
  const runCheck = () => { setChk({ s: "run" }); setTimeout(() => { setChk({ s: cfg.baseUrl ? "ok" : "warn", m: (cfg.baseUrl ? "엔드포인트 접근 OK" : "⚠ Base URL 없음") + " · APM " + (apm.provider || "없음") + "(" + servers.length + "대) · 부하생성 " + (loadgen.tool || "-") + (guard.blockProd === false ? " · ⚠ 운영 차단 꺼짐" : "") }); }, 800); };
  const addSut = () => {
    if (!nf.name.trim()) { flash("대상 이름을 입력하세요"); return; }
    if (!nf.baseUrl.trim()) { flash("Base URL을 입력하세요"); return; }
    guardSwitch(() => { const ns = { id: Date.now(), name: nf.name, subtype: "load", baseUrl: nf.baseUrl, protocol: nf.protocol, env: nf.env, endpoints: [], apm: { provider: "Jennifer", servers: [] }, loadgen: { tool: "JMeter", agents: 1 }, auth: { type: "Bearer 토큰", ref: "", correlate: false }, guard: { blockProd: true, approval: false, maxRps: 1000, maxVu: 500, maxDur: 20, autoErr: 5, autoP95: 2000, autoCpu: 90, autoMem: 85 } }; addNqaSystem(ns); setSel(systems.length); setModal(false); flash("부하 대상이 추가되었습니다"); });
  };
  const delSut = (i, sy) => { if (systems.length <= 1) { flash("최소 1개 대상은 유지해야 합니다"); return; } if (!window.confirm(sy.name + " 대상을 삭제할까요?")) return; guardSwitch(() => { removeNqaSystem(sy.id); setSel(0); flash(sy.name + " 삭제됨"); }); };
  const addEp = () => { if (!ef.path.trim()) { flash("경로를 입력하세요"); return; } setCfg({ endpoints: [...endpoints, { ...ef, weight: +ef.weight || 0, expect: +ef.expect || 200 }] }); setEpModal(false); setEf({ method: "GET", path: "", weight: 10, headers: [], body: "", expect: 200, extracts: [] }); flash("엔드포인트가 추가되었습니다"); };
  const delEp = (idx) => setCfg({ endpoints: endpoints.filter((_, j) => j !== idx) });
  const addSv = () => { if (!sf.name.trim()) { flash("인스턴스 이름을 입력하세요"); return; } setCfg({ apm: { ...apm, servers: [...servers, { name: sf.name.trim(), tier: sf.tier }] } }); setSvModal(false); setSf({ name: "", tier: "WAS" }); flash("서버 인스턴스가 추가되었습니다"); };
  const delSv = (idx) => setCfg({ apm: { ...apm, servers: servers.filter((_, j) => j !== idx) } });
  if (!systems.length) return <div className="p-8 text-center text-sm text-slate-500">부하 대상이 없습니다.</div>;
  return (
    <div className="space-y-4">
      <PageToolbar desc="부하 대상(SUT) → 엔드포인트(자극) · 서버 인프라(관측) · 부하 인프라 · 가드레일" />
      <SubSwitch />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-3">
          <Btn kind="primary" icon={Plus} className="w-full" onClick={() => { setNf({ name: "", baseUrl: "", protocol: "HTTP/HTTPS", env: "스테이징" }); setModal(true); }}>부하 대상 추가</Btn>
          {systems.map((sy, i) => (
            <Card key={sy.id} className={"cursor-pointer p-3 " + (sel === i ? "border-teal-500" : "hover:border-slate-700")}>
              <div onClick={() => choose(i)}>
                <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-100">{sy.name}</span><div className="flex items-center gap-1.5"><Badge kind="warn">부하</Badge><button onClick={(e) => { e.stopPropagation(); delSut(i, sy); }} className="text-slate-500 hover:text-red-400" title="대상 삭제"><X size={12} /></button></div></div>
                <div className="mt-1 truncate text-xs text-slate-500">{sy.baseUrl}</div>
                <div className="mt-1 text-xs text-slate-500">{(sy.endpoints || []).length}개 EP · {(sy.apm || {}).provider}</div>
              </div>
            </Card>
          ))}
        </div>
        <div className="col-span-9 space-y-3">
          <Card className="flex items-center justify-between gap-3 p-3">
            <div className="flex min-w-0 flex-1 items-center gap-2"><Server size={16} className="shrink-0 text-teal-400" /><div className="w-56 shrink-0"><Input value={cfg.name || ""} onChange={(e) => setCfg({ name: e.target.value })} className="text-base font-semibold" /></div><span className="shrink-0"><Badge kind="info">{sys.protocol}</Badge></span><span className="shrink-0"><Badge kind={cfg.env === "운영" ? "fail" : "info"}>{cfg.env}</Badge></span><span className="truncate text-xs text-slate-500">{cfg.baseUrl}</span></div>
            <div className="flex shrink-0 items-center gap-2">{dirty && <span className="text-xs text-amber-300">미저장 변경</span>}<Btn icon={Link2} onClick={runCheck}>{chk && chk.s === "run" ? "확인 중…" : "연결 확인"}</Btn><Btn kind="primary" icon={Save} onClick={saveCfg} disabled={!dirty}>설정 저장</Btn></div>
          </Card>
          <div className="text-xs text-slate-500">생성 <span className="text-slate-400">{sys.createdBy || "—"}</span> · {sys.createdAt || "—"} · 수정 <span className="text-slate-400">{sys.updatedBy || "—"}</span> · {sys.updatedAt || "—"}</div>
          {chk && chk.s !== "run" && <div className={"flex items-center gap-2 rounded-lg border px-3 py-2 text-xs " + (chk.s === "ok" ? "border-emerald-800 bg-emerald-950 text-emerald-300" : "border-amber-800 bg-amber-950 text-amber-300")}>{chk.s === "ok" && <CheckCircle2 size={13} />}{chk.m}</div>}
          <Card className="p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Server size={15} className="text-teal-400" />대상 시스템 (SUT)</div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="Base URL / 게이트웨이"><Input value={cfg.baseUrl || ""} onChange={(e) => setCfg({ baseUrl: e.target.value })} placeholder="https://api-stg.tworld.co.kr" /></Field>
              <Field label="프로토콜"><Select value={cfg.protocol || ""} onChange={(e) => setCfg({ protocol: e.target.value })}>{NQA_PROTOCOLS.map((p) => <option key={p}>{p}</option>)}</Select></Field>
              <Field label="환경"><Select value={cfg.env || ""} onChange={(e) => setCfg({ env: e.target.value })}>{NQA_LOAD_ENVS.map((p) => <option key={p}>{p}</option>)}</Select></Field>
            </div>
            {cfg.env === "운영" && <div className="rounded-lg border border-red-900 bg-red-950 px-2.5 py-1.5 text-xs text-red-300">운영 환경 부하는 가드레일에서 차단됩니다 — 스테이징/개발에서만 실행하세요.</div>}
          </Card>
          <Card className="p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Link2 size={15} className="text-teal-400" />인증 · 테스트 데이터</div>
            <Field label="인증 방식"><div style={{ maxWidth: 240 }}><Select value={auth.type || ""} onChange={(e) => setCfg({ auth: { ...auth, type: e.target.value } })}>{NQA_AUTH_TYPES.map((t) => <option key={t}>{t}</option>)}</Select></div></Field>
            {auth.type === "Bearer 토큰" && <Field label="토큰 (변수 참조)">{secretRef(auth.ref, (val) => setCfg({ auth: { ...auth, ref: val } }), "${stg_tworld_token}")}</Field>}
            {auth.type === "API Key" && <div className="grid grid-cols-2 gap-3"><Field label="헤더명"><Input value={auth.keyName || ""} onChange={(e) => setCfg({ auth: { ...auth, keyName: e.target.value } })} placeholder="X-API-Key" /></Field><Field label="키 값 (변수 참조)">{secretRef(auth.ref, (val) => setCfg({ auth: { ...auth, ref: val } }), "${api_key}")}</Field></div>}
            {auth.type === "OAuth 2.0" && <div className="space-y-1.5"><div className="grid grid-cols-2 gap-3"><Field label="토큰 URL"><Input value={auth.tokenUrl || ""} onChange={(e) => setCfg({ auth: { ...auth, tokenUrl: e.target.value } })} placeholder="https://auth.../token" /></Field><Field label="scope"><Input value={auth.scope || ""} onChange={(e) => setCfg({ auth: { ...auth, scope: e.target.value } })} placeholder="read write" /></Field><Field label="client id"><Input value={auth.clientId || ""} onChange={(e) => setCfg({ auth: { ...auth, clientId: e.target.value } })} /></Field></div><Field label="client secret (변수 참조)">{secretRef(auth.ref, (val) => setCfg({ auth: { ...auth, ref: val } }), "${client_secret}")}</Field></div>}
            {auth.type && auth.type !== "없음" && auth.type !== "로그인 플로우" && <div className="text-xs text-slate-500">시크릿은 공통 <span className="text-slate-300">변수</span> 화면의 값을 <span className="font-mono text-teal-400">{"${키}"}</span>로 참조 · 실행 시 환경 값으로 치환됩니다. <span className="text-slate-600">러너가 해당 환경 변수에 접근 가능해야 함.</span></div>}
            {auth.type === "로그인 플로우" && <><Field label="로그인 엔드포인트"><Input value={auth.loginPath || ""} onChange={(e) => setCfg({ auth: { ...auth, loginPath: e.target.value } })} placeholder="/v1/auth/login" /></Field><div className="rounded-lg bg-slate-800 p-2.5 text-xs text-slate-400">계정 자격증명은 아래 <span className="text-slate-300">데이터 피드</span>에서 VU별로 공급되고, 로그인 응답의 토큰은 <span className="text-slate-300">엔드포인트 응답 추출(상관)</span>으로 이어집니다.</div></>}
            <div className="border-t border-slate-800 pt-2 text-xs font-semibold text-slate-400">테스트 데이터</div>
            <Field label="데이터셋" hint="공통 데이터셋 메뉴에서 관리 · 컬럼이 ${row.X} 매핑 기준"><DatasetPicker value={auth.dataset || ""} onChange={(v) => setCfg({ auth: { ...auth, dataset: v } })} noneLabel="선택 안 함" /></Field>
            {selDataset && <div className="text-xs text-slate-500">컬럼: <span className="text-slate-300">{selDataset.columns.join(", ")}</span> · {(selDataset.rowCount != null ? selDataset.rowCount : selDataset.rows.length).toLocaleString()}행{selDataset.desc ? " · " + selDataset.desc : ""}</div>}
            {usedRowVars.length > 0 && <div className="text-xs text-slate-500">본문/헤더 참조: <span className="text-slate-300">{usedRowVars.join(", ")}</span>{!auth.dataset ? <span className="text-amber-300"> · ⚠ 데이터셋 미선택</span> : missingCols.length > 0 && <span className="text-amber-300"> · ⚠ 데이터셋에 없는 컬럼: {missingCols.join(", ")}</span>}</div>}
            <div className="flex items-center justify-between text-sm text-slate-300"><span>상관(correlation) 사용 <span className="text-xs text-slate-500">— 엔드포인트 응답 추출값을 다음 요청에 재사용</span></span><Toggle on={!!auth.correlate} onClick={() => setCfg({ auth: { ...auth, correlate: !auth.correlate } })} /></div>
            {auth.correlate && (usedCorrVars.length > 0 || producedVars.length > 0) && <div className="text-xs text-slate-500">요청 참조: <span className="text-slate-300">{usedCorrVars.length ? usedCorrVars.map((v) => "${" + v + "}").join(", ") : "없음"}</span> · 추출 생산: <span className="text-slate-300">{producedVars.length ? producedVars.join(", ") : "없음"}</span>{missingVars.length > 0 && <span className="text-amber-300"> · ⚠ 미정의 변수: {missingVars.map((v) => "${" + v + "}").join(", ")}</span>}</div>}
            {auth.correlate && missingVars.length === 0 && usedCorrVars.length > 0 && <div className="text-xs text-slate-500">변수 스코프: <span className="text-slate-400">VU별(세션 격리)</span> — 각 가상 사용자가 자신의 추출값을 사용</div>}
          </Card>
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Zap size={15} className="text-teal-400" />대상 엔드포인트 <span className="text-xs font-normal text-slate-500">· 자극 지점</span><span className="text-xs" style={{ color: wsum === 100 ? "#34d399" : "#fbbf24" }}>믹스 {wsum}%{wsum !== 100 ? " ⚠" : ""}</span>{endpoints.length > 0 && wsum !== 100 && wsum > 0 && <button onClick={normalize} className="text-xs text-teal-400 hover:underline">100%로 정규화</button>}</div>
              <div className="flex gap-2"><Btn icon={Activity} onClick={runSmoke}>{smoke && smoke.s === "run" ? "검증 중…" : "스모크 검증"}</Btn><Btn icon={Plus} onClick={() => { setEf({ method: "GET", path: "", weight: 10, headers: [], body: "", expect: 200, extracts: [] }); setEpModal(true); }}>엔드포인트 추가</Btn></div>
            </div>
            {endpoints.length === 0 ? <div className="rounded-lg bg-slate-800 p-3 text-xs text-slate-500">엔드포인트가 없습니다 — 부하를 걸 API 경로를 추가하세요.</div> : (
              <div className="space-y-1.5">
                {endpoints.map((ep, idx) => (
                  <div key={idx} className="flex items-center gap-3 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                    <Badge kind={M_LK[ep.method] || "info"}>{ep.method}</Badge>
                    <span className="font-mono text-xs text-slate-300">{ep.path}</span>
                    {ep.body && <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400">본문</span>}
                    {(ep.extracts && ep.extracts.length > 0) && <span className="rounded bg-slate-800 px-1.5 py-0.5 text-xs text-teal-300">추출 {ep.extracts.length}</span>}
                    <div className="flex-1" />
                    <span className="text-xs text-slate-500">→ {ep.expect || 200}</span>
                    <span className="text-xs text-slate-400">믹스 {ep.weight || 0}%</span>
                    <button onClick={() => delEp(idx)} className="text-slate-500 hover:text-red-400" title="삭제"><X size={13} /></button>
                  </div>
                ))}
              </div>
            )}
            {smoke && smoke.s === "done" && (
              <div className="rounded-lg border border-slate-800 bg-slate-950 p-2.5 space-y-1">
                <div className="text-xs font-semibold text-slate-400">스모크 결과 <span className="font-normal text-slate-500">· 1 VU · 각 1회 호출 · 스크립트 유효성</span></div>
                {smoke.rows.map((r, i) => (<div key={i} className="flex items-center gap-2 text-xs"><CheckCircle2 size={12} className="text-emerald-400" /><span className="flex-1 truncate font-mono text-slate-400">{r.path}</span><Badge kind="pass">{r.code}</Badge>{r.extractOk === true && <span className="text-teal-300">추출 OK</span>}</div>))}
              </div>
            )}
          </Card>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Activity size={15} className="text-teal-400" />서버 인프라 (관측)</div>
                <Btn icon={Plus} onClick={() => { setSf({ name: "", tier: "WAS" }); setSvModal(true); }}>서버 추가</Btn>
              </div>
              <Field label="APM 연동"><Select value={apm.provider || ""} onChange={(e) => setCfg({ apm: { ...apm, provider: e.target.value } })}>{NQA_APM.map((p) => <option key={p}>{p}</option>)}</Select></Field>
              {apm.provider && apm.provider !== "없음" && (NQA_APM_AUTO[apm.provider]
                ? <div className="flex items-center gap-2 text-xs"><Badge kind="pass">자동 수집 (API)</Badge><span className="text-slate-500">테스트 구간 서버 지표를 API로 자동 상관</span></div>
                : <Field label="APM 대시보드 링크" hint="자동 수집 미지원 — 부하 구간에 시간 정렬"><Input value={apm.link || ""} onChange={(e) => setCfg({ apm: { ...apm, link: e.target.value } })} placeholder="https://apm.internal/dashboard/..." /></Field>)}
              {servers.length === 0 ? <div className="rounded-lg bg-slate-800 p-2.5 text-xs text-slate-500">관측 서버 인스턴스가 없습니다.</div> : (
                <div className="flex flex-wrap gap-1.5">{servers.map((sv, idx) => (<span key={idx} className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-2 py-1 text-xs text-slate-300"><Server size={11} className="text-slate-500" />{sv.name || sv}<Badge kind="info">{sv.tier || "WAS"}</Badge><button onClick={() => delSv(idx)} className="text-slate-500 hover:text-red-400"><X size={11} /></button></span>))}</div>
              )}
              <div className="text-xs text-slate-500">부하 중 CPU·메모리·GC·DB 커넥션을 {apm.provider || "APM"}에서 {NQA_APM_AUTO[apm.provider] ? "자동 수집·상관" : "대시보드 시간 정렬"}합니다.</div>
            </Card>
            <Card className="p-4 space-y-3">
              <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Cpu size={15} className="text-teal-400" />부하 생성 인프라</div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="부하 생성기"><Select value={loadgen.tool || ""} onChange={(e) => setCfg({ loadgen: { ...loadgen, tool: e.target.value } })}>{NQA_LOADGEN.map((p) => <option key={p}>{p}</option>)}</Select></Field>
                <Field label="부하 생성기 수 (워커)" hint={"인스턴스당 1 Pod · 최대 " + NQA_MAX_AGENTS + " (테넌트 쿼터)"}><Input type="number" min={1} max={NQA_MAX_AGENTS} value={loadgen.agents || 1} onChange={(e) => setCfg({ loadgen: { ...loadgen, agents: +e.target.value || 1 } })} className="w-24" /></Field>
              </div>
              {(loadgen.agents || 0) > NQA_MAX_AGENTS ? <div className="rounded-lg border border-amber-800 bg-amber-950 px-2.5 py-1.5 text-xs text-amber-300">테넌트 부하 생성 한도({NQA_MAX_AGENTS}) 초과 — 초과분은 큐잉되거나 거절됩니다.</div> : <div className="text-xs text-slate-500">컨트롤러(마스터) 1 + 워커 {loadgen.agents || 1} · 고 RPS는 워커를 늘려 수평 분산(테넌트 쿼터 내).</div>}
            </Card>
          </div>
          <Card className="p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><AlertTriangle size={15} className="text-amber-400" />가드레일</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300"><span>운영 부하 차단</span><Toggle on={guard.blockProd !== false} onClick={() => setCfg({ guard: { ...guard, blockProd: !(guard.blockProd !== false) } })} /></div>
              <div className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-sm text-slate-300"><span>실행 승인 필요</span><Toggle on={!!guard.approval} onClick={() => setCfg({ guard: { ...guard, approval: !guard.approval } })} /></div>
            </div>
            <div className="text-xs font-semibold text-slate-400">부하 상한</div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="최대 RPS"><Input type="number" value={guard.maxRps || 0} onChange={(e) => setCfg({ guard: { ...guard, maxRps: +e.target.value || 0 } })} /></Field>
              <Field label="최대 VU(동시)"><Input type="number" value={guard.maxVu || 0} onChange={(e) => setCfg({ guard: { ...guard, maxVu: +e.target.value || 0 } })} /></Field>
              <Field label="최대 지속(분)"><Input type="number" value={guard.maxDur || 0} onChange={(e) => setCfg({ guard: { ...guard, maxDur: +e.target.value || 0 } })} /></Field>
            </div>
            <div className="text-xs font-semibold text-slate-400">자동 중단 (circuit breaker)</div>
            <div className="grid grid-cols-4 gap-3">
              <Field label="에러율(%)"><Input type="number" value={guard.autoErr || 0} onChange={(e) => setCfg({ guard: { ...guard, autoErr: +e.target.value || 0 } })} /></Field>
              <Field label="p95(ms)"><Input type="number" value={guard.autoP95 || 0} onChange={(e) => setCfg({ guard: { ...guard, autoP95: +e.target.value || 0 } })} /></Field>
              <Field label="서버 CPU(%)"><Input type="number" value={guard.autoCpu || 0} onChange={(e) => setCfg({ guard: { ...guard, autoCpu: +e.target.value || 0 } })} /></Field>
              <Field label="서버 메모리(%)"><Input type="number" value={guard.autoMem || 0} onChange={(e) => setCfg({ guard: { ...guard, autoMem: +e.target.value || 0 } })} /></Field>
            </div>
            <div className="text-xs text-slate-500">클라이언트(에러율·p95)와 <span className="text-slate-400">관측 서버 자원(CPU·메모리)</span> 중 하나라도 임계 초과 시 자동 중단됩니다.</div>
          </Card>
          <div className="text-xs text-slate-500">부하 프로파일(VU/RPS 램프·지속)·SLA는 <span className="text-slate-400">측정 시나리오/계획</span>에서 정의합니다. 대상·환경은 "어디를 때리고 · 무엇을 관측하고 · 어떻게 막을지"를 담습니다. <span className="text-slate-600">· 기능 QA와 완전 독립</span></div>
        </div>
      </div>
      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-semibold text-slate-100">부하 대상 추가</div>
            <Field label="대상 이름"><Input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder="T월드 API 부하" /></Field>
            <Field label="Base URL / 게이트웨이"><Input value={nf.baseUrl} onChange={(e) => setNf({ ...nf, baseUrl: e.target.value })} placeholder="https://api-stg.tworld.co.kr" /></Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="프로토콜"><Select value={nf.protocol} onChange={(e) => setNf({ ...nf, protocol: e.target.value })}>{NQA_PROTOCOLS.map((p) => <option key={p}>{p}</option>)}</Select></Field>
              <Field label="환경"><Select value={nf.env} onChange={(e) => setNf({ ...nf, env: e.target.value })}>{NQA_LOAD_ENVS.map((p) => <option key={p}>{p}</option>)}</Select></Field>
            </div>
            <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setModal(false)}>취소</Btn><Btn kind="primary" icon={Plus} onClick={addSut}>추가</Btn></div>
          </div>
        </div>
      )}
      {epModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setEpModal(false)}>
          <div className="w-full max-w-lg rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-3" style={{ maxHeight: "85vh", overflowY: "auto" }} onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-semibold text-slate-100">대상 엔드포인트 추가</div>
            <div className="grid grid-cols-4 gap-3">
              <Field label="메서드"><Select value={ef.method} onChange={(e) => setEf({ ...ef, method: e.target.value })}>{NQA_HTTP_METHODS.map((m) => <option key={m}>{m}</option>)}</Select></Field>
              <div className="col-span-2"><Field label="경로"><Input value={ef.path} onChange={(e) => setEf({ ...ef, path: e.target.value })} placeholder="/v1/plans" /></Field></div>
              <Field label="믹스(%)"><Input type="number" value={ef.weight} onChange={(e) => setEf({ ...ef, weight: e.target.value })} /></Field>
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
      {svModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setSvModal(false)}>
          <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-3" onClick={(e) => e.stopPropagation()}>
            <div className="text-base font-semibold text-slate-100">관측 서버 인스턴스 추가</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="인스턴스 이름" hint="APM 호스트/태그"><Input value={sf.name} onChange={(e) => setSf({ ...sf, name: e.target.value })} placeholder="was-01" /></Field>
              <Field label="계층"><Select value={sf.tier} onChange={(e) => setSf({ ...sf, tier: e.target.value })}>{NQA_SERVER_TIERS.map((t) => <option key={t}>{t}</option>)}</Select></Field>
            </div>
            <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setSvModal(false)}>취소</Btn><Btn kind="primary" icon={Plus} onClick={addSv}>추가</Btn></div>
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
  const { nqaScenarios, addNqaScenario, updateNqaScenario, removeNqaScenario, nqaSystems } = useApp();
  const [msg, flash] = useToast();
  const list = nqaScenarios || [];
  const systems = (nqaSystems || []).filter((s) => s.subtype === "load");
  const [sel, setSel] = useState(0);
  const scn = list[sel] || list[0] || {};
  const [draft, setDraft] = useState({});
  const cfg = { ...scn, ...draft };
  const dirty = Object.keys(draft).length > 0;
  const setScn = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const sut = systems.find((s) => s.id === cfg.sutId) || {};
  const sutEps = sut.endpoints || [];
  const journey = cfg.journey || [];
  const isJourney = cfg.mode === "순서 저니";
  const unit = cfg.unit || "가상 사용자(VU)";
  const isVu = unit.indexOf("VU") >= 0;
  const totalMin = (cfg.rampUp || 0) + (cfg.sustain || 0) + (cfg.rampDown || 0);
  const shapeHint = (NQA_LOAD_SHAPES.find((s) => s.id === cfg.shape) || {}).hint || "";
  const saveCfg = () => {
    if (!cfg.sutId) { flash("부하 대상을 선택하세요"); return; }
    if (isJourney && journey.length === 0) { flash("저니에 스텝을 1개 이상 추가하세요"); return; }
    if (!cfg.peak) { flash("피크 부하를 입력하세요"); return; }
    updateNqaScenario(scn.id, draft); setDraft({}); flash("시나리오 저장됨");
  };
  const guardSwitch = (fn) => { if (dirty && !window.confirm("저장하지 않은 변경이 있습니다. 이동하시겠습니까?")) return; setDraft({}); fn(); };
  useEffect(() => { setDraft({}); }, [scn.id]);
  const choose = (i) => guardSwitch(() => setSel(i));
  const [modal, setModal] = useState(false);
  const [nf, setNf] = useState({ name: "", sutId: 0, mode: "믹스 재사용", shape: "스테디" });
  const openModal = () => { setNf({ name: "", sutId: (systems[0] || {}).id || 0, mode: "믹스 재사용", shape: "스테디" }); setModal(true); };
  const create = () => {
    if (!nf.sutId) { flash("부하 대상을 선택하세요"); return; }
    const s0 = systems.find((s) => s.id === nf.sutId) || {};
    const name = nf.name.trim() || (s0.name || "부하") + " " + nf.mode;
    const id = Math.max(0, ...list.map((x) => x.id)) + 1;
    const ns = { id, name, sutId: nf.sutId, mode: nf.mode, unit: "가상 사용자(VU)", shape: nf.shape, peak: 500, rampUp: 3, sustain: 15, rampDown: 2, thinkTime: 2, status: "초안", journey: [] };
    guardSwitch(() => { addNqaScenario(ns); setSel(list.length); setModal(false); flash(name + " 생성 (초안)"); });
  };
  const delScn = (i, s) => { if (list.length <= 1) { flash("최소 1개 시나리오는 유지해야 합니다"); return; } if (!window.confirm(s.name + " 시나리오를 삭제할까요?")) return; guardSwitch(() => { removeNqaScenario(s.id); setSel(0); flash(s.name + " 삭제됨"); }); };
  const setJourney = (j) => setScn({ journey: j });
  const addJourneyStep = () => { const e0 = sutEps[0]; if (!e0) { flash("대상에 엔드포인트가 없습니다"); return; } setJourney([...journey, { method: e0.method, path: e0.path }]); };
  const updJourney = (i, patch) => setJourney(journey.map((s, j) => (j === i ? { ...s, ...patch } : s)));
  const delJourney = (i) => setJourney(journey.filter((_, j) => j !== i));
  const mvJourney = (i, d) => { const j = i + d; if (j < 0 || j >= journey.length) return; const a = journey.slice(); const t = a[i]; a[i] = a[j]; a[j] = t; setJourney(a); };
  if (!list.length) return <div className="p-8 text-center text-sm text-slate-500">측정 시나리오가 없습니다.</div>;
  return (
    <div className="space-y-4">
      <PageToolbar desc="부하 대상 선택 · 워크로드(믹스 재사용/순서 저니) · 부하 형상(VU/RPS 램프·지속)" />
      <SubSwitch />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-3">
          <Btn kind="primary" icon={Plus} className="w-full" onClick={openModal}>새 시나리오</Btn>
          {list.map((s, i) => {
            const su = systems.find((x) => x.id === s.sutId) || {};
            return (
              <Card key={s.id} className={"cursor-pointer p-3 " + (sel === i ? "border-teal-500" : "hover:border-slate-700")}>
                <div onClick={() => choose(i)}>
                  <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-100">{s.name}</span><div className="flex items-center gap-1.5"><Badge kind={s.status === "활성" ? "pass" : "draft"}>{s.status}</Badge><button onClick={(e) => { e.stopPropagation(); delScn(i, s); }} className="text-slate-500 hover:text-red-400" title="삭제"><X size={12} /></button></div></div>
                  <div className="mt-1 flex flex-wrap items-center gap-1"><Badge kind="info">{su.name || "대상 미지정"}</Badge><Badge kind={NQA_WORKLOAD_K[s.mode] || "info"}>{s.mode}</Badge></div>
                  <div className="mt-1 text-xs text-slate-500">{s.shape} · 피크 {s.peak} {(s.unit || "").indexOf("VU") >= 0 ? "VU" : "RPS"}</div>
                  <div className="mt-0.5 text-xs text-slate-600">수정 {s.updatedBy || "—"} · {s.updatedAt || "—"}</div>
                </div>
              </Card>
            );
          })}
        </div>
        <div className="col-span-9 space-y-3">
          <Card className="flex flex-wrap items-center justify-between gap-2 p-3">
            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1.5"><div className="w-64 shrink-0"><Input value={cfg.name || ""} onChange={(e) => setScn({ name: e.target.value })} /></div><span className="shrink-0"><Badge kind="info">{sut.name || "대상 미지정"}</Badge></span><span className="shrink-0"><Badge kind={NQA_WORKLOAD_K[cfg.mode] || "info"}>{cfg.mode}</Badge></span></div>
            <div className="flex items-center gap-3"><div className="flex items-center gap-2 text-sm text-slate-300"><span>{cfg.status === "활성" ? "활성" : "초안"}</span><Toggle on={cfg.status === "활성"} onClick={() => setScn({ status: cfg.status === "활성" ? "초안" : "활성" })} /></div>{dirty && <span className="text-xs text-amber-300">미저장 변경</span>}<Btn kind="primary" icon={Save} onClick={saveCfg} disabled={!dirty}>시나리오 저장</Btn></div>
          </Card>

          <div className="flex items-center gap-3 text-xs text-slate-500"><span>생성 <span className="text-slate-400">{cfg.createdBy || "—"}</span> · {cfg.createdAt || "—"}</span><span className="text-slate-600">·</span><span>수정 <span className="text-slate-400">{cfg.updatedBy || "—"}</span> · {cfg.updatedAt || "—"}</span></div>
          <Card className="p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Link2 size={15} className="text-teal-400" />부하 대상 <span className="text-xs font-normal text-slate-500">· 이 시나리오가 때릴 SUT</span></div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="대상(SUT)"><Select value={cfg.sutId || ""} onChange={(e) => setScn({ sutId: Number(e.target.value) })}><option value="">선택하세요</option>{systems.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}</Select></Field>
              <Field label="엔드포인트"><div className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-xs text-slate-400">{sutEps.length}개 · {sut.protocol || "-"} · {sut.env || "-"}</div></Field>
            </div>
            {sut.baseUrl && <div className="truncate font-mono text-xs text-slate-500">{sut.baseUrl}</div>}
            {!cfg.sutId && <div className="rounded-lg bg-slate-800 p-2.5 text-xs text-amber-300">대상을 선택해야 워크로드를 구성할 수 있습니다.</div>}
          </Card>

          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Package size={15} className="text-teal-400" />워크로드 <span className="text-xs font-normal text-slate-500">· 무엇을 어떤 순서로</span></div>
              <Seg options={NQA_WORKLOAD_MODES} value={cfg.mode || "믹스 재사용"} onChange={(v) => setScn({ mode: v })} />
            </div>
            {!isJourney ? (
              <div className="space-y-1.5">
                <div className="text-xs text-slate-500">대상의 엔드포인트 믹스(가중치)를 그대로 사용합니다.</div>
                {sutEps.length === 0 ? <div className="rounded-lg bg-slate-800 p-3 text-xs text-slate-500">대상에 엔드포인트가 없습니다.</div> : sutEps.map((ep, i) => (
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
                  <div className="text-xs text-slate-500">순서 있는 사용자 저니 — 상관(correlation)이 이 순서로 흐릅니다.</div>
                  <Btn icon={Plus} onClick={addJourneyStep}>스텝 추가</Btn>
                </div>
                {journey.length === 0 ? <div className="rounded-lg bg-slate-800 p-3 text-xs text-slate-500">스텝이 없습니다 — 대상 엔드포인트를 순서대로 배치하세요.</div> : journey.map((s, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-sm">
                    <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-xs text-slate-400">{i + 1}</span>
                    <div className="flex-1"><Select value={s.method + " " + s.path} onChange={(e) => { const ep = sutEps.find((x) => x.method + " " + x.path === e.target.value); if (ep) updJourney(i, { method: ep.method, path: ep.path }); }}>{sutEps.map((ep, j) => <option key={j} value={ep.method + " " + ep.path}>{ep.method} {ep.path}</option>)}</Select></div>
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
            <div className="rounded-lg bg-slate-800 p-2.5 text-xs text-slate-400">총 {totalMin}분 · 피크 {cfg.peak || 0} {isVu ? "VU" : "RPS"} · {isVu ? "닫힌 모델(VU+생각시간)" : "열린 모델(도착률 고정)"}. SLA 합격 임계·baseline 대비는 <span className="text-slate-300">측정 계획</span>에서 판정합니다.</div>
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
            <Field label="워크로드"><Seg options={NQA_WORKLOAD_MODES} value={nf.mode} onChange={(v) => setNf({ ...nf, mode: v })} /></Field>
            <Field label="부하 유형"><Select value={nf.shape} onChange={(e) => setNf({ ...nf, shape: e.target.value })}>{NQA_LOAD_SHAPES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</Select></Field>
            <div className="rounded-lg bg-slate-800 p-2.5 text-xs text-slate-400">{nf.mode === "순서 저니" ? "생성 후 대상 엔드포인트를 순서대로 배치합니다." : "대상의 엔드포인트 믹스를 그대로 사용합니다."}</div>
            <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setModal(false)}>취소</Btn><Btn kind="primary" icon={Plus} onClick={create}>생성</Btn></div>
          </div>
        </div>
      )}
      <Toast msg={msg} />
    </div>
  );
}

export function NqaPlanScreen() {
  const { nqaPlans, addNqaPlan, updateNqaPlan, removeNqaPlan, nqaScenarios, nqaSystems } = useApp();
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
  const setBase = (patch) => setPlan({ baseline: { ...(cfg.baseline || {}), ...patch } });
  const scn = scns.find((s) => s.id === cfg.scenarioId) || {};
  const sut = systems.find((s) => s.id === scn.sutId) || {};
  const sla = cfg.sla || {};
  const base = cfg.baseline || {};
  const num = (v) => (v === "" || v == null ? "" : Number(v));
  const saveCfg = () => { if (!cfg.scenarioId) { flash("측정 시나리오를 선택하세요"); return; } updateNqaPlan(pl.id, draft); setDraft({}); flash("측정 계획 저장됨"); };
  const guardSwitch = (fn) => { if (dirty && !window.confirm("저장하지 않은 변경이 있습니다. 이동하시겠습니까?")) return; setDraft({}); fn(); };
  useEffect(() => { setDraft({}); }, [pl.id]);
  const choose = (i) => guardSwitch(() => setSel(i));
  const [modal, setModal] = useState(false);
  const [nf, setNf] = useState({ name: "", scenarioId: 0 });
  const openModal = () => { setNf({ name: "", scenarioId: (scns[0] || {}).id || 0 }); setModal(true); };
  const create = () => {
    if (!nf.scenarioId) { flash("측정 시나리오를 선택하세요"); return; }
    const s0 = scns.find((s) => s.id === nf.scenarioId) || {};
    const name = nf.name.trim() || (s0.name || "부하") + " 계획";
    const id = Math.max(0, ...list.map((x) => x.id)) + 1;
    const np = { id, name, scenarioId: nf.scenarioId, status: "초안", sla: { p95: 2000, p99: 3000, errRate: 1.0, minRps: 500 }, baseline: { mode: "없음", runId: "", tolerance: 10 }, trigger: "수동 실행" };
    guardSwitch(() => { addNqaPlan(np); setSel(list.length); setModal(false); flash(name + " 생성 (초안)"); });
  };
  const delPlan = (i, p) => { if (list.length <= 1) { flash("최소 1개 계획은 유지해야 합니다"); return; } if (!window.confirm(p.name + " 계획을 삭제할까요?")) return; guardSwitch(() => { removeNqaPlan(p.id); setSel(0); flash(p.name + " 삭제됨"); }); };
  if (!list.length) return <div className="p-8 text-center text-sm text-slate-500">측정 계획이 없습니다.</div>;
  const workloadTxt = scn.id ? (scn.mode + " · " + scn.shape + " · 피크 " + scn.peak + " " + ((scn.unit || "").indexOf("VU") >= 0 ? "VU" : "RPS")) : "";
  return (
    <div className="space-y-4">
      <PageToolbar desc="대상 × 시나리오 + SLA 판정 임계(합격/불합격) + baseline 대비 — 계획이 아우름" />
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
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Link2 size={15} className="text-teal-400" />대상 × 시나리오 <span className="text-xs font-normal text-slate-500">· 무엇을 얼마나 때릴지</span></div>
            <Field label="측정 시나리오"><Select value={cfg.scenarioId || ""} onChange={(e) => setPlan({ scenarioId: Number(e.target.value) })}><option value="">선택하세요</option>{scns.map((s) => { const su = systems.find((x) => x.id === s.sutId) || {}; return <option key={s.id} value={s.id}>{s.name} · {su.name || "대상 미지정"}</option>; })}</Select></Field>
            {scn.id ? (
              <div className="rounded-lg bg-slate-800 p-2.5 text-xs text-slate-400">대상 <span className="text-slate-200">{sut.name}</span> · <span className="font-mono">{sut.baseUrl}</span><br />워크로드 <span className="text-slate-300">{workloadTxt}</span></div>
            ) : <div className="rounded-lg border border-amber-800 bg-amber-950 px-2.5 py-1.5 text-xs text-amber-300">시나리오를 선택하면 대상·부하 형상이 계획에 반영됩니다.</div>}
          </Card>

          <Card className="p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Activity size={15} className="text-teal-400" />SLA 판정 임계 <span className="text-xs font-normal text-slate-500">· 합격/불합격 기준</span></div>
            <div className="grid grid-cols-4 gap-3">
              <Field label="p95 응답 ≤ (ms)"><Input type="number" value={sla.p95 ?? ""} onChange={(e) => setSla({ p95: num(e.target.value) })} /></Field>
              <Field label="p99 응답 ≤ (ms)"><Input type="number" value={sla.p99 ?? ""} onChange={(e) => setSla({ p99: num(e.target.value) })} /></Field>
              <Field label="에러율 ≤ (%)"><Input type="number" value={sla.errRate ?? ""} onChange={(e) => setSla({ errRate: num(e.target.value) })} /></Field>
              <Field label="최소 처리량 ≥ (RPS)"><Input type="number" value={sla.minRps ?? ""} onChange={(e) => setSla({ minRps: num(e.target.value) })} /></Field>
            </div>
            <div className="rounded-lg bg-slate-800 p-2.5 text-xs text-slate-400">실행 결과가 위 임계를 <span className="text-slate-200">모두 만족하면 합격</span>, 하나라도 벗어나면 불합격으로 판정합니다. ＊ 대상·환경의 자동 중단(가드레일)과는 별개 — 그건 실행을 멈추는 안전장치, 여기는 합격 판정 기준입니다.</div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><TrendingUp size={15} className="text-teal-400" />baseline 대비 <span className="text-xs font-normal text-slate-500">· 성능 회귀 판정</span></div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="기준(baseline)"><Select value={base.mode || "없음"} onChange={(e) => setBase({ mode: e.target.value })}>{NQA_BASELINE_MODES.map((m) => <option key={m}>{m}</option>)}</Select></Field>
              {base.mode === "고정 회차" && <Field label="기준 회차 ID"><Input value={base.runId || ""} onChange={(e) => setBase({ runId: e.target.value })} placeholder="RUN-2026-0612-03" /></Field>}
              {base.mode !== "없음" && <Field label="허용 저하 (p95 +%)"><Input type="number" value={base.tolerance ?? ""} onChange={(e) => setBase({ tolerance: num(e.target.value) })} /></Field>}
            </div>
            <div className="rounded-lg bg-slate-800 p-2.5 text-xs text-slate-400">{base.mode === "없음" ? "회귀 판정 없이 SLA 임계만으로 합격/불합격을 정합니다." : "이번 회차 p95가 기준 대비 " + (base.tolerance || 0) + "% 이내면 통과, 초과하면 성능 회귀로 표시합니다."}</div>
          </Card>

          <Card className="p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-200 flex items-center gap-2"><Zap size={15} className="text-teal-400" />실행 트리거</div>
            <Field label="언제 실행"><div style={{ maxWidth: 240 }}><Select value={cfg.trigger || "수동 실행"} onChange={(e) => setPlan({ trigger: e.target.value })}>{NQA_PLAN_TRIGGERS.map((t) => <option key={t}>{t}</option>)}</Select></div></Field>
            <div className="text-xs text-slate-500">운영 환경 부하 차단 등 가드레일은 대상·환경 설정을 그대로 따릅니다. 트리거는 이 계획을 언제 큐에 넣을지만 정합니다.</div>
          </Card>
        </div>
      </div>
      {modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 p-4" onClick={() => setModal(false)}>
          <div className="w-full max-w-md space-y-3 rounded-xl border border-slate-700 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="text-sm font-semibold text-slate-100">새 측정 계획</div>
            <Field label="이름 (비우면 자동)"><Input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder="계획 이름" /></Field>
            <Field label="측정 시나리오"><Select value={nf.scenarioId || ""} onChange={(e) => setNf({ ...nf, scenarioId: Number(e.target.value) })}><option value="">선택하세요</option>{scns.map((s) => { const su = systems.find((x) => x.id === s.sutId) || {}; return <option key={s.id} value={s.id}>{s.name} · {su.name || "대상 미지정"}</option>; })}</Select></Field>
            <div className="rounded-lg bg-slate-800 p-2.5 text-xs text-slate-400">SLA 임계·baseline은 생성 후 기본값으로 채워지며, 상세에서 조정합니다.</div>
            <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setModal(false)}>취소</Btn><Btn kind="primary" icon={Plus} onClick={create}>생성</Btn></div>
          </div>
        </div>
      )}
      <Toast msg={msg} />
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
