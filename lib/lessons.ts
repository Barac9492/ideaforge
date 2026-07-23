// All Korean product copy in one place. Static text = the "lesson" at each step.

export const BRAND = {
  name: "IdeaForge",
  tagline: "아이디어는 만드는 게 아니라, 꺼내서 확인하는 것",
};

export const HERO = {
  title: "막연한 창업 생각을, 2주짜리 실험으로.",
  body: "AI가 아이디어를 던져주는 도구가 아닙니다. 당신의 경력과 직접 겪은 문제에서 아이디어를 꺼내고, YC 프레임워크로 두들겨 보고, 현실에서 확인하는 방법까지 설계합니다.",
};

export const FOOTER =
  "프레임워크 출처: Y Combinator / Jared Friedman (Startup School 2022), Paul Graham 『How to Get Startup Ideas』. Y Combinator와 무관하며 승인·제휴 관계가 없습니다. 입력한 내용과 API 키는 브라우저에만 저장됩니다.";

export const STEPS = [
  {
    n: 1,
    key: "step1",
    name: "나의 재료",
    blurb: "아이디어의 원료를 꺼냅니다.",
    lesson:
      "좋은 창업 아이디어의 70%는 브레인스토밍이 아니라 창업자가 이미 가진 것에서 나옵니다. 잘하는 일, 직접 겪은 문제, 남들은 못 보는 것. 여기서 5가지를 솔직하게 적을수록 다음 단계의 아이디어가 당신만의 것이 됩니다.",
  },
  {
    n: 2,
    key: "step2",
    name: "아이디어",
    blurb: "재료에서 3개를 꺼냅니다.",
    lesson:
      "여기서 나오는 아이디어는 트렌드가 아니라 1단계에 적은 당신의 재료에서만 나옵니다. 각 아이디어는 당신의 입력 중 최소 두 가지를 근거로 삼습니다. 마음에 드는 이미 가진 아이디어가 있다면 직접 입력해도 됩니다.",
  },
  {
    n: 3,
    key: "step3",
    name: "압박 테스트",
    blurb: "YC 프레임워크로 두들깁니다.",
    lesson:
      "아이디어 하나를 골라 냉정하게 두들겨 봅니다. 네 가지 함정, 열 가지 질문, 역발상 신호. 좋은 아이디어라고 모든 답이 '그렇다'일 필요는 없습니다. 다만 '아니다'는 그냥 넘기지 말고, 무엇을 확인해야 하는지 다음 행동으로 남깁니다.",
  },
  {
    n: 4,
    key: "step4",
    name: "현실 검증",
    blurb: "책상을 떠나 사람에게 확인합니다.",
    lesson:
      "지금까지는 전부 책상 위 생각입니다. 이제 실험을 하나 설계하고, 시작하기 전에 '이 숫자를 넘으면 계속, 못 넘으면 접는다'는 기준을 미리 잠급니다. 결과가 나오면 기분이 아니라 그 기준이 계속·수정·중단을 판정합니다.",
  },
] as const;

// Step 1 — structured inventory questions
export const INVENTORY_FIELDS: {
  key: keyof import("./store").Inventory;
  label: string;
  hint: string;
  required?: boolean;
  long?: boolean;
}[] = [
  { key: "career", label: "지금까지 해온 일", hint: "직무와 연차를 적어주세요. 예: 이커머스 MD 7년" },
  { key: "strength", label: "남들보다 잘하는 것", hint: "회사 밖에서도 통하는 능력 하나" },
  {
    key: "problemLived",
    label: "직접 겪어서 짜증났던 문제",
    hint: "최근 1년 안에, 돈이나 시간을 써서 우회했던 문제. 없으면 '없음'이라고 솔직하게.",
    required: true,
    long: true,
  },
  { key: "unfairAccess", label: "나만 볼 수 있는 것", hint: "업계 내부 사정, 특정 고객군 접근, 데이터 등 남들에게는 닫혀 있는 문" },
  { key: "constraints", label: "제약 조건", hint: "예: 퇴사 불가, 자본 500만원, 개발 못 함" },
];

