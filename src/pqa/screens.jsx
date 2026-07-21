// ============================================================
// PQA(앱 성능) — 준비·설계 화면. 대상·환경 / 측정 시나리오 / 측정 계획.
// 목록=카드 + 좌측 추가버튼 + 3:9(좌:우) — 타 QA 도메인 대상·환경과 동일 구성.
// nqa/perf.jsx에서 분리(2026-07).
// ============================================================
import { useState, useEffect } from "react";
import { useApp } from "../common/context.js";
import { VarRefInput } from "../common/VarRefInput.jsx";
import { ScheduleConfig } from "../common/ScheduleConfig.jsx";
import { Card, PageToolbar, Badge, Btn, Field, Input, Select, Toggle } from "../common/ui.jsx";
import { Plus, X, Smartphone, Cpu, Zap, Package, Save, RefreshCw, Copy } from "lucide-react";
import { PERF_PLATFORMS, PERF_BUILD_SOURCES, PERF_VARIANTS, PERF_METRICS, PERF_DEVICES } from "./data.js";

const PQA_EVENTS = [{ key: "deploy", label: "배포 시", desc: "대상 앱에 새 빌드가 배포되면 자동 측정합니다", short: "배포", fields: [{ k: "detect", type: "readonly", label: "감지 방식", value: "대상 앱의 CI 배포 웹훅 (상속)" }] }];
const genSecret = () => "whsec_" + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);

