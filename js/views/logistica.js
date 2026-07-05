SigltRouter.registar("logistica", async (container) => {

  let abaAtiva = "viagens";

  async function carregar() {
    container.innerHTML = `
      <div class="cabecalho-view"><h1>Logística</h1></div>
      <div class="barra-acoes" id="abas-logistica"></div>
      <div id="logistica-corpo"></div>
    `;
    renderizarAbas();
    await renderizarAba();
  }

  function renderizarAbas() {
    const abas = [
      { id: "viagens", label: "Viagens" },
      { id: "cargas", label: "Cargas / Entregas" },
      { id: "rotas", label: "Rotas" },
      { id: "centros", label: "Centros Logísticos" }
    ];
    document.getElementById("abas-logistica").innerHTML = abas.map(a =>
      `<button class="botao ${a.id === abaAtiva ? "botao-primario" : "botao-secundario"}" data-aba="${a.id}">${a.label}</button>`
    ).join("");

    document.querySelectorAll("#abas-logistica [data-aba]").forEach(btn =>
      btn.addEventListener("click", async () => {
        abaAtiva = btn.dataset.aba;
        renderizarAbas();
        await renderizarAba();
      }));
  }

  async function renderizarAba() {
    const corpo = document.getElementById("logistica-corpo");
    corpo.innerHTML = '<div class="carregando">A carregar…</div>';

    if (abaAtiva === "viagens") return renderizarViagens(corpo);
    if (abaAtiva === "cargas") return renderizarCargas(corpo);
    if (abaAtiva === "rotas") return renderizarRotas(corpo);
    if (abaAtiva === "centros") return renderizarCentros(corpo);
  }

  // ---------------- Viagens ----------------
  function badgeViagem(estado) {
    const mapa = { Planeada: "badge-azul", EmCurso: "badge-azul", Concluida: "badge-verde", Cancelada: "badge-vermelho" };
    return `<span class="badge ${mapa[estado] || "badge-cinza"}">${estado}</span>`;
  }

  async function renderizarViagens(corpo) {
    const viagens = await SigltApi.get("/Logistica/viagens");

    const linhas = viagens.map(v => `
      <tr>
        <td>#${v.id}</td>
        <td>${SigltUi.escapeHtml(v.veiculo || "—")}</td>
        <td>${SigltUi.escapeHtml(v.motorista || "—")}</td>
        <td>${SigltUi.escapeHtml(v.rota || "—")}</td>
        <td>${SigltUi.formatarDataHora(v.dataHoraSaida)}</td>
        <td>${badgeViagem(v.estado)}</td>
        <td>
          ${v.estado === "Planeada" ? `<button class="botao botao-secundario" data-id="${v.id}" data-acao="iniciar">Iniciar</button>` : ""}
          ${v.estado === "Planeada" || v.estado === "EmCurso" ? `<button class="botao botao-secundario" data-id="${v.id}" data-acao="concluir">Concluir</button>` : ""}
          ${v.estado === "Planeada" || v.estado === "EmCurso" ? `<button class="botao botao-perigo" data-id="${v.id}" data-acao="cancelar">Cancelar</button>` : ""}
        </td>
      </tr>
    `).join("") || `<tr><td colspan="7" class="vazio">Nenhuma viagem registada.</td></tr>`;

    corpo.innerHTML = `
      <div class="cartao">
        <div class="barra-acoes"><button class="botao botao-primario" id="btn-nova-viagem">+ Nova Viagem</button></div>
        <table class="tabela">
          <thead><tr>
            <th>Id</th><th>Veículo</th><th>Motorista</th><th>Rota</th><th>Saída</th><th>Estado</th><th></th>
          </tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    `;

    document.getElementById("btn-nova-viagem").addEventListener("click", abrirModalNovaViagem);

    corpo.querySelectorAll('[data-acao="iniciar"]').forEach(btn =>
      btn.addEventListener("click", async () => {
        try {
          await SigltApi.post(`/Logistica/viagens/${btn.dataset.id}/iniciar`);
          SigltUi.toast("Viagem iniciada.", "sucesso");
          await renderizarViagens(corpo);
        } catch (e) { SigltUi.erro(e); }
      }));

    corpo.querySelectorAll('[data-acao="concluir"]').forEach(btn =>
      btn.addEventListener("click", () => abrirModalConcluirViagem(Number(btn.dataset.id), corpo)));

    corpo.querySelectorAll('[data-acao="cancelar"]').forEach(btn =>
      btn.addEventListener("click", async () => {
        const motivo = prompt("Motivo do cancelamento:") || "";
        try {
          await SigltApi.post(`/Logistica/viagens/${btn.dataset.id}/cancelar`, motivo);
          SigltUi.toast("Viagem cancelada.", "sucesso");
          await renderizarViagens(corpo);
        } catch (e) { SigltUi.erro(e); }
      }));
  }

  async function abrirModalNovaViagem() {
    const [veiculos, motoristas, rotas, cargas] = await Promise.all([
      SigltApi.get("/Veiculo/disponiveis"),
      SigltApi.get("/Motorista/disponiveis"),
      SigltApi.get("/Logistica/rotas"),
      SigltApi.get("/Logistica/cargas")
    ]);

    if (!veiculos.length || !motoristas.length) {
      SigltUi.toast("É preciso pelo menos 1 veículo e 1 motorista disponíveis para criar uma viagem.", "erro");
      return;
    }

    const opcoesVeiculo = veiculos.map(v => `<option value="${v.id}">${SigltUi.escapeHtml(v.matricula)} — ${SigltUi.escapeHtml(v.marca)} ${SigltUi.escapeHtml(v.modelo)}</option>`).join("");
    const opcoesMotorista = motoristas.map(m => `<option value="${m.id}">${SigltUi.escapeHtml(m.nomeFuncionario || ("#" + m.id))}</option>`).join("");
    const opcoesRota = `<option value="">(sem rota definida)</option>` + rotas.map(r => `<option value="${r.id}">${SigltUi.escapeHtml(r.nome)} (${SigltUi.escapeHtml(r.origem || "?")} → ${SigltUi.escapeHtml(r.destino || "?")})</option>`).join("");

    const cargasPendentes = cargas.filter(c => c.estadoEntrega === "Pendente");
    const checkboxesCargas = cargasPendentes.map(c => `
      <label style="display:flex;align-items:center;gap:8px;font-weight:400;margin-bottom:6px;">
        <input type="checkbox" class="vg-carga-checkbox" value="${c.id}">
        ${SigltUi.escapeHtml(c.descricao)} — ${SigltUi.escapeHtml(c.origem || "?")} → ${SigltUi.escapeHtml(c.destino || "?")}
      </label>
    `).join("") || `<p style="font-size:13px;color:var(--texto-suave);">Nenhuma carga pendente disponível.</p>`;

    const modal = SigltUi.abrirModal(`
      <h2>Nova Viagem</h2>
      <form id="form-nova-viagem">
        <div class="campo"><label>Veículo (disponível)</label><select id="vg-veiculo">${opcoesVeiculo}</select></div>
        <div class="campo"><label>Motorista (disponível)</label><select id="vg-motorista">${opcoesMotorista}</select></div>
        <div class="campo"><label>Rota</label><select id="vg-rota">${opcoesRota}</select></div>
        <div class="campo"><label>Data/hora de saída</label><input type="datetime-local" id="vg-saida" required></div>
        <div class="campo"><label>Cargas pendentes a incluir</label>${checkboxesCargas}</div>
        <div class="modal-acoes">
          <button type="button" class="botao botao-secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="botao botao-primario">Guardar</button>
        </div>
      </form>
    `);

    modal.querySelector("#btn-cancelar").addEventListener("click", () => SigltUi.fecharModal());

    modal.querySelector("#form-nova-viagem").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      const cargasIds = Array.from(modal.querySelectorAll(".vg-carga-checkbox:checked")).map(c => Number(c.value));
      try {
        await SigltApi.post("/Logistica/viagens", {
          veiculoId: Number(document.getElementById("vg-veiculo").value),
          motoristaId: Number(document.getElementById("vg-motorista").value),
          rotaId: document.getElementById("vg-rota").value ? Number(document.getElementById("vg-rota").value) : null,
          dataHoraSaida: document.getElementById("vg-saida").value,
          cargasIds
        });
        SigltUi.fecharModal();
        SigltUi.toast("Viagem criada com sucesso.", "sucesso");
        await renderizarAba();
      } catch (e) {
        SigltUi.erro(e);
      }
    });
  }

  function abrirModalConcluirViagem(viagemId, corpo) {
    const modal = SigltUi.abrirModal(`
      <h2>Concluir viagem</h2>
      <form id="form-concluir-viagem">
        <div class="campo"><label>Quilometragem percorrida</label><input type="number" id="cv-km" step="0.01" required></div>
        <div class="modal-acoes">
          <button type="button" class="botao botao-secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="botao botao-primario">Concluir</button>
        </div>
      </form>
    `);

    modal.querySelector("#btn-cancelar").addEventListener("click", () => SigltUi.fecharModal());

    modal.querySelector("#form-concluir-viagem").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        await SigltApi.post(`/Logistica/viagens/${viagemId}/concluir`, {
          quilometragemPercorrida: Number(document.getElementById("cv-km").value)
        });
        SigltUi.fecharModal();
        SigltUi.toast("Viagem concluída.", "sucesso");
        await renderizarViagens(corpo);
      } catch (e) {
        SigltUi.erro(e);
      }
    });
  }

  // ---------------- Cargas / Entregas ----------------
  function badgeEntrega(estado) {
    const mapa = { Pendente: "badge-cinza", EmTransporte: "badge-azul", Entregue: "badge-verde", Cancelado: "badge-vermelho" };
    return `<span class="badge ${mapa[estado] || "badge-cinza"}">${estado}</span>`;
  }

  async function renderizarCargas(corpo) {
    const [cargas, centros] = await Promise.all([
      SigltApi.get("/Logistica/cargas"),
      SigltApi.get("/Logistica/centros-logisticos")
    ]);
    const opcoesCentro = centros.map(c => `<option value="${c.id}">${SigltUi.escapeHtml(c.nome)}</option>`).join("");

    const linhas = cargas.map(c => `
      <tr>
        <td>#${c.id}</td>
        <td>${SigltUi.escapeHtml(c.descricao)}</td>
        <td>${SigltUi.formatarNumero(c.quantidade)}</td>
        <td>${SigltUi.escapeHtml(c.origem || "—")}</td>
        <td>${SigltUi.escapeHtml(c.destino || "—")}</td>
        <td>${badgeEntrega(c.estadoEntrega || "Pendente")}</td>
      </tr>
    `).join("") || `<tr><td colspan="6" class="vazio">Nenhuma carga registada.</td></tr>`;

    corpo.innerHTML = `
      <div class="cartao">
        <div class="barra-acoes"><button class="botao botao-primario" id="btn-nova-carga">+ Nova Carga</button></div>
        <table class="tabela">
          <thead><tr><th>Id</th><th>Descrição</th><th>Quantidade</th><th>Origem</th><th>Destino</th><th>Estado da Entrega</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    `;

    document.getElementById("btn-nova-carga").addEventListener("click", () => {
      if (centros.length < 2) {
        SigltUi.toast("Cria primeiro pelo menos 2 centros logísticos (origem/destino).", "erro");
        return;
      }
      const modal = SigltUi.abrirModal(`
        <h2>Nova Carga</h2>
        <form id="form-nova-carga">
          <div class="campo"><label>Descrição</label><input type="text" id="cg-descricao" required></div>
          <div class="campo"><label>Quantidade</label><input type="number" id="cg-quantidade" step="0.01" required></div>
          <div class="campo"><label>Peso (kg)</label><input type="number" id="cg-peso" step="0.01"></div>
          <div class="campo"><label>Origem</label><select id="cg-origem">${opcoesCentro}</select></div>
          <div class="campo"><label>Destino</label><select id="cg-destino">${opcoesCentro}</select></div>
          <div class="modal-acoes">
            <button type="button" class="botao botao-secundario" id="btn-cancelar">Cancelar</button>
            <button type="submit" class="botao botao-primario">Guardar</button>
          </div>
        </form>
      `);

      modal.querySelector("#btn-cancelar").addEventListener("click", () => SigltUi.fecharModal());

      modal.querySelector("#form-nova-carga").addEventListener("submit", async (ev) => {
        ev.preventDefault();
        try {
          await SigltApi.post("/Logistica/cargas", {
            descricao: document.getElementById("cg-descricao").value,
            quantidade: Number(document.getElementById("cg-quantidade").value),
            peso: document.getElementById("cg-peso").value ? Number(document.getElementById("cg-peso").value) : null,
            origemId: Number(document.getElementById("cg-origem").value),
            destinoId: Number(document.getElementById("cg-destino").value)
          });
          SigltUi.fecharModal();
          SigltUi.toast("Carga criada. Entrega associada gerada como Pendente.", "sucesso");
          await renderizarCargas(corpo);
        } catch (e) {
          SigltUi.erro(e);
        }
      });
    });
  }

  // ---------------- Rotas ----------------
  async function renderizarRotas(corpo) {
    const [rotas, centros] = await Promise.all([
      SigltApi.get("/Logistica/rotas"),
      SigltApi.get("/Logistica/centros-logisticos")
    ]);
    const opcoesCentro = centros.map(c => `<option value="${c.id}">${SigltUi.escapeHtml(c.nome)}</option>`).join("");

    const linhas = rotas.map(r => `
      <tr>
        <td>${SigltUi.escapeHtml(r.nome)}</td>
        <td>${SigltUi.escapeHtml(r.origem || "—")}</td>
        <td>${SigltUi.escapeHtml(r.destino || "—")}</td>
        <td>${SigltUi.formatarNumero(r.distanciaKm)} km</td>
        <td>${r.tempoEstimadoMinutos} min</td>
      </tr>
    `).join("") || `<tr><td colspan="5" class="vazio">Nenhuma rota registada.</td></tr>`;

    corpo.innerHTML = `
      <div class="cartao">
        <div class="barra-acoes"><button class="botao botao-primario" id="btn-nova-rota">+ Nova Rota</button></div>
        <table class="tabela">
          <thead><tr><th>Nome</th><th>Origem</th><th>Destino</th><th>Distância</th><th>Tempo estimado</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    `;

    document.getElementById("btn-nova-rota").addEventListener("click", () => {
      if (centros.length < 2) {
        SigltUi.toast("Cria primeiro pelo menos 2 centros logísticos.", "erro");
        return;
      }
      const modal = SigltUi.abrirModal(`
        <h2>Nova Rota</h2>
        <form id="form-nova-rota">
          <div class="campo"><label>Nome</label><input type="text" id="rt-nome" required></div>
          <div class="campo"><label>Origem</label><select id="rt-origem">${opcoesCentro}</select></div>
          <div class="campo"><label>Destino</label><select id="rt-destino">${opcoesCentro}</select></div>
          <div class="campo"><label>Distância (km)</label><input type="number" id="rt-distancia" step="0.01" required></div>
          <div class="campo"><label>Tempo estimado (minutos)</label><input type="number" id="rt-tempo" required></div>
          <div class="modal-acoes">
            <button type="button" class="botao botao-secundario" id="btn-cancelar">Cancelar</button>
            <button type="submit" class="botao botao-primario">Guardar</button>
          </div>
        </form>
      `);

      modal.querySelector("#btn-cancelar").addEventListener("click", () => SigltUi.fecharModal());

      modal.querySelector("#form-nova-rota").addEventListener("submit", async (ev) => {
        ev.preventDefault();
        try {
          await SigltApi.post("/Logistica/rotas", {
            nome: document.getElementById("rt-nome").value,
            origemId: Number(document.getElementById("rt-origem").value),
            destinoId: Number(document.getElementById("rt-destino").value),
            distanciaKm: Number(document.getElementById("rt-distancia").value),
            tempoEstimadoMinutos: Number(document.getElementById("rt-tempo").value)
          });
          SigltUi.fecharModal();
          SigltUi.toast("Rota criada com sucesso.", "sucesso");
          await renderizarRotas(corpo);
        } catch (e) {
          SigltUi.erro(e);
        }
      });
    });
  }

  // ---------------- Centros Logísticos ----------------
  async function renderizarCentros(corpo) {
    const centros = await SigltApi.get("/Logistica/centros-logisticos");

    const linhas = centros.map(c => `
      <tr>
        <td>${SigltUi.escapeHtml(c.nome)}</td>
        <td><span class="badge badge-azul">${c.tipo}</span></td>
        <td>${SigltUi.escapeHtml(c.endereco || "—")}</td>
      </tr>
    `).join("") || `<tr><td colspan="3" class="vazio">Nenhum centro logístico registado.</td></tr>`;

    corpo.innerHTML = `
      <div class="cartao">
        <div class="barra-acoes"><button class="botao botao-primario" id="btn-novo-centro">+ Novo Centro Logístico</button></div>
        <table class="tabela">
          <thead><tr><th>Nome</th><th>Tipo</th><th>Endereço</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    `;

    document.getElementById("btn-novo-centro").addEventListener("click", () => {
      const modal = SigltUi.abrirModal(`
        <h2>Novo Centro Logístico</h2>
        <form id="form-novo-centro">
          <div class="campo"><label>Nome</label><input type="text" id="cl-nome" required></div>
          <div class="campo"><label>Tipo</label>
            <select id="cl-tipo"><option value="Armazem">Armazém</option><option value="PontoDistribuicao">Ponto de Distribuição</option></select>
          </div>
          <div class="campo"><label>Endereço</label><input type="text" id="cl-endereco"></div>
          <div class="modal-acoes">
            <button type="button" class="botao botao-secundario" id="btn-cancelar">Cancelar</button>
            <button type="submit" class="botao botao-primario">Guardar</button>
          </div>
        </form>
      `);

      modal.querySelector("#btn-cancelar").addEventListener("click", () => SigltUi.fecharModal());

      modal.querySelector("#form-novo-centro").addEventListener("submit", async (ev) => {
        ev.preventDefault();
        try {
          await SigltApi.post("/Logistica/centros-logisticos", {
            nome: document.getElementById("cl-nome").value,
            tipo: document.getElementById("cl-tipo").value,
            endereco: document.getElementById("cl-endereco").value || null
          });
          SigltUi.fecharModal();
          SigltUi.toast("Centro logístico criado com sucesso.", "sucesso");
          await renderizarCentros(corpo);
        } catch (e) {
          SigltUi.erro(e);
        }
      });
    });
  }

  await carregar();
});
