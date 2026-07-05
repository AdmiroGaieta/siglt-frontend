/**
 * Router simples baseado em hash (#dashboard, #funcionarios, ...).
 * Cada view regista-se em SigltViews[nome] = { render: async (container) => {} }.
 */
const SigltRouter = (() => {
  const SigltViews = {};

  function registar(nome, render) {
    SigltViews[nome] = { render };
  }

  function viewPadrao() { return "dashboard"; }

  async function irPara(viewNome) {
    window.location.hash = viewNome;
  }

  async function renderizarAtual() {
    let viewNome = window.location.hash.replace("#", "") || viewPadrao();

    if (!SigltViews[viewNome]) {
      viewNome = viewPadrao();
    }

    SigltMenu.renderizar(viewNome);

    const container = document.getElementById("conteudo");
    container.innerHTML = '<div class="carregando">A carregar…</div>';

    try {
      await SigltViews[viewNome].render(container);
    } catch (e) {
      container.innerHTML = `<div class="vazio">Não foi possível carregar esta secção.<br>${SigltUi.escapeHtml(e.message)}</div>`;
    }
  }

  window.addEventListener("hashchange", renderizarAtual);

  return { registar, renderizarAtual, irPara };
})();
