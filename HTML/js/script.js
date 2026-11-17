/* ============================================================
   Club da Barba | script.js
   ============================================================ */

/* 1. CONFIGURAÇÃO: troque aqui quando tiver os dados oficiais */
const CFG = {
  whats: '5500000000000',           // EXEMPLO: 55 + DDD + número, só dígitos (coloque o seu para testar)
  insta: 'clubedabarba2025filial',  // @ do Instagram, sem o @
  endereco: 'Rua Santa Isabel, 15',
  cidade: ''                        // EXEMPLO: 'Bairro, Cidade - UF' (melhora o botão "Como chegar")
};

// foto: caminho da imagem (deixe '' para mostrar a inicial do nome)
// pausa: início do intervalo de 1h de cada barbeiro (valores de EXEMPLO)
// As fotos de Roger e Nico são de EXEMPLO: troque se estiverem trocadas
const EQUIPE = [
  { id: 'roger', nome: 'Roger Bento', tags: ['Corte afro', 'Pigmentação', 'Barboterapia'], foto: 'img/foto-2.jpg', pausa: '12:00' },
  { id: 'andy', nome: 'Andy', sub: 'Anderson da Silva Alves', tags: ['Crianças', 'Corte na tesoura'], foto: 'img/andy.jpg', pausa: '13:00' },
  { id: 'nico', nome: 'Nico', sub: 'Nicolas de Oliveira', tags: ['Corte fade'], foto: 'img/foto-3.jpg', pausa: '14:00' },
  { id: 'natalia', nome: 'Natália', tags: ['Corte degradê'], foto: '', pausa: '15:00' }
];

// preco: texto mostrado na tabela (valores de EXEMPLO)
// agenda: 1 = aparece na lista do formulário de agendamento
const SERVICOS = [
  { id: 'adulto', nome: 'Corte adulto', desc: 'Fade, degradê, tesoura e corte afro', preco: 'a partir de R$ 40', agenda: 1 },
  { id: 'infantil', nome: 'Corte infantil', desc: 'Atendimento calmo e com mais atenção', preco: 'R$ 45', agenda: 1 },
  { id: 'combo', nome: 'Corte, barba e sobrancelha', desc: 'Combo completo', preco: 'Sob consulta', agenda: 1 },
  { id: 'barba', nome: 'Barba e barboterapia', desc: 'Cuidado completo da barba', preco: 'Sob consulta', agenda: 1 },
  { id: 'sobrancelha', nome: 'Sobrancelha', desc: 'Design e acabamento', preco: 'Sob consulta', agenda: 1 },
  { id: 'pigmento', nome: 'Pigmentação', desc: 'Especialidade do Roger', preco: 'Sob consulta', agenda: 1 },
  { id: 'plano', nome: 'Plano mensal', desc: 'Pergunte ao seu barbeiro', preco: 'Sob consulta', agenda: 0 }
];

// Horários em minutos desde a meia-noite
const ABRE = 9 * 60;    // abre às 9h
const FECHA = 20 * 60;  // fecha às 20h
const PASSO = 40;       // cada atendimento: 40 min
const PAUSA = 60;       // intervalo do barbeiro: 1h
const KEY = 'cdb_agendamentos'; // nome onde os agendamentos ficam salvos no navegador

/* 2. FUNÇÕES AUXILIARES */
const $ = s => document.querySelector(s);
const hm = m => String(Math.floor(m / 60)).padStart(2, '0') + ':' + String(m % 60).padStart(2, '0'); // 540 -> "09:00"
const mm = h => { const [a, b] = h.split(':'); return +a * 60 + +b; };                              // "09:00" -> 540
const ler = () => { try { return JSON.parse(localStorage.getItem(KEY)) || []; } catch { return []; } };
const gravar = l => { try { localStorage.setItem(KEY, JSON.stringify(l)); } catch {} };
const hoje = () => { const d = new Date(); return new Date(d - d.getTimezoneOffset() * 6e4).toISOString().slice(0, 10); };

