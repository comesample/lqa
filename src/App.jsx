import { useState, useRef, useEffect, createContext, useContext } from "react";
import {
  LayoutDashboard, ClipboardList, MessageSquare, Play, GitCompare, Bug,
  SlidersHorizontal, ShieldCheck, CheckCircle2, XCircle, AlertTriangle,
  ChevronRight, Plus, Search, Bell, Server, TrendingUp, TrendingDown,
  Sparkles, FileDown, Ghost, Lock, Send, X, Megaphone, Slack, Mail,
  FileText, Calendar, RefreshCw, Trash2, ExternalLink, Plug, Link2, Filter,
  Building2, Users, Cpu, CreditCard, ScrollText, Shield, ArrowLeft, UserCog, Tag, Upload, History, Brain, Code2, Video, Layers
} from "lucide-react";
import { FqaRecordScreen, FqaExcelScreen, FqaMcpScreen, FqaEditorScreen, FqaSuiteScreen, FqaRunScreen, FqaHistoryScreen, FqaResultScreen, FqaDashboardScreen, FqaCasesScreen, FqaTargetScreen, FqaPlanScreen } from "./fqa/screens.jsx";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { C, vKind } from "./common/theme.js";
import { Badge, ScoreBar, Card, Field, Btn, Input, Select, Toggle, Modal } from "./common/ui.jsx";
import { AppCtx, useApp } from "./common/context.js";
import { ConsoleShell, NewTenantForm, AssignAdminForm, NewModelForm } from "./common/console.jsx";

/* ============================ static data ============================ */
import { SECTIONS, NAV, TREND, METRICS, INIT_CASES, APPROVED_INIT, mkResults, INIT_PLANS, INIT_RUNS, INIT_JUDGES, PROMPT_VARS, INIT_PROMPTS, INIT_DEFECTS, INIT_CHATBOTS } from "./lqa/data.js";
import { DOMAINS, COMMON_SECTIONS, MEMBERS_ITEM, INIT_TENANTS, INIT_USERS, INIT_MODELS } from "./common/data.js";
import { FQA_SECTIONS, INIT_FQA_CASES, INIT_FQA_SUITES, INIT_FQA_SYSTEMS, INIT_FQA_RUNS, INIT_FQA_PLANS, FQA_HIDDEN } from "./fqa/data.js";
import { NewPlanForm, AiGenForm, NewCaseForm, JiraForm, AddPromptForm, PlanCasesForm, JiraConfigForm, AddChatbotForm, Targets, Dashboard, Plans, RunHistory, CategoryManager, ImportCasesForm, Cases, Run, Compare, Defects, Report, Settings, InviteMemberForm, MembersView } from "./lqa/screens.jsx";

/* ============================ context ============================ */

