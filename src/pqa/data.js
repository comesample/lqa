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
    { id: "perf-targets", label: "대상·환경", icon: Plug },
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
export const PERF_JOURNEY_SRC = ["앱 시작(무여정)", "스크립트(Macrobenchmark)", "스크립트(Appium)", "기록(Maestro)"];
export const PERF_STARTS = ["Cold", "Warm", "Hot"];
export const PERF_NETWORKS = ["Wi-Fi", "5G", "LTE", "Fast 3G(셰이핑)", "Slow 3G(셰이핑)"];
export const PERF_TRIGGERS = ["수동", "스케줄", "이벤트(배포)"];
// 7개 측정 지표 — 예산(SLA) 기준 · dir=낮을수록 좋음(down)/높을수록 좋음(up)
export const PERF_METRICS = [
  { id: "e2e", label: "E2E 소요시간", unit: "ms", dir: "down" },
  { id: "mem", label: "메모리·누수", unit: "MB", dir: "down" },
  { id: "cpu", label: "CPU", unit: "%", dir: "down" },
  { id: "net", label: "네트워크 데이터", unit: "MB", dir: "down" },
  { id: "batt", label: "배터리 전류", unit: "mA", dir: "down" },
  { id: "crash", label: "크래시/ANR", unit: "건", dir: "down" },
  { id: "fps", label: "FPS·Frame Drop", unit: "fps", dir: "up" },
];
// 클라우드 팜 기기 풀(Android 우선) — 전력계측은 사내 랩만 지원
export const PERF_DEVICES = [
  { id: "d1", model: "Galaxy S24", os: "Android 14", tier: "고사양", farm: "Firebase Test Lab", status: "온라인", caps: { trace: true, fps: true, power: false } },
  { id: "d2", model: "Galaxy A34", os: "Android 13", tier: "중사양", farm: "Firebase Test Lab", status: "온라인", caps: { trace: true, fps: true, power: false } },
  { id: "d3", model: "Galaxy A15", os: "Android 14", tier: "저사양", farm: "BrowserStack", status: "온라인", caps: { trace: true, fps: true, power: false } },
  { id: "d4", model: "Pixel 6a", os: "Android 14", tier: "중사양", farm: "AWS Device Farm", status: "점유중", caps: { trace: true, fps: true, power: false } },
  { id: "d5", model: "Galaxy S24 · 전력리그", os: "Android 14", tier: "고사양", farm: "사내 랩", status: "온라인", caps: { trace: true, fps: true, power: true } },
];
export const INIT_PERF_APPS = [
  { id: 1, name: "T월드", platform: "Android", pkg: "com.sktelecom.tworld", version: "9.12.0", versionCode: "91200", variant: "release·profileable", source: "CI 아티팩트", build: "tworld-9.12.0-stg.aab", signed: true },
  { id: 2, name: "T다이렉트", platform: "Android", pkg: "com.sktelecom.tdirect", version: "5.4.1", versionCode: "5041", variant: "release·profileable", source: "스토어(Play)", build: "-", signed: true },
];
export const INIT_PERF_SCENARIOS = [
  { id: 1, name: "앱 콜드 스타트", appId: 1, journey: "앱 시작(무여정)", steps: [], metrics: ["e2e", "mem", "cpu", "crash"], marker: { start: "프로세스 시작", end: "첫 프레임(TTID)" }, status: "활성" },
  { id: 2, name: "홈→요금제 진입·스크롤", appId: 1, journey: "스크립트(Macrobenchmark)", steps: ["로그인", "홈 진입", "요금제 탭", "리스트 스크롤 x10"], metrics: ["e2e", "fps", "mem", "cpu", "net", "batt"], marker: { start: "요금제 탭 클릭", end: "리스트 렌더 완료" }, status: "활성" },
];
export const INIT_PERF_PLANS = [
  { id: 1, name: "T월드 릴리스 성능 게이트", appId: 1, scenarioIds: [1, 2], matrix: { tiers: ["고사양", "중사양", "저사양"], farm: "Firebase Test Lab" }, cond: { start: "Cold", net: "LTE", power: false }, repeat: 10, budget: { e2e: 2000, fps: 55, mem: 400, crash: 0 }, trigger: "이벤트(배포)", status: "활성" },
  { id: 2, name: "저사양 스크롤 성능", appId: 1, scenarioIds: [2], matrix: { tiers: ["저사양"], farm: "BrowserStack" }, cond: { start: "Warm", net: "Wi-Fi", power: false }, repeat: 8, budget: { fps: 50, e2e: 2500 }, trigger: "수동", status: "초안" },
];
