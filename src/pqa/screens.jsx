// ============================================================
// PQA(앱 성능) — 준비·설계 화면. 대상·환경 / 측정 시나리오 / 측정 계획.
// 목록=카드 + 좌측 추가버튼 + 3:9(좌:우) — 타 QA 도메인 대상·환경과 동일 구성.
// nqa/perf.jsx에서 분리(2026-07).
// ============================================================
import { useState } from "react";
import { useApp } from "../common/context.js";
import { Card, PageToolbar, Badge, Btn, Field, Input, Select, Toggle } from "../common/ui.jsx";
import { Plus, X, Smartphone, Cpu, Zap, Package } from "lucide-react";
import { PERF_PLATFORMS, PERF_BUILD_SOURCES, PERF_VARIANTS, PERF_TIERS, PERF_FARMS, PERF_JOURNEY_SRC, PERF_STARTS, PERF_NETWORKS, PERF_TRIGGERS, PERF_METRICS, PERF_DEVICES } from "./data.js";

const stK = { "온라인": "pass", "점유중": "warn", "오프라인": "draft" };
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
  const { perfApps, addPerfApp, updatePerfApp, removePerfApp, toast } = useApp();
  const [sel, setSel] = useState(0);
  const [modal, setModal] = useState(false);
  const [nf, setNf] = useState({ name: "", pkg: "" });
  const app = perfApps[sel] || perfApps[0];
  const up = (patch) => updatePerfApp(app.id, patch);
  const add = () => {
    if (!nf.name.trim() || !nf.pkg.trim()) { toast("앱 이름과 패키지 id를 입력하세요", "warn"); return; }
    addPerfApp({ id: Date.now(), name: nf.name.trim(), platform: "Android", pkg: nf.pkg.trim(), version: "-", versionCode: "-", variant: "release·profileable", source: "CI 아티팩트", build: "-", signed: true });
    setSel(0); setModal(false); toast("대상 앱 추가됨 — 상세에서 버전·소스·서명을 편집하세요", "ok");
  };
  const del = (a) => { removePerfApp(a.id); setSel(0); toast(a.name + " 삭제됨", "warn"); };
  return (
    <div className="space-y-4">
      <PageToolbar desc="대상 앱(빌드) + 단말·환경 — Android 우선, iOS 확장 예정" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-2">
          <Btn kind="primary" icon={Plus} className="w-full" onClick={() => { setNf({ name: "", pkg: "" }); setModal(true); }}>대상 앱 추가</Btn>
          {perfApps.map((a, i) => (
            <Card key={a.id} className={cardCls(sel === i)}>
              <div onClick={() => setSel(i)}>
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
            <div className="mb-3 flex items-center gap-2"><Smartphone size={15} className="text-teal-400" /><span className="text-sm font-semibold text-slate-100">{app.name}</span><Badge kind="pass">{app.platform}</Badge></div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="앱 이름"><Input value={app.name} onChange={(e) => up({ name: e.target.value })} /></Field>
              <Field label="패키지 id"><Input value={app.pkg} onChange={(e) => up({ pkg: e.target.value })} /></Field>
              <Field label="버전 이름"><Input value={app.version} onChange={(e) => up({ version: e.target.value })} /></Field>
              <Field label="versionCode / build no."><Input value={app.versionCode || ""} onChange={(e) => up({ versionCode: e.target.value })} /></Field>
              <Field label="빌드 변형"><Select value={app.variant || PERF_VARIANTS[0]} onChange={(e) => up({ variant: e.target.value })}>{PERF_VARIANTS.map((v) => <option key={v}>{v}</option>)}</Select></Field>
              <Field label="빌드 소스"><Select value={app.source} onChange={(e) => up({ source: e.target.value })}>{PERF_BUILD_SOURCES.map((s) => <option key={s}>{s}</option>)}</Select></Field>
              <Field label="빌드 아티팩트"><Input value={app.build} onChange={(e) => up({ build: e.target.value })} /></Field>
              <Field label="서명 / 프로비저닝"><div className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2"><Toggle on={!!app.signed} onClick={() => up({ signed: !app.signed })} /><span className="text-xs text-slate-400">{app.signed ? "구성됨" : "미구성"}</span></div></Field>
            </div>
            {String(app.variant || "").includes("debug") && <div className="mt-2 rounded-lg border border-amber-800 bg-amber-950 px-2.5 py-1.5 text-xs text-amber-300">debug 빌드는 최적화가 꺼져 측정값이 왜곡됩니다 — release·profileable 권장.</div>}
            {(app.source || "").includes("스토어") && <div className="mt-2 text-xs text-slate-500">스토어 빌드는 프로파일링 제약 · baseline 참조용 — 정밀 측정은 CI 아티팩트 권장.</div>}
          </Card>
          )}
          <Card className="p-4">
            <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-200"><Cpu size={15} className="text-teal-400" />단말·환경 <span className="font-normal text-slate-500">· 클라우드 팜 기기 풀</span></div>
            <table className="w-full text-sm">
              <thead><tr className="border-b border-slate-800 text-left text-slate-500"><th className="py-2 font-medium">기기</th><th className="font-medium">OS</th><th className="font-medium">티어</th><th className="font-medium">팜</th><th className="font-medium">역량</th><th className="font-medium">상태</th></tr></thead>
              <tbody className="text-slate-300">
                {PERF_DEVICES.map((d) => (
                  <tr key={d.id} className="border-b border-slate-800">
                    <td className="py-2 text-slate-200">{d.model}</td><td className="text-xs text-slate-400">{d.os}</td>
                    <td><Badge kind={d.tier === "저사양" ? "warn" : "info"}>{d.tier}</Badge></td>
                    <td className="text-xs text-slate-400">{d.farm}</td>
                    <td className="text-xs"><span className="text-slate-400">trace·FPS</span>{d.caps.power ? <span className="ml-1 text-teal-300">· 전력<Zap size={10} className="inline" /></span> : <span className="ml-1 text-slate-600">· 전력 X</span>}</td>
                    <td><Badge kind={stK[d.status]}>{d.status}</Badge></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="mt-3 text-xs text-slate-500">전력(배터리 전류) 계측은 <span className="text-slate-300">사내 랩(전력 리그)</span>에서만 지원 — 클라우드 팜은 trace·FPS까지. 실기기는 러너 에이전트를 통해 연결됩니다.</div>
          </Card>
        </div>
      </div>
      {modal && (
        <Modal title="대상 앱 추가" onClose={() => setModal(false)}>
          <Field label="앱 이름"><Input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder="예: T월드" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="플랫폼"><Select value="Android" onChange={() => {}}>{PERF_PLATFORMS.map((p) => <option key={p.id} value={p.id} disabled={!p.ready}>{p.label}{!p.ready ? " (준비중)" : ""}</option>)}</Select></Field>
            <Field label="패키지 id"><Input value={nf.pkg} onChange={(e) => setNf({ ...nf, pkg: e.target.value })} placeholder="com.sktelecom.tworld" /></Field>
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
  const [nf, setNf] = useState({ name: "", appId: "", journey: PERF_JOURNEY_SRC[0] });
  const scn = perfScenarios[sel] || perfScenarios[0];
  const appName = (id) => (perfApps.find((a) => a.id === id) || {}).name || "-";
  const add = () => {
    if (!nf.name.trim() || !nf.appId) { toast("이름과 대상 앱을 선택하세요", "warn"); return; }
    addPerfScenario({ id: Date.now(), name: nf.name.trim(), appId: Number(nf.appId), journey: nf.journey, steps: [], metrics: ["e2e", "crash"], marker: { start: "", end: "" }, status: "초안" });
    setSel(0); setModal(false); toast("측정 시나리오가 추가되었습니다", "ok");
  };
  const toggleMetric = (m) => { const has = (scn.metrics || []).includes(m); updatePerfScenario(scn.id, { metrics: has ? scn.metrics.filter((x) => x !== m) : [...(scn.metrics || []), m] }); };
  return (
    <div className="space-y-4">
      <PageToolbar desc="프로파일할 여정 + 수집 지표 + E2E 구간 마커" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-2">
          <Btn kind="primary" icon={Plus} className="w-full" onClick={() => { setNf({ name: "", appId: perfApps[0] ? String(perfApps[0].id) : "", journey: PERF_JOURNEY_SRC[0] }); setModal(true); }}>시나리오 추가</Btn>
          {perfScenarios.map((s, i) => (
            <Card key={s.id} className={cardCls(sel === i)}>
              <div onClick={() => setSel(i)}>
                <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-100">{s.name}</span><div className="flex items-center gap-1.5"><Badge kind={s.status === "활성" ? "pass" : "draft"}>{s.status}</Badge><button onClick={(e) => { e.stopPropagation(); removePerfScenario(s.id); setSel(0); toast("삭제됨", "warn"); }} className="text-slate-500 hover:text-red-400"><X size={12} /></button></div></div>
                <div className="mt-1 text-xs text-slate-500">{appName(s.appId)} · 지표 {(s.metrics || []).length}</div>
              </div>
            </Card>
          ))}
        </div>
        {scn && (
        <Card className="col-span-9 p-4 space-y-4">
          <div className="flex items-center gap-2"><span className="text-sm font-semibold text-slate-100">{scn.name}</span><Badge kind="info">{appName(scn.appId)}</Badge></div>
          <Field label="여정 소스"><div className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-sm text-slate-300">{scn.journey}</div></Field>
          {(scn.steps || []).length > 0 && (
            <div><div className="mb-1 text-xs font-semibold text-slate-400">여정 스텝</div><div className="flex flex-wrap gap-1.5">{scn.steps.map((st, i) => <span key={i} className="rounded bg-slate-800 px-2 py-1 text-xs text-slate-300">{i + 1}. {st}</span>)}</div></div>
          )}
          <div>
            <div className="mb-1.5 text-xs font-semibold text-slate-400">수집 지표 (셀 클릭 토글)</div>
            <div className="grid grid-cols-3 gap-2">
              {PERF_METRICS.map((m) => { const on = (scn.metrics || []).includes(m.id); return (
                <button key={m.id} onClick={() => toggleMetric(m.id)} className={"rounded-lg border px-2.5 py-2 text-left text-xs " + (on ? "border-teal-500 bg-teal-900 text-teal-200" : "border-slate-700 bg-slate-800 text-slate-400")}>{m.label} <span className="text-slate-500">({m.unit || "-"})</span></button>
              ); })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="E2E 시작 마커"><div className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-sm text-slate-300">{(scn.marker && scn.marker.start) || "—"}</div></Field>
            <Field label="E2E 종료 마커"><div className="rounded-lg border border-slate-800 bg-slate-900 px-2.5 py-2 text-sm text-slate-300">{(scn.marker && scn.marker.end) || "—"}</div></Field>
          </div>
          <div className="text-xs text-slate-500">크래시/ANR은 항상 백그라운드로 수집됩니다. 여정이 없는 시작(startup) 시나리오는 실행 N회의 콜드/웜/핫으로 측정합니다.</div>
        </Card>
        )}
      </div>
      {modal && (
        <Modal title="측정 시나리오 추가" onClose={() => setModal(false)}>
          <Field label="이름"><Input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder="예: 홈→요금제 스크롤" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="대상 앱"><Select value={nf.appId} onChange={(e) => setNf({ ...nf, appId: e.target.value })}><option value="">선택</option>{perfApps.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</Select></Field>
            <Field label="여정 소스"><Select value={nf.journey} onChange={(e) => setNf({ ...nf, journey: e.target.value })}>{PERF_JOURNEY_SRC.map((j) => <option key={j}>{j}</option>)}</Select></Field>
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
  const add = () => {
    if (!nf.name.trim() || !nf.appId) { toast("이름과 대상 앱을 선택하세요", "warn"); return; }
    addPerfPlan({ id: Date.now(), name: nf.name.trim(), appId: Number(nf.appId), scenarioIds: [], matrix: { tiers: ["중사양"], farm: PERF_FARMS[0] }, cond: { start: "Cold", net: "LTE", power: false }, repeat: 5, budget: {}, trigger: "수동", status: "초안" });
    setSel(0); setModal(false); toast("측정 계획이 추가되었습니다", "ok");
  };
  const scnsOf = (id) => perfScenarios.filter((s) => s.appId === id);
  const toggleScn = (sid) => { const has = (plan.scenarioIds || []).includes(sid); updatePerfPlan(plan.id, { scenarioIds: has ? plan.scenarioIds.filter((x) => x !== sid) : [...(plan.scenarioIds || []), sid] }); };
  const toggleTier = (t) => { const tiers = (plan.matrix && plan.matrix.tiers) || []; const has = tiers.includes(t); updatePerfPlan(plan.id, { matrix: { ...plan.matrix, tiers: has ? tiers.filter((x) => x !== t) : [...tiers, t] } }); };
  return (
    <div className="space-y-4">
      <PageToolbar desc="대상 앱 + 시나리오 + 기기 매트릭스 + 조건 + 예산(SLA) + 트리거" />
      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-3 space-y-2">
          <Btn kind="primary" icon={Plus} className="w-full" onClick={() => { setNf({ name: "", appId: perfApps[0] ? String(perfApps[0].id) : "" }); setModal(true); }}>계획 추가</Btn>
          {perfPlans.map((p, i) => (
            <Card key={p.id} className={cardCls(sel === i)}>
              <div onClick={() => setSel(i)}>
                <div className="flex items-center justify-between"><span className="text-sm font-semibold text-slate-100">{p.name}</span><div className="flex items-center gap-1.5"><Badge kind={p.status === "활성" ? "pass" : "draft"}>{p.status}</Badge><button onClick={(e) => { e.stopPropagation(); removePerfPlan(p.id); setSel(0); toast("삭제됨", "warn"); }} className="text-slate-500 hover:text-red-400"><X size={12} /></button></div></div>
                <div className="mt-1 text-xs text-slate-500">{appName(p.appId)} · {(p.matrix && p.matrix.tiers || []).length}티어 · {p.trigger}</div>
              </div>
            </Card>
          ))}
        </div>
        {plan && (
        <Card className="col-span-9 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2"><span className="text-sm font-semibold text-slate-100">{plan.name}</span><Badge kind="info">{appName(plan.appId)}</Badge></div>
            <div className="flex items-center gap-1.5 text-xs text-slate-400">활성 <Toggle on={plan.status === "활성"} onClick={() => updatePerfPlan(plan.id, { status: plan.status === "활성" ? "초안" : "활성" })} /></div>
          </div>
          <div>
            <div className="mb-1.5 text-xs font-semibold text-slate-400">측정 시나리오 (셀 클릭 토글)</div>
            <div className="flex flex-wrap gap-1.5">
              {scnsOf(plan.appId).map((s) => { const on = (plan.scenarioIds || []).includes(s.id); return (
                <button key={s.id} onClick={() => toggleScn(s.id)} className={"rounded-lg border px-2.5 py-1.5 text-xs " + (on ? "border-teal-500 bg-teal-900 text-teal-200" : "border-slate-700 bg-slate-800 text-slate-400")}>{s.name}</button>
              ); })}
              {scnsOf(plan.appId).length === 0 && <span className="text-xs text-slate-500">이 앱의 시나리오가 없습니다 — 측정 시나리오에서 추가하세요.</span>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="mb-1.5 text-xs font-semibold text-slate-400">기기 매트릭스</div>
              <div className="mb-2 flex gap-1.5">{PERF_TIERS.map((t) => { const on = (plan.matrix && plan.matrix.tiers || []).includes(t); return <button key={t} onClick={() => toggleTier(t)} className={"flex-1 rounded-lg px-2 py-1.5 text-xs " + (on ? "bg-teal-600 text-white" : "bg-slate-800 text-slate-400")}>{t}</button>; })}</div>
              <Field label="디바이스 팜"><Select value={(plan.matrix && plan.matrix.farm) || PERF_FARMS[0]} onChange={(e) => updatePerfPlan(plan.id, { matrix: { ...plan.matrix, farm: e.target.value } })}>{PERF_FARMS.map((f) => <option key={f}>{f}</option>)}</Select></Field>
            </div>
            <div className="space-y-2">
              <div className="mb-1.5 text-xs font-semibold text-slate-400">측정 조건</div>
              <div className="grid grid-cols-2 gap-2">
                <Field label="시작"><Select value={plan.cond.start} onChange={(e) => updatePerfPlan(plan.id, { cond: { ...plan.cond, start: e.target.value } })}>{PERF_STARTS.map((s) => <option key={s}>{s}</option>)}</Select></Field>
                <Field label="네트워크"><Select value={plan.cond.net} onChange={(e) => updatePerfPlan(plan.id, { cond: { ...plan.cond, net: e.target.value } })}>{PERF_NETWORKS.map((n) => <option key={n}>{n}</option>)}</Select></Field>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-800 px-3 py-2 text-xs text-slate-300">전력(배터리 전류) 계측 <Toggle on={!!plan.cond.power} onClick={() => updatePerfPlan(plan.id, { cond: { ...plan.cond, power: !plan.cond.power } })} /></div>
              {plan.cond.power && <div className="rounded-lg border border-amber-800 bg-amber-950 px-2.5 py-1.5 text-xs text-amber-300">전력 계측은 사내 랩(전력 리그) 기기에서만 가능 — 팜을 '사내 랩'으로.</div>}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Field label="반복 횟수 (중앙값)" hint="노이즈 대응 · N회 중 median"><Input type="number" value={plan.repeat} onChange={(e) => updatePerfPlan(plan.id, { repeat: Math.max(1, +e.target.value || 1) })} className="w-24" /></Field>
            <Field label="트리거"><Select value={plan.trigger} onChange={(e) => updatePerfPlan(plan.id, { trigger: e.target.value })}>{PERF_TRIGGERS.map((t) => <option key={t}>{t}</option>)}</Select></Field>
          </div>
          <div>
            <div className="mb-1.5 text-xs font-semibold text-slate-400">지표별 예산 (SLA) — 비우면 게이트 제외</div>
            <div className="grid grid-cols-3 gap-2">
              {PERF_METRICS.map((m) => (
                <div key={m.id} className="rounded-lg bg-slate-800 px-2.5 py-1.5">
                  <div className="mb-0.5 text-xs text-slate-400">{m.label} <span className="text-slate-500">{m.dir === "up" ? "≥" : "≤"} {m.unit}</span></div>
                  <input type="number" value={(plan.budget && plan.budget[m.id]) != null ? plan.budget[m.id] : ""} onChange={(e) => updatePerfPlan(plan.id, { budget: { ...plan.budget, [m.id]: e.target.value === "" ? undefined : +e.target.value } })} placeholder="—" className="w-full rounded border border-slate-700 bg-slate-900 px-2 py-1 text-sm text-slate-200 outline-none focus:border-teal-500" />
                </div>
              ))}
            </div>
          </div>
        </Card>
        )}
      </div>
      {modal && (
        <Modal title="측정 계획 추가" onClose={() => setModal(false)}>
          <Field label="이름"><Input value={nf.name} onChange={(e) => setNf({ ...nf, name: e.target.value })} placeholder="예: T월드 릴리스 성능 게이트" /></Field>
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
        <div className="mt-2 text-sm text-slate-500">준비·설계(대상·환경 / 측정 시나리오 / 측정 계획)를 먼저 구성하세요.</div>
      </div>
    </div>
  );
}
