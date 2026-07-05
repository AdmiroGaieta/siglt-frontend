/**
 * Menu lateral: cruza (1) módulos licenciados para este cliente — GET /api/Sistema/modulos —
 * com (2) as permissões do utilizador autenticado (claims do JWT), igual ao que o backend valida.
 */
const SigltMenu = (() => {

  const ITENS = [
    { view: "dashboard",    label: "Dashboard",  icone: "📊", modulo: "Dashboard", permissaoPrefixo: "Dashboard" },
    { view: "rh",            label: "RH",          icone: "👥", modulo: "RH",        permissaoPrefixo: "RH" },
    { view: "motoristas",   label: "Motoristas",  icone: "🚚", modulo: "Frota",     permissaoPrefixo: "Frota" },
    { view: "veiculos",     label: "Frota",       icone: "🚛", modulo: "Frota",     permissaoPrefixo: "Frota" },
    { view: "logistica",    label: "Logística",   icone: "📦", modulo: "Logistica", permissaoPrefixo: "Logistica" },
    { view: "stock",        label: "Stock",       icone: "📦", modulo: "Stock",     permissaoPrefixo: "Stock" }
  ];

  let modulosLicenciados = [];

  async function carregarModulosLicenciados() {
    try {
      modulosLicenciados = await SigltApi.get("/Sistema/modulos");
    } catch {
      modulosLicenciados = [];
    }
    return modulosLicenciados;
  }

  function itemVisivel(item) {
    const licenciado = !item.modulo || modulosLicenciados.includes(item.modulo);
    const autorizado = SigltAuth.temPermissaoModulo(item.permissaoPrefixo);
    return licenciado && autorizado;
  }

  function renderizar(viewAtiva) {
    const sidebar = document.getElementById("sidebar");
    const partes = [];

    partes.push('<div class="menu-secao-titulo">Operação</div>');
    for (const item of ITENS) {
      if (!itemVisivel(item)) continue;
      partes.push(
        `<a href="#" class="menu-item ${item.view === viewAtiva ? "ativo" : ""}" data-view="${item.view}">` +
        `<span>${item.icone}</span><span>${item.label}</span></a>`
      );
    }

    if (SigltAuth.isAdministrador()) {
      partes.push('<div class="menu-secao-titulo">Administração</div>');
      partes.push(
        `<a href="#" class="menu-item ${viewAtiva === "usuarios" ? "ativo" : ""}" data-view="usuarios">` +
        `<span>👑</span><span>Usuários</span></a>`
      );
    }

    sidebar.innerHTML = partes.join("");

    sidebar.querySelectorAll(".menu-item").forEach(a => {
      a.addEventListener("click", (ev) => {
        ev.preventDefault();
        SigltRouter.irPara(a.dataset.view);
      });
    });
  }

  return { carregarModulosLicenciados, renderizar };
})();
