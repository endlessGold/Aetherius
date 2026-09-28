import { categories, nodes, edges } from './model.js';

const nodeMap = new Map(nodes.map((node) => [node.id, node]));
const categoryMap = new Map(categories.map((category) => [category.id, category]));

const chapters = [
  {
    id: 'premise',
    no: '01',
    title: 'NPC도 플레이어다',
    eyebrow: 'CORE PREMISE',
    thesis: 'NPC를 퀘스트 자판기가 아니라 같은 규칙을 쓰는 행위자로 설계한다.',
    body: 'NPC는 배고프고, 돈을 벌고, 물건을 사고, 위험을 피하고, 숙련을 쌓습니다. 플레이어가 보는 콘텐츠는 NPC에게도 실제 생활의 결과입니다.',
    focus: ['core','actor-system','mind-system','needs','planning','ownership'],
    flow: ['욕구 발생','정보 확인','행동 계획','게임 규칙 검증','행동 실행','월드 상태 변화'],
    demo: 'life'
  },
  {
    id: 'economy',
    no: '02',
    title: '경제는 아이템 생성기가 아니다',
    eyebrow: 'LIVING ECONOMY',
    thesis: '상점의 재고와 가격은 실제 생산·운송·소비의 결과다.',
    body: '철광석은 광산에서 채굴되고, 운송되고, 대장간에서 소비됩니다. NPC 상점은 무한 재고를 갖지 않으며 플레이어의 구매도 공급망 전체에 흔적을 남깁니다.',
    focus: ['resources','labor','production','logistics','market','economy-system'],
    flow: ['자원 채굴','노동 비용','생산','운송','시장 주문','가격 신호'],
    demo: 'market'
  },
  {
    id: 'contracts',
    no: '03',
    title: '퀘스트는 문제에서 발생한다',
    eyebrow: 'DYNAMIC CONTENT',
    thesis: 'NPC가 해결하지 못한 실제 문제가 계약과 플레이 콘텐츠가 된다.',
    body: '대장장이에게 철이 부족하면 “철 8개를 가져와라”는 임의 퀘스트가 생기는 것이 아니라, 재고 부족 → 구매 주문 → 운송 계약이라는 시스템 흐름이 발생합니다.',
    focus: ['content-system','contract','quest-market','logistics','market','rumor'],
    flow: ['문제 감지','예산 계산','계약 발행','수락 경쟁','실물 이동','보상·평판'],
    demo: 'contract'
  },
  {
    id: 'war',
    no: '04',
    title: '전쟁은 전투 화면 밖에서도 진행된다',
    eyebrow: 'SYSTEMIC CONFLICT',
    thesis: '전선의 승패는 보급·치안·이주·물가와 함께 움직인다.',
    body: '전투를 잘하는 것만으로는 전쟁을 유지할 수 없습니다. 운송로가 끊기면 보급률이 떨어지고, 식량 가격이 오르고, 피난민이 발생하며 도시 경제까지 흔들립니다.',
    focus: ['war','conflict-system','security','logistics','market','settlement','governance'],
    flow: ['정치 갈등','동원','보급','전투','민간 충격','정책 대응'],
    demo: 'war'
  },
  {
    id: 'runtime',
    no: '05',
    title: '수천 명의 NPC를 어떻게 살릴 것인가',
    eyebrow: 'SIMULATION RUNTIME',
    thesis: '중요한 곳은 정밀하게, 먼 곳은 집계하면서 동일한 보존 법칙을 유지한다.',
    body: '모든 NPC를 매 프레임 AI로 계산하지 않습니다. 플레이어 주변은 정밀 시뮬레이션, 먼 지역은 집계 시뮬레이션으로 처리하고 중요한 사건이 생기면 다시 개별 행위자로 승격합니다.',
    focus: ['runtime-system','eventbus','lod','persistence','observability','core'],
    flow: ['명령','검증','이벤트','상태 반영','스냅샷','운영 지표'],
    demo: 'runtime'
  }
];

