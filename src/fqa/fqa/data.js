// ============================================================
// FQA 시드 데이터 · 네비게이션 설정 (단일 출처)
// lqa/data.js에서 분리(2026-07-01). App이 import.
// ============================================================
import { LayoutDashboard, Plug, Layers, Code2, ClipboardList, Play, FileText } from "lucide-react";

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
    { id: "fqa-result", label: "결과", icon: FileText },
  ] },
];
