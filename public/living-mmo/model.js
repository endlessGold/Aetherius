export const categories = [
  { id: 'actor', label: '행위자', color: '#56a7ff' },
  { id: 'mind', label: '목표·기억', color: '#b783ff' },
  { id: 'world', label: '세계·생태', color: '#43d3b0' },
  { id: 'economy', label: '경제·물류', color: '#f2b35f' },
  { id: 'society', label: '사회·정치', color: '#ff7f95' },
  { id: 'conflict', label: '전투·치안', color: '#ff6767' },
  { id: 'content', label: '퀘스트·콘텐츠', color: '#6ed4ff' },
  { id: 'runtime', label: '시뮬레이션', color: '#9fe870' }
];

export const nodes = [
  {
    id: 'core', category: 'runtime', x: 700, y: 440, size: 'core',
    title: '동일한 세계 규칙', subtitle: 'NPC와 플레이어는 같은 MMO를 플레이한다',
    principle: 'NPC를 장식물이나 퀘스트 자판기가 아니라 게임 규칙을 실제로 소비하는 행위자로 취급한다.',
    inputs: ['월드 상태', '행위자 의도', '게임 규칙'], outputs: ['상태 변화', '경제·사회 파급', '새로운 기회'],
    rules: ['NPC 전용 치트성 재화 생성 금지', '가능한 행동은 플레이어와 동일한 권한 API 사용', '모든 상태 변화는 원인과 로그를 남김'],
    risks: ['시뮬레이션 비용 폭증', 'NPC가 플레이어 경험을 과도하게 선점', '시스템 상호작용이 불투명해짐'],
    metrics: ['NPC/Player 규칙 예외 수', '창발 사건 비율', '원인 추적 성공률']
  },

  { id: 'actor-system', category: 'actor', x: 330, y: 170, size: 'major', title: '행위자 모델', subtitle: '플레이어와 NPC의 공통 상태', principle: '모든 사람형 존재를 같은 Actor 인터페이스로 표현한다.', inputs: ['신원', '육체', '소유물', '권한'], outputs: ['행동 가능 목록', '위험·비용', '사회적 책임'], rules: ['공통 인벤토리·장비·스탯', '직업은 능력 집합이지 NPC 역할 고정값이 아님', '사망·부상·구금도 동일하게 적용'], risks: ['NPC 특수 케이스 증가', '플레이어와 NPC 간 밸런스 붕괴'], metrics: ['공통 컴포넌트 비율', '특수 케이스 수'] },
  { id: 'identity', category: 'actor', x: 135, y: 72, title: '신원·법적 지위', subtitle: '이름, 출신, 시민권, 범죄 기록', principle: '행위자는 세계 안에서 추적 가능한 사회적 신원을 가진다.', inputs: ['출생/생성', '이주', '범죄/공적'], outputs: ['출입권', '세금', '법 집행'], rules: ['신분은 행정 주체별로 다를 수 있음'], risks: ['신원 시스템이 장식으로 전락'], metrics: ['신원 기반 결정 횟수'] },
  { id: 'body', category: 'actor', x: 135, y: 145, title: '육체·상태', subtitle: '체력, 피로, 부상, 질병, 굶주림', principle: '행동에는 물리적 유지비가 따른다.', inputs: ['전투', '노동', '환경'], outputs: ['행동 효율', '치료 수요'], rules: ['회복 자원은 경제와 연결'], risks: ['생존 수치가 귀찮은 게이지가 됨'], metrics: ['상태가 의사결정에 영향을 준 비율'] },
  { id: 'skills', category: 'actor', x: 135, y: 218, title: '기술·숙련', subtitle: '직업과 능력의 실제 실행 능력', principle: '직업명보다 숙련과 도구가 행동 가능성을 결정한다.', inputs: ['경험', '훈련', '도구'], outputs: ['품질', '속도', '실패율'], rules: ['숙련은 사용과 교육으로 증가'], risks: ['메타 고착'], metrics: ['숙련 다양성', '직업 전환률'] },
  { id: 'ownership', category: 'actor', x: 135, y: 291, title: '소유·계약 권리', subtitle: '아이템, 집, 토지, 사업체, 부채', principle: '아이템보다 소유권과 책임이 세계를 지속시킨다.', inputs: ['구매', '상속', '약탈', '계약'], outputs: ['재산권', '분쟁', '담보'], rules: ['소유권 변경은 이벤트로 기록'], risks: ['복구 불가능한 경제 피해'], metrics: ['재산 이동량', '분쟁 건수'] },

  { id: 'mind-system', category: 'mind', x: 690, y: 125, size: 'major', title: '목표·기억·의사결정', subtitle: 'LLM이 아니라 게임 규칙이 먼저', principle: 'AI는 목표를 해석하지만 실행은 제한된 게임 행동 API로 한다.', inputs: ['욕구', '기억', '관측', '성격'], outputs: ['계획', '행동 우선순위', '관계 변화'], rules: ['Utility/GOAP가 기본', 'LLM은 장기 목표·대화·설명 계층', '결정은 근거를 저장'], risks: ['LLM 비용', '비결정성', '설명 불가능한 행동'], metrics: ['결정당 비용', '행동 취소율', '설명 가능 비율'] },
  { id: 'needs', category: 'mind', x: 470, y: 24, title: '욕구·생존', subtitle: '식량, 안전, 소속, 성취, 자산', principle: '행동 동력은 퀘스트 스크립트가 아니라 결핍과 목표다.', inputs: ['현재 상태'], outputs: ['우선순위'], rules: ['욕구는 맥락에 따라 가중치 변화'], risks: ['모든 NPC가 비슷해짐'], metrics: ['목표 다양성'] },
  { id: 'memory', category: 'mind', x: 630, y: 24, title: '기억·지식', subtitle: '직접 본 사실과 소문을 구분', principle: 'NPC는 세계 전체를 알지 못한다.', inputs: ['관측', '대화', '문서'], outputs: ['신념', '소문', '계획'], rules: ['사실/추정/소문 출처 보존', '망각과 왜곡 허용'], risks: ['메모리 폭증'], metrics: ['지식 출처 추적률', '오정보 전파율'] },
  { id: 'personality', category: 'mind', x: 790, y: 24, title: '성격·가치관', subtitle: '위험 선호, 탐욕, 충성, 윤리', principle: '같은 상황에서도 다른 선택을 만든다.', inputs: ['성향', '경험'], outputs: ['행동 가중치'], rules: ['수치 하나로 선악을 표현하지 않음'], risks: ['캐릭터가 고정관념이 됨'], metrics: ['선택 분산'] },
  { id: 'planning', category: 'mind', x: 950, y: 24, title: '계획·행동 API', subtitle: 'move / buy / sell / fight / negotiate', principle: '자유로운 언어 모델 출력을 실제 명령으로 직접 실행하지 않는다.', inputs: ['목표', '가능 행동'], outputs: ['검증된 액션 큐'], rules: ['권한 검사', '비용 선차감/예약', '실패 시 재계획'], risks: ['계획 루프'], metrics: ['행동 성공률', '재계획 횟수'] },

  { id: 'world-system', category: 'world', x: 1080, y: 175, size: 'major', title: '세계·생태·자원', subtitle: '콘텐츠 공급도 세계 상태에서 발생', principle: '자원과 위험은 지역별로 생성·고갈·회복되며 경제의 원인이 된다.', inputs: ['기후', '지형', '생태', '채취'], outputs: ['자원량', '위험도', '이주 압력'], rules: ['자원은 무한 리젠이 아니라 재생 규칙', '지역 간 이동 비용 존재'], risks: ['자원 고갈로 서버가 망가짐'], metrics: ['지역별 자원 커버리지', '고갈 복구시간'] },
  { id: 'resources', category: 'world', x: 1190, y: 65, title: '자원·재생', subtitle: '광물, 목재, 식량, 마력', principle: '공급은 물리적 위치와 재생 조건을 가진다.', inputs: ['환경'], outputs: ['원재료'], rules: ['희소성은 스폰율이 아니라 총량과 회복으로 조절'], risks: ['독점'], metrics: ['자원 지니계수'] },
  { id: 'ecology', category: 'world', x: 1270, y: 135, title: '생태·몬스터', subtitle: '먹이, 번식, 영역, 포식', principle: '몬스터도 지역 경제와 안전에 영향을 준다.', inputs: ['먹이', '서식지'], outputs: ['개체수', '위험'], rules: ['개체수는 사냥 압력에 반응'], risks: ['멸종/폭증'], metrics: ['개체수 변동성'] },
  { id: 'weather', category: 'world', x: 1285, y: 220, title: '기후·계절', subtitle: '생산성·이동·전투를 바꾸는 외생 변수', principle: '날씨는 시각효과가 아니라 생산과 위험의 입력이다.', inputs: ['계절', '지역'], outputs: ['수확량', '이동비용'], rules: ['예측 가능성과 변동성 공존'], risks: ['랜덤 억까'], metrics: ['기후 충격 영향도'] },
  { id: 'travel', category: 'world', x: 1210, y: 305, title: '공간·이동', subtitle: '거리, 길, 운송 용량, 국경', principle: '거리와 이동 시간이 지역 경제를 만든다.', inputs: ['지도', '교통'], outputs: ['운송비', '정보 지연'], rules: ['즉시 전송 최소화'], risks: ['이동이 지루해짐'], metrics: ['지역 간 가격차', '평균 이동시간'] },

  { id: 'economy-system', category: 'economy', x: 1085, y: 510, size: 'major', title: '생산·물류·시장', subtitle: '아이템은 공급망을 거쳐 이동한다', principle: 'NPC 상점은 생성기가 아니라 실제 재고를 가진 사업체다.', inputs: ['자원', '노동', '자본', '정보'], outputs: ['상품', '가격', '고용', '부'], rules: ['생산에는 입력재·시간·도구 필요', '재고가 없으면 품절', '가격은 주문·재고·기대에 반응'], risks: ['경제 붕괴', '봇 같은 NPC가 시장 선점'], metrics: ['거래량', '가격 변동성', '재고 회전', '부의 집중도'] },
  { id: 'labor', category: 'economy', x: 1245, y: 395, title: '노동·임금', subtitle: '직업은 일자리 수요와 연결', principle: 'NPC는 생계를 위해 노동을 선택하고 더 나은 조건으로 이동한다.', inputs: ['숙련', '일자리', '임금'], outputs: ['생산', '소득', '이주'], rules: ['사업체가 고용 수요 생성'], risks: ['실업 고착'], metrics: ['실업률', '임금 분산'] },
  { id: 'production', category: 'economy', x: 1285, y: 475, title: '제작·산업', subtitle: '재료 → 공정 → 품질 → 부산물', principle: '레시피는 단순 버튼이 아니라 생산 공정이다.', inputs: ['재료', '도구', '노동'], outputs: ['상품', '부산물'], rules: ['품질과 생산성이 숙련·설비에 영향'], risks: ['과도한 복잡성'], metrics: ['단위 생산비'] },
  { id: 'logistics', category: 'economy', x: 1280, y: 555, title: '물류·운송', subtitle: '창고, 상단, 호위, 손실', principle: '상품은 장소를 이동해야 가치가 실현된다.', inputs: ['재고', '운송수단'], outputs: ['지역 공급'], rules: ['습격·파손·보험 가능'], risks: ['병목'], metrics: ['운송 손실률', '배송시간'] },
  { id: 'market', category: 'economy', x: 1240, y: 635, title: '시장·가격', subtitle: '호가, 주문, 재고, 차익거래', principle: '가격은 NPC/Player 주문에서 형성된다.', inputs: ['매수/매도 주문'], outputs: ['체결가', '가격 신호'], rules: ['NPC도 같은 주문 규칙 사용'], risks: ['시세 조작'], metrics: ['스프레드', '유동성', '가격 발견 속도'] },
  { id: 'finance', category: 'economy', x: 1150, y: 700, title: '금융·신용', subtitle: '대출, 담보, 보험, 투자', principle: '자본 부족과 위험 이전을 플레이로 만든다.', inputs: ['신용', '담보'], outputs: ['대출', '투자'], rules: ['부도와 손실 실재'], risks: ['복잡한 파생상품'], metrics: ['부도율', '신용 스프레드'] },

  { id: 'society-system', category: 'society', x: 700, y: 735, size: 'major', title: '사회·도시·정치', subtitle: '관계가 조직과 제도로 확장된다', principle: '도시와 길드는 NPC가 실제로 운영하고 플레이어가 그 구조에 참여한다.', inputs: ['인구', '재정', '관계', '안보'], outputs: ['법', '공공서비스', '세금', '정책'], rules: ['조직은 자금·인력·권한을 가진 실체', '정책은 경제와 치안에 효과를 냄'], risks: ['정치가 장식화', '한 세력이 영구 독점'], metrics: ['정책 변화 빈도', '도시 재정 건전성', '이주율'] },
  { id: 'relationships', category: 'society', x: 420, y: 795, title: '관계·평판', subtitle: '개인·집단별 신뢰와 원한', principle: '하나의 글로벌 호감도가 아니라 사건별 관계를 축적한다.', inputs: ['거래', '도움', '배신'], outputs: ['신뢰', '접근권'], rules: ['평판은 집단별로 분리'], risks: ['영구 낙인'], metrics: ['관계 회복률'] },
  { id: 'guild', category: 'society', x: 575, y: 830, title: '길드·조직', subtitle: '회원, 창고, 급여, 직책, 전략', principle: 'NPC도 창설·가입·탈퇴·승진한다.', inputs: ['공동 목표', '자금'], outputs: ['조직 행동'], rules: ['조직 자산과 개인 자산 분리'], risks: ['NPC 조직이 플레이어 배제'], metrics: ['혼합 길드 비율'] },
  { id: 'settlement', category: 'society', x: 760, y: 835, title: '도시·인구', subtitle: '주거, 일자리, 물가, 안전, 이주', principle: '도시는 배경이 아니라 인구와 기업의 집합이다.', inputs: ['인구 흐름', '사업체'], outputs: ['세수', '수요', '노동력'], rules: ['거주 결정은 생활비·안전·기회에 반응'], risks: ['유령 도시'], metrics: ['순이주', '공실률'] },
  { id: 'governance', category: 'society', x: 945, y: 820, title: '행정·법·세금', subtitle: '법 집행과 공공재', principle: '규칙 위반의 결과와 비용이 실제 기관을 통해 발생한다.', inputs: ['법', '예산', '범죄'], outputs: ['세금', '벌금', '서비스'], rules: ['법은 지역별로 다를 수 있음'], risks: ['벌금 경제'], metrics: ['법 집행률', '행정비용'] },

  { id: 'conflict-system', category: 'conflict', x: 330, y: 530, size: 'major', title: '전투·치안·전쟁', subtitle: '폭력도 경제와 정치의 일부', principle: '전투는 독립 미니게임이 아니라 자산·안전·영토·평판을 바꾸는 수단이다.', inputs: ['위협', '장비', '조직'], outputs: ['부상', '사망', '노획', '영토 변화'], rules: ['폭력에는 법적·경제적 비용', 'NPC도 후퇴·협상·항복'], risks: ['NPC가 플레이어를 무한 괴롭힘'], metrics: ['전투 원인 분포', '민간 피해', '회복 시간'] },
  { id: 'combat', category: 'conflict', x: 120, y: 415, title: '전투 규칙', subtitle: '스킬, 위치, 장비, 상태이상', principle: '플레이어와 NPC가 동일한 전투 규칙을 사용한다.', inputs: ['능력', '장비'], outputs: ['피해', '상태'], rules: ['NPC 전용 명중 보정 금지'], risks: ['AI 반응속도 불공정'], metrics: ['동일 스펙 승률차'] },
  { id: 'security', category: 'conflict', x: 105, y: 500, title: '치안·범죄', subtitle: '절도, 사기, 살인, 현상금, 수사', principle: '범죄는 시스템적으로 가능한 대신 흔적과 위험이 따른다.', inputs: ['범죄 행위', '증거'], outputs: ['수배', '구금', '보상'], rules: ['관측/증거 기반'], risks: ['그리핑'], metrics: ['피해 복구율', '범죄 억제율'] },
  { id: 'war', category: 'conflict', x: 110, y: 590, title: '세력전·영토', subtitle: '보급, 병력, 점령, 협상', principle: '전쟁은 자원과 정치에서 발생하고 보급에 제약된다.', inputs: ['갈등', '군사력', '보급'], outputs: ['영토', '난민', '가격 충격'], rules: ['점령 유지비 존재'], risks: ['스노우볼'], metrics: ['전쟁 지속시간', '회복률'] },
  { id: 'recovery', category: 'conflict', x: 145, y: 680, title: '피해·회복', subtitle: '치료, 보험, 복구, 상속', principle: '패배의 의미는 유지하되 계정 단위 파산은 방지한다.', inputs: ['손실'], outputs: ['복구 경로'], rules: ['보호 자산/상속/보험 계층'], risks: ['무의미한 죽음 또는 과도한 처벌'], metrics: ['패배 후 복귀시간'] },

  { id: 'content-system', category: 'content', x: 520, y: 420, size: 'major', title: '계약·퀘스트·정보', subtitle: '콘텐츠는 문제에서 발생한다', principle: '퀘스트는 개발자 스크립트가 아니라 행위자의 해결되지 않은 문제를 계약으로 변환한다.', inputs: ['부족', '위험', '목표 충돌'], outputs: ['의뢰', '보상', '스토리'], rules: ['발행자에게 실제 비용/목표가 존재', 'NPC도 수락 가능', '실패와 경쟁 존재'], risks: ['퀘스트 품질 편차', '보상 악용'], metrics: ['동적 퀘스트 비율', '중복률', '완료 주체 분포'] },
  { id: 'contract', category: 'content', x: 370, y: 340, title: '계약·의뢰', subtitle: '배송, 호위, 제작, 사냥, 정보', principle: '문제를 실행 가능한 계약으로 표준화한다.', inputs: ['요구', '예산'], outputs: ['목표·보상·기한'], rules: ['에스크로/보증금 지원'], risks: ['스팸 계약'], metrics: ['계약 체결률'] },
  { id: 'quest-market', category: 'content', x: 480, y: 305, title: '퀘스트 시장', subtitle: 'Player와 NPC가 동일한 의뢰를 경쟁', principle: '퀘스트 역시 노동 시장의 한 형태다.', inputs: ['계약'], outputs: ['수락 경쟁'], rules: ['평판·가격·거리로 매칭'], risks: ['NPC가 좋은 의뢰 선점'], metrics: ['Player 수락 기회'] },
  { id: 'rumor', category: 'content', x: 610, y: 300, title: '정보·소문', subtitle: '가격, 위험, 발견, 정치 정보', principle: '정보 자체가 희소한 자산이 된다.', inputs: ['관측', '보고'], outputs: ['시장 기대', '탐험 목표'], rules: ['정보는 지연·왜곡 가능'], risks: ['허위정보 피로'], metrics: ['정보 정확도', '전파시간'] },
  { id: 'story', category: 'content', x: 730, y: 310, title: '창발 서사', subtitle: '사건 로그 → 의미 있는 이야기', principle: '시뮬레이션 사건을 묶어 사람이 이해할 수 있는 서사로 표현한다.', inputs: ['사건 그래프'], outputs: ['뉴스', '연대기', 'NPC 대화'], rules: ['서술이 사실을 바꾸지 않음'], risks: ['LLM 환각'], metrics: ['사실 일치율'] },

  { id: 'runtime-system', category: 'runtime', x: 910, y: 430, size: 'major', title: '시뮬레이션 런타임', subtitle: '모든 NPC를 매 프레임 생각시키지 않는다', principle: '중요도에 따라 정밀도를 바꾸고 Tick 경계에서 결정론적 상태를 반영한다.', inputs: ['이벤트', '활성 지역', '관심도'], outputs: ['Tick 결과', '이벤트 로그', '스냅샷'], rules: ['Active/Coarse/Statistical 3단계 LOD', '오프라인 지역은 집계 모델', '중요 사건만 고해상도 승격'], risks: ['LOD 전환 이질감', '서버 비용'], metrics: ['행위자당 CPU', 'Tick 지연', 'LOD 승격 오류'] },
  { id: 'eventbus', category: 'runtime', x: 920, y: 560, title: '이벤트·인과 그래프', subtitle: '무엇이 왜 일어났는지 남긴다', principle: '모든 중요한 상태 변화에 원인 이벤트 ID를 연결한다.', inputs: ['명령', '시스템 결과'], outputs: ['사실 이벤트'], rules: ['Command와 Fact 분리'], risks: ['로그 폭증'], metrics: ['원인 추적률'] },
  { id: 'lod', category: 'runtime', x: 980, y: 640, title: '시뮬레이션 LOD', subtitle: '근처 NPC는 개별, 멀리선 집계', principle: '정밀도는 플레이어 영향권과 사건 중요도에 따라 결정한다.', inputs: ['관심도', '지역 상태'], outputs: ['연산 예산 배분'], rules: ['결과 통계가 정밀 모델과 연속적이어야 함'], risks: ['텔레포트성 결과'], metrics: ['LOD 경계 오차'] },
  { id: 'persistence', category: 'runtime', x: 875, y: 710, title: '영속성·복구', subtitle: '스냅샷 + 이벤트 재생', principle: '세계는 서버 재시작 후에도 이어져야 한다.', inputs: ['이벤트', '스냅샷'], outputs: ['복원된 월드'], rules: ['중요 자산은 강한 일관성'], risks: ['롤백 악용'], metrics: ['복구시간', '데이터 손실 RPO'] },
  { id: 'observability', category: 'runtime', x: 1030, y: 755, title: '관측·운영 지표', subtitle: '경제/사회 붕괴를 자동 탐지', principle: '밸런스는 평균 DPS가 아니라 세계 건강 지표로 본다.', inputs: ['텔레메트리'], outputs: ['경보', '운영 판단'], rules: ['개입은 최소화하고 원인 공개'], risks: ['GM 개입이 시뮬레이션 의미를 훼손'], metrics: ['가격 폭주', '인구 붕괴', '독점도', '콘텐츠 가용성'] }
];

