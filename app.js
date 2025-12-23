/* Zona de Controle
   Celular único, sem chat, sem backend.
*/

const STORAGE_KEY = "zc_state_v4";

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
  POLICY_INFO: "POLICY_INFO",

  POWER_INFO: "POWER_INFO",
  POWER_AUDIT: "POWER_AUDIT",
  POWER_KILL: "POWER_KILL",

  GAME_OVER: "GAME_OVER",
};

const PendingPower = {
  AUDIT: "AUDIT",
  KILL: "KILL",
};

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
  return { coalizao: 4, ordem: 2, regente: 1 }; // 7
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

    crise: 0, // 0..3 (3 dispara)
    votes: {},

    deck: buildDeck(),
    discard: [],

    hand3: null,
    hand2: null,
    supSelectedIdx: [],

    pendingPower: null, // executa na próxima rodada
    powerJustUnlocked: null, // para tela explicativa

    directNomination: false,

    lastPolicy: null,
    lastOutcomeText: null,

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

function drawN(n){
  const out = [];
  for (let i = 0; i < n; i++) out.push(drawOne());
  return out;
}

function cardName(c){
  return c === Cards.ACORDO ? "PROJETO CIVIL" : "PROJETO DE DOMÍNIO";
}

function enactPolicy(card, auto=false){
  S.lastPolicy = card;

  if (card === Cards.ACORDO) S.acordos += 1;
  else S.decretos += 1;

  if (S.decretos >= 4) S.directNomination = true;

  if (S.acordos >= 5){
    S.winner = "COALIZAO";
    S.winReason = "Cinco Acordos aprovados.";
    S.phase = Phase.GAME_OVER;
    save();
    return;
  }

  if (S.decretos >= 6){
    S.winner = "ORDEM";
    S.winReason = "Seis Decretos promulgados.";
    S.phase = Phase.GAME_OVER;
    save();
    return;
  }

  if (auto){
    S.lastOutcomeText = "Crise Administrativa aplicada. Decreto automático promulgado. O contador foi reiniciado.";
  }else{
    S.lastOutcomeText = "Registro atualizado. O controle prossegue.";
  }

  unlockPowerIfAny();
  save();
}

function unlockPowerIfAny(){
  S.powerJustUnlocked = null;

  const n = S.players.length;
  const d = S.decretos;

  if (n < 7){
    if (d === 3) S.powerJustUnlocked = PendingPower.AUDIT;
  }else{
    if (d === 2) S.powerJustUnlocked = PendingPower.AUDIT;
    if (d === 3) S.powerJustUnlocked = PendingPower.KILL;
  }

  if (S.powerJustUnlocked){
    S.pendingPower = S.powerJustUnlocked; // executa na próxima rodada
    S.phase = Phase.POWER_INFO;
  }else{
    S.phase = Phase.POLICY_INFO;
  }
}

function checkRegenteWinConditionAfterGovConfirm(){
  if (S.decretos >= 3 && S.supervisorIndex != null){
    const sup = S.players[S.supervisorIndex];
    if (sup && sup.role === Roles.REGENTE){
      S.winner = "ORDEM";
      S.winReason = "O Regente foi confirmado Supervisor após o terceiro Decreto.";
      S.phase = Phase.GAME_OVER;
      save();
      return true;
    }
  }
  return false;
}

function resetVotes(){
  S.votes = {};
  S._voteCursor = 0;
}

function majorityApproved(){
  const alive = alivePlayers();
  let yes = 0, no = 0;
  for (const p of alive){
    const v = S.votes[p.id];
    if (v === true) yes++;
    if (v === false) no++;
  }
  return yes > no;
}

function applyCrisisAutoPolicy(){
  const card = drawOne();
  enactPolicy(card, true);
  S.crise = 0;
}

function roleCountsText(){
  const n = S.players.length;
  const rc = roleCounts(n);
  return `Coalizão: ${rc.coalizao} · Ordem: ${rc.ordem} · Regente: 1`;
}

