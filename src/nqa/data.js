import { LayoutDashboard, Plug, Code2, ClipboardList, Play, History, TrendingUp } from "lucide-react";

/* 비기능 QA · 클라이언트 성능(v1) 메뉴 IA — FQA와 동일한 준비·설계 / 실행·분석 골격 */
export const NQA_SECTIONS = [
  { group: "모니터링", items: [
    { id: "nqa-dashboard", label: "대시보드", icon: LayoutDashboard },
  ] },
  { group: "준비 · 설계", items: [
    { id: "nqa-targets", label: "대상·환경", icon: Plug },
    { id: "nqa-scenarios", label: "측정 시나리오", icon: Code2 },
    { id: "nqa-plan", label: "측정 계획", icon: ClipboardList },
  ] },
  { group: "실행 · 분석", items: [
    { id: "nqa-run", label: "측정 실행", icon: Play },
    { id: "nqa-history", label: "실행 이력", icon: History },
    { id: "nqa-trend", label: "성능 추이", icon: TrendingUp },
  ] },
];

/* 비기능 하위 유형 — 클라이언트 성능(v1)·부하(준비중). 접근성·보안은 향후(미노출). */
export const NQA_SUBTYPES = [
  { id: "load", label: "부하", ready: true },
  { id: "perf", label: "클라이언트 성능", ready: false },
];

/* 부하(v1) — 서버 엔드포인트 자극 + 서버 인프라 관측(APM). 기능 QA와 완전 독립. */
export const NQA_PROTOCOLS = ["HTTP/HTTPS", "gRPC", "WebSocket"];
export const NQA_LOAD_ENVS = ["개발", "스테이징", "운영"];
export const NQA_HTTP_METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"];
export const NQA_APM = ["Jennifer", "Datadog", "Pinpoint", "Scouter", "없음"];
export const NQA_LOADGEN = ["JMeter", "nGrinder", "k6", "Gatling", "Locust"];
export const NQA_APM_AUTO = { "Jennifer": false, "Datadog": true, "Pinpoint": false, "Scouter": false, "없음": false };
export const NQA_AUTH_TYPES = ["Bearer 토큰", "API Key", "OAuth 2.0", "로그인 플로우", "없음"];
// (외부 Secrets 백엔드 제거 — 시크릿은 공통 "변수" 화면에서 관리·참조)
export const NQA_MAX_AGENTS = 20; // 테넌트 부하 생성 한도(쿼터) — 데모 상수. 실제는 테넌트/플랜별 admin 설정.
export const NQA_SERVER_TIERS = ["WAS", "DB", "캐시", "메시지큐", "LB", "기타"];

/* 측정 플랫폼 — 앱 우선(Android/iOS), Web은 고스트(준비중). FQA(웹 우선·앱 고스트)의 반전. */
export const NQA_PLATFORMS = [
  { id: "Web", label: "Web", ready: true },
  { id: "Android", label: "Android", ready: false },
  { id: "iOS", label: "iOS", ready: false },
];
export const NQA_PLAT_K = { Android: "pass", iOS: "info", Web: "active" };
export const NQA_TIERS = ["고사양", "중사양", "저사양"];
/* 측정 도구 — 방식(랩=온디맨드 프로파일링 / 필드=실사용자 집계 telemetry) 구분. */
export const NQA_TOOLS = {
  Android: [
    { name: "Perfetto", method: "랩" },
    { name: "Macrobenchmark", method: "랩" },
    { name: "dumpsys/simpleperf", method: "랩" },
    { name: "Android Vitals", method: "필드" },
    { name: "Firebase Performance", method: "필드" },
  ],
  iOS: [
    { name: "Instruments (xctrace)", method: "랩" },
    { name: "MetricKit", method: "필드" },
  ],
  Web: [
    { name: "Lighthouse", method: "랩" },
    { name: "CrUX / RUM", method: "필드" },
  ],
};
/* 도구별 수집 지표 — 대상 레벨 표기(정보). SLA·임계 선택은 측정 계획에서. */
export const NQA_TOOL_METRICS = {
  "Perfetto": ["기동시간", "메모리", "FPS/jank", "CPU", "전력"],
  "Macrobenchmark": ["기동시간", "FPS/jank"],
  "dumpsys/simpleperf": ["메모리", "CPU", "FPS/jank"],
  "Android Vitals": ["ANR", "충돌", "기동시간", "FPS/jank"],
  "Firebase Performance": ["기동시간", "네트워크", "커스텀 트레이스"],
  "Instruments (xctrace)": ["기동시간", "메모리", "CPU", "FPS", "전력"],
  "MetricKit": ["기동시간", "행(hang)", "메모리", "CPU", "배터리", "디스크"],
  "Lighthouse": ["LCP", "CLS", "TBT", "INP", "성능점수"],
  "CrUX / RUM": ["LCP", "CLS", "INP(필드)"],
};

