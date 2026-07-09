// ============================================================
// FQA 시드 데이터 · 네비게이션 설정 (단일 출처)
// lqa/data.js에서 분리(2026-07-01). App이 import.
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

export const INIT_FQA_CASES = [
  { id: "TC-API-101", platform: "API", name: "사용자 조회", suite: "API 연동", tags: "api,smoke", status: "승인", last: "PASS", level: "Low-Code", dataset: "-", hist: ["PASS", "PASS", "PASS", "PASS"], defects: 0, steps: [
    { act: "요청", loc: "GET /v1/users/{id}", val: "헤더: Authorization: Bearer" },
    { act: "검증", loc: "상태코드", val: "200" },
    { act: "검증", loc: "응답 스키마", val: "OpenAPI 계약 준수" },
  ] },
  { id: "TC-API-102", platform: "API", name: "사용자 생성", suite: "API 연동", tags: "api", status: "승인", last: "PASS", level: "Low-Code", dataset: "signup_emails", hist: ["PASS", "PASS", "PASS"], defects: 0, steps: [
    { act: "요청", loc: "POST /v1/users", val: "바디: { name, phone }" },
    { act: "검증", loc: "상태코드", val: "201" },
    { act: "검증", loc: "응답 헤더", val: "Location 존재" },
  ] },
  { id: "TC-API-103", platform: "API", name: "로그인 토큰 발급", suite: "API 연동", tags: "api,auth", status: "승인", last: "PASS", level: "Full-Code", dataset: "-", hist: ["PASS", "FAIL", "PASS", "PASS"], defects: 0, steps: [
    { act: "요청", loc: "POST /v1/auth/login", val: "바디: { id, pw }" },
    { act: "검증", loc: "상태코드", val: "200" },
    { act: "검증", loc: "$.token", val: "JWT 형식" },
  ] },
  { id: "TC-API-104", platform: "API", name: "요금제 목록 조회", suite: "API 연동", tags: "api", status: "승인", last: "FAIL", level: "Low-Code", dataset: "-", hist: ["PASS", "FAIL", "FAIL", "FAIL"], defects: 1, steps: [
    { act: "요청", loc: "GET /v1/plans", val: "헤더: Accept: application/json" },
    { act: "검증", loc: "상태코드", val: "200" },
    { act: "검증", loc: "$.items[]", val: "배열 · 스키마 준수" },
  ] },
  { id: "TC-API-105", platform: "API", name: "사용자 삭제", suite: "API 연동", tags: "api", status: "검토중", last: "-", level: "Low-Code", dataset: "-", hist: [], defects: 0, steps: [
    { act: "요청", loc: "DELETE /v1/users/{id}", val: "헤더: Authorization: Bearer" },
    { act: "검증", loc: "상태코드", val: "204" },
  ] },
  { id: "TC-031", platform: "Web", name: "로그인 성공", suite: "로그인 / 인증", tags: "smoke,login", status: "승인", last: "PASS", level: "Low-Code", dataset: "accounts_10k", hist: ["PASS", "PASS", "PASS", "PASS"], defects: 0, steps: [
    { act: "브라우저 열기", loc: "url", val: "https://www.tworld.co.kr/login" },
    { act: "텍스트 입력", loc: "[data-testid=userid]", val: '"qa_user01"' },
    { act: "텍스트 입력", loc: "[data-testid=password]", val: '"********"' },
    { act: "요소 클릭", loc: "role=button[로그인]", val: "-" },
    { act: "검증", loc: "[data-testid=welcome]", val: 'text = "환영합니다"' },
  ] },
  { id: "TC-021", platform: "Web", name: "회원가입 이메일 형식 검증", suite: "회원가입", tags: "signup", status: "승인", last: "PASS", level: "Low-Code", dataset: "signup_emails", hist: ["PASS", "PASS", "FAIL", "PASS"], defects: 0, steps: [
    { act: "브라우저 열기", loc: "url", val: "https://www.tworld.co.kr/signup" },
    { act: "텍스트 입력", loc: "[data-testid=email]", val: '"invalid-email"' },
    { act: "요소 클릭", loc: "role=button[다음]", val: "-" },
    { act: "검증", loc: "[data-testid=error]", val: 'text = "올바른 이메일 형식이 아닙니다"' },
  ] },
  { id: "TC-156", platform: "Web", name: "부가서비스 상태 반영", suite: "결제 / 요금제", tags: "regression", status: "승인", last: "FAIL", level: "Low-Code", dataset: "-", hist: ["FAIL", "PASS", "FAIL", "FAIL"], defects: 1, steps: [
    { act: "브라우저 열기", loc: "url", val: "https://www.tworld.co.kr/login" },
    { act: "텍스트 입력", loc: "[data-testid=userid]", val: '"qa_user01"' },
    { act: "요소 클릭", loc: "role=button[로그인]", val: "-" },
    { act: "요소 클릭", loc: "#menu_addon", val: "-" },
    { act: "요소 클릭", loc: "#btn_subscribe", val: "-" },
    { act: "검증", loc: "[data-testid=addon_status]", val: 'text = "이용 중"' },
  ] },
  { id: "TC-203", platform: "Web", name: "OTP 재발송 오류", suite: "로그인 / 인증", tags: "regression", status: "승인", last: "FAIL", level: "Low-Code", dataset: "-", hist: ["FAIL", "PASS", "FAIL", "PASS"], defects: 1, steps: [
    { act: "브라우저 열기", loc: "url", val: "https://www.tworld.co.kr/login" },
    { act: "요소 클릭", loc: "role=button[OTP 재발송]", val: "-" },
    { act: "검증", loc: "[data-testid=otp_msg]", val: 'text = "재발송되었습니다"' },
  ] },
  { id: "TC-REC-001", platform: "Web", name: "로그인 정상 동작 (레코딩)", suite: "로그인 / 인증", tags: "login", status: "검토중", last: "-", level: "Low-Code", dataset: "-", hist: [], defects: 0, steps: [
    { act: "브라우저 열기", loc: "url", val: "https://www.tworld.co.kr/login" },
    { act: "텍스트 입력", loc: "#id", val: '"qa_user01"' },
    { act: "텍스트 입력", loc: "#pw", val: '"********"' },
    { act: "요소 클릭", loc: "button.login", val: "-" },
    { act: "검증", loc: ".dashboard", val: 'visible = true' },
  ] },
  { id: "TC-MCP-001", platform: "Web", name: "로그인 탐색 시나리오 (MCP)", suite: "로그인 / 인증", tags: "login", status: "검토중", last: "-", level: "Low-Code", dataset: "-", hist: [], defects: 0, steps: [
    { act: "브라우저 열기", loc: "url", val: "https://www.tworld.co.kr" },
    { act: "요소 클릭", loc: "text=로그인", val: "-" },
    { act: "텍스트 입력", loc: "[name=user]", val: '"qa_user01"' },
    { act: "요소 클릭", loc: "role=button[로그인]", val: "-" },
    { act: "검증", loc: "[data-testid=home]", val: 'visible = true' },
  ] },
]