const demoConfig = {
  life: {
    actor: '광부 NPC · 리오',
    initial: { gold: 86, energy: 74, hunger: 68, skill: 1.2, trust: 44, day: 1 },
    stats: [['gold','Gold','G'],['energy','체력','%'],['hunger','허기','%'],['skill','채굴 숙련','Lv'],['trust','마을 신뢰','']],
    actions: [
      ['work','광산에서 일한다','소득과 숙련을 얻지만 체력과 허기가 악화됩니다.'],
      ['eat','시장에 가서 식사한다','실제 시장 재고를 소비하고 생존 욕구를 해결합니다.'],
      ['rest','여관에서 쉰다','비용을 내고 다음 행동을 위한 체력을 회복합니다.']
    ]
  },
  market: {
    actor: '플레이어 · 상인 실험',
    initial: { gold: 1600, iron: 2, stock: 17, price: 118, swords: 0, demand: 52 },
    stats: [['gold','Gold','G'],['iron','보유 철',''],['stock','시장 재고',''],['price','철 가격','G'],['swords','제작 검','']],
    actions: [
      ['buy','철 4개를 산다','시장 재고가 줄고 가격 압력이 생깁니다.'],
      ['craft','검을 제작한다','철 2개를 실제 재고에서 소비합니다.'],
      ['sell','검을 판매한다','상품 공급과 현금 흐름을 직접 만듭니다.']
    ]
  },
  contract: {
    actor: '플레이어 · 운송업자',
    initial: { gold: 320, cargo: 0, danger: 42, progress: 0, rep: 11, reward: 0 },
    stats: [['gold','Gold','G'],['cargo','철 화물',''],['danger','노선 위험','%'],['progress','계약 진행','%'],['rep','상단 평판','']],
    actions: [
      ['accept','운송 계약을 수락한다','대장장이의 실제 예산에서 계약이 시작됩니다.'],
      ['escort','호위를 고용한다','비용을 쓰고 실패 위험을 낮춥니다.'],
      ['deliver','목적지로 운송한다','실물 화물이 이동하고 보상·평판이 확정됩니다.']
    ]
  },
  war: {
    actor: '국경 도시 · 벨라',
    initial: { supply: 63, security: 51, morale: 58, food: 112, refugees: 9, influence: 20 },
    stats: [['supply','보급률','%'],['security','치안','%'],['morale','사기','%'],['food','식량 지수',''],['refugees','피난민','명']],
    actions: [
      ['escort','보급대를 호위한다','전선 보급과 도로 치안을 동시에 개선합니다.'],
      ['raid','적 보급로를 습격한다','군사 압박을 높이지만 민간 위험도 커집니다.'],
      ['relief','민간 구호를 시행한다','피난민·물가 충격을 흡수합니다.']
    ]
  },
  runtime: {
    actor: '서버 · 북부 지역',
    initial: { active: 38, coarse: 420, statistical: 8200, cpu: 47, events: 126, fidelity: 1 },
    stats: [['active','Active NPC',''],['coarse','Coarse NPC',''],['statistical','집계 인구',''],['cpu','CPU Budget','%'],['events','이벤트/분','']],
    actions: [
      ['focus','사건 지역을 정밀 승격','주요 NPC를 집계 상태에서 Active 상태로 올립니다.'],
      ['compress','안정 지역을 집계 전환','중요도가 낮은 NPC를 Coarse/Statistical로 내립니다.'],
      ['trace','원인 이벤트를 추적','월드 변화의 원인을 Event Graph에서 역추적합니다.']
    ]
  }
};

class LivingMmoApp extends HTMLElement {
  constructor() {
    super();
    this.state = {
      chapterIndex: 0,
      stage: 'read',
      selectedNodeId: 'core',
      inspectorOpen: false,
      trace: [],
      demo: structuredClone(demoConfig.life.initial),
      message: '아래 흐름을 따라 기획 의도를 확인하세요.'
    };
    this.bound = false;
  }

  connectedCallback() {
    if (!this.bound) this.bindEvents();
    this.render();
  }

  bindEvents() {
    this.bound = true;
    this.addEventListener('click', (event) => {
      const chapterButton = event.target.closest('[data-chapter]');
      if (chapterButton) {
        this.openChapter(Number(chapterButton.dataset.chapter));
        return;
      }

      const stageButton = event.target.closest('[data-stage]');
      if (stageButton) {
        this.state.stage = stageButton.dataset.stage;
        this.render();
        return;
      }

      const nodeButton = event.target.closest('[data-node]');
      if (nodeButton) {
        this.state.selectedNodeId = nodeButton.dataset.node;
        this.state.inspectorOpen = true;
        this.render();
        return;
      }

      if (event.target.closest('[data-close-inspector]')) {
        this.state.inspectorOpen = false;
        this.render();
        return;
      }

      const action = event.target.closest('[data-action]');
      if (action) {
        this.runAction(action.dataset.action);
        return;
      }

      if (event.target.closest('[data-reset-demo]')) {
        this.resetDemo();
        return;
      }

      if (event.target.closest('[data-prev-chapter]')) {
        this.openChapter(Math.max(0, this.state.chapterIndex - 1));
        return;
      }

      if (event.target.closest('[data-next-chapter]')) {
        this.openChapter(Math.min(chapters.length - 1, this.state.chapterIndex + 1));
      }
    });
  }

