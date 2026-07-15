// ============================================================
// FQA 시드 데이터 · 네비게이션 설정 (단일 출처)
// 재편(2026-07): platform 축 제거 · 환경 멀티 접점(웹/API) · 케이스 상대경로 · 계획 ID참조/다중스위트
//   대상   = 제품(SUT).            환경 = 한 배포본이 노출하는 접점(webUrl/apiUrl) + 공유 계정
//   스위트 = 순수 업무 흐름 묶음.   케이스 = 상대경로 스텝(act가 접점을 결정) — 웹·API 혼합 가능
//   계획   = 환경 1개 바인딩(ID참조) + 스위트 다중 선택 + 실행 옵션
// ============================================================
import { LayoutDashboard, Plug, Layers, Code2, ClipboardList, Play, FileText, History, GitCompare, Activity } from "lucide-react";

export const FQA_SECTIONS = [
  { group: "모니터링", items: [
    { id: "fqa-dashboard", label: "대시보드", icon: LayoutDashboard },
  ] },
  { group: "준비 · 설계", items: [
    { id: "fqa-targets", label: "대상·환경", icon: Plug },
    { id: "fqa-suites", label: "테스트 스위트", icon: Layers },
    { id: "fqa-cases", label: "테스트케이스", icon: Code2 },
    { id: "fqa-plan", label: "실행 계획", icon: ClipboardList },
  ] },
  { group: "실행 · 분석", items: [
    { id: "fqa-run", label: "실행", icon: Play },
    { id: "fqa-history", label: "실행 이력", icon: History },
    { id: "fqa-regression", label: "회귀 비교", icon: GitCompare },
    { id: "fqa-flaky", label: "불안정(Flaky)", icon: Activity },
  ] },
];
export const FQA_HIDDEN = [
  { id: "fqa-result-detail", label: "결과 상세", icon: FileText, group: "실행 · 분석" },
];

/* ── 스텝 액션 카탈로그 ──────────────────────────────────────
   act가 접점(surface)을 결정한다 — 별도 platform 필드 불필요.
     화면(web) : 이동 · 입력 · 클릭 · 화면 검증   → 환경의 webUrl 주입
     요청(api) : 요청 · 응답 검증                → 환경의 apiUrl 주입
   loc(이동)는 반드시 상대경로("/login") — 절대 URL 금지(환경 주입 불가해짐)

   스텝 필드
     공통      : act · loc · val
     요청(api) : + body(JSON 본문) · headers(예외 헤더만) · save("이름 = $.경로")
                 인증 헤더는 환경의 apiAuth에서 주입 — 케이스에 적지 않는다.
                 save로 저장한 값은 이후 스텝에서 ${이름}으로 참조(웹 스텝 포함).
                 요청은 웹 세션의 쿠키를 공유한다(page.request) — 웹→API 흐름이 성립하는 근거. */
export const WEB_ACTS = ["이동", "입력", "클릭", "선택", "체크", "키 누르기", "화면 검증"];
export const API_ACTS = ["요청", "응답 검증"];
export const STEP_ACTS = [...WEB_ACTS, ...API_ACTS, "코드 스텝"];
export const surfaceOf = (act) => (API_ACTS.includes(act) ? "api" : WEB_ACTS.includes(act) ? "web" : "code");

