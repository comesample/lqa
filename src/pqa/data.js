// ============================================================
// PQA(앱 성능 · 클라이언트 성능) — 데이터/시드. Android 우선 · iOS 확장 가능.
// nqa/data.js에서 분리(2026-07).
// ============================================================
import { LayoutDashboard, Plug, Code2, ClipboardList, Play, History, TrendingUp } from "lucide-react";

// 메뉴: 모니터링(대시보드) → 준비·설계 → 실행·분석 — 다른 QA 도메인과 동일
export const PQA_SECTIONS = [
  { group: "모니터링", items: [
    { id: "perf-dashboard", label: "대시보드", icon: LayoutDashboard },
  ] },
  { group: "준비 · 설계", items: [
    { id: "perf-targets", label: "대상 앱", icon: Plug },
    { id: "perf-scenarios", label: "측정 시나리오", icon: Code2 },
    { id: "perf-plan", label: "측정 계획", icon: ClipboardList },
  ] },
  { group: "실행 · 분석", items: [
    { id: "perf-run", label: "측정 실행", icon: Play },
    { id: "perf-history", label: "실행 이력", icon: History },
    { id: "perf-trend", label: "성능 추이", icon: TrendingUp },
  ] },
];
export const PERF_PLATFORMS = [{ id: "Android", label: "Android", ready: true }, { id: "iOS", label: "iOS", ready: false }];
export const PERF_BUILD_SOURCES = ["CI 아티팩트", "스토어(Play)", "직접 업로드"];
export const PERF_VARIANTS = ["release·profileable", "release", "benchmark", "debug(비권장)"];
export const PERF_TIERS = ["고사양", "중사양", "저사양"];
// 측정 유형 — 모두 Jetpack Macrobenchmark로 실행. 시작(startup)은 여정 스텝이 없는 유형.
export const PERF_SCN_TYPES = ["앱 시작(Startup)", "사용 흐름(Flow)"];
export const PERF_STARTS = ["Cold", "Warm", "Hot"];
export const PERF_TRIGGERS = ["수동", "스케줄", "이벤트(배포)"];
// Macrobenchmark 내장 지표 — SLA 게이트 기준 · agg=집계(퍼센타일/최댓값), dir=낮을수록 좋음(down)
// (CPU·네트워크·크래시/ANR은 스톡 Macrobenchmark 출력이 아니라 제외 — 크래시/ANR은 RUM/필드 영역)
export const PERF_METRICS = [
  { id: "e2e", label: "E2E 소요시간", agg: "P95", unit: "ms", dir: "down" },
  { id: "frame", label: "프레임 시간", agg: "P95", unit: "ms", dir: "down" },
  { id: "jank", label: "프레임 오버런", agg: "P95", unit: "ms", dir: "down" },
  { id: "mem", label: "메모리 RSS", agg: "Max", unit: "MB", dir: "down" },
  { id: "batt", label: "전력", agg: "평균", unit: "mW", dir: "down" },
];
// 사내 랩 단일 구성 — 티어별 실기기 풀(8대). 전력 계측(ODPM)은 Pixel 8 리그(power:true). slot=랙 위치.
export const PERF_DEVICES = [
  { id: "d1", model: "Galaxy S24", os: "Android 14", tier: "고사양", farm: "사내 랩", slot: "R1-01", status: "온라인", caps: { trace: true, fps: true, power: false } },
  { id: "d2", model: "Galaxy S24", os: "Android 14", tier: "고사양", farm: "사내 랩", slot: "R1-02", status: "온라인", caps: { trace: true, fps: true, power: false } },
  { id: "d3", model: "Galaxy A54", os: "Android 14", tier: "중사양", farm: "사내 랩", slot: "R1-03", status: "온라인", caps: { trace: true, fps: true, power: false } },
  { id: "d4", model: "Galaxy A54", os: "Android 14", tier: "중사양", farm: "사내 랩", slot: "R1-04", status: "점유중", caps: { trace: true, fps: true, power: false } },
  { id: "d5", model: "Galaxy A15", os: "Android 14", tier: "저사양", farm: "사내 랩", slot: "R1-05", status: "온라인", caps: { trace: true, fps: true, power: false } },
  { id: "d6", model: "Galaxy A15", os: "Android 14", tier: "저사양", farm: "사내 랩", slot: "R1-06", status: "온라인", caps: { trace: true, fps: true, power: false } },
  { id: "d7", model: "Pixel 8", os: "Android 15", tier: "고사양", farm: "사내 랩", slot: "R1-07", status: "온라인", caps: { trace: true, fps: true, power: true } },
  { id: "d8", model: "Pixel 8", os: "Android 15", tier: "고사양", farm: "사내 랩", slot: "R1-08", status: "온라인", caps: { trace: true, fps: true, power: true } },
];
export const INIT_PERF_APPS = [
  { id: 1, name: "온마켓", platform: "Android", pkg: "com.onmarket.app", version: "9.12.0", versionCode: "91200", variant: "release·profileable", source: "CI 아티팩트", build: "onmarket-9.12.0-stg.aab", signed: true, artifactUrl: "https://ci.onmarket.io/artifacts/app/9.12.0/onmarket-9.12.0-stg.aab", tokenRef: "${ci_token}", track: "운영(Production)", buildFile: "", benchModule: ":benchmark", deploySecret: "whsec_9c1e4f2a8b3d7e6f" },
  { id: 2, name: "온마켓 셀러", platform: "Android", pkg: "com.onmarket.seller", version: "5.4.1", versionCode: "5041", variant: "release·profileable", source: "스토어(Play)", build: "-", signed: true, artifactUrl: "", tokenRef: "${ci_token}", track: "운영(Production)", buildFile: "", benchModule: ":benchmark", deploySecret: "whsec_9c1e4f2a8b3d7e6f" },
];
export const INIT_PERF_SCENARIOS = [
  { id: 1, name: "앱 콜드 스타트", appId: 1, journey: "앱 시작(Startup)", steps: [], metrics: ["e2e", "mem"], traceSection: "", status: "활성", startMode: "Cold", scriptModule: ":benchmark", scriptRef: "StartupBenchmark#coldStartup", iterations: 10, benchSource: "@Test\nfun coldStartup() = rule.measureRepeated(\n  packageName = \"com.onmarket.app\",\n  metrics = listOf(StartupTimingMetric(), MemoryUsageMetric(Mode.Last)),\n  iterations = 10, startupMode = StartupMode.COLD,\n) {\n  pressHome(); startActivityAndWait()\n}" },
  { id: 2, name: "홈→상품목록 진입·스크롤", appId: 1, journey: "사용 흐름(Flow)", steps: ["로그인", "홈 진입", "상품 탭", "리스트 스크롤 x10"], metrics: ["e2e", "frame", "jank", "mem", "batt"], traceSection: "home_scroll", status: "활성", startMode: "", scriptModule: ":benchmark", scriptRef: "HomeScrollBenchmark#scrollHome", iterations: 10, benchSource: "@Test\nfun scrollHome() = rule.measureRepeated(\n  packageName = \"com.onmarket.app\",\n  metrics = listOf(TraceSectionMetric(\"home_scroll\"), FrameTimingMetric(),\n    MemoryUsageMetric(Mode.Last), PowerMetric(Type.Battery())),\n  iterations = 10, startupMode = StartupMode.WARM,\n) {\n  startActivityAndWait()\n  onView(res(\"login\")).click()\n  onView(res(\"home_tab\")).click()\n  trace(\"home_scroll\") { onView(res(\"product_list\")).fling(DOWN) }\n}" },
  { id: 3, name: "장바구니 담기 여정", appId: 1, journey: "사용 흐름(Flow)", steps: ["상품 상세 진입", "장바구니 담기", "장바구니 뱃지 확인"], metrics: ["e2e", "frame", "jank"], traceSection: "add_to_cart", status: "초안", startMode: "", scriptModule: ":benchmark", scriptRef: "CartBenchmark#addToCart", iterations: 10, benchSource: "@Test\nfun addToCart() = rule.measureRepeated(\n  packageName = \"com.onmarket.app\",\n  metrics = listOf(TraceSectionMetric(\"add_to_cart\"), FrameTimingMetric()),\n  iterations = 10, startupMode = StartupMode.WARM,\n) {\n  startActivityAndWait()\n  onView(res(\"product_detail\")).click()\n  trace(\"add_to_cart\") { onView(res(\"add_to_cart\")).click(); onView(text(\"장바구니 (1)\")).check(exists()) }\n}" },
];
export const INIT_PERF_PLANS = [
  { id: 1, name: "온마켓 릴리스 성능 게이트", appId: 1, scenarioIds: [1, 2], matrix: { deviceIds: ["d1", "d3", "d5"] }, budget: { "1": { e2e: 800, mem: 300 }, "2": { e2e: 2000, frame: 20, jank: 8, mem: 400 } }, schedule: { mode: "event", freq: "weekly", time: "09:00", dow: 1, dom: 1, cron: "0 9 * * 1", tz: "Asia/Seoul", active: true, ev: { deploy: true }, summary: "이벤트: 배포" }, status: "활성" },
  { id: 2, name: "저사양 스크롤 성능", appId: 1, scenarioIds: [2], matrix: { deviceIds: ["d5"] }, budget: { "2": { e2e: 2500, frame: 22, jank: 12 } }, schedule: { mode: "manual", freq: "weekly", time: "09:00", dow: 1, dom: 1, cron: "0 9 * * 1", tz: "Asia/Seoul", active: true, ev: {}, summary: "예약 없음" }, status: "초안" },
];

