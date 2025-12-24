const STORAGE_KEY = "zc_state_v6";

const Roles = {
  COALIZAO: "COALIZAO",
  ORDEM: "ORDEM",
  REGENTE: "REGENTE",
};

const Cards = {
  ACORDO: "ACORDO",
  DECRETO: "DECRETO",
};

const Phase = {
  HOME: "HOME",
  PLAYERS: "PLAYERS",
  POWERS_GUIDE: "POWERS_GUIDE",
  DEAL: "DEAL",
  PASS: "PASS",
  ROLE: "ROLE",
  BOARD: "BOARD",

  ROUND_START: "ROUND_START",
  PICK_SUP: "PICK_SUP",
  DEBATE: "DEBATE",

  VOTE: "VOTE",
  VOTE_RESULT: "VOTE_RESULT",

  LEG_SUP: "LEG_SUP",
  LEG_DEL: "LEG_DEL",

  CRISIS_STATE: "CRISIS_STATE",

  POWER_INFO: "POWER_INFO",
  POWER_AUDIT: "POWER_AUDIT",
  POWER_KILL: "POWER_KILL",

  GAME_OVER: "GAME_OVER",
};

const PendingPower = {
  AUDIT: "AUDIT",
  KILL: "KILL",
};

const EndPages = {
  END_COALIZAO: {
    title: "VITÓRIA — COALIZÃO",
    status: "STATUS FINAL: PARALISIA NEGOCIADA",
    lines: [
      { text: "O poder não se concentrou." },
      { text: "Também não avançou." },
      { text: "Cada nomeação exigiu concessões." },
      { text: "Cada acordo gerou vigilância." },
      { text: "O consenso virou desgaste contínuo." },
      { text: "Nenhuma autoridade se sustentou." },
      { text: "Nenhuma ruptura foi permitida." },
      { text: "A crise foi administrada, não resolvida." },
      {
        reactive: [{ when: { gte: ["vetos", 5] }, text: "O plural resistiu a {vetos} vetos sucessivos." }],
        text: "O plural foi preservado.",
      },
      {
        reactive: [{ when: { gte: ["rodadas", 8] }, text: "A eficiência se perdeu em {rodadas} ciclos de impasse." }],
        text: "A eficiência foi sacrificada.",
      },
      {
        reactive: [{ when: { gte: ["crises", 1] }, text: "O Estado operou sob crise recorrente." }],
        text: "O Estado segue em disputa constante.",
      },
      { text: "O controle permanece suspenso." },
    ],
  },

  END_ORDEM: {
    title: "VITÓRIA — ORDEM",
    status: "STATUS FINAL: ESTABILIDADE FORÇADA",
    lines: [
      { text: "O sistema voltou a operar." },
      { text: "A confiança não retornou." },
      { text: "As nomeações avançaram." },
      {
        reactive: [{ when: { gte: ["vetos", 3] }, text: "Após {vetos} vetos, o dissenso foi neutralizado." }],
        text: "O dissenso foi tratado como falha.",
      },
      {
        reactive: [{ when: { lte: ["rodadas", 4] }, text: "O debate foi encurtado para garantir fluidez." }],
        text: "O debate virou atraso.",
      },
      {
        reactive: [{ when: { gte: ["crises", 1] }, text: "A divergência foi associada à instabilidade." }],
        text: "A divergência virou risco.",
      },
      { text: "A obediência virou critério." },
      { text: "As instituições funcionam." },
      { text: "Precisamente." },
      { text: "Mecanicamente." },
      {
        reactive: [{ when: { gte: ["decretos", 1] }, text: "Nada saiu do procedimento." }],
        text: "Nada saiu do lugar.",
      },
      { text: "Exceto as pessoas." },
    ],
  },

  END_REGENTE: {
    title: "VITÓRIA — REGENTE",
    status: "STATUS FINAL: ORDEM IRREVERSÍVEL",
    lines: [
      { text: "A instabilidade foi encerrada." },
      { text: "Não resolvida." },
      { text: "Encerrada." },
      {
        reactive: [{ when: { gte: ["rodadas", 6] }, text: "O sistema se mostrou incapaz de decidir." }],
        text: "O sistema falhou em decidir.",
      },
      {
        reactive: [{ when: { gte: ["crises", 2] }, text: "Após {crises} crises, o Decreto foi inevitável." }],
        text: "O Decreto assumiu.",
      },
      { text: "A exceção virou método." },
      {
        reactive: [{ when: { gte: ["decretos", 2] }, text: "A urgência passou a ser permanente." }],
        text: "A urgência virou regra.",
      },
      { text: "Não há vetos." },
      { text: "Não há retorno." },
      {
        reactive: [{ when: { lte: ["rodadas", 3] }, text: "A autoridade foi consolidada rapidamente." }],
        text: "A autoridade é única.",
      },
      { text: "O Estado funciona sem ouvir." },
      { text: "O controle é absoluto." },
    ],
  },
};

const CivilTitles = [
  "REVISÃO DO TOQUE DE RECOLHER",
  "ANISTIA LIMITADA DE ZONA",
  "COMISSÃO DE TRANSPARÊNCIA",
  "GARANTIA DE TRÂNSITO CIVIL",
  "AUDIÊNCIA PÚBLICA CONTROLADA",
  "PROTEÇÃO DE SERVIÇOS ESSENCIAIS",
  "CORREDOR HUMANITÁRIO",
  "REGISTRO DE ABUSOS",
];

const DominioTitles = [
  "LEI DE VIGILÂNCIA AMPLIADA",
  "DECRETO DE BUSCA E APREENSÃO",
  "CENSURA OPERACIONAL",
  "CADASTRO COMPULSÓRIO",
  "TRIBUNAL DE EXCEÇÃO",
  "OPERAÇÃO DE CONTAINMENT",
  "SUSPENSÃO DE GARANTIAS",
  "RESTRIÇÃO DE CIRCULAÇÃO",
];

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function uid(){
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  }catch{
    return null;
  }
}

