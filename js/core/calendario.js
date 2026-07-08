// =============================================================
// Núcleo (Core) — Calendário (O Relógio Dia a Dia)
// Apêndice (pré-Passo 31): o tempo do universo passa a transcorrer
// como na vida real — um dia de cada vez.
//
// Este arquivo é AGNÓSTICO: só cuida da DATA. A cada dia emite
// DIA_AVANCOU; ao virar o ano (31/12 -> 01/01) sincroniza o
// `anoAtual` e emite TEMPORADA_FINALIZADA. Não conhece competições
// (quem reage é o Agendador) e não toca o DOM.
//
// Depende de eventBus.js e de gameLoop.js (ANO_PRESENTE/anoAtual),
// carregados antes deste arquivo.
// =============================================================

// Dias por mês (sem ano bissexto — simplificação de 365 dias).
const DIAS_POR_MES = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

// Data atual do universo. Começa em 1º de janeiro do ano presente.
let dataAtual = { ano: ANO_PRESENTE, mes: 1, dia: 1 };

function _pad2(n) {
  return n < 10 ? "0" + n : "" + n;
}

// "YYYY-MM-DD" — usado para carimbar os fatos (dataSimulada).
function dataParaISO(d) {
  return `${d.ano}-${_pad2(d.mes)}-${_pad2(d.dia)}`;
}

// "DD/MM/AAAA" — usado para exibição humana.
function dataParaTextoBR(d) {
  return `${_pad2(d.dia)}/${_pad2(d.mes)}/${d.ano}`;
}

// Converte um "dia do ano" (1..365) em { mes, dia }.
function diaDoAnoParaData(diaDoAno) {
  let restante = diaDoAno;
  for (let mes = 1; mes <= 12; mes++) {
    if (restante <= DIAS_POR_MES[mes - 1]) {
      return { mes: mes, dia: restante };
    }
    restante -= DIAS_POR_MES[mes - 1];
  }
  return { mes: 12, dia: 31 };
}

// Gera as datas (mês/dia) das rodadas, espalhadas pelo ano. O
// calendário se repete a cada temporada (datas independentes do ano).
function gerarCalendarioRodadas(numeroRodadas) {
  const datas = [];
  for (let i = 0; i < numeroRodadas; i++) {
    const diaDoAno = Math.round(((i + 0.5) * 365) / numeroRodadas);
    datas.push(diaDoAnoParaData(diaDoAno));
  }
  return datas;
}

// Reinicia o relógio (usado no "Big Bang"): volta a 1º de janeiro.
function reiniciarCalendario() {
  dataAtual = { ano: ANO_PRESENTE, mes: 1, dia: 1 };
  anoAtual = ANO_PRESENTE;
}

// Avança o relógio em UM dia. Emite DIA_AVANCOU sempre; ao virar o
// ano, sincroniza `anoAtual` e emite TEMPORADA_FINALIZADA.
function avancarUmDia() {
  dataAtual.dia++;
  let virouAno = false;
  let anoFinalizado = dataAtual.ano;

  if (dataAtual.dia > DIAS_POR_MES[dataAtual.mes - 1]) {
    dataAtual.dia = 1;
    dataAtual.mes++;
    if (dataAtual.mes > 12) {
      dataAtual.mes = 1;
      anoFinalizado = dataAtual.ano;
      dataAtual.ano++;
      anoAtual = dataAtual.ano; // sincroniza o ano do jogo com o calendário
      virouAno = true;
    }
  }

  EventBus.emit("DIA_AVANCOU", {
    data: { ano: dataAtual.ano, mes: dataAtual.mes, dia: dataAtual.dia },
    iso: dataParaISO(dataAtual),
  });

  if (virouAno) {
    EventBus.emit("TEMPORADA_FINALIZADA", {
      anoFinalizado: anoFinalizado,
      anoNovo: dataAtual.ano,
    });
  }
}
