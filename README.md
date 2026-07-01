# LQA 데모 — Windows 11 실행 방법

## 1. Node.js 설치 (최초 1회)
- https://nodejs.org 에서 **LTS** 버전 설치
  또는 PowerShell에서:  `winget install OpenJS.NodeJS.LTS`
- 새 터미널을 열고 확인:
  ```powershell
  node -v
  npm -v
  ```

## 2. 의존성 설치 + 실행
PowerShell 또는 Windows Terminal에서 이 폴더로 이동 후:
```powershell
cd "C:\Users\beaut\OneDrive\창경\02.회사자료\07.COMES\02. 업무\09. AI기반 테스트 자동화 구축\autoqa-demo"
npm install
npm run dev
```
- 브라우저가 자동으로 http://localhost:5173 을 엽니다.
- 종료: 터미널에서 Ctrl + C

## 3. 빌드(정적 배포본)
```powershell
npm run build      # dist/ 폴더 생성
npm run preview    # 빌드 결과 미리보기
```

## 구성
- Vite + React 18 + Tailwind CSS v3
- src/App.jsx  ← LQA 데모 화면 (수정은 여기서)
- 의존성: lucide-react(아이콘), recharts(차트)

## 참고
- OneDrive 동기화 폴더라 node_modules가 동기화될 수 있습니다.
  거슬리면 프로젝트를 OneDrive 밖(예: C:\dev\autoqa-demo)으로 옮겨도 됩니다.
- Node는 18 이상 권장(20 LTS 권장).