function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(S));
}

function newProtocol(){
  const year = new Date().getFullYear();
  const rand = String(Math.floor(100000 + Math.random() * 900000));
  return `ZC-${year}-${rand}`;
}

function roleCounts(n){
  if (n === 5) return { coalizao: 3, ordem: 1, regente: 1 };
  if (n === 6) return { coalizao: 4, ordem: 1, regente: 1 };
  return { coalizao: 4, ordem: 2, regente: 1 };
}

function buildDeck(){
  const deck = [
    ...Array(6).fill(Cards.ACORDO),
    ...Array(11).fill(Cards.DECRETO),
  ];
  return shuffle(deck);
}

function freshState(){
  return {
    phase: Phase.HOME,
    protocol: newProtocol(),

    playersDraft: ["", "", "", "", ""],
    players: [],
    passIndex: 0,

    delegadoIndex: 0,
    supervisorIndex: null,
    supervisorPrevIndex: null,

    rodada: 1,
    acordos: 0,
    decretos: 0,

    crise: 0,
    totalVetos: 0,
    totalCrises: 0,

    votes: {},
    voteOrder: [],
    voteCursor: 0,

    deck: buildDeck(),
    discard: [],

    hand3: null,
    hand2: null,
    supSelectedIdx: [],
    delChosenIdx: null,

    revealProjects: false,

    pendingPower: null,
    powerJustUnlocked: null,
    powerOwnerIndex: null,

    directNominationActive: false,
    directNominationNext: false,

    lastPolicy: null,
    lastOutcomeText: null,

    lastVoteYes: 0,
    lastVoteNo: 0,
    lastVoteApproved: null,

    endPageId: null,
    winner: null,
    winReason: null,
  };
}

let S = load() || freshState();

const root = document.getElementById("root");
const btnReset = document.getElementById("btnReset");

btnReset.addEventListener("click", () => {
  if (confirm("Reiniciar e apagar a sessão atual?")){
    localStorage.removeItem(STORAGE_KEY);
    S = freshState();
    render();
  }
});

function setHeader(){
  const p = document.getElementById("protocolText");
  const d = document.getElementById("dateText");
  if (p) p.textContent = `PROTOCOLO: ${S.protocol || "—"}`;

  if (d){
    const now = new Date();
    const dd = String(now.getDate()).padStart(2,"0");
    const mm = String(now.getMonth()+1).padStart(2,"0");
    const yyyy = now.getFullYear();
    d.textContent = `DATA: ${dd}/${mm}/${yyyy}`;
  }
}

function setPhase(phase){
  S.phase = phase;
  save();
  render();
}

function alivePlayers(){
  return S.players.filter(p => p.alive);
}

function nextAliveIndex(fromIdx){
  let idx = fromIdx;
  for (let i = 0; i < S.players.length; i++){
    idx = (idx + 1) % S.players.length;
    if (S.players[idx].alive) return idx;
  }
  return fromIdx;
}

function drawOne(){
  if (S.deck.length === 0){
    S.deck = shuffle(S.discard);
    S.discard = [];
  }
  return S.deck.pop();
}

function titleForCardType(type){
  if (type === Cards.ACORDO) return CivilTitles[Math.floor(Math.random() * CivilTitles.length)];
  return DominioTitles[Math.floor(Math.random() * DominioTitles.length)];
}

function drawPolicy(){
  const type = drawOne();
  return { type, title: titleForCardType(type) };
}

function drawPolicies(n){
  const out = [];
  for (let i = 0; i < n; i++) out.push(drawPolicy());
  return out;
}

