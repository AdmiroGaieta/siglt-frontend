SigltRouter.registar("rh", async (container) => {

  let abaAtiva = "funcionarios";

  async function carregar() {
    container.innerHTML = `
      <div class="cabecalho-view"><h1>RH — Recursos Humanos</h1></div>
      <div class="barra-acoes" id="abas-rh"></div>
      <div id="rh-corpo"></div>
    `;
    renderizarAbas();
    await renderizarAba();
  }

  function renderizarAbas() {
    const abas = [
      { id: "funcionarios", label: "Funcionários" },
      { id: "areas", label: "Áreas" },
      { id: "cargos", label: "Cargos" }
    ];
    document.getElementById("abas-rh").innerHTML = abas.map(a =>
      `<button class="botao ${a.id === abaAtiva ? "botao-primario" : "botao-secundario"}" data-aba="${a.id}">${a.label}</button>`
    ).join("");

    document.querySelectorAll("#abas-rh [data-aba]").forEach(btn =>
      btn.addEventListener("click", async () => {
        abaAtiva = btn.dataset.aba;
        renderizarAbas();
        await renderizarAba();
      }));
  }

  async function renderizarAba() {
    const corpo = document.getElementById("rh-corpo");
    corpo.innerHTML = '<div class="carregando">A carregar…</div>';

    if (abaAtiva === "funcionarios") return renderizarFuncionarios(corpo);
    if (abaAtiva === "areas") return renderizarAreas(corpo);
    if (abaAtiva === "cargos") return renderizarCargos(corpo);
  }

  // ===================== FUNCIONÁRIOS =====================
  function badgeEstado(estado) {
    const mapa = {
      Ativo: "badge-verde", Ferias: "badge-azul", Licenca: "badge-azul",
      Suspenso: "badge-vermelho", Inativo: "badge-cinza", Transferido: "badge-cinza",
      PendenteAlocacao: "badge-cinza"
    };
    return `<span class="badge ${mapa[estado] || "badge-cinza"}">${estado}</span>`;
  }

  const ESTADOS_FUNCIONARIO = ["Ativo", "Ferias", "Licenca", "Suspenso", "Inativo", "Transferido", "PendenteAlocacao"];

  async function renderizarFuncionarios(corpo) {
    const [funcionarios, areas, cargos] = await Promise.all([
      SigltApi.get("/Funcionario"),
      SigltApi.get("/Area"),
      SigltApi.get("/Cargo")
    ]);

    const linhas = funcionarios.map(f => `
      <tr>
        <td>${SigltUi.escapeHtml(f.nome)}</td>
        <td>${SigltUi.escapeHtml(f.documentoIdentificacao)}</td>
        <td>${SigltUi.escapeHtml(f.areaNome || "—")}</td>
        <td>${SigltUi.escapeHtml(f.cargoNome || "—")}</td>
        <td>${SigltUi.formatarData(f.dataAdmissao)}</td>
        <td>${badgeEstado(f.estado)}</td>
        <td>
          <button class="botao botao-secundario" data-id="${f.id}" data-acao="editar">Editar</button>
          <button class="botao botao-secundario" data-id="${f.id}" data-acao="transferir">Transferir</button>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="7" class="vazio">Nenhum funcionário registado.</td></tr>`;

    corpo.innerHTML = `
      <div class="cartao">
        <div class="barra-acoes"><button class="botao botao-primario" id="btn-novo-funcionario">+ Novo Funcionário</button></div>
        <table class="tabela">
          <thead><tr>
            <th>Nome</th><th>Documento</th><th>Área</th><th>Cargo</th><th>Admissão</th><th>Estado</th><th></th>
          </tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    `;

    document.getElementById("btn-novo-funcionario").addEventListener("click", () => abrirModalFuncionario(null, areas, cargos, corpo));

    corpo.querySelectorAll('[data-acao="editar"]').forEach(btn => {
      const f = funcionarios.find(x => x.id === Number(btn.dataset.id));
      btn.addEventListener("click", () => abrirModalFuncionario(f, areas, cargos, corpo));
    });

    corpo.querySelectorAll('[data-acao="transferir"]').forEach(btn => {
      btn.addEventListener("click", () => abrirModalTransferir(Number(btn.dataset.id), areas, cargos, corpo));
    });
  }

  function abrirModalFuncionario(funcionario, areas, cargos, corpo) {
    const editando = !!funcionario;
    const opcoesArea = areas.map(a =>
      `<option value="${a.id}" ${editando && funcionario.areaId === a.id ? "selected" : ""}>${SigltUi.escapeHtml(a.nome)}</option>`).join("");
    const opcoesCargo = cargos.map(c =>
      `<option value="${c.id}" ${editando && funcionario.cargoId === c.id ? "selected" : ""}>${SigltUi.escapeHtml(c.nome)}</option>`).join("");
    const opcoesEstado = editando
      ? ESTADOS_FUNCIONARIO.map(e => `<option value="${e}" ${funcionario.estado === e ? "selected" : ""}>${e}</option>`).join("")
      : "";

    const modal = SigltUi.abrirModal(`
      <h2>${editando ? "Editar Funcionário" : "Novo Funcionário"}</h2>
      <form id="form-funcionario">
        <div class="campo"><label>Nome</label><input type="text" id="f-nome" value="${editando ? SigltUi.escapeHtml(funcionario.nome) : ""}" required></div>
        ${!editando ? `<div class="campo"><label>Documento de identificação</label><input type="text" id="f-documento" required></div>` : ""}
        <div class="campo"><label>Contacto</label><input type="text" id="f-contacto" value="${editando ? SigltUi.escapeHtml(funcionario.contacto || "") : ""}"></div>
        <div class="campo"><label>Email</label><input type="email" id="f-email" value="${editando ? SigltUi.escapeHtml(funcionario.email || "") : ""}"></div>
        <div class="campo"><label>Área</label><select id="f-area" required>${opcoesArea}</select></div>
        <div class="campo"><label>Cargo</label><select id="f-cargo" required>${opcoesCargo}</select></div>
        ${!editando ? `<div class="campo"><label>Data de admissão</label><input type="date" id="f-admissao" required></div>` : `
        <div class="campo"><label>Estado</label><select id="f-estado">${opcoesEstado}</select></div>`}
        <div class="modal-acoes">
          <button type="button" class="botao botao-secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="botao botao-primario">Guardar</button>
        </div>
      </form>
    `);

    modal.querySelector("#btn-cancelar").addEventListener("click", () => SigltUi.fecharModal());

    modal.querySelector("#form-funcionario").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        if (editando) {
          await SigltApi.put(`/Funcionario/${funcionario.id}`, {
            nome: document.getElementById("f-nome").value,
            contacto: document.getElementById("f-contacto").value || null,
            email: document.getElementById("f-email").value || null,
            areaId: Number(document.getElementById("f-area").value),
            cargoId: Number(document.getElementById("f-cargo").value),
            estado: document.getElementById("f-estado").value
          });
          SigltUi.toast("Funcionário atualizado com sucesso.", "sucesso");
        } else {
          await SigltApi.post("/Funcionario", {
            nome: document.getElementById("f-nome").value,
            documentoIdentificacao: document.getElementById("f-documento").value,
            contacto: document.getElementById("f-contacto").value || null,
            email: document.getElementById("f-email").value || null,
            areaId: Number(document.getElementById("f-area").value),
            cargoId: Number(document.getElementById("f-cargo").value),
            dataAdmissao: document.getElementById("f-admissao").value
          });
          SigltUi.toast("Funcionário criado com sucesso.", "sucesso");
        }
        SigltUi.fecharModal();
        await renderizarFuncionarios(corpo);
      } catch (e) {
        SigltUi.erro(e);
      }
    });
  }

  function abrirModalTransferir(funcionarioId, areas, cargos, corpo) {
    const opcoesArea = areas.map(a => `<option value="${a.id}">${SigltUi.escapeHtml(a.nome)}</option>`).join("");
    const opcoesCargo = `<option value="">(manter cargo atual)</option>` + cargos.map(c => `<option value="${c.id}">${SigltUi.escapeHtml(c.nome)}</option>`).join("");

    const modal = SigltUi.abrirModal(`
      <h2>Transferir Funcionário</h2>
      <form id="form-transferir">
        <div class="campo"><label>Nova Área</label><select id="tr-area">${opcoesArea}</select></div>
        <div class="campo"><label>Novo Cargo</label><select id="tr-cargo">${opcoesCargo}</select></div>
        <div class="campo"><label>Observação</label><input type="text" id="tr-observacao" placeholder="opcional"></div>
        <div class="modal-acoes">
          <button type="button" class="botao botao-secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="botao botao-primario">Transferir</button>
        </div>
      </form>
    `);

    modal.querySelector("#btn-cancelar").addEventListener("click", () => SigltUi.fecharModal());

    modal.querySelector("#form-transferir").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        const novoCargoId = document.getElementById("tr-cargo").value;
        await SigltApi.post(`/Funcionario/${funcionarioId}/transferir`, {
          novaAreaId: Number(document.getElementById("tr-area").value),
          novoCargoId: novoCargoId ? Number(novoCargoId) : null,
          observacao: document.getElementById("tr-observacao").value || null
        });
        SigltUi.fecharModal();
        SigltUi.toast("Funcionário transferido com sucesso.", "sucesso");
        await renderizarFuncionarios(corpo);
      } catch (e) {
        SigltUi.erro(e);
      }
    });
  }

  // ===================== ÁREAS =====================
  async function renderizarAreas(corpo) {
    const areas = await SigltApi.get("/Area");

    const linhas = areas.map(a => `
      <tr>
        <td>${SigltUi.escapeHtml(a.nome)}</td>
        <td>${SigltUi.escapeHtml(a.descricao || "—")}</td>
        <td><button class="botao botao-secundario" data-id="${a.id}" data-acao="editar">Editar</button></td>
      </tr>
    `).join("") || `<tr><td colspan="3" class="vazio">Nenhuma área registada.</td></tr>`;

    corpo.innerHTML = `
      <div class="cartao">
        <div class="barra-acoes"><button class="botao botao-primario" id="btn-nova-area">+ Nova Área</button></div>
        <table class="tabela">
          <thead><tr><th>Nome</th><th>Descrição</th><th></th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    `;

    document.getElementById("btn-nova-area").addEventListener("click", () => abrirModalArea(null, corpo));

    corpo.querySelectorAll('[data-acao="editar"]').forEach(btn => {
      const a = areas.find(x => x.id === Number(btn.dataset.id));
      btn.addEventListener("click", () => abrirModalArea(a, corpo));
    });
  }

  function abrirModalArea(area, corpo) {
    const editando = !!area;
    const modal = SigltUi.abrirModal(`
      <h2>${editando ? "Editar Área" : "Nova Área"}</h2>
      <form id="form-area">
        <div class="campo"><label>Nome</label><input type="text" id="ar-nome" value="${editando ? SigltUi.escapeHtml(area.nome) : ""}" required></div>
        <div class="campo"><label>Descrição</label><input type="text" id="ar-descricao" value="${editando ? SigltUi.escapeHtml(area.descricao || "") : ""}"></div>
        <div class="modal-acoes">
          <button type="button" class="botao botao-secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="botao botao-primario">Guardar</button>
        </div>
      </form>
    `);

    modal.querySelector("#btn-cancelar").addEventListener("click", () => SigltUi.fecharModal());

    modal.querySelector("#form-area").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        const corpoReq = { nome: document.getElementById("ar-nome").value, descricao: document.getElementById("ar-descricao").value || null };
        if (editando) {
          await SigltApi.put(`/Area/${area.id}`, corpoReq);
          SigltUi.toast("Área atualizada com sucesso.", "sucesso");
        } else {
          await SigltApi.post("/Area", corpoReq);
          SigltUi.toast("Área criada com sucesso.", "sucesso");
        }
        SigltUi.fecharModal();
        await renderizarAreas(corpo);
      } catch (e) {
        SigltUi.erro(e);
      }
    });
  }

  // ===================== CARGOS =====================
  async function renderizarCargos(corpo) {
    const cargos = await SigltApi.get("/Cargo");

    const linhas = cargos.map(c => `
      <tr>
        <td>${SigltUi.escapeHtml(c.nome)}</td>
        <td>${SigltUi.escapeHtml(c.descricao || "—")}</td>
        <td><button class="botao botao-secundario" data-id="${c.id}" data-acao="editar">Editar</button></td>
      </tr>
    `).join("") || `<tr><td colspan="3" class="vazio">Nenhum cargo registado.</td></tr>`;

    corpo.innerHTML = `
      <div class="cartao">
        <div class="barra-acoes"><button class="botao botao-primario" id="btn-novo-cargo">+ Novo Cargo</button></div>
        <table class="tabela">
          <thead><tr><th>Nome</th><th>Descrição</th><th></th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    `;

    document.getElementById("btn-novo-cargo").addEventListener("click", () => abrirModalCargo(null, corpo));

    corpo.querySelectorAll('[data-acao="editar"]').forEach(btn => {
      const c = cargos.find(x => x.id === Number(btn.dataset.id));
      btn.addEventListener("click", () => abrirModalCargo(c, corpo));
    });
  }

  function abrirModalCargo(cargo, corpo) {
    const editando = !!cargo;
    const modal = SigltUi.abrirModal(`
      <h2>${editando ? "Editar Cargo" : "Novo Cargo"}</h2>
      <form id="form-cargo">
        <div class="campo"><label>Nome</label><input type="text" id="cg-nome" value="${editando ? SigltUi.escapeHtml(cargo.nome) : ""}" required></div>
        <div class="campo"><label>Descrição</label><input type="text" id="cg-descricao" value="${editando ? SigltUi.escapeHtml(cargo.descricao || "") : ""}"></div>
        <div class="modal-acoes">
          <button type="button" class="botao botao-secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="botao botao-primario">Guardar</button>
        </div>
      </form>
    `);

    modal.querySelector("#btn-cancelar").addEventListener("click", () => SigltUi.fecharModal());

    modal.querySelector("#form-cargo").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        const corpoReq = { nome: document.getElementById("cg-nome").value, descricao: document.getElementById("cg-descricao").value || null };
        if (editando) {
          await SigltApi.put(`/Cargo/${cargo.id}`, corpoReq);
          SigltUi.toast("Cargo atualizado com sucesso.", "sucesso");
        } else {
          await SigltApi.post("/Cargo", corpoReq);
          SigltUi.toast("Cargo criado com sucesso.", "sucesso");
        }
        SigltUi.fecharModal();
        await renderizarCargos(corpo);
      } catch (e) {
        SigltUi.erro(e);
      }
    });
  }

  await carregar();
});
