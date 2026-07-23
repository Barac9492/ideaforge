# IdeaForge — 한국어 창업 워크북

**막연한 창업 생각을, 2주짜리 실험으로.** 아이디어를 던져주는 도구가 아니라, 내 경험에서
아이디어를 꺼내고 현실에서 확인하게 만드는 4단계 워크북.

## 4단계 여정

1. **나의 재료** — 구조화된 자기 인벤토리(경력·강점·직접 겪은 문제·나만의 접근권·제약).
2. **아이디어** — 재료에서만 3개 생성(각 아이디어는 입력 중 최소 2개를 근거로 인용). 직접 입력도 가능.
   `직접 겪은 문제 = 없음`이면 아이디어 대신 **관찰 과제**를 돌려줍니다.
3. **압박 테스트** — YC 프레임워크(네 가지 함정·열 가지 질문·역발상 신호) 한국어 서류 평가.
   결과 상단에 "아직 아무것도 검증되지 않았습니다" 경고를 **서버 코드가** 삽입합니다.
4. **현실 검증** — AI 호출 0회. 실험 설계 → 사전 기준 잠금 → 결과 기록 → 시스템이 계속/수정/중단 판정.

계정·DB 없음. 모든 상태는 브라우저 localStorage.

## 비용 안전 (그대로 유지)

기본은 **BYO-key**: 방문자가 본인 키를 넣어야 하며 운영자 비용은 $0. 무료 티어는
**서버 키 + Upstash 스토어가 둘 다 있을 때만** 켜집니다(안전 기본값). 무료 실행에는 per-IP
일일 한도, 전역 일일 예산 킬스위치, Sonnet 고정+토큰 상한, 입력 길이 상한, 선택적 Turnstile이
걸립니다. 활성화 절차는 `.env.example` 참고. **이 저장소는 유료 리소스나 서버 키를 만들지 않습니다.**

## 개발

```bash
npm install
npm run dev      # http://localhost:3000
npm run build
npm test         # 순수 로직 유닛 테스트 (schema guards, verdict)
```

## 스택

Next.js 14 (App Router) · React 18 · Anthropic SDK(Sonnet) · Upstash(선택) · DB 없음.

## 출처

Y Combinator / Jared Friedman (Startup School 2022), Paul Graham 『How to Get Startup Ideas』.
**Y Combinator와 무관하며 승인·제휴 관계가 없습니다.**
