SigltRouter.registar("stock", async (container) => {

  let abaAtiva = "produtos";

  async function carregar() {
    container.innerHTML = `
      <div class="cabecalho-view"><h1>Stock</h1></div>
      <div class="barra-acoes" id="abas-stock"></div>
      <div id="stock-corpo"></div>
    `;
    renderizarAbas();
    await renderizarAba();
  }

  function renderizarAbas() {
    const abas = [
      { id: "produtos", label: "Produtos" },
      { id: "categorias", label: "Categorias" },
      { id: "consulta", label: "Consultar Stock" },
      { id: "movimento", label: "Registar Movimento" },
      { id: "ajuste", label: "Ajustar Stock" },
      { id: "criticos", label: "Abaixo do Mínimo" }
    ];
    document.getElementById("abas-stock").innerHTML = abas.map(a =>
      `<button class="botao ${a.id === abaAtiva ? "botao-primario" : "botao-secundario"}" data-aba="${a.id}">${a.label}</button>`
    ).join("");

    document.querySelectorAll("#abas-stock [data-aba]").forEach(btn =>
      btn.addEventListener("click", async () => {
        abaAtiva = btn.dataset.aba;
        renderizarAbas();
        await renderizarAba();
      }));
  }

  async function renderizarAba() {
    const corpo = document.getElementById("stock-corpo");
    corpo.innerHTML = '<div class="carregando">A carregar…</div>';

    if (abaAtiva === "produtos") return renderizarProdutos(corpo);
    if (abaAtiva === "categorias") return renderizarCategorias(corpo);
    if (abaAtiva === "consulta") return renderizarConsulta(corpo);
    if (abaAtiva === "movimento") return renderizarMovimento(corpo);
    if (abaAtiva === "ajuste") return renderizarAjuste(corpo);
    if (abaAtiva === "criticos") return renderizarCriticos(corpo);
  }

  // ===================== PRODUTOS =====================
  async function renderizarProdutos(corpo) {
    const [produtos, categorias] = await Promise.all([
      SigltApi.get("/Stock/produtos"),
      SigltApi.get("/Categoria")
    ]);

    const linhas = produtos.map(p => `
      <tr>
        <td>${SigltUi.escapeHtml(p.codigo)}</td>
        <td>${SigltUi.escapeHtml(p.nome)}</td>
        <td>${SigltUi.escapeHtml(p.categoriaNome || "—")}</td>
        <td>${SigltUi.escapeHtml(p.unidade)}</td>
        <td>${SigltUi.formatarNumero(p.quantidadeTotalEmStock)}</td>
        <td>${SigltUi.formatarNumero(p.quantidadeMinima)}</td>
        <td><button class="botao botao-secundario" data-id="${p.id}" data-acao="editar">Editar</button></td>
      </tr>
    `).join("") || `<tr><td colspan="7" class="vazio">Nenhum produto registado.</td></tr>`;

    corpo.innerHTML = `
      <div class="cartao">
        <div class="barra-acoes">
          <button class="botao botao-primario" id="btn-novo-produto">+ Novo Produto</button>
        </div>
        <table class="tabela">
          <thead><tr><th>Código</th><th>Nome</th><th>Categoria</th><th>Unidade</th><th>Em stock</th><th>Mínimo</th><th></th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    `;

    if (!categorias.length) {
      document.getElementById("btn-novo-produto").addEventListener("click", () => {
        SigltUi.toast('Cria primeiro uma categoria, na aba "Categorias".', "erro");
      });
    } else {
      document.getElementById("btn-novo-produto").addEventListener("click", () => abrirModalProduto(null, categorias, corpo));
    }

    corpo.querySelectorAll('[data-acao="editar"]').forEach(btn => {
      const p = produtos.find(x => x.id === Number(btn.dataset.id));
      btn.addEventListener("click", () => abrirModalProduto(p, categorias, corpo));
    });
  }

  function abrirModalProduto(produto, categorias, corpo) {
    const editando = !!produto;
    const opcoes = categorias.map(c =>
      `<option value="${c.id}" ${editando && produto.categoriaId === c.id ? "selected" : ""}>${SigltUi.escapeHtml(c.nome)}</option>`).join("");

    const modal = SigltUi.abrirModal(`
      <h2>${editando ? "Editar Produto" : "Novo Produto"}</h2>
      <form id="form-produto">
        <div class="campo"><label>Código</label><input type="text" id="pr-codigo" value="${editando ? SigltUi.escapeHtml(produto.codigo) : ""}" required></div>
        <div class="campo"><label>Nome</label><input type="text" id="pr-nome" value="${editando ? SigltUi.escapeHtml(produto.nome) : ""}" required></div>
        <div class="campo"><label>Categoria</label><select id="pr-categoria">${opcoes}</select></div>
        <div class="campo"><label>Unidade</label><input type="text" id="pr-unidade" placeholder="ex: saco, unidade, litro" value="${editando ? SigltUi.escapeHtml(produto.unidade) : ""}" required></div>
        <div class="campo"><label>Quantidade mínima</label><input type="number" id="pr-minima" step="0.01" value="${editando ? produto.quantidadeMinima : ""}" required></div>
        <div class="modal-acoes">
          <button type="button" class="botao botao-secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="botao botao-primario">Guardar</button>
        </div>
      </form>
    `);

    modal.querySelector("#btn-cancelar").addEventListener("click", () => SigltUi.fecharModal());

    modal.querySelector("#form-produto").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        const corpoReq = {
          codigo: document.getElementById("pr-codigo").value,
          nome: document.getElementById("pr-nome").value,
          categoriaId: Number(document.getElementById("pr-categoria").value),
          unidade: document.getElementById("pr-unidade").value,
          quantidadeMinima: Number(document.getElementById("pr-minima").value)
        };
        if (editando) {
          await SigltApi.put(`/Stock/produtos/${produto.id}`, corpoReq);
          SigltUi.toast("Produto atualizado com sucesso.", "sucesso");
        } else {
          await SigltApi.post("/Stock/produtos", corpoReq);
          SigltUi.toast("Produto criado com sucesso.", "sucesso");
        }
        SigltUi.fecharModal();
        await renderizarProdutos(corpo);
      } catch (e) {
        SigltUi.erro(e);
      }
    });
  }

  // ===================== CATEGORIAS =====================
  async function renderizarCategorias(corpo) {
    const categorias = await SigltApi.get("/Categoria");

    const linhas = categorias.map(c => `
      <tr>
        <td>${SigltUi.escapeHtml(c.nome)}</td>
        <td>${SigltUi.escapeHtml(c.descricao || "—")}</td>
        <td><button class="botao botao-secundario" data-id="${c.id}" data-acao="editar">Editar</button></td>
      </tr>
    `).join("") || `<tr><td colspan="3" class="vazio">Nenhuma categoria registada.</td></tr>`;

    corpo.innerHTML = `
      <div class="cartao">
        <div class="barra-acoes"><button class="botao botao-primario" id="btn-nova-categoria">+ Nova Categoria</button></div>
        <table class="tabela">
          <thead><tr><th>Nome</th><th>Descrição</th><th></th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    `;

    document.getElementById("btn-nova-categoria").addEventListener("click", () => abrirModalCategoria(null, corpo));

    corpo.querySelectorAll('[data-acao="editar"]').forEach(btn => {
      const c = categorias.find(x => x.id === Number(btn.dataset.id));
      btn.addEventListener("click", () => abrirModalCategoria(c, corpo));
    });
  }

  function abrirModalCategoria(categoria, corpo) {
    const editando = !!categoria;
    const modal = SigltUi.abrirModal(`
      <h2>${editando ? "Editar Categoria" : "Nova Categoria"}</h2>
      <form id="form-categoria">
        <div class="campo"><label>Nome</label><input type="text" id="cat-nome" value="${editando ? SigltUi.escapeHtml(categoria.nome) : ""}" required></div>
        <div class="campo"><label>Descrição</label><input type="text" id="cat-descricao" value="${editando ? SigltUi.escapeHtml(categoria.descricao || "") : ""}"></div>
        <div class="modal-acoes">
          <button type="button" class="botao botao-secundario" id="btn-cancelar">Cancelar</button>
          <button type="submit" class="botao botao-primario">Guardar</button>
        </div>
      </form>
    `);

    modal.querySelector("#btn-cancelar").addEventListener("click", () => SigltUi.fecharModal());

    modal.querySelector("#form-categoria").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        const corpoReq = { nome: document.getElementById("cat-nome").value, descricao: document.getElementById("cat-descricao").value || null };
        if (editando) {
          await SigltApi.put(`/Categoria/${categoria.id}`, corpoReq);
          SigltUi.toast("Categoria atualizada com sucesso.", "sucesso");
        } else {
          await SigltApi.post("/Categoria", corpoReq);
          SigltUi.toast("Categoria criada com sucesso.", "sucesso");
        }
        SigltUi.fecharModal();
        await renderizarCategorias(corpo);
      } catch (e) {
        SigltUi.erro(e);
      }
    });
  }

  // ===================== CONSULTAR STOCK =====================
  async function renderizarConsulta(corpo) {
    const itens = await SigltApi.get("/Stock");

    const linhas = itens.map(i => `
      <tr>
        <td>${SigltUi.escapeHtml(i.produtoNome || "—")}</td>
        <td>${SigltUi.escapeHtml(i.centroLogisticoNome || "—")}</td>
        <td>${SigltUi.formatarNumero(i.quantidadeAtual)}</td>
        <td>${i.abaixoDoMinimo ? '<span class="badge badge-vermelho">Abaixo do mínimo</span>' : '<span class="badge badge-verde">OK</span>'}</td>
      </tr>
    `).join("") || `<tr><td colspan="4" class="vazio">Sem stock registado.</td></tr>`;

    corpo.innerHTML = `
      <div class="cartao">
        <table class="tabela">
          <thead><tr><th>Produto</th><th>Centro Logístico</th><th>Quantidade</th><th>Estado</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    `;
  }

  async function renderizarCriticos(corpo) {
    const itens = await SigltApi.get("/Stock/abaixo-do-minimo");

    const linhas = itens.map(i => `
      <tr>
        <td>${SigltUi.escapeHtml(i.produtoNome || "—")}</td>
        <td>${SigltUi.escapeHtml(i.centroLogisticoNome || "—")}</td>
        <td>${SigltUi.formatarNumero(i.quantidadeAtual)}</td>
      </tr>
    `).join("") || `<tr><td colspan="3" class="vazio">Nenhum produto abaixo do mínimo. 🎉</td></tr>`;

    corpo.innerHTML = `
      <div class="cartao">
        <table class="tabela">
          <thead><tr><th>Produto</th><th>Centro Logístico</th><th>Quantidade atual</th></tr></thead>
          <tbody>${linhas}</tbody>
        </table>
      </div>
    `;
  }

  // ===================== MOVIMENTO =====================
  async function renderizarMovimento(corpo) {
    const [produtos, centros] = await Promise.all([
      SigltApi.get("/Stock/produtos"),
      SigltApi.get("/Logistica/centros-logisticos")
    ]);

    if (!produtos.length || !centros.length) {
      corpo.innerHTML = `<div class="vazio">É preciso ter pelo menos 1 produto e 1 centro logístico para registar movimentos.</div>`;
      return;
    }

    const opcoesProduto = produtos.map(p => `<option value="${p.id}">${SigltUi.escapeHtml(p.nome)} (${SigltUi.escapeHtml(p.codigo)})</option>`).join("");
    const opcoesCentro = centros.map(c => `<option value="${c.id}">${SigltUi.escapeHtml(c.nome)}</option>`).join("");

    corpo.innerHTML = `
      <div class="cartao" style="max-width:480px;">
        <form id="form-movimento">
          <div class="campo"><label>Produto</label><select id="mv-produto">${opcoesProduto}</select></div>
          <div class="campo"><label>Centro Logístico</label><select id="mv-centro">${opcoesCentro}</select></div>
          <div class="campo"><label>Tipo de movimento</label>
            <select id="mv-tipo">
              <optgroup label="Entrada">
                <option value="EntradaCompra">Entrada — Compra</option>
                <option value="EntradaRecepcao">Entrada — Receção</option>
                <option value="EntradaTransferencia">Entrada — Transferência</option>
              </optgroup>
              <optgroup label="Saída">
                <option value="SaidaExpedicao">Saída — Expedição</option>
                <option value="SaidaEntrega">Saída — Entrega</option>
                <option value="SaidaTransferencia">Saída — Transferência</option>
              </optgroup>
              <option value="AjusteInventario">Ajuste de Inventário</option>
            </select>
          </div>
          <div class="campo"><label>Quantidade</label><input type="number" id="mv-quantidade" step="0.01" required></div>
          <div class="campo"><label>Documento de referência</label><input type="text" id="mv-documento" placeholder="opcional"></div>
          <button type="submit" class="botao botao-primario">Registar Movimento</button>
        </form>
      </div>
    `;

    document.getElementById("form-movimento").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        await SigltApi.post("/Stock/movimentos", {
          produtoId: Number(document.getElementById("mv-produto").value),
          centroLogisticoId: Number(document.getElementById("mv-centro").value),
          tipo: document.getElementById("mv-tipo").value,
          quantidade: Number(document.getElementById("mv-quantidade").value),
          documentoReferencia: document.getElementById("mv-documento").value || null
        });
        SigltUi.toast("Movimento registado com sucesso.", "sucesso");
        document.getElementById("form-movimento").reset();
      } catch (e) {
        SigltUi.erro(e);
      }
    });
  }

  // ===================== AJUSTAR STOCK (definir quantidade exata) =====================
  async function renderizarAjuste(corpo) {
    const [produtos, centros] = await Promise.all([
      SigltApi.get("/Stock/produtos"),
      SigltApi.get("/Logistica/centros-logisticos")
    ]);

    if (!produtos.length || !centros.length) {
      corpo.innerHTML = `<div class="vazio">É preciso ter pelo menos 1 produto e 1 centro logístico para ajustar o stock.</div>`;
      return;
    }

    const opcoesProduto = produtos.map(p => `<option value="${p.id}">${SigltUi.escapeHtml(p.nome)} (${SigltUi.escapeHtml(p.codigo)})</option>`).join("");
    const opcoesCentro = centros.map(c => `<option value="${c.id}">${SigltUi.escapeHtml(c.nome)}</option>`).join("");

    corpo.innerHTML = `
      <div class="cartao" style="max-width:480px;">
        <p style="font-size:13px;color:var(--texto-suave);margin-top:0;">
          Define a quantidade exata em stock para um produto num centro logístico (ex: depois de um inventário físico).
          A diferença fica registada automaticamente como "Ajuste de Inventário".
        </p>
        <form id="form-ajuste">
          <div class="campo"><label>Produto</label><select id="aj-produto">${opcoesProduto}</select></div>
          <div class="campo"><label>Centro Logístico</label><select id="aj-centro">${opcoesCentro}</select></div>
          <div class="campo"><label>Nova quantidade</label><input type="number" id="aj-quantidade" step="0.01" min="0" required></div>
          <div class="campo"><label>Documento de referência</label><input type="text" id="aj-documento" placeholder="opcional"></div>
          <button type="submit" class="botao botao-primario">Ajustar Stock</button>
        </form>
      </div>
    `;

    document.getElementById("form-ajuste").addEventListener("submit", async (ev) => {
      ev.preventDefault();
      try {
        await SigltApi.post("/Stock/ajustar", {
          produtoId: Number(document.getElementById("aj-produto").value),
          centroLogisticoId: Number(document.getElementById("aj-centro").value),
          novaQuantidade: Number(document.getElementById("aj-quantidade").value),
          documentoReferencia: document.getElementById("aj-documento").value || null
        });
        SigltUi.toast("Stock ajustado com sucesso.", "sucesso");
        document.getElementById("form-ajuste").reset();
      } catch (e) {
        SigltUi.erro(e);
      }
    });
  }

  await carregar();
});