  openChapter(index) {
    this.state.chapterIndex = Math.max(0, Math.min(chapters.length - 1, index));
    const chapter = chapters[this.state.chapterIndex];
    this.state.stage = 'read';
    this.state.selectedNodeId = chapter.focus[0];
    this.state.inspectorOpen = false;
    this.state.trace = [];
    this.state.demo = structuredClone(demoConfig[chapter.demo].initial);
    this.state.message = '설계 설명부터 읽고 그래프와 인게임 예시를 순서대로 조작해보세요.';
    this.render();
  }

  resetDemo() {
    const chapter = chapters[this.state.chapterIndex];
    this.state.demo = structuredClone(demoConfig[chapter.demo].initial);
    this.state.trace = [];
    this.state.message = '인게임 상태를 초기값으로 되돌렸습니다.';
    this.render();
  }

  runAction(actionId) {
    const chapter = chapters[this.state.chapterIndex];
    const type = chapter.demo;
    const s = { ...this.state.demo };
    let message = '';
    let trace = [];

    if (type === 'life') {
      if (actionId === 'work') {
        if (s.energy < 24) return this.setMessage('체력이 부족합니다. 먼저 쉬어야 합니다.');
        s.gold += Math.round(31 + s.skill * 8); s.energy -= 24; s.hunger = Math.min(100, s.hunger + 18); s.skill = +(s.skill + .2).toFixed(1); s.day += 1;
        message = '리오는 임금과 숙련을 얻었지만 체력과 허기가 악화됐습니다.';
        trace = ['노동 선택','광산 생산 +','임금 지급','체력 -','숙련 +'];
      } else if (actionId === 'eat') {
        if (s.gold < 18) return this.setMessage('식사 비용이 부족합니다.');
        s.gold -= 18; s.hunger = Math.max(0, s.hunger - 52); s.trust = Math.min(100, s.trust + 2);
        message = '식사 비용이 시장 매출이 되고, 식량 재고를 소비했다고 가정합니다.';
        trace = ['식량 구매','NPC 현금 -','상점 매출 +','허기 감소','다음 목표 재평가'];
      } else {
        if (s.gold < 10) return this.setMessage('여관 비용이 부족합니다.');
        s.gold -= 10; s.energy = Math.min(100, s.energy + 48); s.day += 1;
        message = '휴식조차 무료 리셋이 아니라 세계 경제에 참여하는 행동입니다.';
        trace = ['숙박 구매','여관 수입 +','체력 회복','하루 경과'];
      }
    }

    if (type === 'market') {
      if (actionId === 'buy') {
        const cost = s.price * 4;
        if (s.stock < 4) return this.setMessage('시장 재고가 4개보다 적습니다.');
        if (s.gold < cost) return this.setMessage('구매 자금이 부족합니다.');
        s.gold -= cost; s.iron += 4; s.stock -= 4; s.price += 11; s.demand += 9;
        message = '플레이어의 구매가 재고를 줄이고 철 가격을 올렸습니다.';
        trace = ['BUY ORDER','철 재고 -4','수요 압력 +','가격 +11','생산자 수익 기대 +'];
      } else if (actionId === 'craft') {
        if (s.iron < 2) return this.setMessage('검 제작에는 철 2개가 필요합니다.');
        s.iron -= 2; s.swords += 1;
        message = '철 2개가 실제로 소멸하고 검 1자루가 생성됐습니다.';
        trace = ['철 -2','제작 시간','검 +1','판매 가능 재고 +'];
      } else {
        if (s.swords < 1) return this.setMessage('먼저 검을 제작하세요.');
        s.swords -= 1; s.gold += Math.round(s.price * 2.15); s.demand = Math.max(0, s.demand - 8);
        message = '판매 수익이 플레이어 자산에 들어오고 시장 공급 부족을 완화했습니다.';
        trace = ['SELL ORDER','검 재고 -1','현금 +','상품 공급 +','수요 압력 -'];
      }
    }

    if (type === 'contract') {
      if (actionId === 'accept') {
        if (s.cargo > 0 || s.progress > 0) return this.setMessage('이미 계약을 진행 중입니다.');
        s.cargo = 8; s.progress = 12;
        message = '대장장이의 철 부족과 예산이 실제 운송 계약으로 전환됐습니다.';
        trace = ['철 부족','구매 실패','운송 계약 발행','플레이어 수락','화물 인수'];
      } else if (actionId === 'escort') {
        if (s.gold < 60) return this.setMessage('호위 고용 비용이 부족합니다.');
        s.gold -= 60; s.danger = Math.max(5, s.danger - 25);
        message = '플레이어가 비용을 지불해 운송 실패 확률을 낮췄습니다.';
        trace = ['호위 고용','플레이어 현금 -60','용병 수입 +','노선 위험 -25'];
      } else {
        if (s.cargo < 1) return this.setMessage('먼저 운송 계약을 수락하세요.');
        s.progress = 100; s.cargo = 0; s.reward = Math.round(250 - s.danger * .8); s.gold += s.reward; s.rep += 7;
        message = '철이 목적지에 도착했습니다. 대장간은 이제 실제로 생산을 재개할 수 있습니다.';
        trace = ['실물 이동','철 재고 +8','계약 완료','보상 지급','평판 +7','대장간 생산 재개'];
      }
    }

    if (type === 'war') {
      if (actionId === 'escort') {
        s.supply = Math.min(100, s.supply + 17); s.security = Math.min(100, s.security + 8); s.food = Math.max(88, s.food - 7); s.influence += 2;
        message = '보급로 안정화가 전선뿐 아니라 민간 식량 가격에도 영향을 줍니다.';
        trace = ['호위 강화','보급률 +','도로 치안 +','식량 공급 +','가격 압력 -'];
      } else if (actionId === 'raid') {
        s.supply = Math.max(0, s.supply - 7); s.security = Math.max(0, s.security - 13); s.morale = Math.min(100, s.morale + 9); s.food += 11; s.refugees += 5;
        message = '군사적 압박은 늘었지만 민간 치안·물가·피난민 문제가 커졌습니다.';
        trace = ['적 보급 습격','전투 성과','치안 -','교역 위험 +','식량가 +','피난민 +'];
      } else {
        s.refugees = Math.max(0, s.refugees - 5); s.morale = Math.min(100, s.morale + 5); s.food = Math.max(90, s.food - 5); s.influence += 3;
        message = '구호 정책이 전투 외 시스템을 통해 전쟁 지속 가능성을 바꿉니다.';
        trace = ['구호 예산','피난민 지원','민간 수요 안정','사기 +','정치 신뢰 +'];
      }
    }

    if (type === 'runtime') {
      if (actionId === 'focus') {
        const promoted = Math.min(40, s.coarse);
        s.coarse -= promoted; s.active += promoted; s.cpu = Math.min(100, s.cpu + 19); s.events += 38; s.fidelity = 2;
        message = '사건 지역의 NPC가 Active 시뮬레이션으로 승격되어 세밀한 행동을 시작합니다.';
        trace = ['관심도 상승','Coarse -40','Active +40','CPU +','이벤트 밀도 +'];
      } else if (actionId === 'compress') {
        const demoted = Math.min(30, Math.max(0, s.active - 10));
        s.active -= demoted; s.coarse += demoted; s.cpu = Math.max(18, s.cpu - 14); s.events = Math.max(20, s.events - 22); s.fidelity = 0;
        message = '안정 지역은 집계 수준으로 낮춰 보존 법칙을 유지하면서 연산을 절약합니다.';
        trace = ['관심도 하락','Active -','Coarse +','CPU -','보존량 유지'];
      } else {
        s.events += 6;
        message = '시장 가격 변화의 원인을 구매 주문 → 재고 변화 → 가격 이벤트 순으로 추적합니다.';
        trace = ['가격 변화','causedBy #evt-126','재고 감소','causedBy #cmd-81','플레이어 구매'];
      }
    }

    this.state.demo = s;
    this.state.trace = trace;
    this.state.message = message;
    this.state.stage = 'play';
    this.render();
  }

