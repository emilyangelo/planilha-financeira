# Controle Financeiro — Gerenciador Financeiro Pessoal

## 1. Nome do Projeto

**Controle Financeiro — Gerenciador Financeiro Pessoal**

## 2. Descrição

O **Controle Financeiro** é uma aplicação web para controle financeiro pessoal, desenvolvida como projeto acadêmico. A aplicação funciona como uma planilha financeira inteligente de tela única (Single-Page Application), inspirada no visual do Excel/Google Sheets, com uma interface moderna, organizada e com paleta em tons de rosa claro. O sistema permite ao usuário gerenciar renda mensal, receitas adicionais, despesas, gastos fixos e compras parceladas com visualização por mês e ano.

## 3. Funcionalidades

- **Registro de Minha Renda**: Campo dedicado para definir e editar a renda mensal fixa para cada mês (ex: R$ 2.500,00 em Agosto, R$ 2.700,00 em Setembro).
- **Cadastro de receitas adicionais**: Registro de outras receitas pontuais (Freelances, Investimentos, etc.).
- **Cadastro de despesas**: Registro de despesas pontuais do mês com valor, data e categoria.
- **Categorias de gastos**: Agrupamento por Comida, Uber, Roupa, Presente, Beleza, Moradia, Transporte, Lazer, Saúde, Educação, Salário, Freelance, Investimentos e Outros.
- **Filtro por categoria**: Filtragem dinâmica da tabela de lançamentos por categoria específica ou todas.
- **Filtro por mês e ano**: Navegação entre meses anteriores e futuros mantendo o histórico de dados de cada período.
- **Controle de gastos fixos**: Gerenciamento de despesas recorrentes mensais com controle de status (Pago, Pendente, Atrasado).
- **Controle de parcelamentos**: Acompanhamento de compras parceladas com cálculo automático da parcela do mês consultado (ex: 5/12).
- **Cálculo de saldo**: Cálculo automático do saldo através da fórmula `Saldo = Minha Renda + Outras Receitas - Total de Despesas`.
- **Indicadores financeiros**: Células de resumo com Minha Renda, Outras Receitas, Total Despesas, Saldo Atual, Gastos Fixos e Parcelamentos.
- **Gráfico de distribuição dos gastos**: Gráfico de pizza em HTML5 Canvas 2D exibindo a proporção de despesas por categoria no mês selecionado.
- **Identificação do maior gasto do mês**: Destaque automático da categoria de maior impacto financeiro no mês.
- **Edição e exclusão de registros**: Permite editar e excluir lançamentos, gastos fixos e parcelamentos com diálogo de confirmação.
- **Histórico mensal**: Preservação dos dados de cada mês no navegador.
- **Persistência com IndexedDB**: Armazenamento dos dados diretamente no navegador do usuário.
- **Dados iniciais em JSON com suporte a fallback**: Carregamento automático via `fetch()` em servidores HTTP e fallback seguro em `file://`.
- **Interface responsiva**: Adaptação para telas de computadores, notebooks, tablets e smartphones.

## 4. Tecnologias

- **HTML5**
- **CSS3**
- **JavaScript ES6+**
- **JSON**
- **IndexedDB**

## 5. Estrutura do Projeto

```
controle-financeiro/
├── .gitignore
├── README.md
├── index.html
├── data/
│   ├── lancamentos.json
│   ├── gastos-fixos.json
│   └── parcelamentos.json
├── css/
│   └── styles.css
└── js/
    ├── app.js
    ├── database.js
    └── charts.js
```

### Descrição dos Arquivos:

