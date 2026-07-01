// ============================================================
// 관리자 콘솔 (서비스 관리자 · 전 테넌트 횡단)
// 도메인 무관 플랫폼 영역 — App.jsx에서 분리(2026-07-01).
// 구성: 테넌트/사용자/AI모델/사용량·과금/감사로그 + ConsoleShell.
// ============================================================
import { useState } from "react";
import { ArrowLeft, Building2, Cpu, CreditCard, Plus, ScrollText, Search, Shield, UserCog, Users } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { useApp } from "./context.js";
import { C } from "./theme.js";
import { Badge, Card, Btn, Field, Input, Select } from "./ui.jsx";

const INIT_USAGE = [
  { tenant: "t1", evals: 142, calls: 18400, tokensM: 12.4, cost: 1840000 },
  { tenant: "t2", evals: 38, calls: 4200, tokensM: 2.8, cost: 420000 },
  { tenant: "t3", evals: 6, calls: 540, tokensM: 0.3, cost: 21000 },
];

const INIT_AUDIT = [
  { t: "2026-06-11 14:36", actor: "이민준", tenant: "t1", action: "평가 실행", target: "요금/청구 평가 (48 TC)" },
  { t: "2026-06-11 14:36", actor: "system", tenant: "t1", action: "결함 등록", target: "TWORLD-1842 (PII)" },
  { t: "2026-06-11 11:20", actor: "김지훈", tenant: "t1", action: "권한 변경", target: "QA엔지니어 · 챗봇연결 조회→허용" },
  { t: "2026-06-10 17:02", actor: "admin", tenant: "-", action: "모델 등록", target: "Gemini 2.0 Flash" },
  { t: "2026-06-10 09:15", actor: "admin", tenant: "t3", action: "테넌트 정지", target: "데모 조직" },
  { t: "2026-06-09 16:40", actor: "박지영", tenant: "t2", action: "멤버 초대", target: "newuser@skt.com" },
  { t: "2026-06-09 10:05", actor: "최서연", tenant: "t1", action: "평가 계획 생성", target: "개통/부가서비스 안내" },
  { t: "2026-06-08 18:22", actor: "admin", tenant: "-", action: "사용자 차단", target: "오현태 (demo.com)" },
];

