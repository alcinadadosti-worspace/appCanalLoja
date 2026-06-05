# Painel Gerencial ACQUA · O Boticário (offline)

Painel gerencial **mobile-first** de arquivo único (`index.html`) que lê os
relatórios `GerencialVendas-DD-MM-AAAA.csv` da rede ACQUA / O Boticário,
guarda o histórico no `localStorage` do navegador e mostra:

- número grande da rede com variação **vs. dia anterior** e mini-gráfico de evolução;
- cartões por loja (toque para abrir todas as métricas e a rosca de participação);
- seletor de métrica (GMV, Receita, Ticket, Boletos, Fidelidade, Penetração, Descontos, B1);
- modos **Dia** e **Período** (quando há 2+ datas importadas).

Tudo roda no navegador — **sem servidor, sem rede**. Os CSVs nunca saem do
dispositivo.

## Como usar

1. Abra o site (ou o `index.html` localmente).
2. Clique em **Enviar CSV** (ou arraste o arquivo) — a data é lida do nome
   `GerencialVendas-DD-MM-AAAA.csv`.
3. Importe os CSVs de cada dia: o histórico **acumula** por data, habilitando
   o comparativo diário e o modo Período.
4. **Remover** apaga só a planilha exibida; **⤓** exporta o histórico em JSON;
   **Imprimir** gera um PDF do painel.

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
