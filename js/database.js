/**
 * Controle Financeiro - database.js
 * Gerenciador de persistência via IndexedDB com suporte a fallback de dados locais
 */

const DB_NAME = 'ControleFinanceiroDB';
const DB_VERSION = 2; // Atualizado para suportar a store 'rendas'

let dbInstance = null;

// Dados de fallback para execução via protocolo file:// sem dependência de CORS/fetch
const DEFAULT_LANCAMENTOS = [
  { id: 1, descricao: "Freela Design", categoria: "Freelance", tipo: "receita", valor: 850.00, data: "2026-08-12", mesAno: "2026-08" },
  { id: 2, descricao: "Supermercado Semanal", categoria: "Comida", tipo: "despesa", valor: 420.50, data: "2026-08-05", mesAno: "2026-08" },
  { id: 3, descricao: "Almoço de Domingo", categoria: "Comida", tipo: "despesa", valor: 65.00, data: "2026-08-19", mesAno: "2026-08" },
  { id: 4, descricao: "Corrida Uber Trabalho", categoria: "Uber", tipo: "despesa", valor: 22.50, data: "2026-08-18", mesAno: "2026-08" },
  { id: 5, descricao: "Presente de Aniversário", categoria: "Presente", tipo: "despesa", valor: 80.00, data: "2026-08-17", mesAno: "2026-08" },
  { id: 6, descricao: "Blusa Rosa de Frio", categoria: "Roupa", tipo: "despesa", valor: 120.00, data: "2026-08-15", mesAno: "2026-08" },
  { id: 7, descricao: "Corte de Cabelo e Unha", categoria: "Beleza", tipo: "despesa", valor: 180.00, data: "2026-08-10", mesAno: "2026-08" },
  { id: 8, descricao: "Farmácia e Remédios", categoria: "Saúde", tipo: "despesa", valor: 95.40, data: "2026-08-08", mesAno: "2026-08" },
  { id: 9, descricao: "Restaurante com Amigos", categoria: "Comida", tipo: "despesa", valor: 230.00, data: "2026-07-15", mesAno: "2026-07" },
  { id: 10, descricao: "Calça Jeans", categoria: "Roupa", tipo: "despesa", valor: 190.00, data: "2026-07-20", mesAno: "2026-07" },
  { id: 11, descricao: "Feira da Semana", categoria: "Comida", tipo: "despesa", valor: 150.00, data: "2026-09-03", mesAno: "2026-09" }
];

const DEFAULT_GASTOS_FIXOS = [
  { id: 1, despesa: "Aluguel", categoria: "Moradia", vencimento: "05/08/2026", diaVencimento: 5, valor: 800.00, status: "pago", mesAno: "2026-08" },
  { id: 2, despesa: "Internet Fibra", categoria: "Moradia", vencimento: "10/08/2026", diaVencimento: 10, valor: 100.00, status: "pago", mesAno: "2026-08" },
  { id: 3, despesa: "Academia", categoria: "Saúde", vencimento: "15/08/2026", diaVencimento: 15, valor: 80.00, status: "pendente", mesAno: "2026-08" },
  { id: 4, despesa: "Netflix", categoria: "Lazer", vencimento: "20/08/2026", diaVencimento: 20, valor: 40.00, status: "pendente", mesAno: "2026-08" },
  { id: 5, despesa: "Plano de Saúde", categoria: "Saúde", vencimento: "02/08/2026", diaVencimento: 2, valor: 250.00, status: "atrasado", mesAno: "2026-08" },
  { id: 6, despesa: "Aluguel", categoria: "Moradia", vencimento: "05/07/2026", diaVencimento: 5, valor: 800.00, status: "pago", mesAno: "2026-07" },
  { id: 7, despesa: "Internet Fibra", categoria: "Moradia", vencimento: "10/07/2026", diaVencimento: 10, valor: 100.00, status: "pago", mesAno: "2026-07" },
  { id: 8, despesa: "Aluguel", categoria: "Moradia", vencimento: "05/09/2026", diaVencimento: 5, valor: 800.00, status: "pendente", mesAno: "2026-09" }
];

