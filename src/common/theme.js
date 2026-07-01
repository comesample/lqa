// ============================================================
// 공통 테마 — 색상 팔레트 · 점수/판정 색상 규칙
// LQA · FQA · NQA 전 도메인 공용 (단일 출처)
// ============================================================

// 차트·게이지 색상 팔레트
export const C = { ok: "#34d399", err: "#f87171", warn: "#fbbf24", teal: "#2dd4bf", blue: "#60a5fa", grid: "#1e293b", axis: "#64748b" };

// 판정(PASS/FAIL/WARN) → Badge kind
export const vKind = (v) => (v === "PASS" ? "pass" : v === "FAIL" ? "fail" : "warn");

// 점수(0~100) → 색상 규칙: ≥80 정상(teal) / ≥60 주의(warn) / <60 위험(err)
export const scoreColor = (v) => (v >= 80 ? C.teal : v >= 60 ? C.warn : C.err);