/* ── 대상(제품) · 환경(배포본 = 멀티 접점) ───────────────── */
export const INIT_FQA_SYSTEMS = [
  { id: 1, name: "T월드", envs: [
    { env: "스테이징", prod: false, status: "연결됨", ver: "v5.12.0-rc",
      webUrl: "https://stg.tworld.co.kr",
      apiUrl: "https://api-stg.tworld.co.kr",
      accts: [
        { role: "일반", acct: "qa_user01", secretRef: "${stg_test_pw}" },
        { role: "VIP", acct: "qa_vip01", secretRef: "${stg_test_pw}" },
        { role: "관리자", acct: "qa_admin", secretRef: "${stg_test_pw}" },
      ],
      apiAuth: { type: "OAuth 2.0 (Client Credentials)", tokenUrl: "https://auth-stg.tworld.co.kr/oauth2/token", clientId: "exq-qa-runner", clientSecret: "${stg_oauth_secret}", scope: "orders.read orders.write" },
      access: { basicAuth: true, baUser: "stg", baPw: "${stg_basic_pw}", tlsIgnore: true },
      deploy: { mode: "배포 웹훅 알림", verUrl: "", verPath: "$.version", interval: "15분" } },
    { env: "운영", prod: true, status: "연결됨", ver: "v5.11.3",
      webUrl: "https://www.tworld.co.kr",
      apiUrl: "https://api.tworld.co.kr",
      accts: [
        { role: "일반", acct: "synth_prod01", secretRef: "${prod_synth_pw}" },
      ],
      apiAuth: { type: "OAuth 2.0 (Client Credentials)", tokenUrl: "https://auth.tworld.co.kr/oauth2/token", clientId: "exq-qa-runner", clientSecret: "${prod_oauth_secret}", scope: "orders.read" },
      access: { basicAuth: false, baUser: "", baPw: "", tlsIgnore: false },
      deploy: { mode: "배포 웹훅 알림", verUrl: "", verPath: "$.version", interval: "15분" } },
  ] },
  { id: 2, name: "고객센터", envs: [
    { env: "스테이징", prod: false, status: "연결됨", ver: "v2.3.0",
      webUrl: "https://stg-cs.tworld.co.kr",
      accts: [
        { role: "일반", acct: "cs_qa01", secretRef: "${stg_test_pw}", status: "활성" },
      ],
      access: { basicAuth: false, baUser: "", baPw: "", tlsIgnore: true },
      deploy: { mode: "버전 엔드포인트 폴링", verUrl: "https://stg-cs.tworld.co.kr/health", verPath: "$.version", interval: "15분" } },
  ] },
];

/* ── 테스트 스위트 = 순수 업무 흐름 묶음 (id · name · desc) ── */
export const INIT_FQA_SUITES = [
  { id: 1, name: "로그인 / 인증", desc: "로그인·세션·인증 흐름" },
  { id: 2, name: "회원가입", desc: "가입 폼·검증" },
  { id: 3, name: "메인 화면", desc: "메인 스모크" },
  { id: 4, name: "결제 / 요금제", desc: "요금제 조회(웹) → 결제(API) 혼합 흐름" },
  { id: 5, name: "API 연동", desc: "공개 API 계약 검증" },
];

