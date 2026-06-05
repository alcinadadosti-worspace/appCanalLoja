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

A planilha fica guardada num **cofre online (Supabase)**, então **todos que
abrirem a URL veem o mesmo resultado**, atualizado direto no app. A planilha já
vem **acumulada** (resultado do dia + dias anteriores), por isso o painel mostra
apenas a planilha atual — não guarda histórico.

## Atualização da planilha (direto no app)

Sem GitHub, sem renomear. Os botões trocam a planilha para **todos**:

- **Adicionar planilha** → escolhe o CSV (qualquer nome) → publica; todos veem na hora.
- **Remover planilha** → apaga; o painel fica **vazio para todos**.
- **Pré-visualizar** → confere um CSV só no seu aparelho (não publica).
- **⤓** exporta os dados em JSON e **Imprimir** gera um PDF.

## Configuração do cofre (Supabase) — uma vez

1. Crie um projeto grátis em [supabase.com](https://supabase.com).
2. No **SQL Editor**, rode (cria o bucket `planilha` público + permissões):
   ```sql
   insert into storage.buckets (id, name, public)
   values ('planilha','planilha', true)
   on conflict (id) do update set public = true;

   create policy "ler"     on storage.objects for select using (bucket_id = 'planilha');
   create policy "enviar"  on storage.objects for insert with check (bucket_id = 'planilha');
   create policy "trocar"  on storage.objects for update using (bucket_id = 'planilha');
   create policy "remover" on storage.objects for delete using (bucket_id = 'planilha');
   ```
3. Em **Project Settings → API**, copie a **Project URL** e a chave **anon public**
   e preencha no topo do `index.html` (`SUPABASE_URL` e `SUPABASE_KEY`).

> Enquanto o Supabase não estiver configurado, o painel lê o `acumulo.csv` do
> repositório como fallback (some assim que o cofre é ligado).

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