  setMessage(message) {
    this.state.message = message;
    this.render();
  }

  render() {
    const chapter = chapters[this.state.chapterIndex];
    const config = demoConfig[chapter.demo];
    const selectedNode = nodeMap.get(this.state.selectedNodeId) || nodeMap.get(chapter.focus[0]);

    this.innerHTML = `
      <div class="book-shell">
        <header class="book-topbar">
          <div class="brand-lockup">
            <span class="brand-mark">LM</span>
            <div><b>Living MMO</b><small>INTERACTIVE GAME DESIGN DOCUMENT</small></div>
          </div>
          <div class="chapter-progress"><span style="--p:${((this.state.chapterIndex + 1) / chapters.length) * 100}%"></span></div>
          <div class="chapter-count">${chapter.no} / 05</div>
        </header>

        <nav class="chapter-rail" aria-label="기획서 챕터">
          ${chapters.map((item, index) => `
            <button data-chapter="${index}" class="${index === this.state.chapterIndex ? 'active' : ''}">
              <span>${item.no}</span><b>${item.title}</b>
            </button>
          `).join('')}
        </nav>

        <main>
          <section class="chapter-hero">
            <div class="chapter-copy">
              <span class="eyebrow">${chapter.eyebrow}</span>
              <h1>${chapter.title}</h1>
              <p class="thesis">${chapter.thesis}</p>
              <p class="chapter-body">${chapter.body}</p>
              <div class="design-law"><span>DESIGN LAW</span><b>${designLaw(chapter.id)}</b></div>
            </div>
            <div class="reading-map">
              <span>이 챕터의 이해 흐름</span>
              <ol>${chapter.flow.map((step, index) => `<li><i>${String(index + 1).padStart(2,'0')}</i><b>${step}</b></li>`).join('')}</ol>
            </div>
          </section>

          <section class="experience panel">
            <div class="stage-tabs" role="tablist">
              ${[
                ['read','1. 이해','핵심 기획'],
                ['graph','2. 구조','Focus graph'],
                ['play','3. 조작','직접 선택'],
                ['ingame','4. 인게임','플레이 화면'],
                ['result','5. 인과','결과 추적']
              ].map(([id,title,sub]) => `
                <button data-stage="${id}" class="${this.state.stage === id ? 'active' : ''}">
                  <b>${title}</b><span>${sub}</span>
                </button>
              `).join('')}
            </div>

            <div class="experience-body">
              ${this.renderStage(chapter, config)}
            </div>
          </section>

          <section class="spec-strip">
            <div><span>PLAYER EXPERIENCE</span><p>${playerExperience(chapter.id)}</p></div>
            <div><span>SYSTEM CONTRACT</span><p>${chapter.thesis}</p></div>
            <div><span>FAILURE TO AVOID</span><p>${failureMode(chapter.id)}</p></div>
          </section>

          <div class="chapter-nav">
            <button data-prev-chapter ${this.state.chapterIndex === 0 ? 'disabled' : ''}>← 이전 챕터</button>
            <span>노드그래프는 설명 도구이고, 조작과 인게임 결과가 기획을 증명합니다.</span>
            <button data-next-chapter ${this.state.chapterIndex === chapters.length - 1 ? 'disabled' : ''}>다음 챕터 →</button>
          </div>
        </main>

        ${this.state.inspectorOpen ? inspector(selectedNode) : ''}
      </div>
    `;
  }

