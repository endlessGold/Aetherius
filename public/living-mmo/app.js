import { categories, nodes, edges, scenarios, pillars } from './model.js';

const nodeMap = new Map(nodes.map((node) => [node.id, node]));
const categoryMap = new Map(categories.map((category) => [category.id, category]));

class LivingMmoApp extends HTMLElement {
  constructor() {
    super();
    this.state = {
      selectedNodeId: 'core',
      activeScenarioId: 'mine-collapse',
      activeCategories: new Set(categories.map((category) => category.id)),
      query: ''
    };
  }

  connectedCallback() {
    this.bindEvents();
    this.render();
  }

  bindEvents() {
    this.addEventListener('click', (event) => {
      const nodeButton = event.target.closest('[data-node-id]');
      if (nodeButton) {
        this.state.selectedNodeId = nodeButton.dataset.nodeId;
        this.render();
        return;
      }

      const categoryButton = event.target.closest('[data-category-id]');
      if (categoryButton) {
        const id = categoryButton.dataset.categoryId;
        if (this.state.activeCategories.has(id)) this.state.activeCategories.delete(id);
        else this.state.activeCategories.add(id);
        this.render();
        return;
      }

      const scenarioButton = event.target.closest('[data-scenario-id]');
      if (scenarioButton) {
        this.state.activeScenarioId = scenarioButton.dataset.scenarioId;
        this.render();
      }
    });

    this.addEventListener('input', (event) => {
      if (!event.target.matches('#node-search')) return;
      this.state.query = event.target.value;
      this.render();
      const next = this.querySelector('#node-search');
      next?.focus();
      next?.setSelectionRange(this.state.query.length, this.state.query.length);
    });
  }

  getVisibleNodes() {
    const normalized = this.state.query.trim().toLocaleLowerCase('ko');
    return nodes.filter((node) => {
      const categoryVisible = this.state.activeCategories.has(node.category);
      if (!categoryVisible) return false;
      if (!normalized) return true;
      return `${node.title} ${node.subtitle} ${node.principle}`.toLocaleLowerCase('ko').includes(normalized);
    });
  }

  render() {
    const visibleNodes = this.getVisibleNodes();
    const visibleIds = new Set(visibleNodes.map((node) => node.id));
    const selected = nodeMap.get(this.state.selectedNodeId) || nodeMap.get('core');
    const scenario = scenarios.find((item) => item.id === this.state.activeScenarioId) || scenarios[0];
    const scenarioIds = new Set(scenario.nodeIds);

    this.innerHTML = `
      <div class="shell">
        <header class="topbar">
          <div class="brand">
            <div class="brand-mark">LM</div>
            <div>
              <div class="eyebrow">AETHERIUS DESIGN LAB</div>
              <h1>Living MMO <span>System Graph</span></h1>
            </div>
          </div>
          <div class="top-summary">
            <span><b>${nodes.length}</b> systems</span>
            <span><b>${edges.length}</b> relationships</span>
            <span><b>${scenarios.length}</b> emergence scenarios</span>
          </div>
        </header>

        <section class="hero">
          <div>
            <div class="hero-kicker">게임 기획 노드그래프 · NPC = PLAYER-LIKE ACTOR</div>
            <h2>NPC가 배경이 아니라 <em>같은 세계를 플레이하는 MMO</em></h2>
            <p>상점 재고부터 전쟁, 노동, 이주, 퀘스트까지 하나의 원인-결과 그래프로 연결합니다. 개발자가 이벤트를 넣어서 움직이는 세계가 아니라, 세계의 문제가 콘텐츠를 발생시키는 구조입니다.</p>
          </div>
          <div class="hero-rule">
            <span>CORE RULE</span>
            <strong>행동 → 비용 → 상태 변화 → 타인의 기회</strong>
            <small>모든 주요 행위는 이벤트와 인과관계를 남긴다.</small>
          </div>
        </section>

        <main class="workspace">
          <aside class="left-panel panel">
            <div class="panel-heading">
              <div>
                <span class="section-label">FILTER</span>
                <h3>시스템 범위</h3>
              </div>
              <span class="count">${visibleNodes.length}/${nodes.length}</span>
            </div>
            <label class="search-wrap">
              <span>⌕</span>
              <input id="node-search" type="search" placeholder="노드 검색" value="${escapeHtml(this.state.query)}" />
            </label>
            <div class="category-list">
              ${categories.map((category) => {
                const active = this.state.activeCategories.has(category.id);
                const count = nodes.filter((node) => node.category === category.id).length;
                return `<button class="category-row ${active ? 'active' : ''}" data-category-id="${category.id}" style="--accent:${category.color}">
                  <span class="category-dot"></span><span>${category.label}</span><b>${count}</b>
                </button>`;
              }).join('')}
            </div>
            <div class="pillar-block">
              <span class="section-label">DESIGN PILLARS</span>
              ${pillars.map(([title, body]) => `<div class="pillar"><b>${title}</b><span>${body}</span></div>`).join('')}
            </div>
          </aside>

          <section class="graph-panel panel">
            <div class="graph-toolbar">
              <div>
                <span class="section-label">SYSTEM MAP</span>
                <h3>Living MMO 전체 구조</h3>
              </div>
              <div class="legend">선택한 시나리오 노드는 <span></span> 강조</div>
            </div>
            <div class="graph-stage">
              <svg class="edge-layer" viewBox="0 0 1400 900" aria-hidden="true">
                ${edges.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target)).map((edge) => edgeSvg(edge, scenarioIds)).join('')}
              </svg>
              <div class="node-layer" aria-label="게임 기획 노드그래프">
                ${visibleNodes.map((node) => nodeButton(node, this.state.selectedNodeId, scenarioIds.has(node.id))).join('')}
              </div>
            </div>
          </section>

          <aside class="right-panel panel">
            ${detailPanel(selected)}
          </aside>
        </main>

        <section class="scenario-section panel">
          <div class="scenario-header">
            <div>
              <span class="section-label">EMERGENCE TEST</span>
              <h3>창발 시나리오로 구조 검증</h3>
            </div>
            <p>단일 사건이 여러 시스템을 통과해 실제 콘텐츠가 되는지 확인합니다.</p>
          </div>
          <div class="scenario-tabs">
            ${scenarios.map((item) => `<button data-scenario-id="${item.id}" class="${item.id === scenario.id ? 'active' : ''}">${item.title}</button>`).join('')}
          </div>
          <div class="scenario-body">
            <div class="scenario-intro">
              <span>${scenario.title}</span>
              <h4>${scenario.kicker}</h4>
              <div class="scenario-tags">${scenario.nodeIds.map((id) => `<button data-node-id="${id}">${nodeMap.get(id)?.title ?? id}</button>`).join('')}</div>
            </div>
            <ol class="scenario-flow">
              ${scenario.steps.map((step, index) => `<li><span>${String(index + 1).padStart(2,'0')}</span><p>${step}</p></li>`).join('')}
            </ol>
          </div>
        </section>

        <footer>
          <span>Living MMO Concept · Aetherius</span>
          <span>Design principle: simulation produces content, content does not fake simulation.</span>
        </footer>
      </div>
    `;
  }
}

