SigltRouter.registar("veiculos", async (container) => {

  async function carregar() {
    const veiculos = await SigltApi.get("/Veiculo");
    renderizarTabela(veiculos);
  }

  function badgeEstado(estado) {
    const mapa = { Ativo: "badge-verde", Manutencao: "badge-azul", Indisponivel: "badge-vermelho" };
    return `<span class="badge ${mapa[estado] || "badge-cinza"}">${estado}</span>`;
  }

  function renderizarTabela(veiculos) {
    const linhas = veiculos.map(v => `
      <tr>
        <td>${SigltUi.escapeHtml(v.matricula)}</td>
        <td>${SigltUi.escapeHtml(v.marca)} ${SigltUi.escapeHtml(v.modelo)}</td>
        <td>${SigltUi.escapeHtml(v.tipo)}</td>
        <td>${SigltUi.formatarNumero(v.quilometragem)} km</td>
        <td>${badgeEstado(v.estado)}</td>
        <td>
          <button class="botao botao-secundario" data-id="${v.id}" data-acao="editar">Editar</button>
          <button class="botao botao-secundario" data-id="${v.id}" data-acao="manutencao">Manutenção</button>
          <button class="botao botao-secundario" data-id="${v.id}" data-acao="abastecimento">Abastecimento</button>
        </td>
      </tr>
    `).join("") || `<tr><td colspan="6" class="vazio">Nenhum veículo registado.</td></tr>`;

    container.innerHTML = `
      <div class="cabecalho-view">
        <h1>Frota — Veículos</h1>
        <button class="botao botao-primario" id="btn-novo-veiculo">+ Novo Veículo</button>
      </div>
      <div class="cartao">
        <table class="tabela">
          <thead><tr>
            <th>Matrícula</th><th>Marca/Modelo</th><th>Tipo</th><th>Quilometragem</th><th>Estado</th><th></th>
          </tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    `;

    document.getElementById("btn-novo-veiculo").addEventListener("click", () => abrirModalVeiculo(null));

    container.querySelectorAll('[data-acao="editar"]').forEach(btn => {
      const v = veiculos.find(x => x.id === Number(btn.dataset.id));
      btn.addEventListener("click", () => abrirModalVeiculo(v));
    });

    container.querySelectorAll('[data-acao="manutencao"]').forEach(btn =>
      btn.addEventListener("click", () => abrirModalManutencao(Number(btn.dataset.id))));

    container.querySelectorAll('[data-acao="abastecimento"]').forEach(btn =>
      btn.addEventListener("click", () => abrirModalAbastecimento(Number(btn.dataset.id))));
  }

  function abrirModalVeiculo(veiculo) {
    const editando = !!veiculo;
    const modal = SigltUi.abrirModal(`
      <h2>${editando ? "Editar Veículo" : "Novo Veículo"}</h2>
      <form id="form-veiculo">
        <div class="campo"><label>Matrícula</label><input type="text" id="v-matricula" value="${editando ? SigltUi.escapeHtml(veiculo.matricula) : ""}" required></div>
        <div class="campo"><label>Marca</label><input type="text" id="v-marca" value="${editando ? SigltUi.escapeHtml(veiculo.marca) : ""}" required></div>
        <div class="campo"><label>Modelo</label><input type="text" id="v-modelo" value="${editando ? SigltUi.escapeHtml(veiculo.modelo) : ""}" required></div>
        <div class="campo"><label>Tipo</label><input type="text" id="v-tipo" placeholder="ex: Camião, Furgão" value="${editando ? SigltUi.escapeHtml(veiculo.tipo) : ""}" required></div>
        <div class="campo"><label>Capacidade (kg/m³)</label><input type="number" id="v-capacidade" step="0.01" value="${editando ? veiculo.capacidade : ""}" required></div>
        ${!editando ? `<div class="campo"><label>Quilometragem inicial</label><input type="number" id="v-km" step="0.01" value="0" required></div>` : ""}
        <div class="modal-acoes">
          <button type="button" class="botao botao-secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="botao botao-primario">Guardar</button>
        </div>
      </form>
    `);

    modal.querySelector("#btn-cancelar").addEventListener("click", () => SigltUi.fecharModal());

    modal.querySelector("#form-veiculo").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        if (editando) {
          await SigltApi.put(`/Veiculo/${veiculo.id}`, {
            matricula: document.getElementById("v-matricula").value,
            marca: document.getElementById("v-marca").value,
            modelo: document.getElementById("v-modelo").value,
            tipo: document.getElementById("v-tipo").value,
            capacidade: Number(document.getElementById("v-capacidade").value),
            quilometragem: veiculo.quilometragem
          });
          SigltUi.toast("Veículo atualizado com sucesso.", "sucesso");
        } else {
          await SigltApi.post("/Veiculo", {
            matricula: document.getElementById("v-matricula").value,
            marca: document.getElementById("v-marca").value,
            modelo: document.getElementById("v-modelo").value,
            tipo: document.getElementById("v-tipo").value,
            capacidade: Number(document.getElementById("v-capacidade").value),
            quilometragem: Number(document.getElementById("v-km").value)
          });
          SigltUi.toast("Veículo registado com sucesso.", "sucesso");
        }
        SigltUi.fecharModal();
        await carregar();
      } catch (e) {
        SigltUi.erro(e);
      }
    });
  }

  function abrirModalManutencao(veiculoId) {
    const modal = SigltUi.abrirModal(`
      <h2>Registar manutenção</h2>
      <form id="form-manutencao">
        <div class="campo"><label>Tipo</label>
          <select id="mn-tipo"><option value="Preventiva">Preventiva</option><option value="Corretiva">Corretiva</option></select>
        </div>
        <div class="campo"><label>Descrição</label><input type="text" id="mn-descricao" required></div>
        <div class="campo"><label>Custo (Kz)</label><input type="number" id="mn-custo" step="0.01" required></div>
        <div class="campo"><label>Quilometragem atual</label><input type="number" id="mn-km" step="0.01" required></div>
        <div class="modal-acoes">
          <button type="button" class="botao botao-secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="botao botao-primario">Guardar</button>
        </div>
      </form>
    `);

    modal.querySelector("#btn-cancelar").addEventListener("click", () => SigltUi.fecharModal());

    modal.querySelector("#form-manutencao").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        await SigltApi.post("/Veiculo/manutencao", {
          veiculoId,
          tipo: document.getElementById("mn-tipo").value,
          descricao: document.getElementById("mn-descricao").value,
          custo: Number(document.getElementById("mn-custo").value),
          quilometragem: Number(document.getElementById("mn-km").value)
        });
        SigltUi.fecharModal();
        SigltUi.toast("Manutenção registada. Veículo passou a 'Manutencao'.", "sucesso");
        await carregar();
      } catch (e) {
        SigltUi.erro(e);
      }
    });
  }

  function abrirModalAbastecimento(veiculoId) {
    const modal = SigltUi.abrirModal(`
      <h2>Registar abastecimento</h2>
      <form id="form-abastecimento">
        <div class="campo"><label>Litros</label><input type="number" id="ab-litros" step="0.01" required></div>
        <div class="campo"><label>Custo (Kz)</label><input type="number" id="ab-custo" step="0.01" required></div>
        <div class="campo"><label>Quilometragem atual</label><input type="number" id="ab-km" step="0.01" required></div>
        <div class="modal-acoes">
          <button type="button" class="botao botao-secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="botao botao-primario">Guardar</button>
        </div>
      </form>
    `);

    modal.querySelector("#btn-cancelar").addEventListener("click", () => SigltUi.fecharModal());

    modal.querySelector("#form-abastecimento").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        await SigltApi.post("/Veiculo/abastecimento", {
          veiculoId,
          litros: Number(document.getElementById("ab-litros").value),
          custo: Number(document.getElementById("ab-custo").value),
          quilometragem: Number(document.getElementById("ab-km").value)
        });
        SigltUi.fecharModal();
        SigltUi.toast("Abastecimento registado com sucesso.", "sucesso");
        await carregar();
      } catch (e) {
        SigltUi.erro(e);
      }
    });
  }

  await carregar();
});