export const EMPTY = {
  noInventory:
    "아직 재료가 없습니다. 좋은 아이디어는 트렌드가 아니라 당신의 경험에서 나옵니다. 1단계부터 시작하세요.",
  noProblemTitle: "괜찮습니다. 하지만 지름길이 아니라 돌아가는 길입니다.",
  noProblemBody:
    "직접 겪은 문제가 없는 아이디어는 실패율이 훨씬 높습니다. 이번 주에 딱 하나만 관찰해 보세요: 누군가 돈이나 시간을 써서 억지로 문제를 해결하는 장면. 그 장면 하나가 다음 아이디어의 씨앗입니다.",
  noIdeaForEval:
    "평가할 아이디어가 없습니다. 2단계에서 아이디어를 꺼내거나 직접 입력한 뒤 다시 오세요.",
};

// Deterministic paper-only warning — inserted by app code, never left to the model.
export const PAPER_WARNING =
  "이것은 책상 위 평가입니다. 아직 아무것도 검증되지 않았습니다. 판정은 4단계에서 현실 데이터를 기록한 뒤에만 나옵니다.";

export const LABELS = {
  mistakes: "네 가지 함정",
  questions: "열 가지 질문",
  signals: "역발상 신호",
  mistakeVerdict: { pass: "통과", warn: "주의", fail: "위험" } as const,
  questionVerdict: { yes: "그렇다", mixed: "애매하다", no: "아니다", unknown: "정보 없음" } as const,
  signalYes: "있음",
  signalNo: "없음",
};

export const VERDICTS = {
  계속: "기준을 넘었습니다. 다음 실험을 설계하세요.",
  수정: "신호는 있지만 기준 미달. 무엇을 바꿀지 한 줄로 적으세요.",
  중단: "기준 미달. 접는 것은 실패가 아니라 다음 아이디어를 위한 데이터입니다.",
} as const;

export const EXPERIMENTS: {
  kind: import("./store").ExperimentKind;
  name: string;
  summary: string;
  how: string[];
  metric: string;
  unit: string;
  defaultThreshold: number;
}[] = [
  {
    kind: "interview",
    name: "10명 인터뷰",
    summary: "제품 없이, 문제를 겪는 사람 10명과 이야기합니다.",
    how: [
      "채널: 오픈카톡방, 네이버 카페, 당근 동네생활, 지인 소개 2다리.",
      "맘 테스트 원칙 — '쓰실 건가요?'는 금지. 과거의 행동만 묻습니다.",
      "질문 예: “마지막으로 이 문제를 겪었을 때 어떻게 하셨나요?”",
      "질문 예: “그때 돈이나 시간을 얼마나 썼나요?”",
      "질문 예: “지금은 어떻게 해결하고 계세요?”",
    ],
    metric: "10명 중 '이 문제로 돈·시간을 쓴 적 있다'고 답한 사람 수",
    unit: "명",
    defaultThreshold: 6,
  },
  {
    kind: "landing",
    name: "사전 신청 랜딩",
    summary: "제품 대신 한 페이지를 만들고, 신청 버튼을 답니다.",
    how: [
      "노코드로 랜딩 1장: 왯폼(Waveform)·탈리(Tally)·노션.",
      "인스타그램, 관련 네이버 카페, 커뮤니티에 링크 공유.",
      "측정: 방문자 대비 사전신청 전환율.",
      "허수 방지 — 이메일뿐 아니라 '얼마면 쓰겠다'까지 받으면 신호가 진짜입니다.",
    ],
    metric: "방문자 대비 사전신청 전환율(%)",
    unit: "%",
    defaultThreshold: 10,
  },
  {
    kind: "concierge",
    name: "수동 컨시어지",
    summary: "제품 없이, 카톡으로 직접 서비스를 몇 건 수행합니다.",
    how: [
      "제품을 만들지 않고 사람이 손으로 서비스를 5건 제공.",
      "카카오톡·전화·대면 무엇이든 OK. 자동화는 나중.",
      "측정: 돈을 받았는가. 무료로 좋다는 말은 신호가 아닙니다.",
    ],
    metric: "돈을 내고 서비스를 이용한 건수",
    unit: "건",
    defaultThreshold: 3,
  },
];

// Rate-limit / access copy
export const ACCESS = {
  freeBanner: "무료로 사용해 보세요 — 하루 몇 번은 무료입니다. 더 쓰려면 고급 설정에서 본인 API 키를 넣으세요.",
  needKey:
    "지금은 무료 사용이 준비되지 않았습니다. 아래 ‘고급 설정’에서 본인 Anthropic API 키를 넣으면 바로 사용할 수 있어요.",
  storageWarning: "이 키는 이 브라우저에만 저장됩니다. 공용 PC라면 사용 후 반드시 삭제하세요.",
  removeKey: "저장된 키 삭제",
};