const cardCls = (on) => "cursor-pointer p-3 " + (on ? "border-teal-500" : "hover:border-slate-700");
const Modal = ({ title, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
    <div className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
      <div className="text-base font-semibold text-slate-100">{title}</div>
      {children}
    </div>
  </div>
);

/* ═══════════ 대상·환경 (앱 빌드 + 단말·환경) ═══════════ */
export function PqaTargetScreen() {
  const { perfApps, perfScenarios, perfPlans, addPerfApp, updatePerfApp, removePerfApp, toast } = useApp();
  const [sel, setSel] = useState(0);
  const [modal, setModal] = useState(false);
  const [nf, setNf] = useState({ name: "", pkg: "" });
  const app = perfApps[sel] || perfApps[0];
  const [draft, setDraft] = useState({});
  const [syncedId, setSyncedId] = useState(null);
  useEffect(() => {
    if (app) { setDraft({ name: app.name, pkg: app.pkg, version: app.version, versionCode: app.versionCode || "", variant: app.variant || PERF_VARIANTS[0], source: app.source, build: app.build, signed: !!app.signed, artifactUrl: app.artifactUrl || "", tokenRef: app.tokenRef || "", track: app.track || "운영(Production)", buildFile: app.buildFile || "", benchModule: app.benchModule || ":benchmark", deploySecret: app.deploySecret || "" }); setSyncedId(app.id); }
  }, [app && app.id]);
  const setD = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const FIELDS = ["name", "pkg", "version", "versionCode", "variant", "source", "build", "signed", "artifactUrl", "tokenRef", "track", "buildFile", "benchModule", "deploySecret"];
  const nz = (v) => (v == null ? "" : v);
  const dirty = !!app && syncedId === app.id && FIELDS.some((k) => (k === "signed" ? !!draft[k] !== !!app[k] : k === "variant" ? (draft[k] || PERF_VARIANTS[0]) !== (app[k] || PERF_VARIANTS[0]) : nz(draft[k]) !== nz(app[k])));
  const saveCfg = () => {
    if (!(draft.name || "").trim() || !(draft.pkg || "").trim()) { toast("앱 이름과 패키지 id는 비울 수 없습니다", "warn"); return; }
    updatePerfApp(app.id, { name: draft.name.trim(), pkg: draft.pkg.trim(), version: draft.version, versionCode: draft.versionCode, variant: draft.variant, source: draft.source, build: draft.build, signed: draft.signed, artifactUrl: draft.artifactUrl, tokenRef: draft.tokenRef, track: draft.track, buildFile: draft.buildFile, benchModule: draft.benchModule, deploySecret: draft.deploySecret });
    toast("저장되었습니다", "ok");
  };
  const parseBuild = () => {
    const src = draft.source;
    const ok = src === "CI 아티팩트" ? (draft.artifactUrl || "").trim() : src === "직접 업로드" ? (draft.buildFile || "").trim() : (draft.track || "").trim();
    if (!ok) { toast(src === "직접 업로드" ? "빌드 파일을 먼저 선택하세요" : src === "CI 아티팩트" ? "아티팩트 URL을 먼저 입력하세요" : "트랙을 먼저 선택하세요", "warn"); return; }
    const fname = src === "직접 업로드" ? draft.buildFile : src === "CI 아티팩트" ? ((draft.artifactUrl || "").split("/").pop() || "app-release.aab") : "(Play 배포본)";
    setD({ version: draft.version && draft.version !== "-" ? draft.version : "1.0.0", versionCode: draft.versionCode && draft.versionCode !== "-" ? draft.versionCode : "10000", signed: true, build: fname });
    toast(src === "스토어(Play)" ? "Play Developer API에서 트랙 버전·서명을 조회했습니다" : "매니페스트에서 버전·versionCode·서명을 추출했습니다", "ok");
  };
  const add = () => {
    if (!nf.name.trim() || !nf.pkg.trim()) { toast("앱 이름과 패키지 id를 입력하세요", "warn"); return; }
    addPerfApp({ id: Date.now(), name: nf.name.trim(), platform: "Android", pkg: nf.pkg.trim(), version: "-", versionCode: "-", variant: "release·profileable", source: "CI 아티팩트", build: "-", signed: false, artifactUrl: "", tokenRef: "", track: "운영(Production)", buildFile: "", benchModule: ":benchmark", deploySecret: genSecret() });
    setSel(0); setModal(false); toast("대상 앱 추가됨 — 상세에서 빌드를 연결하고 '빌드 파싱'을 실행하세요", "ok");
  };
  const deployHook = app ? ("https://autoqa.io/api/hooks/perf/" + app.id + "-" + String(app.pkg || "app").replace(/[^a-z0-9]+/gi, "-") + "-9c1e") : "";
  const selectApp = (i) => { if (i === sel) return; if (dirty && !window.confirm("저장하지 않은 변경이 있습니다. 저장하지 않고 다른 앱으로 이동할까요?")) return; setSel(i); };
  const del = (a) => {
    const scn = (perfScenarios || []).filter((s) => s.appId === a.id).length;
    const pln = (perfPlans || []).filter((p) => p.appId === a.id).length;
    const warn = (scn || pln) ? "\n\n연결된 측정 시나리오 " + scn + "건 · 측정 계획 " + pln + "건이 이 앱을 참조합니다. 삭제하면 해당 항목의 대상이 사라집니다." : "";
    if (!window.confirm(a.name + " 대상 앱을 삭제할까요?" + warn)) return;
    removePerfApp(a.id); setSel(0); toast(a.name + " 삭제됨", "warn");
  };
  return (
    <div className="space-y-4">
      <PageToolbar desc="대상 앱(빌드) — Android 우선, iOS 확장 예정" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-2">
          <Btn kind="primary" icon={Plus} className="w-full" onClick={() => { setNf({ name: "", pkg: "" }); setModal(true); }}>대상 앱 추가</Btn>
          {perfApps.map((a, i) => (
            <Card key={a.id} className={cardCls(sel === i)}>
              <div onClick={() => selectApp(i)}>
                <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-100">{a.name}</span><div className="flex items-center gap-1.5"><Badge kind="pass">{a.platform}</Badge><button onClick={(e) => { e.stopPropagation(); del(a); }} className="text-slate-500 hover:text-red-400" title="삭제"><X size={12} /></button></div></div>
                <div className="mt-1 truncate font-mono text-xs text-slate-500">{a.pkg}</div>
                <div className="mt-0.5 text-xs text-slate-500">v{a.version} · {a.source}</div>
              </div>
            </Card>
          ))}
        </div>
        <div className="col-span-9 space-y-4">
          {app && (
          <Card className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex min-w-0 flex-1 items-center gap-2"><div className="w-64 shrink-0"><Input value={draft.name || ""} onChange={(e) => setD({ name: e.target.value })} className="text-base font-semibold" /></div><Badge kind="pass">{app.platform}</Badge></div>
              <div className="flex shrink-0 items-center gap-3">{dirty && <span className="text-xs text-amber-300">미저장 변경</span>}<Btn kind="primary" icon={Save} onClick={saveCfg} disabled={!dirty}>설정 저장</Btn></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="패키지 id"><Input value={draft.pkg || ""} onChange={(e) => setD({ pkg: e.target.value })} /></Field>
              <Field label="벤치마크 모듈" hint="Macrobenchmark 테스트 Gradle 모듈 (앱당 1개)"><Input value={draft.benchModule || ""} onChange={(e) => setD({ benchModule: e.target.value })} placeholder=":benchmark" className="font-mono text-xs" /></Field>
              <Field label="빌드 변형"><Select value={draft.variant || PERF_VARIANTS[0]} onChange={(e) => setD({ variant: e.target.value })}>{PERF_VARIANTS.map((v) => <option key={v}>{v}</option>)}</Select></Field>
              <Field label="빌드 소스"><Select value={draft.source || PERF_BUILD_SOURCES[0]} onChange={(e) => setD({ source: e.target.value, version: "-", versionCode: "-", build: "-", signed: false })}>{PERF_BUILD_SOURCES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
            </div>
            {String(draft.variant || "").includes("debug") && <div className="mt-2 rounded-lg border border-amber-800 bg-amber-950 px-2.5 py-1.5 text-xs text-amber-300">debug 빌드는 최적화가 꺼져 측정값이 왜곡됩니다 — release·profileable 권장.</div>}

            <div className="mt-3 space-y-3 rounded-lg border border-slate-800 bg-slate-900 p-3">
              <div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-300">빌드 연결 · {draft.source}</span><Btn icon={Package} onClick={parseBuild}>빌드 파싱</Btn></div>
              {draft.source === "CI 아티팩트" && (
                <div className="space-y-3">
                  <Field label="아티팩트 URL"><Input value={draft.artifactUrl || ""} onChange={(e) => setD({ artifactUrl: e.target.value })} placeholder="https://ci.onmarket.io/artifacts/app/9.12.0/app-release.aab" className="font-mono text-xs" /></Field>
                  <Field label="인증 토큰 (변수 참조)"><VarRefInput value={draft.tokenRef || ""} onChange={(v) => setD({ tokenRef: v })} placeholder="${ci_token}" /></Field>
                  <Field label="배포 웹훅 (CI가 호출)"><div className="flex items-center gap-2"><div className="flex-1 truncate rounded-lg border border-slate-800 bg-slate-800/50 px-2.5 py-2 font-mono text-xs text-slate-300" title={deployHook}>{deployHook}</div><Btn icon={Copy} onClick={() => { if (navigator.clipboard) navigator.clipboard.writeText(deployHook); toast("웹훅 URL 복사됨", "ok"); }}>복사</Btn></div></Field>
                  <Field label="웹훅 서명 시크릿 (CI에서 HMAC 서명에 사용)"><div className="flex items-center gap-2"><div className="flex-1 truncate rounded-lg border border-slate-800 bg-slate-800/50 px-2.5 py-2 font-mono text-xs text-slate-400">{draft.deploySecret ? "whsec_" + "•".repeat(20) + draft.deploySecret.slice(-4) : <span className="text-slate-600">미발급</span>}</div><Btn icon={Copy} onClick={() => { if (navigator.clipboard && draft.deploySecret) navigator.clipboard.writeText(draft.deploySecret); toast("서명 시크릿 복사됨", "ok"); }}>복사</Btn><Btn icon={RefreshCw} onClick={() => setD({ deploySecret: genSecret() })}>재생성</Btn></div></Field>
                  <div className="text-xs text-slate-500">CI 배포 잡 마지막에 이 웹훅을 <span className="text-slate-300">서명 시크릿으로 HMAC 서명</span>해 호출하면 측정 계획의 '배포 시' 이벤트가 트리거됩니다. 재생성 시 CI 설정도 갱신하세요.</div>
                </div>
              )}
              {draft.source === "스토어(Play)" && (
                <div className="space-y-2">
                  <Field label="트랙"><Select value={draft.track || "운영(Production)"} onChange={(e) => setD({ track: e.target.value })}><option>운영(Production)</option><option>베타(Beta)</option><option>내부 테스트(Internal)</option></Select></Field>
                  <div className="text-xs text-slate-500">버전·서명은 Play Developer API로 <span className="text-slate-300">패키지·트랙 기준 조회</span>합니다 — 다운로드 URL 불필요. 단 Play 재서명·바이너리 제약으로 상세 프로파일링은 제한(baseline 참조용).</div>
                </div>
              )}
              {draft.source === "직접 업로드" && (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <label className="cursor-pointer rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs text-slate-200 hover:border-teal-500">파일 선택<input type="file" accept=".apk,.aab" className="hidden" onChange={(e) => { const f = (e.target.files || [])[0]; if (f) setD({ buildFile: f.name }); }} /></label>
                    <span className="font-mono text-xs text-slate-400">{draft.buildFile || "선택된 파일 없음 (.apk / .aab)"}</span>
                  </div>
                  <div className="text-xs text-slate-500">CI 밖의 로컬·수동 빌드를 직접 업로드합니다.</div>
                </div>
              )}
            </div>

            <div className="mt-3">
              <div className="mb-1.5 text-xs font-semibold text-slate-400">빌드 메타 <span className="font-normal text-slate-500">· 빌드에서 자동 추출 (읽기 전용)</span></div>
              <div className="grid grid-cols-4 gap-3">
                <Field label="버전 이름"><div className="rounded-lg border border-slate-800 bg-slate-800/50 px-2.5 py-2 text-sm text-slate-300">{draft.version && draft.version !== "-" ? draft.version : <span className="text-slate-600">미확인</span>}</div></Field>
                <Field label="versionCode"><div className="rounded-lg border border-slate-800 bg-slate-800/50 px-2.5 py-2 text-sm text-slate-300">{draft.versionCode && draft.versionCode !== "-" ? draft.versionCode : <span className="text-slate-600">미확인</span>}</div></Field>
                <Field label="빌드 아티팩트"><div className="truncate rounded-lg border border-slate-800 bg-slate-800/50 px-2.5 py-2 font-mono text-xs text-slate-300" title={draft.build}>{draft.build && draft.build !== "-" ? draft.build : <span className="text-slate-600">미확인</span>}</div></Field>
                <Field label="서명"><div className="rounded-lg border border-slate-800 bg-slate-800/50 px-2.5 py-2"><Badge kind={draft.signed ? "pass" : "warn"}>{draft.signed ? "서명됨" : "미서명"}</Badge></div></Field>
              </div>
            </div>
          </Card>
          )}
        </div>
      </div>
      {modal && (
        <Modal title="대상 앱 추가" onClose={() => setModal(false)}>
          <Field label="앱 이름"><Input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder="예: 온마켓" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="플랫폼"><Select value="Android" onChange={() => {}}>{PERF_PLATFORMS.map((p) => <option key={p.id} value={p.id} disabled={!p.ready}>{p.label}{!p.ready ? " (준비중)" : ""}</option>)}</Select></Field>
            <Field label="패키지 id"><Input value={nf.pkg} onChange={(e) => setNf({ ...nf, pkg: e.target.value })} placeholder="com.onmarket.app" /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setModal(false)}>취소</Btn><Btn kind="primary" icon={Plus} onClick={add}>추가</Btn></div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════ 측정 시나리오 (여정 + 지표 + 마커) ═══════════ */
export function PqaScenarioScreen() {
  const { perfScenarios, perfApps, addPerfScenario, updatePerfScenario, removePerfScenario, toast } = useApp();
  const [sel, setSel] = useState(0);
  const [modal, setModal] = useState(false);
  const [nf, setNf] = useState({ name: "", appId: "", scriptRef: "" });
  const scn = perfScenarios[sel] || perfScenarios[0];
  const appName = (id) => (perfApps.find((a) => a.id === id) || {}).name || "-";
  const scnApp = (perfApps.find((a) => a.id === (scn && scn.appId))) || {};
  const [draft, setDraft] = useState({});
  const [syncedId, setSyncedId] = useState(null);
  useEffect(() => {
    if (scn) { setDraft({ scriptRef: scn.scriptRef || "" }); setSyncedId(scn.id); }
  }, [scn && scn.id]);
  const setD = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const isStartup = String((scn && scn.journey) || "").startsWith("앱 시작");
  const refDirty = !!scn && syncedId === scn.id && (draft.scriptRef || "") !== (scn.scriptRef || "");
  const syncBench = () => {
    const ref = (draft.scriptRef || "").trim();
    if (!ref) { toast("테스트(클래스#메서드)를 먼저 입력하세요", "warn"); return; }
    const method = ref.includes("#") ? ref.split("#")[1] : ref;
    const pkg = scnApp.pkg || "com.app";
    const section = method.replace(/([a-z])([A-Z])/g, "$1_$2").toLowerCase();
    const startup = /startup|cold|warm|hot|launch/i.test(ref);
    const patch = startup
      ? { journey: "앱 시작(Startup)", startMode: "Cold", iterations: 10, steps: [], metrics: ["e2e", "mem"], traceSection: "", scriptRef: ref, benchSource: "@Test\nfun " + method + "() = rule.measureRepeated(\n  packageName = \"" + pkg + "\",\n  metrics = listOf(StartupTimingMetric(), MemoryUsageMetric(Mode.Last)),\n  iterations = 10, startupMode = StartupMode.COLD,\n) { pressHome(); startActivityAndWait() }" }
      : { journey: "사용 흐름(Flow)", startMode: "", iterations: 10, steps: ["앱 진입", "대상 화면 이동", "스크롤·조작"], metrics: ["e2e", "frame", "mem"], traceSection: section, scriptRef: ref, benchSource: "@Test\nfun " + method + "() = rule.measureRepeated(\n  packageName = \"" + pkg + "\",\n  metrics = listOf(TraceSectionMetric(\"" + section + "\"), FrameTimingMetric(), MemoryUsageMetric(Mode.Last)),\n  iterations = 10, startupMode = StartupMode.WARM,\n) {\n  startActivityAndWait()\n  trace(\"" + section + "\") { onView(res(\"target\")).fling(DOWN) }\n}" };
    updatePerfScenario(scn.id, patch);
    toast("벤치마크에서 유형·지표·흐름·E2E·소스를 인식했습니다", "ok");
  };
  const selectScn = (i) => { if (i === sel) return; if (refDirty && !window.confirm("동기화하지 않은 테스트 참조 변경이 있습니다. 그대로 이동할까요?")) return; setSel(i); };
  const add = () => {
    if (!nf.name.trim() || !nf.appId) { toast("이름과 대상 앱을 선택하세요", "warn"); return; }
    addPerfScenario({ id: Date.now(), name: nf.name.trim(), appId: Number(nf.appId), scriptRef: (nf.scriptRef || "").trim(), journey: "", startMode: "", steps: [], metrics: [], traceSection: "", iterations: null, benchSource: "", status: "초안" });
    setSel(0); setModal(false); toast("측정 시나리오 추가됨 — 테스트를 지정하고 '벤치마크 동기화'를 실행하세요", "ok");
  };
  return (
    <div className="space-y-4">
      <PageToolbar desc="벤치마크 테스트 참조 · 동기화로 유형·지표·흐름 인식" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-2">
          <Btn kind="primary" icon={Plus} className="w-full" onClick={() => { setNf({ name: "", appId: perfApps[0] ? String(perfApps[0].id) : "", scriptRef: "" }); setModal(true); }}>시나리오 추가</Btn>
          {perfScenarios.map((s, i) => (
            <Card key={s.id} className={cardCls(sel === i)}>
              <div onClick={() => selectScn(i)}>
                <div className="flex items-center justify-between gap-1.5"><span className="truncate text-sm font-semibold text-slate-100">{s.name}</span><button onClick={(e) => { e.stopPropagation(); removePerfScenario(s.id); setSel(0); toast("삭제됨", "warn"); }} className="shrink-0 text-slate-500 hover:text-red-400"><X size={12} /></button></div>
                <div className="mt-1 flex items-center gap-1.5"><Badge kind="info">{appName(s.appId)}</Badge><span className="text-xs text-slate-500">지표 {(s.metrics || []).length}</span></div>
              </div>
            </Card>
          ))}
        </div>
        {scn && (
        <Card className="col-span-9 p-4 space-y-4">
          <div className="flex items-center gap-2">
            <div className="w-64 shrink-0"><Input value={scn.name} onChange={(e) => updatePerfScenario(scn.id, { name: e.target.value })} className="text-base font-semibold" /></div><Badge kind="info">{appName(scn.appId)}</Badge>
          </div>
          <div className="space-y-2 rounded-lg border border-slate-800 bg-slate-900 p-3">
            <div className="flex items-center justify-between gap-2"><span className="text-xs font-semibold text-slate-300">Macrobenchmark 테스트 참조</span><div className="flex items-center gap-2">{refDirty && <span className="text-xs text-amber-300">동기화 필요</span>}<Btn icon={RefreshCw} onClick={syncBench}>벤치마크 동기화</Btn></div></div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="모듈" hint="대상 앱 설정에서 상속"><div className="rounded-lg border border-slate-800 bg-slate-800/50 px-2.5 py-2 font-mono text-xs text-slate-400">{scnApp.benchModule || ":benchmark"}</div></Field>
              <Field label="테스트 (클래스#메서드)"><Input value={draft.scriptRef || ""} onChange={(e) => setD({ scriptRef: e.target.value })} placeholder="HomeScrollBenchmark#scrollHome" className="font-mono text-xs" /></Field>
            </div>
            <pre className="overflow-x-auto rounded-lg border border-slate-800 bg-slate-950 p-3 text-xs text-slate-400">{scn.benchSource || "// 테스트를 지정하고 ‘벤치마크 동기화’를 실행하면 유형·지표·흐름·마커·소스가 인식됩니다."}</pre>
          </div>

          <div>
            <div className="mb-1.5 text-xs font-semibold text-slate-400">벤치마크 파생 <span className="font-normal text-slate-500">· 동기화로 인식 (읽기 전용)</span></div>
            <div className="grid grid-cols-3 gap-3">
              <Field label="측정 유형"><div className="rounded-lg border border-slate-800 bg-slate-800/50 px-2.5 py-2 text-sm text-slate-300">{scn.journey || <span className="text-slate-600">미인식</span>}</div></Field>
              {isStartup && <Field label="시작 모드"><div className="rounded-lg border border-slate-800 bg-slate-800/50 px-2.5 py-2 text-sm text-slate-300">{scn.startMode || "Cold"}</div></Field>}
              <Field label="반복(iterations)"><div className="rounded-lg border border-slate-800 bg-slate-800/50 px-2.5 py-2 text-sm text-slate-300">{scn.iterations != null ? scn.iterations : <span className="text-slate-600">—</span>}</div></Field>
            </div>
          </div>

          <div>
            <div className="mb-1.5 text-xs font-semibold text-slate-400">산출 지표</div>
            <div className="flex flex-wrap gap-1.5">
              {(scn.metrics || []).length === 0 ? <span className="text-xs text-slate-500">동기화 시 인식됩니다.</span> : (scn.metrics || []).map((mid) => { const m = PERF_METRICS.find((x) => x.id === mid) || { label: mid, unit: "" }; return <span key={mid} className="rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1.5 text-xs text-teal-200">{m.label} <span className="text-slate-500">({[m.agg, m.unit].filter(Boolean).join(" ") || "-"})</span></span>; })}
            </div>
          </div>

          {!isStartup && (scn.steps || []).length > 0 && (
            <div><div className="mb-1 text-xs font-semibold text-slate-400">흐름</div><div className="flex flex-wrap gap-1.5">{scn.steps.map((st, i) => <span key={i} className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">{i + 1}. {st}</span>)}</div></div>
          )}

          {isStartup ? (
            <div>
              <div className="mb-1.5 text-xs font-semibold text-slate-400">E2E 측정 <span className="font-normal text-slate-500">· 내장 지표</span></div>
              <div className="rounded-lg border border-slate-800 bg-slate-800/50 px-2.5 py-2 text-sm text-slate-300">StartupTiming <span className="text-xs text-slate-500">· TTID(첫 프레임) / TTFD(reportFullyDrawn)</span></div>
            </div>
          ) : (
            <div>
              <div className="mb-1.5 text-xs font-semibold text-slate-400">E2E 구간 (trace) <span className="font-normal text-slate-500">· 앱 코드의 trace 구간</span></div>
              <div className="rounded-lg border border-slate-800 bg-slate-800/50 px-2.5 py-2 font-mono text-sm text-slate-300">{scn.traceSection ? "trace(\"" + scn.traceSection + "\")" : <span className="text-slate-600">—</span>}</div>
            </div>
          )}
          <div className="text-xs text-slate-500">배터리는 사내 랩(전력 리그) 전용 · 시작(Startup) 유형은 여정 없이 콜드/웜/핫만 측정.</div>
        </Card>
        )}
      </div>
      {modal && (
        <Modal title="측정 시나리오 추가" onClose={() => setModal(false)}>
          <Field label="이름"><Input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder="예: 홈→상품목록 스크롤" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="대상 앱"><Select value={nf.appId} onChange={(e) => setNf({ ...nf, appId: e.target.value })}><option value="">선택</option>{perfApps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field>
            <Field label="테스트 (클래스#메서드)"><Input value={nf.scriptRef} onChange={(e) => setNf({ ...nf, scriptRef: e.target.value })} placeholder="HomeScrollBenchmark#scrollHome" className="font-mono text-xs" /></Field>
          </div>
          <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setModal(false)}>취소</Btn><Btn kind="primary" icon={Plus} onClick={add}>추가</Btn></div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════ 측정 계획 (조립 + 예산 + 트리거) ═══════════ */
export function PqaPlanScreen() {
  const { perfPlans, perfScenarios, perfApps, addPerfPlan, updatePerfPlan, removePerfPlan, toast } = useApp();
  const [sel, setSel] = useState(0);
  const [modal, setModal] = useState(false);
  const [nf, setNf] = useState({ name: "", appId: "" });
  const plan = perfPlans[sel] || perfPlans[0];
  const appName = (id) => (perfApps.find((a) => a.id === id) || {}).name || "-";
  const mkDraft = (p) => ({ name: p.name, status: p.status, scenarioIds: [...(p.scenarioIds || [])], deviceIds: [...((p.matrix && p.matrix.deviceIds) || [])], power: !!(p.cond && p.cond.power), budget: JSON.parse(JSON.stringify(p.budget || {})), schedule: p.schedule });
  const [draft, setDraft] = useState(() => (plan ? mkDraft(plan) : {}));
  const [syncedId, setSyncedId] = useState(plan ? plan.id : null);
  // 계획 전환 시 렌더 시점에 draft 동기 재초기화 — useEffect 지연으로 ScheduleConfig(key=plan.id)가 이전 계획 스케줄로 마운트되는 문제 방지
  if (plan && syncedId !== plan.id) { setDraft(mkDraft(plan)); setSyncedId(plan.id); }
  const setD = (patch) => setDraft((d) => ({ ...d, ...patch }));
  const add = () => {
    if (!nf.name.trim() || !nf.appId) { toast("이름과 대상 앱을 선택하세요", "warn"); return; }
    addPerfPlan({ id: Date.now(), name: nf.name.trim(), appId: Number(nf.appId), scenarioIds: [], matrix: { deviceIds: [] }, cond: { power: false }, budget: {}, schedule: { mode: "manual", freq: "weekly", time: "09:00", dow: 1, dom: 1, cron: "0 9 * * 1", tz: "Asia/Seoul", active: true, ev: {}, summary: "예약 없음" }, status: "초안" });
    setSel(0); setModal(false); toast("측정 계획이 추가되었습니다", "ok");
  };
  const arrEq = (a, b) => a.length === b.length && a.every((x) => b.includes(x));
  // 스케줄 정규형: 파생 필드(summary)·비활성 ev 키는 무시 → ScheduleConfig 재마운트 방출로 인한 허위 dirty 방지
  const schedKey = (s) => { s = s || {}; const ev = Object.entries(s.ev || {}).filter(([, val]) => val).map(([k]) => k).sort(); return JSON.stringify({ mode: s.mode, freq: s.freq, time: s.time, dow: s.dow, dom: s.dom, cron: s.cron, tz: s.tz, active: s.active, ev }); };
  const dirty = !!plan && syncedId === plan.id && (
    (draft.name || "") !== (plan.name || "") ||
    draft.status !== plan.status ||
    !arrEq(draft.scenarioIds || [], plan.scenarioIds || []) ||
    !arrEq(draft.deviceIds || [], (plan.matrix && plan.matrix.deviceIds) || []) ||
    !!draft.power !== !!(plan.cond && plan.cond.power) ||
    JSON.stringify(draft.budget || {}) !== JSON.stringify(plan.budget || {}) ||
    schedKey(draft.schedule) !== schedKey(plan.schedule)
  );
  const saveCfg = () => {
    if (!(draft.name || "").trim()) { toast("계획 이름을 비울 수 없습니다", "warn"); return; }
    updatePerfPlan(plan.id, { name: draft.name.trim(), status: draft.status, scenarioIds: draft.scenarioIds, matrix: { ...plan.matrix, deviceIds: draft.deviceIds }, cond: { ...plan.cond, power: draft.power }, budget: draft.budget, schedule: draft.schedule });
    toast("저장되었습니다", "ok");
  };
  const selectPlan = (i) => { if (i === sel) return; if (dirty && !window.confirm("저장하지 않은 변경이 있습니다. 저장하지 않고 다른 계획으로 이동할까요?")) return; setSel(i); };
  const scnsOf = (id) => perfScenarios.filter((s) => s.appId === id);
  const selScns = perfScenarios.filter((s) => (draft.scenarioIds || []).includes(s.id));
  const setBudget = (sid, mid, val) => { const b = draft.budget || {}; const sb = { ...(b[String(sid)] || {}), [mid]: val === "" ? undefined : +val }; setD({ budget: { ...b, [String(sid)]: sb } }); };
  const planApp = perfApps.find((a) => a.id === (plan && plan.appId)) || {};
  const ciSource = planApp.source === "CI 아티팩트";
  const toggleScn = (sid) => { const has = (draft.scenarioIds || []).includes(sid); setD({ scenarioIds: has ? draft.scenarioIds.filter((x) => x !== sid) : [...(draft.scenarioIds || []), sid] }); };
  const toggleDevice = (did) => { const ids = draft.deviceIds || []; const has = ids.includes(did); setD({ deviceIds: has ? ids.filter((x) => x !== did) : [...ids, did] }); };
  const selDevices = PERF_DEVICES.filter((d) => (draft.deviceIds || []).includes(d.id));
  const selTiers = [...new Set(selDevices.map((d) => d.tier))];
  const hasPowerDevice = selDevices.some((d) => d.caps.power);
  return (
    <div className="space-y-4">
      <PageToolbar desc="대상 앱 + 시나리오 + 기기 매트릭스 + 지표별 SLA + 트리거" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-2">
          <Btn kind="primary" icon={Plus} className="w-full" onClick={() => { setNf({ name: "", appId: perfApps[0] ? String(perfApps[0].id) : "" }); setModal(true); }}>계획 추가</Btn>
          {perfPlans.map((p, i) => (
            <Card key={p.id} className={cardCls(sel === i)}>
              <div onClick={() => selectPlan(i)}>
                <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-100">{p.name}</span><div className="flex items-center gap-1.5"><Badge kind={p.status === "활성" ? "pass" : "draft"}>{p.status}</Badge><button onClick={(e) => { e.stopPropagation(); removePerfPlan(p.id); setSel(0); toast("삭제됨", "warn"); }} className="text-slate-500 hover:text-red-400"><X size={12} /></button></div></div>
                <div className="mt-1 text-xs text-slate-500">{appName(p.appId)} · 기기 {(p.matrix && p.matrix.deviceIds || []).length} · {(p.schedule && p.schedule.summary) || "예약 없음"}</div>
              </div>
            </Card>
          ))}
        </div>
        {plan && (
        <Card className="col-span-9 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex min-w-0 flex-1 items-center gap-2"><div className="w-64 shrink-0"><Input value={draft.name || ""} onChange={(e) => setD({ name: e.target.value })} className="text-base font-semibold" /></div><Badge kind="info">{appName(plan.appId)}</Badge></div>
            <div className="flex shrink-0 items-center gap-3">
              <div className="flex items-center gap-1.5 text-xs text-slate-400">활성 <Toggle on={draft.status === "활성"} onClick={() => setD({ status: draft.status === "활성" ? "초안" : "활성" })} /></div>
              {dirty && <span className="text-xs text-amber-300">미저장 변경</span>}
              <Btn kind="primary" icon={Save} onClick={saveCfg} disabled={!dirty}>설정 저장</Btn>
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-xs font-semibold text-slate-400">측정 시나리오 (셀 클릭 토글)</div>
            <div className="flex flex-wrap gap-1.5">
              {scnsOf(plan.appId).map((s) => { const on = (draft.scenarioIds || []).includes(s.id); return (
                <button key={s.id} onClick={() => toggleScn(s.id)} className={"rounded-lg border px-2.5 py-1.5 text-xs " + (on ? "border-teal-500 bg-teal-900 text-teal-200" : "border-slate-700 bg-slate-800 text-slate-400")}>{s.name}</button>
              ); })}
              {scnsOf(plan.appId).length === 0 && <span className="text-xs text-slate-500">이 앱의 시나리오가 없습니다 — 측정 시나리오에서 추가하세요.</span>}
            </div>
          </div>
          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-400"><Cpu size={13} className="text-teal-400" />단말 선택 <span className="font-normal text-slate-500">· 측정할 기기를 직접 선택 (팜별 실기기)</span></div>
              <div className="flex items-center gap-1.5 text-xs text-slate-400">전력 계측 <Toggle on={!!draft.power} onClick={() => setD({ power: !draft.power })} /></div>
            </div>
            {draft.power && !hasPowerDevice && <div className="mb-1.5 rounded-lg border border-amber-800 bg-amber-950 px-2.5 py-1.5 text-xs text-amber-300">전력 계측은 전력 리그 기기(사내 랩)를 선택해야 합니다 — 아래에서 선택하세요.</div>}
            <div className="overflow-hidden rounded-lg border border-slate-800">
              <table className="w-full text-sm">
                <thead><tr className="border-b border-slate-800 text-left text-slate-500"><th className="w-9 px-3 py-2"></th><th className="font-medium">기기</th><th className="font-medium">OS</th><th className="font-medium">티어</th><th className="font-medium">팜</th><th className="font-medium">역량</th></tr></thead>
                <tbody className="text-slate-300">
                  {PERF_DEVICES.map((d) => { const on = (draft.deviceIds || []).includes(d.id); return (
                    <tr key={d.id} onClick={() => toggleDevice(d.id)} className={"cursor-pointer border-b border-slate-800 last:border-0 hover:bg-slate-800/50 " + (on ? "bg-teal-950/40" : "")}>
                      <td className="px-3 py-2"><input type="checkbox" checked={on} readOnly className="accent-teal-500" /></td>
                      <td className="text-slate-200">{d.model}</td><td className="text-xs text-slate-400">{d.os}</td>
                      <td><Badge kind={d.tier === "저사양" ? "warn" : "info"}>{d.tier}</Badge></td>
                      <td className="text-xs text-slate-400">{d.farm}</td>
                      <td className="text-xs"><span className="text-slate-400">{[d.caps.trace && "trace", d.caps.fps && "frame"].filter(Boolean).join("·") || "—"}</span>{d.caps.power ? <span className="ml-1 text-teal-300">· 전력<Zap size={10} className="inline" /></span> : <span className="ml-1 text-slate-600">· 전력 X</span>}</td>
                    </tr>
                  ); })}
                </tbody>
              </table>
            </div>
            <div className="mt-1 text-xs text-slate-500">선택 {selDevices.length}대{selTiers.length ? " · 티어 " + selTiers.join("·") : ""} · 실시간 가용성은 실행 시 팜에서 확정.</div>
          </div>
          <div>
            <div className="mb-1.5 text-xs font-semibold text-slate-400">지표별 SLA <span className="font-normal text-slate-500">· 시나리오별 지표 임계 · 비우면 게이트 제외</span></div>
            {selScns.length === 0 ? (
              <div className="rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-500">시나리오를 선택하면 시나리오별 지표 SLA를 설정할 수 있습니다.</div>
            ) : (
              <div className="space-y-3">
                {selScns.map((s) => (
                  <div key={s.id} className="rounded-lg border border-slate-800 bg-slate-900 p-3">
                    <div className="mb-2 flex items-center gap-2 text-xs font-semibold text-slate-300">{s.name}{s.journey && <Badge kind="info">{s.journey}</Badge>}</div>
                    {(s.metrics || []).length === 0 ? (
                      <div className="text-xs text-slate-500">동기화되지 않아 지표가 없습니다 — 측정 시나리오에서 벤치마크 동기화하세요.</div>
                    ) : (
                      <div className="grid grid-cols-3 gap-2">
                        {PERF_METRICS.filter((m) => (s.metrics || []).includes(m.id)).map((m) => (
                          <div key={m.id} className="rounded-lg bg-slate-800 px-2.5 py-1.5">
                            <div className="mb-0.5 text-xs text-slate-400">{m.label} <span className="text-slate-500">· {m.agg} {m.dir === "up" ? "≥" : "≤"} {m.unit}</span></div>
                            <input type="number" value={(draft.budget && draft.budget[String(s.id)] && draft.budget[String(s.id)][m.id]) != null ? draft.budget[String(s.id)][m.id] : ""} onChange={(e) => setBudget(s.id, m.id, e.target.value)} placeholder="—" className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-200 outline-none focus:border-teal-500" />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          <div>
            <ScheduleConfig key={plan.id} value={draft.schedule} onChange={(s) => setD({ schedule: s })} events={PQA_EVENTS} singleSelect allowEvent={ciSource} manualHint="자동 실행 없음 — 측정 실행 화면에서 수동으로만 수행합니다." toast={toast} />
            {!ciSource && <div className="mt-1.5 text-xs text-slate-500">배포 이벤트 트리거는 대상 앱 빌드 소스가 'CI 아티팩트'일 때만 사용할 수 있습니다.</div>}
          </div>
        </Card>
        )}
      </div>
      {modal && (
        <Modal title="측정 계획 추가" onClose={() => setModal(false)}>
          <Field label="이름"><Input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder="예: 온마켓 릴리스 성능 게이트" /></Field>
          <Field label="대상 앱"><Select value={nf.appId} onChange={(e) => setNf({ ...nf, appId: e.target.value })}><option value="">선택</option>{perfApps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field>
          <div className="flex justify-end gap-2 pt-1"><Btn onClick={() => setModal(false)}>취소</Btn><Btn kind="primary" icon={Plus} onClick={add}>추가</Btn></div>
        </Modal>
      )}
    </div>
  );
}

/* ═══════════ 실행·분석 / 대시보드 — 준비 중(다음 단계) ═══════════ */
export function PqaSoon({ label }) {
  return (
    <div className="flex h-full items-center justify-center p-10 text-center">
      <div>
        <Package size={28} className="mx-auto mb-3 text-slate-600" />
        <div className="text-lg font-bold text-slate-200">{label} — 준비 중</div>
        <div className="mt-2 text-sm text-slate-500">준비·설계(대상 앱 / 측정 시나리오 / 측정 계획)를 먼저 구성하세요.</div>
      </div>
    </div>
  );
}