export const INIT_FQA_SUITES = [
  { id: 1, platform: "Web", name: "로그인 / 인증", parent: 0, module: "인증", owner: "QA Lead", tags: "smoke,login", desc: "로그인·세션·인증 흐름", enabled: true, mapOverride: false, mapType: "태그", mapVal: "", fxOverride: false, ssMode: "inherit", seedExtra: false, cleanExtra: false },
  { id: 2, platform: "Web", name: "회원가입", parent: 1, module: "온보딩", owner: "김QA", tags: "signup", desc: "가입 폼·검증", enabled: true, mapOverride: false, mapType: "태그", mapVal: "", fxOverride: false, ssMode: "inherit", seedExtra: false, cleanExtra: false },
  { id: 3, platform: "Web", name: "메인 화면", parent: 0, module: "홈", owner: "이QA", tags: "smoke", desc: "메인 스모크", enabled: true, mapOverride: false, mapType: "태그", mapVal: "", fxOverride: false, ssMode: "inherit", seedExtra: false, cleanExtra: false },
  { id: 4, platform: "Web", name: "결제 / 요금제", parent: 0, module: "결제", owner: "박QA", tags: "critical,pay", desc: "결제·요금제 (전용 계정·데이터 필요)", enabled: true, mapOverride: false, mapType: "태그", mapVal: "", fxOverride: true, ssMode: "role", seedExtra: true, cleanExtra: true },
  { id: 5, platform: "API", name: "API 연동", parent: 0, module: "API", owner: "QA Lead", tags: "api", desc: "레거시 폴더 조직 테스트", enabled: true, mapOverride: true, mapType: "폴더", mapVal: "tests/api/", fxOverride: false, ssMode: "inherit", seedExtra: false, cleanExtra: false },
];

