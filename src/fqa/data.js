// ============================================================
// FQA 시드 데이터 · 네비게이션 설정 (단일 출처)
// lqa/data.js에서 분리(2026-07-01). App이 import.
// ============================================================
import { LayoutDashboard, Plug, Layers, Code2, ClipboardList, Play, FileText, Clock, TrendingUp, Activity } from "lucide-react";

export const FQA_SECTIONS = [
  { group: "모니터링", items: [
    { id: "fqa-dashboard", label: "대시보드", icon: LayoutDashboard },
  ] },
  { group: "준비 · 설계", items: [
    { id: "fqa-targets", label: "대상·환경", icon: Plug },
    { id: "fqa-suites", label: "테스트 스위트", icon: Layers },
    { id: "fqa-cases", label: "테스트케이스", icon: Code2 },
  ] },
  { group: "실행 · 분석", items: [
    { id: "fqa-plan", label: "실행 계획", icon: ClipboardList },
    { id: "fqa-run", label: "실행", icon: Play },
    { id: "fqa-history", label: "실행 이력", icon: Clock },
    { id: "fqa-regression", label: "회귀 비교", icon: TrendingUp },
    { id: "fqa-flaky", label: "불안정(Flaky)", icon: Activity },
  ] },
];
export const FQA_HIDDEN = [
  { id: "fqa-result-detail", label: "결과 상세", icon: FileText, group: "실행 · 분석" },
];

export const INIT_FQA_CASES = [
  { id: "TC-031", name: "로그인 성공", suite: "로그인 / 인증", tags: "smoke,login", status: "승인", last: "PASS", level: "No-Code", dataset: "계정 풀 ×3", hist: ["PASS", "PASS", "PASS", "PASS"], defects: 0, steps: [
    { act: "브라우저 열기", loc: "url", val: "https://www.tworld.co.kr/login" },
    { act: "텍스트 입력", loc: "[data-testid=userid]", val: '"qa_user01"' },
    { act: "텍스트 입력", loc: "[data-testid=password]", val: '"********"' },
    { act: "요소 클릭", loc: "role=button[로그인]", val: "-" },
    { act: "검증", loc: "[data-testid=welcome]", val: 'text = "환영합니다"' },
  ] },
  { id: "TC-021", name: "회원가입 이메일 형식 검증", suite: "회원가입", tags: "signup", status: "승인", last: "PASS", level: "No-Code", dataset: "이메일 ×6", hist: ["PASS", "PASS", "FAIL", "PASS"], defects: 0, steps: [
    { act: "브라우저 열기", loc: "url", val: "https://www.tworld.co.kr/signup" },
    { act: "텍스트 입력", loc: "[data-testid=email]", val: '"invalid-email"' },
    { act: "요소 클릭", loc: "role=button[다음]", val: "-" },
    { act: "검증", loc: "[data-testid=error]", val: 'text = "올바른 이메일 형식이 아닙니다"' },
  ] },
  { id: "TC-156", name: "부가서비스 상태 반영", suite: "결제 / 요금제", tags: "regression", status: "승인", last: "FAIL", level: "Low-Code", dataset: "-", hist: ["FAIL", "PASS", "FAIL", "FAIL"], defects: 1, steps: [
    { act: "브라우저 열기", loc: "url", val: "https://www.tworld.co.kr/login" },
    { act: "텍스트 입력", loc: "[data-testid=userid]", val: '"qa_user01"' },
    { act: "요소 클릭", loc: "role=button[로그인]", val: "-" },
    { act: "요소 클릭", loc: "#menu_addon", val: "-" },
    { act: "요소 클릭", loc: "#btn_subscribe", val: "-" },
    { act: "검증", loc: "[data-testid=addon_status]", val: 'text = "이용 중"' },
  ] },
  { id: "TC-203", name: "OTP 재발송 오류", suite: "로그인 / 인증", tags: "regression", status: "승인", last: "FAIL", level: "No-Code", dataset: "-", hist: ["FAIL", "PASS", "FAIL", "PASS"], defects: 1, steps: [
    { act: "브라우저 열기", loc: "url", val: "https://www.tworld.co.kr/login" },
    { act: "요소 클릭", loc: "role=button[OTP 재발송]", val: "-" },
    { act: "검증", loc: "[data-testid=otp_msg]", val: 'text = "재발송되었습니다"' },
  ] },
  { id: "TC-REC-001", name: "로그인 정상 동작 (레코딩)", suite: "로그인 / 인증", tags: "login", status: "검토중", last: "-", level: "No-Code", dataset: "-", hist: [], defects: 0, steps: [
    { act: "브라우저 열기", loc: "url", val: "https://www.tworld.co.kr/login" },
    { act: "텍스트 입력", loc: "#id", val: '"qa_user01"' },
    { act: "텍스트 입력", loc: "#pw", val: '"********"' },
    { act: "요소 클릭", loc: "button.login", val: "-" },
    { act: "검증", loc: ".dashboard", val: 'visible = true' },
  ] },
  { id: "TC-MCP-001", name: "로그인 탐색 시나리오 (MCP)", suite: "로그인 / 인증", tags: "login", status: "검토중", last: "-", level: "No-Code", dataset: "-", hist: [], defects: 0, steps: [
    { act: "브라우저 열기", loc: "url", val: "https://www.tworld.co.kr" },
    { act: "요소 클릭", loc: "text=로그인", val: "-" },
    { act: "텍스트 입력", loc: "[name=user]", val: '"qa_user01"' },
    { act: "요소 클릭", loc: "role=button[로그인]", val: "-" },
    { act: "검증", loc: "[data-testid=home]", val: 'visible = true' },
  ] },
]