export const edges = [
  ['core','actor-system'],['core','mind-system'],['core','world-system'],['core','economy-system'],['core','society-system'],['core','conflict-system'],['core','content-system'],['core','runtime-system'],
  ['actor-system','identity'],['actor-system','body'],['actor-system','skills'],['actor-system','ownership'],
  ['mind-system','needs'],['mind-system','memory'],['mind-system','personality'],['mind-system','planning'],
  ['world-system','resources'],['world-system','ecology'],['world-system','weather'],['world-system','travel'],
  ['economy-system','labor'],['economy-system','production'],['economy-system','logistics'],['economy-system','market'],['economy-system','finance'],
  ['society-system','relationships'],['society-system','guild'],['society-system','settlement'],['society-system','governance'],
  ['conflict-system','combat'],['conflict-system','security'],['conflict-system','war'],['conflict-system','recovery'],
  ['content-system','contract'],['content-system','quest-market'],['content-system','rumor'],['content-system','story'],
  ['runtime-system','eventbus'],['runtime-system','lod'],['runtime-system','persistence'],['runtime-system','observability'],
  ['resources','production'],['ecology','security'],['travel','logistics'],['labor','settlement'],['market','needs'],['market','finance'],['logistics','contract'],['relationships','guild'],['guild','war'],['governance','security'],['security','contract'],['rumor','market'],['memory','rumor'],['planning','contract'],['eventbus','story'],['observability','economy-system']
].map(([source,target], index) => ({ id:`e${index}`, source, target }));