export const INIT_FQA_SYSTEMS = [
  { id: 1, name: "T월드 웹", platform: "Web", envs: [
    { env: "스테이징", url: "https://stg.tworld.co.kr", status: "연결됨", ver: "v5.12.0-rc", prod: false, accts: [
      { role: "일반", acct: "qa_user01", secretRef: "${stg_test_pw}", st: "활성" },
      { role: "VIP", acct: "qa_vip01", secretRef: "${stg_test_pw}", st: "활성" },
      { role: "관리자", acct: "qa_admin", secretRef: "${stg_test_pw}", st: "활성" },
    ] },
    { env: "운영", url: "https://www.tworld.co.kr", status: "연결됨", ver: "v5.11.3", prod: true, accts: [
      { role: "합성", acct: "synth_prod01", secretRef: "${stg_test_pw}", st: "활성" },
    ] },
  ] },
  { id: 2, name: "T월드 API", platform: "API", envs: [
    { env: "스테이징", url: "https://api-stg.tworld.co.kr", status: "연결됨", ver: "v2.4.1", prod: false, apiSpec: "OpenAPI 3.0", specUrl: "https://api-stg.tworld.co.kr/openapi.json", accts: [
      { role: "서비스", acct: "svc_api_stg", secretRef: "${stg_tworld_token}", st: "활성" },
    ] },
  ] },
  { id: 3, name: "고객센터 웹", platform: "Web", envs: [
    { env: "스테이징", url: "https://stg-cs.tworld.co.kr", status: "연결됨", ver: "v2.3.0", prod: false, accts: [
      { role: "일반", acct: "cs_qa01", secretRef: "${stg_test_pw}", st: "활성" },
    ] },
  ] },
];


export const INIT_FQA_RUNS = [
  { id: "FRUN-503", platform: "API", name: "API 스모크", plan: "API 스모크 (스테이징)", suite: "API 연동", brow: "", trig: "CI", by: "CI/CD Bot", status: "완료", prog: 100, progt: "5/5", dur: "0분 9초", at: "오늘 10:30", startedAt: "2026-07-09 10:30", endedAt: "2026-07-09 10:30", total: 5, pass: 4, fail: 1, warn: 0, heal: 0, tcs: [
    { id: "TC-API-101", name: "사용자 조회", v: "PASS", dur: "0.3s" },
    { id: "TC-API-102", name: "사용자 생성", v: "PASS", dur: "0.4s" },
    { id: "TC-API-103", name: "로그인 토큰 발급", v: "PASS", dur: "0.5s" },
    { id: "TC-API-104", name: "요금제 목록 조회", v: "FAIL", dur: "0.6s" },
    { id: "TC-API-105", name: "사용자 삭제", v: "PASS", dur: "0.2s" },
  ] },
  { id: "FRUN-512", name: "로그인 회귀", plan: "로그인 회귀 (스테이징)", suite: "로그인 / 인증", brow: "Chrome", trig: "수동", by: "QA Engineer", status: "실행 중", prog: 62, progt: "42/68", dur: "3분 12초", at: "방금 전", total: 68, pass: 42, fail: 0, warn: 0, heal: 1, tcs: [] },
  { id: "FRUN-511", name: "결제 스모크", plan: "결제 회귀", suite: "결제 / 요금제", brow: "Chrome+FF", trig: "CI", by: "CI/CD Bot", status: "실행 중", prog: 33, progt: "8/24", dur: "5분 02초", at: "방금 전", total: 24, pass: 8, fail: 0, warn: 0, heal: 0, tcs: [] },
  { id: "FRUN-509", name: "회원가입 검증", plan: "전체 스모크 (운영)", suite: "회원가입", brow: "Chrome", trig: "예약", by: "예약", status: "대기 중", prog: 0, progt: "대기 #1", dur: "-", at: "-", total: 0, pass: 0, fail: 0, warn: 0, heal: 0, tcs: [] },
  { id: "FRUN-505", name: "메인 화면 스모크", plan: "전체 스모크 (운영)", suite: "메인 화면", brow: "Chrome", trig: "수동", by: "QA Engineer", status: "완료", prog: 100, progt: "30/30", dur: "2분 41초", at: "어제 18:20", startedAt: "2026-07-08 18:20", endedAt: "2026-07-08 18:22", total: 30, pass: 30, fail: 0, warn: 0, heal: 0, tcs: [
    { id: "TC-101", name: "메인 배너 노출", v: "PASS", dur: "0.6s" },
    { id: "TC-102", name: "추천 요금제 카드 렌더", v: "PASS", dur: "0.9s" },
  ] },
  { id: "FRUN-502", name: "로그인 회귀", plan: "로그인 회귀 (스테이징)", suite: "로그인 / 인증", brow: "Chrome", trig: "스케줄", by: "스케줄", status: "완료", prog: 97, progt: "66/68", dur: "3분 30초", at: "오늘 11:10", startedAt: "2026-07-09 11:10", endedAt: "2026-07-09 11:13", total: 68, pass: 61, fail: 5, warn: 2, heal: 3, tcs: [
    { id: "TC-156", name: "부가서비스 신청 후 상태 미반영", v: "FAIL", dur: "8.4s" },
    { id: "TC-203", name: "OTP 재발송 오류", v: "FAIL", dur: "1.2s" },
    { id: "TC-089", name: "레이아웃 깨짐", v: "FAIL", dur: "0.5s" },
    { id: "TC-031", name: "로그인 성공", v: "PASS", dur: "0.7s", heal: { step: "아이디 입력 요소", from: "[data-testid=userid]", to: "[data-testid=user-id]", conf: 90 } },
    { id: "TC-044", name: "자동 로그인", v: "PASS", dur: "1.8s" },
    { id: "TC-055", name: "세션 만료", v: "PASS", dur: "3.2s" },
  ] },
  { id: "FRUN-498", name: "결제 스모크", plan: "결제 회귀", suite: "결제 / 요금제", brow: "Chrome", trig: "CI", by: "CI/CD Bot", status: "완료", prog: 100, progt: "24/24", dur: "2분 10초", at: "오늘 09:42", startedAt: "2026-07-09 09:42", endedAt: "2026-07-09 09:44", total: 24, pass: 24, fail: 0, warn: 0, heal: 0, tcs: [] },
  { id: "FRUN-499", name: "결제 스모크", plan: "결제 회귀", suite: "결제 / 요금제", brow: "Chrome", trig: "CI", by: "CI/CD Bot", status: "오류", prog: 0, progt: "연결 실패", dur: "-", at: "오늘 08:50", startedAt: "2026-07-09 08:50", endedAt: "-", total: 0, pass: 0, fail: 0, warn: 0, heal: 0, tcs: [] },
  { id: "FRUN-491", name: "메인 화면 스모크", plan: "전체 스모크 (운영)", suite: "메인 화면", brow: "Chrome", trig: "수동", by: "QA Engineer", status: "완료", prog: 100, progt: "30/30", dur: "2분 41초", at: "어제 18:20", startedAt: "2026-07-08 18:20", endedAt: "2026-07-08 18:22", total: 30, pass: 30, fail: 0, warn: 0, heal: 0, tcs: [
    { id: "TC-101", name: "메인 배너 노출", v: "PASS", dur: "0.6s" },
    { id: "TC-102", name: "추천 요금제 카드 렌더", v: "PASS", dur: "0.8s" },
  ] },
  { id: "FRUN-487", name: "로그인 회귀", plan: "로그인 회귀 (스테이징)", suite: "로그인 / 인증", brow: "Chrome", trig: "스케줄", by: "스케줄", status: "완료", prog: 100, progt: "66/68", dur: "3분 22초", at: "어제 09:00", startedAt: "2026-07-08 09:00", endedAt: "2026-07-08 09:03", total: 68, pass: 66, fail: 0, warn: 2, heal: 0, tcs: [
    { id: "TC-156", name: "부가서비스 신청 후 상태 미반영", v: "PASS", dur: "1.1s" },
    { id: "TC-203", name: "OTP 재발송 오류", v: "PASS", dur: "1.0s" },
    { id: "TC-089", name: "레이아웃 깨짐", v: "WARN", dur: "0.6s" },
    { id: "TC-031", name: "로그인 성공", v: "PASS", dur: "0.7s" },
    { id: "TC-044", name: "자동 로그인", v: "WARN", dur: "1.9s" },
    { id: "TC-055", name: "세션 만료", v: "PASS", dur: "3.1s" },
  ] },
];

