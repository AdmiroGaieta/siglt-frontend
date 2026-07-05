SigltRouter.registar("usuarios", async (container) => {

  if (!SigltAuth.isAdministrador()) {
    container.innerHTML = `<div class="vazio">Apenas o perfil Administrador pode acedir a esta secção.</div>`;
    return;
  }

  async function carregar() {
    const [usuarios, perfis] = await Promise.all([
      SigltApi.get("/Usuario"),
      SigltApi.get("/Perfil")
    ]);
    renderizarTabela(usuarios, perfis);
  }

  function renderizarTabela(usuarios, perfis) {
    const linhas = usuarios.map(u => `
      <tr>
        <td>${SigltUi.escapeHtml(u.nomeUtilizador)}</td>
        <td>${SigltUi.escapeHtml(u.email)}</td>
        <td><span class="badge badge-azul">${SigltUi.escapeHtml(u.perfil)}</span></td>
        <td>${u.ativo ? '<span class="badge badge-verde">Ativo</span>' : '<span class="badge badge-vermelho">Inativo</span>'}</td>
        <td>${SigltUi.formatarDataHora(u.ultimoLogin)}</td>
        <td>
          <button class="botao botao-secundario" data-id="${u.id}" data-ativo="${u.ativo}" data-acao="alternar">
            ${u.ativo ? "Desativar" : "Ativar"}
          </button>
          <button class="botao botao-secundario" data-id="${u.id}" data-acao="redefinir">Redefinir password</button>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="6" class="vazio">Nenhum utilizador registado.</td></tr>`;

    container.innerHTML = `
      <div class="cabecalho-view">
        <h1>Usuários</h1>
        <button class="botao botao-primario" id="btn-novo-usuario">+ Novo Usuário</button>
      </div>
      <div class="cartao">
        <table class="tabela">
          <thead><tr><th>Utilizador</th><th>Email</th><th>Perfil</th><th>Estado</th><th>Último login</th><th></th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    `;

    document.getElementById("btn-novo-usuario").addEventListener("click", () => abrirModalNovo(perfis));

    container.querySelectorAll('[data-acao="alternar"]').forEach(btn =>
      btn.addEventListener("click", async () => {
        const ativoAtual = btn.dataset.ativo === "true";
        try {
          await SigltApi.patch(`/Usuario/${btn.dataset.id}/ativo`, !ativoAtual);
          SigltUi.toast(ativoAtual ? "Utilizador desativado." : "Utilizador ativado.", "sucesso");
          await carregar();
        } catch (e) { SigltUi.erro(e); }
      }));

    container.querySelectorAll('[data-acao="redefinir"]').forEach(btn =>
      btn.addEventListener("click", async () => {
        const novaPassword = prompt("Nova password para este utilizador:");
        if (!novaPassword) return;
        try {
          await SigltApi.post(`/Usuario/${btn.dataset.id}/redefinir-password`, novaPassword);
          SigltUi.toast("Password redefinida com sucesso.", "sucesso");
        } catch (e) { SigltUi.erro(e); }
      }));
  }

  function abrirModalNovo(perfis) {
    const opcoesPerfil = perfis.map(p => `<option value="${p.id}">${SigltUi.escapeHtml(p.nome)}</option>`).join("");

    const modal = SigltUi.abrirModal(`
      <h2>Novo Usuário</h2>
      <form id="form-novo-usuario">
        <div class="campo"><label>Nome de utilizador</label><input type="text" id="us-nome" required></div>
        <div class="campo"><label>Email</label><input type="email" id="us-email" required></div>
        <div class="campo"><label>Password</label><input type="password" id="us-password" required></div>
        <div class="campo"><label>Perfil</label><select id="us-perfil">${opcoesPerfil}</select></div>
        <div class="modal-acoes">
          <button type="button" class="botao botao-secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="botao botao-primario">Guardar</button>
        </div>
      </form>
    `);

    modal.querySelector("#btn-cancelar").addEventListener("click", () => SigltUi.fecharModal());

    modal.querySelector("#form-novo-usuario").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        await SigltApi.post("/Usuario", {
          nomeUtilizador: document.getElementById("us-nome").value,
          email: document.getElementById("us-email").value,
          password: document.getElementById("us-password").value,
          perfilId: Number(document.getElementById("us-perfil").value),
          funcionarioId: null
        });
        SigltUi.fecharModal();
        SigltUi.toast("Utilizador criado com sucesso.", "sucesso");
        await carregar();
      } catch (e) {
        SigltUi.erro(e);
      }
    });
  }

  await carregar();
});