/* ── 테스트케이스 = 상대경로 스텝 (환경 독립) ─────────────── */
export const INIT_FQA_CASES = [
  /* acctRole: 이 케이스가 어떤 역할의 계정으로 돌아야 하는지 — 실제 계정은 실행 계획이 고른 환경의 계정 풀에서 주입 */
  { id: "TC-0031", origin: "레코딩", name: "로그인 성공", suite: "로그인 / 인증", tags: "smoke,critical", status: "승인", level: "Low-Code", dataset: "-", acctRole: "일반", steps: [
    { act: "이동", loc: "/login", val: "-" },
    { act: "입력", loc: "[data-testid=userid]", val: "${계정 ID}" },
    { act: "입력", loc: "[data-testid=password]", val: "${계정 비밀번호}" },
    { act: "클릭", loc: "role=button[로그인]", val: "-" },
    { act: "화면 검증", loc: "[data-testid=welcome]", val: 'text = "환영합니다"' },
  ] },
  { id: "TC-0203", origin: "레코딩", name: "OTP 재발송", suite: "로그인 / 인증", tags: "regression", status: "승인", level: "Low-Code", dataset: "-", steps: [
    { act: "이동", loc: "/login", val: "-" },
    { act: "클릭", loc: "role=button[OTP 재발송]", val: "-" },
    { act: "화면 검증", loc: "[data-testid=otp_msg]", val: 'text = "재발송되었습니다"' },
  ] },
  /* Full-Code = 케이스에 코드가 저장된다(스텝에서 재생성하지 않음). versions에 직전 버전 스냅샷이 쌓인다. */
  { id: "TC-0055", origin: "직접 작성", name: "세션 만료 처리", suite: "로그인 / 인증", tags: "regression", status: "승인", level: "Full-Code", dataset: "-", quarantined: false, rev: 3,
    steps: [
      { act: "코드 스텝", loc: "", val: "", code: "await page.context().clearCookies();\nawait page.goto('/my');\nawait expect(page).toHaveURL(/\\/login/);" },
    ],
    code: "import { test, expect } from '@playwright/test';\n\ntest('TC-0055 세션 만료 처리', async ({ page }) => {\n  await page.context().clearCookies();\n  await page.goto('/my');\n  await expect(page).toHaveURL(/\\/login/);\n});",
    /* 리비전 = 그 시점의 전체 스냅샷 (최신이 앞) */
    versions: [
      { rev: 2, at: "2026-06-14 11:20", by: "김지훈", note: "", level: "Full-Code", name: "세션 만료 처리", suite: "로그인 / 인증", tags: "regression", dataset: "-", acctRole: "",
        steps: [{ act: "코드 스텝", loc: "", val: "", code: "await page.goto('/my');\nawait expect(page).toHaveURL(/\\/login/);" }],
        code: "import { test, expect } from '@playwright/test';\n\ntest('TC-0055 세션 만료 처리', async ({ page }) => {\n  await page.goto('/my');\n  await expect(page).toHaveURL(/\\/login/);\n});" },
      { rev: 1, at: "2026-05-30 09:05", by: "이서연", note: "", level: "Low-Code", name: "세션 만료 확인", suite: "로그인 / 인증", tags: "", dataset: "-", acctRole: "",
        steps: [
          { act: "이동", loc: "/my", val: "-" },
          { act: "화면 검증", loc: "[data-testid=login-form]", val: "visible = true" },
        ],
        code: "" },
    ] },
  { id: "TC-0021", origin: "레코딩", name: "회원가입 이메일 형식 검증", suite: "회원가입", tags: "regression", status: "승인", level: "Low-Code", dataset: "signup_emails", steps: [
    { act: "이동", loc: "/signup", val: "-" },
    { act: "입력", loc: "[data-testid=email]", val: '"invalid-email"' },
    { act: "클릭", loc: "role=button[다음]", val: "-" },
    { act: "화면 검증", loc: "[data-testid=error]", val: 'text = "올바른 이메일 형식이 아닙니다"' },
  ] },
  { id: "TC-0101", origin: "레코딩", name: "메인 배너 노출", suite: "메인 화면", tags: "smoke", status: "승인", level: "Low-Code", dataset: "-", steps: [
    { act: "이동", loc: "/", val: "-" },
    { act: "화면 검증", loc: "[data-testid=main-banner]", val: "visible = true" },
  ] },
  { id: "TC-0102", origin: "레코딩", name: "추천 요금제 카드 렌더", suite: "메인 화면", tags: "smoke", status: "승인", level: "Low-Code", dataset: "-", steps: [
    { act: "이동", loc: "/", val: "-" },
    { act: "화면 검증", loc: "[data-testid=plan-card]", val: "count >= 3" },
  ] },

  /* ★ 혼합 케이스 — 웹으로 담고 → 결제 API 호출 → 다시 웹으로 확인 (한 세션·한 케이스)
     결제 요청은 웹 세션 쿠키를 그대로 쓰므로 장바구니 상태가 이어진다.
     응답의 orderId를 save로 저장해 뒤의 웹 스텝에서 ${orderId}로 사용한다. */
  { id: "TC-0301", origin: "직접 작성", name: "요금제 선택(웹) → 결제(API) → 주문 확인(웹)", suite: "결제 / 요금제", tags: "critical", status: "승인", level: "Low-Code", dataset: "-", steps: [
    { act: "이동", loc: "/plans", val: "-" },
    { act: "클릭", loc: "[data-testid=plan-5g-premium]", val: "-" },
    { act: "클릭", loc: "role=button[장바구니 담기]", val: "-" },
    { act: "화면 검증", loc: "[data-testid=cart-count]", val: 'text = "1"' },
    { act: "요청", loc: "POST /v1/orders/checkout", val: "-", body: '{ "payment": "card" }', headers: "", save: "orderId = $.orderId" },
    { act: "응답 검증", loc: "상태코드", val: "200" },
    { act: "응답 검증", loc: "$.orderId", val: "존재" },
    { act: "이동", loc: "/orders/${orderId}", val: "-" },
    { act: "화면 검증", loc: "[data-testid=order-status]", val: 'text = "결제완료"' },
  ] },
  { id: "TC-0156", origin: "레코딩", name: "부가서비스 상태 반영", suite: "결제 / 요금제", tags: "regression", status: "승인", level: "Low-Code", dataset: "-", quarantined: false, steps: [
    { act: "이동", loc: "/my/addon", val: "-" },
    { act: "클릭", loc: "#btn_subscribe", val: "-" },
    { act: "화면 검증", loc: "[data-testid=addon_status]", val: 'text = "이용 중"' },
  ] },

  { id: "TC-0401", origin: "API 임포트", name: "사용자 조회", suite: "API 연동", tags: "smoke", status: "승인", level: "Low-Code", dataset: "-", steps: [
    { act: "요청", loc: "GET /v1/users/qa_user01", val: "-", body: "", headers: "", save: "" },
    { act: "응답 검증", loc: "상태코드", val: "200" },
    { act: "응답 검증", loc: "$.name", val: "존재" },
  ] },
  /* 생성 → 저장(userId) → 조회 : save 체이닝 */
  { id: "TC-0402", origin: "API 임포트", name: "사용자 생성 후 조회", suite: "API 연동", tags: "regression", status: "승인", level: "Low-Code", dataset: "signup_emails", steps: [
    { act: "요청", loc: "POST /v1/users", val: "-", body: '{ "name": "${row.name}", "phone": "010-0000-0000" }', headers: "", save: "userId = $.id" },
    { act: "응답 검증", loc: "상태코드", val: "201" },
    { act: "요청", loc: "GET /v1/users/${userId}", val: "-", body: "", headers: "", save: "" },
    { act: "응답 검증", loc: "상태코드", val: "200" },
  ] },
  { id: "TC-0403", origin: "직접 작성", name: "로그인 토큰 발급", suite: "API 연동", tags: "smoke,critical", status: "승인", level: "Full-Code", dataset: "-", steps: [
    { act: "요청", loc: "POST /v1/auth/login", val: "-", body: '{ "id": "${계정 ID}", "pw": "${계정 비밀번호}" }', headers: "", save: "token = $.token" },
    { act: "응답 검증", loc: "상태코드", val: "200" },
    { act: "응답 검증", loc: "$.token", val: "존재" },
  ] },
  { id: "TC-0404", origin: "API 임포트", name: "요금제 목록 조회", suite: "API 연동", tags: "smoke", status: "승인", level: "Low-Code", dataset: "-", steps: [
    { act: "요청", loc: "GET /v1/plans", val: "-", body: "", headers: "Accept: application/json", save: "" },
    { act: "응답 검증", loc: "상태코드", val: "200" },
    { act: "응답 검증", loc: "$.items", val: "존재" },
  ] },
  { id: "TC-0405", origin: "API 임포트", name: "사용자 삭제", suite: "API 연동", tags: "regression", status: "검토중", level: "Low-Code", dataset: "-", steps: [
    { act: "요청", loc: "DELETE /v1/users/qa_user01", val: "-", body: "", headers: "", save: "" },
    { act: "응답 검증", loc: "상태코드", val: "204" },
  ] },
];

