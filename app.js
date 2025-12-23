/* Zona de Controle — MVP (celular único)
   Projeto estático (HTML/CSS/JS). Sem backend.
   Estado em localStorage.
*/

const $ = (sel) => document.querySelector(sel);

const STORAGE_KEY = "zona_controle_mvp_v2";

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
  CONFIRM: "CONFIRM",
  DEAL_INTRO: "DEAL_INTRO",
  PASS_TO: "PASS_TO",
  SHOW_ROLE: "SHOW_ROLE",
  BOARD: "BOARD",
  ROUND_START: "ROUND_START",
  PICK_SUPERVISOR: "PICK_SUPERVISOR",
  DEBATE: "DEBATE",
  VOTE_PASS_TO: "VOTE_PASS_TO",
  VOTE: "VOTE",
  VOTE_RESULT: "VOTE_RESULT",
  LEGISLATE_SUP: "LEGISLATE_SUP",
  LEGISLATE_DEL: "LEGISLATE_DEL",
  POLICY_REVEAL: "POLICY_REVEAL",
  POWER_AUDIT: "POWER_AUDIT",
  POWER_KILL: "POWER_KILL",
  GAME_OVER: "GAME_OVER",
};

function shuffle(arr){
  for (let i = arr.length - 1; i > 0; i--){
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
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

function save(state){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function freshState(){
  return {
    phase: Phase.HOME,
    protocol: null,

    playersDraft: ["", "", "", "", ""],

    players: [],
    currentIndex: 0,
    delegadoIndex: 0,
    supervisorIndex: null,
    supervisorAnteriorIndex: null,

    votes: {},
    voteTurnIndex: 0,
    debateEndsAt: null,
    lastVoteApproved: null,

    hand3: null,
    hand2: null,
    legSupSelected: [],

    deck: [],
    discard: [],

    acordos: 0,
    decretos: 0,
    crise: 0,
    rodada: 1,

    directNominationActive: false,

    log: [],
    winner: null,
  };
}

let S = load() || freshState();

function newProtocol(){
  const year = new Date().getFullYear();
  const rand = String(Math.floor(100000 + Math.random() * 900000));
  return `ZC-${year}-${rand}`;
}

function ensureProtocol(){
  if (!S.protocol){
    S.protocol = newProtocol();
    save(S);
  }
}
ensureProtocol();

function resetAll(){
  localStorage.removeItem(STORAGE_KEY);
  S = freshState();
  S.protocol = newProtocol();
  save(S);
  render();
}

document.getElementById("btnReset").addEventListener("click", () => {
  if (confirm("Reiniciar e apagar a sessão atual?")) resetAll();
});

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

function draw(){
  if (S.deck.length === 0){
    S.deck = shuffle(S.discard);
    S.discard = [];
  }
  return S.deck.pop();
}

function drawN(n){
  const out = [];
  for (let i = 0; i < n; i++) out.push(draw());
  return out;
}

function alivePlayers(){
  return S.players.filter(p => p.vivo);
}

function getPlayerByIndex(idx){
  return S.players[idx];
}

function getPlayerById(id){
  return S.players.find(p => p.id === id);
}

function nextAliveIndex(fromIdx){
  let idx = fromIdx;
  for (let i = 0; i < S.players.length; i++){
    idx = (idx + 1) % S.players.length;
    if (S.players[idx].vivo) return idx;
  }
  return fromIdx;
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

function setPhase(phase){
  S.phase = phase;
  save(S);
  render();
}

function kpiHTML(){
  return `
    <div class="kpi">
      <div class="badge"><span class="dot ok"></span> Acordos: <b>${S.acordos}/5</b></div>
      <div class="badge"><span class="dot bad"></span> Decretos: <b>${S.decretos}/6</b></div>
      <div class="badge"><span class="dot"></span> Crise: <b>${S.crise}/3</b></div>
      <div class="badge"><span class="dot"></span> Rodada: <b>${S.rodada}</b></div>
    </div>
  `;
}

function checkWin(){
  if (S.acordos >= 5){
    S.winner = "COALIZAO";
    return true;
  }
  if (S.decretos >= 6){
    S.winner = "ORDEM";
    return true;
  }
  return false;
}

function cardLabel(c){
  return c === Cards.ACORDO ? "PROJETO CIVIL" : "PROJETO DE DOMÍNIO";
}

function escapeHtml(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function roleBlock(role, allies){
  if (role === Roles.COALIZAO){
    return `
      <div class="badge"><span class="dot ok"></span> <b>COALIZÃO POPULAR</b></div>
      <div class="formblock">
        <div class="label">OBJETIVO</div>
        <div class="value">Aprovar 5 Acordos Civis.
Vitória alternativa: neutralizar o Regente.</div>
      </div>
      <div class="formblock">
        <div class="label">STATUS</div>
        <div class="value">Nenhuma informação adicional foi autorizada.</div>
      </div>
    `;
  }
  if (role === Roles.ORDEM){
    return `
      <div class="badge"><span class="dot bad"></span> <b>ORDEM SOBERANA</b></div>
      <div class="formblock">
        <div class="label">OBJETIVO</div>
        <div class="value">Aprovar 6 Decretos de Domínio.
Proteja o Regente.</div>
      </div>
      <div class="formblock">
        <div class="label">ALIADOS IDENTIFICADOS</div>
        <div class="value">${allies.map(a => `• ${escapeHtml(a)}`).join("\n")}</div>
      </div>
    `;
  }
  return `
    <div class="badge"><span class="dot bad"></span> <b>REGENTE SOMBRIO</b></div>
    <div class="formblock">
      <div class="label">OBJETIVO</div>
      <div class="value">Assumir o controle sem ser identificado.
Você não recebe lista de aliados.</div>
    </div>
    <div class="formblock">
      <div class="label">CAMUFLAGEM</div>
      <div class="value">Em auditorias, você aparece como ORDEM.</div>
    </div>
  `;
}

function render(){
  const root = document.getElementById("root");
  root.innerHTML = view();
  bind();

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

function view(){
  switch(S.phase){

    case Phase.HOME:
      return `
        <section class="card">
          <div class="h1">ZONA DE CONTROLE</div>
          <div class="formblock">
            <div class="label">AVISO</div>
            <div class="value">Um único dispositivo.
Uma única autoridade.
Registro obrigatório.</div>
          </div>
          <button class="btn primary" id="goCreate">CRIAR SESSÃO</button>
        </section>
      `;

    case Phase.PLAYERS:
      return `
        <section class="card">
          <div class="h1">Participantes</div>
          <div class="formblock">
            <div class="label">INSTRUÇÃO</div>
            <div class="value">Digite entre 5 e 7 nomes.
Sem nomes repetidos.</div>
          </div>
          <div class="list" id="playersList">
            ${S.playersDraft.map((v,i)=>`
              <input class="input" data-idx="${i}" placeholder="Jogador ${i+1}" value="${escapeHtml(v)}" />
            `).join("")}
          </div>
          <div class="row">
            <button class="btn" id="addPlayer" ${S.playersDraft.length>=7?'disabled':''}>+ ADICIONAR</button>
            <button class="btn primary" id="confirmPlayers">CONFIRMAR</button>
          </div>
          <div class="p" id="playersError" style="display:none;color:var(--bad)"></div>
        </section>
      `;

    case Phase.CONFIRM:
      return `
        <section class="card">
          <div class="h1">Participantes Confirmados</div>
          <div class="formblock">
            <div class="label">NOTA</div>
            <div class="value">A ordem exibida será usada para condução.
O app substitui cartas e tabuleiro.</div>
          </div>
          <div class="list">
            ${S.players.map(p=>`<div class="badge"><span class="dot"></span> ${escapeHtml(p.nome)}</div>`).join("")}
          </div>
          <div class="row">
            <button class="btn" id="editNames">EDITAR NOMES</button>
            <button class="btn primary" id="startDeal">INICIAR DISTRIBUIÇÃO</button>
          </div>
        </section>
      `;

    case Phase.DEAL_INTRO:
      return `
        <section class="card">
          <div class="h1">Distribuição de Papéis</div>
          ${kpiHTML()}
          <div class="formblock">
            <div class="label">PROCEDIMENTO</div>
            <div class="value">Cada pessoa verá sua tela.
Confirme com OK.
Passe o aparelho ao próximo.</div>
          </div>
          <button class="btn primary" id="beginDeal">COMEÇAR</button>
        </section>
      `;

    case Phase.PASS_TO: {
      const p = getPlayerByIndex(S.currentIndex);
      return `
        <section class="card">
          <div class="h1">Transferência</div>
          <div class="formblock">
            <div class="label">ENTREGA DO DISPOSITIVO</div>
            <div class="value">Passe o aparelho para:</div>
          </div>
          <div class="badge" style="justify-content:center;font-size:16px;"><span class="dot"></span> <b>${escapeHtml(p.nome)}</b></div>
          <button class="btn primary" id="imHere">ESTOU COM O APARELHO</button>
        </section>
      `;
    }

    case Phase.SHOW_ROLE: {
      const p = getPlayerByIndex(S.currentIndex);
      const allies = p.papel === Roles.ORDEM
        ? S.players.filter(x => x.papel === Roles.ORDEM || x.papel === Roles.REGENTE).map(x=>x.nome)
        : [];
      return `
        <section class="card">
          <div class="h1">Credencial</div>
          <div class="badge"><span class="dot"></span> ${escapeHtml(p.nome)}</div>
          <hr class="hr" />
          ${roleBlock(p.papel, allies)}
          <div class="row">
            <button class="btn primary" id="roleOk">OK</button>
            <button class="btn" id="passNext">PASSAR</button>
          </div>
        </section>
      `;
    }

    case Phase.ROUND_START: {
      const delegado = getPlayerByIndex(S.delegadoIndex);
      const direct = (S.decretos >= 4);
      return `
        <section class="card">
          <div class="h1">Sessão do Conselho</div>
          ${kpiHTML()}
          <div class="formgrid">
            <div class="formblock">
              <div class="label">DELEGADO CENTRAL</div>
              <div class="value">${escapeHtml(delegado.nome)}</div>
            </div>
            <div class="formblock">
              <div class="label">STATUS</div>
              <div class="value">${direct ? "NOMEAÇÃO DIRETA ATIVA (SEM VETO)" : "PROCEDIMENTO PADRÃO"}</div>
            </div>
          </div>
          <div class="formblock">
            <div class="label">DESPACHO</div>
            <div class="value">Indicar Supervisor de Zona para composição do governo.</div>
          </div>
          <div class="row">
            <button class="btn" id="goBoard">TABULEIRO</button>
            <button class="btn primary" id="goPickSupervisor">INDICAR SUPERVISOR</button>
          </div>
        </section>
      `;
    }

    case Phase.PICK_SUPERVISOR: {
      const delegado = getPlayerByIndex(S.delegadoIndex);
      const direct = (S.decretos >= 4);
      const eligible = S.players.map((p,idx)=>{
        const locked = !p.vivo || idx===S.delegadoIndex || idx===S.supervisorAnteriorIndex;
        return { p, idx, locked };
      });
      return `
        <section class="card">
          <div class="h1">Indicação do Supervisor</div>
          ${kpiHTML()}
          <div class="formgrid">
            <div class="formblock">
              <div class="label">AUTORIDADE</div>
              <div class="value">Delegado: ${escapeHtml(delegado.nome)}</div>
            </div>
            <div class="formblock">
              <div class="label">REGIME</div>
              <div class="value">${direct ? "NOMEAÇÃO DIRETA (SEM VOTO)" : "NOMEAÇÃO + VOTAÇÃO"}</div>
            </div>
          </div>
          <div class="formblock">
            <div class="label">SELEÇÃO</div>
            <div class="value">Escolha o Supervisor de Zona.
Bloqueios: não pode ser o Delegado e nem o Supervisor anterior.</div>
          </div>
          <div class="list">
            ${eligible.map(item=>`
              <button class="btn ${item.locked?'ghost':''}" data-picksup="${item.idx}" ${item.locked?'disabled':''}>
                ${escapeHtml(item.p.nome)} ${!item.p.vivo ? "(eliminado)" : ""}
              </button>
            `).join("")}
          </div>
        </section>
      `;
    }

    case Phase.DEBATE:
      return `
        <section class="card">
          <div class="h1">Debate</div>
          ${kpiHTML()}
          <div class="formblock">
            <div class="label">ORIENTAÇÃO</div>
            <div class="value">Debate externo autorizado por 60 segundos.
Encerrado o tempo, inicia o registro oficial de votação.</div>
          </div>
          <div class="badge" style="justify-content:center;font-size:18px;">
            <span class="dot"></span> TEMPO: <span class="timer" id="debateTimer">60</span>s
          </div>
        </section>
      `;

    case Phase.VOTE_PASS_TO: {
      const alive = alivePlayers();
      const target = alive[S.voteTurnIndex];
      return `
        <section class="card">
          <div class="h1">Votação</div>
          ${kpiHTML()}
          <div class="formblock">
            <div class="label">REGISTRO</div>
            <div class="value">A decisão foi debatida fora do app.
Registre apenas APROVAR ou REJEITAR.</div>
          </div>
          <div class="badge" style="justify-content:center;font-size:16px;"><span class="dot"></span> <b>${escapeHtml(target.nome)}</b></div>
          <button class="btn primary" id="voteImHere">ESTOU COM O APARELHO</button>
        </section>
      `;
    }

    case Phase.VOTE: {
      const alive = alivePlayers();
      const target = alive[S.voteTurnIndex];
      return `
        <section class="card">
          <div class="h1">Registro do Voto</div>
          <div class="badge"><span class="dot"></span> ${escapeHtml(target.nome)}</div>
          <div class="formblock">
            <div class="label">DECISÃO</div>
            <div class="value">Selecione uma única vez.
A ação é definitiva.</div>
          </div>
          <div class="row">
            <button class="btn ok" id="btnApprove">APROVAR</button>
            <button class="btn danger" id="btnReject">REJEITAR</button>
          </div>
        </section>
      `;
    }

    case Phase.VOTE_RESULT: {
      const approved = S.lastVoteApproved;
      return `
        <section class="card">
          <div class="h1">Resultado Oficial</div>
          ${kpiHTML()}
          <div class="formblock">
            <div class="label">STATUS</div>
            <div class="value">${approved ? "GOVERNO APROVADO.\nProceder para fase legislativa." : "GOVERNO REJEITADO.\nInstabilidade aumenta."}</div>
          </div>
          <div class="badge" style="justify-content:center;font-size:16px;">
            <span class="dot ${approved?'ok':'bad'}"></span>
            <b>${approved ? "APROVADO" : "REJEITADO"}</b>
          </div>
          <button class="btn primary" id="afterVote">CONTINUAR</button>
        </section>
      `;
    }

    case Phase.LEGISLATE_SUP: {
      const sup = getPlayerByIndex(S.supervisorIndex);
      return `
        <section class="card">
          <div class="h1">Fase Legislativa</div>
          ${kpiHTML()}
          <div class="formblock">
            <div class="label">AUTORIDADE</div>
            <div class="value">Supervisor: ${escapeHtml(sup.nome)}</div>
          </div>
          <div class="formblock">
            <div class="label">PROJETOS (SIGILOSOS)</div>
            <div class="value">Selecione 2 de 3.
Os projetos permanecem em cinza até a decisão final do Delegado.</div>
          </div>
          <div class="list">
            ${S.hand3.map((c,i)=>`
              <button class="policy" data-legsup="${i}">${cardLabel(c)}</button>
            `).join("")}
          </div>
          <div class="p" id="legSupHint">Selecionado: 0/2</div>
          <button class="btn primary" id="legSupSend" disabled>ENCAMINHAR AO DELEGADO</button>
        </section>
      `;
    }

    case Phase.LEGISLATE_DEL: {
      const del = getPlayerByIndex(S.delegadoIndex);
      return `
        <section class="card">
          <div class="h1">Fase Legislativa</div>
          ${kpiHTML()}
          <div class="formblock">
            <div class="label">AUTORIDADE</div>
            <div class="value">Delegado: ${escapeHtml(del.nome)}</div>
          </div>
          <div class="formblock">
            <div class="label">PROJETOS (EM ANÁLISE)</div>
            <div class="value">Selecione 1 de 2.
A cor só será revelada após a aprovação.</div>
          </div>
          <div class="list">
            ${S.hand2.map((c,i)=>`
              <button class="policy" data-legdel="${i}">${cardLabel(c)}</button>
            `).join("")}
          </div>
          <button class="btn primary" id="legDelApprove" disabled>APROVAR PROJETO</button>
        </section>
      `;
    }

    case Phase.POLICY_REVEAL:
      return `
        <section class="card">
          <div class="h1">Deliberação</div>
          ${kpiHTML()}
          <div class="formblock">
            <div class="label">REGISTRO FINAL</div>
            <div class="value">O projeto aprovado foi registrado.
A natureza do ato é agora pública.</div>
          </div>
          <div class="reveal ${S.lastPolicy===Cards.ACORDO?'ok':'bad'}">
            ${S.lastPolicy===Cards.ACORDO ? "ACORDO CIVIL" : "DECRETO DE DOMÍNIO"}
          </div>
          <button class="btn primary" id="afterPolicy">CONTINUAR</button>
        </section>
      `;

    case Phase.POWER_AUDIT: {
      const del = getPlayerByIndex(S.delegadoIndex);
      return `
        <section class="card">
          <div class="h1">Auditoria de Lealdade</div>
          ${kpiHTML()}
          <div class="formblock">
            <div class="label">SIGILO</div>
            <div class="value">A auditoria é privada.
Somente o Delegado visualiza o resultado.</div>
          </div>
          <div class="formblock">
            <div class="label">AUTORIDADE</div>
            <div class="value">Delegado: ${escapeHtml(del.nome)}</div>
          </div>
          <div class="p">Selecione um alvo:</div>
          <div class="list">
            ${alivePlayers().map(p=>`
              <button class="btn" data-audit="${p.id}">${escapeHtml(p.nome)}</button>
            `).join("")}
          </div>
        </section>
      `;
    }

    case Phase.POWER_KILL: {
      const del = getPlayerByIndex(S.delegadoIndex);
      return `
        <section class="card">
          <div class="h1">Neutralização</div>
          ${kpiHTML()}
          <div class="formblock">
            <div class="label">AUTORIDADE</div>
            <div class="value">Delegado: ${escapeHtml(del.nome)}</div>
          </div>
          <div class="formblock">
            <div class="label">ORDEM</div>
            <div class="value">Elimine um jogador vivo.
A identidade não é exibida ao grupo.</div>
          </div>
          <div class="list">
            ${alivePlayers().map(p=>`
              <button class="btn danger" data-kill="${p.id}">${escapeHtml(p.nome)}</button>
            `).join("")}
          </div>
        </section>
      `;
    }

    case Phase.GAME_OVER:
      return `
        <section class="card">
          <div class="h1">Encerramento</div>
          ${kpiHTML()}
          <div class="formblock">
            <div class="label">RESULTADO</div>
            <div class="value">Vitória: ${S.winner === "COALIZAO" ? "COALIZÃO POPULAR" : "ORDEM SOBERANA"}</div>
          </div>
          <div class="row">
            <button class="btn" id="revealRoles">REVELAR PAPÉIS</button>
            <button class="btn primary" id="newSession">NOVA SESSÃO</button>
          </div>
          <div id="rolesOut" class="list"></div>
        </section>
      `;


    case Phase.BOARD: {
      const del = getPlayerByIndex(S.delegadoIndex);
      const sup = (S.supervisorIndex !== null) ? getPlayerByIndex(S.supervisorIndex) : null;
      const alive = alivePlayers();
      const eliminated = S.players.filter(p=>!p.vivo);
      const direct = (S.decretos >= 4);

      const trackBar = (label, cur, max, kind) => {
        const filled = Math.min(max, Math.max(0, cur));
        const blocks = Array.from({length:max}).map((_,i)=>{
          const on = i < filled;
          const cls = on ? (kind==="ok" ? "ok" : "bad") : "";
          const txt = on ? "■" : "□";
          return `<span class="track ${cls}">${txt}</span>`;
        }).join("");
        return `
          <div class="formblock">
            <div class="label">${label}</div>
            <div class="value"><span class="trackline">${blocks}</span></div>
          </div>
        `;
      };

      return `
        <section class="card">
          <div class="h1">Tabuleiro</div>
          ${kpiHTML()}

          <div class="formgrid">
            <div class="formblock">
              <div class="label">DELEGADO CENTRAL</div>
              <div class="value">${escapeHtml(del.nome)}</div>
            </div>
            <div class="formblock">
              <div class="label">REGIME</div>
              <div class="value">${direct ? "NOMEAÇÃO DIRETA ATIVA (SEM VETO)" : "PROCEDIMENTO PADRÃO"}</div>
            </div>
          </div>

          ${trackBar("ACORDOS CIVIS", S.acordos, 5, "ok")}
          ${trackBar("DECRETOS DE DOMÍNIO", S.decretos, 6, "bad")}

          <div class="formblock">
            <div class="label">CRISE</div>
            <div class="value">Governo rejeitado acumula crise. Ao atingir 3, vira projeto automático e zera.</div>
          </div>
          <div class="badge" style="justify-content:center;font-size:16px;">
            <span class="dot"></span> MARCADOR DE CRISE: <b>${S.crise}/3</b>
          </div>

          <hr class="hr" />

          <div class="formblock">
            <div class="label">PARTICIPANTES (VIVOS)</div>
            <div class="value">${alive.map(p=>`• ${escapeHtml(p.nome)}`).join("\\n") || "—"}</div>
          </div>

          <div class="formblock">
            <div class="label">ELIMINADOS</div>
            <div class="value">${eliminated.map(p=>`• ${escapeHtml(p.nome)}`).join("\\n") || "—"}</div>
          </div>

          <div class="formblock">
            <div class="label">REGISTRO DE OCORRÊNCIAS</div>
            <div class="value">${(S.log || []).slice(-12).map(x=>`• ${escapeHtml(x)}`).join("\\n") || "—"}</div>
          </div>

          <div class="row">
            <button class="btn" id="backToRound">VOLTAR</button>
            <button class="btn primary" id="goPickFromBoard">CONTINUAR</button>
          </div>
        </section>
      `;
    }

    default:
      return `<section class="card"><div class="h1">Tela não mapeada</div></section>`;
  }
}

function bind(){
  switch(S.phase){

    case Phase.HOME:
      document.getElementById("goCreate").onclick = () => setPhase(Phase.PLAYERS);
      break;

    case Phase.PLAYERS: {
      document.getElementById("addPlayer").onclick = () => {
        if (S.playersDraft.length < 7){
          S.playersDraft.push("");
          save(S);
          render();
        }
      };

      document.getElementById("playersList").addEventListener("input", (e) => {
        const el = e.target;
        if (!el.matches("input[data-idx]")) return;
        const idx = Number(el.dataset.idx);
        S.playersDraft[idx] = el.value;
        save(S);
      });

      document.getElementById("confirmPlayers").onclick = () => {
        const names = S.playersDraft.map(s=>s.trim()).filter(Boolean);
        const errEl = document.getElementById("playersError");

        if (names.length < 5 || names.length > 7){
          errEl.style.display = "block";
          errEl.textContent = "Informe entre 5 e 7 nomes.";
          return;
        }

        const set = new Set(names.map(n => n.toLowerCase()));
        if (set.size !== names.length){
          errEl.style.display = "block";
          errEl.textContent = "Não use nomes repetidos.";
          return;
        }

        S.players = names.map((nome,i)=>({ id:i+1, nome, papel:null, vivo:true }));

        S.delegadoIndex = 0;
        S.supervisorIndex = null;
        S.supervisorAnteriorIndex = null;
        S.currentIndex = 0;

        S.deck = buildDeck();
        S.discard = [];

        S.acordos = 0;
        S.decretos = 0;
        S.crise = 0;
        S.rodada = 1;
        S.log = [];
        S.winner = null;
        S.directNominationActive = false;

        const counts = roleCounts(S.players.length);
        const pool = [
          ...Array(counts.coalizao).fill(Roles.COALIZAO),
          ...Array(counts.ordem).fill(Roles.ORDEM),
          ...Array(counts.regente).fill(Roles.REGENTE),
        ];
        shuffle(pool);
        S.players.forEach((p,i)=>p.papel = pool[i]);

        save(S);
        setPhase(Phase.CONFIRM);
      };
      break;
    }

    case Phase.CONFIRM:
      document.getElementById("editNames").onclick = () => setPhase(Phase.PLAYERS);
      document.getElementById("startDeal").onclick = () => setPhase(Phase.DEAL_INTRO);
      break;

    case Phase.DEAL_INTRO:
      document.getElementById("beginDeal").onclick = () => setPhase(Phase.PASS_TO);
      break;

    case Phase.PASS_TO:
      document.getElementById("imHere").onclick = () => setPhase(Phase.SHOW_ROLE);
      break;

    case Phase.SHOW_ROLE:
      document.getElementById("roleOk").onclick = () => {};
      document.getElementById("passNext").onclick = () => {
        if (S.currentIndex < S.players.length - 1){
          S.currentIndex += 1;
          save(S);
          setPhase(Phase.PASS_TO);
        }else{
          S.currentIndex = 0;
          save(S);
          setPhase(Phase.ROUND_START);
        }
      };
      break;

    case Phase.ROUND_START:
      document.getElementById("goBoard").onclick = () => setPhase(Phase.BOARD);
      document.getElementById("goPickSupervisor").onclick = () => setPhase(Phase.PICK_SUPERVISOR);
      break;

    case Phase.BOARD:
      document.getElementById("backToRound").onclick = () => setPhase(Phase.ROUND_START);
      document.getElementById("goPickFromBoard").onclick = () => setPhase(Phase.PICK_SUPERVISOR);
      break;

    case Phase.PICK_SUPERVISOR:
      document.querySelectorAll("[data-picksup]").forEach(btn=>{
        btn.onclick = () => {
          const idx = Number(btn.dataset.picksup);
          S.supervisorIndex = idx;
          save(S);

          if (S.decretos >= 4){
            S.hand3 = drawN(3);
            S.legSupSelected = [];
            save(S);
            setPhase(Phase.LEGISLATE_SUP);
            return;
          }

          S.debateEndsAt = Date.now() + 60_000;
          save(S);
          setPhase(Phase.DEBATE);
        };
      });
      break;

    case Phase.DEBATE:
      startDebateTimer();
      break;

    case Phase.VOTE_PASS_TO:
      document.getElementById("voteImHere").onclick = () => setPhase(Phase.VOTE);
      break;

    case Phase.VOTE:
      document.getElementById("btnApprove").onclick = () => registerVote(true);
      document.getElementById("btnReject").onclick = () => registerVote(false);
      break;

    case Phase.VOTE_RESULT:
      document.getElementById("afterVote").onclick = () => afterVote();
      break;

    case Phase.LEGISLATE_SUP:
      bindLegSup();
      break;

    case Phase.LEGISLATE_DEL:
      bindLegDel();
      break;

    case Phase.POLICY_REVEAL:
      document.getElementById("afterPolicy").onclick = () => afterPolicy();
      break;

    case Phase.POWER_AUDIT:
      document.querySelectorAll("[data-audit]").forEach(btn=>{
        btn.onclick = () => {
          const id = Number(btn.dataset.audit);
          const target = getPlayerById(id);

          let result = "ORDEM";
          if (target.papel === Roles.COALIZAO) result = "COALIZÃO";
          if (target.papel === Roles.REGENTE) result = "ORDEM";

          alert(`LEALDADE DETECTADA: ${result}\n\n(Informação privada do Delegado)`);
          proceedToNextRound();
        };
      });
      break;

    case Phase.POWER_KILL:
      document.querySelectorAll("[data-kill]").forEach(btn=>{
        btn.onclick = () => {
          const id = Number(btn.dataset.kill);
          const target = getPlayerById(id);
          target.vivo = false;
          S.log.push(`Neutralização: ${target.nome}`);

          if (target.papel === Roles.REGENTE){
            S.winner = "COALIZAO";
            save(S);
            setPhase(Phase.GAME_OVER);
            return;
          }

          proceedToNextRound();
        };
      });
      break;

    case Phase.GAME_OVER:
      document.getElementById("newSession").onclick = () => resetAll();
      document.getElementById("revealRoles").onclick = () => {
        const out = document.getElementById("rolesOut");
        out.innerHTML = S.players.map(p=>{
          const role =
            p.papel === Roles.COALIZAO ? "COALIZÃO" :
            p.papel === Roles.ORDEM ? "ORDEM" : "REGENTE";
          return `<div class="badge"><span class="dot"></span> <b>${escapeHtml(p.nome)}</b> — ${role} ${p.vivo? "" : "(eliminado)"}</div>`;
        }).join("");
      };
      break;
  }
}

let debateInterval = null;

function startDebateTimer(){
  if (debateInterval) clearInterval(debateInterval);

  const tick = () => {
    const leftMs = Math.max(0, S.debateEndsAt - Date.now());
    const leftS = Math.ceil(leftMs / 1000);
    const el = document.getElementById("debateTimer");
    if (el) el.textContent = String(leftS);

    if (leftMs <= 0){
      clearInterval(debateInterval);
      debateInterval = null;

      S.votes = {};
      S.voteTurnIndex = 0;
      save(S);
      setPhase(Phase.VOTE_PASS_TO);
    }
  };

  tick();
  debateInterval = setInterval(tick, 250);
}

function registerVote(value){
  const alive = alivePlayers();
  const target = alive[S.voteTurnIndex];
  S.votes[target.id] = value;
  save(S);

  S.voteTurnIndex += 1;
  if (S.voteTurnIndex >= alive.length){
    S.lastVoteApproved = majorityApproved();
    save(S);
    setPhase(Phase.VOTE_RESULT);
  }else{
    save(S);
    setPhase(Phase.VOTE_PASS_TO);
  }
}

function afterVote(){
  if (S.lastVoteApproved){
    S.hand3 = drawN(3);
    S.legSupSelected = [];
    save(S);
    setPhase(Phase.LEGISLATE_SUP);
    return;
  }

  S.crise += 1;

  if (S.crise >= 3){
    const auto = draw();
    applyPolicy(auto, { auto:true });
    S.crise = 0;

    if (checkWin()){
      save(S);
      setPhase(Phase.GAME_OVER);
      return;
    }

    proceedToNextRound();
    return;
  }

  proceedToNextRound();
}

function bindLegSup(){
  S.legSupSelected = S.legSupSelected || [];
  const buttons = document.querySelectorAll("[data-legsup]");

  buttons.forEach(btn=>{
    btn.onclick = () => {
      const idx = Number(btn.dataset.legsup);
      const exists = S.legSupSelected.includes(idx);

      if (exists){
        S.legSupSelected = S.legSupSelected.filter(x => x !== idx);
      }else{
        if (S.legSupSelected.length >= 2) return;
        S.legSupSelected.push(idx);
      }

      buttons.forEach(b=>{
        const i = Number(b.dataset.legsup);
        b.classList.toggle("selected", S.legSupSelected.includes(i));
      });

      document.getElementById("legSupHint").textContent = `Selecionado: ${S.legSupSelected.length}/2`;
      document.getElementById("legSupSend").disabled = (S.legSupSelected.length !== 2);

      save(S);
    };
  });

  document.getElementById("legSupSend").onclick = () => {
    const picks = S.legSupSelected.map(i => S.hand3[i]);
    const remaining = S.hand3.filter((_,i)=>!S.legSupSelected.includes(i));
    S.discard.push(...remaining);

    S.hand2 = picks;
    save(S);
    setPhase(Phase.LEGISLATE_DEL);
  };
}

function bindLegDel(){
  let selected = null;
  const buttons = document.querySelectorAll("[data-legdel]");

  buttons.forEach(btn=>{
    btn.onclick = () => {
      selected = Number(btn.dataset.legdel);
      buttons.forEach(b=>b.classList.remove("selected"));
      btn.classList.add("selected");
      document.getElementById("legDelApprove").disabled = false;
    };
  });

  document.getElementById("legDelApprove").onclick = () => {
    const chosen = S.hand2[selected];
    const rest = S.hand2.filter((_,i)=>i!==selected);
    S.discard.push(...rest);

    applyPolicy(chosen, { auto:false });

    save(S);
    setPhase(Phase.POLICY_REVEAL);
  };
}

function applyPolicy(card, { auto }){
  S.lastPolicy = card;
  if (card === Cards.ACORDO){
    S.acordos += 1;
    S.log.push(auto ? "Crise: Acordo automático" : "Acordo aprovado");
  }else{
    S.decretos += 1;
    S.log.push(auto ? "Crise: Decreto automático" : "Decreto aprovado");
  }
}

function afterPolicy(){
  if (S.decretos >= 4) S.directNominationActive = true;

  if (checkWin()){
    save(S);
    setPhase(Phase.GAME_OVER);
    return;
  }

  if (S.lastPolicy === Cards.DECRETO){
    const n = S.players.length;
    const d = S.decretos;

    if (n < 7 && d === 3){
      save(S);
      setPhase(Phase.POWER_AUDIT);
      return;
    }

    if (n === 7 && d === 2){
      save(S);
      setPhase(Phase.POWER_AUDIT);
      return;
    }
    if (n === 7 && d === 3){
      save(S);
      setPhase(Phase.POWER_KILL);
      return;
    }

    if (d === 5){
      save(S);
      setPhase(Phase.POWER_KILL);
      return;
    }
  }

  proceedToNextRound();
}

function proceedToNextRound(){
  S.hand3 = null;
  S.hand2 = null;
  S.legSupSelected = [];
  S.votes = {};
  S.voteTurnIndex = 0;
  S.lastVoteApproved = null;

  S.supervisorAnteriorIndex = S.supervisorIndex;
  S.supervisorIndex = null;

  S.delegadoIndex = nextAliveIndex(S.delegadoIndex);
  S.rodada += 1;

  save(S);
  setPhase(Phase.ROUND_START);
}

render();