  renderStage(chapter, config) {
    if (this.state.stage === 'read') return readStage(chapter);
    if (this.state.stage === 'graph') return focusGraph(chapter, this.state.selectedNodeId);
    if (this.state.stage === 'play') return playStage(config, this.state.demo, this.state.message);
    if (this.state.stage === 'ingame') return inGameStage(chapter, config, this.state.demo);
    return resultStage(chapter, this.state.trace, this.state.message);
  }
}

function readStage(chapter) {
  const cases = {
    premise: [['NPC가 배고프다','식량을 사기 위해 일자리를 찾는다'],['일을 한다','임금·숙련·피로가 동시에 변한다'],['돈을 쓴다','다른 NPC 사업체의 매출이 된다']],
    economy: [['철을 산다','시장 재고가 실제로 줄어든다'],['재고가 줄었다','가격과 생산자의 기대가 변한다'],['가격이 올랐다','다른 지역 물류와 생산이 반응한다']],
    contracts: [['대장간 철 부족','구매 주문이 실패한다'],['문제가 지속됨','예산 있는 운송 계약이 발행된다'],['누군가 수행','철이 실제 목적지로 이동한다']],
    war: [['국경 충돌','보급 수요가 급증한다'],['도로 위험 증가','운송비와 식량가가 오른다'],['민간 충격','이주·세금·정치 판단이 변한다']],
    runtime: [['플레이어 근처','NPC를 개별 정밀 계산한다'],['먼 지역','집계 모델로 연산량을 줄인다'],['중요 사건 발생','해당 지역을 다시 정밀 승격한다']]
  }[chapter.id];
  return `
    <div class="read-stage">
      <div class="big-question"><span>WHAT THIS DESIGN MEANS</span><h2>${chapter.thesis}</h2></div>
      <div class="cause-cards">
        ${cases.map(([a,b],i) => `<article><i>0${i+1}</i><b>${a}</b><span>↓</span><p>${b}</p></article>`).join('')}
      </div>
      <button class="continue-cta" data-stage="graph">관련 시스템 구조 보기 →</button>
    </div>
  `;
}

