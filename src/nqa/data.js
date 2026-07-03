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
  { id: "perf", label: "클라이언트 성능", ready: true },
  { id: "load", label: "부하", ready: false },
];
