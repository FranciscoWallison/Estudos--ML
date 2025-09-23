import React, { useEffect, useMemo, useRef, useState } from "react";

AprendizagemReforco/exemplos// Visual, multiagente, Q-learning no grid.
// Vários “carros” (agentes) aprendem a chegar no objetivo sem bater em paredes.
// Controles no topo: rodar/pausar, nº de carros, hiperparâmetros e edição do mapa.

// ======= Util =======
function randInt(n) { return Math.floor(Math.random() * n); }
function clamp(x, a, b) { return Math.max(a, Math.min(b, x)); }

// Índice linear p/ Q-table
function idx(r, c, a, H, W) { return ((r * W) + c) * 4 + a; }

const ACTIONS = [
  { dr: -1, dc: 0 }, // up
  { dr: 1, dc: 0 },  // down
  { dr: 0, dc: -1 }, // left
  { dr: 0, dc: 1 },  // right
];

// ======= Componente =======
export default function CarrosQLearningGrid() {
  // ----- Grid / Ambiente -----
  const [H, setH] = useState(12);
  const [W, setW] = useState(20);
  const [start, setStart] = useState({ r: 11, c: 0 });
  const [goal, setGoal] = useState({ r: 0, c: 19 });
  const [walls, setWalls] = useState(() => new Set([
    // um pequeno labirinto padrão
    ...[2,3,4,5].map(c => `1,${c}`),
    ...[1,2,3].map(r => `${r},8`),
    ...[6,7,8].map(c => `5,${c}`),
    ...[3,4,5,6,7].map(c => `8,${c}`),
    ...[2,3,4].map(r => `${r},14`),
  ]));

  // ----- Parâmetros de RL -----
  const [numAgents, setNumAgents] = useState(12);
  const [alpha, setAlpha] = useState(0.1);   // taxa de aprendizado
  const [gamma, setGamma] = useState(0.99);  // desconto
  const [epsilon, setEpsilon] = useState(0.2); // exploração
  const [stepPenalty, setStepPenalty] = useState(-1);
  const [wallPenalty, setWallPenalty] = useState(-5);
  const [goalReward, setGoalReward] = useState(50);
  const [maxStepsPerEpisode, setMaxStepsPerEpisode] = useState(200);

  const [running, setRunning] = useState(true);
  const [stepsPerTick, setStepsPerTick] = useState(50);
  const [editMode, setEditMode] = useState(false); // editar paredes
  const [editTool, setEditTool] = useState("wall"); // wall | start | goal
  const [shareQ, setShareQ] = useState(false); // todos compartilham uma Q-table

  // Desenho
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [dpi, setDpi] = useState(1);

  // Estatísticas
  const [episodes, setEpisodes] = useState(0);
  const [successes, setSuccesses] = useState(0);
  const [avgSteps, setAvgSteps] = useState(0);

  // ----- Estado dos agentes & Q-tables -----
  const agentsRef = useRef([]); // { r, c, steps }
  const qTablesRef = useRef([]); // cada entrada: Float32Array(H*W*4)

  // Re-init ambiente quando tamanho muda
  useEffect(() => {
    resetAll(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [H, W, start.r, start.c, goal.r, goal.c, numAgents, shareQ]);

  function makeQTable() {
    return new Float32Array(H * W * 4); // inicial 0
  }

  function resetAgentsPositions() {
    agentsRef.current = Array.from({ length: numAgents }, () => ({ r: start.r, c: start.c, steps: 0 }));
  }

  function resetQ() {
    if (shareQ) {
      qTablesRef.current = [makeQTable()];
    } else {
      qTablesRef.current = Array.from({ length: numAgents }, () => makeQTable());
    }
  }

  function resetStats() {
    setEpisodes(0);
    setSuccesses(0);
    setAvgSteps(0);
  }

  function resetAll(keepWalls = true) {
    if (!keepWalls) setWalls(new Set());
    resetQ();
    resetAgentsPositions();
    resetStats();
  }

  // ----- Dinâmica do ambiente -----
  const wallsHas = (r, c) => walls.has(`${r},${c}`);
  function stepEnv(r, c, a) {
    const { dr, dc } = ACTIONS[a];
    const nr = r + dr;
    const nc = c + dc;

    // bateu em borda ou parede ⇒ não sai do lugar, penaliza
    if (nr < 0 || nr >= H || nc < 0 || nc >= W || wallsHas(nr, nc)) {
      return { nr: r, nc: c, reward: wallPenalty, done: false };
    }

    // chegou no goal
    if (nr === goal.r && nc === goal.c) {
      return { nr, nc, reward: goalReward, done: true };
    }

    // movimento normal com custo de passo
    return { nr, nc, reward: stepPenalty, done: false };
  }

  function maxQ(Q, r, c) {
    const base = (r * W + c) * 4;
    let m = Q[base];
    for (let a = 1; a < 4; a++) m = Math.max(m, Q[base + a]);
    return m;
  }

  function argmaxQ(Q, r, c) {
    const base = (r * W + c) * 4;
    let bestA = 0, bestV = Q[base];
    for (let a = 1; a < 4; a++) {
      const v = Q[base + a];
      if (v > bestV) { bestV = v; bestA = a; }
    }
    return bestA;
  }

  // ----- Loop de treino/render -----
  useEffect(() => {
    let animId = null;
    let lastT = performance.now();

    function tick() {
      const now = performance.now();
      const dt = now - lastT;
      lastT = now;

      if (running) {
        // vários passos por frame p/ acelerar
        for (let s = 0; s < stepsPerTick; s++) {
          trainStep();
        }
      }

      draw();
      animId = requestAnimationFrame(tick);
    }

    animId = requestAnimationFrame(tick);
    return () => { if (animId) cancelAnimationFrame(animId); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running, stepsPerTick, alpha, gamma, epsilon, stepPenalty, wallPenalty, goalReward, H, W]);

  function trainStep() {
    const A = agentsRef.current;
    if (!A.length) return;

    // (opcional) embaralhar ordem dos agentes p/ evitar viés
    for (let i = A.length - 1; i > 0; i--) {
      const j = randInt(i + 1);
      const tmp = A[i]; A[i] = A[j]; A[j] = tmp;
    }

    for (let i = 0; i < A.length; i++) {
      const ag = A[i];
      const Q = shareQ ? qTablesRef.current[0] : qTablesRef.current[i];

      // escolhe ação (epsilon-greedy)
      let a;
      if (Math.random() < epsilon) a = randInt(4);
      else a = argmaxQ(Q, ag.r, ag.c);

      const { nr, nc, reward, done } = stepEnv(ag.r, ag.c, a);

      // Q-learning update
      const sIdx = idx(ag.r, ag.c, a, H, W);
      const target = reward + (done ? 0 : gamma * maxQ(Q, nr, nc));
      Q[sIdx] = Q[sIdx] + alpha * (target - Q[sIdx]);

      // avança agente
      ag.r = nr; ag.c = nc; ag.steps += 1;

      // fim do episódio
      if (done || ag.steps >= maxStepsPerEpisode) {
        setEpisodes(e => e + 1);
        if (done) setSuccesses(s => s + 1);
        setAvgSteps(prev => {
          // média móvel simples
          const n = Math.max(1, episodes + 1);
          return prev + ((ag.steps - prev) / n);
        });
        // reset posição
        ag.r = start.r; ag.c = start.c; ag.steps = 0;
      }
    }
  }

  // ----- Desenho do grid/cars -----
  function draw() {
    const canvas = canvasRef.current;
    const parent = containerRef.current;
    if (!canvas || !parent) return;

    // ajustar resolução/dpi
    const rect = parent.getBoundingClientRect();
    const margin = 8;
    const cw = Math.max(300, Math.min(rect.width - margin * 2, 900));
    const ch = Math.round(cw * (H / W));
    const ratio = window.devicePixelRatio || 1;

    if (canvas.width !== Math.floor(cw * ratio) || canvas.height !== Math.floor(ch * ratio)) {
      canvas.width = Math.floor(cw * ratio);
      canvas.height = Math.floor(ch * ratio);
      canvas.style.width = `${cw}px`;
      canvas.style.height = `${ch}px`;
      setDpi(ratio);
    }

    const ctx = canvas.getContext("2d");
    ctx.save();
    ctx.scale(dpi, dpi);
    ctx.clearRect(0, 0, canvas.width / dpi, canvas.height / dpi);

    const tileW = canvas.clientWidth / W;
    const tileH = canvas.clientHeight / H;

    // grid fundo
    ctx.fillStyle = "#0b1020";
    ctx.fillRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    // células
    for (let r = 0; r < H; r++) {
      for (let c = 0; c < W; c++) {
        const x = c * tileW; const y = r * tileH;
        // paredes
        if (wallsHas(r, c)) {
          ctx.fillStyle = "#1f2937"; // cinza escuro
          roundRect(ctx, x + 2, y + 2, tileW - 4, tileH - 4, 6, true, false);
        }
      }
    }

    // start / goal
    drawCell(ctx, start.c * tileW, start.r * tileH, tileW, tileH, "#2563eb", "S");
    drawCell(ctx, goal.c * tileW, goal.r * tileH, tileW, tileH, "#16a34a", "G");

    // carros
    const A = agentsRef.current;
    for (let i = 0; i < A.length; i++) {
      const ag = A[i];
      const x = (ag.c + 0.5) * tileW;
      const y = (ag.r + 0.5) * tileH;
      const radius = Math.min(tileW, tileH) * 0.28;
      const hue = (i * 47) % 360; // paleta simples
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fillStyle = `hsl(${hue}, 85%, 60%)`;
      ctx.fill();
      // direção (triângulo pequeno)
      ctx.beginPath();
      ctx.moveTo(x + radius * 0.9, y);
      ctx.lineTo(x + radius * 0.3, y - radius * 0.4);
      ctx.lineTo(x + radius * 0.3, y + radius * 0.4);
      ctx.closePath();
      ctx.fillStyle = "rgba(0,0,0,0.35)";
      ctx.fill();
    }

    // grid lines suaves
    ctx.strokeStyle = "rgba(255,255,255,0.06)";
    ctx.lineWidth = 1;
    for (let r = 0; r <= H; r++) {
      const y = r * tileH;
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(canvas.clientWidth, y); ctx.stroke();
    }
    for (let c = 0; c <= W; c++) {
      const x = c * tileW;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, canvas.clientHeight); ctx.stroke();
    }

    ctx.restore();
  }

  function drawCell(ctx, x, y, w, h, color, label) {
    ctx.fillStyle = color;
    roundRect(ctx, x + 2, y + 2, w - 4, h - 4, 8, true, false);
    ctx.fillStyle = "#ffffff";
    ctx.font = `${Math.floor(Math.min(w, h) * 0.45)}px ui-sans-serif`;
    ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillText(label, x + w / 2, y + h / 2);
  }

  function roundRect(ctx, x, y, w, h, r, fill, stroke) {
    if (w < 2 * r) r = w / 2;
    if (h < 2 * r) r = h / 2;
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) ctx.fill();
    if (stroke) ctx.stroke();
  }

  // ----- Interação: editar mapa -----
  function onCanvasClick(e) {
    if (!editMode) return;
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const tileW = canvas.clientWidth / W;
    const tileH = canvas.clientHeight / H;
    const c = clamp(Math.floor(x / tileW), 0, W - 1);
    const r = clamp(Math.floor(y / tileH), 0, H - 1);

    if (editTool === "wall") {
      const key = `${r},${c}`;
      setWalls(prev => {
        const next = new Set(prev);
        if ((r === start.r && c === start.c) || (r === goal.r && c === goal.c)) return next;
        if (next.has(key)) next.delete(key); else next.add(key);
        return next;
      });
    } else if (editTool === "start") {
      if (!wallsHas(r, c) && !(r === goal.r && c === goal.c)) {
        setStart({ r, c });
        resetAgentsPositions();
      }
    } else if (editTool === "goal") {
      if (!wallsHas(r, c) && !(r === start.r && c === start.c)) {
        setGoal({ r, c });
      }
    }
  }

  // Resize: redesenhar suave
  useEffect(() => {
    function onResize() { draw(); }
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ======= UI =======
  return (
    <div className="w-full flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <button onClick={() => setRunning(v => !v)} className={`px-3 py-1.5 rounded-2xl text-white ${running ? "bg-rose-600" : "bg-emerald-600"}`}>
          {running ? "Pausar" : "Rodar"}
        </button>
        <button onClick={() => { resetQ(); resetAgentsPositions(); resetStats(); }} className="px-3 py-1.5 rounded-2xl bg-indigo-600 text-white">Reset Q</button>
        <button onClick={() => resetAll(false)} className="px-3 py-1.5 rounded-2xl bg-slate-700 text-white">Limpar mapa</button>
        <label className="flex items-center gap-2 ml-3">
          <input type="checkbox" checked={editMode} onChange={e => setEditMode(e.target.checked)} />
          <span>Editar mapa</span>
        </label>
        {editMode && (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1"><input type="radio" name="tool" checked={editTool === "wall"} onChange={() => setEditTool("wall")} />Parede</label>
            <label className="flex items-center gap-1"><input type="radio" name="tool" checked={editTool === "start"} onChange={() => setEditTool("start")} />Start</label>
            <label className="flex items-center gap-1"><input type="radio" name="tool" checked={editTool === "goal"} onChange={() => setEditTool("goal")} />Goal</label>
          </div>
        )}
        <label className="flex items-center gap-2 ml-3">
          <input type="checkbox" checked={shareQ} onChange={e => { setShareQ(e.target.checked); }} />
          <span>Q compartilhada</span>
        </label>
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800">
          <div ref={containerRef} className="w-full">
            <canvas ref={canvasRef} onClick={onCanvasClick} className={`w-full rounded-xl border ${editMode ? "cursor-crosshair" : "cursor-default"} border-slate-800`} />
          </div>
        </div>

        <div className="p-3 rounded-2xl bg-slate-900/70 border border-slate-800 flex flex-col gap-3">
          <h3 className="text-slate-100 font-semibold">Parâmetros</h3>

          <Slider label={`Carros: ${numAgents}`} min={1} max={50} step={1} value={numAgents} onChange={setNumAgents} />
          <Slider label={`Steps/tick: ${stepsPerTick}`} min={1} max={400} step={1} value={stepsPerTick} onChange={setStepsPerTick} />

          <Slider label={`Alpha (aprend.): ${alpha.toFixed(2)}`} min={0.01} max={1} step={0.01} value={alpha} onChange={setAlpha} />
          <Slider label={`Gamma (desconto): ${gamma.toFixed(2)}`} min={0} max={0.999} step={0.001} value={gamma} onChange={setGamma} />
          <Slider label={`Epsilon (exploração): ${epsilon.toFixed(2)}`} min={0} max={1} step={0.01} value={epsilon} onChange={setEpsilon} />

          <Slider label={`Recompensa objetivo: ${goalReward}`} min={1} max={200} step={1} value={goalReward} onChange={setGoalReward} />
          <Slider label={`Penalidade parede: ${wallPenalty}`} min={-50} max={0} step={1} value={wallPenalty} onChange={setWallPenalty} />
          <Slider label={`Custo por passo: ${stepPenalty}`} min={-10} max={0} step={1} value={stepPenalty} onChange={setStepPenalty} />
          <Slider label={`Max passos/episódio: ${maxStepsPerEpisode}`} min={10} max={1000} step={10} value={maxStepsPerEpisode} onChange={setMaxStepsPerEpisode} />

          <div className="grid grid-cols-2 gap-2">
            <MiniField label="Altura (H)">
              <input type="number" className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700" value={H}
                     onChange={e => setH(clamp(parseInt(e.target.value||"0"), 3, 60))} />
            </MiniField>
            <MiniField label="Largura (W)">
              <input type="number" className="w-full px-2 py-1 rounded bg-slate-800 border border-slate-700" value={W}
                     onChange={e => setW(clamp(parseInt(e.target.value||"0"), 3, 120))} />
            </MiniField>
          </div>

          <div className="text-sm text-slate-300 grid grid-cols-2 gap-2">
            <Stat label="Episódios" value={episodes} />
            <Stat label="Sucessos" value={successes} />
            <Stat label="Taxa de sucesso" value={`${(episodes>0? (100*successes/episodes):0).toFixed(1)}%`} />
            <Stat label="Média de passos" value={avgSteps.toFixed(1)} />
          </div>

          <p className="text-slate-400 text-xs">Dica: ative "Q compartilhada" p/ acelerar o aprendizado (todos os carros atualizam a mesma Q-table).</p>
        </div>
      </div>
    </div>
  );
}

function Slider({ label, min, max, step, value, onChange }) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-44 text-slate-200 text-sm">{label}</div>
      <input type="range" min={min} max={max} step={step} value={value}
             onChange={e => onChange(Number(e.target.value))}
             className="flex-1 accent-indigo-500" />
      <input type="number" value={value} onChange={e => onChange(Number(e.target.value))}
             className="w-20 px-2 py-1 rounded bg-slate-800 border border-slate-700 text-slate-100" />
    </div>
  );
}

function MiniField({ label, children }) {
  return (
    <label className="text-slate-300 text-sm flex flex-col gap-1">
      <span>{label}</span>
      {children}
    </label>
  );
}

function Stat({ label, value }) {
  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-xl p-2">
      <div className="text-slate-400 text-xs">{label}</div>
      <div className="text-slate-100 text-lg font-semibold">{value}</div>
    </div>
  );
}