function focusGraph(chapter, selectedId) {
  const ids = new Set(chapter.focus);
  const localEdges = edges.filter((edge) => ids.has(edge.source) && ids.has(edge.target));
  const points = radialPoints(chapter.focus.length);
  return `
    <div class="graph-stage-new">
      <div class="graph-copy">
        <span>FOCUS GRAPH</span>
        <h2>전체 42개가 아니라, 지금 이해해야 할 관계만 보여줍니다.</h2>
        <p>노드를 누르면 설계 계약을 확인할 수 있습니다. 다음 챕터로 이동하면 그래프도 맥락에 맞게 재구성됩니다.</p>
      </div>
      <div class="focus-canvas">
        <svg viewBox="0 0 900 500" aria-hidden="true">
          ${localEdges.map((edge) => {
            const a = chapter.focus.indexOf(edge.source);
            const b = chapter.focus.indexOf(edge.target);
            if (a < 0 || b < 0) return '';
            return `<path d="${curve(points[a],points[b])}" />`;
          }).join('')}
        </svg>
        ${chapter.focus.map((id,index) => {
          const node = nodeMap.get(id);
          if (!node) return '';
          const category = categoryMap.get(node.category);
          const p = points[index];
          return `<button class="focus-node ${id === selectedId ? 'selected':''}" data-node="${id}" style="--x:${p.x}%;--y:${p.y}%;--c:${category?.color || '#8bbfff'}">
            <span>${category?.label || ''}</span><b>${node.title}</b><small>${node.subtitle}</small>
          </button>`;
        }).join('')}
      </div>
      <div class="graph-bottom"><span>노드 = 설계 규칙</span><span>선 = 실제 상태 변화의 의존관계</span><button data-stage="play">직접 조작해보기 →</button></div>
    </div>
  `;
}

function playStage(config, state, message) {
  return `
    <div class="play-layout">
      <section class="control-deck">
        <span class="eyebrow">PLAYER CONTROL</span>
        <h2>${config.title ?? config.actor}</h2>
        <p>기획서를 읽는 대신 선택을 눌러 시스템 반응을 확인합니다.</p>
        <div class="action-list">
          ${config.actions.map(([id,label,hint]) => `<button data-action="${id}"><b>${label}</b><span>${hint}</span><i>→</i></button>`).join('')}
        </div>
        <div class="system-message" aria-live="polite">${message}</div>
        <button class="reset" data-reset-demo>상태 초기화</button>
      </section>
      <section class="state-deck">
        <div class="state-head"><span>LIVE WORLD STATE</span><b>${config.actor}</b></div>
        <div class="stat-grid">${config.stats.map(([key,label,suffix]) => statCard(label,state[key],suffix)).join('')}</div>
        <div class="state-note">이 숫자들은 UI 장식이 아니라 다음 행동·시장·계약·세계 상태의 입력으로 다시 사용됩니다.</div>
        <button class="continue-cta" data-stage="ingame">이 결과를 인게임에서 보기 →</button>
      </section>
    </div>
  `;
}