function escape(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function roleCountsText(){
  const n = S.players.length;
  const rc = roleCounts(n);
  return `Coalizão: ${rc.coalizao} · Ordem: ${rc.ordem} · Regente: 1`;
}

function kpiHTML(){
  const pips = (count, total, cls) => {
    let out = "";
    for (let i = 0; i < total; i++){
      out += `<span class="pip ${i < count ? cls : ""}"></span>`;
    }
    return out;
  };

  return `
    <div class="kpi">
      <div class="badge"><span class="dot ok"></span> Acordos: <b>${S.acordos}/5</b></div>
      <div class="badge"><span class="dot bad"></span> Decretos: <b>${S.decretos}/6</b></div>
      <div class="badge"><span class="dot"></span> Vetos: <b>${S.crise}/3</b></div>
      <div class="badge"><span class="dot"></span> Rodada: <b>${S.rodada}</b></div>
    </div>

    <div class="formblock">
      <div class="label">TABULEIRO</div>
      <div class="value">Acordos</div>
      <div class="trackline">${pips(S.acordos, 5, "ok")}</div>

      <div class="value">Decretos</div>
      <div class="trackline">${pips(S.decretos, 6, "bad")}</div>

      <div class="value">Vetos</div>
      <div class="trackline">${pips(S.crise, 3, "bad")}</div>
    </div>
  `;
}

function decreeAuditThreshold(){
  return (S.players.length >= 7) ? 2 : 3;
}

function powersGuideText(){
  const n = S.players.length;
  const auditN = decreeAuditThreshold();

  const registro =
`A sessão foi validada.
Os nomes foram inseridos.
A distribuição dos papéis será silenciosa.

Antes da passagem do dispositivo, fica registrado:
a ORDEM não depende apenas de votos.
Ela acumula instrumentos.
Cada Decreto amplia o alcance do controle.`;

  const audit =
`AUDITORIA ADMINISTRATIVA
Desbloqueio: ${auditN}º Decreto.
Execução: imediatamente após a promulgação do Decreto.
Apenas o Delegado Central acessa o resultado.
A leitura retorna: COALIZÃO ou ORDEM.
O Regente é registrado como ORDEM.`;

  const kill =
`INTERVENÇÃO DIRETA
Desbloqueio: 3º Decreto.
Execução: imediatamente após a promulgação.
A decisão é exclusiva do Delegado Central.
Um participante ativo é removido do processo.
A lealdade não é revelada ao grupo.
Se o Regente for removido, a Coalizão vence imediatamente.`;

  const direct =
`NOMEAÇÃO DIRETA
Ativação: 4º Decreto.
A indicação de Supervisor deixa de ser submetida a veto.
Não há votação.
O Governo assume.
O processo legislativo prossegue.`;

  const nota =
`Quando uma função é desbloqueada,
o sistema apresenta uma tela própria.

O debate ocorre fora do registro.
Aqui, apenas se confirma o que foi aplicado.`;

  const decretos = (n < 7) ? `${audit}\n\n${direct}` : `${audit}\n\n${kill}\n\n${direct}`;

  return { registro, decretos, nota };
}

function unlockPowerIfAnyAppliedToOwner(ownerIndex){
  S.powerJustUnlocked = null;
  S.powerOwnerIndex = null;

  const n = S.players.length;
  const d = S.decretos;

  if (d >= 4 && !S.directNominationActive) S.directNominationNext = true;

  if (n < 7){
    if (d === 3) S.powerJustUnlocked = PendingPower.AUDIT;
  }else{
    if (d === 2) S.powerJustUnlocked = PendingPower.AUDIT;
    if (d === 3) S.powerJustUnlocked = PendingPower.KILL;
  }

  if (S.powerJustUnlocked){
    S.powerOwnerIndex = ownerIndex;
    S.pendingPower = S.powerJustUnlocked;
    S.phase = Phase.POWER_INFO;
  }
}

function maybeActivateDirectNominationForCurrentCycle(){
  if (S.directNominationNext){
    S.directNominationActive = true;
    S.directNominationNext = false;
  }
}

function setGameOver(pageId){
  S.endPageId = pageId;
  S.phase = Phase.GAME_OVER;
  save();
}

function checkImmediateWinAfterPolicy(){
  if (S.acordos >= 5){
    setGameOver("END_COALIZAO");
    return true;
  }
  if (S.decretos >= 6){
    setGameOver("END_ORDEM");
    return true;
  }
  return false;
}

function checkRegenteWinConditionAfterGovConfirm(){
  if (S.decretos >= 3 && S.supervisorIndex != null){
    const sup = S.players[S.supervisorIndex];
    if (sup && sup.role === Roles.REGENTE){
      setGameOver("END_REGENTE");
      return true;
    }
  }
  return false;
}

function enactPolicy(policy, auto=false, powerOwnerIndex=null){
  S.lastPolicy = policy?.type || null;

  if (policy.type === Cards.ACORDO) S.acordos += 1;
  else S.decretos += 1;

  S.lastOutcomeText = auto
    ? "Crise Administrativa aplicada. Uma carta entrou em vigor automaticamente. O contador foi reiniciado."
    : "Registro atualizado. O controle prossegue.";

  if (checkImmediateWinAfterPolicy()) return;

  if (policy.type === Cards.DECRETO){
    const owner = (powerOwnerIndex == null) ? S.delegadoIndex : powerOwnerIndex;
    unlockPowerIfAnyAppliedToOwner(owner);
  }

  save();
}

function applyCrisisAutoPolicy(){
  const policy = drawPolicy();
  enactPolicy(policy, true, S.delegadoIndex);
  S.crise = 0;
  S.totalCrises += 1;
  save();
}

function resetVotes(){
  S.votes = {};
  S.voteCursor = 0;
  S.voteOrder = alivePlayers().map(p => p.id);
}

function voteCounts(){
  let yes = 0, no = 0;
  for (const id of S.voteOrder){
    const v = S.votes[id];
    if (v === true) yes++;
    if (v === false) no++;
  }
  return { yes, no };
}

function currentVoter(){
  const id = S.voteOrder[S.voteCursor];
  if (!id) return null;
  return alivePlayers().find(p => p.id === id) || null;
}

function startLegislative(){
  S.hand3 = drawPolicies(3);
  S.hand2 = null;
  S.supSelectedIdx = [];
  S.delChosenIdx = null;
  S.revealProjects = false;
  save();
  setPhase(Phase.LEG_SUP);
}

function endContext(){
  return {
    vetos: S.totalVetos || 0,
    decretos: S.decretos || 0,
    rodadas: S.rodada || 0,
    crises: S.totalCrises || 0,
    vetos_consecutivos: S.crise || 0,
  };
}

function resolveEndLines(page){
  const ctx = endContext();

  const interpolate = (t) => String(t).replaceAll(/\{(\w+)\}/g, (_, k) => String(ctx[k] ?? ""));
  const check = (when) => {
    if (when?.gte){
      const [key, n] = when.gte;
      return Number(ctx[key]) >= Number(n);
    }
    if (when?.lte){
      const [key, n] = when.lte;
      return Number(ctx[key]) <= Number(n);
    }
    return false;
  };

  const resolveLine = (line) => {
    if (line.reactive){
      for (const r of line.reactive){
        if (check(r.when)) return interpolate(r.text);
      }
    }
    return interpolate(line.text);
  };

  return page.lines.map(resolveLine);
}

const HOME_TEXT = {
  title: "ZONA DE CONTROLE",
  b1Label: "ZONA DE CONTROLE",
  b1Body:
`O Estado entrou em Regime de Emergência.
As instituições permanecem em funcionamento.
A confiança, não.

Uma nova cadeia administrativa foi instaurada para garantir a continuidade da ordem.
Nem todos os nomeados compartilham do mesmo objetivo.`,
  b2Label: "PROCEDIMENTO DE GOVERNO",
  b2Body:
`A cada ciclo, o Estado convoca a formação de um Governo Temporário.

O Delegado Central indica um Supervisor de Zona.
A nomeação não é automática.

O Governo só assume se houver aprovação coletiva.
O debate é livre.
A decisão é registrada.

Aprovado: o Governo assume e o processo legislativo é iniciado.
Vetado: a nomeação é anulada e o controle avança.

Cada veto enfraquece a estabilidade institucional.

Após três governos vetados, o sistema entra em Crise Administrativa.
Um Decreto é aplicado automaticamente.
O controle prossegue.
O contador é reiniciado.`,
  b3Label: "OBJETIVO NÃO DECLARADO",
  b3Body:
`Uma facção busca restaurar o equilíbrio institucional.
Outra trabalha silenciosamente para consolidar o poder.

O Regente deve ser protegido.
Ou exposto.

A sessão termina quando o controle é absoluto.
Ou quando a última chance de correção se perde.`,
  cta: "INICIAR SESSÃO",
};

function view(){
  if (S.phase === Phase.HOME){
    return `
      <section class="card">
        <div class="home-title">${escape(HOME_TEXT.title)}</div>

        <div class="formblock">
          <div class="home-label">
            <div class="tag">${escape(HOME_TEXT.b1Label)}</div>
            <div class="accent">REGISTRO DE ABERTURA</div>
          </div>
          <div class="hr"></div>
          <div class="value">${escape(HOME_TEXT.b1Body)}</div>
        </div>

        <div class="formblock">
          <div class="home-label">
            <div class="tag">${escape(HOME_TEXT.b2Label)}</div>
            <div class="accent">PROCEDIMENTO</div>
          </div>
          <div class="hr"></div>
          <div class="value">${escape(HOME_TEXT.b2Body)}</div>
        </div>

        <div class="formblock">
          <div class="home-label">
            <div class="tag">${escape(HOME_TEXT.b3Label)}</div>
            <div class="accent">DIRETRIZ</div>
          </div>
          <div class="hr"></div>
          <div class="value">${escape(HOME_TEXT.b3Body)}</div>
        </div>

        <button class="btn primary" id="startSession">${escape(HOME_TEXT.cta)}</button>
      </section>
    `;
  }

  if (S.phase === Phase.PLAYERS){
    const rows = S.playersDraft.map((v, i) => `
      <input class="input" id="p_${i}" placeholder="Nome do participante" value="${escape(v)}" autocomplete="off" />
    `).join("");

    return `
      <section class="card">
        <div class="h1">REGISTRO DE NOMES</div>
        <div class="p">Insira 5 a 7 nomes. O app distribui cargos e conduz a sessão no modo celular único.</div>

        <div class="formblock">
          <div class="label">COMPOSIÇÃO</div>
          <div class="value">${escape(roleCountsText())}</div>
        </div>

        <div class="row">${rows}</div>

        <div class="row">
          <button class="btn" id="addPlayer">ADICIONAR CAMPO</button>
          <button class="btn primary" id="confirmPlayers">CONFIRMAR</button>
        </div>
      </section>
    `;
  }

  if (S.phase === Phase.POWERS_GUIDE){
    const t = powersGuideText();

    return `
      <section class="card">
        <div class="h1">COMUNICADO DE CONTROLE</div>

        <div class="formblock">
          <div class="label">REGISTRO</div>
          <div class="value">${escape(t.registro)}</div>
        </div>

        <div class="formblock">
          <div class="label">DECRETOS E FUNÇÕES</div>
          <div class="value">${escape(t.decretos)}</div>
        </div>

        <div class="formblock">
          <div class="label">NOTA OPERACIONAL</div>
          <div class="value">${escape(t.nota)}</div>
        </div>

        <button class="btn primary" id="continueAfterGuide">PROSSEGUIR</button>
      </section>
    `;
  }

  if (S.phase === Phase.DEAL){
    return `
      <section class="card">
        <div class="h1">DISTRIBUIÇÃO</div>
        <div class="p">Passe o celular. Cada participante confirma em silêncio e entrega ao próximo.</div>

        <div class="formblock">
          <div class="label">PARTICIPANTES</div>
          <div class="value">${escape(S.players.map(p => `• ${p.name}`).join("\n"))}</div>
        </div>

        <button class="btn primary" id="beginPass">INICIAR PASSAGEM</button>
      </section>
    `;
  }

  if (S.phase === Phase.PASS){
    const p = S.players[S.passIndex];
    return `
      <section class="card">
        <div class="h1">PASSAR O DISPOSITIVO</div>
        <div class="p">Entregue o celular para: <b>${escape(p.name)}</b></div>

        <button class="btn primary" id="showRole">MOSTRAR CREDENCIAL</button>
      </section>
    `;
  }

  if (S.phase === Phase.ROLE){
    const p = S.players[S.passIndex];

    let allies = [];
    if (p.role === Roles.ORDEM){
      allies = S.players
        .filter(x => x.alive && x.role === Roles.ORDEM && x.id !== p.id)
        .map(x => x.name);
    }

    let roleBadge = "";
    if (p.role === Roles.COALIZAO) roleBadge = `<div class="badge"><span class="dot ok"></span> <b>COALIZÃO POPULAR</b></div>`;
    if (p.role === Roles.ORDEM) roleBadge = `<div class="badge"><span class="dot bad"></span> <b>ORDEM SOBERANA</b></div>`;
    if (p.role === Roles.REGENTE) roleBadge = `<div class="badge"><span class="dot bad"></span> <b>REGENTE SOMBRIO</b></div>`;

    const obj = (() => {
      if (p.role === Roles.COALIZAO) return "Aprovar 5 Acordos.\nVitória alternativa: neutralizar o Regente.";
      if (p.role === Roles.ORDEM) return "Aprovar 6 Decretos.\nVitória alternativa: confirmar o Regente como Supervisor após 3 Decretos.";
      return "Assumir o controle sem ser identificado.\nEm auditorias, aparece como ORDEM.";
    })();

    const alliesBlock = (p.role === Roles.ORDEM)
      ? `
        <div class="formblock">
          <div class="label">ALIADOS IDENTIFICADOS</div>
          <div class="value">${escape(allies.length ? allies.map(a => `• ${a}`).join("\n") : "• (nenhum registro adicional)")}</div>
        </div>
      `
      : "";

    return `
      <section class="card">
        <div class="h1">CREDENCIAL</div>

        <div class="formblock">
          <div class="label">NOME</div>
          <div class="value">${escape(p.name)}</div>
        </div>

        ${roleBadge}

        <div class="formblock">
          <div class="label">OBJETIVO</div>
          <div class="value">${escape(obj)}</div>
        </div>

        ${alliesBlock}

        <div class="row">
          <button class="btn primary" id="okRole">OK</button>
          <button class="btn" id="passNext">PASSAR</button>
        </div>
      </section>
    `;
  }

  if (S.phase === Phase.BOARD){
    const del = S.players[S.delegadoIndex];
    const aliveList = alivePlayers().map(p => `• ${p.name}`).join("\n");

    return `
      <section class="card">
        <div class="h1">SALA DE REGISTRO</div>

        ${kpiHTML()}

        <div class="formblock">
          <div class="label">AUTORIDADE ATUAL</div>
          <div class="value">Delegado Central: ${escape(del.name)}</div>
        </div>

        <div class="formblock">
          <div class="label">PARTICIPANTES ATIVOS</div>
          <div class="value">${escape(aliveList)}</div>
        </div>

        <div class="formblock">
          <div class="label">REGRA OPERACIONAL</div>
          <div class="value">${S.directNominationActive
            ? "Nomeação Direta ativa. O Supervisor é indicado sem veto."
            : "Supervisor indicado precisa de aprovação coletiva.\nDebate externo e voto no app."
          }</div>
        </div>

        <button class="btn primary" id="beginRound">INICIAR CICLO</button>
      </section>
    `;
  }

  if (S.phase === Phase.ROUND_START){
    const del = S.players[S.delegadoIndex];
    return `
      <section class="card">
        <div class="h1">INÍCIO DO CICLO</div>
        ${kpiHTML()}
        <div class="formblock">
          <div class="label">DELEGADO CENTRAL</div>
          <div class="value">${escape(del.name)}</div>
        </div>
        <button class="btn primary" id="pickSup">INDICAR SUPERVISOR</button>
      </section>
    `;
  }

  if (S.phase === Phase.PICK_SUP){
    const del = S.players[S.delegadoIndex];
    const options = alivePlayers()
      .filter(p => p.id !== del.id)
      .filter(p => S.supervisorPrevIndex == null || p.index !== S.supervisorPrevIndex)
      .map(p => `<button class="btn" data-sup="${p.index}">${escape(p.name)}</button>`)
      .join("");

    return `
      <section class="card">
        <div class="h1">INDICAÇÃO DE SUPERVISOR</div>

        <div class="p">Delegado Central: <b>${escape(del.name)}</b></div>

        <div class="formblock">
          <div class="label">RESTRIÇÃO</div>
          <div class="value">O Supervisor anterior não pode ser indicado no ciclo seguinte.</div>
        </div>

        <div class="row">${options}</div>
        <button class="btn" id="backBoard">VOLTAR</button>
      </section>
    `;
  }

  if (S.phase === Phase.DEBATE){
    const del = S.players[S.delegadoIndex];
    const sup = S.players[S.supervisorIndex];

    return `
      <section class="card">
        <div class="h1">DEBATE EXTERNO</div>

        <div class="formblock">
          <div class="label">GOVERNO PROPOSTO</div>
          <div class="value">Delegado: ${escape(del.name)}\nSupervisor: ${escape(sup.name)}</div>
        </div>

        <div class="formblock">
          <div class="label">TEMPO</div>
          <div class="value">Debate fora do app por aproximadamente 60 segundos.</div>
        </div>

        <button class="btn primary" id="startVote">INICIAR VOTAÇÃO</button>
      </section>
    `;
  }

  if (S.phase === Phase.VOTE){
    const voter = currentVoter();
    const voterName = voter ? voter.name : "—";

    return `
      <section class="card">
        <div class="h1">VOTAÇÃO</div>

        <div class="formblock">
          <div class="label">VOTO DE</div>
          <div class="voteName">${escape(voterName)}</div>
          <div class="small">Registre apenas um voto e passe o dispositivo.</div>
        </div>

        <div class="row">
          <button class="btn ok" id="voteYes">APROVAR</button>
          <button class="btn danger" id="voteNo">REJEITAR</button>
        </div>

        <div class="small">O ciclo encerra automaticamente após todos votarem.</div>
      </section>
    `;
  }

  if (S.phase === Phase.VOTE_RESULT){
    const yes = S.lastVoteYes ?? 0;
    const no = S.lastVoteNo ?? 0;
    const approved = !!S.lastVoteApproved;

    const outcomeTitle = approved ? "APROVADO" : "VETADO";
    const outcomeText = approved
      ? "Aprovado. O Governo assume e o processo legislativo é iniciado."
      : "Vetado. A nomeação foi anulada e o controle avança.";

    return `
      <section class="card">
        <div class="h1">RESULTADO</div>

        <div class="formblock">
          <div class="label">CONTAGEM</div>
          <div class="value">APROVAR: ${yes}\nREJEITAR: ${no}</div>
        </div>

        <div class="formblock">
          <div class="label">${escape(outcomeTitle)}</div>
          <div class="value">${escape(outcomeText)}</div>
        </div>

        <button class="btn primary" id="continueAfterVote">PROSSEGUIR</button>
      </section>
    `;
  }

  if (S.phase === Phase.CRISIS_STATE){
    return `
      <section class="card">
        <div class="h1">ESTADO DE CRISE</div>

        <div class="formblock">
          <div class="label">STATUS: CRISE ADMINISTRATIVA</div>
          <div class="value">O sistema não conseguiu decidir.\nTrês vetos consecutivos comprometeram o processo.\nUma medida extraordinária será aplicada.\nUma carta entra em vigor automaticamente.</div>
        </div>

        <button class="btn danger" id="applyCrisis">APLICAR MEDIDA</button>
      </section>
    `;
  }

  if (S.phase === Phase.LEG_SUP){
    const del = S.players[S.delegadoIndex];
    const sup = S.players[S.supervisorIndex];

    const authBlock = `
      <div class="formblock">
        <div class="label">AUTORIDADES</div>
        <div class="value">Delegado: ${escape(del.name)}\nSupervisor: ${escape(sup.name)}</div>
      </div>
    `;

    if (!S.revealProjects){
      return `
        <section class="card">
          <div class="h1">FASE LEGISLATIVA</div>
          ${authBlock}
          <div class="formblock">
            <div class="label">AÇÃO DO SUPERVISOR</div>
            <div class="value">Selecione 2 entre 3 projetos.\nO terceiro será descartado.</div>
          </div>
          <button class="btn primary" id="revealSupProjects">MOSTRAR PROJETOS</button>
        </section>
      `;
    }

    const cards = S.hand3 || [];
    const picks = cards.map((p, i) => {
      const selected = S.supSelectedIdx.includes(i);
      const cls = selected ? (p.type === Cards.ACORDO ? "policyPick ok" : "policyPick bad") : "policyPick gray";
      return `<div class="${cls}" data-pick="${i}">${escape(p.title)}</div>`;
    }).join("");

    return `
      <section class="card">
        <div class="h1">FASE LEGISLATIVA</div>
        ${authBlock}

        <div class="formblock">
          <div class="label">AÇÃO DO SUPERVISOR</div>
          <div class="value">Selecione 2 entre 3 projetos.\nO terceiro será descartado.</div>
        </div>

        <div class="row">${picks}</div>

        <button class="btn primary" id="sendToDelegate" ${S.supSelectedIdx.length === 2 ? "" : "disabled"}>ENVIAR AO DELEGADO</button>
      </section>
    `;
  }

  if (S.phase === Phase.LEG_DEL){
    const del = S.players[S.delegadoIndex];
    const sup = S.players[S.supervisorIndex];

    const authBlock = `
      <div class="formblock">
        <div class="label">AUTORIDADES</div>
        <div class="value">Delegado: ${escape(del.name)}\nSupervisor: ${escape(sup.name)}</div>
      </div>
    `;

    if (!S.revealProjects){
      return `
        <section class="card">
          <div class="h1">DECISÃO DO DELEGADO</div>
          ${authBlock}
          <div class="formblock">
            <div class="label">AÇÃO DO DELEGADO</div>
            <div class="value">Escolha 1 entre 2 projetos.\nA cor só aparece quando selecionado.\nConfirme antes de promulgar.</div>
          </div>
          <button class="btn primary" id="revealDelProjects">MOSTRAR PROJETOS</button>
        </section>
      `;
    }

    const cards = S.hand2 || [];
    const opts = cards.map((p, i) => {
      const isChosen = S.delChosenIdx === i;
      const cls = isChosen ? (p.type === Cards.ACORDO ? "policyPick ok" : "policyPick bad") : "policyPick gray";
      return `<div class="${cls}" data-final="${i}">${escape(p.title)}</div>`;
    }).join("");

    return `
      <section class="card">
        <div class="h1">DECISÃO DO DELEGADO</div>
        ${authBlock}

        <div class="formblock">
          <div class="label">SELEÇÃO</div>
          <div class="value">Escolha 1 entre 2 projetos.\nO outro será descartado.</div>
        </div>

        <div class="row">${opts}</div>

        <button class="btn primary" id="confirmDelegateChoice" ${S.delChosenIdx == null ? "disabled" : ""}>CONFIRMAR PROMULGAÇÃO</button>
      </section>
    `;
  }

  if (S.phase === Phase.POWER_INFO){
    const isAudit = S.powerJustUnlocked === PendingPower.AUDIT;
    const subtitle = isAudit ? "AUDITORIA ADMINISTRATIVA AUTORIZADA" : "INTERVENÇÃO DIRETA AUTORIZADA";
    const owner = S.players[S.powerOwnerIndex]?.name || "—";

    const body = isAudit
      ? `Uma auditoria passa a existir.\n\nA execução é imediata.\nApenas o Delegado Central vê o resultado.\n\nLeitura retorna: COALIZÃO ou ORDEM.\nO Regente aparece como ORDEM.`
      : `Uma intervenção passa a existir.\n\nA execução é imediata.\nO Delegado Central elimina um participante vivo.\n\nA lealdade não é revelada ao grupo.\nSe o Regente for eliminado, a Coalizão vence imediatamente.`;

    return `
      <section class="card">
        <div class="h1">FUNÇÃO DESBLOQUEADA</div>

        <div class="formblock">
          <div class="label">${escape(subtitle)}</div>
          <div class="value">${escape(body)}</div>
        </div>

        <div class="formblock">
          <div class="label">AUTORIDADE RESPONSÁVEL</div>
          <div class="value">Delegado Central: ${escape(owner)}</div>
        </div>

        <button class="btn primary" id="continuePowerInfo">PROSSEGUIR</button>
      </section>
    `;
  }

  if (S.phase === Phase.POWER_AUDIT){
    const owner = S.players[S.powerOwnerIndex];
    const opts = alivePlayers()
      .filter(p => p.index !== owner.index)
      .map(p => `<button class="btn" data-audit="${p.index}">${escape(p.name)}</button>`)
      .join("");

    return `
      <section class="card">
        <div class="h1">AUDITORIA</div>

        <div class="formblock">
          <div class="label">ACESSO RESTRITO</div>
          <div class="value">Apenas o Delegado Central pode executar e visualizar.</div>
        </div>

        <div class="formblock">
          <div class="label">DELEGADO CENTRAL</div>
          <div class="value">${escape(owner.name)}</div>
        </div>

        <div class="p">Escolha um participante para auditoria.</div>
        <div class="row">${opts}</div>
      </section>
    `;
  }

  if (S.phase === Phase.POWER_KILL){
    const owner = S.players[S.powerOwnerIndex];
    const opts = alivePlayers()
      .filter(p => p.index !== owner.index)
      .map(p => `<button class="btn danger" data-kill="${p.index}">${escape(p.name)}</button>`)
      .join("");

    return `
      <section class="card">
        <div class="h1">INTERVENÇÃO</div>

        <div class="formblock">
          <div class="label">ACESSO RESTRITO</div>
          <div class="value">Apenas o Delegado Central pode executar.</div>
        </div>

        <div class="formblock">
          <div class="label">DELEGADO CENTRAL</div>
          <div class="value">${escape(owner.name)}</div>
        </div>

        <div class="p">Escolha um participante para eliminação.</div>
        <div class="row">${opts}</div>
      </section>
    `;
  }

  if (S.phase === Phase.GAME_OVER){
    const id = S.endPageId || "END_ORDEM";
    const page = EndPages[id] || EndPages.END_ORDEM;
    const lines = resolveEndLines(page);
    const out = lines.map(t => `• ${t}`).join("\n");

    return `
      <section class="card">
        <div class="h1">${escape(page.title)}</div>

        <div class="formblock">
          <div class="label">${escape(page.status)}</div>
          <div class="value">${escape(out)}</div>
        </div>

        ${kpiHTML()}

        <button class="btn primary" id="goHome">VOLTAR AO INÍCIO</button>
      </section>
    `;
  }

  return `
    <section class="card">
      <div class="h1">CARREGANDO</div>
      <div class="p">Se esta tela persistir, recarregue a página.</div>
    </section>
  `;
}

function bind(){
  if (S.phase === Phase.HOME){
    document.getElementById("startSession").onclick = () => setPhase(Phase.PLAYERS);
    return;
  }

  if (S.phase === Phase.PLAYERS){
    for (let i = 0; i < S.playersDraft.length; i++){
      const el = document.getElementById(`p_${i}`);
      if (el){
        el.oninput = () => {
          S.playersDraft[i] = el.value;
          save();
        };
      }
    }

    document.getElementById("addPlayer").onclick = () => {
      if (S.playersDraft.length >= 7) return;
      S.playersDraft.push("");
      save();
      render();
    };

    document.getElementById("confirmPlayers").onclick = () => {
      const names = S.playersDraft.map(s => s.trim()).filter(Boolean);
      if (names.length < 5 || names.length > 7){
        alert("Insira entre 5 e 7 nomes.");
        return;
      }

      const seen = new Set();
      for (const n of names){
        const k = n.toLowerCase();
        if (seen.has(k)){
          alert("Nomes duplicados não são permitidos.");
          return;
        }
        seen.add(k);
      }

      const rc = roleCounts(names.length);
      const roles = [
        ...Array(rc.coalizao).fill(Roles.COALIZAO),
        ...Array(rc.ordem).fill(Roles.ORDEM),
        Roles.REGENTE,
      ];
      shuffle(roles);

      S.players = names.map((name, i) => ({
        id: uid(),
        index: i,
        name,
        role: roles[i],
        alive: true,
      }));

      S.passIndex = 0;
      S.delegadoIndex = 0;
      S.supervisorIndex = null;
      S.supervisorPrevIndex = null;

      S.rodada = 1;
      S.acordos = 0;
      S.decretos = 0;

      S.crise = 0;
      S.totalVetos = 0;
      S.totalCrises = 0;

      S.deck = buildDeck();
      S.discard = [];

      S.hand3 = null;
      S.hand2 = null;
      S.supSelectedIdx = [];
      S.delChosenIdx = null;

      S.pendingPower = null;
      S.powerJustUnlocked = null;
      S.powerOwnerIndex = null;

      S.directNominationActive = false;
      S.directNominationNext = false;

      S.lastPolicy = null;
      S.lastOutcomeText = null;

      S.lastVoteYes = 0;
      S.lastVoteNo = 0;
      S.lastVoteApproved = null;

      S.endPageId = null;

      save();
      setPhase(Phase.POWERS_GUIDE);
    };

    return;
  }

  if (S.phase === Phase.POWERS_GUIDE){
    document.getElementById("continueAfterGuide").onclick = () => setPhase(Phase.DEAL);
    return;
  }

  if (S.phase === Phase.DEAL){
    document.getElementById("beginPass").onclick = () => setPhase(Phase.PASS);
    return;
  }

  if (S.phase === Phase.PASS){
    document.getElementById("showRole").onclick = () => setPhase(Phase.ROLE);
    return;
  }

  if (S.phase === Phase.ROLE){
    document.getElementById("okRole").onclick = () => alert("Confirmado.");

    document.getElementById("passNext").onclick = () => {
      if (S.passIndex < S.players.length - 1){
        S.passIndex += 1;
        save();
        setPhase(Phase.PASS);
        return;
      }
      setPhase(Phase.BOARD);
    };
    return;
  }

  if (S.phase === Phase.BOARD){
    document.getElementById("beginRound").onclick = () => setPhase(Phase.ROUND_START);
    return;
  }

  if (S.phase === Phase.ROUND_START){
    document.getElementById("pickSup").onclick = () => {
      maybeActivateDirectNominationForCurrentCycle();
      setPhase(Phase.PICK_SUP);
    };
    return;
  }

  if (S.phase === Phase.PICK_SUP){
    document.getElementById("backBoard").onclick = () => setPhase(Phase.BOARD);

    root.querySelectorAll("[data-sup]").forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.getAttribute("data-sup"));
        S.supervisorIndex = idx;
        save();

        if (S.directNominationActive){
          if (checkRegenteWinConditionAfterGovConfirm()) return;
          startLegislative();
          return;
        }

        setPhase(Phase.DEBATE);
      };
    });
    return;
  }

  if (S.phase === Phase.DEBATE){
    document.getElementById("startVote").onclick = () => {
      resetVotes();
      save();
      setPhase(Phase.VOTE);
    };
    return;
  }

  if (S.phase === Phase.VOTE){
    const voter = currentVoter();

    const registerAndAdvance = (val) => {
      if (!voter) return;
      S.votes[voter.id] = val;
      S.voteCursor += 1;
      save();

      if (S.voteCursor >= S.voteOrder.length){
        const { yes, no } = voteCounts();
        S.lastVoteYes = yes;
        S.lastVoteNo = no;
        S.lastVoteApproved = yes > no;
        save();
        setPhase(Phase.VOTE_RESULT);
        return;
      }

      render();
    };

    document.getElementById("voteYes").onclick = () => registerAndAdvance(true);
    document.getElementById("voteNo").onclick = () => registerAndAdvance(false);
    return;
  }

  if (S.phase === Phase.VOTE_RESULT){
    document.getElementById("continueAfterVote").onclick = () => {
      if (S.lastVoteApproved){
        if (checkRegenteWinConditionAfterGovConfirm()) return;
        startLegislative();
        return;
      }

      S.totalVetos += 1;
      S.crise += 1;

      S.supervisorPrevIndex = S.supervisorIndex;
      S.supervisorIndex = null;

      S.delegadoIndex = nextAliveIndex(S.delegadoIndex);
      S.rodada += 1;

      save();

      if (S.crise >= 3){
        setPhase(Phase.CRISIS_STATE);
        return;
      }

      setPhase(Phase.BOARD);
    };
    return;
  }

  if (S.phase === Phase.CRISIS_STATE){
    document.getElementById("applyCrisis").onclick = () => {
      applyCrisisAutoPolicy();

      if (S.phase === Phase.GAME_OVER) return;

      if (S.pendingPower){
        setPhase(Phase.POWER_INFO);
        return;
      }

      setPhase(Phase.BOARD);
    };
    return;
  }

  if (S.phase === Phase.LEG_SUP){
    const revealBtn = document.getElementById("revealSupProjects");
    if (revealBtn){
      revealBtn.onclick = () => {
        S.revealProjects = true;
        save();
        render();
      };
      return;
    }

    root.querySelectorAll("[data-pick]").forEach(el => {
      el.onclick = () => {
        const i = Number(el.getAttribute("data-pick"));
        const has = S.supSelectedIdx.includes(i);
        if (has){
          S.supSelectedIdx = S.supSelectedIdx.filter(x => x !== i);
        }else{
          if (S.supSelectedIdx.length >= 2) return;
          S.supSelectedIdx.push(i);
        }
        save();
        render();
      };
    });

    document.getElementById("sendToDelegate").onclick = () => {
      const cards = S.hand3.slice();
      const keep = S.supSelectedIdx.map(i => cards[i]);
      const discard = cards.filter((_, i) => !S.supSelectedIdx.includes(i));
      S.discard.push(...discard.map(p => p.type));

      S.hand2 = keep;
      S.hand3 = null;
      S.supSelectedIdx = [];
      S.delChosenIdx = null;
      S.revealProjects = false;

      save();
      setPhase(Phase.LEG_DEL);
    };
    return;
  }

  if (S.phase === Phase.LEG_DEL){
    const revealBtn = document.getElementById("revealDelProjects");
    if (revealBtn){
      revealBtn.onclick = () => {
        S.revealProjects = true;
        save();
        render();
      };
      return;
    }

    root.querySelectorAll("[data-final]").forEach(el => {
      el.onclick = () => {
        const i = Number(el.getAttribute("data-final"));
        S.delChosenIdx = i;
        save();
        render();
      };
    });

    document.getElementById("confirmDelegateChoice").onclick = () => {
      if (S.delChosenIdx == null) return;

      const chosen = S.hand2[S.delChosenIdx];
      const other = S.hand2[1 - S.delChosenIdx];

      S.discard.push(other.type);

      enactPolicy(chosen, false, S.delegadoIndex);
      if (S.phase === Phase.GAME_OVER) return;

      S.supervisorPrevIndex = S.supervisorIndex;
      S.supervisorIndex = null;

      S.delegadoIndex = nextAliveIndex(S.delegadoIndex);
      S.rodada += 1;

      save();

      if (S.pendingPower){
        setPhase(Phase.POWER_INFO);
        return;
      }

      setPhase(Phase.BOARD);
    };
    return;
  }

  if (S.phase === Phase.POWER_INFO){
    document.getElementById("continuePowerInfo").onclick = () => {
      S.powerJustUnlocked = S.pendingPower;
      save();

      const p = S.pendingPower;
      if (p === PendingPower.AUDIT) setPhase(Phase.POWER_AUDIT);
      else setPhase(Phase.POWER_KILL);
    };
    return;
  }

  if (S.phase === Phase.POWER_AUDIT){
    root.querySelectorAll("[data-audit]").forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.getAttribute("data-audit"));
        const target = S.players[idx];
        const seen = (target.role === Roles.REGENTE) ? "ORDEM" : (target.role === Roles.ORDEM ? "ORDEM" : "COALIZÃO");
        alert(`AUDITORIA: ${target.name}\nLEALDADE: ${seen}`);

        S.pendingPower = null;
        S.powerJustUnlocked = null;
        S.powerOwnerIndex = null;
        save();

        setPhase(Phase.BOARD);
      };
    });
    return;
  }

  if (S.phase === Phase.POWER_KILL){
    root.querySelectorAll("[data-kill]").forEach(btn => {
      btn.onclick = () => {
        const idx = Number(btn.getAttribute("data-kill"));
        const target = S.players[idx];
        target.alive = false;

        S.pendingPower = null;
        S.powerJustUnlocked = null;
        S.powerOwnerIndex = null;

        if (target.role === Roles.REGENTE){
          setGameOver("END_COALIZAO");
          return;
        }

        save();
        setPhase(Phase.BOARD);
      };
    });
    return;
  }

  if (S.phase === Phase.GAME_OVER){
    document.getElementById("goHome").onclick = () => setPhase(Phase.HOME);
    return;
  }
}

function render(){
  root.innerHTML = view();
  setHeader();
  bind();
}

render();