function escape(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
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

function view(){
  if (S.phase === Phase.HOME){
    return `
      <section class="card">
        <div class="home-title">ZONA DE CONTROLE</div>

        <div class="formblock">
          <div class="label">REGISTRO DE ABERTURA</div>
          <div class="value">
O Estado entrou em Regime de Emergência.
As instituições permanecem em funcionamento.
A confiança, não.

Uma nova cadeia administrativa foi instaurada para garantir a continuidade da ordem.
Nem todos os nomeados compartilham do mesmo objetivo.
          </div>
        </div>

        <div class="formblock">
          <div class="label">PROCEDIMENTO DE GOVERNO</div>
          <div class="value">
A cada ciclo, o Estado convoca a formação de um Governo Temporário.

O Delegado Central indica um Supervisor de Zona.
A nomeação não é automática.

O Governo só assume se houver aprovação coletiva.
O debate é livre.
Após aproximadamente 60 segundos, a votação deve ocorrer.

Aprovado: o Governo assume e o processo legislativo é iniciado.
Vetado: a nomeação é anulada e o controle avança.

Cada veto enfraquece a estabilidade institucional.

Após três governos vetados, o sistema entra em Crise Administrativa.

Nenhuma autoridade é confirmada.
Nenhuma justificativa é aceita.

Um Decreto é aplicado automaticamente,
sem debate,
sem escolha,
sem contestação.

O controle prossegue.
O contador é reiniciado.
          </div>
        </div>

        <div class="formblock">
          <div class="label">OBJETIVO NÃO DECLARADO</div>
          <div class="value">
Uma facção busca restaurar o equilíbrio institucional.
Outra trabalha silenciosamente para consolidar o poder.

O Regente deve ser protegido.
Ou exposto.

A sessão termina quando o controle é absoluto.
Ou quando a última chance de correção se perde.
          </div>
        </div>

        <button class="btn primary" id="startSession">INICIAR SESSÃO</button>
        <div class="small home-subtle">Debate ocorre fora do app. O app registra decisões, cartas e tabuleiro.</div>
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
          <div class="value">${roleCountsText()}</div>
        </div>

        <div class="row">${rows}</div>

        <div class="row">
          <button class="btn" id="addPlayer">ADICIONAR CAMPO</button>
          <button class="btn primary" id="confirmPlayers">CONFIRMAR</button>
        </div>
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
          <div class="value">${S.players.map(p => `• ${p.name}`).join("\n")}</div>
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
          <div class="value">${allies.length ? allies.map(a => `• ${escape(a)}`).join("\n") : "• (nenhum registro adicional)"}</div>
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
          <div class="value">${S.directNomination
            ? "Nomeação Direta ativa após o 4º Decreto.\nO Supervisor é indicado sem veto."
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
    const alive = alivePlayers();
    const current = alive[(S._voteCursor || 0) % alive.length];

    return `
      <section class="card">
        <div class="h1">VOTAÇÃO</div>

        <div class="formblock" id="voteOf">
          <div class="label">VOTO DE</div>
          <div class="value">${escape(current ? current.name : "—")}</div>
        </div>

        <div class="formblock">
          <div class="label">AÇÃO</div>
          <div class="value">Apenas pressione um botão. A discussão ocorre fora do app.</div>
        </div>

        <div class="row">
          <button class="btn primary" id="voteYes">APROVAR</button>
          <button class="btn danger" id="voteNo">REJEITAR</button>
        </div>

        <div class="small">Um único registro por vez. Passe o celular para cada participante registrar seu voto.</div>

        <div class="row">
          <button class="btn" id="nextVoter">PRÓXIMO VOTO</button>
          <button class="btn" id="finishVote">ENCERRAR VOTAÇÃO</button>
        </div>
      </section>
    `;
  }

  if (S.phase === Phase.VOTE_RESULT){
    return `
      <section class="card">
        <div class="h1">RESULTADO</div>
        <div class="p">${escape(S.lastOutcomeText || "Registro concluído.")}</div>

        <button class="btn primary" id="continueAfterVote">PROSSEGUIR</button>
      </section>
    `;
  }

  if (S.phase === Phase.LEG_SUP){
    const del = S.players[S.delegadoIndex];
    const sup = S.players[S.supervisorIndex];
    const cards = S.hand3 || [];

    const picks = cards.map((c, i) => {
      const selected = S.supSelectedIdx.includes(i);
      const cls = selected ? "policyPick ok" : "policyPick gray";
      return `<div class="${cls}" data-pick="${i}">${cardName(c)}</div>`;
    }).join("");

    return `
      <section class="card">
        <div class="h1">FASE LEGISLATIVA</div>

        <div class="formblock">
          <div class="label">AUTORIDADES</div>
          <div class="value">Delegado: ${escape(del.name)}\nSupervisor: ${escape(sup.name)}</div>
        </div>

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
    const cards = S.hand2 || [];

    const opts = cards.map((c, i) => {
      return `<div class="policyPick gray" data-final="${i}">${cardName(c)}</div>`;
    }).join("");

    return `
      <section class="card">
        <div class="h1">DECISÃO DO DELEGADO</div>

        <div class="formblock">
          <div class="label">AUTORIDADES</div>
          <div class="value">Delegado: ${escape(del.name)}\nSupervisor: ${escape(sup.name)}</div>
        </div>

        <div class="formblock">
          <div class="label">AÇÃO DO DELEGADO</div>
          <div class="value">Escolha 1 entre 2 projetos.\nO outro será descartado.</div>
        </div>

        <div class="row">${opts}</div>

        <div class="small">Antes da escolha final, ambos aparecem como cinza.</div>
      </section>
    `;
  }

  if (S.phase === Phase.POWER_INFO){
    const subtitle = (S.powerJustUnlocked === PendingPower.AUDIT)
      ? "AUDITORIA ADMINISTRATIVA AUTORIZADA"
      : "INTERVENÇÃO DIRETA AUTORIZADA";

    const body = (S.powerJustUnlocked === PendingPower.AUDIT)
      ? `Com a promulgação deste Decreto, uma auditoria passa a existir.

A auditoria será executada na próxima rodada.
Apenas o Delegado Central verá o resultado.

A leitura retorna: COALIZÃO ou ORDEM.
O Regente aparece como ORDEM.`
      : `Com a promulgação deste Decreto, uma intervenção passa a existir.

A intervenção será executada na próxima rodada.
O Delegado Central deverá eliminar um participante vivo.

A lealdade não é revelada ao grupo.
Se o Regente for eliminado, a Coalizão vence imediatamente.`;

    return `
      <section class="card">
        <div class="h1">FUNÇÃO DESBLOQUEADA</div>

        <div class="formblock">
          <div class="label">${escape(subtitle)}</div>
          <div class="value">${escape(body)}</div>
        </div>

        <button class="btn primary" id="continuePowerInfo">PROSSEGUIR</button>
      </section>
    `;
  }

  if (S.phase === Phase.POWER_AUDIT){
    const del = S.players[S.delegadoIndex];
    const opts = alivePlayers()
      .filter(p => p.index !== S.delegadoIndex)
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
          <div class="value">${escape(del.name)}</div>
        </div>

        <div class="p">Escolha um participante para auditoria.</div>

        <div class="row">${opts}</div>
      </section>
    `;
  }

  if (S.phase === Phase.POWER_KILL){
    const del = S.players[S.delegadoIndex];
    const opts = alivePlayers()
      .filter(p => p.index !== S.delegadoIndex)
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
          <div class="value">${escape(del.name)}</div>
        </div>

        <div class="p">Escolha um participante para eliminação.</div>

        <div class="row">${opts}</div>
      </section>
    `;
  }

  if (S.phase === Phase.POLICY_INFO){
    return `
      <section class="card">
        <div class="h1">REGISTRO</div>
        <div class="p">${escape(S.lastOutcomeText || "Registro atualizado.")}</div>

        <button class="btn primary" id="continuePolicy">PROSSEGUIR</button>
      </section>
    `;
  }

  if (S.phase === Phase.GAME_OVER){
    const title = (S.winner === "COALIZAO") ? "VITÓRIA DA COALIZÃO" : "VITÓRIA DA ORDEM";
    return `
      <section class="card">
        <div class="h1">${escape(title)}</div>

        <div class="formblock">
          <div class="label">MOTIVO</div>
          <div class="value">${escape(S.winReason || "Encerramento.")}</div>
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

      S.deck = buildDeck();
      S.discard = [];

      S.pendingPower = null;
      S.powerJustUnlocked = null;
      S.directNomination = false;

      save();
      setPhase(Phase.DEAL);
    };

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
    document.getElementById("okRole").onclick = () => {
      alert("Confirmado.");
    };

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
      if (S.pendingPower){
        const p = S.pendingPower;
        S.pendingPower = null;
        save();
        if (p === PendingPower.AUDIT) setPhase(Phase.POWER_AUDIT);
        else setPhase(Phase.POWER_KILL);
        return;
      }
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

        if (S.directNomination){
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
    const alive = alivePlayers();
    const current = alive[(S._voteCursor || 0) % alive.length];

    document.getElementById("voteYes").onclick = () => {
      S.votes[current.id] = true;
      save();
      alert("APROVADO registrado.");
    };

    document.getElementById("voteNo").onclick = () => {
      S.votes[current.id] = false;
      save();
      alert("REJEITADO registrado.");
    };

    document.getElementById("nextVoter").onclick = () => {
      S._voteCursor = (S._voteCursor || 0) + 1;
      save();
      render();
    };

    document.getElementById("finishVote").onclick = () => {
      const approved = majorityApproved();

      if (approved){
        S.lastOutcomeText = "Aprovado. O Governo assume e o processo legislativo é iniciado.";
        save();
        setPhase(Phase.VOTE_RESULT);
      }else{
        S.crise += 1;
        S.lastOutcomeText = "Vetado. A nomeação foi anulada e o controle avança.";

        S.supervisorPrevIndex = S.supervisorIndex;
        S.supervisorIndex = null;

        S.delegadoIndex = nextAliveIndex(S.delegadoIndex);
        S.rodada += 1;

        if (S.crise >= 3){
          applyCrisisAutoPolicy();
          S.lastOutcomeText = "Crise Administrativa. Um Decreto foi aplicado automaticamente. O contador foi reiniciado.";

          S.delegadoIndex = nextAliveIndex(S.delegadoIndex);
          S.rodada += 1;
        }

        save();
        setPhase(Phase.VOTE_RESULT);
      }
    };

    return;
  }

  if (S.phase === Phase.VOTE_RESULT){
    document.getElementById("continueAfterVote").onclick = () => {
      if ((S.lastOutcomeText || "").startsWith("Aprovado")){
        if (checkRegenteWinConditionAfterGovConfirm()) return;
        startLegislative();
        return;
      }
      setPhase(Phase.BOARD);
    };
    return;
  }

  if (S.phase === Phase.LEG_SUP){
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
      S.discard.push(...discard);

      S.hand2 = keep;
      S.hand3 = null;
      S.supSelectedIdx = [];
      save();
      setPhase(Phase.LEG_DEL);
    };

    return;
  }

  if (S.phase === Phase.LEG_DEL){
    root.querySelectorAll("[data-final]").forEach(el => {
      el.onclick = () => {
        const i = Number(el.getAttribute("data-final"));
        const chosen = S.hand2[i];
        const other = S.hand2[1 - i];

        const chosenEl = root.querySelector(`[data-final="${i}"]`);
        const otherEl = root.querySelector(`[data-final="${1 - i}"]`);
        if (chosenEl) chosenEl.className = `policyPick ${chosen === Cards.ACORDO ? "ok" : "bad"}`;
        if (otherEl) otherEl.className = `policyPick ${other === Cards.ACORDO ? "ok" : "bad"}`;

        S.discard.push(other);

        enactPolicy(chosen, false);

        S.supervisorPrevIndex = S.supervisorIndex;
        S.supervisorIndex = null;

        S.delegadoIndex = nextAliveIndex(S.delegadoIndex);
        S.rodada += 1;

        save();
        render();
      };
    });

    return;
  }

  if (S.phase === Phase.POWER_INFO){
    document.getElementById("continuePowerInfo").onclick = () => {
      S.powerJustUnlocked = null;
      save();
      setPhase(Phase.BOARD);
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
        S.lastOutcomeText = "Auditoria concluída. O registro permanece restrito ao Delegado.";
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

        if (target.role === Roles.REGENTE){
          S.winner = "COALIZAO";
          S.winReason = "O Regente foi neutralizado durante uma intervenção.";
          save();
          setPhase(Phase.GAME_OVER);
          return;
        }

        S.lastOutcomeText = "Intervenção concluída. A lealdade do eliminado não foi revelada.";
        save();
        setPhase(Phase.BOARD);
      };
    });
    return;
  }

  if (S.phase === Phase.POLICY_INFO){
    document.getElementById("continuePolicy").onclick = () => {
      setPhase(Phase.BOARD);
    };
    return;
  }

  if (S.phase === Phase.GAME_OVER){
    document.getElementById("goHome").onclick = () => setPhase(Phase.HOME);
    return;
  }
}

function startLegislative(){
  S.hand3 = drawN(3);
  S.hand2 = null;
  S.supSelectedIdx = [];
  save();
  setPhase(Phase.LEG_SUP);
}

function render(){
  root.innerHTML = view();
  setHeader();
  bind();
}

render();