function inGameStage(chapter, config, s) {
  const scene = {
    premise: {
      place:'아르덴 광산촌 · 08:40',
      objective:'오늘의 목표 · 식비와 여관비 마련',
      world:['광산 입구','시장 골목','여관'],
      npc:['리오','광부 조합원','식료품 상인'],
      feed:[`체력 ${fmt(s.energy)}% · 허기 ${fmt(s.hunger)}%`,`보유 ${fmt(s.gold)}G · 채굴 숙련 Lv.${fmt(s.skill)}`, 'NPC도 이 HUD와 동일한 자산·욕구를 가진다']
    },
    economy: {
      place:'북부 중앙시장 · 철 거래소',
      objective:'철을 확보해 검을 제작하고 판매',
      world:['철 상인','대장간','운송 게시판'],
      npc:['플레이어 상인','대장장이 NPC','운송업자 NPC'],
      feed:[`철 시세 ${fmt(s.price)}G · 시장 재고 ${fmt(s.stock)}`,`내 철 ${fmt(s.iron)} · 검 ${fmt(s.swords)}`, '누군가 구매하면 다른 사람에게 남는 재고가 실제로 감소']
    },
    contracts: {
      place:'동문 상단 게시판 · 14:10',
      objective:'대장간 철 부족 해결 계약',
      world:['계약 게시판','상단 창고','동부 도로'],
      npc:['플레이어 운송업자','대장장이 NPC','용병 NPC'],
      feed:[`화물 ${fmt(s.cargo)} · 노선 위험 ${fmt(s.danger)}%`,`진행률 ${fmt(s.progress)}% · 평판 ${fmt(s.rep)}`, '퀘스트 텍스트가 아니라 실제 화물·예산·위험이 존재']
    },
    war: {
      place:'벨라 국경도시 · 전시 상태',
      objective:'전선을 유지하면서 도시 붕괴를 막기',
      world:['북문 검문소','보급 창고','난민 구호소'],
      npc:['수비대 NPC','상인 NPC','피난민 NPC'],
      feed:[`보급 ${fmt(s.supply)}% · 치안 ${fmt(s.security)}%`,`식량 지수 ${fmt(s.food)} · 피난민 ${fmt(s.refugees)}명`, '전투 결과가 도시 생활과 가격으로 이어진다']
    },
    runtime: {
      place:'SERVER VIEW · NORTH-02',
      objective:'연산 예산 안에서 세계 연속성 유지',
      world:['Active zone','Coarse zone','Statistical zone'],
      npc:['Active NPC','Coarse NPC','집계 인구'],
      feed:[`Active ${fmt(s.active)} · Coarse ${fmt(s.coarse)}`,`집계 ${fmt(s.statistical)} · CPU ${fmt(s.cpu)}%`,`Events ${fmt(s.events)}/min`]
    }
  }[chapter.id];

  return `
    <div class="ingame-layout">
      <div class="game-window">
        <div class="game-top"><span>${scene.place}</span><b>● LIVE DESIGN EXAMPLE</b></div>
        <div class="game-world">
          <div class="terrain terrain-a"></div><div class="terrain terrain-b"></div>
          ${scene.world.map((label,i)=>`<div class="poi p${i+1}"><i></i><span>${label}</span></div>`).join('')}
          ${scene.npc.map((label,i)=>`<div class="avatar a${i+1}"><i>${label[0]}</i><span>${label}</span></div>`).join('')}
        </div>
        <div class="game-objective"><span>OBJECTIVE</span><b>${scene.objective}</b></div>
        <div class="game-feed">${scene.feed.map(line=>`<p><i></i>${line}</p>`).join('')}</div>
      </div>
      <aside class="game-explain">
        <span class="eyebrow">WHY SHOW IN-GAME?</span>
        <h2>기획 규칙이 플레이어에게 어떻게 보이는지까지 정의합니다.</h2>
        <p>노드 관계가 구현되더라도 플레이어가 체감하지 못하면 기획이 아닙니다. 이 구간은 같은 상태가 실제 게임 UI·NPC·목표로 어떻게 노출되는지 보여줍니다.</p>
        <ul>
          <li>플레이어가 무엇을 보고 판단하는가</li>
          <li>NPC의 행동 결과가 어디에 나타나는가</li>
          <li>숨겨진 시스템 상태를 어떤 피드백으로 전달하는가</li>
        </ul>
        <button class="continue-cta" data-stage="result">인과관계 추적 →</button>
      </aside>
    </div>
  `;
}

function resultStage(chapter, trace, message) {
  const steps = trace.length ? trace : defaultTrace(chapter.id);
  return `
    <div class="result-stage">
      <div class="result-copy">
        <span class="eyebrow">CAUSE → EFFECT</span>
        <h2>행동 하나가 어디까지 퍼지는지 추적합니다.</h2>
        <p>${message}</p>
      </div>
      <div class="trace-flow">
        ${steps.map((item,index)=>`
          <div class="trace-node"><span>${String(index+1).padStart(2,'0')}</span><b>${item}</b></div>
          ${index < steps.length-1 ? '<i class="trace-arrow">→</i>' : ''}
        `).join('')}
      </div>
      <div class="result-grid">
        <article><span>PLAYER SEES</span><p>${playerExperience(chapter.id)}</p></article>
        <article><span>SYSTEM CHANGES</span><p>${systemChange(chapter.id)}</p></article>
        <article><span>NEXT CONTENT</span><p>${nextContent(chapter.id)}</p></article>
      </div>
      <div class="result-actions">
        <button data-stage="play">다른 선택 해보기</button>
        <button data-next-chapter ${chapter.id === 'runtime' ? 'disabled':''}>다음 기획 챕터 →</button>
      </div>
    </div>
  `;
}

function inspector(node) {
  const category = categoryMap.get(node.category);
  const groups = [['INPUT',node.inputs],['OUTPUT',node.outputs],['RULES',node.rules],['FAILURE MODES',node.risks],['METRICS',node.metrics]];
  return `
    <aside class="inspector" style="--c:${category?.color || '#8bbfff'}">
      <button class="inspector-close" data-close-inspector aria-label="닫기">×</button>
      <span>${category?.label || ''}</span><h2>${node.title}</h2><p>${node.subtitle}</p>
      <div class="inspector-law"><b>설계 원칙</b><p>${node.principle}</p></div>
      ${groups.map(([title,items])=>`<section><h3>${title}</h3><ul>${(items||[]).map(x=>`<li>${x}</li>`).join('')}</ul></section>`).join('')}
    </aside>
  `;
}