const DEFAULT_PARCELAMENTOS = [
  { id: 1, compra: "Notebook", categoria: "Eletrônicos", valorTotal: 3600.00, valorParcela: 300.00, parcelasTotais: 12, dataInicio: "2026-04-10", diaVencimento: 10, status: "ativo" },
  { id: 2, compra: "Tênis", categoria: "Roupa", valorTotal: 600.00, valorParcela: 120.00, parcelasTotais: 5, dataInicio: "2026-07-15", diaVencimento: 15, status: "ativo" },
  { id: 3, compra: "Curso Online UX", categoria: "Educação", valorTotal: 1500.00, valorParcela: 250.00, parcelasTotais: 6, dataInicio: "2026-03-05", diaVencimento: 5, status: "ativo" }
];

const DEFAULT_RENDAS = [
  { mesAno: "2026-07", valor: 2500.00 },
  { mesAno: "2026-08", valor: 2500.00 },
  { mesAno: "2026-09", valor: 2700.00 }
];

/**
 * Inicializa o banco de dados IndexedDB
 */
function initDB() {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;

      if (!db.objectStoreNames.contains('lancamentos')) {
        const lancStore = db.createObjectStore('lancamentos', { keyPath: 'id', autoIncrement: true });
        lancStore.createIndex('mesAno', 'mesAno', { unique: false });
        lancStore.createIndex('categoria', 'categoria', { unique: false });
        lancStore.createIndex('tipo', 'tipo', { unique: false });
      }

      if (!db.objectStoreNames.contains('gastos_fixos')) {
        const gfStore = db.createObjectStore('gastos_fixos', { keyPath: 'id', autoIncrement: true });
        gfStore.createIndex('mesAno', 'mesAno', { unique: false });
      }

      if (!db.objectStoreNames.contains('parcelamentos')) {
        const parcStore = db.createObjectStore('parcelamentos', { keyPath: 'id', autoIncrement: true });
        parcStore.createIndex('status', 'status', { unique: false });
      }

      if (!db.objectStoreNames.contains('rendas')) {
        db.createObjectStore('rendas', { keyPath: 'mesAno' });
      }
    };

    request.onsuccess = async (event) => {
      dbInstance = event.target.result;
      try {
        await seedInitialDataIfNeeded(dbInstance);
        resolve(dbInstance);
      } catch (err) {
        console.warn('Carga com fallback concluída:', err);
        resolve(dbInstance);
      }
    };

    request.onerror = (event) => {
      console.error('Erro ao abrir IndexedDB:', event.target.error);
      reject(event.target.error);
    };
  });
}

/**
 * Popula o IndexedDB com os dados iniciais.
 * Se o protocolo for file:// ou se fetch() falhar devido a bloqueio CORS,
 * utiliza com segurança os arrays de fallback embutidos.
 */
async function seedInitialDataIfNeeded(db) {
  const count = await getStoreCount(db, 'lancamentos');
  if (count > 0) return; // Já possui dados cadastrados

  let lancamentos = DEFAULT_LANCAMENTOS;
  let gastosFixos = DEFAULT_GASTOS_FIXOS;
  let parcelamentos = DEFAULT_PARCELAMENTOS;
  let rendas = DEFAULT_RENDAS;

  // Se estiver rodando via servidor HTTP (http: ou https:), tentar ler dos arquivos JSON
  if (window.location.protocol === 'http:' || window.location.protocol === 'https:') {
    try {
      const [lancRes, gfRes, parcRes] = await Promise.all([
        fetch('data/lancamentos.json'),
        fetch('data/gastos-fixos.json'),
        fetch('data/parcelamentos.json')
      ]);

      if (lancRes.ok && gfRes.ok && parcRes.ok) {
        lancamentos = await lancRes.json();
        gastosFixos = await gfRes.json();
        parcelamentos = await parcRes.json();
        console.log('Dados iniciais carregados via fetch() dos arquivos JSON.');
      }
    } catch (e) {
      console.info('Fetch não disponível ou bloqueado. Utilizando dados iniciais locais.');
    }
  } else {
    console.info('Execução via protocolo file://. Utilizando dados iniciais incorporados com segurança.');
  }

  const tx = db.transaction(['lancamentos', 'gastos_fixos', 'parcelamentos', 'rendas'], 'readwrite');
  const lancStore = tx.objectStore('lancamentos');
  const gfStore = tx.objectStore('gastos_fixos');
  const parcStore = tx.objectStore('parcelamentos');
  const rendaStore = tx.objectStore('rendas');

  lancamentos.forEach(item => {
    const obj = { ...item };
    delete obj.id; // deixa o autoIncrement do IndexedDB gerar IDs limpos
    lancStore.add(obj);
  });
  gastosFixos.forEach(item => {
    const obj = { ...item };
    delete obj.id;
    gfStore.add(obj);
  });
  parcelamentos.forEach(item => {
    const obj = { ...item };
    delete obj.id;
    parcStore.add(obj);
  });
  rendas.forEach(item => rendaStore.add(item));

  return new Promise((resolve, reject) => {
    tx.oncomplete = () => {
      console.log('IndexedDB semeado com sucesso!');
      resolve();
    };
    tx.onerror = (e) => reject(e.target.error);
  });
}

