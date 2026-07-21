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
export const PERF_FARMS = ["Firebase Test Lab", "BrowserStack", "AWS Device Farm", "사내 랩"];
// 측정 유형 — 모두 Jetpack Macrobenchmark로 실행. 시작(startup)은 여정 스텝이 없는 유형.
export const PERF_SCN_TYPES = ["앱 시작(Startup)", "사용 흐름(Flow)"];
export const PERF_STARTS = ["Cold", "Warm", "Hot"];
export const PERF_TRIGGERS = ["수동", "스케줄", "이벤트(배포)"];
// Macrobenchmark 내장 지표 — SLA 게이트 기준 · agg=집계(퍼센타일/최댓값), dir=낮을수록 좋음(down)
// (CPU·네트워크·크래시/ANR은 스톡 Macrobenchmark 출력이 아니라 제외 — 크래시/ANR은 RUM/필드 영역)
export const PERF_METRICS = [
  { id: "e2e", label: "E2E 소요시간", agg: "P95", unit: "ms", dir: "down" },
  { id: "frame", label: "프레임 시간", agg: "P95", unit: "ms", dir: "down" },
  { id: "mem", label: "메모리 RSS", agg: "Max", unit: "MB", dir: "down" },
  { id: "batt", label: "전력", agg: "평균", unit: "mW", dir: "down" },
];
// 클라우드 팜 기기 풀(Android 우선) — 전력계측은 사내 랩만 지원
export const PERF_DEVICES = [
  { id: "d1", model: "Galaxy S24", os: "Android 14", tier: "고사양", farm: "Firebase Test Lab", status: "온라인", caps: { trace: true, fps: true, power: false } },
  { id: "d2", model: "Galaxy A34", os: "Android 13", tier: "중사양", farm: "Firebase Test Lab", status: "온라인", caps: { trace: true, fps: true, power: false } },
  { id: "d3", model: "Galaxy A15", os: "Android 14", tier: "저사양", farm: "BrowserStack", status: "온라인", caps: { trace: true, fps: true, power: false } },
  { id: "d4", model: "Pixel 6a", os: "Android 14", tier: "중사양", farm: "AWS Device Farm", status: "점유중", caps: { trace: true, fps: true, power: false } },
  { id: "d5", model: "Galaxy S24", os: "Android 14", tier: "고사양", farm: "사내 랩", status: "온라인", caps: { trace: true, fps: true, power: true } },
];
export const INIT_PERF_APPS = [
  { id: 1, name: "온마켓", platform: "Android", pkg: "com.onmarket.app", version: "9.12.0", versionCode: "91200", variant: "release·profileable", source: "CI 아티팩트", build: "onmarket-9.12.0-stg.aab", signed: true, artifactUrl: "https://ci.onmarket.io/artifacts/app/9.12.0/onmarket-9.12.0-stg.aab", tokenRef: "${ci_token}", track: "운영(Production)", buildFile: "", benchModule: ":benchmark", deploySecret: "whsec_9c1e4f2a8b3d7e6f" },
  { id: 2, name: "온마켓 셀러", platform: "Android", pkg: "com.onmarket.seller", version: "5.4.1", versionCode: "5041", variant: "release·profileable", source: "스토어(Play)", build: "-", signed: true, artifactUrl: "", tokenRef: "${ci_token}", track: "운영(Production)", buildFile: "", benchModule: ":benchmark", deploySecret: "whsec_9c1e4f2a8b3d7e6f" },
];
export const INIT_PERF_SCENARIOS = [
  { id: 1, name: "앱 콜드 스타트", appId: 1, journey: "앱 시작(Startup)", steps: [], metrics: ["e2e", "mem"], traceSection: "", status: "활성", startMode: "Cold", scriptModule: ":benchmark", scriptRef: "StartupBenchmark#coldStartup", iterations: 10, benchSource: "@Test\nfun coldStartup() = rule.measureRepeated(\n  packageName = \"com.onmarket.app\",\n  metrics = listOf(StartupTimingMetric(), MemoryUsageMetric(Mode.Last)),\n  iterations = 10, startupMode = StartupMode.COLD,\n) {\n  pressHome(); startActivityAndWait()\n}" },
  { id: 2, name: "홈→상품목록 진입·스크롤", appId: 1, journey: "사용 흐름(Flow)", steps: ["로그인", "홈 진입", "상품 탭", "리스트 스크롤 x10"], metrics: ["e2e", "frame", "mem", "batt"], traceSection: "home_scroll", status: "활성", startMode: "", scriptModule: ":benchmark", scriptRef: "HomeScrollBenchmark#scrollHome", iterations: 10, benchSource: "@Test\nfun scrollHome() = rule.measureRepeated(\n  packageName = \"com.onmarket.app\",\n  metrics = listOf(TraceSectionMetric(\"home_scroll\"), FrameTimingMetric(),\n    MemoryUsageMetric(Mode.Last), PowerMetric(Type.Battery())),\n  iterations = 10, startupMode = StartupMode.WARM,\n) {\n  startActivityAndWait()\n  onView(res(\"login\")).click()\n  onView(res(\"home_tab\")).click()\n  trace(\"home_scroll\") { onView(res(\"product_list\")).fling(DOWN) }\n}" },
  { id: 3, name: "장바구니 담기 여정", appId: 1, journey: "사용 흐름(Flow)", steps: ["상품 상세 진입", "장바구니 담기", "장바구니 뱃지 확인"], metrics: ["e2e", "frame"], traceSection: "add_to_cart", status: "초안", startMode: "", scriptModule: ":benchmark", scriptRef: "CartBenchmark#addToCart", iterations: 10, benchSource: "@Test\nfun addToCart() = rule.measureRepeated(\n  packageName = \"com.onmarket.app\",\n  metrics = listOf(TraceSectionMetric(\"add_to_cart\"), FrameTimingMetric()),\n  iterations = 10, startupMode = StartupMode.WARM,\n) {\n  startActivityAndWait()\n  onView(res(\"product_detail\")).click()\n  trace(\"add_to_cart\") { onView(res(\"add_to_cart\")).click(); onView(text(\"장바구니 (1)\")).check(exists()) }\n}" },
];
export const INIT_PERF_PLANS = [
  { id: 1, name: "온마켓 릴리스 성능 게이트", appId: 1, scenarioIds: [1, 2], matrix: { deviceIds: ["d1", "d2", "d3"] }, cond: { power: false }, budget: { "1": { e2e: 800, mem: 300 }, "2": { e2e: 2000, frame: 20, mem: 400 } }, schedule: { mode: "event", freq: "weekly", time: "09:00", dow: 1, dom: 1, cron: "0 9 * * 1", tz: "Asia/Seoul", active: true, ev: { deploy: true }, summary: "이벤트: 배포" }, status: "활성" },
  { id: 2, name: "저사양 스크롤 성능", appId: 1, scenarioIds: [2], matrix: { deviceIds: ["d3"] }, cond: { power: false }, budget: { "2": { e2e: 2500, frame: 22 } }, schedule: { mode: "manual", freq: "weekly", time: "09:00", dow: 1, dom: 1, cron: "0 9 * * 1", tz: "Asia/Seoul", active: true, ev: {}, summary: "예약 없음" }, status: "초안" },
];
