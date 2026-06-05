# Painel Gerencial ACQUA · O Boticário (offline)

Painel gerencial **mobile-first** de arquivo único (`index.html`) que lê o
relatório `acumulo.csv` (formato `GerencialVendas` da rede ACQUA / O Boticário)
e mostra:

- número grande da rede (GMV, Receita, Ticket, Boletos, Fidelidade…);
- **pontos de atenção:** alertas automáticos por loja, ordenados por impacto em R$;
- cartões por loja com **semáforo de saúde** e **scorecard vs. rede** (toque para abrir);
- seletor de métrica que reordena/destaca o indicador.

A planilha enviada já é o **acumulado do ciclo** (do início do ciclo até o dia
atual), então o painel mostra apenas a planilha vigente — **sem guardar histórico**.
Para atualizar, você simplesmente troca a planilha.

## Análises (derivadas da planilha vigente)

- **KPIs de eficiência:** desconto % do GMV, B1 % do GMV, ticket, itens/boleto e
  trocas % da receita — cada um comparado com a **referência da rede**.
- **Semáforo 🟢🟡🔴:** cada KPI da loja é classificado vs. a rede; o cartão mostra
  uma bolinha de saúde geral e, ao abrir, o scorecard completo.
- **Alertas automáticos:** o painel destaca sozinho os maiores desvios
  (ex.: *"desconto 63% do GMV (rede 31%) · R$ 308 acima do padrão"*).

O painel exibe **sempre a planilha publicada** (`acumulo.csv` do repositório),
então **todos que abrirem a URL veem o mesmo resultado**. A própria planilha já
vem **acumulada** (resultado do dia + dias anteriores somados), por isso o app
mostra apenas a planilha atual — não guarda histórico.

## Fluxo de atualização (3x ao dia)

A fonte de verdade é o arquivo **`acumulo.csv`** na raiz do repositório. O painel
tem dois botões que abrem direto o GitHub:

### Adicionar / atualizar planilha (para todos)
1. Baixe a planilha do sistema (vem com qualquer nome).
2. **Renomeie o arquivo para `acumulo.csv`** — esse é o passo-chave: com esse
   nome, ele **substitui** o atual em vez de criar um arquivo novo.
3. No painel, clique em **Adicionar planilha** → abre o upload do GitHub →
   arraste o `acumulo.csv` → **Commit changes**.
4. O Render republica sozinho em ~1 min; todos que abrirem a URL veem a nova.

> Como adicionar **substitui** o arquivo, no dia a dia você nem precisa remover
> para trocar — adicionar já troca. O rodapé mostra a data/hora da última
> atualização (cabeçalho `Last-Modified`).

### Remover planilha (para todos)
Clique em **Remover planilha** → abre a página de exclusão do `acumulo.csv` no
GitHub → **Commit changes**. O painel fica **vazio para todos** até você adicionar
outra.

### Conferir antes de publicar (opcional)
No próprio painel, **Pré-visualizar** (ou arrastar o arquivo) mostra uma
**pré-visualização local** — aparece só no seu aparelho e **não publica**. O link
*"Descartar e ver a publicada"* no rodapé volta à planilha do repositório.
**⤓** exporta os dados em JSON e **Imprimir** gera um PDF.

## Deploy no Render (Static Site)

O repositório já inclui um `render.yaml` (Blueprint), então o deploy é automático:

### Opção A — Blueprint (recomendada)
1. No painel do Render: **New → Blueprint**.
2. Conecte este repositório (`appCanalLoja`). O Render detecta o `render.yaml`.
3. **Apply** — ele cria um Static Site servindo `index.html` na raiz.

### Opção B — Static Site manual
1. **New → Static Site** e conecte o repositório.
2. Configure:
   - **Build Command:** *(deixe vazio)*
   - **Publish Directory:** `.`
3. **Create Static Site.**

A cada `git push` na branch `main`, o Render publica automaticamente a nova versão.
