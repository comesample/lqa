import { useState } from "react";
import {
  Brain, FileText, Bug, Upload, Video, Globe, Smartphone, Code2, Plus,
  Sparkles, CheckCircle2, ChevronRight, ChevronDown, Send, Download, X, Tag,
} from "lucide-react";

/* ───────── primitives (lqa-demo 톤) ───────── */
const Card = ({ children, className = "" }) => (
  <div className={"rounded-xl border border-slate-800 bg-slate-900 " + className}>{children}</div>
);
const Badge = ({ children, kind = "info" }) => {
  const k = {
    info: "bg-slate-800 text-slate-300", teal: "bg-teal-900 text-teal-200",
    warn: "bg-amber-900 text-amber-200", pass: "bg-emerald-900 text-emerald-200",
    crit: "bg-red-900 text-red-200", draft: "bg-slate-800 text-slate-400 border border-slate-700",
  };
  return <span className={"inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium " + k[kind]}>{children}</span>;
};
const Btn = ({ children, kind = "ghost", icon: Icon, onClick, disabled, className = "" }) => {
  const k = {
    primary: "bg-teal-600 hover:bg-teal-500 text-white",
    ghost: "bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700",
    soft: "bg-slate-800 hover:bg-slate-700 text-slate-300",
  };
  return (
    <button disabled={disabled} onClick={onClick} className={"inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed " + k[kind] + " " + className}>
      {Icon && <Icon size={15} />}{children}
    </button>
  );
};
const Seg = ({ options, value, onChange }) => (
  <div className="inline-flex rounded-lg bg-slate-800 p-0.5">
    {options.map((o) => (
      <button key={o} onClick={() => onChange(o)} className={"rounded-md px-3 py-1.5 text-xs font-medium transition " + (value === o ? "bg-teal-600 text-white" : "text-slate-400 hover:text-slate-200")}>{o}</button>
    ))}
  </div>
);
const Field = ({ label, children, hint }) => (
  <div><div className="mb-1.5 text-xs font-semibold text-slate-400">{label}</div>{children}{hint && <div className="mt-1 text-xs text-slate-500">{hint}</div>}</div>
);