- **`index.html`**: Arquivo HTML único da aplicação contendo a estrutura semântica da tela, seletor de mês, resumos com Minha Renda, tabelas de lançamentos, gastos fixos, parcelamentos, canvas do gráfico e modais.
- **`css/styles.css`**: Folha de estilos contendo o sistema de design da planilha (paleta rosa, tipografia Inter, tabelas, modais e responsividade).
- **`js/app.js`**: Script responsável pelo controle de estado da interface, eventos de clique/submit, navegação de meses, aplicação de filtros e renderização reativa das tabelas e resumos.
- **`js/database.js`**: Módulo de banco de dados IndexedDB (`ControleFinanceiroDB`), responsável pelo carregamento inicial, suporte a fallback local e operações assíncronas de CRUD (Create, Read, Update, Delete) de lançamentos, gastos fixos, parcelamentos e rendas.
- **`js/charts.js`**: Módulo de renderização do gráfico de pizza via API 2D nativa do HTML5 Canvas, incluindo legenda e destaque do maior gasto.
- **`data/lancamentos.json`**: Arquivo JSON com dados iniciais de despesas e receitas.
- **`data/gastos-fixos.json`**: Arquivo JSON com dados iniciais de contas e gastos fixos mensais.
- **`data/parcelamentos.json`**: Arquivo JSON com dados iniciais de compras parceladas.

## 6. Persistência

- Os arquivos **JSON** (`data/*.json`) são utilizados para fornecer os dados iniciais (mock) na primeira abertura do sistema.
- O **IndexedDB** armazena nativamente no navegador todas as criações, edições e exclusões efetuadas pelo usuário.
- O sistema **não utiliza LocalStorage**, garantindo maior capacidade de armazenamento e estrutura assíncrona.
- A aplicação funciona 100% no cliente (client-side), **sem backend ou banco de dados externo**.

## 7. Funcionamento Mensal

A aplicação opera em uma **única tela HTML**. Ao alterar o mês (ex: de Agosto 2026 para Setembro 2026), o sistema consulta o IndexedDB e filtra os registros pertencentes àquele período, incluindo a renda específica definida para aquele mês.

Os dados dos meses anteriores permanecem salvos e intactos no IndexedDB, permitindo ao usuário navegar livremente para meses passados ou futuros para conferir históricos ou registrar novos planejamentos.

## 8. Como Executar

### Opção A: Execução via Servidor Local (Recomendado)
Para carregar os arquivos `.json` diretamente via requisições HTTP e evitar avisos de segurança CORS do protocolo `file://`, recomenda-se utilizar um servidor estático simples:

1. Abra a pasta do projeto no editor **VS Code**.
2. Utilize a extensão **Live Server** (clique com o botão direito em `index.html` -> **Open with Live Server**).
3. Ou utilize um terminal local executando `npx serve .` ou `python -m http.server 8000`.

### Opção B: Abertura Direta no Navegador (`file://`)
A aplicação possui um mecanismo inteligente de **fallback local**: caso o arquivo `index.html` seja aberto diretamente clicando no arquivo no Windows/Explorador de Arquivos sem servidor web, a aplicação detecta o protocolo `file://` e carrega automaticamente os dados iniciais incorporados no `database.js` sem gerar erros de execução nem travar a inicialização do IndexedDB.

## 9. Responsividade

A interface do Controle Financeiro foi projetada com layout fluido e unidades relativas para garantir bom uso em:
- **Desktop e Notebooks**: Visualização ampla de células e gráficos lado a lado.
- **Tablets e Celulares**: Adaptação dos blocos e rolagem horizontal (`overflow-x: auto`) nas tabelas para preservar a formatação dos dados.

## 10. Objetivo Acadêmico

Este projeto tem como finalidade pedagógica a prática de conceitos fundamentais do desenvolvimento web front-end:

- Manipulação dinâmica do DOM com JavaScript puro.
- Utilização de JavaScript ES6+ (Promises, Async/Await, Arrow Functions, Destructuring).
- Trabalhar com Arrays e Objetos (métodos `.filter()`, `.map()`, `.reduce()`, `.sort()`).
- Implementação de operações de CRUD completas.
- Criação de filtros combinados.
- Cálculos financeiros e formatação de valores monetários.
- Manipulação de dados estruturados em JSON.
- Persistência assíncrona no navegador com IndexedDB.
- Manipulação e cálculo de datas.
- Aplicação de regras de negócio em sistemas web.
- Construção de interfaces responsivas com CSS3.
