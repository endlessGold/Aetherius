const base = process.env.AETHERIUS_HTTP_BASE || 'http://localhost:3000/api';

async function post(path: string, body: any) {
  const res = await fetch(`${base}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  return res.json();
}

async function main() {
  const model = {
    modelType: 'linear',
    featureOrder: ['energy', 'hydration', 'biomass', 'w_survive', 'w_grow', 'w_explore', 'purpose_kind'],
    mean: [0, 0, 0, 0, 0, 0, 0],
    std: [1, 1, 1, 1, 1, 1, 1],
    weights: [0, 0, 0, 0, 0, 0, 0],
    bias: 0
  };

  const r1 = await post('/model/linear', model);

  const jsonl = JSON.stringify({ hello: 'dataset' }) + '\n';
  const r2 = await post('/dataset/backup', { jsonl, name: 'smoke.jsonl' });

  console.log(JSON.stringify({ model: r1, backup: r2 }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