function getStoreCount(db, storeName) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, 'readonly');
    const store = tx.objectStore(storeName);
    const request = store.count();
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

/* ==========================================================================
   CRUD: MINHA RENDA MENSAL
   ========================================================================== */

async function getRenda(mesAno) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('rendas', 'readonly');
    const store = tx.objectStore('rendas');
    const request = store.get(mesAno);

    request.onsuccess = () => {
      if (request.result) {
        resolve(parseFloat(request.result.valor) || 0);
      } else {
        // Se não houver renda definida para este mês específico, utiliza 2.500,00 como valor padrão
        resolve(2500.00);
      }
    };
    request.onerror = (e) => reject(e.target.error);
  });
}

async function saveRenda(mesAno, valor) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('rendas', 'readwrite');
    const store = tx.objectStore('rendas');
    const request = store.put({ mesAno, valor: parseFloat(valor) || 0 });
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

/* ==========================================================================
   CRUD: LANÇAMENTOS (GASTOS E OUTRAS RECEITAS DO MÊS)
   ========================================================================== */

async function getLancamentos(mesAno, categoriaFilter = 'Todas', tipoFilter = 'Todos') {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('lancamentos', 'readonly');
    const store = tx.objectStore('lancamentos');
    const index = store.index('mesAno');
    const request = index.getAll(mesAno);

    request.onsuccess = () => {
      let result = request.result || [];
      
      if (categoriaFilter && categoriaFilter !== 'Todas') {
        result = result.filter(item => item.categoria === categoriaFilter);
      }

      if (tipoFilter && tipoFilter !== 'Todos') {
        result = result.filter(item => item.tipo.toLowerCase() === tipoFilter.toLowerCase());
      }

      // Ordenar por data decrescente
      result.sort((a, b) => new Date(b.data) - new Date(a.data));
      resolve(result);
    };

    request.onerror = (e) => reject(e.target.error);
  });
}

async function addLancamento(item) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('lancamentos', 'readwrite');
    const store = tx.objectStore('lancamentos');
    
    if (!item.mesAno && item.data) {
      item.mesAno = item.data.substring(0, 7);
    }
    item.valor = parseFloat(item.valor);

    const request = store.add(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function updateLancamento(item) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('lancamentos', 'readwrite');
    const store = tx.objectStore('lancamentos');
    
    if (!item.mesAno && item.data) {
      item.mesAno = item.data.substring(0, 7);
    }
    item.valor = parseFloat(item.valor);

    const request = store.put(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function deleteLancamento(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('lancamentos', 'readwrite');
    const store = tx.objectStore('lancamentos');
    const request = store.delete(Number(id));
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

/* ==========================================================================
   CRUD: GASTOS FIXOS
   ========================================================================== */

async function getGastosFixos(mesAno) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('gastos_fixos', 'readonly');
    const store = tx.objectStore('gastos_fixos');
    const index = store.index('mesAno');
    const request = index.getAll(mesAno);

    request.onsuccess = async () => {
      let result = request.result || [];
      
      if (result.length === 0) {
        const allItems = await getAllGastosFixos(db);
        if (allItems.length > 0) {
          const templates = {};
          allItems.forEach(item => {
            if (!templates[item.despesa] || item.mesAno > templates[item.despesa].mesAno) {
              templates[item.despesa] = item;
            }
          });

          const writeTx = db.transaction('gastos_fixos', 'readwrite');
          const writeStore = writeTx.objectStore('gastos_fixos');
          const [year, month] = mesAno.split('-');
          
          for (const name in templates) {
            const template = templates[name];
            const dia = template.diaVencimento || 10;
            const vencimentoStr = `${String(dia).padStart(2, '0')}/${month}/${year}`;
            
            const newItem = {
              despesa: template.despesa,
              categoria: template.categoria,
              vencimento: vencimentoStr,
              diaVencimento: dia,
              valor: template.valor,
              status: 'pendente',
              mesAno: mesAno
            };
            writeStore.add(newItem);
          }
          
          writeTx.oncomplete = async () => {
            const refreshTx = db.transaction('gastos_fixos', 'readonly');
            const refreshStore = refreshTx.objectStore('gastos_fixos');
            const refreshIndex = refreshStore.index('mesAno');
            const req = refreshIndex.getAll(mesAno);
            req.onsuccess = () => resolve(req.result || []);
          };
          return;
        }
      }
      
      resolve(result);
    };

    request.onerror = (e) => reject(e.target.error);
  });
}