function nodeButton(node, selectedId, inScenario) {
  const category = categoryMap.get(node.category);
  const selected = node.id === selectedId;
  return `<button
    class="graph-node ${node.size || ''} ${selected ? 'selected' : ''} ${inScenario ? 'scenario-hit' : ''}"
    data-node-id="${node.id}"
    style="--x:${node.x};--y:${node.y};--accent:${category?.color || '#fff'}"
    aria-label="${escapeHtml(node.title)} 상세 보기">
      <span class="node-overline">${category?.label || ''}</span>
      <strong>${node.title}</strong>
      <small>${node.subtitle}</small>
    </button>`;
}

function edgeSvg(edge, scenarioIds) {
  const source = nodeMap.get(edge.source);
  const target = nodeMap.get(edge.target);
  if (!source || !target) return '';
  const highlighted = scenarioIds.has(edge.source) && scenarioIds.has(edge.target);
  const sx = source.x + 100;
  const sy = source.y + 34;
  const tx = target.x + 100;
  const ty = target.y + 34;
  const mx = (sx + tx) / 2;
  const d = `M ${sx} ${sy} C ${mx} ${sy}, ${mx} ${ty}, ${tx} ${ty}`;
  return `<path d="${d}" class="edge ${highlighted ? 'highlight' : ''}" />`;
}

function detailPanel(node) {
  const category = categoryMap.get(node.category);
  const rows = [
    ['INPUT', node.inputs], ['OUTPUT', node.outputs], ['RULES', node.rules], ['FAILURE MODES', node.risks], ['METRICS', node.metrics]
  ];
  return `
    <div class="detail-head" style="--accent:${category?.color || '#fff'}">
      <span>${category?.label || ''}</span>
      <h3>${node.title}</h3>
      <p>${node.subtitle}</p>
    </div>
    <div class="principle-card">
      <span>설계 원칙</span>
      <p>${node.principle}</p>
    </div>
    <div class="detail-sections">
      ${rows.map(([label, items]) => `<section><h4>${label}</h4><ul>${(items || []).map((item) => `<li>${item}</li>`).join('')}</ul></section>`).join('')}
    </div>
  `;
}

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, (char) => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', "'":'&#39;', '"':'&quot;' })[char]);
}

customElements.define('living-mmo-app', LivingMmoApp);