function radialPoints(count) {
  const presets = {
    6:[[50,49],[20,25],[50,15],[80,25],[77,73],[23,73]],
    7:[[50,49],[18,22],[42,14],[70,18],[84,48],[68,78],[25,76]]
  };
  const arr = presets[count];
  if (arr) return arr.map(([x,y])=>({x,y}));
  return Array.from({length:count},(_,i)=>{
    if(i===0) return {x:50,y:50};
    const a=((i-1)/(count-1))*Math.PI*2-Math.PI/2;
    return {x:50+34*Math.cos(a),y:50+35*Math.sin(a)};
  });
}

function curve(a,b) {
  const x1=a.x*9,y1=a.y*5,x2=b.x*9,y2=b.y*5,mx=(x1+x2)/2;
  return `M ${x1} ${y1} C ${mx} ${y1}, ${mx} ${y2}, ${x2} ${y2}`;
}

function statCard(label,value,suffix) {
  return `<div class="stat-card"><span>${label}</span><b>${fmt(value)}<small>${suffix}</small></b></div>`;
}
function fmt(v){ return typeof v === 'number' && !Number.isInteger(v) ? v.toFixed(1) : String(v ?? 0); }

function designLaw(id){ return ({
  premise:'같은 세계 규칙 + 다른 정보와 목표 = 살아있는 NPC',
  economy:'아이템은 생성되지 않고 공급망을 통과한다.',
  contracts:'퀘스트는 대본이 아니라 해결되지 않은 상태 차이다.',
  war:'전투 결과는 보급·물가·인구·정치에 반드시 흔적을 남긴다.',
  runtime:'정밀도는 달라도 자원과 인과관계는 보존한다.'
})[id];}
function failureMode(id){ return ({
  premise:'NPC 전용 치트와 무한 자원 때문에 플레이어 규칙이 무의미해지는 것.',
  economy:'상점 무한 재고와 고정가 때문에 생산·물류가 장식이 되는 것.',
  contracts:'NPC 대사만 동적으로 만들고 실제 문제·예산·화물은 존재하지 않는 것.',
  war:'전쟁이 인스턴스 PvP로 끝나고 도시와 경제가 아무 영향도 받지 않는 것.',
  runtime:'LOD 전환 순간 자원·NPC·사건이 순간 생성되거나 사라지는 것.'
})[id];}
function playerExperience(id){ return ({
  premise:'“저 NPC도 나처럼 돈이 필요해서 저기서 일하는구나”를 행동으로 이해한다.',
  economy:'내 구매와 제작이 실제 시세와 재고를 움직이는 것을 체감한다.',
  contracts:'퀘스트가 월드 문제에서 발생했고 다른 NPC도 경쟁할 수 있음을 본다.',
  war:'전쟁을 전투뿐 아니라 호위·상업·구호·정치 플레이로 경험한다.',
  runtime:'플레이어는 LOD를 느끼지 않지만 세계가 계속 이어지는 결과를 받는다.'
})[id];}
function systemChange(id){ return ({
  premise:'욕구·현금·체력·숙련·시장 소비가 같은 Actor 상태에 누적된다.',
  economy:'재고, 주문, 생산비, 운송량, 가격 신호가 연결된다.',
  contracts:'문제 → 예산 → 계약 → 실제 화물 이동 → 생산 재개로 이어진다.',
  war:'보급·치안·물가·피난민·사기가 동시에 변한다.',
  runtime:'Actor 정밀도와 CPU 예산은 바뀌지만 이벤트와 총량은 보존된다.'
})[id];}
function nextContent(id){ return ({
  premise:'새 직업 선택, 소비, 관계, 길드 가입 같은 다음 행동이 열린다.',
  economy:'차익거래, 생산 확대, 신규 운송 노선, 투자 기회가 생긴다.',
  contracts:'후속 제작·호위·조달 계약과 평판 기반 고가치 의뢰가 열린다.',
  war:'피난민 지원, 재건, 세금 정책, 점령지 물류 같은 후속 콘텐츠가 생긴다.',
  runtime:'중요 사건은 다시 정밀 시뮬레이션으로 승격되어 새 플레이를 만든다.'
})[id];}
function defaultTrace(id){ return ({
  premise:['욕구','계획','노동/소비','자산 변화','다음 목표'],
  economy:['구매','재고 감소','가격 상승','생산 확대','물류 유입'],
  contracts:['재고 부족','계약 생성','수락','화물 이동','생산 재개'],
  war:['갈등','보급 충격','전투','민간 피해','정책 대응'],
  runtime:['명령','Fact 이벤트','상태 반영','LOD 판정','스냅샷']
})[id];}

customElements.define('living-mmo-app', LivingMmoApp);
