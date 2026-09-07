# Vizinho

Marketplace web mobile-first que intermediia clientes e prestadores de serviços do bairro — o boca a boca com reputação, raio de atendimento e pagamento retido até a conclusão.

Este repositório entrega o primeiro recorte utilizável: busca por proximidade, pedido de orçamento, chat, propostas, escrow simulado, avaliações e filas de prestador/admin. Não há banco nem login reais; o estado vive na memória do servidor de desenvolvimento e contas de demonstração cobrem os três perfis.

## Stack

- Next.js 16 (App Router) + TypeScript
- Tailwind CSS 4 + shadcn/ui
- Clean Architecture em `src/domain`, `src/application` e `src/infrastructure`
- Schema PostgreSQL-alvo em [`prisma/schema.prisma`](prisma/schema.prisma)

## Como rodar

```bash
npm install
npm run dev
```

Abra [http://127.0.0.1:43141](http://127.0.0.1:43141).

```bash
npm run lint
npm test
npm run build
```

## Contas de demonstração

No avatar do canto superior direito:

| Perfil | Papel | O que ver |
| --- | --- | --- |
| Ana Ribeiro | Cliente | Pedido de split com duas propostas; faxina em andamento com valor retido |
| Ricardo Alves | Prestador (AC, verificado) | Fila da categoria e proposta já enviada |
| Marina Costa | Prestadora (faxina) | Job em atendimento |
| Equipe Vizinho | Admin | Documentos do eletricista Carlos e escrow |

Troque o bairro no seletor do cabeçalho para recalcular distâncias. **Restaurar dados da demo** volta o seed.

## Fluxo principal

1. Cliente publica um orçamento (categoria, fotos, imediato ou agendado).
2. Prestadores da especialidade no raio enviam preço e prazo no chat.
3. Ao aceitar, o valor fica **retido** (taxa da plataforma 12%).
4. Prestador inicia e conclui; o cliente confirma para **liberar o repasse**.
5. Os dois avaliam (1 a 5 + comentário).

## Roteiro de aceite

1. Home: marca, 8 categorias, radar, prestadores próximos (Marina, Ricardo).
2. Categoria Ar-condicionado → cards com estrela, km, Verificado, Ver perfil.
3. Perfil Ricardo → Pedir orçamento → pedido novo em `/solicitacoes`.
4. Abrir `/solicitacoes/req_split_ana` como Ana → 2 propostas + chat → aceitar Ricardo → escrow (R$ 280,00 / taxa R$ 33,60 / repasse R$ 246,40 / Retido).
5. Trocar para Ricardo → `/painel` mostra inbox; iniciar atendimento.
6. Voltar Ana → confirmar conclusão → avaliar.
7. Trocar para Equipe Vizinho → `/admin` com docs do Carlos + valores retidos; aprovar documento.
8. Viewport ~390px: bottom nav Início / Buscar / Pedidos.
9. Restaurar demo volta o seed.

## Arquitetura

```
src/domain          entidades, geo, DomainError
src/application     queries de leitura
src/infrastructure  seed + reducer + store
src/components      UI (shadcn, marketplace, views, layout)
src/app             rotas Next.js
```

Regras de negócio no reducer. `DomainError` vira toast amigável via store.