export const INIT_FQA_SUITES = [
  { id: 1, name: "로그인 / 인증", parent: 0, module: "인증", owner: "QA Lead", tags: "smoke,login", desc: "로그인·세션·인증 흐름", enabled: true, mapOverride: false, mapType: "태그", mapVal: "", fxOverride: false, ssMode: "inherit", seedExtra: false, cleanExtra: false },
  { id: 2, name: "회원가입", parent: 1, module: "온보딩", owner: "김QA", tags: "signup", desc: "가입 폼·검증", enabled: true, mapOverride: false, mapType: "태그", mapVal: "", fxOverride: false, ssMode: "inherit", seedExtra: false, cleanExtra: false },
  { id: 3, name: "메인 화면", parent: 0, module: "홈", owner: "이QA", tags: "smoke", desc: "메인 스모크", enabled: true, mapOverride: false, mapType: "태그", mapVal: "", fxOverride: false, ssMode: "inherit", seedExtra: false, cleanExtra: false },
  { id: 4, name: "결제 / 요금제", parent: 0, module: "결제", owner: "박QA", tags: "critical,pay", desc: "결제·요금제 (전용 계정·데이터 필요)", enabled: true, mapOverride: false, mapType: "태그", mapVal: "", fxOverride: true, ssMode: "role", seedExtra: true, cleanExtra: true },
  { id: 5, name: "API 연동", parent: 0, module: "API", owner: "QA Lead", tags: "api", desc: "레거시 폴더 조직 테스트", enabled: true, mapOverride: true, mapType: "폴더", mapVal: "tests/api/", fxOverride: false, ssMode: "inherit", seedExtra: false, cleanExtra: false },
];

export const INIT_FQA_SYSTEMS = [
  { id: 1, name: "T월드 웹", type: "Web", envs: [
    { env: "스테이징", url: "https://stg.tworld.co.kr", status: "연결됨", ver: "v5.12.0-rc", prod: false, accts: [
      { role: "일반", acct: "qa_user01", secretRef: "vault://tworld/stg/qa_user01", st: "활성" },
      { role: "VIP", acct: "qa_vip01", secretRef: "vault://tworld/stg/qa_vip01", st: "활성" },
      { role: "관리자", acct: "qa_admin", secretRef: "vault://tworld/stg/qa_admin", st: "활성" },
    ] },
    { env: "운영", url: "https://www.tworld.co.kr", status: "연결됨", ver: "v5.11.3", prod: true, accts: [
      { role: "합성", acct: "synth_prod01", secretRef: "vault://tworld/prod/synth01", st: "활성" },
    ] },
  ] },
  { id: 2, name: "T월드 API", type: "API", envs: [
    { env: "스테이징", url: "https://api-stg.tworld.co.kr", status: "미확인", ver: "-", prod: false, accts: [
      { role: "서비스", acct: "svc_api_stg", secretRef: "vault://tworld/api-stg/token", st: "활성" },
    ] },
  ] },
  { id: 3, name: "고객센터 웹", type: "Web", envs: [
    { env: "스테이징", url: "https://stg-cs.tworld.co.kr", status: "연결됨", ver: "v2.3.0", prod: false, accts: [
      { role: "일반", acct: "cs_qa01", secretRef: "vault://cs/stg/qa01", st: "활성" },
    ] },
  ] },
];


