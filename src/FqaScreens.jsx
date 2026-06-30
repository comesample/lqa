import { useState, Fragment } from "react";
import {
  Video, Square, Globe, Play, Upload, FileText, Download, Cpu, Terminal, Bot,
  Wrench, Search, RefreshCw, Save, Plus, CheckCircle2, X, Tag, Send, ChevronLeft,
  Code2, ArrowRight, Lock, GripVertical, Layers, Calendar, Bug, Clock, XCircle, AlertTriangle, Image,
  LayoutDashboard, TrendingUp, Activity, Brain, ClipboardList,
} from "lucide-react";
import FqaAiGenScreen from "./FqaAiGen.jsx";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";

/* ───────── primitives (lqa-demo 톤) ───────── */
const Card = ({ children, className = "" }) => (
  <div className={"rounded-xl border border-slate-800 bg-slate-900 " + className}>{children}</div>
);
const Badge = ({ children, kind = "info" }) => {
  const k = { info: "bg-slate-800 text-slate-300", teal: "bg-teal-900 text-teal-200", warn: "bg-amber-900 text-amber-200", pass: "bg-emerald-900 text-emerald-200", live: "bg-red-900 text-red-200", draft: "bg-slate-800 text-slate-400 border border-slate-700" };
  return <span className={"inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-xs font-medium " + k[kind]}>{children}</span>;
};
const Btn = ({ children, kind = "ghost", icon: Icon, onClick, disabled, className = "" }) => {
  const k = { primary: "bg-teal-600 hover:bg-teal-500 text-white", ghost: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700", danger: "bg-red-600 hover:bg-red-500 text-white" };
  return <button disabled={disabled} onClick={onClick} className={"inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed " + k[kind] + " " + className}>{Icon && <Icon size={15} />}{children}</button>;
};
const Seg = ({ options, value, onChange }) => (
  <div className="inline-flex rounded-lg bg-slate-800 p-0.5">
    {options.map((o) => <button key={o} onClick={() => onChange(o)} className={"rounded-md px-3 py-1.5 text-xs font-medium transition " + (value === o ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-200")}>{o}</button>)}
  </div>
);
const Field = ({ label, children, hint }) => (
  <div><div className="mb-1.5 text-xs font-semibold text-slate-400">{label}</div>{children}{hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}</div>
);
const Input = (p) => <input {...p} className={"w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-teal-500 " + (p.className || "")} />;
const Select = (p) => <select {...p} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-teal-500" />;
const taCls = "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 outline-none focus:border-teal-500";
const useToast = () => { const [m, setM] = useState(""); return [m, (t) => { setM(t); setTimeout(() => setM(""), 2000); }]; };
const Toast = ({ msg }) => (msg ? <div className="fixed bottom-5 right-5 z-50 rounded-lg border border-teal-700 bg-teal-900 px-4 py-2.5 text-sm text-teal-100 shadow-xl">{msg}</div> : null);
const Hdr = ({ icon: Icon, title, desc }) => (
  <div className="mb-1 flex items-center gap-2">
    <Icon size={16} className="text-teal-400" /><span className="text-sm font-semibold text-slate-100">{title}</span>
    <Badge kind="teal">Web · Playwright</Badge>{desc && <span className="text-xs text-slate-500">{desc}</span>}
  </div>
);
const FQA_MEMBERS = ["QA Lead", "김QA", "이QA", "박QA", "미지정"];
const FQA_SUITES = ["로그인 / 인증", "회원가입", "메인 화면", "결제 / 요금제", "API 연동"];
const RECCODE = `import { test, expect } from '@playwright/test';

test('TC-REC-001 로그인 정상 동작', async ({ page }) => {
  await page.goto('https://www.tworld.co.kr');
  await page.getByTestId('username').fill('\${id}');
  await page.getByTestId('password').fill('\${pw}');
  await page.getByRole('button', { name: '로그인' }).click();
  await expect(page.getByText('환영합니다')).toBeVisible();
});`;

/* ═══════════ 1. 레코딩 ═══════════ */
export function FqaRecordScreen() {
  const [msg, flash] = useToast();
  const [url, setUrl] = useState("https://www.tworld.co.kr");
  const [suite, setSuite] = useState("로그인 / 인증");
  const [name, setName] = useState("TC-REC-001 · 로그인 정상 동작");
  const [rec, setRec] = useState(false);
  const [steps, setSteps] = useState([]);
  const [mode, setMode] = useState("스크립트");
  const start = () => { setRec(true); setSteps([{ t: "goto", v: url }]); };
  const stop = () => {
    setRec(false);
    setSteps([{ t: "goto", v: url }, { t: "fill", v: "[data-testid=username] ← ${id}" }, { t: "fill", v: "[data-testid=password] ← ${pw}" }, { t: "click", v: "role=button[로그인]" }, { t: "assert", v: "text=환영합니다 보임" }]);
  };
  return (
    <div className="space-y-4">
      <Hdr icon={Video} title="레코딩 (Playwright 스크립트 레코딩)" desc="조작 캡처 → 스텝·스크립트 변환" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 space-y-4">
          <Card className="p-4 space-y-3.5">
            <Field label="대상 URL"><Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." /></Field>
            <div className="flex items-center gap-2">
              {!rec ? <Btn kind="primary" icon={Video} onClick={start}>녹화 시작</Btn> : <Btn kind="danger" icon={Square} onClick={stop}>녹화 중단</Btn>}
              {rec ? <Badge kind="live">● 녹화 중</Badge> : <Badge kind="info">대기 중</Badge>}
              <span className="text-xs text-slate-500">브라우저가 열리고 조작이 캡처됩니다</span>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="스위트"><Select value={suite} onChange={(e) => setSuite(e.target.value)}><option>로그인 / 인증</option><option>회원가입</option><option>결제 / 요금제</option></Select></Field>
              <Field label="TC 이름"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
            </div>
            <Field label="셀렉터 전략" hint="권장: data-testid → role → css (변경 취약성↓)"><Seg options={["data-testid 우선", "role 우선", "css"]} value="data-testid 우선" onChange={() => {}} /></Field>
            <div className="flex items-center justify-between text-sm text-slate-300"><span>어설션 자동 삽입(검증포인트)</span><Badge kind="teal">ON</Badge></div>
          </Card>
        </div>
        <div className="col-span-7">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
              <span className="text-sm font-semibold text-slate-200">캡처 결과</span>
              <div className="flex items-center gap-2"><Seg options={["스텝", "스크립트"]} value={mode} onChange={setMode} /><Badge kind="draft">검토 대기</Badge></div>
            </div>
            {steps.length === 0 ? (
              <div className="px-4 py-16 text-center text-sm text-slate-500">녹화를 시작하면 캡처된 스텝이 여기에 쌓입니다.</div>
            ) : mode === "스텝" ? (
              <ol className="space-y-1 p-3">
                {steps.map((s, i) => (
                  <li key={i} className="flex items-center gap-2 text-xs"><span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-slate-400">{i + 1}</span><span className={"font-medium " + (s.t === "assert" ? "text-amber-300" : "text-slate-200")}>{s.t}</span><span className="font-mono text-slate-400">{s.v}</span></li>
                ))}
              </ol>
            ) : (
              <pre className="m-3 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300" style={{ fontFamily: "monospace", maxHeight: 320 }}>{RECCODE}</pre>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-800 px-4 py-3">
              <Btn icon={FileText} onClick={() => flash("스크립트 복사됨")}>복사</Btn>
              <Btn kind="primary" icon={Plus} disabled={!steps.length} onClick={() => flash("검토 대기로 저장 (Full-Code 관리) → 테스트 에디터")}>검토 대기로 저장</Btn>
            </div>
          </Card>
          <div className="mt-2 text-xs text-slate-500">레코딩 산출물은 Playwright 코드라 <span className="text-amber-300">Full-Code(코드 관리)</span>로 검토 대기 등록되며, 테스트 에디터에서 편집·승인됩니다.</div>
        </div>
      </div>
      <Toast msg={msg} />
    </div>
  );
}

/* ═══════════ 2. 엑셀 업로드 ═══════════ */
const XL_SAMPLE = [
  { name: "로그인 정상 동작", scn: "유효 계정으로 로그인 성공", steps: 5, tags: "smoke,login" },
  { name: "잘못된 비밀번호 오류", scn: "오류 메시지 노출 확인", steps: 4, tags: "regression,login" },
  { name: "검색 결과 노출", scn: "키워드 검색 결과 표시", steps: 4, tags: "search" },
  { name: "장바구니 담기/삭제", scn: "수량 변경·삭제 반영", steps: 6, tags: "crud" },
];
export function FqaExcelScreen() {
  const [msg, flash] = useToast();
  const [rows, setRows] = useState([]);
  const [fname, setFname] = useState("");
  const [suite, setSuite] = useState("로그인 / 인증");
  const tmpl = () => {
    const csv = "TC명,시나리오,스텝,태그\n로그인 정상 동작,유효 계정 로그인 성공,5,smoke|login\n";
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })); a.download = "FQA_TC_양식.csv"; a.click();
  };
  const onFile = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; setFname(f.name); setRows(XL_SAMPLE); };
  return (
    <div className="space-y-4">
      <Hdr icon={FileText} title="엑셀 업로드 생성" desc="기능 TC 일괄 등록" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-200">1. 양식 받기</span><Btn icon={Download} onClick={tmpl}>샘플 양식</Btn></div>
            <div className="text-xs text-slate-500">열: TC명 · 시나리오 · 스텝 · 태그 (.xlsx / .xls / .csv)</div>
          </Card>
          <Card className="p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-200">2. 파일 업로드</div>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-800 px-3 py-7 text-sm text-slate-400 hover:border-slate-600">
              <Upload size={20} className="text-slate-500" />파일을 드래그하거나 클릭해서 선택
              <span className="text-xs text-slate-600">.xlsx / .xls / .csv · 최대 10MB</span>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFile} />
            </label>
            {fname && <div className="text-xs text-teal-400">{fname} · {rows.length}건 인식</div>}
            <div className="grid grid-cols-2 gap-3">
              <Field label="스위트"><Select value={suite} onChange={(e) => setSuite(e.target.value)}>{FQA_SUITES.map((x) => <option key={x}>{x}</option>)}</Select></Field>
              <Field label="카테고리"><Select><option>기능</option><option>회귀</option><option>스모크</option></Select></Field>
            </div>
          </Card>
        </div>
        <div className="col-span-7">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5"><span className="text-sm font-semibold text-slate-200">파싱된 TC 미리보기</span><Badge kind="draft">검토 대기</Badge></div>
            {rows.length === 0 ? (
              <div className="px-4 py-16 text-center text-sm text-slate-500">엑셀을 업로드하면 파싱된 TC 목록이 표시됩니다.</div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-800 text-left text-slate-500"><th className="px-4 py-2 font-medium">TC명</th><th className="font-medium">시나리오</th><th className="font-medium">스텝</th><th className="font-medium">태그</th></tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-slate-800 text-slate-300"><td className="px-4 py-2.5 text-slate-200">{r.name}</td><td className="max-w-xs truncate text-slate-400">{r.scn}</td><td>{r.steps}</td><td className="text-xs text-slate-500">{r.tags}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-800 px-4 py-3"><Btn kind="primary" icon={Plus} disabled={!rows.length} onClick={() => flash(rows.length + "건 검토 대기로 일괄 생성 (No-Code 관리)")}>일괄 생성</Btn></div>
          </Card>
          <div className="mt-2 text-xs text-slate-500">빈 시나리오·스텝은 검토 시 보완합니다. 생성분은 <span className="text-amber-300">검토 대기</span>로 등록됩니다.</div>
        </div>
      </div>
      <Toast msg={msg} />
    </div>
  );
}

/* ═══════════ 3. MCP 탐색 ═══════════ */
const MCP_TOOLS = ["browser_navigate — URL 이동", "browser_click — 클릭", "browser_fill — 필드 입력", "browser_snapshot — 접근성 스냅샷", "browser_screenshot — 스크린샷"];
export function FqaMcpScreen() {
  const [msg, flash] = useToast();
  const [url, setUrl] = useState("https://www.tworld.co.kr");
  const [live, setLive] = useState(false);
  const [mode, setMode] = useState("AI 명령");
  const [cmd, setCmd] = useState("로그인 페이지로 이동해서 유효 계정으로 로그인하고 결과를 확인해줘");
  const [log, setLog] = useState([]);
  const start = () => { setLive(true); setLog([{ t: "session", v: "세션 시작 · " + url }]); };
  const run = () => {
    if (!live) { flash("먼저 세션을 시작하세요"); return; }
    setLog((l) => [...l, { t: "navigate", v: "/login" }, { t: "fill", v: "#username, #password" }, { t: "click", v: "button[로그인]" }, { t: "snapshot", v: "로그인 성공 확인" }]);
  };
  const presets = ["🔐 로그인 자동화", "🔍 검색 자동화", "✅ 에러 여부 확인", "🔎 페이지 분석"];
  return (
    <div className="space-y-4">
      <Hdr icon={Cpu} title="MCP 에이전트 탐색적 생성" desc="에이전트가 앱을 탐색하며 TC 발굴" />
      <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400">사용 가이드: ① URL 입력 → ② 세션 시작 → ③ AI 명령 또는 직접 호출 → ④ 코드 저장 · <span className="text-slate-500">@playwright/mcp 패키지 필요(최초 1회)</span></div>
      <div className="flex flex-wrap gap-2">{presets.map((p) => <button key={p} onClick={() => setCmd(p.replace(/^\S+\s/, "") + " 시나리오 생성")} className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700">{p}</button>)}</div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-200">세션</span>{live ? <Badge kind="live">● LIVE</Badge> : <Badge kind="info">비활성</Badge>}</div>
            <Field label="대상 URL"><Input value={url} onChange={(e) => setUrl(e.target.value)} /></Field>
            {!live ? <Btn kind="primary" icon={Play} className="w-full" onClick={start}>세션 시작</Btn> : <Btn icon={Square} className="w-full" onClick={() => { setLive(false); setLog([]); }}>세션 종료</Btn>}
          </Card>
          <Card className="p-4 space-y-3">
            <div className="flex gap-1.5">{["AI 명령", "직접 호출"].map((m) => <button key={m} onClick={() => setMode(m)} className={"flex-1 rounded-lg px-2 py-1.5 text-xs font-medium " + (mode === m ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200")}>{m === "AI 명령" ? "🤖 AI 명령" : "🔧 직접 호출"}</button>)}</div>
            {mode === "AI 명령" ? (
              <>
                <Field label="명령 입력"><textarea value={cmd} onChange={(e) => setCmd(e.target.value)} rows={3} className={taCls} /></Field>
                <Btn kind="primary" icon={Send} className="w-full" onClick={run}>명령 실행</Btn>
              </>
            ) : (
              <>
                <Field label="도구 선택"><Select>{MCP_TOOLS.map((t) => <option key={t}>{t}</option>)}</Select></Field>
                <Field label="인수 (JSON)"><textarea defaultValue={'{ "url": "/login" }'} rows={2} className={taCls} /></Field>
                <Btn kind="primary" icon={Wrench} className="w-full" onClick={run}>도구 실행</Btn>
              </>
            )}
          </Card>
          <Card className="p-4 space-y-2">
            <div className="text-sm font-semibold text-slate-200">코드 저장</div>
            <div className="grid grid-cols-2 gap-3"><Field label="파일명"><Input defaultValue="mcp_login.spec.ts" /></Field><Field label="TC ID"><Input defaultValue="TC-MCP-001" /></Field></div>
            <div className="flex items-center justify-between"><span className="text-xs text-slate-500">액션 {Math.max(0, log.length - 1)}개 기록</span><Btn kind="primary" icon={Save} disabled={log.length < 2} onClick={() => flash("검토 대기로 저장 (Full-Code 관리) → 테스트 에디터")}>검토 대기로 저장</Btn></div>
          </Card>
        </div>
        <div className="col-span-7 space-y-4">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5"><span className="text-sm font-semibold text-slate-200">📸 브라우저 화면</span>{live && <Badge kind="live">● LIVE</Badge>}</div>
            <div className="flex h-44 items-center justify-center bg-slate-950 text-sm text-slate-600">{live ? url : "세션을 시작하면 화면이 표시됩니다"}</div>
          </Card>
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5"><span className="text-sm font-semibold text-slate-200">📋 액션 로그</span><button onClick={() => setLog([])} className="text-xs text-slate-500 hover:text-slate-300">초기화</button></div>
            <div className="overflow-y-auto p-3" style={{ maxHeight: 240 }}>
              {log.length === 0 ? <div className="py-10 text-center text-xs text-slate-600">세션을 시작하면 액션 로그가 표시됩니다.</div> : (
                <ol className="space-y-1">{log.map((s, i) => (<li key={i} className="flex items-center gap-2 text-xs"><span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-slate-400">{i + 1}</span><span className={"font-medium " + (s.t === "snapshot" ? "text-amber-300" : "text-teal-300")}>{s.t}</span><span className="font-mono text-slate-400">{s.v}</span></li>))}</ol>
              )}
            </div>
          </Card>
        </div>
      </div>
      <Toast msg={msg} />
    </div>
  );
}


/* ═══════════ 4. 테스트 에디터 (3-Mode 단방향) ═══════════ */
const LV = ["No-Code", "Low-Code", "Full-Code"];
const ROLE = { "No-Code": "QA 담당자", "Low-Code": "QA 엔지니어", "Full-Code": "개발자" };
const E_SUITES = [["로그인 / 인증", 12], ["회원가입", 8], ["메인 화면", 15], ["결제 / 요금제", 11], ["API 연동", 6]];
const E_STEPS = [
  { act: "브라우저 열기", loc: "url", val: "https://www.tworld.co.kr/signup" },
  { act: "텍스트 입력", loc: "[data-testid=email]", val: '"invalid-email"' },
  { act: "요소 클릭", loc: "role=button[다음]", val: "-" },
  { act: "검증", loc: "[data-testid=error]", val: 'text = "올바른 이메일 형식이 아닙니다"' },
];
const E_LOW = `open    https://www.tworld.co.kr/signup
fill    [data-testid=email]   "invalid-email"
click   role=button[다음]
assert  [data-testid=error]   text="올바른 이메일 형식이 아닙니다"`;
const E_FULL = `import { test, expect } from '@playwright/test';

test('TC-021 회원가입 이메일 형식 검증', async ({ page }) => {
  await page.goto('https://www.tworld.co.kr/signup');
  await page.getByTestId('email').fill('invalid-email');
  await page.getByRole('button', { name: '다음' }).click();
  await expect(page.getByTestId('error'))
    .toHaveText('올바른 이메일 형식이 아닙니다');
});`;
const E_PLATS = [["Web", true], ["Android", false], ["iOS", false], ["API", false]];

export function FqaEditorScreen({ entry = "No-Code", tc }) {
  const [msg, flash] = useToast();
  const ei = Math.max(0, LV.indexOf(entry));
  const [committed, setCommitted] = useState(ei);
  const [view, setView] = useState(entry);
  const [low, setLow] = useState(E_LOW);
  const [code, setCode] = useState(E_FULL);
  const [plat, setPlat] = useState("Web");
  const vi = LV.indexOf(view);
  const editable = vi === committed;
  const readonly = vi < committed;
  const descend = () => { const ni = Math.min(2, committed + 1); setCommitted(ni); setView(LV[ni]); flash(LV[ni] + "로 변환됨" + (ni === 2 ? " · 코드 관리 전환(eject)" : "")); };
  return (
    <div className="space-y-4">
      <Hdr icon={Code2} title="테스트 에디터" desc="No-Code → Low-Code → Full-Code · 단방향 변환" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-3">
          <Card className="p-3">
            <div className="mb-2 text-xs font-semibold text-slate-400">테스트 스위트</div>
            <div className="space-y-1">
              {E_SUITES.map(([n, c], i) => (
                <div key={n} className={"flex items-center justify-between rounded-lg px-2.5 py-1.5 text-sm " + (i === 1 ? "bg-teal-900 text-teal-200" : "text-slate-300 hover:bg-slate-800")}><span>{n}</span><span className="text-xs text-slate-500">{c}</span></div>
              ))}
            </div>
          </Card>
          <Card className="p-3">
            <div className="mb-2 text-xs font-semibold text-slate-400">빠른 실행</div>
            <div className="space-y-1.5">
              <Btn className="w-full" icon={Cpu} onClick={() => flash("AI TC 생성으로 이동")}>AI TC 생성</Btn>
              <Btn className="w-full" icon={Search} onClick={() => flash("회귀 비교 열기")}>회귀 비교</Btn>
              <Btn className="w-full" icon={Save} onClick={() => flash("GitLab 연동")}>GitLab 연동</Btn>
            </div>
          </Card>
        </div>
        <div className="col-span-9 space-y-3">
          <Card className="flex items-center justify-between p-3">
            <div><span className="font-mono text-sm text-teal-400">{tc ? tc.id : "TC-021"}</span> <span className="text-sm text-slate-200">{tc ? tc.name : "회원가입 — 이메일 형식 검증"}</span></div>
            <div className="flex gap-2"><Badge kind={ei === 2 ? "warn" : ei === 1 ? "teal" : "info"}>{entry} 관리</Badge><Badge kind="draft">검토 대기</Badge></div>
          </Card>

          {/* 단방향 모드 흐름 바 */}
          <div className="flex items-center gap-1.5">
            {LV.map((l, i) => (
              <Fragment key={l}>
                <button disabled={i > committed} onClick={() => i <= committed && setView(l)} className={"rounded-lg border px-3 py-1.5 text-xs " + (view === l ? "border-teal-500 bg-teal-900 text-teal-200" : i <= committed ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" : "border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed")}>
                  {l}<span className="ml-1.5 font-normal text-slate-500">{ROLE[l]}</span>
                </button>
                {i < 2 && <ArrowRight size={14} className={i < committed ? "text-teal-500" : "text-slate-700"} />}
              </Fragment>
            ))}
          </div>

          <Card className="overflow-hidden">
            {readonly && (
              <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-950 px-4 py-2 text-xs text-amber-300"><Lock size={13} />읽기 전용 — 하위 모드({LV[committed]})에서 관리 중. 상위 편집은 재변환이 필요합니다.</div>
            )}

            {view === "No-Code" && (
              <div>
                <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2">
                  {E_PLATS.map(([p, ok]) => (
                    <button key={p} disabled={!ok} onClick={() => ok && setPlat(p)} className={"rounded-md px-2.5 py-1 text-xs " + (plat === p ? "bg-teal-600 text-white" : ok ? "bg-slate-800 text-slate-300 hover:bg-slate-700" : "bg-slate-900 text-slate-600 cursor-not-allowed")}>{p}{!ok && " ·확장"}</button>
                  ))}
                  <span className="ml-auto text-xs text-slate-500">스텝 드래그로 순서 변경 · 값 클릭 인라인 편집</span>
                </div>
                <div>
                  {E_STEPS.map((s, i) => (
                    <div key={i} className="flex items-center gap-2 border-b border-slate-800 px-3 py-2.5 text-sm">
                      <GripVertical size={14} className={editable ? "text-slate-600" : "text-slate-800"} />
                      <span className="w-4 text-xs text-slate-500">{i + 1}</span>
                      <span className={"w-24 font-medium " + (s.act === "검증" ? "text-amber-300" : "text-slate-200")}>{s.act}</span>
                      <span className="flex-1 font-mono text-xs text-slate-500">{s.loc}</span>
                      <span className="text-xs text-slate-400">{s.val}</span>
                    </div>
                  ))}
                </div>
                {editable && <div className="px-3 py-2"><button className="text-xs text-teal-400">+ 스텝 추가</button></div>}
              </div>
            )}

            {view === "Low-Code" && (
              <div className="p-3">
                <div className="mb-2 text-xs text-slate-500">키워드 DSL — 액션·로케이터·값/검증을 한 줄로</div>
                <textarea value={low} onChange={(e) => setLow(e.target.value)} readOnly={!editable} rows={8} className={taCls + (editable ? "" : " opacity-70")} />
              </div>
            )}

            {view === "Full-Code" && (
              <div className="p-3">
                <div className="mb-2 flex items-center gap-2 text-xs"><Badge kind="warn">eject · 코드 관리</Badge><span className="text-slate-500">Playwright (TypeScript) · 편집 시 GitLab/CI에서 관리</span></div>
                <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={11} className={taCls} style={{ fontFamily: "monospace" }} />
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">
              <div className="text-xs text-slate-500">현재 관리 수준: <span className="text-slate-300">{LV[committed]}</span></div>
              <div className="flex gap-2">
                {committed < 2 && view === LV[committed] && (
                  <Btn icon={ArrowRight} onClick={descend}>{LV[committed + 1]}로 변환{committed + 1 === 2 ? " (eject)" : ""}</Btn>
                )}
                <Btn kind="primary" icon={Save} onClick={() => flash("저장됨 · 검토 대기")}>저장</Btn>
              </div>
            </div>
          </Card>
          <div className="text-xs text-slate-500">단방향: No-Code에서 시작해 필요 시 Low-Code → Full-Code로 내려가며 정밀화. Full-Code로 내려가면(eject) 코드가 관리 기준이 되고 상위 모드는 읽기 전용이 됩니다.</div>
        </div>
      </div>
      <Toast msg={msg} />
    </div>
  );
}


/* ═══════════ 5. 테스트 스위트 관리 ═══════════ */
const SUITE_SEED = [
  { id: 1, name: "로그인 / 인증", parent: 0, module: "인증", owner: "QA Lead", tags: "smoke,login", mapType: "폴더", mapVal: "tests/auth/", storage: true, seed: false, clean: true, tc: 12 },
  { id: 2, name: "회원가입", parent: 1, module: "온보딩", owner: "김QA", tags: "signup", mapType: "폴더", mapVal: "tests/auth/signup/", storage: true, seed: true, clean: true, tc: 8 },
  { id: 3, name: "메인 화면", parent: 0, module: "홈", owner: "이QA", tags: "smoke", mapType: "태그", mapVal: "@home", storage: true, seed: false, clean: false, tc: 15 },
  { id: 4, name: "결제 / 요금제", parent: 0, module: "결제", owner: "박QA", tags: "critical,pay", mapType: "project", mapVal: "payment", storage: true, seed: true, clean: true, tc: 11 },
  { id: 5, name: "API 연동", parent: 0, module: "API", owner: "QA Lead", tags: "api", mapType: "폴더", mapVal: "tests/api/", storage: false, seed: true, clean: true, tc: 6 },
];
const SF0 = { name: "", parent: 0, module: "", owner: "미지정", tags: "", mapType: "태그", mapVal: "", storage: true, seed: false, clean: true };
export function FqaSuiteScreen() {
  const [msg, flash] = useToast();
  const [suites, setSuites] = useState(SUITE_SEED);
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(SF0);
  const mK = { "태그": "teal", "폴더": "info", "project": "warn" };
  const tog = (k) => setForm({ ...form, [k]: !form[k] });
  const openAdd = () => { setEdit(null); setForm(SF0); setOpen(true); };
  const openEdit = (sId) => { const sv = suites.find((x) => x.id === sId); setEdit(sId); setForm({ ...SF0, ...sv }); setOpen(true); };
  const save = () => {
    if (!form.name.trim()) { flash("이름을 입력하세요"); return; }
    if (edit === null) setSuites([...suites, { ...form, id: Date.now(), tc: 0 }]);
    else setSuites(suites.map((s) => (s.id === edit ? { ...s, ...form } : s)));
    setOpen(false); flash(edit === null ? "스위트가 추가되었습니다" : "스위트가 수정되었습니다");
  };
  const del = (s) => {
    if (s.tc > 0) { flash("사용 중인 스위트는 삭제 불가 (" + s.tc + "건)"); return; }
    if (suites.some((c) => c.parent === s.id)) { flash("하위 스위트가 있어 삭제할 수 없습니다"); return; }
    setSuites(suites.filter((x) => x.id !== s.id)); flash("삭제됨");
  };
  const ordered = [];
  suites.filter((s) => !s.parent).forEach((top) => { ordered.push({ ...top, depth: 0 }); suites.filter((c) => c.parent === top.id).forEach((c) => ordered.push({ ...c, depth: 1 })); });
  return (
    <div className="space-y-4">
      <Hdr icon={Layers} title="테스트 스위트" desc="기능 TC 묶음 · 실행 매핑 · fixture" />
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <span className="text-sm font-semibold text-slate-200">스위트 목록 <span className="text-xs font-normal text-slate-500">{suites.length}개</span></span>
          <Btn kind="primary" icon={Plus} onClick={openAdd}>스위트 추가</Btn>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-800 text-left text-slate-500"><th className="px-4 py-2.5 font-medium">스위트</th><th className="font-medium">대상 모듈</th><th className="font-medium">실행 매핑</th><th className="font-medium">담당</th><th className="font-medium">기본 태그</th><th className="font-medium">TC</th><th></th></tr></thead>
          <tbody>
            {ordered.map((s) => (
              <tr key={s.id} className="border-b border-slate-800 text-slate-300 hover:bg-slate-800">
                <td className="px-4 py-3 font-medium text-slate-200"><span style={{ paddingLeft: s.depth * 18 }}>{s.depth ? "└ " : ""}{s.name}</span></td>
                <td>{s.module}</td>
                <td><Badge kind={mK[s.mapType] || "info"}>{s.mapType}</Badge> <span className="font-mono text-xs text-slate-400">{s.mapVal}</span></td>
                <td className="text-slate-400">{s.owner}</td>
                <td className="text-xs text-slate-500">{s.tags}</td>
                <td>{s.tc}</td>
                <td className="pr-4 text-right whitespace-nowrap"><button onClick={() => openEdit(s.id)} className="mr-3 text-xs text-slate-400 hover:text-teal-400">편집</button><button onClick={() => del(s)} className="text-slate-500 hover:text-red-400"><X size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="text-xs text-slate-500">실행 매핑(태그/폴더/project)으로 Playwright 실행 단위가 결정됩니다. <span className="text-slate-400">환경은 대상·환경/실행 계획에서 지정</span>하며 스위트에 고정하지 않습니다.</div>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5"><h3 className="font-semibold text-slate-100">{edit === null ? "스위트 추가" : "스위트 편집"}</h3><button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-200"><X size={18} /></button></div>
            <div className="space-y-3.5 overflow-y-auto p-5" style={{ maxHeight: "76vh" }}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="이름"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예: 로그인 / 인증" /></Field>
                <Field label="상위 스위트"><Select value={form.parent} onChange={(e) => setForm({ ...form, parent: +e.target.value })}><option value={0}>없음 (최상위)</option>{suites.filter((x) => x.id !== edit).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</Select></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="대상 모듈"><Input value={form.module} onChange={(e) => setForm({ ...form, module: e.target.value })} placeholder="예: 인증" /></Field>
                <Field label="담당"><Select value={form.owner} onChange={(e) => setForm({ ...form, owner: e.target.value })}>{FQA_MEMBERS.map((m) => <option key={m}>{m}</option>)}</Select></Field>
              </div>
              <Field label="기본 태그"><Input value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="smoke,login" /></Field>
              <Field label="실행 매핑" hint="이 스위트를 Playwright 실행으로 변환하는 기준">
                <div className="grid grid-cols-3 gap-2">
                  <Select value={form.mapType} onChange={(e) => setForm({ ...form, mapType: e.target.value })}><option>태그</option><option>폴더</option><option>project</option></Select>
                  <div className="col-span-2"><Input value={form.mapVal} onChange={(e) => setForm({ ...form, mapVal: e.target.value })} placeholder="@home  /  tests/auth/  /  payment" /></div>
                </div>
              </Field>
              <Field label="Setup / Teardown (fixture)">
                <div className="space-y-1.5 rounded-lg bg-slate-800 p-3">
                  <div className="flex items-center justify-between text-sm text-slate-300"><span>storageState(로그인 세션) 사용</span><TG on={form.storage} onClick={() => tog("storage")} /></div>
                  <div className="flex items-center justify-between text-sm text-slate-300"><span>실행 전 데이터 시드</span><TG on={form.seed} onClick={() => tog("seed")} /></div>
                  <div className="flex items-center justify-between text-sm text-slate-300"><span>실행 후 정리(teardown)</span><TG on={form.clean} onClick={() => tog("clean")} /></div>
                </div>
              </Field>
              <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setOpen(false)}>취소</Btn><Btn kind="primary" icon={Save} onClick={save}>{edit === null ? "추가" : "저장"}</Btn></div>
            </div>
          </div>
        </div>
      )}
      <Toast msg={msg} />
    </div>
  );
}
/* ═══════════ 6. 실행 관리 ═══════════ */
const RUN_KPI = [["실행 중", 2, "text-amber-400"], ["대기", 3, "text-slate-100"], ["오늘 완료", 48, "text-emerald-400"], ["오늘 실패", 5, "text-red-400"], ["예약", 4, "text-teal-400"]];
const RUN_ROWS = [
  { id: "FRUN-512", name: "로그인 회귀", suite: "로그인 / 인증", brow: "Chrome", status: "실행 중", prog: 62, progt: "42/68", dur: "3분 12초", by: "QA Engineer" },
  { id: "FRUN-511", name: "결제 스모크", suite: "결제 / 요금제", brow: "Chrome+FF", status: "실행 중", prog: 33, progt: "8/24", dur: "5분 02초", by: "CI/CD Bot" },
  { id: "FRUN-509", name: "회원가입 검증", suite: "온보딩", brow: "Chrome", status: "대기 중", prog: 0, progt: "대기 #1", dur: "-", by: "예약" },
  { id: "FRUN-505", name: "메인 화면 스모크", suite: "홈", brow: "Chrome", status: "완료", prog: 100, progt: "30/30", dur: "2분 41초", by: "QA Engineer" },
  { id: "FRUN-502", name: "로그인 회귀", suite: "로그인 / 인증", brow: "Chrome", status: "실패", prog: 97, progt: "66/68", dur: "3분 30초", by: "스케줄" },
];
const RUN_LOG = [
  { lv: "INFO", t: "FRUN-512 시작 · Chrome 1920×1080" },
  { lv: "TC", t: "TC-031 로그인 성공 확인" },
  { lv: "STEP", t: "fill [data-testid=username]" },
  { lv: "STEP", t: "click role=button[로그인]" },
  { lv: "PASS", t: "TC-031 PASS (0.7s)" },
  { lv: "TC", t: "TC-156 부가서비스 신청" },
  { lv: "FAIL", t: "TC-156 상태 미반영 (8.4s)" },
];
export function FqaRunScreen() {
  const [msg, flash] = useToast();
  const [lvl, setLvl] = useState("ALL");
  const [tab, setTab] = useState("진행");
  const sK = { "실행 중": "warn", "대기 중": "info", "완료": "pass", "실패": "fail" };
  const lvK = { INFO: "text-slate-400", TC: "text-teal-300", STEP: "text-slate-400", PASS: "text-emerald-300", FAIL: "text-red-300" };
  const logs = RUN_LOG.filter((l) => lvl === "ALL" || l.lv === lvl);
  const HIST = [
    { id: "FRUN-502", suite: "로그인 / 인증", trig: "스케줄", at: "오늘 11:10", st: "실패", pass: "61/68", dur: "3분 30초" },
    { id: "FRUN-498", suite: "결제 / 요금제", trig: "CI", at: "오늘 09:42", st: "완료", pass: "24/24", dur: "2분 10초" },
    { id: "FRUN-491", suite: "홈", trig: "수동", at: "어제 18:20", st: "완료", pass: "30/30", dur: "2분 41초" },
    { id: "FRUN-487", suite: "로그인 / 인증", trig: "스케줄", at: "어제 09:00", st: "완료", pass: "66/68", dur: "3분 22초" },
  ];
  const tK = { "수동": "info", "스케줄": "pass", "CI": "warn" };
  const hK = { "완료": "pass", "실패": "fail" };
  return (
    <div className="space-y-4">
      <Hdr icon={Play} title="실행" desc="실행 큐 · 이력" />
      <div className="flex gap-1.5">
        {[["진행", "진행 중 / 큐"], ["이력", "실행 이력"]].map(([k, l]) => (<button key={k} onClick={() => setTab(k)} className={"rounded-lg px-3 py-1.5 text-xs font-medium " + (tab === k ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200")}>{l}</button>))}
      </div>
      {tab === "진행" && (
        <>
          <div className="grid grid-cols-5 gap-3">
            {RUN_KPI.map((k) => (<Card key={k[0]} className="p-3 text-center"><div className={"text-2xl font-bold " + k[2]}>{k[1]}</div><div className="mt-0.5 text-xs text-slate-500">{k[0]}</div></Card>))}
          </div>
          <div className="flex items-center gap-2">
            <div style={{ width: 120 }}><Select><option>전체 상태</option><option>실행 중</option><option>대기 중</option><option>완료</option><option>실패</option></Select></div>
            <div style={{ width: 150 }}><Select><option>전체 스위트</option><option>로그인 / 인증</option><option>결제 / 요금제</option></Select></div>
            <div style={{ width: 130 }}><Select><option>전체 브라우저</option><option>Chrome</option><option>Firefox</option></Select></div>
            <div className="flex-1" />
            <Btn icon={Calendar} onClick={() => flash("예약 실행 추가")}>예약 추가</Btn>
            <Btn kind="primary" icon={Play} onClick={() => flash("즉시 실행 시작")}>즉시 실행</Btn>
          </div>
          <div className="grid grid-cols-12 gap-4">
            <Card className="col-span-8 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-800 text-left text-slate-500"><th className="px-4 py-2.5 font-medium">실행</th><th className="font-medium">스위트</th><th className="font-medium">브라우저</th><th className="font-medium">상태</th><th className="font-medium">진행</th><th className="font-medium">소요</th><th></th></tr></thead>
                <tbody>
                  {RUN_ROWS.map((r) => (
                    <tr key={r.id} className="border-b border-slate-800 text-slate-300 hover:bg-slate-800">
                      <td className="px-4 py-3"><div className="font-mono text-xs text-teal-400">{r.id}</div><div className="text-slate-200">{r.name}</div></td>
                      <td className="text-slate-400">{r.suite}</td>
                      <td className="text-xs text-slate-400">{r.brow}</td>
                      <td><Badge kind={sK[r.status]}>{r.status}</Badge></td>
                      <td style={{ minWidth: 90 }}>{r.status === "대기 중" ? <span className="text-xs text-slate-500">{r.progt}</span> : <div><div className="mb-0.5 text-xs text-slate-400">{r.progt}</div><div className="h-1.5 rounded bg-slate-800"><div className="h-1.5 rounded bg-teal-500" style={{ width: r.prog + "%" }} /></div></div>}</td>
                      <td className="text-xs text-slate-400">{r.dur}</td>
                      <td className="pr-4 text-right whitespace-nowrap">{r.status === "실행 중" ? <button onClick={() => flash(r.id + " 중단")} className="mr-2 text-slate-500 hover:text-red-400"><Square size={13} /></button> : null}<button onClick={() => flash(r.id + " 결과로")} className="text-xs text-slate-400 hover:text-teal-400">상세</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card className="col-span-4 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2.5"><span className="text-sm font-semibold text-slate-200">실시간 로그</span><span className="flex items-center gap-1 text-xs text-red-300"><span className="h-1.5 w-1.5 rounded-full bg-red-400" />LIVE</span></div>
              <div className="flex flex-wrap gap-1 border-b border-slate-800 px-2 py-1.5">
                {["ALL", "INFO", "TC", "STEP", "PASS", "FAIL"].map((l) => (<button key={l} onClick={() => setLvl(l)} className={"rounded px-1.5 py-0.5 text-xs " + (lvl === l ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200")}>{l}</button>))}
              </div>
              <div className="overflow-y-auto p-2 font-mono text-xs" style={{ maxHeight: 230 }}>
                {logs.map((l, i) => (<div key={i} className="flex gap-2 py-0.5"><span className={"w-9 shrink-0 font-semibold " + (lvK[l.lv] || "text-slate-500")}>{l.lv}</span><span className="text-slate-400">{l.t}</span></div>))}
              </div>
            </Card>
          </div>
        </>
      )}
      {tab === "이력" && (
        <Card className="overflow-hidden">
          <table className="w-full text-sm">
            <thead><tr className="border-b border-slate-800 text-left text-slate-500"><th className="px-4 py-2.5 font-medium">실행</th><th className="font-medium">스위트</th><th className="font-medium">트리거</th><th className="font-medium">시각</th><th className="font-medium">상태</th><th className="font-medium">결과</th><th className="font-medium">소요</th><th></th></tr></thead>
            <tbody>
              {HIST.map((r) => (
                <tr key={r.id} className="border-b border-slate-800 text-slate-300 hover:bg-slate-800">
                  <td className="px-4 py-3 font-mono text-xs text-teal-400">{r.id}</td>
                  <td className="text-slate-300">{r.suite}</td>
                  <td><Badge kind={tK[r.trig]}>{r.trig}</Badge></td>
                  <td className="text-xs text-slate-400">{r.at}</td>
                  <td><Badge kind={hK[r.st]}>{r.st}</Badge></td>
                  <td className="text-xs text-slate-400">{r.pass}</td>
                  <td className="text-xs text-slate-400">{r.dur}</td>
                  <td className="pr-4 text-right"><button onClick={() => flash(r.id + " 결과 상세")} className="text-xs text-slate-400 hover:text-teal-400">상세</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </Card>
      )}
      <Toast msg={msg} />
    </div>
  );
}
/* ═══════════ 7. 결과 상세 ═══════════ */
const RES_SUM = [["전체 TC", 68, "text-slate-100"], ["통과", 61, "text-emerald-400"], ["실패", 5, "text-red-400"], ["경고", 2, "text-amber-400"], ["Self-Healing", 3, "text-teal-400"]];
const RES_TCS = [
  { id: "TC-156", name: "부가서비스 신청 후 상태 미반영", v: "FAIL", dur: "8.4s" },
  { id: "TC-203", name: "OTP 재발송 오류", v: "FAIL", dur: "1.2s" },
  { id: "TC-089", name: "레이아웃 깨짐", v: "FAIL", dur: "0.5s" },
  { id: "TC-031", name: "로그인 성공", v: "PASS", dur: "0.7s" },
  { id: "TC-044", name: "자동 로그인", v: "HEAL", dur: "1.8s" },
  { id: "TC-055", name: "세션 만료", v: "PASS", dur: "3.2s" },
];
const RES_STEPS = [
  { act: "브라우저 열기", info: "chromium · /addon", dur: "1,942ms", ok: true },
  { act: "로그인", info: "[data-testid=login] → 성공", dur: "892ms", ok: true },
  { act: "부가서비스 메뉴 탭", info: "#menu_addon → 성공", dur: "324ms", ok: true },
  { act: "부가서비스 신청", info: "#btn_subscribe → 완료", dur: "1,201ms", ok: true },
  { act: "상태 검증 실패", info: '기대 "이용 중" / 실제 "신청 가능" (재시도 2회)', dur: "8,412ms", ok: false },
];
export function FqaResultScreen({ initTab }) {
  const [msg, flash] = useToast();
  const [tab, setTab] = useState(initTab || "상세");
  const [filt, setFilt] = useState("전체");
  const [sel, setSel] = useState(RES_TCS[0]);
  const [etab, setEtab] = useState("스크린샷");
  const FLAKY = [
    { id: "TC-156", name: "부가서비스 상태 반영", runs: 12, fails: 5, rate: 42, flaky: true, streak: "최근 5회 중 3회 실패" },
    { id: "TC-203", name: "OTP 재발송", runs: 12, fails: 4, rate: 33, flaky: true, streak: "PASS/FAIL 교차" },
    { id: "TC-089", name: "레이아웃 깨짐", runs: 12, fails: 3, rate: 25, flaky: false, streak: "지속 실패(회귀)" },
    { id: "TC-301", name: "결제 금액 검증", runs: 12, fails: 2, rate: 17, flaky: false, streak: "간헐 실패" },
    { id: "TC-044", name: "자동 로그인", runs: 12, fails: 1, rate: 8, flaky: true, streak: "Self-Healing 보정 3회" },
  ];
  const flakyN = FLAKY.filter((r) => r.flaky).length;
  const persistN = FLAKY.length - flakyN;
  const vK = { PASS: "pass", FAIL: "fail", HEAL: "teal", WARN: "warn" };
  const shown = RES_TCS.filter((t) => filt === "전체" || (filt === "실패만" && t.v === "FAIL") || (filt === "통과만" && t.v === "PASS") || (filt === "Healing" && t.v === "HEAL"));
  const RUNSEL = [["FRUN-487", 97.0], ["FRUN-498", 100], ["FRUN-502", 89.7]];
  const [aId, setAId] = useState("FRUN-487");
  const [bId, setBId] = useState("FRUN-502");
  const REG = [
    { id: "TC-031", name: "로그인 성공", a: "PASS", b: "PASS" },
    { id: "TC-156", name: "부가서비스 상태 반영", a: "PASS", b: "FAIL" },
    { id: "TC-203", name: "OTP 재발송", a: "PASS", b: "FAIL" },
    { id: "TC-089", name: "레이아웃 깨짐", a: "WARN", b: "FAIL" },
    { id: "TC-044", name: "자동 로그인", a: "FAIL", b: "PASS" },
  ];
  const rank = { FAIL: 0, WARN: 1, PASS: 2 };
  const cls = (a, b) => (a === b ? { k: "유지", c: "text-slate-500" } : rank[b] > rank[a] ? { k: "개선", c: "text-emerald-400" } : { k: "퇴행", c: "text-red-400" });
  const summ = REG.reduce((acc, r) => { const k = cls(r.a, r.b).k; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  const aScore = (RUNSEL.find((x) => x[0] === aId) || [])[1];
  const bScore = (RUNSEL.find((x) => x[0] === bId) || [])[1];
  return (
    <div className="space-y-4">
      <Hdr icon={FileText} title="결과" desc="상세 · 회귀 비교" />
      <div className="flex gap-1.5">
        {[["상세", "결과 상세"], ["회귀", "회귀 비교"], ["불안정", "불안정(Flaky)"]].map(([k, l]) => (<button key={k} onClick={() => setTab(k)} className={"rounded-lg px-3 py-1.5 text-xs font-medium " + (tab === k ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200")}>{l}</button>))}
      </div>
      {tab === "상세" && (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-2 p-3">
            <div className="flex items-center gap-2"><span className="font-mono text-sm text-teal-400">FRUN-502</span><Badge kind="fail">실패 5건</Badge><span className="text-xs text-slate-500">Chrome 1920×1080 · GitLab Pipeline #8821</span></div>
            <div className="flex gap-2"><Btn icon={Download} onClick={() => flash("Excel")}>Excel</Btn><Btn icon={Download} onClick={() => flash("PDF")}>PDF</Btn><Btn icon={Image} onClick={() => flash("증적")}>증적</Btn><Btn kind="primary" icon={Bug} onClick={() => flash("실패 5건 결함 일괄 등록")}>결함 일괄 등록</Btn></div>
          </Card>
          <div className="grid grid-cols-6 gap-3">
            {RES_SUM.map((k) => (<Card key={k[0]} className="p-3 text-center"><div className={"text-2xl font-bold " + k[2]}>{k[1]}</div><div className="mt-0.5 text-xs text-slate-500">{k[0]}</div></Card>))}
            <Card className="p-3 text-center"><div className="text-2xl font-bold text-slate-100">3분 30초</div><div className="mt-0.5 text-xs text-slate-500">소요</div></Card>
          </div>
          <Card className="flex flex-wrap items-center gap-3 p-3 text-sm"><span className="font-semibold text-red-300">품질 게이트: FAIL</span><span className="text-slate-400">기준 95% · 실제 <span className="font-semibold text-red-300">89.7%</span></span><span className="text-slate-600">·</span><span className="text-slate-400">Self-Healing 3건</span></Card>
          <div className="grid grid-cols-5 gap-4">
            <Card className="col-span-2 overflow-hidden">
              <div className="flex flex-wrap gap-1.5 border-b border-slate-800 px-3 py-2">
                {["전체", "실패만", "통과만", "Healing"].map((t) => (<button key={t} onClick={() => setFilt(t)} className={"rounded-full px-2.5 py-1 text-xs " + (filt === t ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700")}>{t}</button>))}
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 340 }}>
                {shown.map((t) => (
                  <div key={t.id} onClick={() => setSel(t)} className={"flex items-center justify-between border-b border-slate-800 px-4 py-2.5 cursor-pointer hover:bg-slate-800 " + (sel.id === t.id ? "bg-slate-800" : "")}>
                    <div><span className="font-mono text-xs text-teal-400">{t.id}</span><div className="text-xs text-slate-300">{t.name}</div></div>
                    <div className="flex items-center gap-2"><span className="text-xs text-slate-500">{t.dur}</span><Badge kind={vK[t.v]}>{t.v}</Badge></div>
                  </div>
                ))}
              </div>
            </Card>
            <Card className="col-span-3 p-4">
              <div className="mb-3 flex items-center justify-between"><span className="font-mono text-teal-400">{sel.id}</span><div className="flex gap-2"><Badge kind={vK[sel.v]}>{sel.v}</Badge><Btn icon={RefreshCw} onClick={() => flash(sel.id + " 재실행")}>재실행</Btn>{sel.v === "FAIL" && <Btn kind="danger" icon={Bug} onClick={() => flash(sel.id + " 결함 등록")}>결함 등록</Btn>}</div></div>
              <div className="mb-3 text-sm text-slate-300">{sel.name}</div>
              <div className="mb-2 text-xs font-semibold text-slate-400">스텝 실행 타임라인</div>
              <div className="space-y-1.5">
                {RES_STEPS.map((st, i) => (
                  <div key={i} className={"flex items-center gap-2 rounded-lg border px-3 py-2 text-xs " + (st.ok ? "border-slate-800 bg-slate-800" : "border-red-900 bg-red-950")}>
                    {st.ok ? <CheckCircle2 size={14} className="text-emerald-400" /> : <XCircle size={14} className="text-red-400" />}
                    <span className={"font-medium " + (st.ok ? "text-slate-200" : "text-red-300")}>{st.act}</span>
                    <span className="flex-1 font-mono text-slate-500">{st.info}</span>
                    <span className="text-slate-400">{st.dur}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <div className="flex gap-1.5 border-b border-slate-800">
                  {["스크린샷", "영상", "단말 로그", "Self-Healing"].map((t) => (<button key={t} onClick={() => setEtab(t)} className={"px-2.5 py-1.5 text-xs " + (etab === t ? "border-b-2 border-teal-500 text-teal-300" : "text-slate-500 hover:text-slate-300")}>{t}</button>))}
                </div>
                <div className="flex h-24 items-center justify-center text-xs text-slate-500">{etab === "스크린샷" ? "step5_status_fail.png · 1.4MB" : etab === "영상" ? "run_502.webm · 12MB" : etab === "단말 로그" ? "console/network 로그" : "Self-Healing: #btn_subscribe 로케이터 자동 보정"}</div>
              </div>
            </Card>
          </div>
        </>
      )}
      {tab === "회귀" && (
        <>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4"><div className="mb-1 text-xs text-slate-500">A — 기준</div><Select value={aId} onChange={(e) => setAId(e.target.value)}>{RUNSEL.map((r) => <option key={r[0]} value={r[0]}>{r[0]} · {r[1]}%</option>)}</Select><div className="mt-3 text-4xl font-bold text-slate-300">{aScore}%</div></Card>
            <Card className="border-teal-700 p-4"><div className="mb-1 text-xs text-slate-500">B — 비교</div><Select value={bId} onChange={(e) => setBId(e.target.value)}>{RUNSEL.map((r) => <option key={r[0]} value={r[0]}>{r[0]} · {r[1]}%</option>)}</Select><div className="mt-3 text-4xl font-bold text-teal-400">{bScore}%</div></Card>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center"><div className="text-2xl font-bold text-emerald-400">{summ["개선"] || 0}</div><div className="mt-0.5 text-xs text-slate-500">개선</div></Card>
            <Card className="p-4 text-center"><div className="text-2xl font-bold text-red-400">{summ["퇴행"] || 0}</div><div className="mt-0.5 text-xs text-slate-500">퇴행 (회귀)</div></Card>
            <Card className="p-4 text-center"><div className="text-2xl font-bold text-slate-300">{summ["유지"] || 0}</div><div className="mt-0.5 text-xs text-slate-500">유지</div></Card>
          </div>
          <Card className="overflow-hidden">
            <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-200">케이스 회귀 분석</div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 text-left text-slate-500"><th className="px-4 py-2.5 font-medium">ID</th><th className="font-medium">TC</th><th className="font-medium">A</th><th></th><th className="font-medium">B</th><th className="font-medium">변화</th></tr></thead>
              <tbody>
                {REG.map((r) => { const v = cls(r.a, r.b); return (
                  <tr key={r.id} className={"border-b border-slate-800 text-slate-300 " + (v.k === "퇴행" ? "bg-red-950" : "")}>
                    <td className="px-4 py-2.5 font-mono text-teal-400">{r.id}</td><td className="text-slate-300">{r.name}</td><td><Badge kind={vK[r.a]}>{r.a}</Badge></td><td className="text-slate-600">→</td><td><Badge kind={vK[r.b]}>{r.b}</Badge></td><td className={"font-semibold " + v.c}>{v.k}</td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </Card>
        </>
      )}
      {tab === "불안정" && (
        <>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-400">분석 기간 <span className="text-slate-200">최근 12회 실행</span></span>
            <span className="text-slate-600">·</span>
            <span className="text-amber-300">Flaky {flakyN}건</span>
            <span className="text-red-300">지속 실패 {persistN}건</span>
          </div>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 text-left text-slate-500"><th className="px-4 py-2.5 font-medium">TC</th><th className="font-medium">실패 빈도</th><th className="font-medium">유형</th><th className="font-medium">최근 추세</th><th></th></tr></thead>
              <tbody>
                {FLAKY.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800 text-slate-300 hover:bg-slate-800">
                    <td className="px-4 py-3"><div className="font-mono text-xs text-teal-400">{r.id}</div><div className="text-slate-200">{r.name}</div></td>
                    <td style={{ minWidth: 130 }}><div className="mb-0.5 text-xs text-slate-400">{r.fails}/{r.runs}회 · {r.rate}%</div><div className="h-1.5 rounded bg-slate-800"><div className="h-1.5 rounded" style={{ width: r.rate + "%", background: r.flaky ? "#f59e0b" : "#ef4444" }} /></div></td>
                    <td>{r.flaky ? <Badge kind="warn">Flaky</Badge> : <Badge kind="fail">지속 실패</Badge>}</td>
                    <td className="text-xs text-slate-400">{r.streak}</td>
                    <td className="pr-4 text-right whitespace-nowrap">{r.flaky ? <button onClick={() => flash(r.id + " 격리(quarantine)")} className="mr-3 text-xs text-amber-300 hover:text-amber-200">격리</button> : <button onClick={() => flash(r.id + " 결함 등록")} className="mr-3 text-xs text-red-300 hover:text-red-200">결함 등록</button>}<button onClick={() => flash(r.id + " 테스트케이스로 이동")} className="text-xs text-slate-400 hover:text-teal-400">TC 보기</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div className="text-xs text-slate-500">Flaky(코드 동일·결과 교차)는 <span className="text-amber-300">안정화/격리</span> 대상, 지속 실패는 <span className="text-red-300">실제 결함</span>으로 분리합니다. 같은 run 결과를 TC별로 누적 집계.</div>
        </>
      )}
      <Toast msg={msg} />
    </div>
  );
}
/* ═══════════ 8. FQA 대시보드 ═══════════ */
const barColor = (p) => (p >= 90 ? "#14b8a6" : p >= 80 ? "#f59e0b" : "#ef4444");
const FD_KPI = [
  ["자동화 TC", "1,842", "text-slate-100", "저장소 기준"],
  ["PASS율 (최근 실행)", "92%", "text-emerald-400", "+1.4%p"],
  ["자동화율", "78%", "text-teal-400", "자동/전체 TC"],
  ["Flaky율", "4.2%", "text-amber-400", "불안정 TC 비율"],
  ["미해결 결함", "5", "text-red-400", "FQA · Open"],
];
const FD_TREND = [
  { d: "W1", runs: 32, pass: 88 }, { d: "W2", runs: 38, pass: 90 }, { d: "W3", runs: 41, pass: 89 },
  { d: "W4", runs: 45, pass: 91 }, { d: "W5", runs: 52, pass: 90 }, { d: "W6", runs: 48, pass: 92 },
];
const FD_SUITES = [
  { name: "로그인 / 인증", pass: 98, tc: 12, last: "14:21" },
  { name: "회원가입", pass: 88, tc: 8, last: "13:40" },
  { name: "메인 화면", pass: 95, tc: 15, last: "12:10" },
  { name: "결제 / 요금제", pass: 74, tc: 11, last: "11:10" },
  { name: "API 연동", pass: 100, tc: 6, last: "10:30" },
];
const FD_BROW = [["Chrome", 94, true], ["Firefox", 90, true], ["Safari", null, false]];
const FD_TOPFAIL = [
  { id: "TC-156", name: "부가서비스 상태 반영", rate: "최근 12회 중 5회", flaky: true },
  { id: "TC-203", name: "OTP 재발송", rate: "최근 12회 중 4회", flaky: true },
  { id: "TC-089", name: "레이아웃 깨짐", rate: "최근 12회 중 3회", flaky: false },
  { id: "TC-301", name: "결제 금액 검증", rate: "최근 12회 중 2회", flaky: false },
];
const FD_RECENT = [
  { id: "FRUN-512", name: "로그인 회귀", v: "진행", k: "warn", p: "42/68" },
  { id: "FRUN-505", name: "메인 스모크", v: "통과", k: "pass", p: "30/30" },
  { id: "FRUN-502", name: "로그인 회귀", v: "실패", k: "fail", p: "61/68" },
  { id: "FRUN-498", name: "결제 스모크", v: "통과", k: "pass", p: "24/24" },
];
export function FqaDashboardScreen({ nav }) {
  const [msg, flash] = useToast();
  return (
    <div className="space-y-4">
      <div className="mb-1 flex items-center gap-2"><LayoutDashboard size={16} className="text-teal-400" /><span className="text-sm font-semibold text-slate-100">FQA 대시보드</span><Badge kind="teal">기능 QA</Badge><span className="text-xs text-slate-500">자동화 현황 · 스위트 건강도</span></div>
      <div className="grid grid-cols-5 gap-3">
        {FD_KPI.map((k) => (<Card key={k[0]} className="p-4"><div className="text-xs text-slate-400">{k[0]}</div><div className={"mt-1 text-3xl font-bold " + k[2]}>{k[1]}</div><div className="mt-1 text-xs text-slate-500">{k[3]}</div></Card>))}
      </div>
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200"><TrendingUp size={15} className="text-teal-400" />실행·PASS율 추이</div>
        <ResponsiveContainer width="100%" height={220}>
          <ComposedChart data={FD_TREND}>
            <CartesianGrid stroke="#1e293b" vertical={false} />
            <XAxis dataKey="d" stroke="#475569" fontSize={11} />
            <YAxis yAxisId="l" stroke="#475569" fontSize={11} />
            <YAxis yAxisId="r" orientation="right" domain={[70, 100]} stroke="#475569" fontSize={11} />
            <Tooltip contentStyle={{ background: "#0f172a", border: "1px solid #1e293b", borderRadius: 8, color: "#e2e8f0" }} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Bar yAxisId="l" dataKey="runs" name="실행 수" fill="#334155" radius={[3, 3, 0, 0]} />
            <Line yAxisId="r" type="monotone" dataKey="pass" name="PASS율(%)" stroke="#14b8a6" strokeWidth={2} dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </Card>
      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2 p-4">
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200"><Activity size={15} className="text-teal-400" />스위트 건강도 (최근 실행 PASS율)</div>
          <div className="space-y-2.5">
            {FD_SUITES.map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex justify-between text-xs"><span className="text-slate-300">{s.name} <span className="text-slate-500">· {s.tc} TC · 최근 {s.last}</span></span><span className="font-semibold" style={{ color: barColor(s.pass) }}>{s.pass}%</span></div>
                <div className="h-2 rounded bg-slate-800"><div className="h-2 rounded" style={{ width: s.pass + "%", background: barColor(s.pass) }} /></div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="mb-3 text-sm font-semibold text-slate-200">브라우저별 PASS율</div>
          <div className="space-y-3">
            {FD_BROW.map(([b, p, run]) => (
              <div key={b}>
                <div className="mb-1 flex justify-between text-xs"><span className="text-slate-300">{b}</span>{run ? <span className="font-semibold" style={{ color: barColor(p) }}>{p}%</span> : <span className="text-slate-600">미실행</span>}</div>
                <div className="h-2 rounded bg-slate-800">{run && <div className="h-2 rounded" style={{ width: p + "%", background: barColor(p) }} />}</div>
              </div>
            ))}
          </div>
          <div className="mt-4 border-t border-slate-800 pt-3 text-xs text-slate-500">Safari는 최근 실행 없음 — 실행한 브라우저만 집계합니다.</div>
        </Card>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Card className="p-4">
          <div className="mb-3 flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-semibold text-slate-200"><AlertTriangle size={15} className="text-amber-400" />빈발 실패 Top</span><button onClick={() => (nav ? nav("fqa-result", "불안정") : flash("결과로 이동"))} className="text-xs text-teal-400">전체 보기</button></div>
          <div className="space-y-2">
            {FD_TOPFAIL.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-sm">
                <div><span className="font-mono text-xs text-teal-400">{h.id}</span> <span className="text-slate-200">{h.name}</span><div className="text-xs text-slate-500">{h.rate}</div></div>
                {h.flaky && <Badge kind="warn">Flaky</Badge>}
              </div>
            ))}
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><span className="text-sm font-semibold text-slate-200">최근 실행</span><Btn icon={Play} onClick={() => (nav ? nav("fqa-run") : flash("실행으로"))}>실행</Btn></div>
          <table className="w-full text-sm">
            <tbody className="text-slate-300">
              {FD_RECENT.map((r) => (
                <tr key={r.id} className="border-b border-slate-800 hover:bg-slate-800"><td className="px-4 py-2.5 font-mono text-xs text-teal-400">{r.id}</td><td className="text-slate-200">{r.name}</td><td className="text-xs text-slate-500">{r.p}</td><td className="pr-4 text-right"><Badge kind={r.k}>{r.v}</Badge></td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <div className="text-xs text-slate-500">PASS율은 최근 실행 기준 · Self-Healing 지표는 기능 활성 시 별도 위젯으로 표시.</div>
      <Toast msg={msg} />
    </div>
  );
}
/* ═══════════ 9. 테스트케이스 (통합 저장소) ═══════════ */
const FQA_CASE_LIST = [
  { id: "TC-031", name: "로그인 성공", suite: "로그인 / 인증", tags: "smoke,login", status: "승인", last: "PASS", level: "No-Code", dataset: "계정 풀 ×3", hist: ["PASS", "PASS", "PASS", "PASS"], defects: 0 },
  { id: "TC-021", name: "회원가입 이메일 형식 검증", suite: "회원가입", tags: "signup", status: "승인", last: "PASS", level: "No-Code", dataset: "이메일 ×6", hist: ["PASS", "PASS", "FAIL", "PASS"], defects: 0 },
  { id: "TC-156", name: "부가서비스 상태 반영", suite: "결제 / 요금제", tags: "regression", status: "승인", last: "FAIL", level: "Low-Code", dataset: "-", hist: ["FAIL", "PASS", "FAIL", "FAIL"], defects: 1 },
  { id: "TC-203", name: "OTP 재발송 오류", suite: "로그인 / 인증", tags: "regression", status: "승인", last: "FAIL", level: "No-Code", dataset: "-", hist: ["FAIL", "PASS", "FAIL", "PASS"], defects: 1 },
  { id: "TC-REC-001", name: "로그인 정상 동작 (레코딩)", suite: "로그인 / 인증", tags: "login", status: "검토중", last: "-", level: "Full-Code", dataset: "-", hist: [], defects: 0 },
  { id: "TC-MCP-001", name: "로그인 탐색 시나리오 (MCP)", suite: "로그인 / 인증", tags: "login", status: "검토중", last: "-", level: "Full-Code", dataset: "-", hist: [], defects: 0 },
];
export function FqaCasesScreen() {
  const [msg, flash] = useToast();
  const [mode, setMode] = useState("목록");
  const [addOpen, setAddOpen] = useState(false);
  const [q, setQ] = useState("");
  const [stf, setStf] = useState("전체");
  const [suiteF, setSuiteF] = useState("전체");
  const [sel, setSel] = useState(null);
  const [open, setOpen] = useState(null);
  const stK = { "승인": "pass", "검토중": "warn", "초안": "draft" };
  const reK = { "PASS": "pass", "FAIL": "fail", "-": "info" };
  const lvK2 = { "No-Code": "info", "Low-Code": "teal", "Full-Code": "warn" };
  const list = FQA_CASE_LIST.filter((c) => (stf === "전체" || c.status === stf) && (suiteF === "전체" || c.suite === suiteF) && (c.id + c.name + c.suite).toLowerCase().includes(q.toLowerCase()));
  const Back = () => <button onClick={() => setMode("목록")} className="mb-3 inline-flex items-center gap-1 text-xs text-teal-400"><ChevronLeft size={14} />테스트케이스 목록</button>;
  if (mode === "레코딩") return <div><Back /><FqaRecordScreen /></div>;
  if (mode === "AI") return <div><Back /><FqaAiGenScreen /></div>;
  if (mode === "엑셀") return <div><Back /><FqaExcelScreen /></div>;
  if (mode === "MCP") return <div><Back /><FqaMcpScreen /></div>;
  if (mode === "edit") return <div><Back /><FqaEditorScreen entry={sel ? sel.level : "No-Code"} tc={sel} /></div>;
  return (
    <div className="space-y-4">
      <Hdr icon={Code2} title="테스트케이스" desc="기능 TC 저장소 · 생성·편집·관리" />
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"><Search size={15} className="text-slate-500" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="TC·스위트 검색" className="flex-1 bg-transparent text-sm text-slate-200 outline-none" /></div>
        <div style={{ width: 150 }}><Select value={suiteF} onChange={(e) => setSuiteF(e.target.value)}><option>전체</option>{FQA_SUITES.map((x) => <option key={x}>{x}</option>)}</Select></div>
        <div style={{ width: 110 }}><Select value={stf} onChange={(e) => setStf(e.target.value)}><option>전체</option><option>승인</option><option>검토중</option><option>초안</option></Select></div>
        <div className="relative">
          <Btn kind="primary" icon={Plus} onClick={() => setAddOpen(!addOpen)}>새 TC</Btn>
          {addOpen && (
            <div className="absolute right-0 z-20 mt-1 w-44 rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl">
              {[["레코딩", Video, "레코딩"], ["AI 생성", Brain, "AI"], ["엑셀 업로드", Upload, "엑셀"], ["MCP 탐색", Cpu, "MCP"]].map(([l, Ic, m]) => (
                <button key={l} onClick={() => { setMode(m); setAddOpen(false); }} className="flex w-full items-center gap-2 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800"><Ic size={14} className="text-teal-400" />{l}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-800 text-left text-slate-500"><th className="px-4 py-2.5 font-medium">ID</th><th className="font-medium">이름</th><th className="font-medium">스위트</th><th className="font-medium">데이터셋</th><th className="font-medium">관리</th><th className="font-medium">상태</th><th className="font-medium">최근</th><th></th></tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} onClick={() => setOpen(c)} className="cursor-pointer border-b border-slate-800 text-slate-300 hover:bg-slate-800">
                <td className="px-4 py-3 font-mono text-teal-400">{c.id}</td>
                <td className="text-slate-200">{c.name}</td>
                <td className="text-slate-400">{c.suite}</td>
                <td className="text-xs text-slate-500">{c.dataset}</td>
                <td><Badge kind={lvK2[c.level] || "info"}>{c.level}</Badge></td>
                <td><Badge kind={stK[c.status]}>{c.status}</Badge></td>
                <td><Badge kind={reK[c.last]}>{c.last}</Badge></td>
                <td className="pr-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}><button onClick={() => flash(c.id + " 단건 디버그 실행")} className="mr-3 text-slate-400 hover:text-teal-400" title="단건(디버그) 실행"><Play size={14} /></button><button onClick={() => { setSel(c); setMode("edit"); }} className="text-xs text-slate-400 hover:text-teal-400">편집</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="text-xs text-slate-500">"새 TC"로 레코딩·AI·엑셀·MCP 생성 → 검토 대기로 등록 → 행 클릭 시 상세, 편집은 에디터로 이동.</div>

      {open && (
        <div className="fixed inset-0 z-30 flex justify-end bg-black bg-opacity-50" onClick={() => setOpen(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-slate-800 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><span className="font-mono text-teal-400">{open.id}</span><button onClick={() => setOpen(null)} className="text-slate-500 hover:text-slate-300"><X size={20} /></button></div>
            <div className="space-y-4 text-sm">
              <div><div className="text-slate-100">{open.name}</div><div className="mt-1.5 flex flex-wrap gap-1.5"><Badge kind="info">{open.suite}</Badge><Badge kind={lvK2[open.level]}>{open.level}</Badge><Badge kind={stK[open.status]}>{open.status}</Badge></div></div>
              <div><div className="mb-1 text-xs text-slate-500">태그 · 데이터셋</div><div className="text-xs text-slate-400">{open.tags} · 데이터셋 {open.dataset}</div></div>
              <div>
                <div className="mb-1 text-xs text-slate-500">최근 실행 이력</div>
                {open.hist.length ? <div className="flex items-center gap-1.5">{open.hist.map((h, i) => <span key={i} className={"flex h-6 w-6 items-center justify-center rounded text-xs font-semibold " + (h === "PASS" ? "bg-emerald-900 text-emerald-300" : "bg-red-900 text-red-300")}>{h === "PASS" ? "P" : "F"}</span>)}<span className="ml-1 text-xs text-slate-500">(최근 4회)</span></div> : <div className="text-xs text-slate-500">실행 이력 없음 (검토 대기)</div>}
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-500">걸린 결함</div>
                {open.defects ? <div className="flex items-center gap-2"><Badge kind="fail">{open.defects}건</Badge><button onClick={() => flash("결함으로 이동")} className="text-xs text-teal-400">보기</button></div> : <div className="text-xs text-slate-500">없음</div>}
              </div>
              <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-3">
                <Btn kind="primary" icon={Code2} onClick={() => { setSel(open); setMode("edit"); setOpen(null); }}>편집(에디터)</Btn>
                <Btn icon={Play} onClick={() => flash(open.id + " 단건 디버그 실행")}>단건 실행</Btn>
                {open.last === "FAIL" && <Btn kind="danger" icon={Bug} onClick={() => flash(open.id + " 결함 등록")}>결함 등록</Btn>}
              </div>
            </div>
          </div>
        </div>
      )}
      <Toast msg={msg} />
    </div>
  );
}
/* ═══════════ 10. 대상·환경 (대상→환경 계층) ═══════════ */
const SYSTEMS_SEED = [
  { id: 1, name: "T월드 웹", type: "Web", envs: [
    { env: "스테이징", url: "https://stg.tworld.co.kr", status: "연결됨", ver: "v5.12.0-rc", prod: false },
    { env: "운영", url: "https://www.tworld.co.kr", status: "연결됨", ver: "v5.11.3", prod: true },
  ] },
  { id: 2, name: "T월드 API", type: "API", envs: [
    { env: "스테이징", url: "https://api-stg.tworld.co.kr", status: "미확인", ver: "-", prod: false },
  ] },
  { id: 3, name: "고객센터 웹", type: "Web", envs: [
    { env: "스테이징", url: "https://stg-cs.tworld.co.kr", status: "연결됨", ver: "v2.3.0", prod: false },
  ] },
];
const ACCT_SEED = [
  { role: "일반", acct: "qa_user01", st: "활성" },
  { role: "VIP", acct: "qa_vip01", st: "활성" },
  { role: "관리자", acct: "qa_admin", st: "활성" },
];
const TRow = ({ label, on, set, hint }) => (
  <div className="flex items-center justify-between py-1 text-sm text-slate-300"><span>{label}{hint && <span className="ml-1 text-xs text-slate-500">{hint}</span>}</span><TG on={on} onClick={() => set(!on)} /></div>
);
export function FqaTargetScreen() {
  const [msg, flash] = useToast();
  const [systems, setSystems] = useState(SYSTEMS_SEED);
  const [accts, setAccts] = useState(ACCT_SEED);
  const [sel, setSel] = useState(0);
  const [envIdx, setEnvIdx] = useState(0);
  const [auth, setAuth] = useState("storageState 재사용");
  const [tfa, setTfa] = useState("TOTP 시드");
  const [writeBlock, setWriteBlock] = useState(true);
  const [synth, setSynth] = useState(true);
  const [approval, setApproval] = useState(true);
  const [vpn, setVpn] = useState(true);
  const [basic, setBasic] = useState(false);
  const [tls, setTls] = useState(true);
  const [seedBefore, setSeedBefore] = useState(true);
  const [cleanAfter, setCleanAfter] = useState(true);
  const [test, setTest] = useState(null);
  const [modal, setModal] = useState(null);
  const [tf, setTf] = useState({ name: "", type: "Web", env: "스테이징", url: "" });
  const [ef, setEf] = useState({ env: "스테이징", url: "" });
  const [af, setAf] = useState({ role: "일반", acct: "" });
  const stK = { "연결됨": "pass", "미확인": "warn", "오류": "fail" };
  const sys = systems[sel] || systems[0];
  const env = sys.envs[envIdx] || sys.envs[0];
  const choose = (i) => { setSel(i); setEnvIdx(0); setTest(null); };
  const runTest = () => { setTest({ s: "run" }); setTimeout(() => setTest({ s: "ok", m: "연결 성공 · 200 OK · 빌드 " + env.ver + " · 로그인 가능" }), 800); };
  const addTarget = () => {
    if (!tf.name.trim() || !tf.url.trim()) { flash("이름과 Base URL을 입력하세요"); return; }
    const ns = { id: Date.now(), name: tf.name, type: tf.type, envs: [{ env: tf.env, url: tf.url, status: "미확인", ver: "-", prod: tf.env === "운영" }] };
    setSystems([...systems, ns]); setSel(systems.length); setEnvIdx(0); setModal(null); flash("대상이 추가되었습니다");
  };
  const addEnv = () => {
    if (!ef.url.trim()) { flash("Base URL을 입력하세요"); return; }
    const upd = systems.map((sy, i) => (i === sel ? { ...sy, envs: [...sy.envs, { env: ef.env, url: ef.url, status: "미확인", ver: "-", prod: ef.env === "운영" }] } : sy));
    setSystems(upd); setEnvIdx(sys.envs.length); setModal(null); flash("환경이 추가되었습니다");
  };
  const addAcct = () => {
    if (!af.acct.trim()) { flash("계정 ID를 입력하세요"); return; }
    setAccts([...accts, { role: af.role, acct: af.acct, st: "활성" }]); setModal(null); flash("계정이 추가되었습니다");
  };
  return (
    <div className="space-y-4">
      <Hdr icon={Globe} title="대상·환경" desc="대상(SUT) → 환경 · 인증 · 접근 · 데이터" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-3">
          <Btn kind="primary" icon={Plus} className="w-full" onClick={() => { setTf({ name: "", type: "Web", env: "스테이징", url: "" }); setModal("target"); }}>대상 추가</Btn>
          {systems.map((sy, i) => (
            <Card key={sy.id} className={"cursor-pointer p-3 " + (sel === i ? "border-teal-500" : "hover:border-slate-700")} >
              <div onClick={() => choose(i)}>
                <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-100">{sy.name}</span><Badge kind="info">{sy.type}</Badge></div>
                <div className="mt-1.5 flex flex-wrap gap-1">{sy.envs.map((e) => <Badge key={e.env} kind={e.prod ? "warn" : "info"}>{e.env}</Badge>)}</div>
              </div>
            </Card>
          ))}
        </div>
        <div className="col-span-9 space-y-3">
          <Card className="flex items-center justify-between p-3">
            <div className="flex items-center gap-2"><span className="text-base font-semibold text-slate-100">{sys.name}</span><Badge kind="info">{sys.type}</Badge></div>
            <div className="flex items-center gap-1.5">{sys.envs.map((e, i) => (<button key={e.env} onClick={() => { setEnvIdx(i); setTest(null); }} className={"rounded-lg px-3 py-1.5 text-xs font-medium " + (envIdx === i ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200")}>{e.env}{e.prod ? " ●" : ""}</button>))}<button onClick={() => { setEf({ env: "개발", url: "" }); setModal("env"); }} className="rounded-lg border border-slate-700 px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-800">+ 환경</button></div>
          </Card>

          <Card className="p-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-3 text-sm"><span className="font-mono text-slate-300">{env.url}</span><Badge kind={stK[env.status]}>{env.status}</Badge><span className="text-xs text-slate-500">빌드 {env.ver}</span></div>
              <Btn icon={RefreshCw} onClick={runTest}>{test && test.s === "run" ? "테스트 중…" : "연결 테스트"}</Btn>
            </div>
            {test && test.s === "ok" && <div className="mt-2 flex items-center gap-2 text-xs text-emerald-300"><CheckCircle2 size={14} />{test.m}</div>}
          </Card>

          {env.prod && (
            <Card className="border-amber-800 bg-amber-950 p-4">
              <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-amber-200"><AlertTriangle size={15} />운영 환경 가드레일</div>
              <TRow label="쓰기 테스트 차단" hint="(읽기·스모크만 허용)" on={writeBlock} set={setWriteBlock} />
              <TRow label="합성(synthetic) 계정만 허용" on={synth} set={setSynth} />
              <TRow label="실행 전 승인 필요" on={approval} set={setApproval} />
              <div className="mt-2 text-xs text-amber-300/80">운영 자동화는 실데이터 오염 위험 — 결제·가입 등 쓰기 시나리오는 기본 차단됩니다.</div>
            </Card>
          )}

          <Card className="p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-200">인증</div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="인증 방식"><Select value={auth} onChange={(e) => setAuth(e.target.value)}><option>storageState 재사용</option><option>폼 로그인 절차</option><option>API Bearer 토큰</option></Select></Field>
              <Field label="2FA / OTP 처리"><Select value={tfa} onChange={(e) => setTfa(e.target.value)}><option>없음(테스트 계정 비활성)</option><option>TOTP 시드</option><option>백도어 토큰</option></Select></Field>
            </div>
            {auth === "storageState 재사용" && <div className="rounded-lg bg-slate-800 p-3 text-xs text-slate-400">로그인 세션을 1회 캡처해 <span className="font-mono text-slate-300">storageState.json</span>으로 저장 → 모든 테스트가 재사용(매 테스트 로그인 생략). 만료 시 자동 갱신.</div>}
            {auth === "폼 로그인 절차" && (
              <div className="grid grid-cols-2 gap-2">
                <Field label="로그인 URL"><Input defaultValue="/login" /></Field>
                <Field label="성공 판정"><Input defaultValue="text=환영합니다" /></Field>
                <Field label="아이디 셀렉터"><Input defaultValue="[data-testid=username]" /></Field>
                <Field label="비번 셀렉터"><Input defaultValue="[data-testid=password]" /></Field>
              </div>
            )}
            <div>
              <div className="mb-1 flex items-center justify-between"><span className="text-xs font-semibold text-slate-400">계정 풀 (역할별)</span><button onClick={() => { setAf({ role: "일반", acct: "" }); setModal("acct"); }} className="text-xs text-teal-400">+ 계정</button></div>
              <div className="overflow-hidden rounded-lg border border-slate-800">
                <table className="w-full text-sm"><tbody>
                  {accts.map((aR, i) => (<tr key={i} className="border-b border-slate-800 last:border-0"><td className="px-3 py-1.5"><Badge kind="info">{aR.role}</Badge></td><td className="font-mono text-xs text-slate-300">{aR.acct}</td><td className="px-3 text-right"><Badge kind="pass">{aR.st}</Badge></td></tr>))}
                </tbody></table>
              </div>
            </div>
            <div className="text-xs text-slate-500">계정·토큰 시크릿은 환경별로 Secrets 저장소에 분리 보관됩니다.</div>
          </Card>

          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4 space-y-1">
              <div className="mb-1 text-sm font-semibold text-slate-200">접근 제어</div>
              <TRow label="VPN / IP 화이트리스트" on={vpn} set={setVpn} />
              <TRow label="Basic Auth (htpasswd)" on={basic} set={setBasic} />
              <TRow label="자체서명 TLS 무시" hint="(스테이징)" on={tls} set={setTls} />
              <Field label="프록시 (선택)"><Input placeholder="http://proxy:8080" /></Field>
            </Card>
            <Card className="p-4 space-y-2">
              <div className="text-sm font-semibold text-slate-200">테스트 데이터</div>
              <Field label="데이터셋"><Select><option>기본 계정 풀</option><option>회귀용 시드 데이터</option><option>없음</option></Select></Field>
              <TRow label="실행 전 데이터 시드" on={seedBefore} set={setSeedBefore} />
              <TRow label="실행 후 정리(teardown)" on={cleanAfter} set={setCleanAfter} />
            </Card>
          </div>
          <div className="text-xs text-slate-500">대상·환경 설정은 실행 계획·실행의 기준이 되며, 빌드 버전은 결과 스냅샷에 기록되어 재현성을 보장합니다.</div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5"><h3 className="font-semibold text-slate-100">{modal === "target" ? "대상 추가" : modal === "env" ? "환경 추가" : "계정 추가"}</h3><button onClick={() => setModal(null)} className="text-slate-500 hover:text-slate-200"><X size={18} /></button></div>
            <div className="space-y-3.5 p-5">
              {modal === "target" && (<>
                <Field label="대상 이름"><Input value={tf.name} onChange={(e) => setTf({ ...tf, name: e.target.value })} placeholder="예: T월드 웹" /></Field>
                <div className="grid grid-cols-2 gap-3"><Field label="유형"><Select value={tf.type} onChange={(e) => setTf({ ...tf, type: e.target.value })}><option>Web</option><option>API</option></Select></Field><Field label="첫 환경"><Select value={tf.env} onChange={(e) => setTf({ ...tf, env: e.target.value })}><option>스테이징</option><option>운영</option><option>개발</option></Select></Field></div>
                <Field label="Base URL"><Input value={tf.url} onChange={(e) => setTf({ ...tf, url: e.target.value })} placeholder="https://stg.tworld.co.kr" /></Field>
                <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setModal(null)}>취소</Btn><Btn kind="primary" icon={Save} onClick={addTarget}>추가</Btn></div>
              </>)}
              {modal === "env" && (<>
                <Field label="환경"><Select value={ef.env} onChange={(e) => setEf({ ...ef, env: e.target.value })}><option>스테이징</option><option>운영</option><option>개발</option></Select></Field>
                <Field label="Base URL"><Input value={ef.url} onChange={(e) => setEf({ ...ef, url: e.target.value })} placeholder="https://..." /></Field>
                <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setModal(null)}>취소</Btn><Btn kind="primary" icon={Save} onClick={addEnv}>추가</Btn></div>
              </>)}
              {modal === "acct" && (<>
                <div className="grid grid-cols-2 gap-3"><Field label="역할"><Select value={af.role} onChange={(e) => setAf({ ...af, role: e.target.value })}><option>일반</option><option>VIP</option><option>관리자</option></Select></Field><Field label="계정 ID"><Input value={af.acct} onChange={(e) => setAf({ ...af, acct: e.target.value })} placeholder="qa_user02" /></Field></div>
                <div className="rounded-lg bg-slate-800 p-2.5 text-xs text-slate-400">비밀번호·토큰은 Secrets 저장소에서 별도 관리됩니다.</div>
                <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setModal(null)}>취소</Btn><Btn kind="primary" icon={Save} onClick={addAcct}>추가</Btn></div>
              </>)}
            </div>
          </div>
        </div>
      )}
      <Toast msg={msg} />
    </div>
  );
}
/* ═══════════ 11. 실행 계획 ═══════════ */
const PLAN_SEED = [
  { id: 1, name: "로그인 회귀 (스테이징)", target: "T월드 웹 · 스테이징", suites: "로그인 / 인증", tags: "regression", sched: "매일 09:00", status: "활성" },
  { id: 2, name: "전체 스모크 (운영)", target: "T월드 웹 · 운영", suites: "전체", tags: "smoke", sched: "커밋 시(CI)", status: "활성" },
  { id: 3, name: "결제 회귀", target: "T월드 웹 · 스테이징", suites: "결제 / 요금제", tags: "critical", sched: "예약 없음", status: "초안" },
];
const TG = ({ on, onClick }) => (
  <button onClick={onClick} className={"relative h-5 w-9 rounded-full transition " + (on ? "bg-teal-600" : "bg-slate-700")}><span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all" style={{ left: on ? 18 : 2 }} /></button>
);
export function FqaPlanScreen() {
  const [msg, flash] = useToast();
  const [plans] = useState(PLAN_SEED);
  const [sel, setSel] = useState(PLAN_SEED[0]);
  const [target, setTarget] = useState(PLAN_SEED[0].target);
  const [suites, setSuites] = useState(PLAN_SEED[0].suites);
  const [tags, setTags] = useState(PLAN_SEED[0].tags);
  const [brow, setBrow] = useState(["Chrome"]);
  const [res, setRes] = useState("1920×1080");
  const [headless, setHeadless] = useState(true);
  const [workers, setWorkers] = useState("4");
  const [retry, setRetry] = useState(1);
  const [onfail, setOnfail] = useState("계속 진행");
  const [video, setVideo] = useState("실패 시만");
  const [gate, setGate] = useState(95);
  const [trig, setTrig] = useState("정기");
  const [cron, setCron] = useState("매일 09:00");
  const [ev, setEv] = useState({ commit: true, deploy: false, ci: false });
  const toggleB = (b) => setBrow(brow.includes(b) ? brow.filter((x) => x !== b) : [...brow, b]);
  const pick = (p) => { setSel(p); setTarget(p.target); setSuites(p.suites); setTags(p.tags); };
  return (
    <div className="space-y-4">
      <Hdr icon={ClipboardList} title="실행 계획" desc="대상·스위트·실행옵션·스케줄 정의" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-3">
          <Btn kind="primary" icon={Plus} className="w-full" onClick={() => flash("새 실행 계획")}>새 실행 계획</Btn>
          {plans.map((p) => (
            <Card key={p.id} className={"cursor-pointer p-3 " + (sel.id === p.id ? "border-teal-500" : "hover:border-slate-700")} >
              <div onClick={() => pick(p)}>
                <div className="flex items-center justify-between"><div className="text-sm font-semibold text-slate-100">{p.name}</div><Badge kind={p.status === "활성" ? "pass" : "draft"}>{p.status}</Badge></div>
                <div className="mt-1 text-xs text-slate-500">{p.target}</div>
                <div className="mt-1 text-xs text-slate-500">{p.suites} · {p.sched}</div>
              </div>
            </Card>
          ))}
        </div>
        <Card className="col-span-9 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-base font-semibold text-slate-100">상세 설정 — {sel.name}</div>
            <div className="flex gap-2"><Btn icon={RefreshCw} onClick={() => flash(sel.name + " 설정 저장됨")}>설정 저장</Btn><Btn kind="primary" icon={Play} onClick={() => flash(sel.name + " 지금 실행 → 실행(진행 중) 적재")}>지금 실행</Btn></div>
          </div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-3.5">
              <Field label="대상·환경"><Select value={target} onChange={(e) => setTarget(e.target.value)}><option>T월드 웹 · 스테이징</option><option>T월드 웹 · 운영</option><option>T월드 API · 스테이징</option></Select></Field>
              <Field label="대상 스위트"><Select value={suites} onChange={(e) => setSuites(e.target.value)}><option>전체</option><option>로그인 / 인증</option><option>회원가입</option><option>결제 / 요금제</option></Select></Field>
              <Field label="태그 필터" hint="@smoke @regression @critical 등"><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="regression,critical" /></Field>
              <Field label="품질 게이트 (PASS 기준 %)"><Input type="number" value={gate} onChange={(e) => setGate(+e.target.value || 0)} className="w-28" /></Field>
            </div>
            <div className="space-y-3.5">
              <Field label="브라우저 (다중)">
                <div className="grid grid-cols-2 gap-2">
                  {["Chrome", "Firefox", "Safari", "Mobile Chrome"].map((b) => (
                    <button key={b} onClick={() => toggleB(b)} className={"rounded-lg border px-2 py-1.5 text-xs " + (brow.includes(b) ? "border-teal-500 bg-teal-900 text-teal-200" : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700")}>{b}</button>
                  ))}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="해상도"><Select value={res} onChange={(e) => setRes(e.target.value)}><option>1920×1080</option><option>1440×900</option><option>1280×720</option><option>375×812 (모바일)</option></Select></Field>
                <Field label="병렬 workers"><Select value={workers} onChange={(e) => setWorkers(e.target.value)}><option>1 (순차)</option><option>2</option><option>4</option><option>auto</option></Select></Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="재시도"><Input type="number" value={retry} onChange={(e) => setRetry(+e.target.value || 0)} /></Field>
                <Field label="종료 조건"><Select value={onfail} onChange={(e) => setOnfail(e.target.value)}><option>계속 진행</option><option>첫 에러 시 중단</option></Select></Field>
              </div>
              <div className="flex items-center gap-4">
                <Field label="영상 녹화"><Select value={video} onChange={(e) => setVideo(e.target.value)}><option>녹화 안 함</option><option>실패 시만</option><option>전체 녹화</option></Select></Field>
                <div className="flex items-center gap-2 pt-5 text-sm text-slate-300"><span>Headless</span><TG on={headless} onClick={() => setHeadless(!headless)} /></div>
              </div>
            </div>
          </div>
          <div className="mt-5 border-t border-slate-800 pt-4">
            <div className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-200"><Calendar size={15} className="text-teal-400" />실행 트리거</div>
            <div className="mb-3 flex gap-2">{["수동", "정기", "이벤트"].map((t) => (<button key={t} onClick={() => setTrig(t)} className={"rounded-lg px-3 py-1.5 text-xs font-medium " + (trig === t ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200")}>{t}</button>))}</div>
            {trig === "수동" && <div className="rounded-lg bg-slate-800 p-3 text-sm text-slate-400">자동 실행 없음 — "지금 실행"으로만 수행합니다.</div>}
            {trig === "정기" && (
              <div className="space-y-2">
                <div className="flex flex-wrap gap-2">{["매일 02:00", "평일 09:00", "1시간마다", "매주 월 09:00"].map((c) => (<button key={c} onClick={() => setCron(c)} className="rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700">{c}</button>))}</div>
                <div className="rounded-lg bg-slate-800 p-3 text-sm"><span className="text-slate-500">다음 실행 </span><span className="font-medium text-teal-300">{cron}</span> <span className="text-slate-600">· KST</span></div>
              </div>
            )}
            {trig === "이벤트" && (
              <div className="space-y-2">
                {[["commit", "커밋 / PR (GitLab)", "커밋·PR마다 회귀 자동 실행"], ["deploy", "배포(릴리스) 시", "운영 배포 직후 품질 게이트"], ["ci", "CI Webhook (Jenkins)", "파이프라인에서 트리거"]].map((e) => (
                  <label key={e[0]} className="flex cursor-pointer items-start gap-3 rounded-lg bg-slate-800 p-3 hover:bg-slate-700"><input type="checkbox" checked={ev[e[0]]} onChange={() => setEv({ ...ev, [e[0]]: !ev[e[0]] })} className="mt-0.5 accent-teal-500" /><div><div className="text-sm text-slate-200">{e[1]}</div><div className="text-xs text-slate-500">{e[2]}</div></div></label>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>
      <Toast msg={msg} />
    </div>
  );
}
