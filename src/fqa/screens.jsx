import { useState, useEffect, useRef, Fragment } from "react";
import {
  Video, Square, Globe, Play, Upload, FileText, Download, Cpu, Terminal, Bot,
  Wrench, Search, RefreshCw, Save, Copy, Plus, CheckCircle2, X, Tag, Send, ChevronLeft,
  Code2, ArrowRight, Lock, GripVertical, Layers, Calendar, Bug, Clock, History, XCircle, AlertTriangle, Image,
  LayoutDashboard, TrendingUp, Activity, Brain, ClipboardList,
  Smartphone, Sparkles, ChevronRight, ChevronDown, Server, Trash2,
} from "lucide-react";
import { ResponsiveContainer, ComposedChart, Bar, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from "recharts";
import { Card, Badge, Btn, Seg, Field, Input, Select, Toast, useToast, PageToolbar, backTo, RunTime, nowStamp } from "../common/ui.jsx";
import { ScheduleConfig } from "../common/ScheduleConfig.jsx";
import { useApp } from "../common/context.js";
import { VarRefInput } from "../common/VarRefInput.jsx";
import { DatasetPicker } from "../common/DatasetPicker.jsx";
import { STEP_ACTS, surfaceOf } from "./data.js";
/* 이벤트 트리거는 정보성(읽기전용) — 감지 방식은 대상·환경 "배포 감지"에서 정의된 값을 상속만 표시.
   기능 테스트는 '배포된 앱'을 상대로 하므로 배포 완료가 유일하게 유효한 이벤트다.
   (커밋·PR 시점엔 코드가 배포돼 있지 않아 직전 빌드를 테스트하게 된다 — 트리거로 성립하지 않음) */
const fqaEvents = (env, label) => {
  const mode = (env && (env.deploy || {}).mode) || "수동";
  const detect = mode === "배포 웹훅 알림"
    ? "배포 웹훅 알림 · 대상·환경에서 정의 (상속)"
    : mode === "수동"
    ? "수동 — 자동 감지 없음 · 이 이벤트는 발동하지 않습니다 (대상·환경에서 변경)"
    : "버전 엔드포인트 폴링 · " + ((env && (env.deploy || {}).verPath) || "$.version") + " · 대상·환경에서 정의 (상속)";
  return [
    { key: "deploy", label: "배포 시", desc: "계획의 대상·환경에 새 빌드가 배포되면 회귀를 자동 실행합니다", short: "배포",
      fields: [
        { k: "target", type: "readonly", label: "대상·환경", value: label || "계획의 대상·환경 (상속)" },
        { k: "detect", type: "readonly", label: "감지 방식", value: detect },
      ] },
  ];
};

/* ───────── primitives (lqa-demo 톤) ───────── */
const taCls = "w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 outline-none focus:border-teal-500";
const Hdr = ({ icon: Icon, title, desc }) => (
  <div className="mb-1 flex items-center gap-2">
    <Icon size={16} className="text-teal-400" /><span className="text-sm font-semibold text-slate-100">{title}</span>
    <Badge kind="teal">Web · Playwright</Badge>{desc && <span className="text-xs text-slate-500">{desc}</span>}
  </div>
);
const FQA_MEMBERS = ["QA Lead", "김QA", "이QA", "박QA", "미지정"];

/* 케이스의 최근 결과·이력·결함 수는 케이스에 저장하지 않고 실행 이력/결함에서 파생한다 */
const runsFor = (runs, id) => (runs || [])
  .filter((r) => r.status === "완료" && (r.tcs || []).some((t) => t.id === id))
  .sort((a, b) => String(b.startedAt || "").localeCompare(String(a.startedAt || "")));
const histOf = (runs, id) => runsFor(runs, id).slice(0, 4).map((r) => ((r.tcs || []).find((t) => t.id === id) || {}).v).filter(Boolean).reverse();
const lastOf = (runs, id) => { const rs = runsFor(runs, id); return rs.length ? (((rs[0].tcs || []).find((t) => t.id === id) || {}).v || "-") : "-"; };
const defectsOf = (defects, id) => (defects || []).filter((d) => d.tc === id && d.status !== "Resolved").length;
/* 케이스 구성(웹/API/혼합)은 스텝의 act에서 파생 — platform 필드 없음 */
const surfacesOf = (c) => {
  const st = (c && c.steps) || [];
  const web = st.some((s) => surfaceOf(s.act) === "web");
  const api = st.some((s) => surfaceOf(s.act) === "api");
  return web && api ? "웹+API" : api ? "API" : web ? "웹" : "-";
};
const SURF_K = { "웹+API": "teal", "API": "warn", "웹": "info" };

/* 대상·환경 선택 — 레코딩/MCP는 "촬영 스튜디오"로만 환경을 쓴다. 선택한 환경은 케이스에 저장되지 않는다. */
const envOpts = (systems) => (systems || []).flatMap((sy) => (sy.envs || []).map((e) => ({ systemId: sy.id, env: e.env, label: sy.name + " · " + e.env, webUrl: e.webUrl || "", apiUrl: e.apiUrl || "" })));
const refKey = (r) => (r ? r.systemId + "|" + r.env : "");
/* 절대 URL → 상대경로 (base·스킴·호스트 제거) — 케이스에는 상대경로만 저장된다 */
const relPath = (u, base) => {
  let s = String(u || "");
  if (base && s.indexOf(base) === 0) s = s.slice(base.length);
  s = s.replace(/^https?:\/\/[^/]+/, "");
  if (!s) return "/";
  return s.charAt(0) === "/" ? s : "/" + s;
};

/* ═══════════ 1. 레코딩 (CLI + Playwright codegen) ═══════════

   구현 전제 — 공식 CLI만 사용한다(내부 API 없음):
     1) 웹에서 세션 생성 → 명령어 발급
     2) 사용자가 터미널에서  npx @exq/cli record --session <id>
     3) CLI가 세션 정보를 받아  npx playwright codegen [플래그] <base+시작경로> -o out.spec.ts  실행
        · --load-storage  : 이전 녹화에서 저장한 로그인 상태 재사용
        · --save-storage  : 이번 로그인 상태를 로컬(~/.exq)에만 저장 — 플랫폼에 올리지 않는다
        · --viewport-size / --ignore-https-errors : 환경 설정에서 주입
     4) 브라우저에서 조작 · 툴바로 검증 추가 → 창을 닫으면 codegen 종료
     5) CLI가 out.spec.ts를 AST로 파싱 → 스텝으로 변환 → 플랫폼에 업로드
        · 로케이터 생성·고유성 보장은 Playwright가 한다 (우리가 만들지 않는다)
        · 파싱하지 못한 줄은 '코드 스텝'으로 보존 → 손실 0
     6) 웹에서 검토 후 등록

   v1 한계(정직하게 화면에 표시):
     · 실시간 스트리밍 아님 — 녹화 종료 후 일괄 수신
     · Basic Auth 미지원 (codegen에 해당 플래그가 없음)
     · Node.js 18+ 필요 · 첫 실행 시 브라우저 바이너리 다운로드                */

/* codegen 출력 파싱 결과(데모) — 실제로는 CLI가 AST 파싱해 올려준다.
   · 계정 값은 CLI가 세션의 계정 풀과 대조해 ${계정 ID}로 치환한다.
   · 비밀번호 필드(로케이터에 password 힌트)는 ${계정 비밀번호}로 치환하고 원본 값은 버린다
     → 평문 시크릿이 케이스에 남지 않는다.
   · 변환하지 못한 문장은 코드 스텝으로 원본 보존. */
const REC_CAPTURED = [
  { act: "이동", loc: "/login", val: "-" },
  { act: "입력", loc: "[data-testid=username]", val: "${계정 ID}" },
  { act: "입력", loc: "[data-testid=password]", val: "${계정 비밀번호}" },
  { act: "체크", loc: "role=checkbox[자동 로그인]", val: "체크" },
  { act: "클릭", loc: "role=button[로그인]", val: "-" },
  { act: "화면 검증", loc: "text=환영합니다", val: "visible = true" },
  { act: "코드 스텝", loc: "", val: "", code: "const page1Promise = page.waitForEvent('popup');\nawait page.getByRole('link', { name: '이용약관' }).click();\nconst page1 = await page1Promise;" },
];
const REC_VIEWPORTS = ["1920×1080", "1440×900", "1280×720", "375×812 (모바일)"];

export function FqaRecordScreen({ onDone }) {
  const { addFqaCase, fqaSuites, fqaSystems } = useApp();
  const [msg, flash] = useToast();
  const opts = envOpts(fqaSystems).filter((o) => o.webUrl);
  const [ref, setRef] = useState(opts[0] ? { systemId: opts[0].systemId, env: opts[0].env } : null);
  const cur = opts.find((o) => refKey(o) === refKey(ref)) || opts[0] || {};
  const base = cur.webUrl || "";
  const [path, setPath] = useState("/");
  /* 녹화 해상도 — 반응형 사이트는 화면 크기에 따라 DOM이 달라지므로 녹화 시점에 정해야 한다.
     케이스에는 저장하지 않는다(실행 해상도는 실행 계획이 정함). */
  const [vp, setVp] = useState(REC_VIEWPORTS[0]);
  // 스위트·TC명은 캡처 결과를 보고 등록 시점에 정한다
  const [suite, setSuite] = useState((fqaSuites[0] || {}).name || "");
  const [name, setName] = useState("");
  const [phase, setPhase] = useState("setup"); // setup | waiting | recording | done
  const [sid, setSid] = useState("");
  const [steps, setSteps] = useState([]);
  const [mode, setMode] = useState("스텝");

  /* 명령어는 서버가 조립해 발급한다 —
       · CLI 버전: 플랫폼 API 스키마에 묶이므로 @latest가 아니라 호환 버전을 박는다
       · 세션 토큰: 대상 환경 정보를 받아가고 스텝을 올리는 '사실상 인증'이므로
                    단명(10분) · 1회용 · 128bit 이상. 짧은 ID는 대입 가능해 위험하다.        */
  // npm 패키지는 @exq/cli (조직의 CLI 모듈), 전역 설치 시 명령어는 exq — @angular/cli → ng 와 같은 관례
  const CLI_VER = "1.4";
  const cmd = "npx @exq/cli@" + CLI_VER + " record --session " + sid;
  const script = steps.length ? stepsToCode(steps, { id: "TC-REC", name: name || "레코딩 TC" }) : "";

  const newToken = () => {
    const A = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    let s = ""; for (let i = 0; i < 22; i++) s += A[Math.floor(Math.random() * A.length)];
    return "s_" + s;
  };
  const startSession = () => {
    if (!base) { flash("웹 URL이 설정된 대상·환경이 없습니다"); return; }
    setSid(newToken()); setSteps([]); setPhase("waiting");
    // 목업 시뮬: 잠시 후 CLI가 붙어 브라우저가 열린 것으로 본다
    setTimeout(() => setPhase((p) => (p === "waiting" ? "recording" : p)), 2500);
  };
  const cancel = () => { setPhase("setup"); setSid(""); setSteps([]); };
  // 목업 시뮬 — 실제로는 CLI가 세션 토큰으로 스텝을 업로드하면 이 화면이 받는다
  const simulate = () => { setSteps(REC_CAPTURED); setPhase("done"); flash("스텝 " + REC_CAPTURED.length + "개 수신 (데모 시뮬)"); };
  const stK2 = { setup: ["info", "세션 없음"], waiting: ["warn", "● CLI 연결 대기"], recording: ["live", "● 녹화 중"], done: ["pass", "수신 완료"] };
  const register = () => {
    addFqaCase({ id: "TC-REC-" + Date.now().toString().slice(-4), name: name || "레코딩 TC", suite, tags: "", status: "검토중", level: "Low-Code", dataset: "-", steps });
    onDone ? onDone("레코딩 TC 검토중 등록 · 목록에 추가됨") : flash("검토중으로 등록");
  };
  return (
    <div className="space-y-4">
      <Hdr icon={Video} title="레코딩" desc="로컬 CLI + Playwright codegen · 조작 캡처 → 스텝" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 space-y-4">
          <Card className="p-4 space-y-3.5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-semibold text-slate-200">녹화 세션</span>
              <Badge kind={stK2[phase][0]}>{stK2[phase][1]}</Badge>
            </div>

            <Field label="대상 · 환경">
              <Select value={refKey(ref)} disabled={phase !== "setup"} onChange={(e) => { const o = opts.find((x) => refKey(x) === e.target.value); if (o) setRef({ systemId: o.systemId, env: o.env }); }}>
                {opts.length === 0 && <option>웹 URL이 설정된 대상 없음</option>}
                {opts.map((o) => <option key={refKey(o)} value={refKey(o)}>{o.label}</option>)}
              </Select>
            </Field>
            {/* base URL을 접두사로 붙여 전체 주소가 한눈에 읽히게 — 실제 저장은 상대경로만 */}
            <Field label="시작 경로">
              <div className="flex items-stretch overflow-hidden rounded-lg border border-slate-700 bg-slate-800 focus-within:border-teal-500">
                <span className="flex max-w-[55%] shrink-0 items-center truncate border-r border-slate-700 bg-slate-900 px-2.5 py-2 font-mono text-xs text-slate-500" title={base}>{base || "대상 없음"}</span>
                <input value={path} onChange={(e) => setPath(e.target.value)} disabled={phase !== "setup"} placeholder="/login" className="min-w-0 flex-1 bg-transparent px-2.5 py-2 font-mono text-xs text-slate-200 outline-none disabled:text-slate-500" />
              </div>
            </Field>
            {/* 반응형 사이트는 해상도에 따라 DOM이 달라진다 — 녹화 해상도를 실행 해상도와 맞추는 게 안전하다 */}
            <Field label="녹화 해상도" hint="실행 해상도와 다르면 반응형 화면에서 로케이터가 달라질 수 있습니다">
              <Select value={vp} disabled={phase !== "setup"} onChange={(e) => setVp(e.target.value)}>
                {REC_VIEWPORTS.map((v) => <option key={v}>{v}</option>)}
              </Select>
            </Field>
            {phase === "setup" ? (
              <Btn kind="primary" icon={Video} className="w-full" onClick={startSession}>녹화 세션 시작</Btn>
            ) : (
              <>
                <div className="rounded-lg border border-teal-800 bg-slate-950 p-3">
                  <div className="mb-1.5 flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-xs font-semibold text-slate-300"><Terminal size={13} className="text-teal-400" />터미널에서 실행</span>
                    <span className="text-xs text-slate-500">10분 후 만료 · 1회용</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 truncate rounded border border-slate-800 bg-slate-900 px-2.5 py-2 font-mono text-xs text-teal-200">{cmd}</div>
                    <Btn icon={Copy} onClick={() => { try { navigator.clipboard.writeText(cmd); } catch (e) {} flash("명령어를 복사했습니다"); }}>복사</Btn>
                  </div>
                </div>
                {/* 로컬 파일(로그인 상태 저장 여부)은 웹이 알 수 없다 — 상태로 표시하지 않고 동작만 설명한다 */}
                <div className="space-y-1 text-xs text-slate-500">
                  <div>· <a href="https://nodejs.org" target="_blank" rel="noreferrer" className="text-teal-400 hover:text-teal-300">Node.js</a> 18 이상이 설치되어 있어야 합니다</div>
                  <div>· 첫 실행 시 <span className="text-slate-400">Chromium</span>을 자동으로 내려받습니다 (최초 1회 · 2~3분)</div>
                  <div>· 이전 녹화에서 로그인했다면 그 상태로 열립니다. 처음이면 브라우저에서 직접 로그인하세요.</div>
                  <div>· 브라우저 툴바에서 <span className="text-slate-400">요소를 클릭</span>하면 검증 스텝을 추가할 수 있습니다.</div>
                </div>
                <Btn className="w-full" onClick={cancel}>세션 취소</Btn>
              </>
            )}
          </Card>
        </div>

        <div className="col-span-7">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5">
              <span className="text-sm font-semibold text-slate-200">캡처 결과 {steps.length > 0 && <span className="text-xs font-normal text-slate-500">스텝 {steps.length}개</span>}</span>
              <div className="flex items-center gap-2"><Seg options={["스텝", "스크립트 미리보기"]} value={mode} onChange={setMode} /><Badge kind="draft">검토중</Badge></div>
            </div>
            {steps.length === 0 ? (
              <div className="px-4 py-16 text-center text-sm text-slate-500">
                {phase === "waiting" ? (
                  <>
                    <div className="mb-1 flex items-center justify-center gap-2 text-slate-400"><RefreshCw size={14} className="animate-spin text-teal-400" />CLI 연결을 기다리는 중…</div>
                    <div className="text-xs text-slate-600">터미널에서 위 명령어를 실행하세요.</div>
                  </>
                ) : phase === "recording" ? (
                  <>
                    <div className="mb-1 flex items-center justify-center gap-2 text-red-300"><span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />브라우저에서 녹화 중…</div>
                    <div className="text-xs text-slate-600">조작을 마치고 <span className="text-slate-400">브라우저 창을 닫으면</span> 스텝이 여기에 도착합니다.</div>
                    <button onClick={simulate} className="mt-4 text-xs text-slate-600 underline decoration-dotted hover:text-slate-400">＊ 데모 — 캡처 결과 수신 시뮬레이션</button>
                  </>
                ) : "녹화 세션을 시작하세요."}
              </div>
            ) : mode === "스텝" ? (
              <div className="space-y-1 p-3">
                {steps.map((s, i) => (
                  <div key={i} className="flex items-start gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs">
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded bg-slate-800 text-slate-400">{i + 1}</span>
                    {s.act === "코드 스텝" ? (
                      <div className="min-w-0 flex-1">
                        <div className="mb-1 flex items-center gap-1.5"><span className="font-medium text-teal-300">코드 스텝</span><Badge kind="warn">파싱 불가 · 원본 보존</Badge></div>
                        <pre className="overflow-auto rounded border border-slate-800 bg-slate-900 p-2 font-mono text-teal-200">{s.code}</pre>
                      </div>
                    ) : (
                      <>
                        <span className={"w-20 shrink-0 font-medium " + (s.act.includes("검증") ? "text-amber-300" : "text-slate-200")}>{s.act}</span>
                        <span className="min-w-0 flex-1 truncate font-mono text-slate-400">{s.loc}</span>
                        <span className="shrink-0 text-slate-300">{s.val !== "-" ? s.val : ""}</span>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <pre className="m-3 overflow-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-300" style={{ fontFamily: "monospace", maxHeight: 340 }}>{script}</pre>
            )}
            {/* 스위트·TC명은 녹화 결과를 보고 정한다 — 세션 시작 시점엔 필요 없다 */}
            {steps.length > 0 && (
              <div className="flex items-end gap-3 border-t border-slate-800 px-4 py-3">
                <div className="w-44 shrink-0"><Field label="스위트"><Select value={suite} onChange={(e) => setSuite(e.target.value)}>{fqaSuites.map((x) => <option key={x.id}>{x.name}</option>)}</Select></Field></div>
                <div className="min-w-0 flex-1"><Field label="TC 이름"><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="예: 로그인 정상 동작" /></Field></div>
                <Btn icon={Video} onClick={startSession}>다시 녹화</Btn>
                <Btn kind="primary" icon={Plus} onClick={register}>검토중으로 등록</Btn>
              </div>
            )}
          </Card>
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
export function FqaExcelScreen({ onDone }) {
  const { addFqaCase, fqaSuites } = useApp();
  const [msg, flash] = useToast();
  const [rows, setRows] = useState([]);
  const [fname, setFname] = useState("");
  const [suite, setSuite] = useState("로그인 / 인증");
  const tmpl = () => {
    const csv = "TC명,시나리오,스텝 수,태그\n로그인 정상 동작,유효 계정 로그인 성공,5,smoke|login\n";
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" })); a.download = "기능TC_양식.csv"; a.click();
  };
  const onFile = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; setFname(f.name); setRows(XL_SAMPLE); };
  return (
    <div className="space-y-4">
      <Hdr icon={FileText} title="엑셀 업로드 (기존 TC 가져오기)" desc="엑셀로 관리하던 기능 TC 명세를 일괄 이관" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-200">1. 양식 받기</span><Btn icon={Download} onClick={tmpl}>샘플 양식</Btn></div>
            <div className="text-xs text-slate-500">열: TC명 · 시나리오 · 스텝 수 · 태그 (.xlsx / .xls / .csv)</div>
          </Card>
          <Card className="p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-200">2. 파일 업로드</div>
            <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-800 px-3 py-7 text-sm text-slate-400 hover:border-slate-600">
              <Upload size={20} className="text-slate-500" />파일을 드래그하거나 클릭해서 선택
              <span className="text-xs text-slate-600">.xlsx / .xls / .csv · 최대 10MB</span>
              <input type="file" accept=".xlsx,.xls,.csv" className="hidden" onChange={onFile} />
            </label>
            {fname && <div className="text-xs text-teal-400">{fname} · {rows.length}건 인식</div>}
            <Field label="스위트" hint="가져온 TC가 배치될 스위트"><Select value={suite} onChange={(e) => setSuite(e.target.value)}>{fqaSuites.map((x) => <option key={x.id} value={x.name}>{x.name}</option>)}</Select></Field>
          </Card>
        </div>
        <div className="col-span-7">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5"><span className="text-sm font-semibold text-slate-200">파싱된 TC 미리보기</span><Badge kind="draft">검토중</Badge></div>
            {rows.length === 0 ? (
              <div className="px-4 py-16 text-center text-sm text-slate-500">엑셀을 업로드하면 파싱된 TC 목록이 표시됩니다.</div>
            ) : (
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-800 text-left text-slate-500"><th className="px-4 py-2 font-medium">TC명</th><th className="font-medium">시나리오</th><th className="font-medium">스텝 수</th><th className="font-medium">태그</th></tr></thead>
                <tbody>
                  {rows.map((r, i) => (
                    <tr key={i} className="border-b border-slate-800 text-slate-300"><td className="px-4 py-2.5 text-slate-200">{r.name}</td><td className="max-w-xs truncate text-slate-400">{r.scn}</td><td>{r.steps}</td><td className="text-xs text-slate-500">{r.tags}</td></tr>
                  ))}
                </tbody>
              </table>
            )}
            <div className="flex justify-end gap-2 border-t border-slate-800 px-4 py-3"><Btn kind="primary" icon={Plus} disabled={!rows.length} onClick={() => { rows.forEach((r, i) => addFqaCase({ id: "TC-XL-" + Date.now().toString().slice(-4) + "-" + i, name: r.name, suite, tags: r.tags, status: "검토중", level: "Low-Code", dataset: "-", steps: [] })); const n = rows.length; (onDone ? onDone(n + "건 검토중 등록 · 목록에 추가됨") : flash(n + "건 검토중으로 등록")); }}>검토중으로 등록</Btn></div>
          </Card>
          <div className="mt-2 text-xs text-slate-500">엑셀로 관리하던 기존 TC 명세를 가져옵니다. 등록된 TC는 실행 스텝이 없어 <span className="text-amber-300">에디터·레코딩으로 자동화</span>가 필요하며, <span className="text-amber-300">검토중</span>으로 등록됩니다.</div>
        </div>
      </div>
      <Toast msg={msg} />
    </div>
  );
}

/* ═══════════ 3. MCP 탐색 ═══════════ */
const MCP_TOOLS = ["browser_navigate — URL 이동", "browser_click — 클릭", "browser_fill — 필드 입력", "browser_snapshot — 접근성 스냅샷", "browser_screenshot — 스크린샷"];
export function FqaMcpScreen({ onDone }) {
  const { addFqaCase, runnerConnected, setRunnerConnected, fqaSuites, fqaSystems } = useApp();
  const [msg, flash] = useToast();
  const opts = envOpts(fqaSystems).filter((o) => o.webUrl);
  const [ref, setRef] = useState(opts[0] ? { systemId: opts[0].systemId, env: opts[0].env } : null);
  const cur = opts.find((o) => refKey(o) === refKey(ref)) || opts[0] || {};
  const base = cur.webUrl || "";
  const [live, setLive] = useState(false);
  const [mode, setMode] = useState("AI 명령");
  const [cmd, setCmd] = useState("로그인 페이지로 이동해서 유효 계정으로 로그인하고 결과를 확인해줘");
  const [log, setLog] = useState([]);
  const [tool, setTool] = useState(MCP_TOOLS[0]);
  const [args, setArgs] = useState('{ "url": "/login" }');
  const [suite, setSuite] = useState("로그인 / 인증");
  const [name, setName] = useState("MCP 탐색 시나리오");
  const start = () => { if (!base) { flash("웹 URL이 설정된 대상·환경이 없습니다"); return; } setLive(true); setLog([{ t: "session", v: "세션 시작 · " + cur.label }]); };
  const run = () => {
    if (!live) { flash("먼저 세션을 시작하세요"); return; }
    setLog((l) => [...l, { t: "navigate", v: "/login" }, { t: "fill", v: "#username, #password" }, { t: "click", v: "button[로그인]" }, { t: "snapshot", v: "로그인 성공 확인" }]);
  };
  const presets = [[Lock, "로그인 자동화"], [Search, "검색 자동화"], [CheckCircle2, "에러 여부 확인"], [Globe, "페이지 분석"]];
  return (
    <div className="space-y-4">
      <Hdr icon={Cpu} title="MCP 에이전트 탐색적 생성" desc="에이전트가 앱을 탐색하며 TC 발굴" />
      <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs text-slate-400">사용 가이드: ① 탐색 환경 선택 → ② 세션 시작 → ③ AI 명령 또는 직접 호출 → ④ 케이스로 등록 · <span className="text-slate-500">탐색은 eX.Q 로컬 러너(개인 PC)에서 실행됩니다</span></div>
      <div className="flex flex-wrap gap-2">{presets.map(([Ic, label]) => <button key={label} onClick={() => setCmd(label + " 시나리오 생성")} className="inline-flex items-center gap-1.5 rounded-full border border-slate-700 bg-slate-800 px-3 py-1 text-xs text-slate-300 hover:bg-slate-700"><Ic size={13} />{label}</button>)}</div>
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 space-y-4">
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-200">세션</span>{live ? <Badge kind="live">● LIVE</Badge> : <Badge kind="info">비활성</Badge>}</div>
            <div className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-xs"><span className="flex items-center gap-1.5 text-slate-300"><Terminal size={13} className="text-teal-400" />eX.Q 로컬 러너 {runnerConnected ? <Badge kind="pass">연결됨</Badge> : <Badge kind="draft">미연결</Badge>}</span><button onClick={() => setRunnerConnected(!runnerConnected)} className="text-teal-400">{runnerConnected ? "연결 해제" : "연결"}</button></div>
            <Field label="탐색 환경" hint="접속처 · 로그인 상태·계정을 이 환경에서 가져옵니다">
              <Select value={refKey(ref)} onChange={(e) => { const o = opts.find((x) => refKey(x) === e.target.value); if (o) setRef({ systemId: o.systemId, env: o.env }); }}>
                {opts.length === 0 && <option>웹 URL이 설정된 대상 없음</option>}
                {opts.map((o) => <option key={refKey(o)} value={refKey(o)}>{o.label}</option>)}
              </Select>
            </Field>
            <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-500">base <span className="font-mono text-slate-300">{base || "-"}</span> · 탐색 경로는 <span className="text-teal-400">상대경로</span>로 저장됩니다.</div>
            {!live ? <Btn kind="primary" icon={Play} className="w-full" onClick={start}>세션 시작</Btn> : <Btn icon={Square} className="w-full" onClick={() => { setLive(false); setLog([]); }}>세션 종료</Btn>}
          </Card>
          <Card className="p-4 space-y-3">
            <div className="flex gap-1.5">{[["AI 명령", Bot], ["직접 호출", Wrench]].map(([m, Ic]) => <button key={m} onClick={() => setMode(m)} className={"flex flex-1 items-center justify-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium " + (mode === m ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200")}><Ic size={13} />{m}</button>)}</div>
            {mode === "AI 명령" ? (
              <>
                <Field label="명령 입력"><textarea value={cmd} onChange={(e) => setCmd(e.target.value)} rows={3} className={taCls} /></Field>
                <Btn kind="primary" icon={Send} className="w-full" onClick={run}>명령 실행</Btn>
              </>
            ) : (
              <>
                <Field label="도구 선택"><Select value={tool} onChange={(e) => setTool(e.target.value)}>{MCP_TOOLS.map((t) => <option key={t}>{t}</option>)}</Select></Field>
                <Field label="인수 (JSON)"><textarea value={args} onChange={(e) => setArgs(e.target.value)} rows={2} className={taCls} /></Field>
                <Btn kind="primary" icon={Wrench} className="w-full" onClick={run}>도구 실행</Btn>
              </>
            )}
          </Card>
        </div>
        <div className="col-span-7 space-y-4">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5"><span className="flex items-center gap-1.5 text-sm font-semibold text-slate-200"><Image size={14} className="text-teal-400" />브라우저 화면</span>{live && <Badge kind="live">● LIVE</Badge>}</div>
            <div className="flex h-44 items-center justify-center bg-slate-950 text-sm text-slate-600">{live ? base : "세션을 시작하면 화면이 표시됩니다"}</div>
          </Card>
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-2.5"><span className="flex items-center gap-1.5 text-sm font-semibold text-slate-200"><ClipboardList size={14} className="text-teal-400" />액션 로그</span><button onClick={() => setLog([])} className="text-xs text-slate-500 hover:text-slate-300">초기화</button></div>
            <div className="overflow-y-auto p-3" style={{ maxHeight: 240 }}>
              {log.length === 0 ? <div className="py-10 text-center text-xs text-slate-600">세션을 시작하면 액션 로그가 표시됩니다.</div> : (
                <ol className="space-y-1">{log.map((s, i) => (<li key={i} className="flex items-center gap-2 text-xs"><span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-slate-400">{i + 1}</span><span className={"font-medium " + (s.t === "snapshot" ? "text-amber-300" : "text-teal-300")}>{s.t}</span><span className="font-mono text-slate-400">{s.v}</span></li>))}</ol>
              )}
            </div>
            <div className="space-y-2 border-t border-slate-800 px-4 py-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="스위트"><Select value={suite} onChange={(e) => setSuite(e.target.value)}>{fqaSuites.map((x) => <option key={x.id}>{x.name}</option>)}</Select></Field>
                <Field label="TC 이름"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-500">액션 {Math.max(0, log.length - 1)}개 · Low-Code(편집 가능)로 등록</span>
                <Btn kind="primary" icon={Plus} disabled={log.length < 2} onClick={() => { addFqaCase({ id: "TC-MCP-" + Date.now().toString().slice(-4), name: name || "MCP 탐색 시나리오", suite, tags: "", status: "검토중", level: "Low-Code", dataset: "-", steps: mcpToSteps(log, base) }); onDone ? onDone("MCP 시나리오 검토중 등록 · 목록에 추가됨") : flash("검토중으로 등록"); }}>검토중으로 등록</Btn>
              </div>
            </div>
          </Card>
        </div>
      </div>
      <Toast msg={msg} />
    </div>
  );
}


/* ═══════════ 4. 테스트 에디터 (3-Mode 단방향) ═══════════ */
const LV = ["Low-Code", "Full-Code"];
const ROLE = { "Low-Code": "QA 엔지니어", "Full-Code": "개발자" };
/* 스텝의 val 칸 placeholder — 액션마다 넣을 값이 다르다 */
const VAL_PH = {
  "이동": "-",
  "입력": '"qa_user01"',
  "클릭": "-",
  "선택": '"premium"',
  "체크": "체크 / 해제",
  "키 입력": "Enter",
  "화면 검증": 'text = "…" / visible = true',
};
const E_STEPS = [
  { act: "이동", loc: "/signup", val: "-" },
  { act: "입력", loc: "[data-testid=email]", val: '"invalid-email"' },
  { act: "클릭", loc: "role=button[다음]", val: "-" },
  { act: "화면 검증", loc: "[data-testid=error]", val: 'text = "올바른 이메일 형식이 아닙니다"' },
];
// 스텝 액션 카탈로그는 data.js가 단일 출처 — act가 접점(web/api)을 결정한다
// 로케이터 문자열 → Playwright 로케이터 표현
function _loc(loc) {
  let m;
  if ((m = loc.match(/\[data-testid=([^\]]+)\]/))) return "getByTestId('" + m[1] + "')";
  if ((m = loc.match(/role=(\w+)\[([^\]]+)\]/))) return "getByRole('" + m[1] + "', { name: '" + m[2] + "' })";
  if ((m = loc.match(/^text=(.+)$/))) return "getByText('" + m[1] + "')";
  if ((m = loc.match(/\[name=([^\]]+)\]/))) return "locator('[name=" + m[1] + "]')";
  return "locator('" + loc + "')";
}
// MCP 탐색 로그({t,v}) → 편집 스텝
function mcpToSteps(log, base) {
  const out = [];
  (log || []).forEach((s) => {
    if (s.t === "session") return;
    if (s.t === "navigate") out.push({ act: "이동", loc: relPath(s.v, base), val: "-" });
    else if (s.t === "fill") String(s.v).split(",").map((x) => x.trim()).forEach((loc) => out.push({ act: "입력", loc, val: '"qa_user01"' }));
    else if (s.t === "click") out.push({ act: "클릭", loc: s.v, val: "-" });
    else if (s.t === "snapshot") out.push({ act: "화면 검증", loc: "[data-testid=home]", val: "visible = true" });
  });
  return out;
}
// AI 생성 행 → 대표 스텝(로그인 계열 템플릿)
function aiSteps() {
  return [
    { act: "이동", loc: "/login", val: "-" },
    { act: "입력", loc: "[data-testid=userid]", val: "${계정 ID}" },
    { act: "입력", loc: "[data-testid=password]", val: "${계정 비밀번호}" },
    { act: "클릭", loc: "role=button[로그인]", val: "-" },
    { act: "화면 검증", loc: "[data-testid=result]", val: "visible = true" },
  ];
}
// 스텝 기반 단건 실행 시뮬(결정적) — 케이스 성향 반영(호출부에서 lastVerdict 주입)
function simRun(steps, tc, lastVerdict) {
  const willFail = lastVerdict === "FAIL";
  const st = (steps || []).map((s, i) => ({ ...s, ok: true }));
  let failIdx = -1;
  if (willFail && st.length) { st.forEach((s, i) => { if (s.act.includes("검증")) failIdx = i; }); if (failIdx < 0) failIdx = st.length - 1; st[failIdx].ok = false; }
  return { verdict: willFail ? "FAIL" : "PASS", steps: st, failIdx };
}
// "$.a.b" → "['a']['b']"
const _jp = (p) => String(p || "").replace(/^\$\.?/, "").split(".").filter(Boolean).map((k) => "['" + k + "']").join("");
// 스텝의 save 이름들 — 이건 진짜 JS const가 되므로 ${orderId} 그대로 둔다
const _saved = (steps) => new Set((steps || []).flatMap((s) => String(s.save || "").split(",").map((x) => x.split("=")[0].trim()).filter(Boolean)));
/* 템플릿 문자열.
   ${...}는 두 종류다 —
     · save로 만든 변수(orderId) · 데이터셋 행(row.x) → 진짜 JS 식별자이므로 그대로
     · 계정·공통 변수(계정 ID 등)   → 공백이 들어가 JS 식별자가 될 수 없다 → V['계정 ID']로 치환 */
const _tpl = (v, saved) => {
  const raw = String(v == null ? "" : v).replace(/^"|"$/g, "").replace(/`/g, "\\`");
  const s = raw.replace(/\$\{([^}]+)\}/g, (m0, k) => {
    const key = k.trim();
    if (key.startsWith("row.") || (saved && saved.has(key))) return "${" + key + "}";
    return "${V['" + key + "']}";
  });
  return "`" + s + "`";
};
/* 요청 본문(JSON)의 "${...}" 는 큰따옴표 문자열이라 JS가 치환하지 않는다 → 백틱 템플릿으로 바꾼다.
   { "name": "${row.name}" }  →  { "name": `${row.name}` } */
const _bodyJs = (b, saved) => String(b || "").trim().replace(/"([^"]*\$\{[^"]*)"/g, (m0, inner) => _tpl(inner, saved));
// "Key: Value" 줄들 → Playwright headers 옵션 (인증 헤더 AUTH를 항상 앞에 펼침 — API 호출에만 부착)
const _hdrs = (h, saved) => {
  const ls = String(h || "").split("\n").map((x) => x.trim()).filter(Boolean);
  const extra = ls.map((l) => { const i = l.indexOf(":"); const k = i < 0 ? l : l.slice(0, i).trim(); const v = i < 0 ? "" : l.slice(i + 1).trim(); return "'" + k + "': " + _tpl(v, saved); });
  return "headers: { ...AUTH" + (extra.length ? ", " + extra.join(", ") : "") + " }";
};
/* 스텝 → Full-Code Playwright (TypeScript)
   주입 계약 (러너가 환경에서 채운다):
     baseURL   = 환경 webUrl   → page.goto('/login')이 웹 호스트로
     API_BASE  = 환경 apiUrl   → page.request는 컨텍스트 baseURL(=웹)을 쓰므로 API는 절대 URL로 만들어야 한다
     AUTH      = 환경 apiAuth 헤더 → API 호출에만 부착(웹 오리진으로 토큰이 새지 않도록)
     V         = 계정·공통 변수 맵 (${계정 ID} 등 공백 포함 이름 대응)
   API 요청은 page.request를 쓴다 — 웹 세션의 쿠키를 공유하므로 웹→API 흐름이 이어진다. */
function stepsToCode(steps, tc) {
  const id = (tc && tc.id) || "TC-000";
  const name = (tc && tc.name) || "테스트";
  const hasApi = (steps || []).some((s) => surfaceOf(s.act) === "api");
  const saved = _saved(steps);
  const T = (v) => _tpl(v, saved);
  const body = (steps || []).map((s) => {
    if (s.act === "코드 스텝") return (s.code || "").split("\n").map((ln) => "  " + ln).join("\n");
    if (s.act === "이동") return "  await page.goto(" + T(s.loc || "/") + ");";
    if (s.act === "입력") return "  await page." + _loc(s.loc) + ".fill(" + T(s.val) + ");";
    if (s.act === "클릭") return "  await page." + _loc(s.loc) + ".click();";
    if (s.act === "선택") return "  await page." + _loc(s.loc) + ".selectOption(" + T(s.val) + ");";
    if (s.act === "체크") return "  await page." + _loc(s.loc) + (/해제|uncheck|false/i.test(s.val || "") ? ".uncheck();" : ".check();");
    if (s.act === "키 입력") return "  await page." + _loc(s.loc) + ".press(" + T(s.val || "Enter") + ");";
    if (s.act === "화면 검증") {
      const v = s.val || "";
      let m;
      if ((m = v.match(/visible\s*=\s*(true|false)/i))) return "  await expect(page." + _loc(s.loc) + (m[1].toLowerCase() === "true" ? ").toBeVisible();" : ").toBeHidden();");
      if ((m = v.match(/checked\s*=\s*(true|false)/i))) return "  await expect(page." + _loc(s.loc) + (m[1].toLowerCase() === "true" ? ").toBeChecked();" : ").not.toBeChecked();");
      if ((m = v.match(/enabled\s*=\s*(true|false)/i))) return "  await expect(page." + _loc(s.loc) + (m[1].toLowerCase() === "true" ? ").toBeEnabled();" : ").toBeDisabled();");
      if ((m = v.match(/count\s*>=\s*(\d+)/i))) return "  expect(await page." + _loc(s.loc) + ".count()).toBeGreaterThanOrEqual(" + m[1] + ");";
      if ((m = v.match(/value\s*=\s*"([^"]*)"/i))) return "  await expect(page." + _loc(s.loc) + ").toHaveValue(" + T(m[1]) + ");";
      m = v.match(/"([^"]*)"/);
      return "  await expect(page." + _loc(s.loc) + ").toHaveText(" + T(m ? m[1] : v) + ");";
    }
    if (s.act === "요청") {
      const p = String(s.loc || "GET /").trim().split(/\s+/);
      const mth = (p[0] || "GET").toLowerCase();
      const path = p[1] || "/";
      const o = [_hdrs(s.headers, saved)];
      if (s.body && s.body.trim()) o.unshift("data: " + _bodyJs(s.body, saved));
      const out = [
        "  res = await page.request." + mth + "(API_BASE + " + T(path) + ", { " + o.join(", ") + " });",
        "  body = await res.json().catch(() => ({}));",
      ];
      String(s.save || "").split(",").map((x) => x.trim()).filter(Boolean).forEach((sv) => {
        const [nm, pth] = sv.split("=").map((x) => x.trim());
        if (nm && pth) out.push("  const " + nm + " = body" + _jp(pth) + ";");
      });
      return out.join("\n");
    }
    if (s.act === "응답 검증") {
      if (/상태|status/i.test(s.loc || "")) return "  expect(res.status()).toBe(" + (parseInt(s.val, 10) || 200) + ");";
      const path = _jp(s.loc);
      if (/존재|exist/i.test(s.val || "")) return "  expect(body" + path + ").toBeDefined();";
      const m = (s.val || "").match(/"([^"]*)"/);
      return "  expect(body" + path + ").toBe(" + T(m ? m[1] : s.val) + ");";
    }
    return "  // " + s.act;
  }).join("\n");
  const usesRow = /\$\{row\./.test(JSON.stringify(steps || []));
  const ds = tc && tc.dataset && tc.dataset !== "-" ? tc.dataset : "";
  const head = [
    "import { test, expect } from '@playwright/test';",
    "",
    "// 실행 계획의 대상·환경에서 러너가 주입 — 케이스는 환경을 모른다",
    "const V = JSON.parse(process.env.EXQ_VARS || '{}');        // 계정·공통 변수",
    hasApi ? "const API_BASE = process.env.EXQ_API_BASE || '';           // 환경 apiUrl" : "",
    hasApi ? "const AUTH = JSON.parse(process.env.EXQ_API_AUTH || '{}');  // API 인증 헤더 (API 호출에만)" : "",
    (ds || usesRow) ? "const rows = JSON.parse(process.env.EXQ_ROWS || '[]');      // 데이터셋 " + (ds || "행") : "",
    "",
  ].filter((l) => l !== "").join("\n");
  const pre = hasApi ? "  let res: any, body: any;\n" : "";
  if (ds || usesRow) {
    return head + "\nfor (const row of rows) {\n  test(`" + id + " " + name + " [${row.__i}]`, async ({ page }) => {\n  " + pre.replace(/^ {2}/, "  ") + body.split("\n").map((l) => "  " + l).join("\n") + "\n  });\n}";
  }
  return head + "\ntest('" + id + " " + name + "', async ({ page }) => {\n" + pre + body + "\n});";
}


/* ═══════════ API 스펙 임포트 (OpenAPI · Postman · 파일/URL) ═══════════ */
const M_K = { GET: "info", POST: "pass", PUT: "warn", DELETE: "fail", PATCH: "warn", HEAD: "info", OPTIONS: "info" };

// 데모용 번들 샘플 — URL 임포트 시뮬용. 실제 제품은 서버/러너가 스펙 URL을 가져옴.
const SAMPLE_OPENAPI = {
  openapi: "3.0.1", info: { title: "T월드 API", version: "1.2.0" },
  paths: {
    "/v1/users/{id}": { get: { summary: "사용자 조회", responses: { "200": {}, "404": {} } }, put: { summary: "사용자 수정", responses: { "200": {}, "400": {} } }, delete: { summary: "사용자 삭제", responses: { "204": {} } } },
    "/v1/users": { post: { summary: "사용자 생성", responses: { "201": {}, "409": {} } } },
    "/v1/plans": { get: { summary: "요금제 목록", responses: { "200": {} } } },
    "/v1/plans/{id}/subscribe": { post: { summary: "요금제 가입", responses: { "200": {}, "402": {} } } },
    "/v1/auth/login": { post: { summary: "로그인 토큰 발급", responses: { "200": {}, "401": {} } } },
    "/v1/auth/refresh": { post: { summary: "토큰 갱신", responses: { "200": {}, "401": {} } } },
  },
};

// ── 미니 파서: 무거운 의존성 없이 공통 엔드포인트 IR로 정규화 ──
function detectSpec(obj) {
  if (!obj || typeof obj !== "object") return null;
  if (obj.openapi || obj.swagger) return "OpenAPI";
  if ((obj.info && obj.info._postman_id) || Array.isArray(obj.item)) return "Postman";
  return null;
}
function parseOpenApi(spec) {
  const METHODS = ["get", "post", "put", "delete", "patch", "head", "options"];
  const paths = spec.paths || {};
  const out = [];
  Object.keys(paths).forEach((p) => {
    const item = paths[p] || {};
    METHODS.forEach((m) => {
      const op = item[m];
      if (!op || typeof op !== "object") return;
      const codes = Object.keys(op.responses || {});
      const ok = codes.find((c) => /^2\d\d$/.test(c)) || codes[0] || "200";
      out.push({ m: m.toUpperCase(), path: p, name: op.summary || op.operationId || (m.toUpperCase() + " " + p), status: ok, asrt: ok + " · 스키마", src: "OpenAPI", script: false });
    });
  });
  return out;
}
function parsePostman(col) {
  const out = [];
  const walk = (items) => (items || []).forEach((it) => {
    if (Array.isArray(it.item)) { walk(it.item); return; }
    if (!it.request) return;
    const req = typeof it.request === "string" ? { method: "GET", url: it.request } : it.request;
    let path = "";
    const url = req.url;
    if (typeof url === "string") path = url;
    else if (url && Array.isArray(url.path)) path = "/" + url.path.join("/");
    else if (url && url.raw) path = url.raw;
    const hasTest = Array.isArray(it.event) && it.event.some((e) => e.listen === "test");
    const resp = Array.isArray(it.response) && it.response[0];
    const status = resp && resp.code ? String(resp.code) : "200";
    out.push({ m: String(req.method || "GET").toUpperCase(), path: path || "/", name: it.name || (req.method + " " + path), status, asrt: status + (hasTest ? " · 스크립트" : " · 예시"), src: "Postman", script: hasTest });
  });
  walk(col.item);
  return out;
}
// 스펙 엔드포인트 → 요청/응답 검증 스텝. 인증 헤더는 환경에서 주입되므로 넣지 않는다.
const apiSteps = (ep) => {
  const write = ["POST", "PUT", "PATCH"].includes(ep.m);
  const steps = [
    { act: "요청", loc: ep.m + " " + ep.path, val: "-", body: write ? "{ }" : "", headers: "", save: "" },
    { act: "응답 검증", loc: "상태코드", val: String(ep.status || "200") },
  ];
  if (ep.src === "Postman" && ep.script) steps.push({ act: "코드 스텝", loc: "", val: "", code: "// 기존 Postman 테스트 스크립트 — 수동 이관 필요" });
  return steps;
};
export function FqaApiImportScreen({ onDone }) {
  const { addFqaCase, fqaSuites } = useApp();
  const [msg, flash] = useToast();
  // 스펙은 케이스 생성의 '계약 소스'일 뿐 — 저장하지 않는다. 대상 바인딩은 실행 계획에서 한다.
  const apiSuites = fqaSuites || [];
  const [specUrl, setSpecUrl] = useState("https://api-stg.tworld.co.kr/openapi.json");
  const [suite, setSuite] = useState((apiSuites[0] && apiSuites[0].name) || "API 연동");
  const [mode, setMode] = useState("파일 업로드");
  const [phase, setPhase] = useState("idle");
  const [rows, setRows] = useState([]);
  const [picked, setPicked] = useState(new Set());
  const [fmt, setFmt] = useState(null);
  const [fileName, setFileName] = useState("");
  const [err, setErr] = useState("");
  const key = (r) => r.m + r.path;
  const onFile = (file) => {
    if (!file) return;
    const rd = new FileReader();
    rd.onload = () => {
      let obj;
      try { obj = JSON.parse(rd.result); }
      catch (e) { setErr("JSON 파싱 실패 — 데모는 JSON 스펙(openapi.json · postman_collection.json)을 지원합니다. YAML은 JSON으로 변환 후 업로드하세요."); setRows([]); setFmt(null); setFileName(file.name); setPhase("done"); return; }
      const f = detectSpec(obj);
      if (!f) { setErr("형식 인식 실패 — OpenAPI(openapi/swagger 키) 또는 Postman Collection(item)이어야 합니다."); setRows([]); setFmt(null); setFileName(file.name); setPhase("done"); return; }
      const parsed = f === "OpenAPI" ? parseOpenApi(obj) : parsePostman(obj);
      setErr(parsed.length ? "" : "엔드포인트를 찾지 못했습니다 — 스펙 내용을 확인하세요."); setFmt(f); setRows(parsed); setPicked(new Set()); setFileName(file.name); setPhase("done");
    };
    rd.readAsText(file);
  };
  const loadUrl = () => { setPhase("running"); setErr(""); setFileName(""); setTimeout(() => { setFmt("OpenAPI"); setRows(parseOpenApi(SAMPLE_OPENAPI)); setPicked(new Set()); setPhase("done"); }, 600); };
  const toggle = (k) => setPicked((pv) => { const n = new Set(pv); n.has(k) ? n.delete(k) : n.add(k); return n; });
  const commit = () => { if (!picked.size) { flash("엔드포인트를 선택하세요"); return; } const sel = rows.filter((r) => picked.has(key(r))); sel.forEach((ep, i) => addFqaCase({ id: "TC-API-" + Date.now().toString().slice(-4) + "-" + i, name: ep.name, suite, tags: "api," + (ep.src === "Postman" ? "postman" : "openapi"), status: "검토중", level: "Low-Code", dataset: "-", steps: apiSteps(ep) })); if (onDone) onDone(sel.length + "건 API 케이스 검토중 등록 · 목록에 추가됨"); };
  return (
    <>
      <Hdr icon={FileText} title="스펙 임포트 (API 테스트 생성)" desc="OpenAPI · Postman → 엔드포인트별 요청·검증 케이스 골격" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-5 space-y-4">
          <Card className="p-4 space-y-3">
            <Seg options={["파일 업로드", "URL 임포트"]} value={mode} onChange={(v) => { setMode(v); setErr(""); }} />
            {mode === "파일 업로드" ? (
              <>
                <label className="flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-slate-700 bg-slate-900 px-4 py-6 text-center hover:border-teal-600 hover:bg-slate-800">
                  <Upload size={20} className="text-teal-400" />
                  <span className="text-sm text-slate-300">스펙 파일 선택</span>
                  <span className="text-xs text-slate-500">openapi.json · swagger.json · postman_collection.json</span>
                  <input type="file" accept=".json,.yaml,.yml" className="hidden" onChange={(e) => onFile(e.target.files && e.target.files[0])} />
                </label>
                {fileName && !err && <div className="flex items-center gap-2 text-xs text-emerald-300"><CheckCircle2 size={13} />{fileName} · 형식 {fmt} · {rows.length}개 감지</div>}
              </>
            ) : (
              <>
                <Field label="스펙 URL" hint="생성 근거용 계약 스펙 · 실제 호스트는 실행 계획의 대상·환경에서 주입"><Input value={specUrl} onChange={(e) => setSpecUrl(e.target.value)} /></Field>
                <Btn kind="primary" icon={RefreshCw} className="w-full" onClick={loadUrl}>{phase === "running" ? "불러오는 중…" : "스펙 불러오기"}</Btn>
                <div className="rounded-lg border border-amber-800 bg-amber-950 p-3 text-xs text-amber-300">브라우저 직접 fetch는 CORS·인증 제한 — 데모는 번들 샘플 스펙으로 시뮬합니다. 실제 제품은 <span className="text-amber-200">서버/러너</span>가 스펙 URL을 가져옵니다.</div>
              </>
            )}
            <Field label="등록 스위트"><Select value={suite} onChange={(e) => setSuite(e.target.value)}>{apiSuites.map((x) => <option key={x.id}>{x.name}</option>)}{apiSuites.length === 0 && <option>API 연동</option>}</Select></Field>
            {err && <div className="rounded-lg border border-red-900 bg-red-950 p-3 text-xs text-red-300">{err}</div>}
            <div className="rounded-lg bg-slate-800 p-3 text-xs text-slate-400">스펙에서 엔드포인트를 읽어 <span className="text-slate-300">요청+검증</span> 케이스 골격을 만듭니다. 등록 후 에디터에서 파라미터·검증을 보강합니다.</div>
          </Card>
        </div>
        <div className="col-span-7">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><div className="flex items-center gap-2 text-sm font-semibold text-slate-200">감지된 엔드포인트{fmt && phase === "done" && <Badge kind={fmt === "Postman" ? "active" : "info"}>{fmt}</Badge>}</div>{phase === "done" && rows.length > 0 && <span className="text-xs text-slate-400">{rows.length}개 · 선택 {picked.size}</span>}</div>
            {phase !== "done" || rows.length === 0 ? (
              <div className="px-4 py-16 text-center text-sm text-slate-500">{phase === "running" ? "스펙을 분석하는 중…" : mode === "파일 업로드" ? "스펙 파일을 선택하세요" : "스펙 URL을 확인하고 \"스펙 불러오기\"를 누르세요"}</div>
            ) : (
              <>
                <div className="border-b border-slate-800 bg-slate-900 px-4 py-2"><button onClick={() => setPicked(picked.size === rows.length ? new Set() : new Set(rows.map((r) => r.m + r.path)))} className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300 hover:bg-slate-700">{picked.size === rows.length ? "전체 해제" : "전체 선택"}</button></div>
                <div className="overflow-y-auto" style={{ maxHeight: 360 }}>
                  {rows.map((r) => { const k = r.m + r.path; return (
                    <div key={k} onClick={() => toggle(k)} className="flex cursor-pointer items-center gap-3 border-b border-slate-800 px-4 py-2.5 hover:bg-slate-800">
                      <input type="checkbox" checked={picked.has(k)} onChange={() => toggle(k)} className="accent-teal-500" />
                      <Badge kind={M_K[r.m] || "info"}>{r.m}</Badge>
                      <span className="font-mono text-xs text-slate-300">{r.path}</span>
                      <span className="flex-1 text-sm text-slate-200">{r.name}</span>
                      {r.script && <span className="rounded bg-amber-900 px-1.5 py-0.5 text-xs text-amber-300">script</span>}
                      <span className="text-xs text-slate-500">{r.asrt}</span>
                    </div>
                  ); })}
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-4 py-3"><Btn kind="primary" icon={Plus} disabled={!picked.size} onClick={commit}>검토중으로 등록</Btn></div>
              </>
            )}
          </Card>
          <div className="mt-2 text-xs text-slate-500">생성된 API 케이스는 <span className="text-amber-300">검토중</span>으로 등록되며, 스텝은 요청/검증 구조입니다. 이후 에디터에서 보강합니다.</div>
        </div>
      </div>
      <Toast msg={msg} />
    </>
  );
}
export function FqaEditorScreen({ entry = "Low-Code", tc, onDirty }) {
  const { updateFqaCase, commitFqaCase, addFqaCase, fqaSuites, fqaCases, fqaRuns, fqaSystems, runnerConnected, datasets } = useApp();
  const tcOf = (name) => fqaCases.filter((c) => c.suite === name).length;
  const [msg, flash] = useToast();
  const [status, setStatus] = useState(tc && tc.status ? tc.status : "검토중");
  const stEK = { "승인": "pass", "검토중": "warn", "초안": "draft" };
  const [qa, setQa] = useState(null);
  const [runRes, setRunRes] = useState(null);
  const ei = Math.max(0, LV.indexOf(entry));
  const [committed, setCommitted] = useState(ei);
  const [view, setView] = useState(entry);
  const initSteps = (tc && tc.steps && tc.steps.length) ? tc.steps : E_STEPS;
  const [steps, setSteps] = useState(initSteps);
  // Full-Code 코드는 케이스에 저장된다. 없으면 스텝에서 생성한 것을 초기값으로.
  const initCode = (tc && tc.code) || stepsToCode(initSteps, tc || { id: "TC-021", name: "회원가입 이메일 형식 검증" });
  const [code, setCode] = useState(initCode);
  const [suite, setSuite] = useState(tc ? tc.suite : ((fqaSuites[0] || {}).name || ""));
  const [dataset, setDataset] = useState(tc ? (tc.dataset && tc.dataset !== "-" ? tc.dataset : "") : "");
  const [acctRole, setAcctRole] = useState((tc && tc.acctRole) || "");
  // 등록된 모든 환경의 계정 역할 (케이스는 역할만 고르고, 실제 계정은 실행 계획의 환경이 주입)
  const roleOpts = [...new Set((fqaSystems || []).flatMap((sy) => (sy.envs || []).flatMap((e) => (e.accts || []).map((a) => a.role))).filter(Boolean))];
  const usesAcct = steps.some((s) => /\$\{계정/.test((s.val || "") + (s.loc || "") + (s.code || "")));
  const [dragIdx, setDragIdx] = useState(null);
  const [codeOpen, setCodeOpen] = useState({});
  const toggleCode = (i) => setCodeOpen((m) => ({ ...m, [i]: !m[i] }));
  const reorder = (from, to) => { setSteps((prev) => { const arr = [...prev]; const [m] = arr.splice(from, 1); arr.splice(to, 0, m); return arr; }); setCodeOpen({}); };
  const vi = LV.indexOf(view);
  const [snap, setSnap] = useState(() => JSON.stringify({ steps: initSteps, code: initCode, committed: ei, suite: tc ? tc.suite : ((fqaSuites[0] || {}).name || ""), dataset: tc ? (tc.dataset && tc.dataset !== "-" ? tc.dataset : "") : "", acctRole: (tc && tc.acctRole) || "" }));
  const dirty = snap !== JSON.stringify({ steps, code, committed, suite, dataset, acctRole });
  const versions = (tc && tc.versions) || [];
  const selDs = (datasets || []).find((d) => d.name === dataset);
  const dsCols = selDs ? selDs.columns : [];
  const usedRowVars = [...new Set(steps.flatMap((s) => { const txt = (s.val || "") + " " + (s.loc || "") + " " + (s.code || ""); return (txt.match(/\$\{row\.([a-zA-Z0-9_]+)\}/g) || []).map((x) => x.replace(/\$\{row\.|\}/g, "")); }))];
  const missingDsCols = usedRowVars.filter((v) => !dsCols.includes(v));
  useEffect(() => { if (onDirty) onDirty(dirty); }, [dirty]);
  const editable = vi === committed;
  const readonly = vi < committed;
  const descend = () => { setCode(stepsToCode(steps, tc || {})); setCommitted(1); setView("Full-Code"); flash("Full-Code로 변환됨 · 코드 관리 전환(eject) · 스텝에서 자동 생성"); };
  return (
    <div className="space-y-4">
      <Hdr icon={Code2} title="테스트 에디터" desc="Low-Code → Full-Code · 단방향 · 스텝 단위 코드 스텝 지원" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-3">
          <Card className="p-3">
            <div className="mb-2 text-xs font-semibold text-slate-400">테스트 스위트</div>
            <Select value={suite} onChange={(e) => setSuite(e.target.value)}>{fqaSuites.map((sx) => <option key={sx.id} value={sx.name}>{sx.name} · {tcOf(sx.name)}건</option>)}</Select>
            <div className="mt-1.5 text-xs text-slate-500">이 케이스가 속한 스위트 (상단 &quot;저장&quot;으로 반영)</div>
          </Card>
          <Card className="p-3">
            <div className="mb-2 text-xs font-semibold text-slate-400">실행 계정 역할</div>
            <Select value={acctRole} onChange={(e) => setAcctRole(e.target.value)}>
              <option value="">기본 (풀의 첫 계정)</option>
              {roleOpts.map((r) => <option key={r}>{r}</option>)}
            </Select>
            <div className="mt-1.5 text-xs text-slate-500">
              {usesAcct
                ? <>스텝의 <span className="font-mono text-teal-400">{"${계정 ID}"}</span>·<span className="font-mono text-teal-400">{"${계정 비밀번호}"}</span>에 이 역할의 계정이 주입됩니다 — 실제 계정은 실행 계획이 고른 환경의 계정 풀에서.</>
                : <>이 케이스는 계정 변수를 쓰지 않습니다 — 역할을 지정해도 영향이 없습니다.</>}
            </div>
          </Card>
          <Card className="p-3">
            <div className="mb-2 text-xs font-semibold text-slate-400">데이터셋 (데이터 드리븐)</div>
            <DatasetPicker value={dataset} onChange={setDataset} noneLabel="없음 (단일 실행)" />
            {selDs ? <div className="mt-1.5 text-xs text-slate-500">컬럼 <span className="text-slate-300">{selDs.columns.join(", ")}</span> · 스텝에서 <span className="font-mono text-teal-400">{"${row.컬럼}"}</span>로 사용 · <span className="text-amber-300">행마다 반복 실행({(selDs.rowCount != null ? selDs.rowCount : selDs.rows.length).toLocaleString()}회)</span>{missingDsCols.length > 0 && <span className="text-amber-300"> · ⚠ 없는 컬럼: {missingDsCols.join(", ")}</span>}</div> : <div className="mt-1.5 text-xs text-slate-500">선택 시 데이터셋 행 수만큼 반복 실행됩니다. <span className="text-slate-600">계정 지정 용도가 아닙니다 — 그건 위의 실행 계정 역할입니다.</span></div>}
          </Card>
          <Card className="p-3">
            <div className="mb-2 text-xs font-semibold text-slate-400">빠른 작업</div>
            <div className="space-y-1.5">
              <Btn className="w-full" icon={Play} onClick={() => { if (!runnerConnected) { flash("로컬 러너 미연결 — 레코딩/MCP 화면에서 연결하세요"); return; } setRunRes(null); setQa("run"); setTimeout(() => setRunRes(simRun(steps, tc, tc ? lastOf(fqaRuns, tc.id) : "-")), 900); }}>단건 실행(디버그)</Btn>
              <Btn className="w-full" icon={Copy} onClick={() => { const nid = (tc ? tc.id : "TC") + "-" + Date.now().toString().slice(-3); addFqaCase({ id: nid, name: (tc ? tc.name : "TC") + " (사본)", suite: tc ? tc.suite : "로그인 / 인증", tags: tc ? (tc.tags || "") : "", status: "검토중", level: LV[committed], dataset: "-", steps: (tc && tc.steps) || [] }); flash(nid + " 사본 생성 · 목록에 검토중으로 추가"); }}>복제</Btn>
              <Btn className="w-full" icon={Clock} onClick={() => setQa("hist")}>실행 이력</Btn>
              <Btn className="w-full" icon={History} onClick={() => setQa("ver")}>변경 이력{versions.length > 0 && <span className="ml-1 text-slate-500">({versions.length})</span>}</Btn>
            </div>
            <div className="mt-2 flex items-center gap-1.5 border-t border-slate-800 pt-2 text-xs text-slate-500"><Terminal size={12} className="text-slate-500" /><span>단건 실행은 <span className="text-slate-400">로컬 러너(디버그)</span> · 공식 이력·게이트 미집계</span></div>
          </Card>
        </div>
        <div className="col-span-9 space-y-3">
          <Card className="flex items-center justify-between p-3">
            <div><span className="font-mono text-sm text-teal-400">{tc ? tc.id : "TC-021"}</span> <span className="text-sm text-slate-200">{tc ? tc.name : "회원가입 — 이메일 형식 검증"}</span></div>
            <div className="flex gap-2"><Badge kind={ei === 1 ? "warn" : "teal"}>{entry} 관리</Badge><Badge kind={stEK[status] || "warn"}>{status}</Badge></div>
          </Card>

          {/* 단방향 모드 흐름 바 */}
          <div className="flex items-center gap-1.5">
            {LV.map((l, i) => (
              <Fragment key={l}>
                <button disabled={i > committed} onClick={() => i <= committed && setView(l)} className={"rounded-lg border px-3 py-1.5 text-xs " + (view === l ? "border-teal-500 bg-teal-900 text-teal-200" : i <= committed ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" : "border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed")}>
                  {l}<span className="ml-1.5 font-normal text-slate-500">{ROLE[l]}</span>
                </button>
                {i < LV.length - 1 && <ArrowRight size={14} className={i < committed ? "text-teal-500" : "text-slate-700"} />}
              </Fragment>
            ))}
          </div>

          <Card className="overflow-hidden">
            {readonly && (
              <div className="flex items-center gap-2 border-b border-slate-800 bg-slate-950 px-4 py-2 text-xs text-amber-300"><Lock size={13} />읽기 전용 — 하위 모드({LV[committed]})에서 관리 중. 상위 편집은 재변환이 필요합니다.</div>
            )}

            {view === "Low-Code" && (
              <div>
                <div className="flex items-center gap-2 border-b border-slate-800 px-4 py-2">
                  <Badge kind={SURF_K[surfacesOf({ steps })] || "info"}>{surfacesOf({ steps })}</Badge>
                  <span className="text-xs text-slate-500">액션이 접점을 결정 — 화면(이동·입력·클릭·화면 검증) / 요청(요청·응답 검증)</span>
                  <span className="ml-auto text-xs text-slate-500">경로는 <span className="font-mono text-slate-400">상대경로</span>로 · base URL은 실행 계획의 환경에서 주입</span>
                </div>
                <div>
                  {steps.map((s, i) => {
                    const setStep = (patch) => setSteps(steps.map((x, j) => (j === i ? { ...x, ...patch } : x)));
                    const isCode = s.act === "코드 스텝";
                    const isReq = s.act === "요청";
                    const isNav = s.act === "이동";
                    const reqSum = s.save ? "저장 " + s.save : s.body ? "본문 있음" : "";
                    return (
                    <div key={i} className={"border-b border-slate-800 " + (dragIdx === i ? "opacity-40" : "")}>
                      <div
                        onDragOver={editable ? (e) => e.preventDefault() : undefined}
                        onDrop={editable ? () => { if (dragIdx !== null && dragIdx !== i) reorder(dragIdx, i); setDragIdx(null); } : undefined}
                        className="flex items-center gap-2 px-3 py-2.5 text-sm">
                        <span draggable={editable} onDragStart={() => setDragIdx(i)} onDragEnd={() => setDragIdx(null)} className={editable ? "cursor-grab" : ""} title={editable ? "드래그로 순서 변경" : undefined}><GripVertical size={14} className={editable ? "text-slate-500" : "text-slate-800"} /></span>
                        <span className="w-4 text-xs text-slate-500">{i + 1}</span>
                        {editable ? (
                          <>
                            <select value={s.act} onChange={(e) => { const v = e.target.value; setStep(v === "코드 스텝" ? { act: v, code: s.code || "await page.locator('').click();" } : { act: v }); if (v === "코드 스텝") setCodeOpen((m) => ({ ...m, [i]: true })); }} className="w-36 shrink-0 rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-200 outline-none focus:border-teal-500">{STEP_ACTS.map((a) => <option key={a}>{a}</option>)}</select>
                            {isCode ? (
                              <button onClick={() => toggleCode(i)} className="flex flex-1 items-center gap-1.5 rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-left text-xs text-teal-300 hover:border-teal-500"><Code2 size={12} />{codeOpen[i] ? "코드 접기 ▲" : "코드 편집 ▼"}<span className="ml-1 truncate font-mono text-slate-500">{(s.code || "").split("\n")[0]}</span></button>
                            ) : (
                              <>
                                <input value={s.loc} onChange={(e) => setStep({ loc: e.target.value })} placeholder={isReq ? "POST /v1/orders/checkout" : isNav ? "/login (상대경로)" : "로케이터"} className="flex-1 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 font-mono text-xs text-slate-300 outline-none focus:border-teal-500" />
                                {isReq ? (
                                  <button onClick={() => toggleCode(i)} className="flex w-44 shrink-0 items-center gap-1.5 rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-left text-xs text-teal-300 hover:border-teal-500"><Send size={12} />{codeOpen[i] ? "본문·헤더 ▲" : "본문·헤더·저장 ▼"}</button>
                                ) : (
                                  <input value={s.val} onChange={(e) => setStep({ val: e.target.value })} placeholder={VAL_PH[s.act] || "값/검증"} className="w-40 rounded border border-slate-700 bg-slate-800 px-1.5 py-0.5 text-xs text-slate-200 outline-none focus:border-teal-500" />
                                )}
                              </>
                            )}
                            <button onClick={() => setSteps(steps.filter((_, j) => j !== i))} className="text-slate-500 hover:text-red-400" title="스텝 삭제"><X size={13} /></button>
                          </>
                        ) : (
                          <>
                            <span className={"w-28 font-medium " + (isCode ? "text-teal-300" : s.act.includes("검증") ? "text-amber-300" : "text-slate-200")}>{s.act}</span>
                            {isCode ? <span className="flex-1 truncate font-mono text-xs text-slate-500">{(s.code || "").split("\n")[0]}</span> : <><span className="flex-1 font-mono text-xs text-slate-500">{s.loc}</span><span className="text-xs text-slate-400">{isReq ? reqSum : s.val}</span></>}
                          </>
                        )}
                      </div>
                      {isCode && (codeOpen[i] || !editable) && (
                        <div className="px-10 pb-2.5">
                          <textarea value={s.code || ""} onChange={(e) => setStep({ code: e.target.value })} readOnly={!editable} rows={4} placeholder="await page.getByTestId('x').click();" className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-teal-200 outline-none focus:border-teal-500" />
                          <div className="mt-1 text-xs text-slate-600">이 스텝은 Full-Code 변환 시 이 코드가 그대로 삽입됩니다.</div>
                        </div>
                      )}
                      {isReq && (codeOpen[i] || !editable) && (
                        <div className="grid grid-cols-2 gap-3 px-10 pb-3">
                          <div className="col-span-2">
                            <div className="mb-1 text-xs text-slate-500">요청 본문 (JSON)</div>
                            <textarea value={s.body || ""} onChange={(e) => setStep({ body: e.target.value })} readOnly={!editable} rows={3} placeholder={'{ "payment": "card" }'} className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-teal-200 outline-none focus:border-teal-500" />
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-slate-500">추가 헤더 (선택 · 한 줄에 하나)</div>
                            <textarea value={s.headers || ""} onChange={(e) => setStep({ headers: e.target.value })} readOnly={!editable} rows={2} placeholder="Idempotency-Key: ${주문키}" className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-slate-300 outline-none focus:border-teal-500" />
                            <div className="mt-1 text-xs text-slate-600">인증 헤더는 환경의 <span className="text-slate-400">API 인증</span>에서 주입 — 여기 적지 않습니다.</div>
                          </div>
                          <div>
                            <div className="mb-1 text-xs text-slate-500">응답 저장 (스텝 간 전달)</div>
                            <input value={s.save || ""} onChange={(e) => setStep({ save: e.target.value })} readOnly={!editable} placeholder="orderId = $.orderId" className="w-full rounded border border-slate-700 bg-slate-950 px-2.5 py-1.5 font-mono text-xs text-slate-300 outline-none focus:border-teal-500" />
                            <div className="mt-1 text-xs text-slate-600">쉼표로 여러 개 · 이후 스텝(웹 포함)에서 <span className="font-mono text-teal-400">{"${orderId}"}</span>로 사용</div>
                          </div>
                          <div className="col-span-2 flex items-center gap-1.5 text-xs text-slate-600"><Terminal size={12} />요청은 웹 세션의 쿠키를 공유합니다 — 웹에서 만든 상태(장바구니·로그인)가 그대로 이어집니다.</div>
                        </div>
                      )}
                    </div>
                    );
                  })}
                </div>
                {editable && <div className="px-3 py-2"><button onClick={() => setSteps([...steps, { act: "클릭", loc: "", val: "-" }])} className="text-xs text-teal-400">+ 스텝 추가</button><span className="ml-2 text-xs text-slate-600">· 액션에서 &quot;코드 스텝&quot; 선택 시 스크립트 정의</span></div>}
              </div>
            )}

            {view === "Full-Code" && (
              <div className="p-3">
                <div className="mb-2 flex items-center gap-2 text-xs"><Badge kind="warn">eject · 코드 관리</Badge><span className="text-slate-500">Playwright (TypeScript) · 저장하면 이 코드가 실행됩니다(스텝에서 더는 재생성하지 않음)</span></div>
                <textarea value={code} onChange={(e) => setCode(e.target.value)} rows={11} className={taCls} style={{ fontFamily: "monospace" }} />
              </div>
            )}

            <div className="flex items-center justify-between border-t border-slate-800 px-4 py-3">
              <div className="text-xs text-slate-500">현재 관리 수준: <span className="text-slate-300">{LV[committed]}</span></div>
              <div className="flex gap-2">
                {committed < 1 && view === LV[committed] && (
                  <Btn icon={ArrowRight} onClick={descend}>Full-Code로 변환 (eject)</Btn>
                )}
                <Btn kind="primary" icon={Save} disabled={!dirty} onClick={() => { const revert = status === "승인"; if (tc) commitFqaCase(tc.id, { steps, code, level: LV[committed], suite, dataset: dataset || "-", acctRole, ...(revert ? { status: "검토중" } : {}) }); if (revert) setStatus("검토중"); setSnap(JSON.stringify({ steps, code, committed, suite, dataset, acctRole })); flash(revert ? "저장됨 · 승인 해제(검토중) — 재검토 필요" : "저장됨 · 검토중"); }}>{dirty ? "저장" : "저장됨"}</Btn>
              </div>
            </div>
          </Card>
          <div className="text-xs text-slate-500">단방향: Low-Code에서 시작해 필요 시 Full-Code로 eject하며 정밀화. 스텝 단위 <span className="text-teal-300">코드 스텝</span>으로 까다로운 한 스텝만 스크립트로 정의할 수 있어, 전면 eject 없이 예외를 흡수합니다. Full-Code로 내려가면 코드가 관리 기준이 되고 Low-Code는 읽기 전용이 됩니다. <span className="text-slate-400">레코딩·MCP는 구조화 스텝이라 기본 Low-Code로 진입합니다.</span></div>
        </div>
      </div>
      {qa && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setQa(null)}>
          <div className={"w-full rounded-xl border border-slate-800 bg-slate-900 shadow-xl " + (qa === "ver" ? "max-w-lg" : "max-w-md")} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5"><h3 className="font-semibold text-slate-100">{qa === "run" ? "단건 실행 (디버그)" : qa === "ver" ? "변경 이력" : "실행 이력"} <span className="font-mono text-xs text-teal-400">{tc ? tc.id : "TC-021"}</span></h3><button onClick={() => setQa(null)} className="text-slate-500 hover:text-slate-200"><X size={18} /></button></div>
            <div className="space-y-3 p-5 text-sm">
              {qa === "ver" && (versions.length === 0 ? (
                <div className="text-xs text-slate-500">저장 이력이 없습니다 — 저장할 때마다 직전 버전이 여기에 쌓입니다(최근 10개).</div>
              ) : (
                <>
                  <div className="text-xs text-slate-500">최근 {versions.length}개 버전 · 복원하면 현재 내용이 다시 이력에 쌓입니다.</div>
                  <div className="max-h-72 space-y-1.5 overflow-y-auto">
                    {versions.map((v, i) => {
                      const dSteps = (v.steps || []).length - steps.length;
                      const dCode = (v.code || "").split("\n").length - (code || "").split("\n").length;
                      return (
                        <div key={i} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 text-xs"><span className="text-slate-300">{v.at}</span><span className="text-slate-500">{v.by}</span><Badge kind={v.level === "Full-Code" ? "warn" : "teal"}>{v.level}</Badge></div>
                            <div className="mt-0.5 text-xs text-slate-500">스텝 {(v.steps || []).length}개{dSteps !== 0 && <span className={dSteps > 0 ? "text-emerald-400" : "text-red-400"}> ({dSteps > 0 ? "+" : ""}{dSteps} vs 현재)</span>} · 코드 {(v.code || "").split("\n").length}줄{dCode !== 0 && <span className={dCode > 0 ? "text-emerald-400" : "text-red-400"}> ({dCode > 0 ? "+" : ""}{dCode})</span>}</div>
                          </div>
                          <Btn onClick={() => { setSteps(v.steps || []); setCode(v.code || ""); setCommitted(Math.max(0, LV.indexOf(v.level))); setView(v.level || "Low-Code"); setQa(null); flash(v.at + " 버전으로 되돌림 — 저장해야 반영됩니다"); }}>복원</Btn>
                        </div>
                      );
                    })}
                  </div>
                </>
              ))}
              {qa === "hist" && ((tc && histOf(fqaRuns, tc.id).length) ? (
                <>
                  <div className="text-xs text-slate-500">최근 {histOf(fqaRuns, tc.id).length}회 실행 <span className="text-slate-600">(실행 이력에서 파생)</span></div>
                  <div className="flex items-center gap-1.5">{histOf(fqaRuns, tc.id).map((h, i) => <span key={i} className={"flex h-7 w-7 items-center justify-center rounded text-xs font-semibold " + (h === "PASS" ? "bg-emerald-900 text-emerald-300" : h === "WARN" ? "bg-amber-900 text-amber-300" : "bg-red-900 text-red-300")}>{h === "PASS" ? "P" : h === "WARN" ? "W" : "F"}</span>)}</div>
                  <Btn className="w-full" icon={FileText} onClick={() => { setQa(null); flash("결과 화면에서 " + (tc ? tc.id : "") + " 상세 열기"); }}>결과 상세 보기</Btn>
                </>
              ) : <div className="text-xs text-slate-500">실행 이력이 없습니다 (검토중 · 미실행).</div>)}
              {qa === "run" && (runRes === null ? (
                <div className="flex items-center gap-2 text-slate-400"><RefreshCw size={14} className="text-teal-400" />로컬 러너에서 실행 중… (스텝 {steps.length}개)</div>
              ) : (
                <>
                  <div className="flex items-center gap-2"><Badge kind={runRes.verdict === "PASS" ? "pass" : "fail"}>{runRes.verdict}</Badge><span className="text-xs text-slate-500">스텝 {runRes.steps.length}개 {runRes.verdict === "FAIL" ? "· 검증 단계 실패" : "· 전체 통과"}</span></div>
                  <div className="overflow-hidden rounded-lg border border-slate-800">
                    {runRes.steps.map((s, i) => (
                      <div key={i} className={"flex items-center gap-2 border-b border-slate-800 px-3 py-1.5 text-xs last:border-0 " + (s.ok ? "" : "bg-red-950")}>{s.ok ? <CheckCircle2 size={13} className="text-emerald-400" /> : <XCircle size={13} className="text-red-400" />}<span className={s.ok ? "text-slate-300" : "text-red-300"}>{s.act}</span><span className="flex-1 truncate font-mono text-slate-500">{s.loc}</span></div>
                    ))}
                  </div>
                  <div className="text-xs text-slate-500">＊ 로컬 러너(디버그) 실행 — 공식 실행 이력·품질 게이트에는 집계되지 않습니다. (목업 시뮬레이션)</div>
                </>
              ))}
            </div>
          </div>
        </div>
      )}
      <Toast msg={msg} />
    </div>
  );
}


/* ═══════════ 5. 테스트 스위트 관리 ═══════════ */
const SF0 = { name: "", desc: "" };
export function FqaSuiteScreen() {
  const [msg, flash] = useToast();
  const { fqaSuites: suites, addFqaSuite, updateFqaSuite, removeFqaSuite, fqaCases, fqaRuns, setFqaEditTc, setFqaSuiteFocus, goto } = useApp();
  const casesOf = (name) => fqaCases.filter((c) => c.suite === name);
  const tcOf = (name) => casesOf(name).length;
  const [tcOpen, setTcOpen] = useState(null); // TC 수 클릭 → 소속 케이스 모달 (스위트 이름)
  const [tcQ, setTcQ] = useState("");
  const stK = { "승인": "pass", "검토중": "warn", "초안": "draft" };
  const tcList = tcOpen ? casesOf(tcOpen).filter((c) => !tcQ || (c.id + " " + c.name + " " + (c.tags || "")).toLowerCase().includes(tcQ.toLowerCase())) : [];
  // 혼합 여부는 소속 케이스의 스텝에서 파생 — 스위트는 platform을 갖지 않는다
  const mixOf = (name) => {
    const cs = fqaCases.filter((c) => c.suite === name);
    const has = (fn) => cs.some((c) => (c.steps || []).some(fn));
    const web = has((s) => surfaceOf(s.act) === "web");
    const api = has((s) => surfaceOf(s.act) === "api");
    return web && api ? "웹+API" : api ? "API" : web ? "웹" : "-";
  };
  const [open, setOpen] = useState(false);
  const [edit, setEdit] = useState(null);
  const [form, setForm] = useState(SF0);
  const openAdd = () => { setEdit(null); setForm(SF0); setOpen(true); };
  const openEdit = (sId) => { const sv = suites.find((x) => x.id === sId); setEdit(sId); setForm({ ...SF0, ...sv }); setOpen(true); };
  const save = () => {
    if (!form.name.trim()) { flash("이름을 입력하세요"); return; }
    if (edit === null) addFqaSuite({ ...form, id: Date.now() });
    else updateFqaSuite(edit, form);
    setOpen(false); flash(edit === null ? "스위트가 추가되었습니다" : "스위트가 수정되었습니다");
  };
  const del = (s) => {
    if (tcOf(s.name) > 0) { flash("사용 중인 스위트는 삭제 불가 (" + tcOf(s.name) + "건)"); return; }
    removeFqaSuite(s.id); flash("삭제됨");
  };
  const mixK = { "웹+API": "teal", "API": "warn", "웹": "info" };
  return (
    <div className="space-y-4">
      <PageToolbar desc="업무 흐름 묶음" />
      <Card className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
          <span className="text-sm font-semibold text-slate-200">스위트 목록 <span className="text-xs font-normal text-slate-500">{suites.length}개</span></span>
          <Btn kind="primary" icon={Plus} onClick={openAdd}>스위트 추가</Btn>
        </div>
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-800 text-left text-slate-500"><th className="px-4 py-2.5 font-medium">스위트</th><th className="font-medium">구성 (케이스에서 파생)</th><th className="font-medium">TC</th><th className="font-medium">수정</th><th></th></tr></thead>
          <tbody>
            {suites.map((s) => (
              <tr key={s.id} className="border-b border-slate-800 text-slate-300 hover:bg-slate-800">
                <td className="px-4 py-3"><div className="font-medium text-slate-200">{s.name}</div>{s.desc && <div className="text-xs text-slate-500">{s.desc}</div>}</td>
                <td>{mixOf(s.name) === "-" ? <span className="text-xs text-slate-600">-</span> : <Badge kind={mixK[mixOf(s.name)] || "info"}>{mixOf(s.name)}</Badge>}</td>
                <td>{tcOf(s.name) > 0
                  ? <button onClick={() => { setTcOpen(s.name); setTcQ(""); }} className="font-semibold text-teal-400 underline decoration-dotted underline-offset-2 hover:text-teal-300">{tcOf(s.name)}</button>
                  : <span className="text-slate-600">0</span>}</td>
                <td className="pr-2 text-xs text-slate-500 whitespace-nowrap">{s.updatedBy || "—"} · {s.updatedAt || "—"}</td>
                <td className="pr-4 text-right whitespace-nowrap"><button onClick={() => openEdit(s.id)} className="mr-3 text-xs text-slate-400 hover:text-teal-400">편집</button><button onClick={() => del(s)} className="text-slate-500 hover:text-red-400"><X size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {open && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setOpen(false)}>
          <div className="w-full max-w-lg rounded-xl border border-slate-800 bg-slate-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5"><h3 className="font-semibold text-slate-100">{edit === null ? "스위트 추가" : "스위트 편집"}</h3><button onClick={() => setOpen(false)} className="text-slate-500 hover:text-slate-200"><X size={18} /></button></div>
            <div className="space-y-3.5 p-5">
              {edit !== null && <div className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-400">이 스위트에 속한 케이스 <span className="font-semibold text-teal-400">{tcOf(form.name)}</span>건 · 구성 {mixOf(form.name)}</div>}
              <Field label="이름"><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="예: 결제 / 요금제" /></Field>
              <Field label="설명 (선택)"><Input value={form.desc || ""} onChange={(e) => setForm({ ...form, desc: e.target.value })} placeholder="이 스위트가 검증하는 업무 흐름" /></Field>
              <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setOpen(false)}>취소</Btn><Btn kind="primary" icon={Save} onClick={save}>{edit === null ? "추가" : "저장"}</Btn></div>
            </div>
          </div>
        </div>
      )}

      {/* TC 수 클릭 → 소속 케이스 목록. 건수가 많아도 모달 안에서 검색·스크롤로 처리한다. */}
      {tcOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setTcOpen(null)}>
          <div className="w-full max-w-2xl rounded-xl border border-slate-800 bg-slate-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5">
              <h3 className="flex items-center gap-2 font-semibold text-slate-100">{tcOpen}<span className="text-xs font-normal text-slate-500">{casesOf(tcOpen).length}건</span>{mixOf(tcOpen) !== "-" && <Badge kind={mixK[mixOf(tcOpen)] || "info"}>{mixOf(tcOpen)}</Badge>}</h3>
              <button onClick={() => setTcOpen(null)} className="text-slate-500 hover:text-slate-200"><X size={18} /></button>
            </div>
            <div className="space-y-3 p-5">
              <div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2">
                <Search size={14} className="text-slate-500" />
                <input value={tcQ} onChange={(e) => setTcQ(e.target.value)} placeholder="TC·이름·태그 검색" className="flex-1 bg-transparent text-sm text-slate-200 outline-none" />
                {tcQ && <span className="text-xs text-slate-500">{tcList.length}건</span>}
              </div>
              <div className="space-y-1 overflow-y-auto" style={{ maxHeight: 380 }}>
                {tcList.map((c) => (
                  <div key={c.id} onClick={() => { setTcOpen(null); setFqaEditTc(c.id); goto("fqa-cases"); }} className="flex cursor-pointer items-center gap-2 rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs hover:border-teal-700">
                    <span className="w-24 shrink-0 font-mono text-teal-400">{c.id}</span>
                    <span className="min-w-0 flex-1 truncate text-slate-200">{c.name}</span>
                    <Badge kind={SURF_K[surfacesOf(c)] || "info"}>{surfacesOf(c)}</Badge>
                    <Badge kind={stK[c.status] || "draft"}>{c.status}</Badge>
                    <span className="w-12 shrink-0 text-right text-slate-500">{lastOf(fqaRuns, c.id)}</span>
                  </div>
                ))}
                {tcList.length === 0 && <div className="py-8 text-center text-xs text-slate-600">검색 결과가 없습니다.</div>}
              </div>
              <div className="flex items-center justify-between border-t border-slate-800 pt-3">
                <span className="text-xs text-slate-500">행을 클릭하면 해당 테스트케이스 편집으로 이동합니다.</span>
                <Btn onClick={() => { const n = tcOpen; setTcOpen(null); setFqaSuiteFocus(n); goto("fqa-cases"); }}>테스트케이스에서 열기</Btn>
              </div>
            </div>
          </div>
        </div>
      )}
      <Toast msg={msg} />
    </div>
  );
}
/* ═══════════ 6. 실행 관리 ═══════════ */
const RUN_LOG = [
  { lv: "INFO", t: "FRUN-512 시작 · Chrome 1920×1080" },
  { lv: "TC", t: "TC-031 로그인 성공 확인" },
  { lv: "STEP", t: "fill [data-testid=username]" },
  { lv: "STEP", t: "click role=button[로그인]" },
  { lv: "PASS", t: "TC-031 PASS (0.7s)" },
  { lv: "TC", t: "TC-156 부가서비스 신청" },
  { lv: "FAIL", t: "TC-156 상태 미반영 (8.4s)" },
];
export function FqaRunScreen({ nav }) {
  const { fqaRuns, addFqaRun, updateFqaRun, fqaCases, fqaSuites, fqaSystems, fqaPlans } = useApp();
  const [msg, flash] = useToast();
  const [lvl, setLvl] = useState("ALL");
  const [tab, setTab] = useState("진행");
  const [fSt, setFSt] = useState("전체 상태");
  const [fPlan, setFPlan] = useState("전체 계획");
  const sK = { "실행 중": "warn", "대기 중": "info", "완료": "pass", "오류": "fail", "실패": "fail" };
  const lvK = { INFO: "text-slate-400", TC: "text-teal-300", STEP: "text-slate-400", PASS: "text-emerald-300", FAIL: "text-red-300" };
  const logs = RUN_LOG.filter((l) => lvl === "ALL" || l.lv === lvl);
  const tK = { "수동": "info", "스케줄": "pass", "CI": "warn", "예약": "info" };
  const hK = { "완료": "pass", "실패": "fail" };
  const planNames = fqaPlans.map((p) => p.name);
  const match = (r) => (fSt === "전체 상태" || r.status === fSt) && (fPlan === "전체 계획" || r.plan === fPlan);
  const rows = fqaRuns.filter((r) => r.status === "실행 중" || r.status === "대기 중").filter(match);
  const liveRun = fqaRuns.find((r) => r.status === "실행 중");
  const cnt = (fn) => fqaRuns.filter(fn).length;
  const KPI = [["실행 중", cnt((r) => r.status === "실행 중"), "text-amber-400"], ["대기", cnt((r) => r.status === "대기 중"), "text-slate-100"], ["완료", cnt((r) => r.status === "완료"), "text-emerald-400"], ["오류", cnt((r) => r.status === "오류"), "text-red-400"], ["예약", cnt((r) => r.trig === "예약"), "text-teal-400"]];
  const nextId = () => "FRUN-" + (fqaRuns.reduce((m, r) => Math.max(m, parseInt((r.id.split("-")[1] || "0"), 10)), 500) + 1);
  // 계획의 대상·환경은 ID 참조 → 접점(웹/API)을 조회해 실행 옵션 표시에 사용
  const envRefOf = (plan) => { const sy = (fqaSystems || []).find((s) => s.id === ((plan.targetRef || {}).systemId)); const e = sy ? (sy.envs || []).find((x) => x.env === (plan.targetRef || {}).env) : null; return { sy, e, label: sy ? sy.name + " · " + (plan.targetRef || {}).env : "미지정" }; };
  const surfLabel = (plan) => { const { e } = envRefOf(plan); if (!e) return "-"; const w = !!e.webUrl, a = !!e.apiUrl; return w && a ? "웹+API" : a ? "API" : w ? "웹" : "-"; };
  const suiteNames = (plan) => (plan.suites || []);
  // 실행 대상: 계획이 고른 스위트들의 승인 케이스 (스위트 활성 게이트 없음 — 계획 선택이 유일한 기준)
  const buildTcs = (plan) => {
    const inSuite = (c) => suiteNames(plan).includes(c.suite) && !c.quarantined;
    const appr = fqaCases.filter((c) => inSuite(c) && c.status === "승인");
    const src = appr.length ? appr : fqaCases.filter(inSuite);
    return src.map((c) => ({ id: c.id, name: c.name, v: lastOf(fqaRuns, c.id) === "FAIL" ? "FAIL" : "PASS", dur: (Math.round((Math.random() * 3 + 0.3) * 10) / 10) + "s" }));
  };
  const gatePlan = (plan) => { if (!suiteNames(plan).length) { flash(plan.name + " — 스위트가 선택되지 않았습니다"); return false; } return true; };
  // 실행 시점의 대상·환경·빌드 버전을 run에 스탬프 — "이 회귀가 어느 빌드에서 나왔나"를 추적하기 위함
  const stampOf = (plan) => { const { e, label } = envRefOf(plan); return { target: label, ver: (e && e.ver && e.ver !== "-") ? e.ver : "-" }; };
  const runImmediate = (plan) => { if (!gatePlan(plan)) return; const tcs = buildTcs(plan); const fail = tcs.filter((t) => t.v === "FAIL").length; const total = tcs.length; const id = nextId(); const st = nowStamp(); const { e } = envRefOf(plan); addFqaRun({ id, plan: plan.name, name: plan.name, suite: suiteNames(plan).join(" · "), ...stampOf(plan), brow: (e && e.webUrl) ? ((plan.brow && plan.brow[0]) || "Chrome") : "", trig: "수동", by: "QA Engineer", status: "실행 중", prog: 25, progt: Math.max(1, Math.round(total * 0.25)) + "/" + total, dur: "0분 03초", at: "방금 전", startedAt: st, total, pass: 0, fail: 0, warn: 0, heal: 0, tcs }); setRunOpen(false); flash(plan.name + " 실행 시작 · " + id + " — 진행 상황은 큐에서 확인"); setTimeout(() => { updateFqaRun(id, { status: "완료", prog: 100, progt: total + "/" + total, dur: "0분 " + (10 + total) + "초", endedAt: nowStamp(), pass: total - fail, fail }); if (nav) nav(id); }, 1800); };
  const runDeferred = (plan, when) => { if (!gatePlan(plan)) return; const total = fqaCases.filter((c) => suiteNames(plan).includes(c.suite) && c.status === "승인" && !c.quarantined).length; const id = nextId(); const { e } = envRefOf(plan); addFqaRun({ id, plan: plan.name, name: plan.name, suite: suiteNames(plan).join(" · "), ...stampOf(plan), brow: (e && e.webUrl) ? ((plan.brow && plan.brow[0]) || "Chrome") : "", trig: "예약", by: "예약", status: "대기 중", prog: 0, progt: when + " 실행 예정", dur: "-", at: when, total, pass: 0, fail: 0, warn: 0, heal: 0, tcs: [] }); setRunOpen(false); flash(plan.name + " " + when + " 지연 실행 예약 · " + id); };
  const [runOpen, setRunOpen] = useState(false);
  const [rf, setRf] = useState({ plan: planNames[0] || "", mode: "즉시", when: "10분 후" });
  const PlanInfo = ({ name }) => { const pl = fqaPlans.find((p) => p.name === name); if (!pl) return null; const { e, label } = envRefOf(pl); return <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-400">계획에서 상속 · 대상 <span className="text-slate-300">{label}</span> <Badge kind={SURF_K[surfLabel(pl)] || "info"}>{surfLabel(pl)}</Badge> · 스위트 <span className="text-slate-300">{suiteNames(pl).join(", ") || "없음"}</span> · <span className="text-slate-300">{[(e && e.webUrl) ? "브라우저 " + ((pl.brow || []).join(", ") || "Chrome") : null, (e && e.apiUrl) ? "타임아웃 " + (pl.timeout || 30) + "s" : null].filter(Boolean).join(" · ")}</span></div>; };
  return (
    <div className="space-y-4">
      <PageToolbar desc="진행 중 · 실행 큐 (지금 실행 중·대기)" />
      <>
          <div className="grid grid-cols-5 gap-3">
            {KPI.map((k) => (<Card key={k[0]} className="p-3 text-center"><div className={"text-2xl font-bold " + k[2]}>{k[1]}</div><div className="mt-0.5 text-xs text-slate-500">{k[0]}</div></Card>))}
          </div>
          <div className="flex items-center gap-2">
            <div style={{ width: 120 }}><Select value={fSt} onChange={(e) => setFSt(e.target.value)}><option>전체 상태</option><option>실행 중</option><option>대기 중</option></Select></div>
            <div style={{ width: 200 }}><Select value={fPlan} onChange={(e) => setFPlan(e.target.value)}><option>전체 계획</option>{planNames.map((n) => (<option key={n}>{n}</option>))}</Select></div>
            <div className="flex-1" />
            <Btn kind="primary" icon={Play} onClick={() => setRunOpen(true)}>실행</Btn>
          </div>
          <div className="grid grid-cols-12 gap-4">
            <Card className="col-span-8 overflow-hidden">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-800 text-left text-slate-500"><th className="px-4 py-2.5 font-medium">실행</th><th className="font-medium">스위트</th><th className="font-medium">환경</th><th className="font-medium">상태</th><th className="font-medium">진행</th><th className="font-medium">소요</th><th></th></tr></thead>
                <tbody>
                  {rows.length === 0 && (<tr><td colSpan={7} className="px-4 py-6 text-center text-sm text-slate-500">조건에 맞는 실행이 없습니다</td></tr>)}
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-slate-800 text-slate-300 hover:bg-slate-800">
                      <td className="px-4 py-3"><div className="font-mono text-xs text-teal-400">{r.id}</div><div className="text-slate-200">{r.name}</div></td>
                      <td className="text-slate-400">{r.suite}</td>
                      <td className="text-xs text-slate-400">{r.brow || "API · REST"}</td>
                      <td><Badge kind={sK[r.status]}>{r.status}</Badge></td>
                      <td style={{ minWidth: 90 }}>{r.status === "대기 중" ? <span className="text-xs text-slate-500">{r.progt}</span> : <div><div className="mb-0.5 text-xs text-slate-400">{r.progt}</div><div className="h-1.5 rounded bg-slate-800"><div className="h-1.5 rounded bg-teal-500" style={{ width: r.prog + "%" }} /></div></div>}</td>
                      <td className="text-xs text-slate-400">{r.dur}</td>
                      <td className="pr-4 text-right whitespace-nowrap">{r.status === "실행 중" ? <button onClick={() => flash(r.id + " 중단")} className="mr-2 text-slate-500 hover:text-red-400"><Square size={13} /></button> : null}<button onClick={() => nav && nav(r.id)} className="text-xs text-slate-400 hover:text-teal-400">상세</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Card>
            <Card className="col-span-4 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-800 px-3 py-2.5"><span className="text-sm font-semibold text-slate-200">실시간 로그 <span className="font-normal text-slate-500">· 예시</span></span>{liveRun ? <span className="flex items-center gap-1 text-xs text-red-300"><span className="h-1.5 w-1.5 rounded-full bg-red-400" />LIVE {liveRun.id}</span> : <span className="text-xs text-slate-600">대기</span>}</div>
              {liveRun ? (<>
              <div className="flex flex-wrap gap-1 border-b border-slate-800 px-2 py-1.5">
                {["ALL", "INFO", "TC", "STEP", "PASS", "FAIL"].map((l) => (<button key={l} onClick={() => setLvl(l)} className={"rounded px-1.5 py-0.5 text-xs " + (lvl === l ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200")}>{l}</button>))}
              </div>
              <div className="overflow-y-auto p-2 font-mono text-xs" style={{ maxHeight: 230 }}>
                {logs.map((l, i) => (<div key={i} className="flex gap-2 py-0.5"><span className={"w-9 shrink-0 font-semibold " + (lvK[l.lv] || "text-slate-500")}>{l.lv}</span><span className="text-slate-400">{l.t}</span></div>))}
              </div>
              </>) : (<div className="flex items-center justify-center p-8 text-xs text-slate-500" style={{ minHeight: 120 }}>실행 중인 작업이 없습니다</div>)}
            </Card>
          </div>
        </>
      {runOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setRunOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5"><h3 className="font-semibold text-slate-100">실행 시작</h3><button onClick={() => setRunOpen(false)} className="text-slate-500 hover:text-slate-200"><X size={18} /></button></div>
            <div className="space-y-3.5 p-5">
              <Field label="실행 계획"><Select value={rf.plan} onChange={(e) => setRf({ ...rf, plan: e.target.value })}>{planNames.map((n) => <option key={n}>{n}</option>)}</Select></Field>
              <PlanInfo name={rf.plan} />
              <Field label="실행 방식">
                <div className="flex gap-1.5">
                  {[["즉시", "즉시 실행"], ["지연", "지연 예약"]].map(([k, l]) => (<button key={k} onClick={() => setRf({ ...rf, mode: k })} className={"flex-1 rounded-lg border px-3 py-1.5 text-xs " + (rf.mode === k ? "border-teal-500 bg-teal-900 text-teal-200" : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700")}>{l}</button>))}
                </div>
              </Field>
              {rf.mode === "지연" && (
                <Field label="실행 지연"><Select value={rf.when} onChange={(e) => setRf({ ...rf, when: e.target.value })}><option>5분 후</option><option>10분 후</option><option>30분 후</option><option>1시간 후</option></Select></Field>
              )}
              <div className="flex items-center gap-1.5 rounded-lg border border-teal-900 bg-teal-950 px-3 py-2 text-xs text-teal-200"><Server size={12} />공유/CI 러너에서 실행 · 품질 게이트 판정 · 실행 이력·대시보드에 집계</div>
              <div className="rounded-lg border border-slate-800 bg-slate-950 px-3 py-2 text-xs text-slate-500">{rf.mode === "즉시" ? "선택한 계획을 지금 실행합니다 — 진행 상황은 큐에서 확인 후 결과로 이동합니다." : "지금 바쁠 때 잠시 뒤 실행하도록 큐에 대기로 적재합니다. 정기·이벤트(커밋/배포) 자동 실행은 실행 계획의 스케줄에서 설정하세요."}</div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-800 px-5 py-3.5"><Btn onClick={() => setRunOpen(false)}>취소</Btn><Btn kind="primary" icon={rf.mode === "즉시" ? Play : Calendar} onClick={() => { const pl = fqaPlans.find((x) => x.name === rf.plan); if (!pl) return; rf.mode === "즉시" ? runImmediate(pl) : runDeferred(pl, rf.when); }}>{rf.mode === "즉시" ? "실행 시작" : "예약 추가"}</Btn></div>
          </div>
        </div>
      )}
      <Toast msg={msg} />
    </div>
  );
}
export function FqaHistoryScreen({ nav }) {
  const { fqaRuns, fqaPlans } = useApp();
  const [msg, flash] = useToast();
  const [fSt, setFSt] = useState("전체 상태");
  const [fPlan, setFPlan] = useState("전체 계획");
  const planNames = fqaPlans.map((p) => p.name);
  const tK = { "수동": "info", "스케줄": "pass", "CI": "warn", "예약": "info" };
  const hK = { "완료": "pass", "오류": "fail" };
  const vK = { "통과": "pass", "실패": "fail", "경고": "warn" };
  const verdict = (r) => { if (r.status !== "완료") return "-"; const tc = r.tcs || []; const hasFail = r.fail > 0 || tc.some((t) => t.v === "FAIL"); const hasWarn = r.warn > 0 || tc.some((t) => t.v === "WARN"); return hasFail ? "실패" : hasWarn ? "경고" : "통과"; };
  const openRun = (r) => { if (r.status === "오류") { flash(r.id + " 오류로 종료 — 상세 결과 없음"); return; } if (nav) nav(r.id); };
  const match = (r) => (fSt === "전체 상태" || r.status === fSt) && (fPlan === "전체 계획" || r.plan === fPlan);
  const hist = fqaRuns.filter((r) => r.status === "완료" || r.status === "오류").filter(match);
  return (
    <div className="space-y-4">
      <PageToolbar desc="완료된 실행 이력 · 행 클릭 시 결과 상세" />
      <div className="flex items-center gap-2">
        <div style={{ width: 120 }}><Select value={fSt} onChange={(e) => setFSt(e.target.value)}><option>전체 상태</option><option>완료</option><option>오류</option></Select></div>
        <div style={{ width: 200 }}><Select value={fPlan} onChange={(e) => setFPlan(e.target.value)}><option>전체 계획</option>{planNames.map((n) => (<option key={n}>{n}</option>))}</Select></div>
      </div>
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-800 text-left text-slate-500"><th className="px-4 py-2.5 font-medium">실행</th><th className="font-medium">계획</th><th className="font-medium">빌드</th><th className="font-medium">실행 환경</th><th className="font-medium">트리거</th><th className="font-medium">시각</th><th className="font-medium">상태</th><th className="font-medium">판정</th><th className="font-medium">결과</th><th></th></tr></thead>
          <tbody>
            {hist.length === 0 && (<tr><td colSpan={10} className="px-4 py-6 text-center text-sm text-slate-500">조건에 맞는 이력이 없습니다</td></tr>)}
            {hist.map((r) => (
              <tr key={r.id} onClick={() => openRun(r)} className="cursor-pointer border-b border-slate-800 text-slate-300 hover:bg-slate-800">
                <td className="px-4 py-3 font-mono text-xs text-teal-400">{r.id}</td>
                <td className="text-slate-200">{r.plan || r.name}</td>
                <td className="font-mono text-xs text-slate-400">{r.ver && r.ver !== "-" ? r.ver : <span className="text-slate-600">-</span>}</td>
                <td className="text-xs text-slate-400">{r.brow || "API"}</td>
                <td><Badge kind={tK[r.trig]}>{r.trig}</Badge></td>
                <td><RunTime start={r.startedAt} end={r.endedAt} /></td>
                <td><Badge kind={hK[r.status]}>{r.status}</Badge></td>
                <td>{verdict(r) === "-" ? <span className="text-xs text-slate-600">-</span> : <Badge kind={vK[verdict(r)]}>{verdict(r)}</Badge>}</td>
                <td className="text-xs text-slate-400">{r.status === "완료" ? r.pass + "/" + r.total : "-"}</td>
                <td className="pr-4 text-right">{r.status === "완료" && <button onClick={(e) => { e.stopPropagation(); openRun(r); }} className="text-xs text-slate-400 hover:text-teal-400">상세</button>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <Toast msg={msg} />
    </div>
  );
}
/* ═══════════ 7. 결과 상세 ═══════════ */
export function FqaResultScreen({ runId, mode = "상세", back, nav, backLabel }) {
  const { fqaRuns, defects, addDefect, fqaPlans, fqaCases, updateFqaCase, jiraConfig, setPendingSelect } = useApp();
  const [msg, flash] = useToast();
  const [filt, setFilt] = useState("전체");
  const [selId, setSelId] = useState(null);
  const [etab, setEtab] = useState("스크린샷");
  const [healState, setHealState] = useState({});
  const healSt = (id) => healState[id] || "검토 대기";
  const approveHeal = (t) => { const c = fqaCases.find((x) => x.id === t.id); if (c && c.steps) updateFqaCase(t.id, { steps: c.steps.map((st) => (st.loc === t.heal.from ? Object.assign({}, st, { loc: t.heal.to }) : st)) }); setHealState((h) => Object.assign({}, h, { [t.id]: "승인됨" })); flash(t.id + " 보정 승인 · 로케이터 갱신"); };
  const rejectHeal = (t) => { setHealState((h) => Object.assign({}, h, { [t.id]: "거절됨" })); flash(t.id + " 보정 거절 · 원본 유지"); };
  const run = fqaRuns.find((r) => r.id === runId) || fqaRuns.find((r) => r.id === "FRUN-502") || fqaRuns[0] || { id: "-", tcs: [], total: 0, pass: 0, fail: 0, warn: 0, heal: 0, dur: "-" };
  const jr = (() => { if (!(jiraConfig && jiraConfig.connected !== false)) return {}; const pl = (fqaPlans || []).find((p) => p.name === run.plan); return (pl && pl.jira && pl.jira.override) ? pl.jira : jiraConfig; })(); // 결함 라우팅: 미연동 시 내부 결함
  const dkey = (base) => (jr.project || "DEF") + "-" + base;
  const tcs = run.tcs || [];
  const cur = tcs.find((t) => t.id === selId) || tcs[0] || null;
  const passRate = run.total ? Math.round((run.pass / run.total) * 1000) / 10 : 0;
  const gate = run.fail > 0 || passRate < 95 ? "FAIL" : "PASS";
  const evTabs = !run.brow ? ["요청", "응답", "로그"] : ["스크린샷", "영상", "단말 로그"];
  const evTab = evTabs.includes(etab) ? etab : evTabs[0];
  const _dur = (seed, base) => { let h = 0; for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 9973; return (base + (h % 500)).toLocaleString() + "ms"; };
  const stepsFor = (t) => {
    if (!t) return [];
    const id = t.id || "TC";
    const seg = (run.suite || "app").split(" ")[0].split("/")[0];
    const last = Math.round((parseFloat(t.dur) || 1) * 1000).toLocaleString() + "ms";
    const s = !run.brow
      ? [
          { act: "요청 전송", info: (t.name || id) + " · REST 요청", dur: _dur(id + "a", 300), ok: true },
          { act: "응답 수신", info: t.v === "FAIL" ? "상태/스키마 불일치" : "200 OK · 스키마 준수", dur: _dur(id + "b", 200), ok: true },
        ]
      : [
          { act: "브라우저 열기", info: (run.brow || "Chrome").toLowerCase().split("+")[0] + " · 세션 시작", dur: _dur(id + "a", 1400), ok: true },
          { act: "페이지 이동", info: "goto · /" + seg.toLowerCase(), dur: _dur(id + "b", 300), ok: true },
          { act: t.name, info: t.heal ? "로케이터 " + t.heal.to + " · 자동 보정 적용" : "액션 수행 → " + id, dur: _dur(id + "c", 500), ok: true },
        ];
    s.push(
      t.v === "FAIL"
        ? { act: "결과 검증 실패", info: t.name + " — 기대 결과 불일치 (재시도 2회)", dur: last, ok: false }
        : t.v === "WARN"
        ? { act: "결과 검증 (경고)", info: t.name + " — 통과, 임계 근접 경고", dur: last, ok: true, warn: true }
        : { act: "결과 검증", info: t.name + " — 통과", dur: last, ok: true }
    );
    return s;
  };
  const SUM = [["전체 TC", run.total, "text-slate-100"], ["통과", run.pass, "text-emerald-400"], ["실패", run.fail, "text-red-400"], ["경고", run.warn, "text-amber-400"]].concat(!run.brow ? [] : [["보정 제안", tcs.filter((t) => t.heal).length, "text-teal-400"]]);
  /* 중복 결함 판정 키 = (도메인, 대상 제품, TC).
     같은 TC라도 대상 제품이 다르면 다른 결함이다. 환경(스테이징/운영)은 발견 위치일 뿐 결함의 축이 아니다.
     '열린' 결함이 있으면 재등록 금지. Resolved만 있으면 재발이므로 재등록 허용. */
  const runTarget = String(run.target || "").split(" · ")[0]; // "T월드 · 스테이징" → "T월드"
  const defectsOfTc = (id) => defects.filter((d) => d.tc === id && d.domain === "FQA" && (d.target || "") === runTarget);
  const openDefectOf = (id) => defectsOfTc(id).find((d) => d.status !== "Resolved");
  const isRegression = (id) => !openDefectOf(id) && defectsOfTc(id).length > 0;
  const regDefect = (t) => { if (openDefectOf(t.id)) { flash(t.id + " 이미 열린 결함이 있습니다"); return; } const key = dkey(1900 + defects.length); addDefect({ key, tc: t.id, target: runTarget, sev: "Major", title: (isRegression(t.id) ? "[재발] " : "") + t.name, status: "Open", domain: "FQA", project: jr.project || "", assignee: jr.assignee || "" }); flash(t.id + " 결함 등록 · " + key); };
  const regAll = () => { const tgt = tcs.filter((t) => t.v === "FAIL" && !openDefectOf(t.id)); if (!tgt.length) { flash("등록할 신규 실패 결함이 없습니다 — 모두 열린 결함이 있습니다"); return; } tgt.forEach((t, i) => addDefect({ key: dkey(1900 + defects.length + i), tc: t.id, target: runTarget, sev: "Major", title: (isRegression(t.id) ? "[재발] " : "") + t.name, status: "Open", domain: "FQA", project: jr.project || "", assignee: jr.assignee || "" })); flash("실패 " + tgt.length + "건 결함 일괄 등록"); };
  const FLAKY = fqaCases.filter((c) => histOf(fqaRuns, c.id).length >= 3).map((c) => {
    const h = histOf(fqaRuns, c.id); const fails = h.filter((v) => v === "FAIL").length; const passes = h.filter((v) => v === "PASS").length;
    const flips = h.slice(1).reduce((n, v, i) => n + (v !== h[i] ? 1 : 0), 0);
    let trail = 0; for (let i = h.length - 1; i >= 0; i--) { if (h[i] === "FAIL") trail++; else break; }
    const rate = Math.round((fails / h.length) * 100);
    const persistent = fails / h.length >= 0.6 && trail >= 2;
    const flaky = !persistent && fails > 0 && passes > 0 && flips >= 1;
    const streak = persistent ? ("최근 " + trail + "회 연속 실패 · " + rate + "% 실패") : ("PASS/FAIL 교차 " + flips + "회 · " + rate + "% 실패");
    return { id: c.id, name: c.name, suite: c.suite, runs: h.length, fails, rate, flips, flaky, persistent, quarantined: !!c.quarantined, streak };
  }).filter((r) => r.flaky || r.persistent);
  const flakyN = FLAKY.filter((r) => r.flaky).length;
  const persistN = FLAKY.filter((r) => r.persistent).length;
  const hasDefFQA = (id) => defects.some((d) => d.tc === id && d.domain === "FQA");
  const regFail = (r) => { if (hasDefFQA(r.id)) { flash(r.id + " 이미 결함 등록됨"); return; } addDefect({ key: dkey(1970 + defects.length), tc: r.id, sev: "Major", title: "지속 실패: " + r.name, status: "Open", domain: "FQA", project: jr.project || "", assignee: jr.assignee || "" }); flash(r.id + " 결함 등록"); };
  const toggleQuar = (r) => { updateFqaCase(r.id, { quarantined: !r.quarantined }); flash(r.id + (r.quarantined ? " 격리 해제 — 차단 실행에 복귀" : " 격리(quarantine) — 차단 실행에서 제외")); };
  const vK = { PASS: "pass", FAIL: "fail", HEAL: "teal", WARN: "warn" };
  const shown = tcs.filter((t) => filt === "전체" || (filt === "실패만" && t.v === "FAIL") || (filt === "통과만" && t.v === "PASS") || (filt === "보정 제안" && t.heal));
  const finishedOf = (pn) => fqaRuns.filter((r) => r.plan === pn && r.status === "완료").sort((x, y) => parseInt(y.id.split("-")[1] || "0", 10) - parseInt(x.id.split("-")[1] || "0", 10));
  const [regPlan, setRegPlan] = useState((fqaPlans && fqaPlans[0] && fqaPlans[0].name) || "");
  const _ir = finishedOf(regPlan);
  const [bId, setBId] = useState(_ir[0] ? _ir[0].id : "");
  const [aId, setAId] = useState(_ir[1] ? _ir[1].id : (_ir[0] ? _ir[0].id : ""));
  useEffect(() => { const rs = finishedOf(regPlan); setBId(rs[0] ? rs[0].id : ""); setAId(rs[1] ? rs[1].id : (rs[0] ? rs[0].id : "")); }, [regPlan]);
  const planRuns = finishedOf(regPlan);
  const runA = fqaRuns.find((r) => r.id === aId);
  const runB = fqaRuns.find((r) => r.id === bId);
  const rate = (r) => (r && r.total ? Math.round((r.pass / r.total) * 1000) / 10 : 0);
  const rank = { FAIL: 0, WARN: 1, HEAL: 1, PASS: 2 };
  const cls = (a, b) => (!a || !b ? { k: "-", c: "text-slate-600" } : a === b ? { k: "유지", c: "text-slate-500" } : ((rank[b] == null ? 2 : rank[b]) > (rank[a] == null ? 2 : rank[a]) ? { k: "개선", c: "text-emerald-400" } : { k: "퇴행", c: "text-red-400" }));
  const _nameOf = (id) => { const t = [...((runB && runB.tcs) || []), ...((runA && runA.tcs) || [])].find((x) => x.id === id); return t ? t.name : id; };
  const mapA = Object.fromEntries(((runA && runA.tcs) || []).map((t) => [t.id, t.v]));
  const mapB = Object.fromEntries(((runB && runB.tcs) || []).map((t) => [t.id, t.v]));
  const regRows = [...new Set([...Object.keys(mapA), ...Object.keys(mapB)])].map((id) => ({ id, name: _nameOf(id), a: mapA[id], b: mapB[id] }));
  const summ = regRows.reduce((acc, r) => { const k = cls(r.a, r.b).k; acc[k] = (acc[k] || 0) + 1; return acc; }, {});
  return (
    <div className="space-y-4">
      {mode === "상세" ? (
        <PageToolbar desc={back ? <span><button onClick={back} className="text-teal-400 hover:underline">{backLabel || "실행 이력"}</button> <span className="text-slate-600">›</span> <span className="text-slate-300 font-medium">{run.id} 결과</span></span> : "결과 상세"}>
          {back && <Btn icon={ChevronLeft} onClick={back}>{backTo(backLabel || "실행 이력")}</Btn>}
        </PageToolbar>
      ) : (
        <PageToolbar desc={mode === "회귀" ? "회귀 비교 · 실행(계획) 기준" : "불안정(Flaky) · 테스트케이스 기준"} />
      )}
      {mode === "상세" && (
        <>
          <Card className="flex flex-wrap items-center justify-between gap-2 p-3">
            <div className="flex items-center gap-2 flex-wrap"><span className="font-mono text-sm text-teal-400">{run.id}</span><span className="text-sm font-medium text-slate-200">{run.plan}</span>{run.fail > 0 ? <Badge kind="fail">실패 {run.fail}건</Badge> : <Badge kind="pass">전체 통과</Badge>}<span className="text-xs text-slate-500">{!run.brow ? "API" : (run.brow || "Chrome")} · {run.suite}</span>{run.ver && run.ver !== "-" && <Badge kind="info">빌드 {run.ver}</Badge>}</div>
            <div className="flex gap-2"><Btn icon={Download} onClick={() => flash("Excel")}>Excel</Btn><Btn icon={Download} onClick={() => flash("PDF")}>PDF</Btn><Btn icon={Download} onClick={() => flash(run.id + " 증적 번들 다운로드 — " + (!run.brow ? "요청·응답·trace·로그" : "스크린샷·영상·trace·로그"))}>증적 다운로드</Btn>{run.fail > 0 && <Btn kind="primary" icon={Bug} onClick={regAll}>결함 일괄 등록</Btn>}</div>
          </Card>
          <div className={"grid gap-3 " + (!run.brow ? "grid-cols-5" : "grid-cols-6")}>
            {SUM.map((k) => (<Card key={k[0]} className="p-3 text-center"><div className={"text-2xl font-bold " + k[2]}>{k[1]}</div><div className="mt-0.5 text-xs text-slate-500">{k[0]}</div></Card>))}
            <Card className="p-3 text-center"><div className="text-2xl font-bold text-slate-100">{run.dur}</div><div className="mt-0.5 text-xs text-slate-500">소요</div></Card>
          </div>
          <Card className="flex flex-wrap items-center gap-3 p-3 text-sm"><span className={"font-semibold " + (gate === "FAIL" ? "text-red-300" : "text-emerald-300")}>품질 게이트: {gate}</span><span className="text-slate-400">기준 95% · 실제 <span className={"font-semibold " + (gate === "FAIL" ? "text-red-300" : "text-emerald-300")}>{passRate}%</span></span>{run.platform !== "API" && (<><span className="text-slate-600">·</span><span className="text-slate-400">보정 제안 {tcs.filter((t) => t.heal).length}건</span></>)}</Card>
          {tcs.length === 0 ? (
            <Card className="p-8 text-center text-sm text-slate-500">{run.status === "실행 중" || run.status === "대기 중" ? "실행이 진행 중입니다 — 완료 후 케이스 결과가 표시됩니다." : "이 실행에는 케이스 상세 결과가 없습니다."}</Card>
          ) : (
          <div className="grid grid-cols-5 gap-4">
            <Card className="col-span-2 overflow-hidden">
              <div className="flex flex-wrap gap-1.5 border-b border-slate-800 px-3 py-2">
                {(!run.brow ? ["전체", "실패만", "통과만"] : ["전체", "실패만", "통과만", "보정 제안"]).map((t) => (<button key={t} onClick={() => setFilt(t)} className={"rounded-full px-2.5 py-1 text-xs " + (filt === t ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-300 hover:bg-slate-700")}>{t}</button>))}
              </div>
              <div className="overflow-y-auto" style={{ maxHeight: 340 }}>
                {shown.map((t) => (
                  <div key={t.id} onClick={() => setSelId(t.id)} className={"flex items-center justify-between border-b border-slate-800 px-4 py-2.5 cursor-pointer hover:bg-slate-800 " + (cur && cur.id === t.id ? "bg-slate-800" : "")}>
                    <div><span className="font-mono text-xs text-teal-400">{t.id}</span><div className="text-xs text-slate-300">{t.name}</div></div>
                    <div className="flex items-center gap-2">{t.v === "FAIL" && openDefectOf(t.id) && <Bug size={12} className="text-red-400" />}<span className="text-xs text-slate-500">{t.dur}</span>{t.heal && <Badge kind="teal">보정</Badge>}<Badge kind={vK[t.v]}>{t.v}</Badge></div>
                  </div>
                ))}
              </div>
            </Card>
            {cur && (
            <Card className="col-span-3 p-4">
              <div className="mb-3 flex items-center justify-between"><span className="font-mono text-teal-400">{cur.id}</span><div className="flex items-center gap-2"><Badge kind={vK[cur.v]}>{cur.v}</Badge>{cur.heal && <Badge kind="teal">보정</Badge>}<Btn icon={RefreshCw} onClick={() => flash(cur.id + " 재실행")}>재실행</Btn>{cur.v === "FAIL" && (openDefectOf(cur.id)
                ? <Btn icon={Bug} onClick={() => { setPendingSelect({ kind: "defect", key: openDefectOf(cur.id).key }); nav && nav("defects"); }}>결함 보기 · {openDefectOf(cur.id).key}</Btn>
                : <Btn kind="danger" icon={Bug} onClick={() => regDefect(cur)}>{isRegression(cur.id) ? "재발 결함 등록" : "결함 등록"}</Btn>)}</div></div>
              <div className="mb-3 text-sm text-slate-300">{cur.name}</div>
              {cur.heal && (
                <div className="mb-3 rounded-lg border border-teal-800 bg-teal-950 p-3">
                  <div className="flex items-center justify-between"><span className="text-xs font-semibold text-teal-200">자가보정 제안 (로케이터 자동 복구)</span><Badge kind={healSt(cur.id) === "승인됨" ? "pass" : healSt(cur.id) === "거절됨" ? "fail" : "warn"}>{healSt(cur.id)}</Badge></div>
                  <div className="mt-2 text-xs text-slate-400">{cur.heal.step}</div>
                  <div className="mt-1 flex flex-wrap items-center gap-2 font-mono text-xs"><span className="text-red-300 line-through">{cur.heal.from}</span><span className="text-slate-500">→</span><span className="text-emerald-300">{cur.heal.to}</span><span className="text-slate-500">· 신뢰도 {cur.heal.conf}%</span></div>
                  {healSt(cur.id) === "검토 대기" ? <div className="mt-2 flex gap-2"><Btn kind="primary" icon={CheckCircle2} onClick={() => approveHeal(cur)}>승인 · 로케이터 반영</Btn><Btn icon={X} onClick={() => rejectHeal(cur)}>거절</Btn></div> : <div className="mt-2 text-xs text-slate-500">{healSt(cur.id) === "승인됨" ? "제안 로케이터가 TC 스텝에 반영되었습니다." : "원본 로케이터를 유지합니다 (수동 수정 대상)."}</div>}
                </div>
              )}
              <div className="mb-2 text-xs font-semibold text-slate-400">스텝 실행 타임라인</div>
              <div className="space-y-1.5">
                {stepsFor(cur).map((st, i) => (
                  <div key={i} className={"flex items-center gap-2 rounded-lg border px-3 py-2 text-xs " + (!st.ok ? "border-red-900 bg-red-950" : st.warn ? "border-amber-900 bg-amber-950" : "border-slate-800 bg-slate-800")}>
                    {!st.ok ? <XCircle size={14} className="text-red-400" /> : st.warn ? <AlertTriangle size={14} className="text-amber-400" /> : <CheckCircle2 size={14} className="text-emerald-400" />}
                    <span className={"font-medium " + (!st.ok ? "text-red-300" : st.warn ? "text-amber-200" : "text-slate-200")}>{st.act}</span>
                    <span className="flex-1 font-mono text-slate-500">{st.info}</span>
                    <span className="text-slate-400">{st.dur}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3">
                <div className="flex gap-1.5 border-b border-slate-800">
                  {evTabs.map((t) => (<button key={t} onClick={() => setEtab(t)} className={"px-2.5 py-1.5 text-xs " + (evTab === t ? "border-b-2 border-teal-500 text-teal-300" : "text-slate-500 hover:text-slate-300")}>{t}</button>))}
                </div>
                <div className="flex h-24 items-center justify-center text-xs text-slate-500">{!run.brow ? (evTab === "응답" ? cur.id + " · 응답 " + (cur.v === "FAIL" ? "4xx · 불일치" : "200 OK") + " · body.json" : evTab === "로그" ? cur.id + " · HTTP trace · 헤더 · 타이밍" : cur.id + " · 요청 원문 · 메서드·URL·헤더·바디") : (evTab === "스크린샷" ? cur.id + (cur.v === "FAIL" ? "_fail" : "_pass") + ".png · 1.4MB" : evTab === "영상" ? run.id.toLowerCase().replace("-", "_") + "_" + cur.id.toLowerCase() + ".webm · 12MB" : cur.id + " · console/network 로그")}</div>
              </div>
            </Card>
            )}
          </div>
          )}
        </>
      )}
      {mode === "회귀" && (
        <>
          <Card className="p-3"><Field label="실행 계획 (비교 맥락)"><Select value={regPlan} onChange={(e) => setRegPlan(e.target.value)}>{fqaPlans.map((p) => <option key={p.id}>{p.name}</option>)}</Select></Field></Card>
          {planRuns.length < 2 ? (
            <Card className="p-8 text-center text-sm text-slate-500">이 계획에는 비교할 완료된 실행이 2건 이상 필요합니다 (현재 {planRuns.length}건).</Card>
          ) : (
          <>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-4"><div className="mb-1 text-xs text-slate-500">A — 기준(baseline)</div><Select value={aId} onChange={(e) => setAId(e.target.value)}>{planRuns.map((r) => <option key={r.id} value={r.id}>{r.id} · {r.at} · {rate(r)}%</option>)}</Select><div className="mt-3 text-4xl font-bold text-slate-300">{rate(runA)}%</div></Card>
            <Card className="border-teal-700 p-4"><div className="mb-1 text-xs text-slate-500">B — 비교(target)</div><Select value={bId} onChange={(e) => setBId(e.target.value)}>{planRuns.map((r) => <option key={r.id} value={r.id}>{r.id} · {r.at} · {rate(r)}%</option>)}</Select><div className="mt-3 text-4xl font-bold text-teal-400">{rate(runB)}%</div></Card>
          </div>
          <div className="grid grid-cols-3 gap-4">
            <Card className="p-4 text-center"><div className="text-2xl font-bold text-emerald-400">{summ["개선"] || 0}</div><div className="mt-0.5 text-xs text-slate-500">개선</div></Card>
            <Card className="p-4 text-center"><div className="text-2xl font-bold text-red-400">{summ["퇴행"] || 0}</div><div className="mt-0.5 text-xs text-slate-500">퇴행 (회귀)</div></Card>
            <Card className="p-4 text-center"><div className="text-2xl font-bold text-slate-300">{summ["유지"] || 0}</div><div className="mt-0.5 text-xs text-slate-500">유지</div></Card>
          </div>
          <Card className="overflow-hidden">
            <div className="border-b border-slate-800 px-4 py-3 text-sm font-semibold text-slate-200">케이스 회귀 분석 <span className="font-normal text-slate-500">· {aId} → {bId}</span></div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 text-left text-slate-500"><th className="px-4 py-2.5 font-medium">ID</th><th className="font-medium">TC</th><th className="font-medium">A</th><th></th><th className="font-medium">B</th><th className="font-medium">변화</th></tr></thead>
              <tbody>
                {regRows.length === 0 && (<tr><td colSpan={6} className="px-4 py-6 text-center text-sm text-slate-500">두 실행 모두 케이스 단위 결과가 없습니다.</td></tr>)}
                {regRows.map((r) => { const v = cls(r.a, r.b); return (
                  <tr key={r.id} className={"border-b border-slate-800 text-slate-300 " + (v.k === "퇴행" ? "bg-red-950" : "")}>
                    <td className="px-4 py-2.5 font-mono text-teal-400">{r.id}</td><td className="text-slate-300">{r.name}</td><td>{r.a ? <Badge kind={vK[r.a]}>{r.a}</Badge> : <span className="text-xs text-slate-600">없음</span>}</td><td className="text-slate-600">→</td><td>{r.b ? <Badge kind={vK[r.b]}>{r.b}</Badge> : <span className="text-xs text-slate-600">없음</span>}</td><td className={"font-semibold " + v.c}>{v.k}</td>
                  </tr>
                ); })}
              </tbody>
            </table>
          </Card>
          </>
          )}
        </>
      )}
      {mode === "불안정" && (
        <>
          <div className="flex flex-wrap items-center gap-3 text-sm">
            <span className="text-slate-400">최근 실행 이력 기준(TC별 누적)</span>
            <span className="text-slate-600">·</span>
            <span className="text-amber-300">Flaky {flakyN}건</span>
            <span className="text-red-300">지속 실패 {persistN}건</span>
          </div>
          <Card className="overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 text-left text-slate-500"><th className="px-4 py-2.5 font-medium">TC</th><th className="font-medium">실패 빈도</th><th className="font-medium">유형</th><th className="font-medium">최근 추세</th><th></th></tr></thead>
              <tbody>
                {FLAKY.length === 0 && (<tr><td colSpan={5} className="px-4 py-6 text-center text-sm text-slate-500">불안정·지속 실패로 분류된 TC가 없습니다.</td></tr>)}
                {FLAKY.map((r) => (
                  <tr key={r.id} className="border-b border-slate-800 text-slate-300 hover:bg-slate-800">
                    <td className="px-4 py-3"><div className="font-mono text-xs text-teal-400">{r.id}</div><div className="flex items-center gap-1.5 text-slate-200">{r.name}{r.quarantined && <Badge kind="draft">격리됨</Badge>}</div><div className="text-xs text-slate-500">{r.suite}</div></td>
                    <td style={{ minWidth: 130 }}><div className="mb-0.5 text-xs text-slate-400">{r.fails}/{r.runs}회 · {r.rate}%</div><div className="h-1.5 rounded bg-slate-800"><div className="h-1.5 rounded" style={{ width: r.rate + "%", background: r.flaky ? "#f59e0b" : "#ef4444" }} /></div></td>
                    <td>{r.flaky ? <Badge kind="warn">Flaky</Badge> : <Badge kind="fail">지속 실패</Badge>}</td>
                    <td className="text-xs text-slate-400">{r.streak}</td>
                    <td className="pr-4 text-right whitespace-nowrap">{r.flaky ? <button onClick={() => toggleQuar(r)} className={"mr-3 text-xs " + (r.quarantined ? "text-teal-300 hover:text-teal-200" : "text-amber-300 hover:text-amber-200")}>{r.quarantined ? "격리 해제" : "격리"}</button> : (hasDefFQA(r.id) ? <span className="mr-3 text-xs text-slate-500">등록됨</span> : <button onClick={() => regFail(r)} className="mr-3 text-xs text-red-300 hover:text-red-200">결함 등록</button>)}<button onClick={() => (nav ? nav("fqa-cases", r.id) : flash(r.id + " 테스트케이스로 이동"))} className="text-xs text-slate-400 hover:text-teal-400">TC 보기</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
          <div className="text-xs text-slate-500">판정 기준: <span className="text-slate-400">같은 빌드 버전 내 최근 실행 변동</span>을 TC별 누적 · 결과 교차(PASS/FAIL 혼재)=<span className="text-amber-300">Flaky→격리</span>, 연속 실패=<span className="text-red-300">지속 실패→결함</span>. 격리된 TC는 차단(게이팅) 실행에서 제외되며(비차단), 안정화 후 복귀합니다. <span className="text-slate-600">※ 신뢰 판정에는 충분한 표본(다회 실행)이 필요합니다.</span></div>
        </>
      )}
      <Toast msg={msg} />
    </div>
  );
}
/* ═══════════ 8. FQA 대시보드 ═══════════ */
const barColor = (p) => (p >= 90 ? "#14b8a6" : p >= 80 ? "#f59e0b" : "#ef4444");
const FD_TREND = [
  { d: "W1", runs: 32, pass: 88 }, { d: "W2", runs: 38, pass: 90 }, { d: "W3", runs: 41, pass: 89 },
  { d: "W4", runs: 45, pass: 91 }, { d: "W5", runs: 52, pass: 90 }, { d: "W6", runs: 48, pass: 92 },
];
const FD_BROW = [["Chrome", 94, true], ["Firefox", 90, true], ["Safari", null, false]];
export function FqaDashboardScreen({ nav }) {
  const { fqaRuns, fqaCases, fqaSuites, defects } = useApp();
  const [msg, flash] = useToast();
  const sK = { "실행 중": "warn", "대기 중": "info", "완료": "pass", "오류": "fail" };
  const rate = (r) => (r && r.total ? Math.round((r.pass / r.total) * 1000) / 10 : 0);
  const finished = fqaRuns.filter((r) => r.status === "완료").slice().sort((a, b) => parseInt(b.id.split("-")[1] || "0", 10) - parseInt(a.id.split("-")[1] || "0", 10));
  const lastRun = finished[0];
  const recent = fqaRuns.slice().sort((a, b) => parseInt(b.id.split("-")[1] || "0", 10) - parseInt(a.id.split("-")[1] || "0", 10)).slice(0, 5);
  const totalTc = fqaCases.length;
  const approved = fqaCases.filter((c) => c.status === "승인").length;
  const flakyRows = fqaCases.filter((c) => histOf(fqaRuns, c.id).length >= 3).map((c) => {
    const h = histOf(fqaRuns, c.id); const fails = h.filter((v) => v === "FAIL").length; const passes = h.filter((v) => v === "PASS").length;
    const flips = h.slice(1).reduce((n, v, i) => n + (v !== h[i] ? 1 : 0), 0);
    let trail = 0; for (let i = h.length - 1; i >= 0; i--) { if (h[i] === "FAIL") trail++; else break; }
    const rt = Math.round((fails / h.length) * 100);
    const persistent = fails / h.length >= 0.6 && trail >= 2;
    const flaky = !persistent && fails > 0 && passes > 0 && flips >= 1;
    return { id: c.id, name: c.name, runs: h.length, fails, rate: rt, flaky, persistent };
  }).filter((r) => r.flaky || r.persistent);
  const unstableN = flakyRows.length;
  const topFail = flakyRows.slice().sort((a, b) => b.rate - a.rate).slice(0, 4);
  const openDef = defects.filter((d) => (d.domain || "LQA") === "FQA" && d.status !== "Resolved").length;
  const suiteHealth = fqaSuites.map((su) => {
    const cs = fqaCases.filter((c) => c.suite === su.name);
    const rated = cs.filter((c) => ["PASS", "FAIL"].includes(lastOf(fqaRuns, c.id)));
    const pass = rated.length ? Math.round((cs.filter((c) => lastOf(fqaRuns, c.id) === "PASS").length / rated.length) * 100) : null;
    return { name: su.name, tc: cs.length, pass };
  });
  const KPI = [
    ["자동화 TC", totalTc, "text-slate-100", "저장소 등록"],
    ["PASS율(최근 실행)", lastRun ? rate(lastRun) + "%" : "—", "text-emerald-400", lastRun ? lastRun.id : "실행 없음"],
    ["승인 TC", approved + "/" + totalTc, "text-teal-400", "승인/전체"],
    ["불안정 TC", unstableN, "text-amber-400", "Flaky+지속 실패"],
    ["미해결 결함", openDef, "text-red-400", "기능 · Open"],
  ];
  return (
    <div className="space-y-4">
      <PageToolbar desc="자동화 현황 · 스위트 건강도 (실데이터 파생)" />
      <div className="grid grid-cols-5 gap-3">
        {KPI.map((k) => (<Card key={k[0]} className="p-4"><div className="text-xs text-slate-400">{k[0]}</div><div className={"mt-1 text-3xl font-bold " + k[2]}>{k[1]}</div><div className="mt-1 text-xs text-slate-500">{k[3]}</div></Card>))}
      </div>
      <Card className="p-4">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200"><TrendingUp size={15} className="text-teal-400" />실행·PASS율 추이 <span className="font-normal text-slate-500">· 예시(주간 집계)</span></div>
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
          <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200"><Activity size={15} className="text-teal-400" />스위트 건강도 (케이스 최근 결과 기준)</div>
          <div className="space-y-2.5">
            {suiteHealth.map((s) => (
              <div key={s.name}>
                <div className="mb-1 flex justify-between text-xs"><span className="text-slate-300">{s.name} <span className="text-slate-500">· {s.tc} TC</span></span>{s.pass == null ? <span className="text-slate-600">미실행</span> : <span className="font-semibold" style={{ color: barColor(s.pass) }}>{s.pass}%</span>}</div>
                <div className="h-2 rounded bg-slate-800">{s.pass != null && <div className="h-2 rounded" style={{ width: s.pass + "%", background: barColor(s.pass) }} />}</div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-4">
          <div className="mb-3 text-sm font-semibold text-slate-200">웹 브라우저별 PASS율 <span className="font-normal text-slate-500">· 예시</span></div>
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
          <div className="mb-3 flex items-center justify-between"><span className="flex items-center gap-2 text-sm font-semibold text-slate-200"><AlertTriangle size={15} className="text-amber-400" />빈발 실패 Top</span><button onClick={() => (nav ? nav("fqa-flaky") : flash("불안정으로 이동"))} className="text-xs text-teal-400">전체 보기</button></div>
          <div className="space-y-2">
            {topFail.length === 0 && <div className="rounded-lg bg-slate-800 px-3 py-6 text-center text-xs text-slate-500">불안정·지속 실패 TC가 없습니다</div>}
            {topFail.map((h) => (
              <div key={h.id} className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-sm">
                <div><span className="font-mono text-xs text-teal-400">{h.id}</span> <span className="text-slate-200">{h.name}</span><div className="text-xs text-slate-500">최근 {h.runs}회 중 {h.fails}회 실패 · {h.rate}%</div></div>
                {h.flaky ? <Badge kind="warn">Flaky</Badge> : <Badge kind="fail">지속 실패</Badge>}
              </div>
            ))}
          </div>
        </Card>
        <Card className="overflow-hidden">
          <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3"><span className="text-sm font-semibold text-slate-200">최근 실행</span><Btn icon={History} onClick={() => (nav ? nav("fqa-history") : flash("실행 이력으로"))}>실행 이력으로</Btn></div>
          <table className="w-full text-sm">
            <tbody className="text-slate-300">
              {recent.length === 0 && <tr><td className="px-4 py-6 text-center text-xs text-slate-500">실행 이력이 없습니다</td></tr>}
              {recent.map((r) => (
                <tr key={r.id} onClick={() => nav && nav("fqa-result-detail", r.id)} className="cursor-pointer border-b border-slate-800 hover:bg-slate-800"><td className="px-4 py-2.5 font-mono text-xs text-teal-400">{r.id}</td><td className="text-slate-200">{r.name}</td><td className="text-xs text-slate-500">{r.progt}</td><td className="pr-4 text-right"><Badge kind={sK[r.status]}>{r.status}</Badge></td></tr>
              ))}
            </tbody>
          </table>
        </Card>
      </div>
      <div className="text-xs text-slate-500">KPI·스위트 건강도·빈발 실패·최근 실행은 스토어(실행·케이스·스위트·결함)에서 파생 · 추이/브라우저 위젯은 예시입니다.</div>
      <Toast msg={msg} />
    </div>
  );
}
/* ═══════════ 9. 테스트케이스 (통합 저장소) ═══════════ */
/* ═══════════ API 케이스 뷰 (A안: 읽기 전용 · B안 확장 지점) ═══════════ */
function FqaApiCaseView({ tc }) {
  const { updateFqaCase, fqaSuites } = useApp();
  const [msg, flash] = useToast();
  const apiSuites = fqaSuites || [];
  const [suite, setSuite] = useState(tc ? tc.suite : "");
  const suiteDirty = suite !== (tc ? tc.suite : "");
  const [tab, setTab] = useState("Form");
  const [resp, setResp] = useState(null);
  const steps = (tc && tc.steps) || [];
  const req = steps.find((s) => s.act === "요청");
  const asserts = steps.filter((s) => s.act === "검증");
  const method = req ? (req.loc.split(" ")[0] || "GET") : "GET";
  const path = req ? req.loc.split(" ").slice(1).join(" ") : "";
  const status = (asserts[0] && parseInt(asserts[0].val, 10)) || 200;
  const send = () => { setResp({ s: "run" }); setTimeout(() => setResp({ s: "done", code: status, ms: 40 + (method.length * 17) % 120, body: '{ "id": 1, "result": "ok" }' }), 600); };
  const script = "import { test, expect } from '@playwright/test';\n\ntest('" + (tc ? tc.id + " " + tc.name : "") + "', async ({ request }) => {\n  const res = await request." + method.toLowerCase() + "('" + (path || "/") + "');\n  expect(res.status()).toBe(" + status + ");\n  // 응답 스키마·본문 검증 ...\n});";
  return (
    <>
      <Hdr icon={Code2} title={"API 케이스 · " + (tc ? tc.id : "")} desc="요청 / 검증 정의 · 전용 편집기 준비 중" />
      <div className="rounded-lg border border-amber-800 bg-amber-950 px-3 py-2 text-xs text-amber-300">API 전용 편집기는 준비 중입니다 — 현재는 요청·검증 구조를 조회만 할 수 있습니다. (스펙 임포트로 생성 · 폼 편집은 B단계 제공)</div>
      <div className="mt-3 flex items-center gap-2"><span className="text-xs font-semibold text-slate-400">테스트 스위트</span><div style={{ width: 240 }}><Select value={suite} onChange={(e) => setSuite(e.target.value)}>{apiSuites.map((x) => <option key={x.id} value={x.name}>{x.name}</option>)}{apiSuites.length === 0 && <option>{tc ? tc.suite : "API 연동"}</option>}</Select></div>{suiteDirty && <span className="text-xs text-amber-300">미저장 변경</span>}<Btn kind="primary" icon={Save} disabled={!suiteDirty} onClick={() => { if (tc) updateFqaCase(tc.id, { suite }); flash("스위트 저장됨: " + suite); }}>저장</Btn></div>
      <div className="mt-3"><Seg options={["Form", "Script"]} value={tab} onChange={setTab} /></div>
      {tab === "Form" ? (
        <Card className="mt-3 space-y-4 p-4">
          <div>
            <div className="mb-1.5 text-xs font-semibold text-slate-400">요청</div>
            {req ? (<div className="flex items-center gap-2"><Badge kind={M_K[method] || "info"}>{method}</Badge><span className="font-mono text-sm text-slate-200">{path}</span></div>) : <span className="text-xs text-slate-500">요청 정의 없음</span>}
            {req && req.val && <div className="mt-1.5 font-mono text-xs text-slate-500">{req.val}</div>}
          </div>
          <div>
            <div className="mb-1.5 text-xs font-semibold text-slate-400">검증 ({asserts.length})</div>
            <div className="space-y-1.5">
              {asserts.map((a, i) => (<div key={i} className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-800 px-3 py-1.5 text-xs"><CheckCircle2 size={13} className="text-emerald-400" /><span className="text-slate-300">{a.loc}</span><span className="font-mono text-slate-400">{a.val}</span></div>))}
              {asserts.length === 0 && <span className="text-xs text-slate-500">검증 없음</span>}
            </div>
          </div>
        </Card>
      ) : (
        <Card className="mt-3 p-4"><div className="mb-2 text-xs font-semibold text-slate-400">스크립트 미리보기 <span className="font-normal text-slate-500">· 읽기 전용</span></div><pre className="overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-300" style={{ fontFamily: "monospace" }}>{script}</pre></Card>
      )}
      <div className="mt-3 flex items-center gap-2"><Btn kind="primary" icon={Send} onClick={send}>{resp && resp.s === "run" ? "전송 중…" : "요청 전송 (Send)"}</Btn><span className="text-xs text-slate-500">＊ 브라우저·러너 없이 요청 직접 전송 · 공식 이력·게이트 미집계(디버그)</span></div>
      {resp && resp.s === "done" && (
        <Card className="mt-2 space-y-2 p-3">
          <div className="flex items-center gap-2 text-xs"><Badge kind={resp.code < 400 ? "pass" : "fail"}>{resp.code}</Badge><span className="text-slate-400">{resp.ms}ms</span><span className={"font-semibold " + (resp.code === status ? "text-emerald-400" : "text-red-400")}>{resp.code === status ? "기대 상태 일치" : "기대 불일치"}</span></div>
          <pre className="overflow-auto rounded-lg bg-slate-950 p-3 text-xs text-slate-300" style={{ fontFamily: "monospace" }}>{resp.body}</pre>
        </Card>
      )}
      <Toast msg={msg} />
    </>
  );
}
export function FqaCasesScreen() {
  const { fqaCases, fqaSuites, fqaRuns, setFqaCaseStatus, removeFqaCase, fqaEditTc, setFqaEditTc, fqaSuiteFocus, setFqaSuiteFocus, defects } = useApp();
  const defCount = (id) => defects.filter((d) => d.tc === id && (d.domain || "LQA") === "FQA").length;
  const editorDirty = useRef(false);
  useEffect(() => { if (fqaEditTc) { const c = fqaCases.find((x) => x.id === fqaEditTc); if (c) { setSel(c); setMode("edit"); } setFqaEditTc(null); } }, [fqaEditTc]);
  const [msg, flash] = useToast();
  const [mode, setMode] = useState("목록");
  const [addOpen, setAddOpen] = useState(false);
  const [newPlat, setNewPlat] = useState("Web");
  const [q, setQ] = useState("");
  const [stf, setStf] = useState("전체");
  const [suiteF, setSuiteF] = useState("전체");
  const [resF, setResF] = useState("전체");
  const [platF, setPlatF] = useState("전체");
  // 스위트 화면의 "전체 N건 보기" — 해당 스위트로 필터를 걸고 목록을 연다
  useEffect(() => { if (fqaSuiteFocus) { setMode("목록"); setSuiteF(fqaSuiteFocus); setQ(""); setStf("전체"); setResF("전체"); setPlatF("전체"); setFqaSuiteFocus(null); } }, [fqaSuiteFocus]);
  const [sel, setSel] = useState(null);
  const [open, setOpen] = useState(null);
  const [picked, setPicked] = useState(new Set());
  const stK = { "승인": "pass", "검토중": "warn", "초안": "draft" };
  const lvK2 = { "Low-Code": "teal", "Full-Code": "warn" };
  const lvLabel = (c) => c.level;
  const lastFor = (c) => lastOf(fqaRuns, c.id);
  const list = fqaCases.filter((c) => (stf === "전체" || c.status === stf) && (suiteF === "전체" || c.suite === suiteF) && (resF === "전체" || (resF === "미실행" ? lastFor(c) === "-" : lastFor(c) === resF)) && (platF === "전체" || surfacesOf(c) === platF) && (c.id + c.name + c.suite + c.tags).toLowerCase().includes(q.toLowerCase()));
  const delCase = (c, after) => { if (!window.confirm(c.id + " 삭제할까요? 되돌릴 수 없습니다.")) return; removeFqaCase(c.id); if (after) after(); flash(c.id + " 삭제됨"); };
  const togglePick = (id) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const allPicked = list.length > 0 && list.every((c) => picked.has(c.id));
  const toggleAll = () => { if (allPicked) setPicked(new Set()); else setPicked(new Set(list.map((c) => c.id))); };
  const bulkSet = (st) => { picked.forEach((id) => setFqaCaseStatus(id, st)); flash(picked.size + "건 " + st + " 처리"); setPicked(new Set()); };
  const bulkDel = () => { if (!window.confirm(picked.size + "건을 삭제할까요? 되돌릴 수 없습니다.")) return; picked.forEach((id) => removeFqaCase(id)); flash(picked.size + "건 삭제됨"); setPicked(new Set()); };
  const Back = () => <button onClick={() => { if (editorDirty.current && !window.confirm("저장하지 않은 변경이 있습니다. 목록으로 나가시겠습니까?")) return; editorDirty.current = false; setMode("목록"); }} className="mb-3 inline-flex items-center gap-1 text-xs text-teal-400"><ChevronLeft size={14} />테스트케이스 목록</button>;
  if (mode === "레코딩") return <div><Back /><FqaRecordScreen onDone={(m) => { setMode("목록"); flash(m); }} /></div>;
  if (mode === "AI") return <div><Back /><FqaAiGenScreen onDone={(m) => { setMode("목록"); flash(m); }} /></div>;
  if (mode === "엑셀") return <div><Back /><FqaExcelScreen onDone={(m) => { setMode("목록"); flash(m); }} /></div>;
  if (mode === "MCP") return <div><Back /><FqaMcpScreen onDone={(m) => { setMode("목록"); flash(m); }} /></div>;
  if (mode === "api-import") return <div><Back /><FqaApiImportScreen onDone={(m) => { setMode("목록"); flash(m); }} /></div>;
  if (mode === "edit") return <div><Back /><FqaEditorScreen entry={sel ? sel.level : "Low-Code"} tc={sel} onDirty={(d) => { editorDirty.current = d; }} /></div>;
  return (
    <div className="space-y-4">
      <PageToolbar desc="기능 TC 저장소 · 생성·편집·관리" />
      <div className="flex items-center gap-2">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-3 py-2"><Search size={15} className="text-slate-500" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="TC·스위트·태그 검색" className="flex-1 bg-transparent text-sm text-slate-200 outline-none" /></div>
        <div style={{ width: 110 }}><Select value={platF} onChange={(e) => setPlatF(e.target.value)}><option>전체</option><option>웹</option><option>API</option><option>웹+API</option></Select></div>
        <div style={{ width: 150 }}><Select value={suiteF} onChange={(e) => setSuiteF(e.target.value)}><option>전체</option>{fqaSuites.map((x) => <option key={x.id}>{x.name}</option>)}</Select></div>
        <div style={{ width: 110 }}><Select value={stf} onChange={(e) => setStf(e.target.value)}><option>전체</option><option>승인</option><option>검토중</option><option>초안</option></Select></div>
        <div style={{ width: 120 }}><Select value={resF} onChange={(e) => setResF(e.target.value)}><option>전체</option><option>PASS</option><option>FAIL</option><option>미실행</option></Select></div>
        <div className="relative">
          <Btn kind="primary" icon={Plus} onClick={() => setAddOpen(!addOpen)}>새 TC</Btn>
          {addOpen && (
            <div className="absolute right-0 z-20 mt-1 w-60 rounded-lg border border-slate-700 bg-slate-900 py-1 shadow-xl">
              {[["레코딩 (웹)", Video, "레코딩", true], ["AI 생성", Brain, "AI", true], ["엑셀 업로드", Upload, "엑셀", true], ["MCP 탐색 (웹)", Cpu, "MCP", true], ["API 스펙 임포트", FileText, "api-import", true], ["cURL / HAR", Terminal, "", false]].map(([l, Ic, m, ok]) => (
                <button key={l} disabled={!ok} onClick={() => { if (!ok) return; setMode(m); setAddOpen(false); }} className={"flex w-full items-center gap-2 px-3 py-2 text-sm " + (ok ? "text-slate-200 hover:bg-slate-800" : "cursor-not-allowed text-slate-600")}><Ic size={14} className={ok ? "text-teal-400" : "text-slate-600"} />{l}{!ok && <span className="ml-auto text-slate-500" style={{ fontSize: 10 }}>준비 중</span>}</button>
              ))}
            </div>
          )}
        </div>
      </div>
      {picked.size > 0 && (
        <div className="flex items-center gap-2 rounded-lg border border-teal-700 bg-teal-950 px-3 py-2 text-sm">
          <span className="flex-1 text-teal-200">{picked.size}건 선택됨</span>
          <Btn kind="primary" icon={CheckCircle2} onClick={() => bulkSet("승인")}>선택 승인</Btn>
          <Btn onClick={() => bulkSet("검토중")}>검토중으로</Btn>
          <Btn kind="danger" icon={Trash2} onClick={bulkDel}>선택 삭제</Btn>
          <Btn onClick={() => setPicked(new Set())}>선택 해제</Btn>
        </div>
      )}
      <Card className="overflow-hidden">
        <table className="w-full text-sm">
          <thead><tr className="border-b border-slate-800 text-left text-slate-500"><th className="w-8 py-2.5 pl-4"><input type="checkbox" checked={allPicked} onChange={toggleAll} className="accent-teal-500" title="전체 선택" /></th><th className="py-2.5 pr-4 font-medium">ID</th><th className="font-medium">이름</th><th className="font-medium">스위트</th><th className="font-medium">구성</th><th className="font-medium">관리</th><th className="font-medium">상태</th><th className="font-medium">최근 이력</th><th className="font-medium">결함</th><th className="font-medium">수정</th><th></th></tr></thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.id} onClick={() => setOpen(c)} className={"cursor-pointer border-b border-slate-800 text-slate-300 hover:bg-slate-800 " + (picked.has(c.id) ? "bg-slate-800/60" : "")}>
                <td className="pl-4" onClick={(e) => e.stopPropagation()}><input type="checkbox" checked={picked.has(c.id)} onChange={() => togglePick(c.id)} className="accent-teal-500" /></td>
                <td className="py-3 pr-4 font-mono text-teal-400">{c.id}</td>
                <td className="text-slate-200">{c.name}</td>
                <td className="text-slate-400">{c.suite}</td>
                <td>{surfacesOf(c) === "-" ? <span className="text-xs text-slate-600">-</span> : <Badge kind={SURF_K[surfacesOf(c)] || "info"}>{surfacesOf(c)}</Badge>}</td>
                <td><Badge kind={lvK2[c.level] || "info"}>{lvLabel(c)}</Badge></td>
                <td><Badge kind={stK[c.status]}>{c.status}</Badge></td>
                <td>{histOf(fqaRuns, c.id).length ? <div className="flex gap-0.5">{histOf(fqaRuns, c.id).map((h, i) => <span key={i} className={"flex h-5 w-5 items-center justify-center rounded text-xs font-semibold " + (h === "PASS" ? "bg-emerald-900 text-emerald-300" : h === "WARN" ? "bg-amber-900 text-amber-300" : "bg-red-900 text-red-300")}>{h === "PASS" ? "P" : h === "WARN" ? "W" : "F"}</span>)}</div> : <span className="text-xs text-slate-600">-</span>}</td>
                <td>{defCount(c.id) ? <Badge kind="fail">{defCount(c.id)}</Badge> : <span className="text-xs text-slate-600">-</span>}</td>
                <td className="pr-2 text-xs text-slate-500 whitespace-nowrap">{c.updatedBy || "—"} · {c.updatedAt || "—"}</td>
                <td className="pr-4 text-right whitespace-nowrap" onClick={(e) => e.stopPropagation()}><button onClick={() => flash(c.id + " 단건 디버그 실행")} className="mr-3 text-slate-400 hover:text-teal-400" title="단건(디버그) 실행"><Play size={14} /></button><button onClick={() => { setSel(c); setMode("edit"); }} className="mr-3 text-xs text-slate-400 hover:text-teal-400">편집</button><button onClick={() => delCase(c)} className="text-slate-500 hover:text-red-400" title="삭제"><X size={14} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>
      <div className="text-xs text-slate-500">"새 TC"로 레코딩·AI·엑셀·MCP 생성 → 검토중으로 등록 → 행 클릭 시 상세, 편집은 에디터로 이동.</div>

      {open && (
        <div className="fixed inset-0 z-30 flex justify-end bg-black bg-opacity-50" onClick={() => setOpen(null)}>
          <div className="h-full w-full max-w-md overflow-y-auto border-l border-slate-800 bg-slate-900 p-5" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between"><span className="font-mono text-teal-400">{open.id}</span><button onClick={() => setOpen(null)} className="text-slate-500 hover:text-slate-300"><X size={20} /></button></div>
            <div className="space-y-4 text-sm">
              <div><div className="text-slate-100">{open.name}</div><div className="mt-1.5 flex flex-wrap gap-1.5">{surfacesOf(open) !== "-" && <Badge kind={SURF_K[surfacesOf(open)] || "info"}>{surfacesOf(open)}</Badge>}<Badge kind="info">{open.suite}</Badge><Badge kind={lvK2[open.level]}>{lvLabel(open)}</Badge><Badge kind={stK[open.status]}>{open.status}</Badge></div></div>
              <div className="rounded-lg bg-slate-800 p-3 text-xs text-slate-400 space-y-0.5"><div>생성 <span className="text-slate-300">{open.createdBy || "—"}</span> · {open.createdAt || "—"}</div><div>수정 <span className="text-slate-300">{open.updatedBy || "—"}</span> · {open.updatedAt || "—"}</div></div>
              <div><div className="mb-1 text-xs text-slate-500">태그</div><div className="text-xs text-slate-400">{open.tags || "-"}</div></div>
              <div><div className="mb-1 text-xs text-slate-500">데이터셋 (데이터 드리븐)</div><div className="text-xs text-slate-400">{open.dataset && open.dataset !== "-" ? open.dataset : "없음"}</div></div>
              <div>
                <div className="mb-1 text-xs text-slate-500">최근 실행 이력</div>
                {histOf(fqaRuns, open.id).length ? <div className="flex items-center gap-1.5">{histOf(fqaRuns, open.id).map((h, i) => <span key={i} className={"flex h-6 w-6 items-center justify-center rounded text-xs font-semibold " + (h === "PASS" ? "bg-emerald-900 text-emerald-300" : h === "WARN" ? "bg-amber-900 text-amber-300" : "bg-red-900 text-red-300")}>{h === "PASS" ? "P" : h === "WARN" ? "W" : "F"}</span>)}<span className="ml-1 text-xs text-slate-500">(최근 4회 · 실행 이력에서 파생)</span></div> : <div className="text-xs text-slate-500">실행 이력 없음</div>}
              </div>
              <div>
                <div className="mb-1 text-xs text-slate-500">걸린 결함</div>
                {defCount(open.id) ? <div className="flex items-center gap-2"><Badge kind="fail">{defCount(open.id)}건</Badge><button onClick={() => flash("결함 메뉴에서 확인")} className="text-xs text-teal-400">보기</button></div> : <div className="text-xs text-slate-500">없음</div>}
              </div>
              <div className="flex flex-wrap gap-2 border-t border-slate-800 pt-3">
                {(open.status || "검토중") !== "승인"
                  ? <Btn kind="primary" icon={CheckCircle2} onClick={() => { setFqaCaseStatus(open.id, "승인"); setOpen({ ...open, status: "승인" }); flash(open.id + " 승인됨"); }}>승인</Btn>
                  : <Btn icon={RefreshCw} onClick={() => { setFqaCaseStatus(open.id, "검토중"); setOpen({ ...open, status: "검토중" }); flash(open.id + " 검토중으로"); }}>검토중으로</Btn>}
                <Btn icon={Code2} onClick={() => { setSel(open); setMode("edit"); setOpen(null); }}>편집(에디터)</Btn>
                <Btn icon={Play} onClick={() => flash(open.id + " 단건 실행 — " + (open.last === "FAIL" ? "FAIL (검증 실패)" : "PASS"))}>단건 실행</Btn>
                {open.last === "FAIL" && <Btn kind="danger" icon={Bug} onClick={() => flash(open.id + " 결함 등록")}>결함 등록</Btn>}
                <div className="flex-1" />
                <Btn kind="danger" icon={X} onClick={() => delCase(open, () => setOpen(null))}>삭제</Btn>
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
/* 환경 이름은 실행 계획의 참조 키(targetRef.env) — 대상 안에서 유니크해야 한다 */
const ENV_NAMES = ["스테이징", "운영", "개발"];
const TRow = ({ label, on, set, hint }) => (
  <div className="flex items-center justify-between py-1 text-sm text-slate-300"><span>{label}{hint && <span className="ml-1 text-xs text-slate-500">{hint}</span>}</span><TG on={on} onClick={() => set(!on)} /></div>
);
/* 접점 그룹 — 웹/API base URL 두 칸을 하나의 묶음으로 보여준다(둘 중 하나 이상 · 둘 다면 혼합) */
const EndpointGroup = ({ webUrl, apiUrl, set }) => {
  const both = !!webUrl && !!apiUrl;
  return (
    <div className="rounded-lg border border-slate-700 p-3">
      <div className="mb-2 flex items-center gap-2">
        <Globe size={13} className="text-teal-400" />
        <span className="text-xs font-semibold text-slate-300">접점 (Base URL)</span>
        <span className="text-xs text-slate-500">· 둘 중 하나 이상</span>
        {both && <Badge kind="teal">혼합 케이스 가능</Badge>}
      </div>
      <div className="space-y-2.5">
        <Field label="웹"><Input value={webUrl} onChange={(e) => set({ webUrl: e.target.value })} placeholder="https://stg.tworld.co.kr" className="font-mono text-xs" /></Field>
        <Field label="API"><Input value={apiUrl} onChange={(e) => set({ apiUrl: e.target.value })} placeholder="https://api-stg.tworld.co.kr" className="font-mono text-xs" /></Field>
      </div>
    </div>
  );
};
export function FqaTargetScreen() {
  const [msg, flash] = useToast();
  const { fqaSystems: systems, addFqaSystem, updateFqaSystem, removeFqaSystem, fqaPlans } = useApp();
  const [sel, setSel] = useState(0);
  const [envIdx, setEnvIdx] = useState(0);
  const [test, setTest] = useState(null);
  const [modal, setModal] = useState(null);
  const [block, setBlock] = useState(null); // 참조 중이라 삭제가 막힌 경우
  const [tf, setTf] = useState({ name: "", env: "스테이징", webUrl: "", apiUrl: "" });
  const [ef, setEf] = useState({ env: "개발", webUrl: "", apiUrl: "" });
  const [draft, setDraft] = useState({});
  const [nameDraft, setNameDraft] = useState(null);
  const stK = { "연결됨": "pass", "미확인": "warn", "오류": "fail" };
  const sys = systems[sel] || systems[0];
  const env = sys.envs[envIdx] || sys.envs[0];
  const secretRef = (val, setVal, ph) => <VarRefInput value={val} onChange={setVal} placeholder={ph} />;
  // 환경 = 한 배포본이 노출하는 접점(webUrl/apiUrl) + 공유 계정 + API 인증
  // 웹 로그인은 환경 설정이 아니다 — UI 흐름이므로 테스트케이스의 스텝이 수행한다.
  // API 스펙(계약)도 환경 설정이 아니다 — 케이스 생성 소스일 뿐이므로 "API 스펙 임포트" 화면에서만 다룬다.
  const CFG_DEF = {
    webUrl: "", apiUrl: "",
    apiAuth: { type: "API Key", header: "X-API-Key", secretRef: "" },
    access: { basicAuth: false, baUser: "", baPw: "", tlsIgnore: false },
    deploy: { mode: "수동", verUrl: "", verPath: "$.version", interval: "15분" },
  };
  const cfg = { ...CFG_DEF, ...env, ...draft };
  const setEnvCfg = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const setSub = (key, patch) => setEnvCfg({ [key]: { ...(cfg[key] || {}), ...patch } });
  const hasWeb = !!cfg.webUrl;
  const hasApi = !!cfg.apiUrl;
  const apiT = (cfg.apiAuth || {}).type || "API Key";
  const verMode = (cfg.deploy || {}).mode || "수동";
  const dirty = Object.keys(draft).length > 0 || (nameDraft !== null && nameDraft !== sys.name);
  // 접점·인증이 바뀌면 이전 연결 결과는 무효 → 미확인으로 되돌린다
  const invalidates = ["webUrl", "apiUrl", "apiAuth", "access"].some((k) => k in draft);
  const saveCfg = () => { updateFqaSystem(sys.id, { ...(nameDraft !== null ? { name: nameDraft } : {}), envs: sys.envs.map((e, i) => (i === envIdx ? { ...e, ...draft, ...(invalidates ? { status: "미확인" } : {}) } : e)) }); setDraft({}); setNameDraft(null); setTest(null); flash("설정 저장됨" + (invalidates ? " · 연결 테스트 필요" : "")); };
  const guardSwitch = (fn) => { if (dirty && !window.confirm("저장하지 않은 변경이 있습니다. 이동하시겠습니까?")) return; setDraft({}); setNameDraft(null); fn(); };
  useEffect(() => { setDraft({}); setNameDraft(null); }, [sys.id]);
  const envSlug = { "스테이징": "stg", "운영": "prod", "개발": "dev" }[env.env] || "env";
  const hookUrl = "https://xq.skt/api/hooks/t" + sys.id + "-" + envSlug + "-3f9a2c";
  const choose = (i) => guardSwitch(() => { setSel(i); setEnvIdx(0); setTest(null); });
  // 참조 중이면 삭제 불가 — 계획의 targetRef가 조용히 끊어지는 것을 막는다
  const delTarget = (i, sy) => {
    if (systems.length <= 1) { flash("최소 1개 대상은 유지해야 합니다"); return; }
    const used = plansUsing(sy.id, null);
    if (used.length) { setBlock({ what: sy.name + " 대상", plans: used }); return; }
    if (!window.confirm(sy.name + " 대상을 삭제할까요?")) return;
    guardSwitch(() => { removeFqaSystem(sy.id); setSel(0); setEnvIdx(0); setTest(null); flash(sy.name + " 삭제됨"); });
  };
  const delEnv = () => {
    if (sys.envs.length <= 1) { flash("최소 1개 환경은 유지해야 합니다"); return; }
    const used = plansUsing(sys.id, env.env);
    if (used.length) { setBlock({ what: sys.name + " · " + env.env + " 환경", plans: used }); return; }
    if (!window.confirm(env.env + " 환경을 삭제할까요?")) return;
    guardSwitch(() => { updateFqaSystem(sys.id, { envs: sys.envs.filter((_, i) => i !== envIdx) }); setEnvIdx(0); flash(env.env + " 환경 삭제됨"); });
  };
  const delAcct = (idx) => { setEnvCfg({ accts: (cfg.accts || []).filter((_, j) => j !== idx) }); flash("계정 삭제됨"); };
  const updAcct = (idx, patch) => setEnvCfg({ accts: (cfg.accts || []).map((a, j) => (j === idx ? { ...a, ...patch } : a)) });
  const appendAcct = () => setEnvCfg({ accts: [...(cfg.accts || []), { role: "", acct: "", secretRef: "" }] });

  /* 연결 테스트 — 목업이라 실제 HTTP는 못 쏘지만, 설정 유효성만으로 실패 판정이 가능하다.
     그래야 status 배지가 의미를 갖는다. */
  const cfgErrors = () => {
    const e = [];
    if (!hasWeb && !hasApi) e.push("접점(웹 또는 API base URL)이 없습니다");
    if (hasApi) {
      const a = cfg.apiAuth || {};
      if (a.type === "API Key" && (!a.header || !a.secretRef)) e.push("API Key — 헤더 이름·키가 필요합니다");
      if (a.type === "Bearer 토큰 (정적)" && !a.secretRef) e.push("Bearer — 토큰이 필요합니다");
      if (a.type === "OAuth 2.0 (Client Credentials)" && (!a.tokenUrl || !a.clientId || !a.clientSecret)) e.push("OAuth — 토큰 엔드포인트·client_id·client_secret이 필요합니다");
    }
    const ac = cfg.access || {};
    if (ac.basicAuth && (!ac.baUser || !ac.baPw)) e.push("Basic Auth — 사용자명·비밀번호가 필요합니다");
    if ((cfg.deploy || {}).mode === "버전 엔드포인트 폴링") {
      const u = (cfg.deploy || {}).verUrl || "";
      if (!u) e.push("배포 감지 — 폴링 대상 URL이 필요합니다");
      else if (!/^https?:\/\//i.test(u)) e.push("배포 감지 — 폴링 대상 URL은 절대 URL이어야 합니다 (https://…)");
    }
    return e;
  };
  const setEnvStatus = (status) => updateFqaSystem(sys.id, { envs: sys.envs.map((e, i) => (i === envIdx ? { ...e, status } : e)) });
  const runTest = () => {
    const errs = cfgErrors();
    setTest({ s: "run" });
    setTimeout(() => {
      if (errs.length) { setTest({ s: "err", m: errs.join(" · ") }); setEnvStatus("오류"); return; }
      const parts = [];
      if (hasWeb) parts.push("웹 200 OK");
      if (hasApi) parts.push("API 200 OK · 인증 유효");
      setTest({ s: "ok", m: parts.join(" / ") });
      setEnvStatus("연결됨");
    }, 800);
  };

  /* 참조 무결성 — 환경 이름은 실행 계획의 참조 키(targetRef.env)다.
     ① 같은 대상 안에서 유니크해야 하고  ② 참조 중이면 삭제할 수 없다. */
  const usedEnvs = (sys.envs || []).map((e) => e.env);
  const envOpts = ENV_NAMES.filter((n) => !usedEnvs.includes(n));
  const plansUsing = (systemId, envName) => (fqaPlans || []).filter((p) => {
    const r = p.targetRef || {};
    return r.systemId === systemId && (envName == null || r.env === envName);
  });
  const addTarget = () => {
    if (!tf.name.trim()) { flash("대상 이름을 입력하세요"); return; }
    if (!tf.webUrl.trim() && !tf.apiUrl.trim()) { flash("웹 또는 API 접점 중 하나 이상을 입력하세요"); return; }
    const ns = { id: Date.now(), name: tf.name, envs: [{ env: tf.env, webUrl: tf.webUrl, apiUrl: tf.apiUrl, status: "미확인", ver: "-", prod: tf.env === "운영", accts: [] }] };
    guardSwitch(() => { addFqaSystem(ns); setSel(systems.length); setEnvIdx(0); setModal(null); flash("대상이 추가되었습니다"); });
  };
  const addEnv = () => {
    if (!ef.env) { flash("추가할 수 있는 환경이 없습니다 — 이미 모두 등록되었습니다"); return; }
    if (usedEnvs.includes(ef.env)) { flash(ef.env + " 환경은 이미 있습니다"); return; }
    if (!ef.webUrl.trim() && !ef.apiUrl.trim()) { flash("웹 또는 API 접점 중 하나 이상을 입력하세요"); return; }
    guardSwitch(() => { updateFqaSystem(sys.id, { envs: [...sys.envs, { env: ef.env, webUrl: ef.webUrl, apiUrl: ef.apiUrl, status: "미확인", ver: "-", prod: ef.env === "운영", accts: [] }] }); setEnvIdx(sys.envs.length); setModal(null); flash("환경이 추가되었습니다"); });
  };
  return (
    <div className="space-y-4">
      <PageToolbar desc="대상(제품) → 환경(배포본) · 접점(웹/API) · 인증 · 접근" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-3">
          <Btn kind="primary" icon={Plus} className="w-full" onClick={() => { setTf({ name: "", env: "스테이징", webUrl: "", apiUrl: "" }); setModal("target"); }}>대상 추가</Btn>
          {systems.map((sy, i) => (
            <Card key={sy.id} className={"cursor-pointer p-3 " + (sel === i ? "border-teal-500" : "hover:border-slate-700")} >
              <div onClick={() => choose(i)}>
                <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-100">{sy.name}</span><button onClick={(e) => { e.stopPropagation(); delTarget(i, sy); }} className="text-slate-500 hover:text-red-400" title="대상 삭제"><X size={12} /></button></div>
                <div className="mt-1.5 flex flex-wrap gap-1">{sy.envs.map((e) => <Badge key={e.env} kind={e.prod ? "warn" : "info"}>{e.env}</Badge>)}</div>
              </div>
            </Card>
          ))}
        </div>
        <div className="col-span-9 space-y-3">
          {/* 헤더 — 이름·상태 / 저장·연결 테스트 (LQA 챗봇 연결과 동일한 배치) */}
          <Card className="space-y-2.5 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex min-w-0 flex-1 items-center gap-2"><div className="w-56 shrink-0"><Input value={nameDraft ?? sys.name} onChange={(e) => setNameDraft(e.target.value)} className="text-base font-semibold" /></div><span className="shrink-0"><Badge kind={stK[env.status]}>{env.status}</Badge></span>{hasWeb && hasApi && <span className="shrink-0"><Badge kind="teal">웹+API</Badge></span>}</div>
              <div className="flex shrink-0 items-center gap-2">{dirty && <span className="text-xs text-amber-300">미저장 변경</span>}<Btn icon={RefreshCw} onClick={runTest}>{test && test.s === "run" ? "테스트 중…" : "연결 테스트"}</Btn><Btn kind="primary" icon={Save} onClick={saveCfg} disabled={!dirty}>설정 저장</Btn></div>
            </div>
            <div className="flex flex-wrap items-center gap-1.5 border-t border-slate-800 pt-2.5">
              <span className="mr-1 text-xs text-slate-500">환경</span>
              {sys.envs.map((e, i) => (<button key={e.env} onClick={() => guardSwitch(() => { setEnvIdx(i); setTest(null); })} className={"rounded-lg px-3 py-1.5 text-xs font-medium " + (envIdx === i ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-400 hover:text-slate-200")}>{e.env}{e.prod ? " ●" : ""}</button>))}
              {envOpts.length > 0 && <button onClick={() => { setEf({ env: envOpts[0], webUrl: "", apiUrl: "" }); setModal("env"); }} className="rounded-lg border border-slate-700 px-2 py-1.5 text-xs text-slate-400 hover:bg-slate-800">+ 환경</button>}
              {sys.envs.length > 1 && <button onClick={delEnv} className="rounded-lg border border-slate-700 px-2 py-1.5 text-xs text-slate-500 hover:text-red-400" title="현재 환경 삭제">− 환경</button>}
            </div>
            {test && test.s === "ok" && <div className="flex items-center gap-2 border-t border-slate-800 pt-2.5 text-xs text-emerald-300"><CheckCircle2 size={14} />{test.m}</div>}
            {test && test.s === "err" && <div className="flex items-start gap-2 border-t border-slate-800 pt-2.5 text-xs text-red-300"><XCircle size={14} className="mt-0.5 shrink-0" />{test.m}</div>}
          </Card>
          <div className="text-xs text-slate-500">생성 <span className="text-slate-400">{sys.createdBy || "—"}</span> · {sys.createdAt || "—"} · 수정 <span className="text-slate-400">{sys.updatedBy || "—"}</span> · {sys.updatedAt || "—"}</div>

          {/* 좌: 실행에 주입되는 것 (접점 · 계정 · API 인증) / 우: 접속·운영 조건 (접근 제어 · 배포 감지) */}
          <div className="grid grid-cols-2 items-start gap-3">
          <div className="space-y-3">
          <Card className="p-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200"><Globe size={15} className="text-teal-400" />접점 (Endpoints) <span className="text-xs font-normal text-slate-500">· 케이스의 상대경로에 주입되는 base URL</span></div>
            <Field label="웹 Base URL"><Input value={cfg.webUrl || ""} onChange={(e) => setEnvCfg({ webUrl: e.target.value })} placeholder="https://stg.tworld.co.kr" className="font-mono text-xs" /></Field>
            <Field label="API Base URL"><Input value={cfg.apiUrl || ""} onChange={(e) => setEnvCfg({ apiUrl: e.target.value })} placeholder="https://api-stg.tworld.co.kr" className="font-mono text-xs" /></Field>
          </Card>

          {/* 계정 풀 — 웹 로그인은 '흐름'이므로 케이스가 수행한다. 환경은 '누구로' 만 제공한다. */}
          <Card className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-200">계정 풀</div>
              <button onClick={appendAcct} className="text-xs text-teal-400">+ 계정</button>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 px-1 text-xs text-slate-500">
                <span className="w-20 shrink-0">역할</span><span className="w-28 shrink-0">계정 ID</span><span className="flex-1">비밀번호 (변수 참조)</span><span className="w-4" />
              </div>
              {(cfg.accts || []).map((aR, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-20 shrink-0"><Input value={aR.role || ""} onChange={(e) => updAcct(i, { role: e.target.value })} placeholder="일반" /></div>
                  <div className="w-28 shrink-0"><Input value={aR.acct} onChange={(e) => updAcct(i, { acct: e.target.value })} placeholder="qa_user02" className="font-mono text-xs" /></div>
                  <div className="min-w-0 flex-1">{secretRef(aR.secretRef, (val) => updAcct(i, { secretRef: val }), "${stg_test_pw}")}</div>
                  <button onClick={() => delAcct(i)} className="shrink-0 text-slate-500 hover:text-red-400" title="계정 삭제"><X size={12} /></button>
                </div>
              ))}
              {(!cfg.accts || cfg.accts.length === 0) && <div className="px-1 py-2 text-xs text-slate-600">이 환경의 계정이 없습니다 — + 계정으로 추가</div>}
            </div>
            <div className="text-xs text-slate-500">케이스의 <span className="text-slate-400">실행 계정 역할</span>과 같은 역할의 계정이 <span className="font-mono text-teal-400">{"${계정 ID}"}</span>·<span className="font-mono text-teal-400">{"${계정 비밀번호}"}</span>로 주입됩니다.</div>
          </Card>

          {hasApi && (
            <Card className="p-4 space-y-3">
              <div className="text-sm font-semibold text-slate-200">API 인증</div>
              <Field label="방식">
                <Select value={apiT} onChange={(e) => setSub("apiAuth", { type: e.target.value })}>
                  <option>API Key</option><option>Bearer 토큰 (정적)</option><option>OAuth 2.0 (Client Credentials)</option>
                </Select>
              </Field>

              {apiT === "API Key" && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="헤더 이름"><Input value={(cfg.apiAuth || {}).header || ""} onChange={(e) => setSub("apiAuth", { header: e.target.value })} placeholder="X-API-Key" className="font-mono text-xs" /></Field>
                  <Field label="키 (변수 참조)">{secretRef((cfg.apiAuth || {}).secretRef, (val) => setSub("apiAuth", { secretRef: val }), "${stg_api_key}")}</Field>
                </div>
              )}

              {apiT === "Bearer 토큰 (정적)" && (
                <Field label="토큰 (변수 참조)" hint="만료되지 않는 장기 토큰만 — 만료 토큰이면 OAuth 2.0">{secretRef((cfg.apiAuth || {}).secretRef, (val) => setSub("apiAuth", { secretRef: val }), "${stg_tworld_token}")}</Field>
              )}

              {apiT === "OAuth 2.0 (Client Credentials)" && (<>
                <Field label="토큰 엔드포인트"><Input value={(cfg.apiAuth || {}).tokenUrl || ""} onChange={(e) => setSub("apiAuth", { tokenUrl: e.target.value })} placeholder="https://auth-stg.tworld.co.kr/oauth2/token" className="font-mono text-xs" /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="client_id"><Input value={(cfg.apiAuth || {}).clientId || ""} onChange={(e) => setSub("apiAuth", { clientId: e.target.value })} placeholder="exq-qa-runner" className="font-mono text-xs" /></Field>
                  <Field label="client_secret (변수 참조)">{secretRef((cfg.apiAuth || {}).clientSecret, (val) => setSub("apiAuth", { clientSecret: val }), "${stg_oauth_secret}")}</Field>
                </div>
                <Field label="scope (선택)"><Input value={(cfg.apiAuth || {}).scope || ""} onChange={(e) => setSub("apiAuth", { scope: e.target.value })} placeholder="orders.read orders.write" className="font-mono text-xs" /></Field>
              </>)}
            </Card>
          )}
          </div>

          <div className="space-y-3">
          {/* 접속 조건 — 플랫폼 러너가 이 환경에 닿기 위한 조건.
              (자체 실행 러너(Self-Hosted)는 향후 확장 — 지금은 플랫폼 러너가 유일한 실행 주체) */}
          <Card className="p-4 space-y-3">
            <div className="text-sm font-semibold text-slate-200">접속 조건</div>
            <div className="rounded-lg bg-slate-800 p-2.5 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">실행 러너 egress IP <span className="font-mono text-slate-300">203.248.252.0/24</span><button onClick={() => flash("egress IP 대역을 복사했습니다")} className="text-teal-400">복사</button></div>
              <div className="mt-1 text-slate-500">대상 방화벽·IP 화이트리스트에 등록해야 접속됩니다.</div>
            </div>
            <div className="border-t border-slate-800 pt-2">
              <TRow label="Basic Auth (htpasswd)" on={(cfg.access || {}).basicAuth} set={(v) => setSub("access", { basicAuth: v })} />
              {(cfg.access || {}).basicAuth && (
                <div className="mb-1 mt-2 grid grid-cols-2 gap-3">
                  <Field label="사용자명"><Input value={(cfg.access || {}).baUser || ""} onChange={(e) => setSub("access", { baUser: e.target.value })} placeholder="stg" className="font-mono text-xs" /></Field>
                  <Field label="비밀번호 (변수 참조)">{secretRef((cfg.access || {}).baPw, (val) => setSub("access", { baPw: val }), "${stg_basic_pw}")}</Field>
                </div>
              )}
              <TRow label="자체서명 TLS 무시" on={(cfg.access || {}).tlsIgnore} set={(v) => setSub("access", { tlsIgnore: v })} />
            </div>
          </Card>

          {/* 배포 감지 — LQA 챗봇 "모델·배포 소스"와 동일 구조: 3택 + 선택한 방식의 필드만 노출 */}
          <Card className="p-4 space-y-2.5">
            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200"><Wrench size={15} className="text-teal-400" />배포 감지 <span className="text-xs font-normal text-slate-500">· 실행 계획의 &quot;배포 시&quot; 트리거가 상속 · 실행 이력에 빌드 기록</span></div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="배포 감지 방식"><Select value={verMode} onChange={(e) => setSub("deploy", { mode: e.target.value })}><option>수동</option><option>배포 웹훅 알림</option><option>버전 엔드포인트 폴링</option></Select></Field>
              <Field label="현재 배포 버전">
                {verMode === "수동"
                  ? <Input value={cfg.ver && cfg.ver !== "-" ? cfg.ver : ""} onChange={(e) => setEnvCfg({ ver: e.target.value || "-" })} placeholder="v5.12.0-rc" className="font-mono text-xs" />
                  : <div className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 font-mono text-xs text-slate-300">{cfg.ver && cfg.ver !== "-" ? cfg.ver : "미감지"}</div>}
              </Field>
            </div>

            {verMode === "배포 웹훅 알림" && (
              <div className="space-y-2.5 rounded-lg border border-slate-800 p-3">
                <Field label="수신 웹훅 URL"><div className="flex items-center gap-2"><div className="flex-1 truncate rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono text-xs text-slate-300">{hookUrl}</div><Btn icon={Copy} onClick={() => flash("웹훅 URL을 복사했습니다")}>복사</Btn></div></Field>
                <Field label="서명 시크릿"><div className="flex items-center gap-2"><div className="flex-1 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 font-mono text-xs text-slate-400">whsec_••••••••••••</div><Btn icon={Copy} onClick={() => flash("서명 시크릿을 복사했습니다")}>복사</Btn><Btn onClick={() => flash("서명 시크릿이 재발급되었습니다")}>재발급</Btn></div></Field>
                <div className="text-xs text-slate-500">CD가 <span className="font-mono text-slate-400">{'{ "version": "…" }'}</span>를 이 URL로 전송 <span className="text-slate-600">· 마지막 수신 {cfg.ver && cfg.ver !== "-" ? "2시간 전" : "없음"}</span></div>
              </div>
            )}

              {verMode === "버전 엔드포인트 폴링" && (
              <div className="space-y-2.5 rounded-lg border border-slate-800 p-3">
                <div className="grid grid-cols-3 gap-2">
                  {/* 버전 엔드포인트는 base URL과 다른 호스트일 수 있다 — 상대경로를 허용하면 기준이 모호해진다 */}
                  <div className="col-span-2"><Field label="폴링 대상 URL"><Input value={(cfg.deploy || {}).verUrl || ""} onChange={(e) => setSub("deploy", { verUrl: e.target.value })} placeholder="https://stg-cs.tworld.co.kr/health" className="font-mono text-xs" /></Field></div>
                  <Field label="폴링 주기"><Select value={(cfg.deploy || {}).interval || "15분"} onChange={(e) => setSub("deploy", { interval: e.target.value })}><option>5분</option><option>15분</option><option>1시간</option><option>6시간</option><option>24시간</option></Select></Field>
                </div>
                <div className="flex items-end gap-2">
                  <div className="flex-1"><Field label="버전 필드 경로 (JSONPath)"><Input value={(cfg.deploy || {}).verPath || ""} onChange={(e) => setSub("deploy", { verPath: e.target.value })} placeholder="$.version" className="font-mono text-xs" /></Field></div>
                  <Btn icon={RefreshCw} onClick={() => { const nv = "v" + (5 + sys.id) + "." + Math.floor(Math.random() * 20) + "." + Math.floor(Math.random() * 9); setEnvCfg({ ver: nv }); flash("버전 조회 완료 · " + nv); }}>지금 확인</Btn>
                </div>
              </div>
            )}
          </Card>
          </div>
          </div>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setModal(null)}>
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5"><h3 className="font-semibold text-slate-100">{modal === "target" ? "대상 추가" : "환경 추가"}</h3><button onClick={() => setModal(null)} className="text-slate-500 hover:text-slate-200"><X size={18} /></button></div>
            <div className="space-y-3.5 p-5">
              {modal === "target" && (<>
                <Field label="대상 이름"><Input value={tf.name} onChange={(e) => setTf({ ...tf, name: e.target.value })} placeholder="예: T월드" /></Field>
                <Field label="첫 환경"><Select value={tf.env} onChange={(e) => setTf({ ...tf, env: e.target.value })}>{ENV_NAMES.map((n) => <option key={n}>{n}</option>)}</Select></Field>
                <EndpointGroup webUrl={tf.webUrl} apiUrl={tf.apiUrl} set={(p) => setTf({ ...tf, ...p })} />
                <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setModal(null)}>취소</Btn><Btn kind="primary" icon={Save} onClick={addTarget}>추가</Btn></div>
              </>)}
              {modal === "env" && (<>
                {/* 이미 등록된 환경은 목록에서 제외 — 환경 이름은 계획의 참조 키라 중복될 수 없다 */}
                <Field label="환경" hint="이미 등록된 환경은 선택할 수 없습니다"><Select value={ef.env} onChange={(e) => setEf({ ...ef, env: e.target.value })}>{envOpts.map((n) => <option key={n}>{n}</option>)}</Select></Field>
                <EndpointGroup webUrl={ef.webUrl} apiUrl={ef.apiUrl} set={(p) => setEf({ ...ef, ...p })} />
                <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setModal(null)}>취소</Btn><Btn kind="primary" icon={Save} onClick={addEnv}>추가</Btn></div>
              </>)}
            </div>
          </div>
        </div>
      )}

      {/* 참조 무결성 — 실행 계획이 쓰고 있으면 삭제를 막는다 */}
      {block && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setBlock(null)}>
          <div className="w-full max-w-md rounded-xl border border-amber-800 bg-slate-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 border-b border-slate-800 px-5 py-3.5"><AlertTriangle size={16} className="text-amber-400" /><h3 className="font-semibold text-slate-100">삭제할 수 없습니다</h3></div>
            <div className="space-y-3 p-5 text-sm">
              <div className="text-slate-300"><span className="font-semibold text-amber-300">{block.what}</span>을(를) 참조하는 실행 계획이 <span className="font-semibold text-amber-300">{block.plans.length}건</span> 있습니다.</div>
              <div className="space-y-1 rounded-lg border border-slate-800 bg-slate-950 p-3">
                {block.plans.map((p) => (<div key={p.id} className="flex items-center gap-2 text-xs"><ClipboardList size={12} className="text-slate-500" /><span className="text-slate-300">{p.name}</span></div>))}
              </div>
              <div className="text-xs text-slate-500">해당 계획의 대상·환경을 먼저 바꾸거나 계획을 삭제한 뒤 다시 시도하세요.</div>
              <div className="flex justify-end pt-1"><Btn kind="primary" onClick={() => setBlock(null)}>확인</Btn></div>
            </div>
          </div>
        </div>
      )}
      <Toast msg={msg} />
    </div>
  );
}
/* ═══════════ 11. 실행 계획 ═══════════ */
const TG = ({ on, onClick }) => (
  <button onClick={onClick} className={"relative h-5 w-9 rounded-full transition " + (on ? "bg-teal-600" : "bg-slate-700")}><span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all" style={{ left: on ? 18 : 2 }} /></button>
);
export function FqaPlanScreen({ nav }) {
  const { fqaSuites, fqaSystems, fqaCases, fqaRuns, addFqaRun, updateFqaRun, fqaPlans, addFqaPlan, updateFqaPlan, removeFqaPlan, jiraConfig } = useApp();
  const [msg, flash] = useToast();
  // 대상·환경은 ID 참조 { systemId, env } — 이름 변경에도 참조가 깨지지 않는다
  const targetOpts = (fqaSystems || []).flatMap((sy) => (sy.envs || []).map((e) => ({ systemId: sy.id, env: e.env, label: sy.name + " · " + e.env })));
  const keyOf = (ref) => (ref ? ref.systemId + "|" + ref.env : "");
  const envOf = (ref) => { const sy = (fqaSystems || []).find((s) => s.id === (ref || {}).systemId); return sy ? (sy.envs || []).find((e) => e.env === (ref || {}).env) : null; };
  const labelOf = (ref) => { const o = targetOpts.find((t) => keyOf(t) === keyOf(ref)); return o ? o.label : "미지정"; };
  // 이 환경이 제공하는 접점 → 실행 옵션 노출 여부를 결정 (platform 축 없음)
  const surfOf = (ref) => { const e = envOf(ref) || {}; return { web: !!e.webUrl, api: !!e.apiUrl }; };
  const defRef = targetOpts[0] ? { systemId: targetOpts[0].systemId, env: targetOpts[0].env } : { systemId: 0, env: "" };
  const [addOpen, setAddOpen] = useState(false);
  const [nf, setNf] = useState({ name: "", targetRef: defRef, suites: [], tags: "" });
  const [selId, setSelId] = useState(fqaPlans[0] ? fqaPlans[0].id : null);
  const sel = fqaPlans.find((p) => p.id === selId) || fqaPlans[0] || { id: 0, name: "-", targetRef: defRef, suites: [], tags: "" };
  const [targetRef, setTargetRef] = useState(sel.targetRef || defRef);
  const [suites, setSuites] = useState(sel.suites || []);
  const toggleSuite = (n) => setSuites((s) => (s.includes(n) ? s.filter((x) => x !== n) : [...s, n]));
  const surf = surfOf(targetRef);
  const [tags, setTags] = useState(sel.tags);
  const [brow, setBrow] = useState(sel.brow || ["Chrome"]);
  const [res, setRes] = useState(sel.res || "1920×1080");
  const [headless, setHeadless] = useState(sel.headless !== false);
  const [workers, setWorkers] = useState(sel.workers || "4");
  const [retry, setRetry] = useState(sel.retry != null ? sel.retry : 1);
  const [onfail, setOnfail] = useState(sel.onfail || "계속 진행");
  const [video, setVideo] = useState(sel.video || "실패 시만");
  const [apiTimeout, setApiTimeout] = useState(sel.timeout || 30);
  const [gate, setGate] = useState(sel.gate != null ? sel.gate : 95);
  const [planStatus, setPlanStatus] = useState(sel.status || "초안");
  const [jira, setJira] = useState(sel.jira || { override: false });
  const jgc = jiraConfig || {};
  const enableJira = (on) => setJira(on ? { override: true, project: jira.project || jgc.project || "", issueType: jira.issueType || jgc.issueType || "Bug", assignee: jira.assignee != null ? jira.assignee : (jgc.assignee || ""), labels: jira.labels != null ? jira.labels : (jgc.labels || ""), titleTpl: jira.titleTpl || jgc.titleTpl || "" } : { override: false });
  const setJf = (patch) => setJira((j) => ({ ...j, ...patch }));
  const toggleB = (b) => setBrow(brow.includes(b) ? brow.filter((x) => x !== b) : [...brow, b]);
  const pick = (p) => { setSelId(p.id); setTargetRef(p.targetRef || defRef); setSuites(p.suites || []); setTags(p.tags); setBrow(p.brow || ["Chrome"]); setRes(p.res || "1920×1080"); setHeadless(p.headless !== false); setWorkers(p.workers || "4"); setRetry(p.retry != null ? p.retry : 1); setOnfail(p.onfail || "계속 진행"); setVideo(p.video || "실패 시만"); setApiTimeout(p.timeout != null ? p.timeout : 30); setGate(p.gate != null ? p.gate : 95); setPlanStatus(p.status || "초안"); setJira(p.jira || { override: false }); };
  const saveCfg = () => { updateFqaPlan(sel.id, { targetRef, suites, tags, brow, res, headless, workers, retry, onfail, video, timeout: apiTimeout, gate, status: planStatus, jira }); flash(sel.name + " 설정 저장됨"); };
  const dirty = JSON.stringify({ targetRef, suites, tags, brow, res, headless, workers, retry, onfail, video, timeout: apiTimeout, gate, status: planStatus, jira }) !== JSON.stringify({ targetRef: sel.targetRef || defRef, suites: sel.suites || [], tags: sel.tags, brow: sel.brow || ["Chrome"], res: sel.res || "1920×1080", headless: sel.headless !== false, workers: sel.workers || "4", retry: sel.retry != null ? sel.retry : 1, onfail: sel.onfail || "계속 진행", video: sel.video || "실패 시만", timeout: sel.timeout != null ? sel.timeout : 30, gate: sel.gate != null ? sel.gate : 95, status: sel.status || "초안", jira: sel.jira || { override: false } });
  const choosePlan = (p) => { if (p.id === sel.id) return; if (dirty && !window.confirm("저장하지 않은 변경이 있습니다. 이동하시겠습니까?")) return; pick(p); };
  const createPlan = () => { const nm = nf.name.trim(); if (!nm) { flash("계획 이름을 입력하세요"); return; } if (!nf.suites.length) { flash("스위트를 1개 이상 선택하세요"); return; } const id = Math.max(0, ...fqaPlans.map((x) => x.id)) + 1; const np = { id, name: nm, targetRef: nf.targetRef, suites: nf.suites, tags: nf.tags, sched: "예약 없음", status: "초안", brow: ["Chrome"], res: "1920×1080", headless: true, workers: "4", retry: 1, onfail: "계속 진행", video: "실패 시만", timeout: 30, gate: 95 }; addFqaPlan(np); pick(np); setAddOpen(false); setNf({ name: "", targetRef: defRef, suites: [], tags: "" }); flash(nm + " 계획 생성 (초안)"); };
  const delPlan = (pl) => { if (!window.confirm(pl.name + " 계획을 삭제할까요?")) return; removeFqaPlan(pl.id); if (selId === pl.id) { const rest = fqaPlans.filter((x) => x.id !== pl.id); setSelId(rest[0] ? rest[0].id : null); } flash(pl.name + " 삭제됨"); };
  return (
    <div className="space-y-4">
      <PageToolbar desc="대상·스위트·실행옵션·스케줄 정의" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-3">
          <Btn kind="primary" icon={Plus} className="w-full" onClick={() => setAddOpen(true)}>새 실행 계획</Btn>
          {fqaPlans.map((p) => (
            <Card key={p.id} className={"cursor-pointer p-3 " + (sel.id === p.id ? "border-teal-500" : "hover:border-slate-700")} >
              <div onClick={() => choosePlan(p)}>
                <div className="flex items-center justify-between"><div className="text-sm font-semibold text-slate-100">{p.name}</div><div className="flex items-center gap-1.5"><Badge kind={p.status === "활성" ? "pass" : "draft"}>{p.status}</Badge><button onClick={(e) => { e.stopPropagation(); delPlan(p); }} className="text-slate-500 hover:text-red-400" title="계획 삭제"><X size={13} /></button></div></div>
                <div className="mt-1 text-xs text-slate-500">{labelOf(p.targetRef)}</div>
                <div className="mt-1 text-xs text-slate-500">{(p.suites || []).join(" · ") || "스위트 없음"} · {p.sched}</div>
                <div className="mt-0.5 text-xs text-slate-600">수정 {p.updatedBy || "—"} · {p.updatedAt || "—"}</div>
              </div>
            </Card>
          ))}
        </div>
        <Card className="col-span-9 p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="text-base font-semibold text-slate-100">상세 설정 — {sel.name}</div>
            <div className="flex items-center gap-3"><div className="flex items-center gap-2 text-sm text-slate-300"><span>{planStatus === "활성" ? "활성" : "초안"}</span><TG on={planStatus === "활성"} onClick={() => setPlanStatus(planStatus === "활성" ? "초안" : "활성")} /></div>{dirty && <span className="text-xs text-amber-300">미저장 변경</span>}<Btn kind="primary" icon={RefreshCw} onClick={saveCfg} disabled={!dirty}>설정 저장</Btn></div>
          </div>
          <div className="mb-4 flex items-center gap-3 text-xs text-slate-500"><span>생성 <span className="text-slate-400">{sel.createdBy || "—"}</span> · {sel.createdAt || "—"}</span><span className="text-slate-600">·</span><span>수정 <span className="text-slate-400">{sel.updatedBy || "—"}</span> · {sel.updatedAt || "—"}</span></div>
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-3.5">
              <Field label="대상·환경" hint={"접점: " + [surf.web ? "웹" : null, surf.api ? "API" : null].filter(Boolean).join("+") || "없음"}>
                <Select value={keyOf(targetRef)} onChange={(e) => { const o = targetOpts.find((t) => keyOf(t) === e.target.value); if (o) setTargetRef({ systemId: o.systemId, env: o.env }); }}>
                  {targetOpts.map((t) => <option key={keyOf(t)} value={keyOf(t)}>{t.label}</option>)}
                </Select>
              </Field>
              <Field label="대상 스위트 (다중 선택)" hint="선택한 스위트의 승인 케이스가 실행 대상">
                <div className="grid grid-cols-2 gap-2">
                  {fqaSuites.map((x) => (
                    <button key={x.id} onClick={() => toggleSuite(x.name)} className={"rounded-lg border px-2 py-1.5 text-left text-xs " + (suites.includes(x.name) ? "border-teal-500 bg-teal-900 text-teal-200" : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700")}>{x.name}</button>
                  ))}
                </div>
              </Field>
              {suites.length === 0 && <div className="rounded-lg border border-amber-800 bg-amber-950 px-2.5 py-1.5 text-xs text-amber-300">⚠ 스위트를 1개 이상 선택하세요.</div>}
              <Field label="태그 필터" hint="@smoke @regression @critical 등"><Input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="regression,critical" /></Field>
              <Field label="품질 게이트 (PASS 기준 %)"><Input type="number" value={gate} onChange={(e) => setGate(+e.target.value || 0)} className="w-28" /></Field>
            </div>
            <div className="space-y-3.5">
              {surf.web && (
                <>
                  <Field label="브라우저 (다중) · 화면 스텝">
                    <div className="grid grid-cols-2 gap-2">
                      {["Chrome", "Firefox", "Safari", "Mobile Chrome"].map((b) => (
                        <button key={b} onClick={() => toggleB(b)} className={"rounded-lg border px-2 py-1.5 text-xs " + (brow.includes(b) ? "border-teal-500 bg-teal-900 text-teal-200" : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700")}>{b}</button>
                      ))}
                    </div>
                  </Field>
                  <div className="grid grid-cols-2 gap-3">
                    <Field label="해상도"><Select value={res} onChange={(e) => setRes(e.target.value)}><option>1920×1080</option><option>1440×900</option><option>1280×720</option><option>375×812 (모바일)</option></Select></Field>
                    <Field label="영상 녹화"><Select value={video} onChange={(e) => setVideo(e.target.value)}><option>녹화 안 함</option><option>실패 시만</option><option>전체 녹화</option></Select></Field>
                  </div>
                </>
              )}
              {surf.api && <Field label="요청 타임아웃(초) · 요청 스텝"><Input type="number" value={apiTimeout} onChange={(e) => setApiTimeout(+e.target.value || 0)} className="w-32" /></Field>}
              <div className="grid grid-cols-2 gap-3">
                <Field label="병렬 workers"><Select value={workers} onChange={(e) => setWorkers(e.target.value)}><option>1 (순차)</option><option>2</option><option>4</option><option>auto</option></Select></Field>
                <Field label="재시도"><Input type="number" value={retry} onChange={(e) => setRetry(+e.target.value || 0)} /></Field>
              </div>
              <div className="flex items-center gap-4">
                <Field label="종료 조건"><Select value={onfail} onChange={(e) => setOnfail(e.target.value)}><option>계속 진행</option><option>첫 에러 시 중단</option></Select></Field>
                {surf.web && <div className="flex items-center gap-2 pt-5 text-sm text-slate-300"><span>Headless</span><TG on={headless} onClick={() => setHeadless(!headless)} /></div>}
              </div>
              {surf.web && surf.api && <div className="rounded-lg bg-slate-800 p-3 text-xs text-slate-400">이 환경은 <span className="text-slate-300">웹·API 접점을 모두</span> 제공합니다 — 브라우저 옵션은 화면 스텝에, 타임아웃은 요청 스텝에 적용됩니다(혼합 케이스 실행 가능).</div>}
            </div>
          </div>
          <div className="mt-5 border-t border-slate-800 pt-4">
            {planStatus === "활성" ? (
              <>
                <ScheduleConfig events={fqaEvents(envOf(targetRef), labelOf(targetRef))} singleSelect manualHint="자동 실행 없음 — 수동 실행으로만 수행합니다." toast={flash} />
                <div className="mt-3 text-xs text-slate-500">스케줄·이벤트 트리거 실행은 항상 켜진 <span className="text-slate-300">공유/CI 러너</span>에서 무인 수행됩니다 — 저작용 개인 로컬 러너와 분리.</div>
              </>
            ) : (
              <div className="rounded-lg border border-amber-800 bg-amber-950 px-3 py-2.5 text-xs text-amber-300">이 계획은 <span className="font-semibold">초안</span>입니다 — 스케줄·이벤트(무인) 실행 설정은 <span className="font-semibold">활성화</span> 후 가능합니다. 초안 상태에서는 수동 실행만 됩니다.</div>
            )}
          </div>
          {(jgc.connected !== false) && (
          <div className="mt-5 border-t border-slate-800 pt-5">
            <div className="flex items-center justify-between">
              <div className="text-sm font-semibold text-slate-200">결함 트래커 (Jira)</div>
              <div className="flex items-center gap-2 text-xs text-slate-400">이 계획 재정의 <TG on={!!jira.override} onClick={() => enableJira(!jira.override)} /></div>
            </div>
            {!jira.override ? (
              <div className="mt-2 rounded-lg bg-slate-800 p-3 text-xs text-slate-400">전역 Jira 설정 사용 · 프로젝트 <span className="text-slate-300">{jgc.project || "—"}</span> · 이슈유형 {jgc.issueType || "—"} <span className="text-slate-600">(결함 화면의 Jira 연동에서 관리)</span></div>
            ) : (
              <div className="mt-3 space-y-3">
                <div className="text-xs text-slate-500">연결(URL·인증)은 전역, 이 계획의 결함 라우팅만 재정의합니다.</div>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="프로젝트 키"><Input value={jira.project || ""} onChange={(e) => setJf({ project: e.target.value })} placeholder="WEBQA" /></Field>
                  <Field label="이슈 유형"><Select value={jira.issueType || "Bug"} onChange={(e) => setJf({ issueType: e.target.value })}><option>Bug</option><option>Task</option><option>Story</option></Select></Field>
                  <Field label="기본 담당자"><Input value={jira.assignee || ""} onChange={(e) => setJf({ assignee: e.target.value })} placeholder="assignee" /></Field>
                </div>
                <Field label="라벨 (쉼표 구분)"><Input value={jira.labels || ""} onChange={(e) => setJf({ labels: e.target.value })} placeholder="fqa, web" /></Field>
              </div>
            )}
          </div>
          )}
        </Card>
      </div>
      {addOpen && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setAddOpen(false)}>
          <div className="w-full max-w-md rounded-xl border border-slate-800 bg-slate-900 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between border-b border-slate-800 px-5 py-3.5"><h3 className="font-semibold text-slate-100">새 실행 계획</h3><button onClick={() => setAddOpen(false)} className="text-slate-500 hover:text-slate-200"><X size={18} /></button></div>
            <div className="space-y-3.5 p-5">
              <Field label="계획 이름"><Input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder="예: 로그인 회귀 (스테이징)" /></Field>
              <Field label="대상·환경">
                <Select value={keyOf(nf.targetRef)} onChange={(e) => { const o = targetOpts.find((t) => keyOf(t) === e.target.value); if (o) setNf({ ...nf, targetRef: { systemId: o.systemId, env: o.env } }); }}>
                  {targetOpts.map((t) => <option key={keyOf(t)} value={keyOf(t)}>{t.label}</option>)}
                </Select>
              </Field>
              <Field label="대상 스위트 (다중 선택)">
                <div className="grid grid-cols-2 gap-2">
                  {fqaSuites.map((x) => (
                    <button key={x.id} onClick={() => setNf({ ...nf, suites: nf.suites.includes(x.name) ? nf.suites.filter((s) => s !== x.name) : [...nf.suites, x.name] })} className={"rounded-lg border px-2 py-1.5 text-left text-xs " + (nf.suites.includes(x.name) ? "border-teal-500 bg-teal-900 text-teal-200" : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700")}>{x.name}</button>
                  ))}
                </div>
              </Field>
              <Field label="태그 필터" hint="@smoke @regression @critical 등"><Input value={nf.tags} onChange={(e) => setNf({ ...nf, tags: e.target.value })} placeholder="regression,critical" /></Field>
              <div className="text-xs text-slate-500">생성 시 <span className="text-slate-300">초안</span> 상태로 추가됩니다 — 실행 옵션·스케줄은 상세 설정에서 이어서 정의합니다.</div>
            </div>
            <div className="flex justify-end gap-2 border-t border-slate-800 px-5 py-3.5"><Btn onClick={() => setAddOpen(false)}>취소</Btn><Btn kind="primary" icon={Plus} onClick={createPlan}>계획 생성</Btn></div>
          </div>
        </div>
      )}
      <Toast msg={msg} />
    </div>
  );
}

/* ═══════════ AI 기반 테스트케이스 자동 생성 (구 aigen.jsx 병합) ═══════════ */
/* ───────── primitives (lqa-demo 톤) ───────── */

/* ───────── 샘플 생성 데이터 ───────── */
const STEPS = [
  ["이동", "/login", "-"],
  ["입력", "[data-testid=userid]", "${계정 ID}"],
  ["입력", "[data-testid=password]", "${계정 비밀번호}"],
  ["클릭", "role=button[로그인]", "-"],
  ["화면 검증", "[data-testid=welcome]", "text = \"환영합니다\""],
];
const SAMPLE = [
  { id: "TC-W001", title: "로그인 정상 동작", tags: ["@smoke", "@login"], pri: "높음", steps: 5, asserts: 2 },
  { id: "TC-W002", title: "잘못된 비밀번호 오류 메시지", tags: ["@regression", "@login"], pri: "중간", steps: 4, asserts: 1 },
  { id: "TC-W003", title: "3회 실패 시 계정 잠금", tags: ["@critical", "@login"], pri: "높음", steps: 6, asserts: 2 },
  { id: "TC-W004", title: "자동 로그인(Remember Me)", tags: ["@login"], pri: "중간", steps: 5, asserts: 1 },
  { id: "TC-W005", title: "로그아웃 후 세션 즉시 만료", tags: ["@regression"], pri: "중간", steps: 4, asserts: 1 },
  { id: "TC-W006", title: "이메일 형식 검증(회원가입)", tags: ["@signup"], pri: "낮음", steps: 4, asserts: 1 },
  { id: "TC-W007", title: "중복 이메일 체크", tags: ["@signup"], pri: "중간", steps: 4, asserts: 1 },
  { id: "TC-W008", title: "비밀번호 규칙 위반 처리", tags: ["@signup", "@regression"], pri: "중간", steps: 5, asserts: 2 },
];
const priKind = { "높음": "crit", "중간": "warn", "낮음": "info" };

export function FqaAiGenScreen({ onDone }) {
  const { addFqaCase, fqaSuites } = useApp();
  const [src, setSrc] = useState("직접 입력");
  const [req, setReq] = useState("T월드 앱 로그인 기능\n- 전화번호/비밀번호로 로그인\n- 3회 실패 시 계정 잠금\n- 자동 로그인 (Remember Me)\n- 로그아웃 시 세션 즉시 만료");
  const [cov, setCov] = useState("Standard");
  const [suite, setSuite] = useState("로그인 / 인증");
  const [edge, setEdge] = useState(true);
  const [phase, setPhase] = useState("idle"); // idle | running | done
  const [rows, setRows] = useState([]);
  const [picked, setPicked] = useState(new Set());
  const [open, setOpen] = useState(null);
  const [jiraKey, setJiraKey] = useState("");
  const [prev, setPrev] = useState("스텝");
  const [toast, setToast] = useState("");

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const generate = () => {
    setPhase("running");
    setTimeout(() => { setRows(SAMPLE); setPicked(new Set()); setPhase("done"); }, 750);
  };
  const toggle = (id) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const commit = (msg) => { if (!picked.size) { flash("케이스를 선택하세요"); return; } if (msg.includes("등록")) { const n = picked.size; rows.filter((r) => picked.has(r.id)).forEach((r, i) => addFqaCase({ id: "TC-AI-" + Date.now().toString().slice(-4) + "-" + i, name: r.title, suite, tags: (r.tags || []).join(","), status: "검토중", level: "Low-Code", dataset: "-", steps: aiSteps() })); if (onDone) { onDone(n + "건 검토중 등록 · 목록에 추가됨"); return; } } flash(picked.size + msg); };


  return (
    <>
      <div className="grid grid-cols-12 gap-4">
        {/* ── 좌: 입력 ── */}
        <div className="col-span-5 space-y-4">
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[["직접 입력", FileText], ["Jira", Bug], ["파일", Upload]].map(([s, Ic]) => (
                <button key={s} onClick={() => setSrc(s)} className={"flex flex-col items-center gap-1 rounded-lg border px-2 py-2.5 text-xs " + (src === s ? "border-teal-500 bg-teal-900 text-teal-200" : "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700")}>
                  <Ic size={16} />{s}
                </button>
              ))}
            </div>

            {src === "직접 입력" && (
              <Field label="요구사항 / 기능 명세">
                <textarea value={req} onChange={(e) => setReq(e.target.value)} rows={6} className="w-full rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-teal-500" />
              </Field>
            )}
            {src === "Jira" && (
              <Field label="Jira 이슈 키" hint="설정 > Jira 연동에서 토큰 입력 필요">
                <div className="flex gap-2">
                  <input value={jiraKey} onChange={(e) => setJiraKey(e.target.value)} placeholder="DEF-1842" className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-teal-500" />
                  <Btn onClick={() => flash((jiraKey.trim() || "DEF-1842") + " 이슈 명세를 불러왔습니다")}>가져오기</Btn>
                </div>
              </Field>
            )}
            {src === "파일" && (
              <Field label="명세 파일 업로드" hint=".docx / .pdf / .xlsx">
                <label className="flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-slate-700 bg-slate-800 px-3 py-7 text-sm text-slate-400 hover:border-slate-600">
                  <Upload size={20} className="text-slate-500" />드래그 또는 클릭으로 업로드
                  <input type="file" accept=".docx,.pdf,.xlsx" className="hidden" />
                </label>
              </Field>
            )}
          </Card>

          <Card className="p-4 space-y-3.5">
            <div className="text-sm font-semibold text-slate-200">생성 옵션</div>
            <Field label="등록 스위트" hint="생성된 TC가 배치될 스위트"><Select value={suite} onChange={(e) => setSuite(e.target.value)}>{(fqaSuites || []).map((x) => <option key={x.id} value={x.name}>{x.name}</option>)}</Select></Field>
            <Field label="커버리지"><Seg options={["Basic", "Standard", "Full"]} value={cov} onChange={setCov} /></Field>
            <div className="flex items-center justify-between text-sm text-slate-300"><span>경계·예외 케이스 포함</span>
              <button onClick={() => setEdge(!edge)} className={"relative h-5 w-9 rounded-full transition " + (edge ? "bg-teal-600" : "bg-slate-700")}>
                <span className="absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all" style={{ left: edge ? 18 : 2 }} />
              </button>
            </div>
            <Btn kind="primary" icon={Sparkles} className="w-full" onClick={generate}>{phase === "running" ? "생성 중…" : "AI 테스트 생성"}</Btn>
          </Card>
        </div>

        {/* ── 우: 결과 ── */}
        <div className="col-span-7">
          <Card className="overflow-hidden">
            <div className="flex items-center justify-between border-b border-slate-800 px-4 py-3">
              <div className="text-sm font-semibold text-slate-200">생성 결과</div>
              {phase === "done" && (
                <div className="flex items-center gap-4 text-xs">
                  <span className="text-slate-400">케이스 <span className="font-semibold text-teal-400">{rows.length}</span></span>
                  <span className="text-slate-400">커버리지 <span className="font-semibold text-teal-400">94%</span></span>
                  <span className="text-slate-400">생성 <span className="font-semibold text-teal-400">2.1s</span></span>
                </div>
              )}
            </div>

            {phase !== "done" ? (
              <div className="flex flex-col items-center justify-center gap-2 px-4 py-20 text-center text-sm text-slate-500">
                <Brain size={28} className="text-slate-700" />
                {phase === "running" ? "AI가 테스트 케이스를 생성하는 중…" : "요구사항을 입력하고 \"AI 테스트 생성\"을 클릭하세요"}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-slate-800 bg-slate-900 px-4 py-2 text-xs text-slate-400">
                  <div className="flex items-center gap-2"><button onClick={() => setPicked(picked.size === rows.length ? new Set() : new Set(rows.map((r) => r.id)))} className="rounded border border-slate-700 bg-slate-800 px-2 py-0.5 text-slate-300 hover:bg-slate-700">{picked.size === rows.length ? "전체 해제" : "전체 선택"}</button><span>선택 {picked.size}/{rows.length} · 상태 <Badge kind="draft">검토중</Badge></span></div>
                  <div className="flex items-center gap-2">
                    <span className="text-slate-500">미리보기 형식</span>
                    <Seg options={["스텝", "스크립트"]} value={prev} onChange={(v) => { setPrev(v); if (open === null && rows.length) setOpen(rows[0].id); }} />
                  </div>
                </div>
                <div className="overflow-y-auto" style={{ maxHeight: 420 }}>
                  {rows.map((r) => (
                    <div key={r.id} className="border-b border-slate-800">
                      <div className="flex items-center gap-3 px-4 py-3">
                        <input type="checkbox" checked={picked.has(r.id)} onChange={() => toggle(r.id)} className="accent-teal-500" />
                        <span className="font-mono text-xs text-teal-400">{r.id}</span>
                        <span className="flex-1 text-sm text-slate-200">{r.title}</span>
                        <Badge kind={priKind[r.pri]}>{r.pri}</Badge>
                        <span className="text-xs text-slate-500">{r.steps}스텝 · 검증 {r.asserts}</span>
                        <button onClick={() => setOpen(open === r.id ? null : r.id)} className="text-slate-500 hover:text-slate-300">
                          {open === r.id ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                        </button>
                      </div>
                      <div className="flex flex-wrap gap-1.5 px-4 pb-2 pl-11">
                        {r.tags.map((t) => <span key={t} className="inline-flex items-center gap-1 rounded bg-slate-800 px-1.5 py-0.5 text-xs text-slate-400"><Tag size={10} />{t}</span>)}
                      </div>
                      {open === r.id && (
                        <div className="bg-slate-950 px-4 pb-3 pl-11">
                          <div className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                            {prev === "스텝" ? (
                              <>
                                <div className="mb-2 text-xs font-semibold text-slate-400">스텝 미리보기 (Low-Code · Web)</div>
                                <ol className="space-y-1.5">
                                  {STEPS.slice(0, r.steps).map((s, i) => (
                                    <li key={i} className="flex items-center gap-2 text-xs">
                                      <span className="flex h-5 w-5 items-center justify-center rounded bg-slate-800 text-slate-400">{i + 1}</span>
                                      <span className={"font-medium " + (s[0].startsWith("검증") ? "text-amber-300" : "text-slate-200")}>{s[0]}</span>
                                      <span className="font-mono text-slate-500">{s[1]}</span>
                                      <span className="text-slate-400">{s[2]}</span>
                                    </li>
                                  ))}
                                </ol>
                              </>
                            ) : (
                              <>
                                <div className="mb-2 text-xs font-semibold text-slate-400">스크립트 미리보기 (Playwright · TypeScript)</div>
                                <pre className="overflow-auto text-xs text-slate-300" style={{ fontFamily: "monospace" }}>{"import { test, expect } from '@playwright/test';\n\ntest('" + r.id + " " + r.title + "', async ({ page }) => {\n  // " + r.steps + " steps · " + r.asserts + " assertions (미리보기)\n  await page.goto('https://www.tworld.co.kr');\n  // ...\n  await expect(page).toHaveURL(/tworld/);\n});"}</pre>
                              </>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-4 py-3">
                  <Btn icon={Download} disabled={!picked.size} onClick={() => commit("건 내보내기 완료")}>내보내기</Btn>
                  <Btn kind="primary" icon={Plus} disabled={!picked.size} onClick={() => commit("건 검토중으로 등록")}>검토중으로 등록</Btn>
                </div>
              </>
            )}
          </Card>
          <div className="mt-2 text-xs text-slate-500">생성된 케이스는 <span className="text-amber-300">검토중</span> 상태(Low-Code 관리)로 등록되며, 검토·승인 후 실행 대상이 됩니다.</div>
        </div>
      </div>
      {toast && <div className="fixed bottom-5 right-5 rounded-lg border border-teal-700 bg-teal-900 px-4 py-2.5 text-sm text-teal-100 shadow-xl">{toast}</div>}
    </>
  );
}
