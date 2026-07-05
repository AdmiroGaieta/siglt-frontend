SigltRouter.registar("motoristas", async (container) => {

  async function carregar() {
    const [motoristas, funcionarios] = await Promise.all([
      SigltApi.get("/Motorista"),
      SigltApi.get("/Funcionario")
    ]);
    renderizarTabela(motoristas, funcionarios);
  }

  function badgeEstado(estado) {
    const mapa = {
      Disponivel: "badge-verde", EmViagem: "badge-azul", Descanso: "badge-cinza",
      Ferias: "badge-cinza", Licenca: "badge-cinza", Suspenso: "badge-vermelho",
      Inativo: "badge-cinza", SemViatura: "badge-cinza"
    };
    return `<span class="badge ${mapa[estado] || "badge-cinza"}">${estado}</span>`;
  }

  function renderizarTabela(motoristas, funcionarios) {
    const linhas = motoristas.map(m => `
      <tr>
        <td>${SigltUi.escapeHtml(m.nomeFuncionario || "—")}</td>
        <td>${SigltUi.escapeHtml(m.numeroCarta)}</td>
        <td>${SigltUi.escapeHtml(m.categoriaCarta)}</td>
        <td>${SigltUi.formatarData(m.validadeCarta)} ${m.cartaProximaExpirar ? '<span class="badge badge-vermelho">expira em breve</span>' : ""}</td>
        <td>${badgeEstado(m.estadoOperacional)}</td>
        <td><button class="botao botao-secundario" data-id="${m.id}" data-acao="alterar-estado">Alterar estado</button></td>
      </tr>
    `).join("") || `<tr><td colspan="6" class="vazio">Nenhum motorista registado.</td></tr>`;

    container.innerHTML = `
      <div class="cabecalho-view">
        <h1>Motoristas</h1>
        <button class="botao botao-primario" id="btn-novo-motorista">+ Novo Motorista</button>
      </div>
      <div class="cartao">
        <table class="tabela">
          <thead><tr>
            <th>Funcionário</th><th>Nº Carta</th><th>Categoria</th><th>Validade</th><th>Estado</th><th></th>
          </tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    `;

    document.getElementById("btn-novo-motorista").addEventListener("click", () => abrirModalNovo(funcionarios));

    container.querySelectorAll('[data-acao="alterar-estado"]').forEach(btn => {
      btn.addEventListener("click", () => abrirModalEstado(Number(btn.dataset.id)));
    });
  }

  function abrirModalNovo(funcionarios) {
    const opcoesFuncionario = funcionarios
      .filter(f => f.estado === "Ativo")
      .map(f => `<option value="${f.id}">${SigltUi.escapeHtml(f.nome)}</option>`).join("");

    const modal = SigltUi.abrirModal(`
      <h2>Novo Motorista</h2>
      <form id="form-novo-motorista">
        <div class="campo"><label>Funcionário (ativo)</label><select id="m-funcionario" required>${opcoesFuncionario}</select></div>
        <div class="campo"><label>Nº da carta de condução</label><input type="text" id="m-carta" required></div>
        <div class="campo"><label>Categoria</label><input type="text" id="m-categoria" placeholder="ex: B, C, D" required></div>
        <div class="campo"><label>Validade da carta</label><input type="date" id="m-validade" required></div>
        <div class="modal-acoes">
          <button type="button" class="botao botao-secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="botao botao-primario">Guardar</button>
        </div>
      </form>
    `);

    modal.querySelector("#btn-cancelar").addEventListener("click", () => SigltUi.fecharModal());

    modal.querySelector("#form-novo-motorista").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        await SigltApi.post("/Motorista", {
          funcionarioId: Number(document.getElementById("m-funcionario").value),
          numeroCarta: document.getElementById("m-carta").value,
          categoriaCarta: document.getElementById("m-categoria").value,
          validadeCarta: document.getElementById("m-validade").value
        });
        SigltUi.fecharModal();
        SigltUi.toast("Motorista registado com sucesso.", "sucesso");
        await carregar();
      } catch (e) {
        SigltUi.erro(e);
      }
    });
  }

  function abrirModalEstado(motoristaId) {
    const estados = ["Disponivel", "EmViagem", "Descanso", "Ferias", "Licenca", "Suspenso", "Inativo", "SemViatura"];
    const opcoes = estados.map(e => `<option value="${e}">${e}</option>`).join("");

    const modal = SigltUi.abrirModal(`
      <h2>Alterar estado operacional</h2>
      <form id="form-estado-motorista">
        <div class="campo"><label>Novo estado</label><select id="m-novo-estado">${opcoes}</select></div>
        <div class="modal-acoes">
          <button type="button" class="botao botao-secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="botao botao-primario">Guardar</button>
        </div>
      </form>
    `);

    modal.querySelector("#btn-cancelar").addEventListener("click", () => SigltUi.fecharModal());

    modal.querySelector("#form-estado-motorista").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        await SigltApi.patch(`/Motorista/${motoristaId}/estado`, {
          novoEstado: document.getElementById("m-novo-estado").value
        });
        SigltUi.fecharModal();
        SigltUi.toast("Estado atualizado com sucesso.", "sucesso");
        await carregar();
      } catch (e) {
        SigltUi.erro(e);
      }
    });
  }

  await carregar();
});
