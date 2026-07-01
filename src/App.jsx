import { useState, useRef, useEffect, createContext, useContext } from "react";
import {
  LayoutDashboard, ClipboardList, MessageSquare, Play, GitCompare, Bug,
  SlidersHorizontal, ShieldCheck, CheckCircle2, XCircle, AlertTriangle,
  ChevronRight, Plus, Search, Bell, Server, TrendingUp, TrendingDown,
  Sparkles, FileDown, Ghost, Lock, Send, X, Megaphone, Slack, Mail,
  FileText, Calendar, RefreshCw, Trash2, ExternalLink, Plug, Link2, Filter,
  Building2, Users, Cpu, CreditCard, ScrollText, Shield, ArrowLeft, UserCog, Tag, Upload, History, Brain, Code2, Video, Layers
} from "lucide-react";
import FqaAiGenScreen from "./fqa/aigen.jsx";
import { FqaRecordScreen, FqaExcelScreen, FqaMcpScreen, FqaEditorScreen, FqaSuiteScreen, FqaRunScreen, FqaResultScreen, FqaDashboardScreen, FqaCasesScreen, FqaTargetScreen, FqaPlanScreen } from "./fqa/screens.jsx";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend
} from "recharts";
import { C, vKind } from "./common/theme.js";
import { Badge, ScoreBar, Card, Field, Btn, Input, Select, Toggle, Modal } from "./common/ui.jsx";
import { AppCtx, useApp } from "./common/context.js";
import { ConsoleShell, NewTenantForm, AssignAdminForm, NewModelForm } from "./common/console.jsx";