// 측정 실행 — 계획을 1회 돌린 실행 인스턴스(회차). 서브잡=시나리오×단말. 이력·추이가 파생.
// 성능 추이용으로 빌드별 시계열을 생성한다 — 빌드 5~6(9.11.2·9.12.0-rc1)에 회귀 유입, 6~7에서 개선. 저사양(d5)은 게이트 상시 초과.
const _PR_DEV = { d1: ["Galaxy S24", "R1-01"], d3: ["Galaxy A54", "R1-03"], d5: ["Galaxy A15", "R1-05"] };
const _PR_BUILDS = [
  ["9.10.0", "91000", "2026-06-16 08:05", "2026-06-16 08:14"],
  ["9.10.1", "91010", "2026-06-23 08:05", "2026-06-23 08:13"],
  ["9.11.0", "91100", "2026-06-30 08:05", "2026-06-30 08:15"],
  ["9.11.1", "91110", "2026-07-07 08:05", "2026-07-07 08:14"],
  ["9.11.2", "91120", "2026-07-10 08:05", "2026-07-10 08:15"],
  ["9.12.0-rc1", "91200", "2026-07-14 08:05", "2026-07-14 08:16"],
  ["9.12.0-rc2", "91201", "2026-07-18 08:05", "2026-07-18 08:15"],
  ["9.12.0", "91202", "2026-07-22 08:10", "2026-07-22 08:19"],
];
const _PR_F = {
  e2e:   [1.00, 1.00, 0.98, 0.99, 1.13, 1.14, 1.03, 1.02],
  frame: [1.00, 1.00, 0.99, 1.00, 1.08, 1.09, 1.02, 1.01],
  jank:  [1.00, 1.05, 0.95, 1.00, 1.30, 1.35, 1.06, 1.02],
  mem:   [1.00, 1.01, 1.02, 1.02, 1.03, 1.03, 1.02, 1.01],
};
const _PR_BASE = {
  1: { d1: { e2e: 600, mem: 270 }, d3: { e2e: 690, mem: 285 }, d5: { e2e: 745, mem: 288 } },
  2: { d1: { e2e: 1560, frame: 16.0, jank: 1.6, mem: 350 }, d3: { e2e: 1780, frame: 18.0, jank: 3.8, mem: 378 }, d5: { e2e: 1880, frame: 19.2, jank: 6.8, mem: 380 } },
};
const _PR_SCN = { 1: ["앱 콜드 스타트", "앱 시작(Startup)"], 2: ["홈→상품목록 진입·스크롤", "사용 흐름(Flow)"] };
const _PR_DIDC = { d1: 1, d3: 3, d5: 5 };
const _PR_ROUND = (mid, v) => (mid === "e2e" || mid === "mem") ? Math.round(v) : Math.round(v * 10) / 10;
const _PR_SUB = (bi, did, sid, budget) => {
  const base = _PR_BASE[sid][did]; const metrics = {}; let fail = false, gated = false;
  const wob = 1 + (((bi * 7 + _PR_DIDC[did]) % 5) - 2) * 0.006;
  Object.keys(base).forEach((mid) => {
    const v = _PR_ROUND(mid, base[mid] * (_PR_F[mid] ? _PR_F[mid][bi] : 1) * wob);
    metrics[mid] = v; const b = budget ? budget[mid] : undefined;
    if (b != null) { gated = true; if (v > b) fail = true; }
  });
  const [scn, journey] = _PR_SCN[sid];
  return { did, model: _PR_DEV[did][0], slot: _PR_DEV[did][1], sid, scn, journey, iters: 10, iter: 10, status: fail ? "실패" : "완료", metrics, verdict: gated ? (fail ? "FAIL" : "PASS") : "—" };
};
const _PR_RUN = (idNum, planId, planName, bi, devs, sids, budgets, trig) => {
  const subs = []; devs.forEach((did) => sids.forEach((sid) => subs.push(_PR_SUB(bi, did, sid, budgets[sid]))));
  const [ver, verCode, startedAt, endedAt] = _PR_BUILDS[bi];
  const verdict = subs.some((s) => s.verdict === "FAIL") ? "불합격" : (subs.some((s) => s.verdict === "PASS") ? "합격" : "미판정");
  return { id: "PRUN-" + idNum, planId, plan: planName, app: "온마켓", ver, verCode, no: 0, status: "완료", verdict, by: "이민준", trig, at: startedAt, startedAt, endedAt, queuedAt: idNum, devices: devs.length, scns: sids.length, power: false, subjobs: subs };
};
const _P1_BUD = { 1: { e2e: 800, mem: 300 }, 2: { e2e: 2000, frame: 20, jank: 8, mem: 400 } };
const _P2_BUD = { 2: { e2e: 2500, frame: 22, jank: 12 } };
export const INIT_PERF_RUNS = (() => {
  const out = [];
  _PR_BUILDS.forEach((b, bi) => out.push(_PR_RUN(1101 + bi, 1, "온마켓 릴리스 성능 게이트", bi, ["d1", "d3", "d5"], [1, 2], _P1_BUD, bi === _PR_BUILDS.length - 1 ? "이벤트" : (bi % 3 === 0 ? "스케줄" : "이벤트"))));
  for (let bi = 2; bi < _PR_BUILDS.length; bi++) out.push(_PR_RUN(1201 + bi, 2, "저사양 스크롤 성능", bi, ["d5"], [2], _P2_BUD, bi % 2 === 0 ? "수동" : "스케줄"));
  const byPlan = {}; out.forEach((r) => { byPlan[r.planId] = (byPlan[r.planId] || 0) + 1; r.no = byPlan[r.planId]; });
  return out.sort((a, b) => (b.startedAt || "").localeCompare(a.startedAt || ""));
})();