/* ── 실행 이력 ─────────────────────────────────────────────── */
export const INIT_FQA_RUNS = [
  { id: "FRUN-503", name: "API 스모크", plan: "API 스모크 (스테이징)", suite: "API 연동", target: "T월드 · 스테이징", ver: "v5.12.0-rc", brow: "", trig: "CI", by: "CI/CD Bot", status: "완료", prog: 100, progt: "5/5", dur: "0분 9초", at: "오늘 10:30", startedAt: "2026-07-09 10:30", endedAt: "2026-07-09 10:30", total: 5, pass: 4, fail: 1, warn: 0, heal: 0, tcs: [
    { id: "TC-0401", name: "사용자 조회", v: "PASS", dur: "0.3s" },
    { id: "TC-0402", name: "사용자 생성 후 조회", v: "PASS", dur: "0.4s" },
    { id: "TC-0403", name: "로그인 토큰 발급", v: "PASS", dur: "0.5s" },
    { id: "TC-0404", name: "요금제 목록 조회", v: "FAIL", dur: "0.6s" },
    { id: "TC-0405", name: "사용자 삭제", v: "PASS", dur: "0.2s" },
  ] },
  { id: "FRUN-512", name: "로그인 회귀", plan: "로그인 회귀 (스테이징)", suite: "로그인 / 인증", target: "T월드 · 스테이징", ver: "v5.12.0-rc", brow: "Chrome", trig: "수동", by: "QA Engineer", status: "실행 중", prog: 62, progt: "2/3", dur: "3분 12초", at: "방금 전", total: 3, pass: 2, fail: 0, warn: 0, heal: 1, tcs: [] },
  { id: "FRUN-511", name: "결제 회귀", plan: "결제 회귀 (웹+API)", suite: "결제 / 요금제", target: "T월드 · 스테이징", ver: "v5.12.0-rc", brow: "Chrome", trig: "CI", by: "CI/CD Bot", status: "실행 중", prog: 50, progt: "1/2", dur: "5분 02초", at: "방금 전", total: 2, pass: 1, fail: 0, warn: 0, heal: 0, tcs: [] },
  { id: "FRUN-509", name: "회원가입 검증", plan: "전체 스모크 (운영)", suite: "회원가입", target: "T월드 · 운영", ver: "v5.11.3", brow: "Chrome", trig: "예약", by: "예약", status: "대기 중", prog: 0, progt: "대기 #1", dur: "-", at: "-", total: 0, pass: 0, fail: 0, warn: 0, heal: 0, tcs: [] },
  { id: "FRUN-505", name: "메인 화면 스모크", plan: "전체 스모크 (운영)", suite: "메인 화면", target: "T월드 · 운영", ver: "v5.11.3", brow: "Chrome", trig: "수동", by: "QA Engineer", status: "완료", prog: 100, progt: "2/2", dur: "2분 41초", at: "어제 18:20", startedAt: "2026-07-08 18:20", endedAt: "2026-07-08 18:22", total: 2, pass: 2, fail: 0, warn: 0, heal: 0, tcs: [
    { id: "TC-0101", name: "메인 배너 노출", v: "PASS", dur: "0.6s" },
    { id: "TC-0102", name: "추천 요금제 카드 렌더", v: "PASS", dur: "0.9s" },
  ] },
  { id: "FRUN-502", name: "결제 회귀", plan: "결제 회귀 (웹+API)", suite: "결제 / 요금제", target: "T월드 · 스테이징", ver: "v5.12.0-rc", brow: "Chrome", trig: "스케줄", by: "스케줄", status: "완료", prog: 100, progt: "2/2", dur: "3분 30초", at: "오늘 11:10", startedAt: "2026-07-09 11:10", endedAt: "2026-07-09 11:13", total: 2, pass: 1, fail: 1, warn: 0, heal: 1, tcs: [
    { id: "TC-0301", name: "요금제 선택(웹) → 결제(API) → 주문 확인(웹)", v: "PASS", dur: "8.4s", heal: { step: "장바구니 버튼", from: "[data-testid=cart]", to: "[data-testid=cart-add]", conf: 90 } },
    { id: "TC-0156", name: "부가서비스 상태 반영", v: "FAIL", dur: "1.2s" },
  ] },
  { id: "FRUN-499", name: "API 스모크", plan: "API 스모크 (스테이징)", suite: "API 연동", target: "T월드 · 스테이징", ver: "v5.12.0-rc", brow: "", trig: "CI", by: "CI/CD Bot", status: "오류", prog: 0, progt: "연결 실패", dur: "-", at: "오늘 08:50", startedAt: "2026-07-09 08:50", endedAt: "-", total: 0, pass: 0, fail: 0, warn: 0, heal: 0, tcs: [] },
  { id: "FRUN-487", name: "로그인 회귀", plan: "로그인 회귀 (스테이징)", suite: "로그인 / 인증", target: "T월드 · 스테이징", ver: "v5.11.9-rc", brow: "Chrome", trig: "스케줄", by: "스케줄", status: "완료", prog: 100, progt: "3/3", dur: "3분 22초", at: "어제 09:00", startedAt: "2026-07-08 09:00", endedAt: "2026-07-08 09:03", total: 3, pass: 2, fail: 0, warn: 1, heal: 0, tcs: [
    { id: "TC-0031", name: "로그인 성공", v: "PASS", dur: "1.1s" },
    { id: "TC-0203", name: "OTP 재발송", v: "WARN", dur: "1.0s" },
    { id: "TC-0055", name: "세션 만료 처리", v: "PASS", dur: "3.1s" },
  ] },
];

