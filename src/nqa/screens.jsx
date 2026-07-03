import { useApp } from "../common/context.js";
import { Card, PageToolbar, Badge } from "../common/ui.jsx";
import { Gauge } from "lucide-react";
import { NQA_SUBTYPES } from "./data.js";

const NQA_META = {
  "nqa-dashboard": ["대시보드", "성능 KPI · SLA 위반 추이 · 앱별 지표 요약"],
  "nqa-targets": ["대상·환경", "측정 대상 앱 · 단말/OS 매트릭스 · 측정 도구(Perfetto/Profiler/MetricKit/Lighthouse)"],
  "nqa-scenarios": ["측정 시나리오", "No/Low/Full-code 저작 · 측정 액션(Cold/Warm·Trace·스냅샷·샘플링·FPS)"],
  "nqa-plan": ["측정 계획", "대상 × 시나리오 + 임계값(SLA) + 스케줄 — 계획이 아우름"],
  "nqa-run": ["측정 실행", "측정 실행 + 실시간 모니터링(CPU/메모리/FPS/기동시간)"],
  "nqa-history": ["실행 이력", "측정 실행 이력 · 메모리(avg)·CPU(peak)·FPS(avg)·SLA 결과"],
  "nqa-trend": ["성능 추이", "빌드 간 지표 변화 · 성능 회귀 감지"],
};

function SubSwitch() {
  const { toast } = useApp();
  return (
    <div className="flex items-center gap-1.5">
      {NQA_SUBTYPES.map((s) => (
        <button
          key={s.id}
          onClick={() => { if (!s.ready) toast(s.label + " 테스트는 준비 중입니다 (확장 예정)", "info"); }}
          className={"rounded-lg px-3 py-1.5 text-xs font-semibold " + (s.ready ? "bg-teal-600 text-white" : "text-slate-600 hover:bg-slate-800")}
        >
          {s.label}{!s.ready && " · 준비중"}
        </button>
      ))}
      <span className="ml-1.5 text-xs text-slate-500">비기능 하위 유형</span>
    </div>
  );
}

export function NqaScreen({ view }) {
  const [label, desc] = NQA_META[view] || ["", ""];
  const active = (NQA_SUBTYPES.find((s) => s.ready) || {}).label || "성능";
  return (
    <div className="space-y-4">
      <PageToolbar desc={desc} />
      <SubSwitch />
      <Card className="flex flex-col items-center justify-center gap-2 p-12 text-center">
        <div className="mb-1 flex h-12 w-12 items-center justify-center rounded-full bg-slate-800"><Gauge size={22} className="text-teal-400" /></div>
        <div className="text-sm font-semibold text-slate-200">{active} · {label}</div>
        <div className="max-w-md text-xs text-slate-500">{desc}</div>
        <Badge kind="warn">준비 중 — 다음 단계에서 구현</Badge>
      </Card>
    </div>
  );
}