/* 3. CONTEÚDO: cria equipe, tabela de preços, listas do formulário e links */
$('#equipeGrade').innerHTML = EQUIPE.map(b => `
  <article class="membro">
    ${b.foto ? `<img src="${b.foto}" alt="Foto de ${b.nome}" loading="lazy">` : `<div class="avatar" aria-hidden="true">${b.nome[0]}</div>`}
    <div class="corpo">
      <h3>${b.nome}</h3>${b.sub ? `<small>${b.sub}</small>` : ''}
      <ul class="chips">${b.tags.map(t => `<li>${t}</li>`).join('')}</ul>
      <a class="btn vazio" href="#agendar" data-b="${b.id}">Agendar com ${b.nome.split(' ')[0]}</a>
    </div>
  </article>`).join('');

$('#tabela').innerHTML = SERVICOS.map(s => `
  <li><div><b>${s.nome}</b><small>${s.desc}</small></div><span class="ponto"></span><span class="preco">${s.preco}</span></li>`).join('');

$('#barbeiro').innerHTML = '<option value="">Selecione</option>' + EQUIPE.map(b => `<option value="${b.id}">${b.nome}</option>`).join('');
$('#servico').innerHTML = '<option value="">Selecione</option>' + SERVICOS.filter(s => s.agenda).map(s => `<option value="${s.id}">${s.nome}</option>`).join('');

$('#zap').href = `https://wa.me/${CFG.whats}?text=${encodeURIComponent('Olá! Vim pelo site do Club da Barba.')}`;
$('#insta').href = 'https://instagram.com/' + CFG.insta;
$('#mapa').href = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(CFG.endereco + ' ' + CFG.cidade);
$('#ano').textContent = new Date().getFullYear();

/* 4. AVISO "ABERTO AGORA" no início da página */
function status() {
  const d = new Date(), dia = d.getDay(), m = d.getHours() * 60 + d.getMinutes(), el = $('#status');
  const aberto = dia > 0 && m >= ABRE && m < FECHA; // dia 0 = domingo (fechado)
  el.classList.toggle('off', !aberto);
  el.textContent = aberto ? 'Aberto agora, até as 20h' :
    dia > 0 && m < ABRE ? 'Fechado agora. Abrimos hoje às 9h' :
    'Fechado agora. Abrimos ' + (dia === 0 || (dia === 6 && m >= FECHA) ? 'segunda' : 'amanhã') + ' às 9h';
}
status();
setInterval(status, 6e4); // atualiza a cada minuto

/* 5. HORÁRIOS DISPONÍVEIS (por barbeiro e data) */
let escolhida = ''; // horário que o cliente clicou
function horarios() {
  const b = EQUIPE.find(x => x.id === $('#barbeiro').value), d = $('#data').value, box = $('#horas');
  escolhida = '';
  if (!b || !d) { box.innerHTML = '<p class="dica">Escolha o barbeiro e a data para ver os horários.</p>'; return; }
  if (new Date(d + 'T12:00').getDay() === 0) { box.innerHTML = '<p class="dica">Domingo fechado. Escolha de segunda a sábado.</p>'; return; }
  const ocup = ler().filter(a => a.barbeiro === b.id && a.data === d).map(a => a.hora); // já reservados
  const p = mm(b.pausa), agora = new Date();
  const min = d === hoje() ? agora.getHours() * 60 + agora.getMinutes() : -1; // se for hoje, esconde horários que já passaram
  let h = '';
  for (let t = ABRE; t + PASSO <= FECHA; t += PASSO) {
    const livre = !(t < p + PAUSA && t + PASSO > p) && !ocup.includes(hm(t)) && t > min; // fora do intervalo, não reservado e no futuro
    h += `<button type="button" class="hora" aria-pressed="false"${livre ? '' : ' disabled'}>${hm(t)}</button>`;
  }
  box.innerHTML = h;
}
$('#data').min = hoje(); // não deixa escolher data passada
['#barbeiro', '#data'].forEach(s => $(s).addEventListener('change', horarios));