export const INIT_FQA_PLANS = [
  { id: 4, name: "API 스모크 (스테이징)", target: "T월드 API · 스테이징", suites: "API 연동", tags: "api,smoke", sched: "커밋 시(CI)", status: "활성", brow: [], res: "-", headless: true, workers: "4", retry: 1, onfail: "계속 진행", video: "실패 시만", timeout: 30, gate: 95 },
  { id: 1, name: "로그인 회귀 (스테이징)", target: "T월드 웹 · 스테이징", suites: "로그인 / 인증", tags: "regression", sched: "매일 09:00", status: "활성", brow: ["Chrome"], res: "1920×1080", headless: true, workers: "4", retry: 1, onfail: "계속 진행", video: "실패 시만", gate: 95 },
  { id: 2, name: "전체 스모크 (운영)", target: "T월드 웹 · 운영", suites: "전체", tags: "smoke", sched: "커밋 시(CI)", status: "활성", brow: ["Chrome", "Firefox"], res: "1920×1080", headless: true, workers: "auto", retry: 0, onfail: "계속 진행", video: "녹화 안 함", gate: 98 },
  { id: 3, name: "결제 회귀", target: "T월드 웹 · 스테이징", suites: "결제 / 요금제", tags: "critical", sched: "예약 없음", status: "초안", brow: ["Chrome"], res: "1440×900", headless: false, workers: "2", retry: 2, onfail: "첫 에러 시 중단", video: "전체 녹화", gate: 100 },
];
