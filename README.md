# 📄 Desafio: Machine Learning (Entrega **14/10/2025 → 21/11/2025**)
---

## 🎯 Objetivo
Aplicar conceitos de **Machine Learning** e/ou **Reforço (RL)** em um projeto prático.

---

## Regras
- Tema livre, **desde que** use ML/RL (ex.: MDPs, Q-Learning, SARSA, supervis./não‑supervis., etc.).
- Entrega deve incluir:
  - **Código-fonte** completo.
  - **README.md** com: ideia, mudanças, como treinar/testar, bibliotecas, algoritmos, **cálculos**, dificuldades, **resultados com métricas/gráficos**.
- **Visual obrigatório**: gráficos/tabelas/prints mostrando evolução/treinamento/resultados.
- Pode ser pequeno. **Foco: raciocínio aplicado de ML.**

---

## 📚 Conteúdo mínimo
- Trade-off **exploração vs. aproveitamento** (exploration vs. exploitation).
- **Atualização dinâmica** de aprendizado (Q-Table ou equivalente).
- **Ajuste da taxa de exploração** (ex.: *epsilon decay*).
- **Recompensa e penalidade** (design de *reward*).
- **Visualização** de métricas/comportamento aprendido.

---

## 📦 Formato da entrega
- **Pasta do projeto** com:
  - Código-fonte.
  - `README.md` organizado:
    - Introdução.
    - Tecnologias/bibliotecas.
    - Algoritmos aplicados.
    - Cálculos/fórmulas.
    - Como executar (treinar/testar).
    - Resultados e comentários finais.
- **Nome do projeto**:
  ```bash
  NomeDoMeuProjeto-<sua_matricula>-<seu_nome_ou_tema>
  ```

---

## 🗓️ Prazos (corrigidos)
- **Janela oficial de entrega**: **14/10/2025 → 21/11/2025 (sex, 23:59)**.

### Cronograma
- **21/10**: repositório + **commit INIT** com README rascunho e cabeçalhos nos arquivos.
- **23/10**: tema definido + objetivos/algoritmos.
- **28/10**: baseline rodando; métricas definidas.
- **04/11**: experimento 1 (ε‑greedy) + gráficos iniciais.
- **11/11**: experimento 2 (tuning/ablação) + tabelas. (INICIO DAS APRESENTAÇÕES)
- **18/11**: *code freeze* + README final. (INICIO DAS APRESENTAÇÕES)
- **Até 21/11 23:59**: envio do link (GitHub/GitLab ou ZIP no Drive). (INICIO DAS APRESENTAÇÕES)

---

## 🛠️ Commit inicial (obrigatório)
Inclui **configuração inicial** e breve descrição da ideia no `README.md`.

```bash
git init
git add .
git commit -m "ADS-init: <sua_matricula> ML"
git branch -M main
git remote add origin <URL_DO_REPO>
git push -u origin main
```

### Cabeçalho padrão em **todos os arquivos**
```py
"""
Nome do arquivo: <ex.: train_model.py>
Data de criação: 21/10/2025
Autor: <Seu Nome>
Matrícula: <Sua Matrícula>

Descrição:
<objetivo do arquivo>
Funcionalidades:
- <ponto 1>
- <ponto 2>
"""
```

---

## 🧱 Estrutura sugerida
```text
.
├── src/
│   ├── envs/              # ambientes/MDPs
│   ├── agents/            # QLearning/SARSA/modelos
│   ├── utils/             # métricas, plots, seed
│   ├── train.py           # treino do agente/modelo
│   └── eval.py            # avaliação e geração de gráficos
├── experiments/
│   ├── configs/           # hiperparâmetros (YAML/JSON)
│   └── runs/              # logs, checkpoints, métricas
├── results/               # figuras/tabelas finais
├── requirements.txt
└── README.md
```

---

## ▶️ Como executar
### 1) Ambiente
```bash
python -m venv .venv
# Windows: .venv\Scripts\activate
# Linux/macOS:
source .venv/bin/activate
pip install -r requirements.txt
```

### 2) Treinar
```bash
python -m src.train --algo qlearning --episodes 2000 --env GridWorld-v0   --epsilon_start 1.0 --epsilon_min 0.05 --epsilon_decay 0.995   --alpha 0.1 --gamma 0.99 --seed 42 --out experiments/runs/run1
```

### 3) Avaliar e gerar gráficos
```bash
python -m src.eval --run experiments/runs/run1 --episodes 200 --render false   --export results/
```

> **Reprodutibilidade**: fixe *seed*, salve hiperparâmetros e versões de libs.

---

## 📊 Métricas e visualizações
- Recompensa média/episódio (curva).
- Taxa de sucesso/episódio.
- Evolução de **ε (epsilon)** ao longo do treino.
- Heatmap da **Q‑Table** (ou curvas de perda/acc se supervisionado).
- Tabelas comparando ablações (ex.: *alpha*, *gamma*, *epsilon_decay*).

---

## 🧮 Algoritmos e fórmulas (exemplo Q‑Learning)
Atualização Q:
\[
Q(s,a) \leftarrow Q(s,a) + \alpha \big[r + \gamma \max_{a'} Q(s',a') - Q(s,a)\big]
\]

Política ε‑greedy:
- Com prob. **ε**: escolhe ação aleatória (exploração).
- Com prob. **1‑ε**: escolhe \(\arg\max_a Q(s,a)\) (aproveitamento).
- **Decaimento**: \(\epsilon_t = \max(\epsilon_{\min}, \epsilon_0 \cdot d^t)\).

> Se usar outro algoritmo (SARSA, DQN, supervisão), documente a fórmula equivalente.

---

## ✅ Checklist de entrega
- [ ] Código completo e **executável**.
- [ ] **README** com ideia, passos de treino/teste, libs, algoritmos e **fórmulas**.
- [ ] **Gráficos/prints** no `results/`.
- [ ] Cabeçalho padrão em **todos os arquivos**.
- [ ] `requirements.txt` com versões.
- [ ] Link do repositório enviado **até 21/11/2025 23:59**.

---

## 🔍 Integridade acadêmica
- Entregas sem entendimento claro podem ser **anuladas**.
- Cópia/plágio serão **zerados**.
- Uso de IA sem **adaptação e explicação** pode ser **desconsiderado**.
- Reaproveitamento de trabalhos anteriores: só com **aviso** e **adaptação**.

---

## 📌 Observações finais
- Mantenha o histórico de commits limpo.
- Documente **dificuldades** e **decisões** de design de *reward*/hiperparâmetros.
- Priorize clareza sobre tamanho do projeto.