/* ───────── 샘플 생성 데이터 ───────── */
const STEPS = [
  ["브라우저 열기", "url", "https://www.tworld.co.kr"],
  ["텍스트 입력", "css #username", "${id}"],
  ["텍스트 입력", "css #password", "${pw}"],
  ["요소 클릭", "css button.btn-login", "-"],
  ["검증 (Assertion)", "css .welcome", "텍스트 포함 \"환영합니다\""],
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

export default function FqaAiGenScreen() {
  const [src, setSrc] = useState("직접 입력");
  const [req, setReq] = useState("T월드 앱 로그인 기능\n- 전화번호/비밀번호로 로그인\n- 3회 실패 시 계정 잠금\n- 자동 로그인 (Remember Me)\n- 로그아웃 시 세션 즉시 만료");
  const [cov, setCov] = useState("Standard");
  const [out, setOut] = useState("No-Code");
  const [plat, setPlat] = useState("Web");
  const [edge, setEdge] = useState(true);
  const [phase, setPhase] = useState("idle"); // idle | running | done
  const [rows, setRows] = useState([]);
  const [picked, setPicked] = useState(new Set());
  const [open, setOpen] = useState(null);
  const [toast, setToast] = useState("");

  const flash = (m) => { setToast(m); setTimeout(() => setToast(""), 2200); };
  const generate = () => {
    setPhase("running");
    setTimeout(() => { setRows(SAMPLE); setPicked(new Set(SAMPLE.map((r) => r.id))); setPhase("done"); }, 750);
  };
  const toggle = (id) => setPicked((p) => { const n = new Set(p); n.has(id) ? n.delete(id) : n.add(id); return n; });
  const commit = (msg) => { if (!picked.size) { flash("케이스를 선택하세요"); return; } flash(picked.size + msg); };

  const platforms = [["Web", Globe, true], ["Android", Smartphone, false], ["iOS", Smartphone, false], ["API", Code2, false]];

  return (
    <>
      <div className="grid grid-cols-12 gap-4">
        {/* ── 좌: 입력 ── */}
        <div className="col-span-5 space-y-4">
          <Card className="p-4 space-y-4">
            <div className="grid grid-cols-4 gap-2">
              {[["직접 입력", FileText], ["Jira", Bug], ["파일", Upload], ["레코딩", Video]].map(([s, Ic]) => (
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
                  <input placeholder="TWORLD-1842" className="flex-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-slate-200 outline-none focus:border-teal-500" />
                  <Btn>가져오기</Btn>
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
            {src === "레코딩" && (
              <Field label="브라우저 레코딩" hint="실제 조작을 캡처해 스텝으로 변환">
                <Btn icon={Video} className="w-full">브라우저 레코딩 시작</Btn>
                <div className="mt-2 rounded-lg bg-slate-800 p-3 text-xs text-slate-500">캡처된 액션이 여기에 표시되고, AI가 검증포인트를 보강합니다.</div>
              </Field>
            )}
          </Card>

          <Card className="p-4 space-y-3.5">
            <div className="text-sm font-semibold text-slate-200">생성 옵션</div>
            <Field label="커버리지"><Seg options={["Basic", "Standard", "Full"]} value={cov} onChange={setCov} /></Field>
            <Field label="출력 형식" hint="Full-Code(Python)는 GitLab 연동으로 내보냅니다">
              <Seg options={["No-Code", "Low-Code"]} value={out} onChange={setOut} />
            </Field>
            <Field label="플랫폼">
              <div className="grid grid-cols-4 gap-2">
                {platforms.map(([p, Ic, ok]) => (
                  <button key={p} disabled={!ok} onClick={() => ok && setPlat(p)} className={"flex flex-col items-center gap-1 rounded-lg border px-2 py-2 text-xs " + (plat === p ? "border-teal-500 bg-teal-900 text-teal-200" : ok ? "border-slate-700 bg-slate-800 text-slate-300 hover:bg-slate-700" : "border-slate-800 bg-slate-900 text-slate-600 cursor-not-allowed")}>
                    <Ic size={15} />{p}{!ok && <span style={{ fontSize: 8 }}>확장</span>}
                  </button>
                ))}
              </div>
            </Field>
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
                  <span>선택 {picked.size}/{rows.length} · 상태 <Badge kind="draft">검토 대기</Badge></span>
                  <div className="flex gap-2">
                    <Seg options={["스텝", "스크립트"]} value="스텝" onChange={() => {}} />
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
                            <div className="mb-2 text-xs font-semibold text-slate-400">스텝 미리보기 (No-Code · Web)</div>
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
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div className="flex items-center justify-end gap-2 border-t border-slate-800 px-4 py-3">
                  <Btn icon={Download} onClick={() => commit("건 내보내기 완료")}>내보내기</Btn>
                  <Btn icon={Plus} onClick={() => commit("건 검토 대기로 추가")}>검토 대기로 추가</Btn>
                  <Btn kind="primary" icon={Send} onClick={() => commit("건을 테스트 에디터로 전달")}>에디터로 보내기</Btn>
                </div>
              </>
            )}
          </Card>
          <div className="mt-2 text-xs text-slate-500">생성된 케이스는 <span className="text-amber-300">검토 대기</span> 상태로 등록되며, 검토·승인 후 실행 대상이 됩니다. (LQA 생성 라이프사이클과 동일)</div>
        </div>
      </div>

      {toast && <div className="fixed bottom-5 right-5 rounded-lg border border-teal-700 bg-teal-900 px-4 py-2.5 text-sm text-teal-100 shadow-xl">{toast}</div>}
    </>
  );
}
