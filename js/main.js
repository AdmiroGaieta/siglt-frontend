(() => {
  async function iniciarApp() {
    const usuario = SigltAuth.carregarUsuarioDoToken();
    if (!usuario) {
      SigltAuth.irParaLogin();
      return;
    }

    SigltAuth.irParaApp();
    document.getElementById("topbar-nome").textContent =
      `${usuario.nomeUtilizador} · ${usuario.perfil}`;

    await SigltMenu.carregarModulosLicenciados();
    await SigltRouter.renderizarAtual();
  }

  document.getElementById("form-login").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const btn = document.getElementById("btn-login");
    const erroEl = document.getElementById("login-erro");
    erroEl.hidden = true;

    const utilizador = document.getElementById("login-utilizador").value.trim();
    const password = document.getElementById("login-password").value;

    btn.disabled = true;
    btn.textContent = "A entrar…";

    try {
      await SigltAuth.login(utilizador, password);
      document.getElementById("form-login").reset();
      await iniciarApp();
    } catch (e) {
      erroEl.textContent = e.message || "Credenciais inválidas.";
      erroEl.hidden = false;
    } finally {
      btn.disabled = false;
      btn.textContent = "Entrar";
    }
  });

  document.getElementById("btn-usuario-menu").addEventListener("click", (ev) => {
    ev.stopPropagation();
    const dropdown = document.getElementById("usuario-dropdown");
    dropdown.hidden = !dropdown.hidden;
  });

  document.addEventListener("click", () => {
    document.getElementById("usuario-dropdown").hidden = true;
  });

  document.getElementById("usuario-dropdown").addEventListener("click", (ev) => {
    const link = ev.target.closest("a");
    if (!link) return;
    ev.preventDefault();
    if (link.id === "btn-logout") {
      SigltAuth.logout();
    } else if (link.dataset.view) {
      SigltRouter.irPara(link.dataset.view);
    }
  });

  // Arranque
  if (SigltAuth.estaAutenticado()) {
    iniciarApp();
  } else {
    SigltAuth.irParaLogin();
  }
})();
