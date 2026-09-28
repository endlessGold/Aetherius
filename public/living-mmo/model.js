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

  { id: 'mind-system', category: 'mind', x: 690, y: 125, size: 'major', title: '목표·기억·의사결정', subtitle: 'LLM이 아니라 게임 규칙이 먼저', principle: 'AI는 목표를 해석하지만 실행은 제한된 게임 행동 API로 한다.', inputs: ['욕구', '기억', '관측', '성격'], outputs: ['계획', '행동 우선순위', '관계 변화'], rules: ['Utility/GOAP가 기본', 'LLM은 장기 목표·대화·설명 계층', '결정은 근거를 저장'], risks: ['LLN 비용', '비결정성', '설명 불가능한 행동'], metrics: ['결정당 비용', '행동 취소율', '설명 가능 비율'] },
  { id: 'needs', category: 'mind', x: 470, y: 24, title: '욕구·생존', subtitle: '식량, 안전, 소속, 성취, 자산', principle: '행동 동력은 퀘스트 스크립트가 아니라 결핍과 목표다.', inputs: ['현재 상태'], outputs: ['우선순위'], rules: ['욕구는 맥락에 따라 가중치 변화'], risks: ['모든 NPC가 비슷해짐'], metrics: ['목표 다양성'] },
  { id: 'memory', category: 'mind', x: 630, y: 24, title: '기억·지식', subtitle: '직접 본 사실과 소문을 구분', principle: 'NPC는 세계 전체를 알지 못한다.', inputs: ['관측', '대화', '문서'], outputs: ['신념', '소문', '계획'], rules: ['사실/추정/소문 출처 보존', '망각과 왜곡 허용'], risks: ['메모리 폭증'], metrics: ['지식 출처 추적률', '오정보 전파율'] },
  { id: 'personality', category: 'mind', x: 790, y: 24, title: '성격·가치관', subtitle: '위험 선호, 탐욕, 충성, 윤리', principle: '같은 상황에서도 다른 선택을 만든다.', inputs: ['성향', '경험'], outputs: ['행동 가중치'], rules: ['수치 하나로 선악을 표현하지 않음'], risks: ['캐릭터가 고정관념이 됨'], metrics: ['선택 분산'] },
  { id: 'planning', category: 'mind', x: 950, y: 24, title: '계획·행동 API', subtitle: 'move / buy / sell / fight / negotiate', principle: '자유로운 언어 모델 출력을 실제 명령으로 직접 실행하지 않는다.', inputs: ['목표', '가능 행동'], outputs: ['검증된 액션 큐'], rules: ['권한 검사', '비용 선차감/예약', '실패 시 재계획'], risks: ['계획 루프'], metrics: ['행동 성공률', '재계획 횟수'] },

  { id: 'world-system', category: 'world', x: 1080, y: 175, size: 'major', title: '세계·생태·자원', subtitle: '콘텐츠 공급도 세계 상태에서 발생', principle: '자원과 위험은 지역별로 생성·고갈·회복되며 경제의 원인이 된다.', inputs: ['기후', '지형', '생태', '채취'], outputs: ['자원량', '위험도', '이주 압력'], rules: ['자원은 무한 리젠이 아니라 재생 규칙', '지역 간 이동 비용 존재'], risks: ['자원 고갈로 서버가 망가짐'], metrics: ['지역별 자원 커버리지', '고갈 복구시간'] },
  { id: 'resources', category: 'world', x: 1190, y: 65, title: '자원·재생', subtitle: '광물, 목재, 식량, 마력', principle: '공급은 물리적 위치와 재생 조건을 가진다.', inputs: ['환경'], outputs: ['원재료'], rules: ['희소성은 스폰율이 아니라 총량과 회복으로 조절'], risks: ['독점'], metrics: ['자원 지니계수'] },
  { id: 'ecology', category: 'world', x: 1270, y: 135, title: '생태·몬스터', subtitle: '먹이, 번식, 영역, 포식', principle: '몬스터도 지역 경제와 안전에 영향을 준다.', inputs: ['먹이', '서식지'], outputs: ['개체수', '위험'], rules: ['개체수는 사냥은렩에 반응], risks: ['뭴록그막 없종'], metrics: ['개체수 변동성'] },
  { id: 'weather', category: 'world', x: 1285, y: 220, title: '기후·계절', subtitle: '생산성¯이돘·전투를 바꿜는 외작 변수', principle: '날씨는 시간효과가 아니라 생산과 위험의 입력	�[�]Έ����;("	�	�)�;%�I�K�]]Έ��"&;fjz��I�	�'m;a�z�g	�K�[\Έ��&";.(H:� :�{!,z��:��:��{!,H:��{(m	�K�\��Έ���:��;%�{�c	�KY]�X�Έ���,;f�;-�z��H;& {e�z��	�HK��Y�	��]�[	��]Y�ܞN�	��ܛ	��L�LN��K]N�	���z�!0��'m;a�	��X�]N�	��l:�:�.;&�;!�H;&�{'�K:�kz��I��[��\N�	��l:�;&`;'m:��;"�:�!;'m;)�;%�H:��{(':�o:��:��:����[�]Έ��)�:��	�	��d;a�I�K�]]Έ��&�;!�z�a	�	�(%z��;)�{%�	�K�[\Έ��)�{"�;(!;!��;-g;!�;fe	�K�\��Έ��'m:��{'m;)�:��;em;)�	�KY]�X�Έ��)�;%�H:�!:� :��{,*	�	�c�z��;'m:��;"�:�!	�HK���Y�	�X�ۛ�^K\�\�[I��]Y�ܞN�	�X�ۛ�^I��LKN�LL�^�N�	�XZ�܉�]N�	� �{ �;og:�/:�f0�{"�;'�I��X�]N�	�%a;'m;ag;'`:��z�"z��H; �;%�;'m;(�;eg:��	��[��\N�	Ӕ�; �{( ;'`; �{!,z�,:� ;%a:��:�o;"�;(';'�:��:�o:� ;)�; �;%�{,�:� :����[�]Έ��'�;&�	�	��n:��{'a	�	�'�:��	�	�(%z��	�K�]]Έ�� �{d�	�	�� :��I�	���;&�I�	���	�K�[\Έ�� �{ �;%�:�;'�z�){'�0��"�:�!0����:�k;ea;&�	�	�'�:��:� ;%�'/:�m;d�;("	�	�� :��{'`;(�:�.0��'�:��0���,:� ;%�:�&;'eK�\��Έ����{(':��z�-	�	���H:�&{'`��� ;"�;'�H;!(;($	�KY]�X�Έ���l:�:��I�	�� :��H:��:��{!,I�	�'�:��;f�;(!	�	���;'f;)�{)$z��	�HK��Y�	�X�܉��]Y�ܞN�	�X�ۛ�^I��L�KN��MK]N�	��n:��p�{'�:�"	��X�]N�	�)�{%�{'`;'o;'�:�;"&;&�;&`;%�:��	��[��\N�	Ӕ��; �z��:�o;'!;em:�n:��{'a;!(;`�{ef:��:�e:�;'`;(l:�m;'/:�g;'m:��{eg:����[�]Έ��"&z�*	�	��