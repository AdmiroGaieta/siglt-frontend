SigltRouter.registar("dashboard", async (container) => {
  const dados = await SigltApi.get("/Dashboard");

  const barra = (valor, total) => {
    const pct = total > 0 ? Math.min(100, Math.round((valor / total) * 100)) : 0;
    return `<div class="barra-progresso"><div style="width:${pct}%"></div></div>`;
  };

  const totalEfetivos = dados.efetivos.totalEfetivos || 0;
  const linhasArea = Object.entries(dados.efetivos.totalPorArea || {})
    .map(([area, total]) => `
      <div style="margin-bottom:10px;">
        <div style="display:flex;justify-content:space-between;font-size:13px;">
          <span>${SigltUi.escapeHtml(area)}</span><span>${total}</span>
        </div>
        ${barra(total, totalEfetivos)}
      </div>`)
    .join("") || '<div class="vazio">Sem dados de efetivos.</div>';

  container.innerHTML = `
    <div class="cabecalho-view"><h1>Dashboard</h1></div>

    <div class="grid-cards">
      <div class="card-indicador">
        <div class="titulo">Viaturas ativas</div>
        <div class="valor">${dados.transporte.viaturasAtivas}</div>
      </div>
      <div class="card-indicador">
        <div class="titulo">Viagens em curso</div>
        <div class="valor">${dados.transporte.viagensEmCurso}</div>
      </div>
      <div class="card-indicador">
        <div class="titulo">Entregas pendentes</div>
        <div class="valor">${dados.logistica.entregasPendentes}</div>
      </div>
      <div class="card-indicador">
        <div class="titulo">Entregas concluídas</div>
        <div class="valor">${dados.logistica.entregasConcluidas}</div>
      </div>
      <div class="card-indicador">
        <div class="titulo">Stock disponível</div>
        <div class="valor">${SigltUi.formatarNumero(dados.stock.quantidadeTotalDisponivel)}</div>
        ${dados.stock.produtosCriticos > 0 ? `<div class="extra" style="color:var(--vermelho)">⚠ ${dados.stock.produtosCriticos} produto(s) críticos</div>` : ""}
      </div>
      <div class="card-indicador">
        <div class="titulo">Efetivos disponíveis</div>
        <div class="valor">${dados.efetivos.colaboradoresDisponiveis} / ${totalEfetivos}</div>
      </div>
      <div class="card-indicador">
        <div class="titulo">Custo manutenção (mês)</div>
        <div class="valor">${SigltUi.formatarNumero(dados.transporte.custoTotalManutencaoMes)} Kz</div>
      </div>
      <div class="card-indicador">
        <div class="titulo">Custo combustível (mês)</div>
        <div class="valor">${SigltUi.formatarNumero(dados.transporte.custoTotalCombustivelMes)} Kz</div>
      </div>
    </div>

    <div class="cartao">
      <h2 style="margin-top:0;font-size:15px;">Efetivos por área</h2>
      ${linhasArea}
    </div>
  `;
});
