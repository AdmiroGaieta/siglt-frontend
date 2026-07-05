/**
 * Helpers de UI reutilizáveis: toast, formatação, modal genérico.
 */
const SigltUi = (() => {
  function toast(mensagem, tipo = "info") {
    const el = document.getElementById("toast");
    el.textContent = mensagem;
    el.className = "toast" + (tipo === "erro" ? " erro" : tipo === "sucesso" ? " sucesso" : "");
    el.hidden = false;
    clearTimeout(el._timer);
    el._timer = setTimeout(() => { el.hidden = true; }, 3500);
  }

  function erro(e) {
    toast(e?.message || "Ocorreu um erro.", "erro");
  }

  function formatarData(valor) {
    if (!valor) return "—";
    const d = new Date(valor);
    return d.toLocaleDateString("pt-PT");
  }

  function formatarDataHora(valor) {
    if (!valor) return "—";
    const d = new Date(valor);
    return d.toLocaleString("pt-PT");
  }

  function formatarNumero(valor) {
    if (valor === null || valor === undefined) return "—";
    return Number(valor).toLocaleString("pt-PT");
  }

  function abrirModal(html) {
    fecharModal();
    const fundo = document.createElement("div");
    fundo.className = "modal-fundo";
    fundo.id = "modal-fundo-ativo";
    fundo.innerHTML = `<div class="modal-caixa">${html}</div>`;
    fundo.addEventListener("click", (ev) => {
      if (ev.target === fundo) fecharModal();
    });
    document.body.appendChild(fundo);
    return fundo;
  }

  function fecharModal() {
    const existente = document.getElementById("modal-fundo-ativo");
    if (existente) existente.remove();
  }

  function escapeHtml(texto) {
    if (texto === null || texto === undefined) return "";
    return String(texto)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  return { toast, erro, formatarData, formatarDataHora, formatarNumero, abrirModal, fecharModal, escapeHtml };
})();