export const scenarios = [
  {
    id: 'mine-collapse', title: '북부 광산 붕괴', kicker: '공급 충격 → 퀘스트와 이주가 자연 발생',
    nodeIds: ['resources','body','labor','logistics','market','contract','quest-market','settlement','rumor'],
    steps: [
      '붕괴로 철광석 채굴량과 광부 노동 가능 인원이 급감한다.',
      '운송업자는 남은 재고를 우선순위가 높은 도시로 돌린다.',
      '철 가격과 광부 임금이 상승하고, 대장장이의 생산비가 오른다.',
      '광산주는 구조·의료·보수·호위 계약을 실제 예산으로 발행한다.',
      'NPC와 플레이어가 계약을 경쟁 수락하고, 상인은 다른 도시의 철을 차익 운송한다.',
      '사건이 길어지면 주민 이주와 도시 세수 감소까지 이어진다.'
    ]
  },
  {
    id: 'war-shock', title: '국경 전쟁', kicker: '정치가 전투를 만들고 전투가 다시 경제를 바꿈',
    nodeIds: ['governance','war','security','logistics','market','guild','settlement','recovery','rumor'],
    steps: [
      '국경 분쟁과 세력 관계 악화로 동원령과 통행 제한이 발생한다.',
      '보급 수요가 늘고 민간 물류의 위험·보험료가 상승한다.',
      '길드와 용병 NPC가 호위·정찰·공급 계약을 수락한다.',
      '전투 결과로 부상자, 난민, 점령지, 세수 변동이 발생한다.',
      '가격과 인구 이동이 후방 도시까지 파급되고 새로운 정치적 불만을 만든다.'
    ]
  },
  {
    id: 'player-monopoly', title: '플레이어 독점 시도', kicker: '플레이어의 시장행동도 세계가 대응',
    nodeIds: ['ownership','resources','market','finance','rumor','labor','production','governance'],
    steps: [
      '플레이어 길드가 특정 희귀 광물과 운송 노선을 대량 매입한다.',
      '가격 신호를 본 NPC 생산자들이 대체 자원과 신규 광맥 탐사를 선택한다.',
      '상인들은 높은 마진을 보고 다른 지역에서 공급을 유입한다.',
      '경쟁 사업체가 대출을 받아 생산설비를 확장하면서 독점 수익을 압박한다.',
      '독점이 장기화되면 도시 행정은 세금·허가·공공 광산 정책을 검토할 수 있다.'
    ]
  },
  {
    id: 'npc-career', title: 'NPC의 한 달', kicker: '한 NPC가 실제 플레이어처럼 성장',
    nodeIds: ['needs','skills','labor','market','relationships','guild','contract','memory','planning'],
    steps: [
      '초보 NPC는 식비와 주거비를 감당하기 위해 채집 노동을 선택한다.',
      '도구를 구매하고 반복 작업으로 채집 숙련이 상승한다.',
      '광산 사고를 경험한 뒤 위험 선호가 낮아지고 운송업으로 직업을 바꾼다.',
      '신뢰를 쌓은 상단 NPC의 추천으로 길드에 가입한다.',
      '저축과 대출로 마차를 구매해 독립 운송 계약을 수주한다.'
    ]
  }
];

export const pillars = [
  ['규칙 대칭성', 'NPC와 플레이어가 가능한 한 같은 API, 비용, 위험을 사용한다.'],
  ['원인 기반 콘텐츠', '퀘스트·가격·전쟁·이주는 월드 상태의 문제에서 발생한다.'],
  ['정보 비대칭', 'NPC는 전지적이지 않으며 관측·소문·기억을 통해 세계를 이해한다.'],
  ['경제적 실재성', '상점 재고, 임금, 생산, 운송, 자본이 실제 상태로 존재한다.'],
  ['시뮬레이션 계층화', '모든 NPC를 매 Tick 정밀 계산하지 않고 중요도에 따라 LOD를 조절한다.'],
  ['복구 가능한 손실', '패배와 실패는 의미가 있지만 장기 플레이를 파괴하지 않는다.']
];