/* 네트워크 — 실측(비결정적) vs 셰이핑(대역폭·지연·손실 프로파일, 재현 가능). */
export const NQA_NETWORKS = ["Wi-Fi (실측)", "5G (실측)", "LTE (실측)", "Fast 3G (셰이핑)", "Slow 3G (셰이핑)", "오프라인"];
export const NQA_STARTS = ["Cold", "Warm", "Hot"];
export const NQA_THERMAL_LEVELS = ["경고", "심각"];

/* 웹 성능(v1) — 브라우저·뷰포트 매트릭스 + Lighthouse 셰이핑 조건. */
export const NQA_BROWSERS = ["Chrome", "Edge", "Safari", "Firefox"];
export const NQA_VIEWPORTS = ["Desktop 1920×1080", "Desktop 1366×768", "Mobile 390×844 (에뮬)", "Tablet 820×1180"];
export const NQA_WEB_NET = ["No throttle", "Fast 4G (셰이핑)", "Slow 4G (셰이핑)", "Fast 3G (셰이핑)"];
export const NQA_CPU_THROTTLE = ["없음", "2x", "4x", "6x"];
export const NQA_CACHE = ["Cold (캐시 없음)", "Warm (캐시 사용)"];

/* 단말 제공자·가용상태·측정역량 — 향후 디바이스 팜 연동을 위한 골격(사양 vs 인스턴스 분리). */
export const NQA_PROVIDERS = ["사내", "BrowserStack", "AWS Device Farm", "Firebase Test Lab", "HeadSpin"];
export const NQA_DEV_STATUS = ["온라인", "점유중", "오프라인"];
export const NQA_DEV_ST_K = { "온라인": "pass", "점유중": "warn", "오프라인": "draft" };
export const NQA_CAP_LABELS = { trace: "트레이스", fps: "FPS", throttle: "스로틀", thermal: "발열" };
export const NQA_PROVIDER_CAPS = {
  "사내": { trace: true, fps: true, throttle: true, thermal: true },
  "BrowserStack": { trace: true, fps: true, throttle: true, thermal: false },
  "AWS Device Farm": { trace: true, fps: true, throttle: true, thermal: false },
  "Firebase Test Lab": { trace: true, fps: true, throttle: false, thermal: false },
  "HeadSpin": { trace: true, fps: true, throttle: true, thermal: false },
};

/* 측정 시나리오 — 사용자 흐름 + 측정 마커. 저작: 템플릿 / 기능 재사용 / 액션 조립. */
export const NQA_SCN_SOURCES = ["템플릿", "기능 재사용", "액션 조립"];
export const NQA_SCN_SRC_K = { "템플릿": "info", "기능 재사용": "active", "액션 조립": "warn" };
export const NQA_MARKERS = ["LCP", "CLS", "TBT", "INP", "성능점수", "네트워크 페이로드"];
export const NQA_SCN_TEMPLATES = [
  { name: "홈 페이지 로드 (LCP)", steps: [{ type: "flow", act: "페이지 이동", detail: "홈 URL" }, { type: "measure", metric: "LCP" }, { type: "measure", metric: "성능점수" }] },
  { name: "요금제 페이지 진입", steps: [{ type: "flow", act: "페이지 이동", detail: "홈" }, { type: "flow", act: "클릭", detail: "요금제 링크" }, { type: "measure", metric: "LCP" }, { type: "measure", metric: "CLS" }] },
  { name: "검색 상호작용 (INP)", steps: [{ type: "flow", act: "페이지 이동", detail: "검색" }, { type: "flow", act: "입력", detail: "질의어" }, { type: "measure", metric: "INP" }, { type: "measure", metric: "TBT" }] },
  { name: "리스트 스크롤 (CLS)", steps: [{ type: "flow", act: "페이지 이동", detail: "요금제 리스트" }, { type: "flow", act: "스크롤", detail: "하단까지" }, { type: "measure", metric: "CLS" }] },
];
/* 부하 시나리오 — 대상(SUT) 선택 + 워크로드(믹스 재사용/순서 저니) + 부하 형상. SLA 판정은 측정 계획. */
export const NQA_WORKLOAD_MODES = ["믹스 재사용", "순서 저니"];
export const NQA_WORKLOAD_K = { "믹스 재사용": "info", "순서 저니": "active" };
export const NQA_LOAD_UNITS = ["가상 사용자(VU)", "도착률(RPS)"];
export const NQA_LOAD_SHAPES = [
  { id: "스테디", label: "스테디", hint: "일정 부하 유지 — 기준 성능 확인" },
  { id: "램프업", label: "램프업", hint: "점진 증가 — 한계·변곡점 탐색" },
  { id: "스파이크", label: "스파이크", hint: "순간 급증 — 급변 대응·복구력" },
  { id: "스트레스", label: "스트레스(계단)", hint: "계단식 증가 — 포화점까지" },
  { id: "소크", label: "소크(내구)", hint: "장시간 유지 — 누수·성능 저하" },
];
/* 부하 시나리오 시드 — 대상(nqaSystems)과 sutId로 연결. 믹스 재사용은 대상 가중치 사용, 순서 저니는 endpoints 순서 참조. */
export const INIT_NQA_SCENARIOS = [
  { id: 1, name: "T월드 로그인 저니 부하", sutId: 1, mode: "순서 저니", unit: "가상 사용자(VU)", shape: "램프업", peak: 800, rampUp: 5, sustain: 20, rampDown: 3, thinkTime: 3, status: "활성", journey: [{ method: "POST", path: "/v1/auth/login" }, { method: "GET", path: "/v1/users/{id}" }, { method: "GET", path: "/v1/plans" }] },
  { id: 2, name: "T월드 조회 믹스 부하", sutId: 1, mode: "믹스 재사용", unit: "도착률(RPS)", shape: "스테디", peak: 1500, rampUp: 3, sustain: 15, rampDown: 2, thinkTime: 1, status: "초안", journey: [] },
  { id: 3, name: "T다이렉트 스파이크", sutId: 2, mode: "믹스 재사용", unit: "가상 사용자(VU)", shape: "스파이크", peak: 400, rampUp: 1, sustain: 5, rampDown: 1, thinkTime: 2, status: "초안", journey: [] },
];