function UsersConsole() {
  const { users, tenants, setUserStatus, removeUser, toast } = useApp();
  const tName = (id) => (tenants.find((t) => t.id === id) || {}).name || "-";
  const stK = { "활성": "pass", "대기": "warn", "차단": "fail" };
  const stat = [["전체", users.length, "text-slate-100"], ["활성", users.filter((u) => u.status === "활성").length, "text-emerald-400"], ["승인 대기", users.filter((u) => u.status === "대기").length, "text-amber-400"], ["차단", users.filter((u) => u.status === "차단").length, "text-red-400"]];
  return (
    <div className="space-y-4">
      <div className="text-sm text-slate-400">전 테넌트의 사용자를 횡단 관리합니다. 서비스 사용 승인 · 거부 · 차단을 처리합니다.</div>
      <div className="grid grid-cols-4 gap-3">
        {stat.map((x) => (<Card key={x[0]} className="p-3 text-center"><div className={"text-2xl font-bold " + x[2]}>{x[1]}</div><div className="text-xs text-slate-500 mt-0.5">{x[0]}</div></Card>))}
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead><tr className="text-slate-500 text-left border-b border-slate-800"><th className="py-2.5 px-4 font-medium">사용자</th><th className="font-medium">소속 조직</th><th className="font-medium">역할</th><th className="font-medium">상태</th><th className="font-medium">최근 로그인</th><th className="font-medium">처리</th></tr></thead>
          <tbody className="text-slate-300">
            {users.map((u) => (
              <tr key={u.id} className="border-b border-slate-800 hover:bg-slate-800">
                <td className="py-3 px-4"><div className="text-slate-100 font-medium">{u.name}</div><div className="text-xs text-slate-500">{u.email}</div></td>
                <td>{tName(u.tenant)}</td>
                <td>{u.role}</td>
                <td><Badge kind={stK[u.status]}>{u.status}</Badge></td>
                <td className="text-slate-500 text-xs">{u.last}</td>
                <td className="pr-4">
                  {u.status === "대기" ? (
                    <div className="flex gap-1.5">
                      <button onClick={() => { setUserStatus(u.id, "활성"); toast(u.name + " 사용 승인", "ok"); }} className="text-xs rounded-lg px-2 py-1 bg-emerald-700 hover:bg-emerald-600 text-white">승인</button>
                      <button onClick={() => { removeUser(u.id); toast(u.name + " 가입 거부", "warn"); }} className="text-xs rounded-lg px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300">거부</button>
                    </div>
                  ) : u.status === "차단" ? (
                    <button onClick={() => { setUserStatus(u.id, "활성"); toast(u.name + " 차단 해제", "ok"); }} className="text-xs rounded-lg px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300">차단 해제</button>
                  ) : (
                    <button onClick={() => { setUserStatus(u.id, "차단"); toast(u.name + " 차단", "warn"); }} className="text-xs rounded-lg px-2 py-1 bg-red-800 hover:bg-red-700 text-white">차단</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

function UsageConsole() {
  const { tenants } = useApp();
  const tName = (id) => (tenants.find((t) => t.id === id) || {}).name || id;
  const total = INIT_USAGE.reduce((a, u) => ({ calls: a.calls + u.calls, tokensM: a.tokensM + u.tokensM, cost: a.cost + u.cost, evals: a.evals + u.evals }), { calls: 0, tokensM: 0, cost: 0, evals: 0 });
  const won = (n) => "₩" + n.toLocaleString();
  const chartData = INIT_USAGE.map((u) => ({ name: tName(u.tenant), cost: Math.round(u.cost / 10000) }));
  const stat = [["평가 수행", total.evals.toLocaleString(), "text-slate-100"], ["LLM 호출", total.calls.toLocaleString(), "text-slate-100"], ["토큰", total.tokensM.toFixed(1) + "M", "text-slate-100"], ["총 비용", won(total.cost), "text-teal-400"]];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">테넌트별 AI 모델 사용량과 과금액을 집계합니다. (월별)</div>
        <select className="bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5 text-slate-300 text-xs"><option>2026-06</option><option>2026-05</option><option>2026-04</option></select>
      </div>
      <div className="grid grid-cols-4 gap-3">{stat.map((x) => (<Card key={x[0]} className="p-4"><div className="text-xs text-slate-400">{x[0]}</div><div className={"mt-1 text-2xl font-bold " + x[2]}>{x[1]}</div></Card>))}</div>
      <Card className="p-4">
        <div className="text-sm font-semibold text-slate-200 mb-3">테넌트별 비용 (만원)</div>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={chartData}><CartesianGrid stroke={C.grid} vertical={false} /><XAxis dataKey="name" stroke={C.axis} fontSize={11} /><YAxis stroke={C.axis} fontSize={11} /><Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8 }} /><Bar dataKey="cost" name="비용(만원)" fill={C.teal} radius={[3, 3, 0, 0]} /></BarChart>
        </ResponsiveContainer>
      </Card>
      <Card>
        <table className="w-full text-sm">
          <thead><tr className="text-slate-500 text-left border-b border-slate-800"><th className="py-2.5 px-4 font-medium">테넌트</th><th className="font-medium">평가 수행</th><th className="font-medium">LLM 호출</th><th className="font-medium">토큰</th><th className="font-medium">비중</th><th className="font-medium text-right">과금액</th></tr></thead>
          <tbody className="text-slate-300">
            {INIT_USAGE.map((u) => (
              <tr key={u.tenant} className="border-b border-slate-800 hover:bg-slate-800">
                <td className="py-3 px-4 font-medium text-slate-100">{tName(u.tenant)}</td>
                <td>{u.evals.toLocaleString()}</td>
                <td>{u.calls.toLocaleString()}</td>
                <td>{u.tokensM.toFixed(1)}M</td>
                <td>{Math.round((u.cost / total.cost) * 100)}%</td>
                <td className="text-right font-semibold text-slate-100">{won(u.cost)}</td>
              </tr>
            ))}
            <tr className="bg-slate-800"><td className="py-2.5 px-4 font-bold text-slate-100">합계</td><td className="font-semibold">{total.evals.toLocaleString()}</td><td className="font-semibold">{total.calls.toLocaleString()}</td><td className="font-semibold">{total.tokensM.toFixed(1)}M</td><td>100%</td><td className="text-right font-bold text-teal-400">{won(total.cost)}</td></tr>
          </tbody>
        </table>
      </Card>
      <div className="text-xs text-slate-500">＊ 과금액은 모델 단가 × 토큰 사용량 기준 추정치이며, 사용량 미터링(metering_event)에서 집계됩니다.</div>
    </div>
  );
}

function AuditConsole() {
  const { tenants } = useApp();
  const tName = (id) => (id === "-" ? "전역" : (tenants.find((t) => t.id === id) || {}).name || id);
  const [q, setQ] = useState("");
  const rows = INIT_AUDIT.filter((a) => (a.actor + a.action + a.target).toLowerCase().includes(q.toLowerCase()));
  const aK = (act) => (act.includes("정지") || act.includes("차단") ? "fail" : act.includes("등록") || act.includes("생성") || act.includes("초대") ? "info" : act.includes("권한") || act.includes("변경") ? "warn" : "active");
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">전 테넌트의 주요 행위 이력입니다. (생성 · 변경 · 권한 · 차단 · 실행)</div>
        <div className="flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg px-3 py-1.5"><Search size={14} className="text-slate-500" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="행위 · 대상 검색" className="bg-transparent text-sm text-slate-200 outline-none" /></div>
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead><tr className="text-slate-500 text-left border-b border-slate-800"><th className="py-2.5 px-4 font-medium">시각</th><th className="font-medium">행위자</th><th className="font-medium">테넌트</th><th className="font-medium">행위</th><th className="font-medium">대상</th></tr></thead>
          <tbody className="text-slate-300">
            {rows.map((a, i) => (
              <tr key={i} className="border-b border-slate-800 hover:bg-slate-800">
                <td className="py-2.5 px-4 text-slate-500 text-xs whitespace-nowrap">{a.t}</td>
                <td className="text-slate-200">{a.actor}</td>
                <td>{tName(a.tenant)}</td>
                <td><Badge kind={aK(a.action)}>{a.action}</Badge></td>
                <td className="text-slate-300">{a.target}</td>
              </tr>
            ))}
            {rows.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-slate-500">검색 결과가 없습니다.</td></tr>}
          </tbody>
        </table>
      </Card>
      <div className="text-xs text-slate-500">＊ 감사 로그는 audit_log에 적재되며, 변경 전/후 값과 함께 보존됩니다(데모는 요약).</div>
    </div>
  );
}

export function NewModelForm({ close }) {
  const { addModel, toast } = useApp();
  const [name, setName] = useState("");
  const [provider, setProvider] = useState("Anthropic");
  const [model, setModel] = useState("");
  const [price, setPrice] = useState("");
  const submit = () => {
    if (!name.trim()) { toast("모델 표시 이름을 입력하세요", "warn"); return; }
    addModel({ id: "m" + Date.now(), name, provider, model: model || "(미입력)", price: price || "-", status: "활성", created: new Date().toISOString().slice(0, 10) });
    toast("모델 '" + name + "' 등록됨", "ok"); close();
  };
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="표시 이름"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: Claude Opus" /></Field>
        <Field label="Provider"><Select value={provider} onChange={(e) => setProvider(e.target.value)}><option>Anthropic</option><option>OpenAI</option><option>Google</option><option>Internal</option><option>Bedrock</option></Select></Field>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="모델 ID"><Input value={model} onChange={(e) => setModel(e.target.value)} placeholder="model-id" /></Field>
        <Field label="단가 (참고)"><Input value={price} onChange={(e) => setPrice(e.target.value)} placeholder="$3 / 1M tokens" /></Field>
      </div>
      <Field label="Endpoint / 인증 (선택)"><Input placeholder="https://... · 시크릿은 Secrets 저장소 관리" /></Field>
      <div className="rounded-lg bg-slate-800 p-3 text-xs text-slate-400">여기 등록된 모델만 각 조직의 Judge·Prompt에서 사용 설정할 수 있습니다.</div>
      <div className="flex justify-end gap-2 pt-1"><Btn onClick={close}>취소</Btn><Btn kind="primary" icon={Plus} onClick={submit}>등록</Btn></div>
    </div>
  );
}

function ModelsConsole() {
  const { models, openModal, setModelStatus, toast } = useApp();
  const stat = [["전체 모델", models.length, "text-slate-100"], ["활성", models.filter((m) => m.status === "활성").length, "text-emerald-400"], ["비활성", models.filter((m) => m.status === "비활성").length, "text-slate-400"]];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">플랫폼 전역 AI 모델 카탈로그입니다. 여기 등록된 모델만 각 조직의 Judge로 사용할 수 있습니다.</div>
        <Btn kind="primary" icon={Plus} onClick={() => openModal("newModel")}>모델 등록</Btn>
      </div>
      <div className="grid grid-cols-3 gap-3">{stat.map((x) => (<Card key={x[0]} className="p-3 text-center"><div className={"text-2xl font-bold " + x[2]}>{x[1]}</div><div className="text-xs text-slate-500 mt-0.5">{x[0]}</div></Card>))}</div>
      <Card>
        <table className="w-full text-sm">
          <thead><tr className="text-slate-500 text-left border-b border-slate-800"><th className="py-2.5 px-4 font-medium">모델</th><th className="font-medium">Provider</th><th className="font-medium">모델 ID</th><th className="font-medium">단가</th><th className="font-medium">등록일</th><th className="font-medium">상태</th><th></th></tr></thead>
          <tbody className="text-slate-300">
            {models.map((m) => (
              <tr key={m.id} className="border-b border-slate-800 hover:bg-slate-800">
                <td className="py-3 px-4 font-medium text-slate-100">{m.name}</td>
                <td>{m.provider}</td>
                <td className="font-mono text-xs text-slate-400">{m.model}</td>
                <td>{m.price}</td>
                <td className="text-slate-500 text-xs">{m.created}</td>
                <td><Badge kind={m.status === "활성" ? "pass" : "draft"}>{m.status}</Badge></td>
                <td className="pr-4"><button onClick={() => { const ns = m.status === "활성" ? "비활성" : "활성"; setModelStatus(m.id, ns); toast(m.name + " " + ns, "info"); }} className="text-xs rounded-lg px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300">{m.status === "활성" ? "비활성화" : "활성화"}</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

export function NewTenantForm({ close }) {
  const { addTenant, toast } = useApp();
  const [name, setName] = useState("");
  const [plan, setPlan] = useState("Team");
  const [admin, setAdmin] = useState("");
  const submit = () => {
    if (!name.trim()) { toast("조직명을 입력하세요", "warn"); return; }
    addTenant({ id: "t" + Date.now(), name, plan, users: admin ? 1 : 0, status: "활성", admin: admin || "미지정", created: new Date().toISOString().slice(0, 10) });
    toast("조직 '" + name + "' 추가됨", "ok"); close();
  };
  return (
    <div className="space-y-4">
      <Field label="조직명"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: KT" /></Field>
      <Field label="플랜"><Select value={plan} onChange={(e) => setPlan(e.target.value)}><option>Trial</option><option>Team</option><option>Enterprise</option></Select></Field>
      <Field label="조직 관리자 (이름 · 이메일)"><Input value={admin} onChange={(e) => setAdmin(e.target.value)} placeholder="예: 홍길동 (gildong@kt.com)" /></Field>
      <div className="rounded-lg bg-slate-800 p-3 text-xs text-slate-400">조직 관리자에게 초대 메일이 발송되며, 관리자가 멤버를 초대·권한을 부여합니다.</div>
      <div className="flex justify-end gap-2 pt-1"><Btn onClick={close}>취소</Btn><Btn kind="primary" icon={Plus} onClick={submit}>추가</Btn></div>
    </div>
  );
}

export function AssignAdminForm({ close, data }) {
  const { setTenantAdmin, toast } = useApp();
  const [admin, setAdmin] = useState(data && data.admin !== "미지정" ? data.admin : "");
  const submit = () => {
    if (!admin.trim()) { toast("관리자 정보를 입력하세요", "warn"); return; }
    setTenantAdmin(data.id, admin); toast(data.name + " 조직 관리자 지정됨", "ok"); close();
  };
  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-slate-800 p-3 text-sm text-slate-300">대상 조직 <span className="text-teal-400 font-medium">{data && data.name}</span></div>
      <Field label="조직 관리자 (이름 · 이메일)"><Input value={admin} onChange={(e) => setAdmin(e.target.value)} placeholder="예: 홍길동 (gildong@company.com)" /></Field>
      <div className="text-xs text-slate-500">지정된 관리자는 해당 조직 내에서 사용자 초대 · 메뉴별 권한 부여 권한을 갖습니다.</div>
      <div className="flex justify-end gap-2 pt-1"><Btn onClick={close}>취소</Btn><Btn kind="primary" icon={UserCog} onClick={submit}>지정</Btn></div>
    </div>
  );
}

function TenantsConsole() {
  const { tenants, openModal, setTenantStatus, toast } = useApp();
  const stat = [["전체 조직", tenants.length, "text-slate-100"], ["활성", tenants.filter((t) => t.status === "활성").length, "text-emerald-400"], ["정지", tenants.filter((t) => t.status === "정지").length, "text-red-400"]];
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="text-sm text-slate-400">서비스에 등록된 조직(테넌트)을 추가·관리하고 조직 관리자를 지정합니다.</div>
        <Btn kind="primary" icon={Plus} onClick={() => openModal("newTenant")}>조직 추가</Btn>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {stat.map((x) => (<Card key={x[0]} className="p-3 text-center"><div className={"text-2xl font-bold " + x[2]}>{x[1]}</div><div className="text-xs text-slate-500 mt-0.5">{x[0]}</div></Card>))}
      </div>
      <Card>
        <table className="w-full text-sm">
          <thead><tr className="text-slate-500 text-left border-b border-slate-800"><th className="py-2.5 px-4 font-medium">조직명</th><th className="font-medium">플랜</th><th className="font-medium">사용자</th><th className="font-medium">조직 관리자</th><th className="font-medium">생성일</th><th className="font-medium">상태</th><th></th></tr></thead>
          <tbody className="text-slate-300">
            {tenants.map((t) => (
              <tr key={t.id} className="border-b border-slate-800 hover:bg-slate-800">
                <td className="py-3 px-4 font-medium text-slate-100">{t.name}</td>
                <td><Badge kind={t.plan === "Enterprise" ? "active" : t.plan === "Team" ? "info" : "draft"}>{t.plan}</Badge></td>
                <td>{t.users}</td>
                <td className="text-slate-300">{t.admin}</td>
                <td className="text-slate-500 text-xs">{t.created}</td>
                <td><Badge kind={t.status === "활성" ? "pass" : "fail"}>{t.status}</Badge></td>
                <td className="pr-4"><div className="flex items-center gap-2">
                  <button onClick={() => openModal("assignAdmin", { id: t.id, name: t.name, admin: t.admin })} className="text-slate-400 hover:text-teal-400" title="조직 관리자 지정"><UserCog size={15} /></button>
                  <button onClick={() => { const ns = t.status === "활성" ? "정지" : "활성"; setTenantStatus(t.id, ns); toast(t.name + " " + ns + " 처리", ns === "활성" ? "ok" : "warn"); }} className="text-xs rounded-lg px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300">{t.status === "활성" ? "정지" : "활성화"}</button>
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
    </div>
  );
}

const CONSOLE_NAV = [
  { id: "tenants", label: "테넌트 관리", icon: Building2 },
  { id: "cusers", label: "사용자 관리", icon: Users },
  { id: "models", label: "AI 모델", icon: Cpu },
  { id: "usage", label: "사용량 · 과금", icon: CreditCard },
  { id: "audit", label: "감사 로그", icon: ScrollText },
];

export function ConsoleShell() {
  const { setSpace } = useApp();
  const [cv, setCv] = useState("tenants");
  const cur = CONSOLE_NAV.find((n) => n.id === cv);
  return (
    <>
      <aside className="w-60 shrink-0 border-r border-slate-800 bg-slate-950 flex flex-col">
        <div className="px-5 py-4 border-b border-slate-800">
          <div className="flex items-center gap-2"><Shield size={18} className="text-amber-400" /><span className="font-bold text-slate-100">관리자 콘솔</span></div>
          <div className="mt-1 text-xs text-amber-400 font-semibold pl-7">서비스 관리자 · 전 테넌트</div>
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {CONSOLE_NAV.map((n) => { const Icon = n.icon; const on = cv === n.id; return (
            <button key={n.id} onClick={() => setCv(n.id)} className={"w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm " + (on ? "bg-amber-600 text-white font-semibold" : "text-slate-400 hover:bg-slate-800 hover:text-slate-200")}><Icon size={17} />{n.label}</button>
          ); })}
        </nav>
        <div className="p-3 border-t border-slate-800">
          <button onClick={() => setSpace("product")} className="w-full flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-slate-300 hover:bg-slate-800"><ArrowLeft size={16} />제품 워크스페이스로</button>
        </div>
      </aside>
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="flex items-center justify-between px-6 py-3.5 border-b border-slate-800 bg-slate-900">
          <div className="flex items-center gap-2"><cur.icon size={18} className="text-amber-400" /><h1 className="text-lg font-bold text-slate-100">{cur.label}</h1></div>
          <div className="text-sm text-slate-400">관리자 콘솔 · 전 테넌트 횡단</div>
        </header>
        <div className="flex-1 overflow-y-auto p-6">
          {cv === "tenants" ? <TenantsConsole /> : cv === "cusers" ? <UsersConsole /> : cv === "models" ? <ModelsConsole /> : cv === "usage" ? <UsageConsole /> : cv === "audit" ? <AuditConsole /> : (
            <div className="rounded-xl border border-dashed border-slate-700 bg-slate-900 p-12 text-center">
              <cur.icon size={28} className="text-slate-600 mx-auto mb-3" />
              <div className="text-slate-300 font-semibold mb-1">{cur.label}</div>
              <div className="text-sm text-slate-500">이 화면은 다음 단계에서 구현됩니다.</div>
            </div>
          )}
        </div>
      </main>
    </>
  );
}
