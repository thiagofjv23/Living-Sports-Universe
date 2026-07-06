// =============================================================
// Núcleo (Core) — Event Bus (Barramento de Eventos)
// Passo 3 do MVP: base da Arquitetura Orientada a Eventos (Pub/Sub).
//
// O EventBus é o "sistema nervoso" do universo: quem gera fatos
// (ex.: um módulo esportivo) apenas PUBLICA (emit) um evento, sem
// saber quem vai ouvir. Quem tem interesse ASSINA (on) o evento.
// Isso desacopla totalmente o produtor do consumidor.
//
// Este arquivo é AGNÓSTICO: não conhece esportes nem manipula DOM.
// =============================================================

const EventBus = {
  // Mapa de evento -> lista de callbacks (ouvintes) registrados.
  ouvintes: {},

  // Assina: registra um callback para ser chamado quando o evento
  // for emitido.
  on(evento, callback) {
    if (!this.ouvintes[evento]) {
      this.ouvintes[evento] = [];
    }
    this.ouvintes[evento].push(callback);
  },

  // Publica: dispara o evento, entregando o payload a todos os
  // ouvintes registrados para ele.
  emit(evento, payload) {
    const inscritos = this.ouvintes[evento] || [];
    inscritos.forEach((callback) => callback(payload));
  },
};
