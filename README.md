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

A fonte de verdade é o arquivo **`acumulo.csv`** na raiz do repositório. Para
atualizar o painel para todos, basta substituir esse arquivo no GitHub:

1. Abra o repositório no GitHub e clique em **`acumulo.csv`**.
2. Clique no ícone de lápis (**Edit**) ou em **Upload files** para enviar a
   versão nova (mantendo o nome `acumulo.csv`).
3. **Commit changes** na branch `main`.
4. O Render republica sozinho em ~1 min e o painel passa a mostrar os novos números.

> O painel mostra a data/hora da última atualização (cabeçalho `Last-Modified`
> do arquivo) no rodapé.

> Atalho: o botão **Atualizar planilha** no painel abre direto a página de
> upload do GitHub — envie o arquivo com o nome `acumulo.csv` para substituir.

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
