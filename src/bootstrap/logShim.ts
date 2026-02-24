const originalWarn = console.warn.bind(console);

console.warn = (...args: unknown[]) => {
  const first = args[0];
  if (typeof first === 'string' && first.includes('TensorFlow.js in Node.js')) {
    const lang = (process.env.AETHERIUS_OUTPUT_LANG ?? '').toLowerCase();
    if (lang === 'ko') {
      console.log('🧠 시뮬레이션 두뇌 모듈이 초기화되었습니다.');
    } else {
      console.log('🧠 Simulation brain module initialized.');
    }
    return;
  }
  originalWarn(...(args as [any, ...any[]]));
};

