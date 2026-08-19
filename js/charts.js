/**
 * Pink Finance - charts.js
 * Gráfico de Pizza utilizando HTML5 Canvas 2D (Sem SVG / Sem bibliotecas externas)
 */

const PALETA_GRANULAR = [
  '#DB4F83', // Rosa principal
  '#EC6FA3', // Rosa destaque
  '#C9366F', // Rosa seleção
  '#E8A5C2', // Rosa suave
  '#9F2E59', // Rosa escuro profundo
  '#F48FB1', // Rosa pastel
  '#C2185B', // Carmim vibrante
  '#AD1457', // Magenta rosa
  '#FCE7F3', // Rosa bem claro (borda)
  '#D81B60'  // Rosa framboesa
];

/**
 * Renderiza o gráfico de pizza de despesas no elemento Canvas e atualiza a legenda e o destaque do maior gasto.
 * 
 * @param {string} canvasId - ID do elemento canvas
 * @param {Array} despesas - Lista de objetos de despesa [{ categoria, valor }]
 * @param {string} legendContainerId - ID do container da legenda
 * @param {string} highlightBannerId - ID do container de destaque
 */
function renderPieChart(canvasId, despesas, legendContainerId, highlightBannerId) {
  const canvas = document.getElementById(canvasId);
  const legendContainer = document.getElementById(legendContainerId);
  const highlightBanner = document.getElementById(highlightBannerId);

  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  
  // Ajustar resolução para alta densidade de pixels (Retina display)
  const rect = canvas.getBoundingClientRect();
  canvas.width = (rect.width || 280) * dpr;
  canvas.height = (rect.height || 280) * dpr;
  ctx.scale(dpr, dpr);

  const width = canvas.width / dpr;
  const height = canvas.height / dpr;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = Math.min(centerX, centerY) - 15;

  ctx.clearRect(0, 0, width, height);

  // Agrupar despesas por categoria
  const categoriasMap = {};
  let totalDespesas = 0;

  despesas.forEach(item => {
    const val = parseFloat(item.valor) || 0;
    if (val > 0) {
      categoriasMap[item.categoria] = (categoriasMap[item.categoria] || 0) + val;
      totalDespesas += val;
    }
  });

  const categorias = Object.keys(categoriasMap).map(cat => ({
    categoria: cat,
    valor: categoriasMap[cat],
    percentual: totalDespesas > 0 ? (categoriasMap[cat] / totalDespesas) * 100 : 0
  }));

  // Ordenar da maior para a menor despesa
  categorias.sort((a, b) => b.valor - a.valor);

  // Se não houver despesas no período
  if (categorias.length === 0 || totalDespesas === 0) {
    // Desenhar círculo placeholder neutro
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.fillStyle = '#FCE7F3';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#F3D5E2';
    ctx.stroke();

    ctx.fillStyle = '#806A74';
    ctx.font = '500 13px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('Sem despesas', centerX, centerY - 8);
    ctx.fillText('neste mês', centerX, centerY + 10);

    if (legendContainer) {
      legendContainer.innerHTML = '<div class="chart-empty-msg">Nenhuma despesa registrada para exibir no gráfico.</div>';
    }
    if (highlightBanner) {
      highlightBanner.innerHTML = '<span class="highlight-label">Maior gasto do mês:</span> <span class="highlight-value">Nenhum gasto registrado</span>';
    }
    return;
  }

  // Desenhar fatias do gráfico de pizza
  let startAngle = -Math.PI / 2; // Começar no topo (12h)

  categorias.forEach((item, index) => {
    const sliceAngle = (item.valor / totalDespesas) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;
    const color = PALETA_GRANULAR[index % PALETA_GRANULAR.length];

    // Fatias da pizza
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, startAngle, endAngle);
    ctx.closePath();

    ctx.fillStyle = color;
    ctx.fill();

    // Borda discreta entre fatias
    ctx.lineWidth = 1.5;
    ctx.strokeStyle = '#FFFFFF';
    ctx.stroke();

    startAngle = endAngle;
  });

  // Atualizar Destaque do Maior Gasto
  const maiorGasto = categorias[0];
  if (highlightBanner && maiorGasto) {
    highlightBanner.innerHTML = `
      <span class="highlight-label">Maior gasto do mês:</span> 
      <strong class="highlight-value">${escapeHTML(maiorGasto.categoria)} — R$ ${formatarMoeda(maiorGasto.valor)}</strong>
    `;
  }

  // Atualizar Legenda
  if (legendContainer) {
    let html = '<ul class="chart-legend-list">';
    categorias.forEach((item, index) => {
      const color = PALETA_GRANULAR[index % PALETA_GRANULAR.length];
      html += `
        <li class="legend-item">
          <div class="legend-color-box" style="background-color: ${color};"></div>
          <span class="legend-cat">${escapeHTML(item.categoria)}</span>
          <span class="legend-val">R$ ${formatarMoeda(item.valor)}</span>
          <span class="legend-pct">(${item.percentual.toFixed(1)}%)</span>
        </li>
      `;
    });
    html += '</ul>';
    legendContainer.innerHTML = html;
  }
}

function formatarMoeda(valor) {
  return (parseFloat(valor) || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
}

function escapeHTML(str) {
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