function getAllGastosFixos(db) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction('gastos_fixos', 'readonly');
    const store = tx.objectStore('gastos_fixos');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function addGastoFixo(item) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('gastos_fixos', 'readwrite');
    const store = tx.objectStore('gastos_fixos');
    
    item.valor = parseFloat(item.valor);
    if (!item.status) item.status = 'pendente';

    const request = store.add(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function updateGastoFixo(item) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('gastos_fixos', 'readwrite');
    const store = tx.objectStore('gastos_fixos');
    
    item.valor = parseFloat(item.valor);

    const request = store.put(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function deleteGastoFixo(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('gastos_fixos', 'readwrite');
    const store = tx.objectStore('gastos_fixos');
    const request = store.delete(Number(id));
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}

/* ==========================================================================
   CRUD: PARCELAMENTOS
   ========================================================================== */

async function getParcelamentosForMonth(mesAno) {
  const db = await initDB();
  const allParcelamentos = await new Promise((resolve, reject) => {
    const tx = db.transaction('parcelamentos', 'readonly');
    const store = tx.objectStore('parcelamentos');
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result || []);
    request.onerror = (e) => reject(e.target.error);
  });

  const [targetYear, targetMonth] = mesAno.split('-').map(Number);
  const targetIndex = targetYear * 12 + (targetMonth - 1);

  const activeForMonth = [];

  for (const item of allParcelamentos) {
    if (item.status === 'concluido') continue;

    const startDate = new Date(item.dataInicio + 'T00:00:00');
    const startYear = startDate.getFullYear();
    const startMonth = startDate.getMonth();
    const startIndex = startYear * 12 + startMonth;

    const diffMonths = targetIndex - startIndex;
    const parcelaCalculada = diffMonths + 1;

    if (parcelaCalculada >= 1 && parcelaCalculada <= item.parcelasTotais) {
      const diaStr = String(item.diaVencimento || 10).padStart(2, '0');
      const mesStr = String(targetMonth).padStart(2, '0');
      
      activeForMonth.push({
        ...item,
        parcelaAtual: parcelaCalculada,
        vencimento: `${diaStr}/${mesStr}/${targetYear}`
      });
    }
  }

  return activeForMonth;
}

async function addParcelamento(item) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('parcelamentos', 'readwrite');
    const store = tx.objectStore('parcelamentos');
    
    item.valorTotal = parseFloat(item.valorTotal);
    item.valorParcela = parseFloat(item.valorParcela);
    item.parcelasTotais = parseInt(item.parcelasTotais, 10);
    item.diaVencimento = parseInt(item.diaVencimento, 10);
    if (!item.status) item.status = 'ativo';

    const request = store.add(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function updateParcelamento(item) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('parcelamentos', 'readwrite');
    const store = tx.objectStore('parcelamentos');
    
    item.valorTotal = parseFloat(item.valorTotal);
    item.valorParcela = parseFloat(item.valorParcela);
    item.parcelasTotais = parseInt(item.parcelasTotais, 10);

    const request = store.put(item);
    request.onsuccess = () => resolve(request.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

async function deleteParcelamento(id) {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('parcelamentos', 'readwrite');
    const store = tx.objectStore('parcelamentos');
    const request = store.delete(Number(id));
    request.onsuccess = () => resolve();
    request.onerror = (e) => reject(e.target.error);
  });
}
