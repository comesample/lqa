// ============================================================
// 공통 앱 컨텍스트
// - AppCtx: 전역 상태·액션 주입 Provider
// - useApp: 하위 컴포넌트에서 컨텍스트 소비 훅
// 전 도메인(LQA/FQA/NQA) + 관리자 콘솔 공용
// ============================================================
import { createContext, useContext } from "react";

export const AppCtx = createContext(null);
export const useApp = () => useContext(AppCtx);
