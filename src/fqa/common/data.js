// ============================================================
// 전역 · 관리자 콘솔 시드 데이터 (단일 출처)
// 도메인(LQA/FQA/NQA) 목록 · 공통 네비 · 테넌트/사용자/모델 시드
// lqa/data.js에서 분리(2026-07-01). App·콘솔이 import.
// ============================================================
import { Bug, Megaphone, UserCog } from "lucide-react";

export const DOMAINS = [{ id: "LQA", label: "챗봇 평가", ready: true }, { id: "FQA", label: "기능 QA", ready: true }, { id: "NQA", label: "비기능 QA", ready: false }];
export const COMMON_SECTIONS = [
  { group: "공통", items: [
    { id: "defects", label: "결함", icon: Bug },
    { id: "report", label: "리포트 · 알림", icon: Megaphone },
  ] },
];
export const MEMBERS_ITEM = { id: "members", label: "조직 관리", icon: UserCog };
export const INIT_TENANTS = [
  { id: "t1", name: "SK텔레콤", plan: "Enterprise", users: 12, status: "활성", admin: "김지훈 (jihoon.kim@skt.com)", created: "2026-01-12" },
  { id: "t2", name: "T멤버십", plan: "Team", users: 5, status: "활성", admin: "박지영 (jiyoung.park@skt.com)", created: "2026-03-04" },
  { id: "t3", name: "데모 조직", plan: "Trial", users: 2, status: "정지", admin: "미지정", created: "2026-05-20" },
];
export const INIT_USERS = [
  { id: "u1", name: "김지훈", email: "jihoon.kim@skt.com", tenant: "t1", role: "조직관리자", status: "활성", last: "방금 전" },
  { id: "u2", name: "이민준", email: "minjun.lee@skt.com", tenant: "t1", role: "QA 엔지니어", status: "활성", last: "오늘 09:12" },
  { id: "u3", name: "최서연", email: "seoyeon.choi@skt.com", tenant: "t1", role: "QA 엔지니어", status: "활성", last: "어제 17:44" },
  { id: "u4", name: "박지영", email: "jiyoung.park@skt.com", tenant: "t2", role: "조직관리자", status: "활성", last: "2시간 전" },
  { id: "u5", name: "윤수빈", email: "subin.yoon@partner.com", tenant: "t1", role: "Viewer", status: "대기", last: "미로그인" },
  { id: "u6", name: "오현태", email: "hyuntae.oh@demo.com", tenant: "t3", role: "QA 엔지니어", status: "차단", last: "2026-05-12" },
];
export const INIT_MODELS = [
  { id: "m1", name: "Claude (sonnet-4-6)", provider: "Anthropic", model: "claude-sonnet-4-6", price: "$3 / 1M", status: "활성", created: "2026-01-10" },
  { id: "m2", name: "GPT-4o", provider: "OpenAI", model: "gpt-4o-2024-11", price: "$5 / 1M", status: "활성", created: "2026-01-10" },
  { id: "m3", name: "Gemini 2.0 Flash", provider: "Google", model: "gemini-2.0-flash", price: "$0.3 / 1M", status: "비활성", created: "2026-02-15" },
  { id: "m4", name: "사내 LLM (에이닷)", provider: "Internal", model: "adot-v2", price: "사내", status: "활성", created: "2026-04-01" },
];
