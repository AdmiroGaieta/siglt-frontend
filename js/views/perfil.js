SigltRouter.registar("perfil", async (container) => {
  const usuario = SigltAuth.getUsuario();
  const meuPerfil = await SigltApi.get("/Usuario/me");

  container.innerHTML = `
    <div class="cabecalho-view"><h1>Meu Perfil</h1></div>

    <div class="cartao" style="max-width:480px;margin-bottom:20px;">
      <form id="form-meu-perfil">
        <div class="campo"><label>Nome de utilizador</label><input type="text" value="${SigltUi.escapeHtml(meuPerfil.nomeUtilizador)}" disabled></div>
        <div class="campo"><label>Email</label><input type="email" id="pf-email" value="${SigltUi.escapeHtml(meuPerfil.email)}" required></div>
        <div class="campo"><label>Contacto</label><input type="text" id="pf-contacto" value="${SigltUi.escapeHtml(meuPerfil.contactoFuncionario || "")}"></div>
        <div class="campo">
          <label>Perfil (Role)</label>
          <input type="text" value="${SigltUi.escapeHtml(meuPerfil.perfil)}" disabled>
          <p style="font-size:12px;color:var(--texto-suave);margin-top:6px;">
            O perfil só pode ser alterado por um Administrador, em Usuários.
          </p>
        </div>
        <button type="submit" class="botao botao-primario">Guardar Alterações</button>
      </form>
    </div>

    <div class="cartao" style="max-width:480px;">
      <h2 style="margin-top:0;font-size:15px;">Alterar password</h2>
      <form id="form-alterar-password">
        <div class="campo"><label>Nova password</label><input type="password" id="pf-password" required></div>
        <div class="campo"><label>Confirmar nova password</label><input type="password" id="pf-password-confirmar" required></div>
        <button type="submit" class="botao botao-primario">Guardar nova password</button>
      </form>
    </div>
  `;

  document.getElementById("form-meu-perfil").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    try {
      await SigltApi.put("/Usuario/me", {
        email: document.getElementById("pf-email").value,
        contacto: document.getElementById("pf-contacto").value || null
      });
      SigltUi.toast("Perfil atualizado com sucesso.", "sucesso");
    } catch (e) {
      SigltUi.erro(e);
    }
  });

  document.getElementById("form-alterar-password").addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const p1 = document.getElementById("pf-password").value;
    const p2 = document.getElementById("pf-password-confirmar").value;

    if (p1 !== p2) {
      SigltUi.toast("As passwords não coincidem.", "erro");
      return;
    }

    try {
      await SigltApi.post("/Usuario/me/alterar-password", p1);
      SigltUi.toast("Password alterada com sucesso.", "sucesso");
      document.getElementById("form-alterar-password").reset();
    } catch (e) {
      SigltUi.erro(e);
    }
  });
});