export const INIT_FQA_RUNS = [
  { id: "FRUN-512", name: "로그인 회귀", plan: "로그인 회귀 (스테이징)", suite: "로그인 / 인증", brow: "Chrome", trig: "수동", by: "QA Engineer", status: "실행 중", prog: 62, progt: "42/68", dur: "3분 12초", at: "방금 전", total: 68, pass: 42, fail: 0, warn: 0, heal: 1, tcs: [] },
  { id: "FRUN-511", name: "결제 스모크", plan: "결제 회귀", suite: "결제 / 요금제", brow: "Chrome+FF", trig: "CI", by: "CI/CD Bot", status: "실행 중", prog: 33, progt: "8/24", dur: "5분 02초", at: "방금 전", total: 24, pass: 8, fail: 0, warn: 0, heal: 0, tcs: [] },
  { id: "FRUN-509", name: "회원가입 검증", plan: "전체 스모크 (운영)", suite: "회원가입", brow: "Chrome", trig: "예약", by: "예약", status: "대기 중", prog: 0, progt: "대기 #1", dur: "-", at: "-", total: 0, pass: 0, fail: 0, warn: 0, heal: 0, tcs: [] },
  { id: "FRUN-505", name: "메인 화면 스모크", plan: "전체 스모크 (운영)", suite: "메인 화면", brow: "Chrome", trig: "수동", by: "QA Engineer", status: "완료", prog: 100, progt: "30/30", dur: "2분 41초", at: "어제 18:20", total: 30, pass: 30, fail: 0, warn: 0, heal: 0, tcs: [
    { id: "TC-101", name: "메인 배너 노출", v: "PASS", dur: "0.6s" },
    { id: "TC-102", name: "추천 요금제 카드 렌더", v: "PASS", dur: "0.9s" },
  ] },
  { id: "FRUN-502", name: "로그인 회귀", plan: "로그인 회귀 (스테이징)", suite: "로그인 / 인증", brow: "Chrome", trig: "스케줄", by: "스케줄", status: "실패", prog: 97, progt: "66/68", dur: "3분 30초", at: "오늘 11:10", total: 68, pass: 61, fail: 5, warn: 2, heal: 3, tcs: [
    { id: "TC-156", name: "부가서비스 신청 후 상태 미반영", v: "FAIL", dur: "8.4s" },
    { id: "TC-203", name: "OTP 재발송 오류", v: "FAIL", dur: "1.2s" },
    { id: "TC-089", name: "레이아웃 깨짐", v: "FAIL", dur: "0.5s" },
    { id: "TC-031", name: "로그인 성공", v: "PASS", dur: "0.7s", heal: { step: "아이디 입력 요소", from: "[data-testid=userid]", to: "[data-testid=user-id]", conf: 90 } },
    { id: "TC-044", name: "자동 로그인", v: "PASS", dur: "1.8s" },
    { id: "TC-055", name: "세션 만료", v: "PASS", dur: "3.2s" },
  ] },
  { id: "FRUN-498", name: "결제 스모크", plan: "결제 회귀", suite: "결제 / 요금제", brow: "Chrome", trig: "CI", by: "CI/CD Bot", status: "완료", prog: 100, progt: "24/24", dur: "2분 10초", at: "오늘 09:42", total: 24, pass: 24, fail: 0, warn: 0, heal: 0, tcs: [] },
  { id: "FRUN-491", name: "메인 화면 스모크", plan: "전체 스모크 (운영)", suite: "메인 화면", brow: "Chrome", trig: "수동", by: "QA Engineer", status: "완료", prog: 100, progt: "30/30", dur: "2분 41초", at: "어제 18:20", total: 30, pass: 30, fail: 0, warn: 0, heal: 0, tcs: [
    { id: "TC-101", name: "메인 배너 노출", v: "PASS", dur: "0.6s" },
    { id: "TC-102", name: "추천 요금제 카드 렌더", v: "PASS", dur: "0.8s" },
  ] },
  { id: "FRUN-487", name: "로그인 회귀", plan: "로그인 회귀 (스테이징)", suite: "로그인 / 인증", brow: "Chrome", trig: "스케줄", by: "스케줄", status: "완료", prog: 100, progt: "66/68", dur: "3분 22초", at: "어제 09:00", total: 68, pass: 66, fail: 0, warn: 2, heal: 0, tcs: [
    { id: "TC-156", name: "부가서비스 신청 후 상태 미반영", v: "PASS", dur: "1.1s" },
    { id: "TC-203", name: "OTP 재발송 오류", v: "PASS", dur: "1.0s" },
    { id: "TC-089", name: "레이아웃 깨짐", v: "WARN", dur: "0.6s" },
    { id: "TC-031", name: "로그인 성공", v: "PASS", dur: "0.7s" },
    { id: "TC-044", name: "자동 로그인", v: "FAIL", dur: "1.9s" },
    { id: "TC-055", name: "세션 만료", v: "PASS", dur: "3.1s" },
  ] },
];

export const INIT_FQA_PLANS = [
  { id: 1, name: "로그인 회귀 (스테이징)", target: "T월드 웹 · 스테이징", suites: "로그인 / 인증", tags: "regression", sched: "매일 09:00", status: "활성", brow: ["Chrome"], res: "1920×1080", headless: true, workers: "4", retry: 1, onfail: "계속 진행", video: "실패 시만", gate: 95 },
  { id: 2, name: "전체 스모크 (운영)", target: "T월드 웹 · 운영", suites: "전체", tags: "smoke", sched: "커밋 시(CI)", status: "활성", brow: ["Chrome", "Firefox"], res: "1920×1080", headless: true, workers: "auto", retry: 0, onfail: "계속 진행", video: "녹화 안 함", gate: 98 },
  { id: 3, name: "결제 회귀", target: "T월드 웹 · 스테이징", suites: "결제 / 요금제", tags: "critical", sched: "예약 없음", status: "초안", brow: ["Chrome"], res: "1440×900", headless: false, workers: "2", retry: 2, onfail: "첫 에러 시 중단", video: "전체 녹화", gate: 100 },
];