/* ── 실행 계획 = 환경 1개(ID참조) + 스위트 다중 + 실행 옵션 ── */
export const INIT_FQA_PLANS = [
  { id: 1, name: "로그인 회귀 (스테이징)", targetRef: { systemId: 1, env: "스테이징" }, suites: ["로그인 / 인증"], tags: "regression", sched: "매일 09:00", status: "활성",
    brow: ["Chrome"], res: "1920×1080", headless: true, video: "실패 시만", timeout: 30, workers: "4", retry: 1, onfail: "계속 진행", gate: 95 },
  { id: 2, name: "전체 스모크 (운영)", targetRef: { systemId: 1, env: "운영" }, suites: ["로그인 / 인증", "메인 화면", "회원가입"], tags: "smoke", sched: "커밋 시(CI)", status: "활성",
    brow: ["Chrome", "Firefox"], res: "1920×1080", headless: true, video: "녹화 안 함", timeout: 30, workers: "auto", retry: 0, onfail: "계속 진행", gate: 98 },
  { id: 3, name: "결제 회귀 (웹+API)", targetRef: { systemId: 1, env: "스테이징" }, suites: ["결제 / 요금제"], tags: "critical", sched: "예약 없음", status: "초안",
    brow: ["Chrome"], res: "1440×900", headless: false, video: "전체 녹화", timeout: 30, workers: "2", retry: 2, onfail: "첫 에러 시 중단", gate: 100 },
  { id: 4, name: "API 스모크 (스테이징)", targetRef: { systemId: 1, env: "스테이징" }, suites: ["API 연동"], tags: "smoke", sched: "커밋 시(CI)", status: "활성",
    brow: ["Chrome"], res: "1920×1080", headless: true, video: "녹화 안 함", timeout: 30, workers: "4", retry: 1, onfail: "계속 진행", gate: 95 },
];