$('#horas').addEventListener('click', e => {
  const bt = e.target.closest('.hora');
  if (!bt || bt.disabled) return;
  document.querySelectorAll('.hora').forEach(x => x.setAttribute('aria-pressed', 'false'));
  bt.setAttribute('aria-pressed', 'true');
  escolhida = bt.textContent;
});

// botão "Agendar com ..." do card já escolhe o barbeiro no formulário
document.addEventListener('click', e => {
  const a = e.target.closest('[data-b]');
  if (a) { $('#barbeiro').value = a.dataset.b; horarios(); }
});

/* 6. AGENDAMENTO */
$('#form').addEventListener('submit', e => {
  e.preventDefault();
  const v = id => $(id).value.trim(), erro = $('#erro'), tel = v('#tel').replace(/\D/g, '');
  const mostrar = t => { erro.textContent = 'Atenção: ' + t; erro.hidden = false; };
  const falta = !v('#barbeiro') ? 'escolha o barbeiro.' : !v('#servico') ? 'escolha o serviço.' : !v('#data') ? 'escolha a data.' :
    !escolhida ? 'escolha um horário.' : v('#nome').length < 2 ? 'informe seu nome.' : tel.length < 10 ? 'informe um WhatsApp válido, com DDD.' : '';
  if (falta) return mostrar(falta);
  erro.hidden = true;

  const b = EQUIPE.find(x => x.id === v('#barbeiro')), s = SERVICOS.find(x => x.id === v('#servico')), lista = ler();
  if (lista.some(a => a.barbeiro === b.id && a.data === v('#data') && a.hora === escolhida)) {
    horarios();
    return mostrar('esse horário acabou de ser reservado. Escolha outro.');
  }
  const ag = { id: 'CDB-' + Date.now().toString(36).toUpperCase().slice(-5), barbeiro: b.id, servico: s.id, data: v('#data'), hora: escolhida, nome: v('#nome'), tel, especial: $('#especial').checked };
  lista.push(ag);
  gravar(lista);
  confirmar(ag, b, s);
});

// troca o formulário pelo resumo, com botão para enviar a confirmação no WhatsApp
function confirmar(a, b, s) {
  const data = a.data.split('-').reverse().join('/'), ok = $('#ok');
  const msg = `Olá! Agendei pelo site do Club da Barba.\nCódigo: ${a.id}\nBarbeiro: ${b.nome}\nServiço: ${s.nome}\nData: ${data} às ${a.hora}\nNome: ${a.nome}` + (a.especial ? '\nPreciso de mais tempo ou de um ambiente mais calmo.' : '');
  ok.innerHTML = `<h3>Agendamento confirmado</h3>
    <dl><dt>Código</dt><dd>${a.id}</dd><dt>Barbeiro</dt><dd>${b.nome}</dd><dt>Serviço</dt><dd>${s.nome}</dd><dt>Quando</dt><dd>${data} às ${a.hora}</dd></dl>
    <p class="sub">Tolerância de 20 minutos de atraso, para não prejudicar o próximo cliente. Não é preciso pagar antes.</p>
    <div class="acoes"><a class="btn" target="_blank" rel="noopener" href="https://wa.me/${CFG.whats}?text=${encodeURIComponent(msg)}">Enviar confirmação no WhatsApp</a><button class="btn vazio" type="button" id="novo">Novo agendamento</button></div>`;
  $('#form').hidden = true;
  ok.hidden = false;
  ok.focus();
  $('#novo').onclick = () => { ok.hidden = true; $('#form').hidden = false; $('#form').reset(); horarios(); };
}

/* 7. MENU DO CELULAR E AUMENTAR TEXTO */
const bg = $('#burger'), mn = $('#menu');
bg.onclick = () => bg.setAttribute('aria-expanded', mn.classList.toggle('open'));
mn.onclick = e => { if (e.target.tagName === 'A') { mn.classList.remove('open'); bg.setAttribute('aria-expanded', false); } };
$('#aa').onclick = e => e.currentTarget.setAttribute('aria-pressed', document.documentElement.classList.toggle('zoom'));