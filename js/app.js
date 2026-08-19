/**
 * Controle Financeiro - app.js
 * Controlador Principal da Aplicação Single Page (Interface, Eventos, Filtros, Modais e Renderização)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // Estado Global da Aplicação
  const state = {
    currentYear: 2026,
    currentMonth: 7, // 0 = Jan, 7 = Agosto (Agosto 2026 inicial)
    categoryFilter: 'Todas',
    typeFilter: 'Todos'
  };

  const MESES_NOMBRES = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  // Referências DOM
  const btnPrevMonth = document.getElementById('btnPrevMonth');
  const btnNextMonth = document.getElementById('btnNextMonth');
  const currentPeriodLabel = document.getElementById('currentPeriodLabel');
  const selectMonth = document.getElementById('selectMonth');
  const selectYear = document.getElementById('selectYear');

  const filterCategory = document.getElementById('filterCategory');
  const filterType = document.getElementById('filterType');

  // Elementos do Resumo Financeiro
  const sumMinhaRenda = document.getElementById('sumMinhaRenda');
  const sumOutrasReceitas = document.getElementById('sumOutrasReceitas');
  const sumDespesas = document.getElementById('sumDespesas');
  const sumSaldo = document.getElementById('sumSaldo');
  const sumGastosFixos = document.getElementById('sumGastosFixos');
  const sumParcelamentos = document.getElementById('sumParcelamentos');

  // Tabelas
  const tbodyLancamentos = document.getElementById('tbodyLancamentos');
  const tbodyGastosFixos = document.getElementById('tbodyGastosFixos');
  const tbodyParcelamentos = document.getElementById('tbodyParcelamentos');

  // Badges de Seção
  const badgeFixosTotal = document.getElementById('badgeFixosTotal');
  const badgeFixosPago = document.getElementById('badgeFixosPago');
  const badgeFixosPendente = document.getElementById('badgeFixosPendente');
  const badgeFixosAtrasado = document.getElementById('badgeFixosAtrasado');

  const badgeParcAtivos = document.getElementById('badgeParcAtivos');
  const badgeParcValorMes = document.getElementById('badgeParcValorMes');
  const badgeParcTotalComprometido = document.getElementById('badgeParcTotalComprometido');

  // Modais e Formulários
  const modalRenda = document.getElementById('modalRenda');
  const formRenda = document.getElementById('formRenda');
  const btnOpenRendaModal = document.getElementById('btnOpenRendaModal');

  const modalLancamento = document.getElementById('modalLancamento');
  const formLancamento = document.getElementById('formLancamento');

  const modalGastoFixo = document.getElementById('modalGastoFixo');
  const formGastoFixo = document.getElementById('formGastoFixo');

  const modalParcelamento = document.getElementById('modalParcelamento');
  const formParcelamento = document.getElementById('formParcelamento');

  // Botões de Abertura de Modal
  const btnOpenLancamentoModal = document.getElementById('btnOpenLancamentoModal');
  const btnOpenGastoFixoModal = document.getElementById('btnOpenGastoFixoModal');
  const btnOpenParcelamentoModal = document.getElementById('btnOpenParcelamentoModal');

  /* ==========================================================================
     1. INICIALIZAÇÃO DA APLICAÇÃO
     ========================================================================== */

  try {
    await initDB();
    syncPeriodSelectors();
    await renderAll();
  } catch (err) {
    console.error('Erro na inicialização do Controle Financeiro:', err);
  }

  /* ==========================================================================
     2. EVENT LISTENERS DA INTERFACE
     ========================================================================== */

  // Navegação de Mês e Ano
  btnPrevMonth.addEventListener('click', () => {
    state.currentMonth--;
    if (state.currentMonth < 0) {
      state.currentMonth = 11;
      state.currentYear--;
    }
    syncPeriodSelectors();
    renderAll();
  });

  btnNextMonth.addEventListener('click', () => {
    state.currentMonth++;
    if (state.currentMonth > 11) {
      state.currentMonth = 0;
      state.currentYear++;
    }
    syncPeriodSelectors();
    renderAll();
  });

  selectMonth.addEventListener('change', (e) => {
    state.currentMonth = parseInt(e.target.value, 10);
    syncPeriodSelectors();
    renderAll();
  });

  selectYear.addEventListener('change', (e) => {
    state.currentYear = parseInt(e.target.value, 10);
    syncPeriodSelectors();
    renderAll();
  });

  // Filtros de Categoria e Tipo
  filterCategory.addEventListener('change', (e) => {
    state.categoryFilter = e.target.value;
    renderAll();
  });

  filterType.addEventListener('change', (e) => {
    state.typeFilter = e.target.value;
    renderAll();
  });

  // Fechamento genérico de modais via atributo data-close
  document.querySelectorAll('[data-close]').forEach(btn => {
    btn.addEventListener('click', () => {
      const modalId = btn.getAttribute('data-close');
      closeModal(modalId);
    });
  });

  // Modal Minha Renda
  btnOpenRendaModal.addEventListener('click', async () => {
    const mesAno = getMesAnoString();
    const rendaAtual = await getRenda(mesAno);
    document.getElementById('modalRendaPeriodo').textContent = `${MESES_NOMBRES[state.currentMonth].toUpperCase()} ${state.currentYear}`;
    document.getElementById('rendaValorInput').value = rendaAtual;
    openModal('modalRenda');
  });

  formRenda.addEventListener('submit', async (e) => {
    e.preventDefault();
    const mesAno = getMesAnoString();
    const novoValor = parseFloat(document.getElementById('rendaValorInput').value);
    if (isNaN(novoValor) || novoValor < 0) {
      alert('Por favor, informe um valor de renda válido.');
      return;
    }
    await saveRenda(mesAno, novoValor);
    closeModal('modalRenda');
    await renderAll();
  });

  // Modal Lançamento (Adicionar / Editar)
  btnOpenLancamentoModal.addEventListener('click', (e) => {
    e.preventDefault();
    openLancamentoModal();
  });

  formLancamento.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSaveLancamento();
  });

  // Modal Gasto Fixo
  btnOpenGastoFixoModal.addEventListener('click', (e) => {
    e.preventDefault();
    openGastoFixoModal();
  });

  formGastoFixo.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSaveGastoFixo();
  });

  // Modal Parcelamento
  btnOpenParcelamentoModal.addEventListener('click', (e) => {
    e.preventDefault();
    openParcelamentoModal();
  });

  formParcelamento.addEventListener('submit', async (e) => {
    e.preventDefault();
    await handleSaveParcelamento();
  });

  /* ==========================================================================
     3. FUNÇÃO PRINCIPAL DE RENDERIZAÇÃO
     ========================================================================== */

  async function renderAll() {
    const mesAno = getMesAnoString();

    // 1. Buscar Dados do IndexedDB
    const [minhaRendaVal, lancamentos, gastosFixos, parcelamentos] = await Promise.all([
      getRenda(mesAno),
      getLancamentos(mesAno, state.categoryFilter, state.typeFilter),
      getGastosFixos(mesAno),
      getParcelamentosForMonth(mesAno)
    ]);

    // 2. Calcular Resumo Financeiro com Minha Renda
    let outrasReceitasVal = 0;
    let totalDespesasVal = 0;

    lancamentos.forEach(item => {
      const val = parseFloat(item.valor) || 0;
      if (item.tipo === 'receita') {
        outrasReceitasVal += val;
      } else if (item.tipo === 'despesa') {
        totalDespesasVal += val;
      }
    });

    const totalGastosFixosVal = gastosFixos.reduce((acc, item) => acc + (parseFloat(item.valor) || 0), 0);
    const totalParcelamentosVal = parcelamentos.reduce((acc, item) => acc + (parseFloat(item.valorParcela) || 0), 0);

    // Saldo = Minha Renda + Outras Receitas - Total Despesas
    const saldoAtualVal = minhaRendaVal + outrasReceitasVal - totalDespesasVal;

    // Atualizar Células do Resumo
    sumMinhaRenda.textContent = formatMoney(minhaRendaVal);
    sumOutrasReceitas.textContent = formatMoney(outrasReceitasVal);
    sumDespesas.textContent = formatMoney(totalDespesasVal);
    sumSaldo.textContent = formatMoney(saldoAtualVal);
    sumSaldo.style.color = saldoAtualVal >= 0 ? 'var(--select-pink)' : 'var(--color-despesa)';
    sumGastosFixos.textContent = formatMoney(totalGastosFixosVal);
    sumParcelamentos.textContent = formatMoney(totalParcelamentosVal);

    // 3. Renderizar Tabela de Gastos do Mês
    renderLancamentosTable(lancamentos);

    // 4. Renderizar Gráfico de Pizza (Apenas Despesas)
    const despesasApenas = lancamentos.filter(item => item.tipo === 'despesa');
    renderPieChart('pieChart', despesasApenas, 'chartLegend', 'highlightBanner');

    // 5. Renderizar Gastos Fixos
    renderGastosFixosTable(gastosFixos);

    // 6. Renderizar Parcelamentos
    renderParcelamentosTable(parcelamentos);
  }

  /* ==========================================================================
     4. RENDERIZADORES DAS TABELAS
     ========================================================================== */

  function renderLancamentosTable(lancamentos) {
    if (lancamentos.length === 0) {
      tbodyLancamentos.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-table-msg">
              <p>Nenhum lançamento registrado neste mês.</p>
              <button class="btn-primary" id="btnEmptyAddLancamento">+ Adicionar lançamento</button>
            </div>
          </td>
        </tr>
      `;

      const btnEmpty = document.getElementById('btnEmptyAddLancamento');
      if (btnEmpty) {
        btnEmpty.addEventListener('click', () => openLancamentoModal());
      }
      return;
    }

    let html = '';
    lancamentos.forEach(item => {
      const isReceita = item.tipo === 'receita';
      const badgeClass = isReceita ? 'badge receita' : 'badge despesa';
      const tipoLabel = isReceita ? 'Receita' : 'Despesa';

      html += `
        <tr>
          <td>${formatDateBR(item.data)}</td>
          <td><strong>${escapeHTML(item.descricao)}</strong></td>
          <td>${escapeHTML(item.categoria)}</td>
          <td><span class="${badgeClass}">${tipoLabel}</span></td>
          <td class="num-col" style="color: ${isReceita ? 'var(--color-receita)' : 'var(--text-primary)'}">
            ${isReceita ? '+' : '-'} R$ ${formatMoneyVal(item.valor)}
          </td>
          <td class="center-col">
            <button class="btn-icon" data-action="edit-lanc" data-id="${item.id}" title="Editar">✏️</button>
            <button class="btn-icon delete" data-action="del-lanc" data-id="${item.id}" title="Excluir">🗑️</button>
          </td>
        </tr>
      `;
    });

    tbodyLancamentos.innerHTML = html;

    // Vincular eventos estritamente com addEventListener em cada botão gerado
    tbodyLancamentos.querySelectorAll('[data-action]').forEach(btn => {
      const action = btn.getAttribute('data-action');
      const id = Number(btn.getAttribute('data-id'));

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (action === 'edit-lanc') {
          const item = lancamentos.find(x => x.id === id);
          if (item) openLancamentoModal(item);
        } else if (action === 'del-lanc') {
          confirmDelete('Tem certeza de que deseja excluir este lançamento?', async () => {
            await deleteLancamento(id);
            await renderAll();
          });
        }
      });
    });
  }

  function renderGastosFixosTable(gastosFixos) {
    let totalFixos = 0;
    let totalPago = 0;
    let totalPendente = 0;
    let totalAtrasado = 0;

    gastosFixos.forEach(item => {
      const val = parseFloat(item.valor) || 0;
      totalFixos += val;
      if (item.status === 'pago') totalPago += val;
      else if (item.status === 'pendente') totalPendente += val;
      else if (item.status === 'atrasado') totalAtrasado += val;
    });

    badgeFixosTotal.textContent = formatMoney(totalFixos);
    badgeFixosPago.textContent = formatMoney(totalPago);
    badgeFixosPendente.textContent = formatMoney(totalPendente);
    badgeFixosAtrasado.textContent = formatMoney(totalAtrasado);

    if (gastosFixos.length === 0) {
      tbodyGastosFixos.innerHTML = `
        <tr>
          <td colspan="6">
            <div class="empty-table-msg">Nenhum gasto fixo cadastrado para este mês.</div>
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    gastosFixos.forEach(item => {
      const statusClass = `badge-status ${item.status}`;
      const statusLabel = item.status.charAt(0).toUpperCase() + item.status.slice(1);

      html += `
        <tr>
          <td><strong>${escapeHTML(item.despesa)}</strong></td>
          <td>${escapeHTML(item.categoria)}</td>
          <td>${escapeHTML(item.vencimento)}</td>
          <td class="num-col">R$ ${formatMoneyVal(item.valor)}</td>
          <td class="center-col">
            <button class="${statusClass}" data-action="toggle-status-gf" data-id="${item.id}" title="Clique para alterar status">
              ${statusLabel}
            </button>
          </td>
          <td class="center-col">
            <button class="btn-icon" data-action="edit-gf" data-id="${item.id}" title="Editar">✏️</button>
            <button class="btn-icon delete" data-action="del-gf" data-id="${item.id}" title="Excluir">🗑️</button>
          </td>
        </tr>
      `;
    });

    tbodyGastosFixos.innerHTML = html;

    tbodyGastosFixos.querySelectorAll('[data-action]').forEach(btn => {
      const action = btn.getAttribute('data-action');
      const id = Number(btn.getAttribute('data-id'));
      const item = gastosFixos.find(x => x.id === id);

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (action === 'toggle-status-gf' && item) {
          const nextStatus = item.status === 'pago' ? 'pendente' : item.status === 'pendente' ? 'atrasado' : 'pago';
          item.status = nextStatus;
          updateGastoFixo(item).then(() => renderAll());
        } else if (action === 'edit-gf' && item) {
          openGastoFixoModal(item);
        } else if (action === 'del-gf') {
          confirmDelete('Deseja excluir este gasto fixo?', async () => {
            await deleteGastoFixo(id);
            await renderAll();
          });
        }
      });
    });
  }

  function renderParcelamentosTable(parcelamentos) {
    let valorParcelasMes = 0;
    let totalComprometido = 0;

    parcelamentos.forEach(item => {
      valorParcelasMes += parseFloat(item.valorParcela) || 0;
      totalComprometido += parseFloat(item.valorTotal) || 0;
    });

    badgeParcAtivos.textContent = parcelamentos.length;
    badgeParcValorMes.textContent = formatMoney(valorParcelasMes);
    badgeParcTotalComprometido.textContent = formatMoney(totalComprometido);

    if (parcelamentos.length === 0) {
      tbodyParcelamentos.innerHTML = `
        <tr>
          <td colspan="7">
            <div class="empty-table-msg">Nenhum parcelamento ativo neste mês.</div>
          </td>
        </tr>
      `;
      return;
    }

    let html = '';
    parcelamentos.forEach(item => {
      html += `
        <tr>
          <td><strong>${escapeHTML(item.compra)}</strong></td>
          <td>${escapeHTML(item.categoria)}</td>
          <td class="center-col"><strong>${item.parcelaAtual}/${item.parcelasTotais}</strong></td>
          <td class="num-col">R$ ${formatMoneyVal(item.valorParcela)}</td>
          <td>${item.vencimento || '-'}</td>
          <td class="center-col"><span class="badge-status ativo">Ativo</span></td>
          <td class="center-col">
            <button class="btn-icon" data-action="edit-parc" data-id="${item.id}" title="Editar">✏️</button>
            <button class="btn-icon delete" data-action="del-parc" data-id="${item.id}" title="Excluir">🗑️</button>
          </td>
        </tr>
      `;
    });

    tbodyParcelamentos.innerHTML = html;

    tbodyParcelamentos.querySelectorAll('[data-action]').forEach(btn => {
      const action = btn.getAttribute('data-action');
      const id = Number(btn.getAttribute('data-id'));
      const item = parcelamentos.find(x => x.id === id);

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        if (action === 'edit-parc' && item) {
          openParcelamentoModal(item);
        } else if (action === 'del-parc') {
          confirmDelete('Deseja excluir este parcelamento?', async () => {
            await deleteParcelamento(id);
            await renderAll();
          });
        }
      });
    });
  }

  /* ==========================================================================
     5. MODAIS E LÓGICA DE SALVAMENTO
     ========================================================================== */

  function openLancamentoModal(item = null) {
    formLancamento.reset();
    document.getElementById('lancamentoId').value = item ? item.id : '';
    document.getElementById('modalLancamentoTitle').textContent = item ? 'Editar Lançamento' : 'Novo Lançamento';

    const todayStr = `${state.currentYear}-${String(state.currentMonth + 1).padStart(2, '0')}-15`;
    document.getElementById('lancamentoData').value = item ? item.data : todayStr;
    document.getElementById('lancamentoDescricao').value = item ? item.descricao : '';
    document.getElementById('lancamentoTipo').value = item ? item.tipo : 'despesa';
    document.getElementById('lancamentoCategoria').value = item ? item.categoria : 'Comida';
    document.getElementById('lancamentoValor').value = item ? item.valor : '';

    openModal('modalLancamento');
  }

  async function handleSaveLancamento() {
    const id = document.getElementById('lancamentoId').value;
    const data = document.getElementById('lancamentoData').value;
    const descricao = document.getElementById('lancamentoDescricao').value.trim();
    const tipo = document.getElementById('lancamentoTipo').value;
    const categoria = document.getElementById('lancamentoCategoria').value;
    const valor = parseFloat(document.getElementById('lancamentoValor').value);

    if (!descricao || isNaN(valor) || valor <= 0 || !data) {
      alert('Por favor, informe valores válidos maiores que zero.');
      return;
    }

    const payload = {
      descricao,
      tipo,
      categoria,
      valor,
      data,
      mesAno: data.substring(0, 7)
    };

    if (id) {
      payload.id = Number(id);
      await updateLancamento(payload);
    } else {
      await addLancamento(payload);
    }

    closeModal('modalLancamento');
    await renderAll();
  }

  function openGastoFixoModal(item = null) {
    formGastoFixo.reset();
    document.getElementById('gastoFixoId').value = item ? item.id : '';
    document.getElementById('modalGastoFixoTitle').textContent = item ? 'Editar Gasto Fixo' : 'Novo Gasto Fixo';

    document.getElementById('gastoFixoDespesa').value = item ? item.despesa : '';
    document.getElementById('gastoFixoCategoria').value = item ? item.categoria : 'Moradia';
    document.getElementById('gastoFixoDiaVencimento').value = item ? item.diaVencimento : 10;
    document.getElementById('gastoFixoValor').value = item ? item.valor : '';
    document.getElementById('gastoFixoStatus').value = item ? item.status : 'pendente';

    openModal('modalGastoFixo');
  }

  async function handleSaveGastoFixo() {
    const id = document.getElementById('gastoFixoId').value;
    const despesa = document.getElementById('gastoFixoDespesa').value.trim();
    const categoria = document.getElementById('gastoFixoCategoria').value;
    const diaVencimento = parseInt(document.getElementById('gastoFixoDiaVencimento').value, 10);
    const valor = parseFloat(document.getElementById('gastoFixoValor').value);
    const status = document.getElementById('gastoFixoStatus').value;

    if (!despesa || isNaN(valor) || valor <= 0 || isNaN(diaVencimento)) {
      alert('Por favor, informe valores válidos para o gasto fixo.');
      return;
    }

    const mesAno = getMesAnoString();
    const [year, month] = mesAno.split('-');
    const vencimentoStr = `${String(diaVencimento).padStart(2, '0')}/${month}/${year}`;

    const payload = {
      despesa,
      categoria,
      diaVencimento,
      vencimento: vencimentoStr,
      valor,
      status,
      mesAno
    };

    if (id) {
      payload.id = Number(id);
      await updateGastoFixo(payload);
    } else {
      await addGastoFixo(payload);
    }

    closeModal('modalGastoFixo');
    await renderAll();
  }

  function openParcelamentoModal(item = null) {
    formParcelamento.reset();
    document.getElementById('parcelamentoId').value = item ? item.id : '';
    document.getElementById('modalParcelamentoTitle').textContent = item ? 'Editar Parcelamento' : 'Novo Parcelamento';

    const defaultDate = `${state.currentYear}-${String(state.currentMonth + 1).padStart(2, '0')}-10`;
    document.getElementById('parcelamentoCompra').value = item ? item.compra : '';
    document.getElementById('parcelamentoCategoria').value = item ? item.categoria : 'Eletrônicos';
    document.getElementById('parcelamentoDataInicio').value = item ? item.dataInicio : defaultDate;
    document.getElementById('parcelamentoValorTotal').value = item ? item.valorTotal : '';
    document.getElementById('parcelamentoParcelasTotais').value = item ? item.parcelasTotais : 12;
    document.getElementById('parcelamentoValorParcela').value = item ? item.valorParcela : '';
    document.getElementById('parcelamentoDiaVencimento').value = item ? item.diaVencimento : 10;

    openModal('modalParcelamento');
  }

  async function handleSaveParcelamento() {
    const id = document.getElementById('parcelamentoId').value;
    const compra = document.getElementById('parcelamentoCompra').value.trim();
    const categoria = document.getElementById('parcelamentoCategoria').value;
    const dataInicio = document.getElementById('parcelamentoDataInicio').value;
    const valorTotal = parseFloat(document.getElementById('parcelamentoValorTotal').value);
    const parcelasTotais = parseInt(document.getElementById('parcelamentoParcelasTotais').value, 10);
    const valorParcela = parseFloat(document.getElementById('parcelamentoValorParcela').value);
    const diaVencimento = parseInt(document.getElementById('parcelamentoDiaVencimento').value, 10);

    if (!compra || isNaN(valorTotal) || isNaN(valorParcela) || valorTotal <= 0 || valorParcela <= 0 || !dataInicio) {
      alert('Por favor, preencha todos os campos com valores maiores que zero.');
      return;
    }

    const payload = {
      compra,
      categoria,
      dataInicio,
      valorTotal,
      parcelasTotais,
      valorParcela,
      diaVencimento,
      status: 'ativo'
    };

    if (id) {
      payload.id = Number(id);
      await updateParcelamento(payload);
    } else {
      await addParcelamento(payload);
    }

    closeModal('modalParcelamento');
    await renderAll();
  }

  /* ==========================================================================
     6. FUNÇÕES AUXILIARES
     ========================================================================== */

  function syncPeriodSelectors() {
    currentPeriodLabel.textContent = `${MESES_NOMBRES[state.currentMonth]} ${state.currentYear}`;
    selectMonth.value = state.currentMonth;
    selectYear.value = state.currentYear;
  }

  function getMesAnoString() {
    const m = String(state.currentMonth + 1).padStart(2, '0');
    return `${state.currentYear}-${m}`;
  }

  function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) {
      el.classList.add('active');
      el.setAttribute('aria-hidden', 'false');
    }
  }

  function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) {
      el.classList.remove('active');
      el.setAttribute('aria-hidden', 'true');
    }
  }

  function confirmDelete(msg, onConfirm) {
    if (window.confirm(msg)) {
      onConfirm();
    }
  }

  function formatMoney(val) {
    return 'R$ ' + formatMoneyVal(val);
  }

  function formatMoneyVal(val) {
    return (parseFloat(val) || 0).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  function formatDateBR(dateStr) {
    if (!dateStr) return '-';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }

  function escapeHTML(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
});