/* ============================ static data ============================ */
import { SECTIONS, NAV, MEMBERS_ITEM, FQA_SECTIONS, COMMON_SECTIONS, TREND, METRICS, INIT_CASES, APPROVED_INIT, mkResults, INIT_PLANS, INIT_RUNS, INIT_JUDGES, PROMPT_VARS, INIT_PROMPTS, INIT_DEFECTS, INIT_CHATBOTS, INIT_TENANTS, DOMAINS, INIT_USERS, INIT_MODELS } from "./lqa/data.js";
import { NewPlanForm, AiGenForm, NewCaseForm, JiraForm, AddJudgeForm, AddPromptForm, JiraConfigForm, AddChatbotForm, Targets, Dashboard, Plans, RunHistory, CategoryManager, ImportCasesForm, Cases, Run, Compare, Defects, Report, Settings, InviteMemberForm, MembersView } from "./lqa/screens.jsx";

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
    plans, addPlan: (p) => setPlans((x) => [...x, p]), updatePlan: (id, patch) => setPlans((x) => x.map((p) => (p.id === id ? { ...p, ...patch } : p))),
    runs, addRun: (r) => setRuns((x) => [r, ...x]), updateRun: (id, patch) => setRuns((x) => x.map((r) => (r.id === id ? { ...r, ...patch } : r))),
    runIntent, setRunIntent,
    defects, addDefect: (d) => setDefects((x) => [d, ...x]),
    judges, toggleJudge: (name) => setJudges((x) => x.map((j) => (j.name === name ? { ...j, enabled: !j.enabled } : j))),
    prompts, addPrompt: (p) => setPrompts((x) => [...x, p]),
    chatbots, addChatbot: (c) => setChatbots((x) => [...x, c]),
    setChatbotStatus: (id, status) => setChatbots((x) => x.map((c) => (c.id === id ? { ...c, status } : c))),
    role, setRole, space, setSpace, domain, tenants, tenantId, setTenantId,
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
  const cur = [...ALL_SECTIONS.flatMap((s) => s.items), MEMBERS_ITEM].find((n) => n.id === view) || NAV[0];
  const curSection = (ALL_SECTIONS.find((s) => s.items.some((i) => i.id === view)) || {}).group;
  const tenantName = (tenants.find((t) => t.id === tenantId) || {}).name;
  const screens = { dashboard: <Dashboard />, plans: <Plans />, cases: <Cases />, run: <Run />, history: <RunHistory />, compare: <Compare />, defects: <Defects />, report: <Report />, targets: <Targets />, settings: <Settings />, members: <MembersView />, "fqa-dashboard": <FqaDashboardScreen nav={(v, t) => { setFqaTab(t || "상세"); setView(v); }} />, "fqa-targets": <FqaTargetScreen />, "fqa-suites": <FqaSuiteScreen />, "fqa-cases": <FqaCasesScreen />, "fqa-plan": <FqaPlanScreen />, "fqa-run": <FqaRunScreen />, "fqa-result": <FqaResultScreen initTab={fqaTab} /> };
  const tk = { ok: "border-emerald-700 bg-emerald-900", warn: "border-amber-700 bg-amber-900", err: "border-red-700 bg-red-900", info: "border-slate-700 bg-slate-800" };
  const nIcon = { play: Play, bug: Bug, send: Send };

  return (
    <AppCtx.Provider value={api}>
      <div className="flex h-screen bg-slate-950 text-slate-200" style={{ fontFamily: "'Malgun Gothic', system-ui, sans-serif" }}>
        {space === "product" && (<>
      <aside className="w-60 shrink-0 border-r border-slate-800 bg-slate-900 flex flex-col">
          <div className="px-5 py-4 border-b border-slate-800">
            <div className="flex items-center gap-2"><div className="w-7 h-7 rounded-lg bg-teal-500 flex items-center justify-center text-slate-900 font-bold text-sm">Q</div><span className="font-bold text-slate-100">QA AutoPlatform</span></div>
            <div className="mt-1 text-xs text-teal-400 font-semibold pl-9">{domain === "FQA" ? "기능 검증 및 테스트 자동화" : "챗봇 검증 및 평가"}</div>
          </div>
          <div className="px-3 pt-3">
            <div className="px-1 mb-1.5 text-xs font-semibold uppercase tracking-wide text-slate-600">검증 영역</div>
            <div className="grid grid-cols-3 gap-1.5">
              {DOMAINS.map((d) => (
                <button key={d.id} onClick={() => { if (!d.ready) { toast(d.label + "는 준비 중입니다 (확장 예정)", "info"); return; } setDomain(d.id); setView(d.id === "FQA" ? "fqa-dashboard" : "dashboard"); }} className={"rounded-lg px-2 py-1.5 text-xs font-semibold " + (domain === d.id ? "bg-teal-600 text-white" : d.ready ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-800 text-slate-600")}>
                  {d.label}{!d.ready && <span className="block font-normal text-slate-600" style={{ fontSize: 9 }}>준비중</span>}
                </button>
              ))}
            </div>
          </div>
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
          <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-900">
            <div>
              <div className="text-xs font-semibold text-slate-500 mb-0.5">{curSection}</div>
              <div className="flex items-center gap-2"><cur.icon size={18} className="text-teal-400" /><h1 className="text-lg font-bold text-slate-100">{cur.label}</h1></div>
            </div>
            <div className="flex items-center gap-3 text-sm">
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
          </header>
          <div className="flex-1 overflow-y-auto p-6">{screens[view]}</div>
        </main>
        </>)}
        {space === "console" && <ConsoleShell />}

        {/* modals */}
        {modal && (() => {
          const close = () => setModal(null);
          const map = {
            newPlan: ["새 평가 계획", <NewPlanForm close={close} />],
            aiGen: ["AI 발화 생성", <AiGenForm close={close} />],
            newCase: ["테스트케이스 등록", <NewCaseForm close={close} />],
            catMgr: ["카테고리 관리", <CategoryManager close={close} />],
            importCases: ["Excel 일괄 업로드", <ImportCasesForm close={close} />],
            jira: ["결함 등록 (Jira)", <JiraForm close={close} data={modal.data} />],
            addJudge: ["Judge 모델 추가", <AddJudgeForm close={close} />],
            addPrompt: ["Prompt 템플릿 추가", <AddPromptForm close={close} />],
            addChatbot: ["챗봇 연결 추가", <AddChatbotForm close={close} />],
            jiraConfig: ["Jira 연동 설정", <JiraConfigForm close={close} />],
            newTenant: ["조직(테넌트) 추가", <NewTenantForm close={close} />],
            assignAdmin: ["조직 관리자 지정", <AssignAdminForm close={close} data={modal.data} />],
            inviteMember: ["멤버 초대", <InviteMemberForm close={close} />],
            newModel: ["AI 모델 등록", <NewModelForm close={close} />],
          };
          const [title, body] = map[modal.type] || ["", null];
          return <Modal title={title} onClose={close}>{body}</Modal>;
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