export default function App() {
  const [view, setView] = useState("dashboard");
  const [fqaTab, setFqaTab] = useState("상세");
  const [env, setEnv] = useState("전체");
  const [toasts, setToasts] = useState([]);
  const [notifs, setNotifs] = useState([
    { icon: "play", text: "요금/청구 평가 완료 — PASS율 79%", t: "14:36" },
    { icon: "bug", text: "TWORLD-1842 자동 등록 (PII)", t: "14:36" },
  ]);
  const [bellOpen, setBellOpen] = useState(false);
  const [modal, setModal] = useState(null);
  const [cases, setCases] = useState(INIT_CASES);
  const [categories, setCategories] = useState(["요금제", "부가서비스", "결제/청구", "개통", "안전성"]);
  const [plans, setPlans] = useState(INIT_PLANS);
  const [runs, setRuns] = useState(INIT_RUNS);
  const [runIntent, setRunIntent] = useState(null);
  const [defects, setDefects] = useState(INIT_DEFECTS);
  const [fqaCases, setFqaCases] = useState(INIT_FQA_CASES);
  const [fqaSuites, setFqaSuites] = useState(INIT_FQA_SUITES);
  const [fqaSystems, setFqaSystems] = useState(INIT_FQA_SYSTEMS);
  const [fqaRuns, setFqaRuns] = useState(INIT_FQA_RUNS);
  const [fqaPlans, setFqaPlans] = useState(INIT_FQA_PLANS);
  const [fqaResultRun, setFqaResultRun] = useState("FRUN-502");
  const [runnerConnected, setRunnerConnected] = useState(true);
  const [fqaEditTc, setFqaEditTc] = useState(null);
  const [fqaResultFrom, setFqaResultFrom] = useState("fqa-history");
  const [judges, setJudges] = useState(INIT_JUDGES);
  const [prompts, setPrompts] = useState(INIT_PROMPTS);
  const [chatbots, setChatbots] = useState(INIT_CHATBOTS);
  const [role, setRole] = useState("admin");
  const [space, setSpace] = useState("product");
  const [domain, setDomain] = useState("LQA");
  const [tenants, setTenants] = useState(INIT_TENANTS);
  const [tenantId, setTenantId] = useState("t1");
  const [users, setUsers] = useState(INIT_USERS);
  const [models, setModels] = useState(INIT_MODELS);
  const tid = useRef(0);

  const toast = (msg, kind = "info") => {
    const id = ++tid.current; setToasts((t) => [...t, { id, msg, kind }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2600);
  };
  const now = () => new Date().toTimeString().slice(0, 5);
  const notify = (n) => setNotifs((x) => [{ ...n, t: now() }, ...x].slice(0, 12));
  const api = {
    goto: setView, env, setEnv, toast, notify, openModal: (type, data) => setModal({ type, data }),
    cases, addCases: (arr) => setCases((c) => [...arr, ...c]),
    setCaseStatus: (id, status) => setCases((c) => c.map((x) => (x.id === id ? { ...x, status } : x))),
    categories, addCategory: (n) => setCategories((x) => (x.includes(n) ? x : [...x, n])), removeCategory: (n) => setCategories((x) => x.filter((c) => c !== n)),
    plans, addPlan: (p) => setPlans((x) => [...x, p]), updatePlan: (id, patch) => setPlans((x) => x.map((p) => (p.id === id ? { ...p, ...patch } : p))), removePlan: (id) => setPlans((x) => x.filter((p) => p.id !== id)),
    runs, addRun: (r) => setRuns((x) => [r, ...x]), updateRun: (id, patch) => setRuns((x) => x.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    runIntent, setRunIntent,
    defects, addDefect: (d) => setDefects((x) => [d, ...x]), setDefectStatus: (key, status) => setDefects((x) => x.map((d) => (d.key === key ? { ...d, status } : d))),
    fqaCases, addFqaCase: (c) => setFqaCases((x) => [c, ...x]), updateFqaCase: (id, patch) => setFqaCases((x) => x.map((c) => (c.id === id ? { ...c, ...patch } : c))), setFqaCaseStatus: (id, status) => setFqaCases((x) => x.map((c) => (c.id === id ? { ...c, status } : c))), removeFqaCase: (id) => setFqaCases((x) => x.filter((c) => c.id !== id)),
    fqaSuites, addFqaSuite: (su) => setFqaSuites((x) => [...x, su]), updateFqaSuite: (id, patch) => setFqaSuites((x) => x.map((su) => (su.id === id ? { ...su, ...patch } : su))), removeFqaSuite: (id) => setFqaSuites((x) => x.filter((su) => su.id !== id)),
    fqaSystems, addFqaSystem: (sy) => setFqaSystems((x) => [...x, sy]), updateFqaSystem: (id, patch) => setFqaSystems((x) => x.map((sy) => (sy.id === id ? { ...sy, ...patch } : sy))), removeFqaSystem: (id) => setFqaSystems((x) => x.filter((sy) => sy.id !== id)),
    fqaRuns, addFqaRun: (r) => setFqaRuns((x) => [r, ...x]), updateFqaRun: (id, patch) => setFqaRuns((x) => x.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    fqaPlans, addFqaPlan: (pl) => setFqaPlans((x) => [pl, ...x]), updateFqaPlan: (id, patch) => setFqaPlans((x) => x.map((pl) => (pl.id === id ? { ...pl, ...patch } : pl))), removeFqaPlan: (id) => setFqaPlans((x) => x.filter((pl) => pl.id !== id)),
    fqaResultRun, setFqaResultRun,
    runnerConnected, setRunnerConnected,
    fqaEditTc, setFqaEditTc,
    judges, toggleJudge: (name) => setJudges((x) => x.map((j) => (j.name === name ? { ...j, enabled: !j.enabled } : j))),
    prompts, addPrompt: (p) => setPrompts((x) => [...x, p]), updatePrompt: (name, patch) => setPrompts((x) => x.map((pp) => (pp.name === name ? { ...pp, ...patch } : pp))), removePrompt: (name) => setPrompts((x) => x.filter((pp) => pp.name !== name)),
    chatbots, addChatbot: (c) => setChatbots((x) => [...x, c]), updateChatbot: (id, patch) => setChatbots((x) => x.map((c) => (c.id === id ? { ...c, ...patch } : c))), removeChatbot: (id) => setChatbots((x) => x.filter((c) => c.id !== id)),
    setChatbotStatus: (id, status) => setChatbots((x) => x.map((c) => (c.id === id ? { ...c, status } : c))),
    role, setRole, space, setSpace, domain, setDomain, tenants, tenantId, setTenantId,
    addTenant: (t) => setTenants((x) => [...x, t]),
    setTenantStatus: (id, status) => setTenants((x) => x.map((t) => (t.id === id ? { ...t, status } : t))),
    setTenantAdmin: (id, admin) => setTenants((x) => x.map((t) => (t.id === id ? { ...t, admin } : t))),
    users, addUser: (u) => setUsers((x) => [...x, u]),
    setUserStatus: (id, status) => setUsers((x) => x.map((u) => (u.id === id ? { ...u, status } : u))),
    removeUser: (id) => setUsers((x) => x.filter((u) => u.id !== id)),
    models, addModel: (m) => setModels((x) => [...x, m]),
    setModelStatus: (id, status) => setModels((x) => x.map((m) => (m.id === id ? { ...m, status } : m))),
  };
  const ALL_SECTIONS = [...SECTIONS, ...FQA_SECTIONS, ...COMMON_SECTIONS];
  const cur = [...ALL_SECTIONS.flatMap((s) => s.items), ...FQA_HIDDEN, MEMBERS_ITEM].find((n) => n.id === view) || NAV[0];
  const curSection = ((ALL_SECTIONS.find((s) => s.items.some((i) => i.id === view)) || {}).group) || (FQA_HIDDEN.find((i) => i.id === view) || {}).group;
  const tenantName = (tenants.find((t) => t.id === tenantId) || {}).name;
  const screens = { dashboard: <Dashboard />, plans: <Plans />, cases: <Cases />, run: <Run />, history: <RunHistory />, compare: <Compare />, defects: <Defects />, report: <Report />, targets: <Targets />, settings: <Settings />, members: <MembersView />, "fqa-dashboard": <FqaDashboardScreen nav={(v, arg) => { if (v === "fqa-result-detail" && arg) { setFqaResultRun(arg); setFqaResultFrom("fqa-dashboard"); } setView(v); }} />, "fqa-targets": <FqaTargetScreen />, "fqa-suites": <FqaSuiteScreen />, "fqa-cases": <FqaCasesScreen />, "fqa-plan": <FqaPlanScreen nav={(v, rid) => { if (rid) setFqaResultRun(rid); setView(v); }} />, "fqa-run": <FqaRunScreen nav={(rid) => { setFqaResultRun(rid); setFqaResultFrom("fqa-run"); setView("fqa-result-detail"); }} />, "fqa-history": <FqaHistoryScreen nav={(rid) => { setFqaResultRun(rid); setFqaResultFrom("fqa-history"); setView("fqa-result-detail"); }} />, "fqa-regression": <FqaResultScreen mode="회귀" />, "fqa-flaky": <FqaResultScreen mode="불안정" nav={(v, tc) => { if (tc) setFqaEditTc(tc); setView(v); }} />, "fqa-result-detail": <FqaResultScreen mode="상세" runId={fqaResultRun} back={() => setView(fqaResultFrom || "fqa-history")} backLabel={{ "fqa-run": "실행", "fqa-history": "실행 이력", "fqa-dashboard": "대시보드" }[fqaResultFrom] || "뒤로"} /> };
  const tk = { ok: "border-emerald-700 bg-emerald-900", warn: "border-amber-700 bg-amber-900", err: "border-red-700 bg-red-900", info: "border-slate-700 bg-slate-800" };
  const nIcon = { play: Play, bug: Bug, send: Send };

  return (
    <AppCtx.Provider value={api}>
      <div className="flex h-screen bg-slate-950 text-slate-200" style={{ fontFamily: "'Malgun Gothic', system-ui, sans-serif" }}>
        {space === "product" && (
      <div className="flex flex-col flex-1 min-w-0">
        {/* ── 상단 앱바 (로고 · 검증 영역 · 전역 컨트롤) ── */}
        <div className="flex items-center justify-between gap-4 px-5 h-14 shrink-0 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2 shrink-0"><div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-slate-900 font-bold text-sm">Q</div><span className="font-bold text-slate-100">eX.Q</span><span className="text-slate-500" style={{ fontSize: 10 }}>eXecute QA</span></div>
          <div className="flex items-center gap-3 text-sm shrink-0">
              <div className="flex items-center gap-1 border-r border-slate-800 pr-3 overflow-x-auto">
                {DOMAINS.map((d) => (
                  <button key={d.id} onClick={() => { if (!d.ready) { toast(d.label + "는 준비 중입니다 (확장 예정)", "info"); return; } setDomain(d.id); setView(d.id === "FQA" ? "fqa-dashboard" : "dashboard"); }} className={"shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold " + (domain === d.id ? "bg-teal-600 text-white" : d.ready ? "text-slate-300 hover:bg-slate-800" : "text-slate-600")}>
                    {d.label}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-1.5" title="테넌트(조직)"><Building2 size={13} className="text-slate-500" />{role === "admin" ? <select value={tenantId} onChange={(e) => { setTenantId(e.target.value); toast("테넌트 전환: " + ((tenants.find((t) => t.id === e.target.value) || {}).name), "info"); }} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs">{tenants.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}</select> : <span className="rounded-lg bg-slate-800 border border-slate-700 px-2.5 py-1.5 text-slate-300 text-xs">{tenantName}</span>}</div>
              <div className="flex items-center gap-1.5" title="보기 환경 필터"><Filter size={13} className="text-slate-500" /><select value={env} onChange={(e) => { setEnv(e.target.value); toast("환경 필터: " + e.target.value, "info"); }} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs"><option>전체</option><option>운영</option><option>스테이징</option><option>개발</option></select></div>
              <div className="relative">
                <button onClick={() => setBellOpen(!bellOpen)} className="relative text-slate-400 hover:text-slate-200"><Bell size={18} />{notifs.length > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 text-white text-xs flex items-center justify-center" style={{ fontSize: 9 }}>{notifs.length}</span>}</button>
                {bellOpen && (
                  <div className="absolute right-0 mt-2 w-80 rounded-xl border border-slate-800 bg-slate-900 shadow-xl z-30">
                    <div className="px-4 py-2.5 border-b border-slate-800 flex items-center justify-between"><span className="text-sm font-semibold text-slate-200">알림</span><button onClick={() => { setNotifs([]); }} className="text-xs text-slate-500 hover:text-slate-300">모두 지우기</button></div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifs.length === 0 && <div className="px-4 py-6 text-center text-sm text-slate-500">알림이 없습니다.</div>}
                      {notifs.map((n, i) => { const NI = nIcon[n.icon] || Bell; return (
                        <div key={i} className="px-4 py-2.5 border-b border-slate-800 flex items-start gap-3"><NI size={15} className="text-teal-400 mt-0.5" /><div className="flex-1"><div className="text-sm text-slate-200">{n.text}</div><div className="text-xs text-slate-500">{n.t}</div></div></div>
                      ); })}
                    </div>
                    <button onClick={() => { setBellOpen(false); setView("report"); }} className="w-full text-center text-xs text-teal-400 py-2.5 hover:bg-slate-800">리포트 · 알림 설정 →</button>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-1.5" title="역할 전환 (데모)"><UserCog size={15} className="text-slate-500" /><select value={role} onChange={(e) => setRole(e.target.value)} className="bg-slate-800 border border-slate-700 rounded-lg px-2.5 py-1.5 text-slate-300 text-xs"><option value="admin">서비스 관리자</option><option value="tadmin">조직 관리자</option><option value="user">QA 엔지니어</option></select></div>
              <Server size={17} className="text-emerald-400" />
            </div>
        </div>
        {/* ── 사이드바(메뉴) + 본문 ── */}
        <div className="flex flex-1 min-h-0">
          <aside className="w-60 shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col">
            <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
              {[...(domain === "FQA" ? FQA_SECTIONS : SECTIONS), ...COMMON_SECTIONS].map((sec) => (
                <div key={sec.group}>
                  <div className="px-3 mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">{sec.group}</div>
                  <div className="space-y-1">
                    {sec.items.map((n) => { const Icon = n.icon; const on = view === n.id; return (
                      <button key={n.id} onClick={() => setView(n.id)} className={"w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm " + (on ? "bg-teal-600 text-white font-semibold" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200")}><Icon size={16} />{n.label}</button>
                    ); })}
                  </div>
                </div>
              ))}
              {role === "tadmin" && (
                <div>
                  <div className="px-3 mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">관리</div>
                  <div className="space-y-1">
                    <button onClick={() => setView("members")} className={"w-full flex items-center gap-3 rounded-lg px-3 py-2 text-sm " + (view === "members" ? "bg-teal-600 text-white font-semibold" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200")}><UserCog size={16} />조직 관리</button>
                  </div>
                </div>
              )}
            </nav>
            {role === "admin" && (
              <div className="px-3 pb-2"><button onClick={() => setSpace("console")} className="w-full flex items-center gap-2 rounded-lg border border-slate-800 px-3 py-2.5 text-sm text-amber-300 hover:bg-slate-800"><Shield size={16} />관리자 콘솔</button></div>
            )}
            <div className="p-3 border-t border-slate-800 text-xs text-slate-500 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-emerald-400" />엔진 연결됨 · {tenantName}</div>
          </aside>
          <main className="flex-1 flex flex-col overflow-hidden">
            <header className="flex items-center px-6 py-3.5 border-b border-slate-800 bg-slate-900">
              <div>
                <div className="text-xs font-semibold text-slate-500 mb-0.5">{curSection}</div>
                <div className="flex items-center gap-2"><cur.icon size={18} className="text-teal-400" /><h1 className="text-lg font-bold text-slate-100">{cur.label}</h1></div>
              </div>
            </header>
            <div className="flex-1 overflow-y-auto p-6">{screens[view]}</div>
          </main>
        </div>
      </div>
      )}
        {space === "console" && <ConsoleShell />}

        {/* modals */}
        {modal && (() => {
          const close = () => setModal(null);
          const map = {
            newPlan: ["새 평가 계획", <NewPlanForm close={close} data={modal.data} />],
            aiGen: ["AI 발화 생성", <AiGenForm close={close} />],
            newCase: ["테스트케이스 등록", <NewCaseForm close={close} />],
            catMgr: ["카테고리 관리", <CategoryManager close={close} />],
            importCases: ["Excel 일괄 업로드", <ImportCasesForm close={close} />],
            jira: ["결함 등록", <JiraForm close={close} data={modal.data} />, true],
            addPrompt: ["Prompt 템플릿 " + (modal.data ? "편집" : "추가"), <AddPromptForm close={close} data={modal.data} />],
            planCases: ["평가 계획 케이스 선택", <PlanCasesForm close={close} data={modal.data} />, true],
            addChatbot: ["챗봇 " + (modal.data ? "편집" : "연결 추가"), <AddChatbotForm close={close} data={modal.data} />, true],
            jiraConfig: ["Jira 연동 설정", <JiraConfigForm close={close} />, true],
            newTenant: ["조직(테넌트) 추가", <NewTenantForm close={close} />],
            assignAdmin: ["조직 관리자 지정", <AssignAdminForm close={close} data={modal.data} />],
            inviteMember: ["멤버 초대", <InviteMemberForm close={close} />],
            newModel: ["AI 모델 등록", <NewModelForm close={close} />],
          };
          const [title, body, wide] = map[modal.type] || ["", null, false];
          return <Modal title={title} onClose={close} wide={wide}>{body}</Modal>;
        })()}

        {/* toasts */}
        <div className="fixed bottom-5 right-5 z-50 space-y-2">
          {toasts.map((t) => (
            <div key={t.id} className={"flex items-center gap-2 rounded-lg border px-4 py-2.5 text-sm text-slate-100 shadow-lg " + (tk[t.kind] || tk.info)}>
              {t.kind === "ok" ? <CheckCircle2 size={16} className="text-emerald-300" /> : t.kind === "err" ? <XCircle size={16} className="text-red-300" /> : t.kind === "warn" ? <AlertTriangle size={16} className="text-amber-300" /> : <Bell size={16} className="text-slate-300" />}
              {t.msg}
            </div>
          ))}
        </div>
      </div>
    </AppCtx.Provider>
  );
}