/* 측정 계획 — 측정 시나리오 참조 + SLA 판정 임계(합격/불합격) + baseline 대비(회귀) + 실행 트리거. 대상(SUT)은 시나리오에서 파생. */
export const NQA_PLAN_TRIGGERS = ["수동 실행", "야간 배치", "릴리스 후 자동"];
export const NQA_BASELINE_MODES = ["없음", "직전 통과 회차", "고정 회차"];
export const INIT_NQA_PLANS = [
  { id: 1, name: "로그인 저니 부하 · 릴리스 게이트", scenarioId: 1, status: "활성", sla: { p95: 1500, p99: 2500, errRate: 1.0, minRps: 600 }, baseline: { mode: "직전 통과 회차", runId: "", tolerance: 10 }, trigger: "릴리스 후 자동" },
  { id: 2, name: "조회 믹스 기준 성능", scenarioId: 2, status: "초안", sla: { p95: 800, p99: 1500, errRate: 0.5, minRps: 1200 }, baseline: { mode: "없음", runId: "", tolerance: 10 }, trigger: "수동 실행" },
];

/* 측정 대상(앱) 시드 — 앱 + 단말 인벤토리 + 측정 도구 + 측정 조건. 단말×조건 조합은 측정 계획에서. */
export const INIT_NQA_SYSTEMS = [
  { id: 1, name: "T월드 API 부하", subtype: "load", baseUrl: "https://api-stg.tworld.co.kr", protocol: "HTTP/HTTPS", env: "스테이징", endpoints: [{ method: "GET", path: "/v1/plans", weight: 50, headers: [], body: "", expect: 200, extracts: [] }, { method: "POST", path: "/v1/auth/login", weight: 30, headers: [{ k: "Content-Type", v: "application/json" }], body: '{ "phone": "${row.phone}", "pw": "${row.pw}" }', expect: 200, extracts: [{ var: "token", path: "$.data.token" }] }, { method: "GET", path: "/v1/users/{id}", weight: 20, headers: [{ k: "Authorization", v: "Bearer ${token}" }], body: "", expect: 200, extracts: [] }], apm: { provider: "Jennifer", servers: [{ name: "was-01", tier: "WAS" }, { name: "was-02", tier: "WAS" }, { name: "tworld-db-01", tier: "DB" }] }, loadgen: { tool: "JMeter", agents: 3 }, auth: { type: "로그인 플로우", loginPath: "/v1/auth/login", ref: "${stg_tworld_token}", dataset: "accounts_10k", correlate: true }, guard: { blockProd: true, approval: false, maxRps: 2000, maxVu: 1000, maxDur: 30, autoErr: 5, autoP95: 2000, autoCpu: 90, autoMem: 85 } },
  { id: 2, name: "T다이렉트 API 부하", subtype: "load", baseUrl: "https://api-stg.direct.tworld.co.kr", protocol: "HTTP/HTTPS", env: "스테이징", endpoints: [{ method: "GET", path: "/v2/products", weight: 70 }, { method: "POST", path: "/v2/order", weight: 30 }], apm: { provider: "Datadog", servers: [{ name: "direct-api-01", tier: "WAS" }] }, loadgen: { tool: "JMeter", agents: 1 }, auth: { type: "Bearer 토큰", loginPath: "", ref: "${stg_tworld_token}", dataset: "", correlate: false }, guard: { blockProd: true, approval: true, maxRps: 800, maxVu: 400, maxDur: 20, autoErr: 3, autoP95: 1500, autoCpu: 85, autoMem: 80 } },
];
