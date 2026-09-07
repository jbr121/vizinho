# Prompt para Claude Sonnet — implementar Vizinho para teste hoje

Copie tudo abaixo da linha e cole no Sonnet.

---

Você é um engenheiro sênior. Implemente **hoje**, neste repositório vazio, um MVP **testável de ponta a ponta** do marketplace **Vizinho**. Pode (e deve) melhorar UX, copy, arquitetura e qualidade em relação ao recorte abaixo — mas **não mude o produto, a stack, os nomes de rotas, as contas demo nem o escrow de 12%**. Ao final, o app web tem que subir com `npm install && npm run dev` e eu preciso clicar o fluxo completo sem banco, sem login real e sem chaves.

## Objetivo de hoje
Demo local, em memória, pronta para teste manual. Pagamento, chat, upload e mapa são **simulados** — deixe isso explícito na UI (ex.: “nesta demo o dinheiro não sai de verdade”), sem fingir PSP/GPS/S3.

Prioridade:
1. **Web Next.js rodando** (obrigatório)
2. Seed rico + troca de perfil demo (obrigatório)
3. Testes unitários do reducer (forte)
4. App Android Expo em `mobile/` só se a web estiver 100% testável; não atrase a demo por causa do Android

## Produto
**Vizinho** — intermediador mobile-first entre consumidores e prestadores locais (ar-condicionado, elétrica, hidráulica, faxina, jardinagem, frete/mudança, montagem, pintura). Digitaliza o “boca a boca” com reputação, geolocalização aproximada e retenção (escrow).

UI em **pt-BR**. Demo em **São Paulo**. Copy real, sem lorem. Estados vazio / loading / erro cobertos.

## Stack obrigatória (web)
- Next.js App Router + TypeScript estrito + React 19
- Tailwind CSS v4 + shadcn/ui (estilo `base-nova`, `baseColor: neutral`, ícones lucide)
- Toasts: `sonner`
- Fontes: Plus Jakarta Sans + Fraunces
- `lang="pt-BR"`
- Persistência da demo: store em memória (`useSyncExternalStore`) + seed + reducer
- Schema-alvo PostgreSQL em `prisma/schema.prisma` (não precisa Prisma Client nem Postgres hoje)
- Sem NextAuth, Clerk, Stripe, Mapbox, S3

Se usar shadcn Base UI no dropdown do avatar: `DropdownMenuLabel` / `MenuGroupLabel` **dentro** de `Menu.Group` — isso quebrou a demo anterior.

## Arquitetura
```
src/domain          entidades, geo (Haversine), DomainError
src/application     queries de leitura
src/infrastructure  seed + reducer + store
src/components/ui   shadcn (estender, não reescrever)
src/components/marketplace
src/components/views
src/components/layout
src/app             rotas
src/lib             format.ts (BRL, km, relativo) + utils
prisma/schema.prisma
```
- Regras de negócio **só** no reducer. Componentes despacham ações.
- `DomainError` vira toast amigável. Nunca engolir falha.
- Melhore nomes, extraia helpers, cubra edge cases — mas mantenha as ações abaixo.

## Rotas web (exatas)
| Rota | Tela |
|---|---|
| `/` | Home |
| `/buscar?q=` | Busca |
| `/categorias/[slug]` | Categoria |
| `/prestadores/[id]` | Perfil do prestador |
| `/solicitar?categoria=&prestador=` | Novo orçamento |
| `/solicitacoes` | Lista de pedidos |
| `/solicitacoes/[id]` | Detalhe + chat + propostas |
| `/avaliar/[jobId]` | Avaliação |
| `/painel` | Painel do prestador (só PROVIDER) |
| `/admin` | Moderação (só ADMIN) |

Nav desktop no topo, mobile em baixo: **Início, Buscar, Pedidos**, e **Painel** ou **Admin** conforme o perfil. Em ~390px a bottom nav cabe 4 itens.

Dev: `next dev --hostname 127.0.0.1 --port 43141`.

## Perfis e troca de conta (sem login)
Avatar no header (web): **Trocar perfil de demonstração** + **Restaurar dados da demo** (`RESET`).

Só estes quatro no switcher:
- Ana Ribeiro · Cliente (`user_ana`) — default
- Ricardo Alves · Prestador (`user_ricardo`)
- Marina Costa · Prestadora (`user_marina`)
- Equipe Vizinho · Admin (`user_admin`)

Seletor de bairro no cabeçalho (`aria-label="Bairro de busca"`).

## Fluxo que preciso testar hoje
1. Cliente publica orçamento (categoria, fotos só como **nome de arquivo**, imediato ou data/hora).
2. Prestadores da especialidade no raio enviam preço + prazo (horas) + mensagem.
3. Cliente aceita → pagamento **HELD**, taxa **12%**, job criado.
4. Prestador inicia atendimento; ao terminar, cliente **confirma conclusão** → pagamento **RELEASED**, `completedJobs++`.
5. Avaliação bidirecional 1–5 + comentário.
6. Admin vê documentos pendentes, disputas e valores retidos; aprova/rejeita doc; resolve disputa (repassar ou estornar).

## Regras do reducer (não afrouxar)
Ações: `SWITCH_USER`, `SET_NEIGHBORHOOD`, `CREATE_REQUEST`, `SEND_MESSAGE`, `SEND_PROPOSAL`, `ACCEPT_PROPOSAL`, `START_JOB`, `COMPLETE_JOB`, `CONFIRM_COMPLETION`, `SUBMIT_REVIEW`, `OPEN_DISPUTE`, `RESOLVE_DISPUTE`, `REVIEW_DOCUMENT`, `RESET`.

Regras:
- `CREATE_REQUEST`: só CLIENT; título+descrição obrigatórios; status `OPEN`.
- `SEND_MESSAGE`: tipo TEXT; participantes = cliente, quem propôs, prestador preferido, ADMIN.
- `SEND_PROPOSAL`: só PROVIDER não REJECTED; request `OPEN` ou `PROPOSALS_RECEIVED`; especialidade bate; **mínimo R$ 50** (`amountCents >= 5000`); uma proposta por prestador; request → `PROPOSALS_RECEIVED`.
- `ACCEPT_PROPOSAL`: só o cliente do pedido; demais propostas `DECLINED`; `fee = Math.round(amountCents * 0.12)`; payment `HELD`; job `SCHEDULED`; request `SCHEDULED` se agendado senão `ACCEPTED`.
- `COMPLETE_JOB`: prestador marca término (`completedAt`); **não** libera dinheiro.
- `CONFIRM_COMPLETION`: cliente; status `COMPLETED`; payment `RELEASED`.
- `SUBMIT_REVIEW`: 1–5; um review por `(jobId, fromUserId)`; atualiza `ratingAvg`/`ratingCount` do prestador.
- `RESOLVE_DISPUTE`: só ADMIN; `releaseToProvider` → `RELEASED` senão `REFUNDED`.
- `REVIEW_DOCUMENT`: ADMIN; notas “Documento conferido.” / recusa com nota.
- IDs: `` `${prefix}_${Math.random().toString(36).slice(2, 10)}` `` com prefixos `req`, `msg`, `prop`, `job`, `pay`, `rev`.

## Prisma (schema-alvo, igual a isto)
Enums: `UserRole { CLIENT PROVIDER ADMIN }`, `VerificationStatus { UNSUBMITTED PENDING APPROVED REJECTED }`, `RequestStatus { OPEN PROPOSALS_RECEIVED ACCEPTED SCHEDULED IN_PROGRESS COMPLETED CANCELLED DISPUTED }`, `ScheduleType { IMMEDIATE SCHEDULED }`, `ProposalStatus { PENDING ACCEPTED DECLINED WITHDRAWN }`, `JobStatus { SCHEDULED IN_PROGRESS COMPLETED CANCELLED }`, `PaymentStatus { PENDING HELD RELEASED REFUNDED FAILED }`, `MessageType { TEXT IMAGE VIDEO SYSTEM }`, `DocumentType { RG CNH MEI RESIDENCIA ANTECEDENTES }`.

Models: User, ClientProfile, ProviderProfile, Category, ProviderSpecialty, Availability, ServiceRequest, Proposal, Job, ChatMessage, Review, Payment, ProviderDocument.

Store em memória **não** precisa de `password` nem `Availability`. Users do seed têm `initials` + `accent` (hex) para o avatar.

## Seed obrigatório
`PLATFORM_FEE_RATE = 0.12`. Default: `currentUserId: "user_ana"`, `activeNeighborhoodId: "nbh_pinheiros"`. Origem fallback Pinheiros `{ lat: -23.5674, lng: -46.6934 }`. Listagens próximas: `maxKm: 12`. Radar visual: “raio aproximado de 8 km” (SVG, não mapa real).

### Bairros
| id | name | city | lat | lng |
|---|---|---|---|---|
| nbh_pinheiros | Pinheiros | São Paulo | -23.5674 | -46.6934 |
| nbh_vila_madalena | Vila Madalena | São Paulo | -23.5533 | -46.6908 |
| nbh_jardins | Jardins | São Paulo | -23.5681 | -46.6701 |
| nbh_moema | Moema | São Paulo | -23.6015 | -46.6658 |
| nbh_lapa | Lapa | São Paulo | -23.5216 | -46.7044 |

### Categorias
| id | slug | name | description | icon lucide |
|---|---|---|---|---|
| cat_ac | ar-condicionado | Ar-condicionado | Instalação, limpeza e reparo de splits e janela. | snowflake |
| cat_eletrica | eletrica | Elétrica | Quadros, tomadas, iluminação e urgências. | zap |
| cat_hidraulica | hidraulica | Hidráulica | Vazamentos, entupimentos e instalações. | droplets |
| cat_faxina | faxina | Faxina | Limpeza residencial, pós-obra e recorrente. | sparkles |
| cat_jardinagem | jardinagem | Jardinagem | Poda, paisagismo e manutenção de áreas verdes. | leaf |
| cat_frete | frete-mudanca | Frete e mudança | Carreto, ajuda na carga e mudanças curtas. | truck |
| cat_montagem | montagem | Montagem de móveis | Armários, camas e eletrodomésticos. | wrench |
| cat_pintura | pintura | Pintura | Paredes internas, fachadas e retoques. | paintbrush |

### Usuários (e-mails `*@vizinho.app` exceto admin)
| id | name | email | phone | role | initials | accent |
|---|---|---|---|---|---|---|
| user_ana | Ana Ribeiro | ana@vizinho.app | (11) 98821-4410 | CLIENT | AR | #0f6e63 |
| user_bruno | Bruno Lima | bruno@vizinho.app | (11) 99712-8832 | CLIENT | BL | #3f5b4a |
| user_ricardo | Ricardo Alves | ricardo@vizinho.app | (11) 97654-2201 | PROVIDER | RA | #1d6b8a |
| user_diego | Diego Rocha | diego@vizinho.app | (11) 98110-3344 | PROVIDER | DR | #2f6f8f |
| user_marina | Marina Costa | marina@vizinho.app | (11) 99200-1188 | PROVIDER | MC | #7a4b2a |
| user_joao | João Pedro Santos | joao@vizinho.app | (11) 98440-7721 | PROVIDER | JS | #3d4a2f |
| user_helena | Helena Dias | helena@vizinho.app | (11) 99551-0092 | PROVIDER | HD | #2f6a3a |
| user_carlos | Carlos Mendes | carlos@vizinho.app | (11) 97331-5508 | PROVIDER | CM | #8a6a1d |
| user_luciana | Luciana Prado | luciana@vizinho.app | (11) 98662-4419 | PROVIDER | LP | #1f5f7a |
| user_thiago | Thiago Nunes | thiago@vizinho.app | (11) 99118-2260 | PROVIDER | TN | #5a4632 |
| user_fernanda | Fernanda Oliveira | fernanda@vizinho.app | (11) 98877-3340 | PROVIDER | FO | #6b3a4a |
| user_admin | Equipe Vizinho | moderacao@vizinho.app | (11) 3000-1000 | ADMIN | VZ | #163a34 |

Clientes:
- Ana: Rua dos Pinheiros, 1480 · apto 72, Pinheiros, `-23.5674, -46.6934`
- Bruno: Rua Harmonia, 320, Vila Madalena, `-23.5538, -46.6912`

Prestadores (use bios curtas críveis; não invente outros IDs):
| user | bairro | lat,lng | radiusKm | verify | rating | count | jobs | yrs | a partir de (cents) | especialidades |
|---|---|---|---|---|---|---|---|---|---|---|
| Ricardo | Vila Madalena | -23.5531, -46.6919 | 8 | APPROVED | 4.9 | 86 | 214 | 11 | 18000 | cat_ac |
| Diego | Consolação | -23.5578, -46.6609 | 12 | APPROVED | 4.6 | 41 | 98 | 6 | 15000 | cat_ac |
| Marina | Pinheiros | -23.5658, -46.6881 | 6 | APPROVED | 4.8 | 124 | 310 | 8 | 16000 | cat_faxina |
| João Pedro | Lapa | -23.5284, -46.7021 | 15 | APPROVED | 4.7 | 67 | 151 | 9 | 22000 | cat_frete, cat_montagem |
| Helena | Butantã | -23.5719, -46.7094 | 10 | APPROVED | 5.0 | 38 | 72 | 7 | 14000 | cat_jardinagem |
| Carlos | Jardins | -23.5662, -46.6688 | 9 | PENDING | 4.5 | 19 | 44 | 5 | 12000 | cat_eletrica |
| Luciana | Vila Leopoldina | -23.5328, -46.7362 | 8 | APPROVED | 4.8 | 53 | 129 | 10 | 13000 | cat_hidraulica |
| Thiago | Moema | -23.5992, -46.6669 | 11 | APPROVED | 4.5 | 29 | 81 | 4 | 11000 | cat_montagem |
| Fernanda | Perdizes | -23.5369, -46.6788 | 7 | APPROVED | 4.9 | 47 | 103 | 8 | 25000 | cat_pintura |

### Pedidos já no seed (para a demo nascer “viva”)
1. `req_split_ana` — “Split do quarto pingando na parede”, `cat_ac`, IMMEDIATE, `PROPOSALS_RECEIVED`, anexos `condensadora-varanda.jpg`, `parede-mancha.jpg`
   - `prop_ricardo_split` R$ 280,00 / 2h / PENDING
   - `prop_diego_split` R$ 220,00 / 4h / PENDING
2. `req_faxina_ana` — “Faxina pesada do apto 72 m²”, `cat_faxina`, SCHEDULED, preferred Marina, `IN_PROGRESS`
   - `prop_marina_faxina` R$ 260,00 / 5h / ACCEPTED
   - job IN_PROGRESS; payment 26000 / taxa 3120 / repasse 22880 / HELD
3. `req_frete_bruno` — “Mudança de kitnet para Pinheiros”, `cat_frete`, COMPLETED
   - `prop_joao_frete` R$ 480,00 / 3h / ACCEPTED
   - job COMPLETED; payment 48000 / 5760 / 42240 / RELEASED
   - reviews 5★ Bruno↔João

Chat seed com 5–6 mensagens (split Ana/Ricardo/Diego; faxina SYSTEM+TEXT; frete SYSTEM “repasse de R$ 422,40”).
Docs: Carlos RG+MEI PENDING; Ricardo CNH APPROVED.

## Copy e labels (pt-BR, use estes)
RequestStatus: Aguardando propostas / Propostas recebidas / Proposta aceita / Agendado / Em atendimento / Concluído / Cancelado / Em disputa  
Verification: Sem documentos / Em análise / Verificado / Recusado  
Payment: Aguardando / Retido (escrow) / Repassado / Estornado / Falhou  

Home: marca **Vizinho**; eyebrow “Serviços do bairro”; H1 “O boca a boca do {bairro}, com reputação e pagamento retido.”; placeholder “Ar-condicionado, faxina, chaveiro…”; CTAs **Buscar no raio**, **Pedir orçamento**, **Meus pedidos**.  
Radar: “Perto de {bairro}, raio aproximado de 8 km”.  
Toasts: “Pedido publicado. Prestadores próximos já podem responder.” / “Pagamento retido. Combine o horário no chat.” / “Proposta enviada ao cliente.” / “Atendimento iniciado.” / “Demonstração restaurada ao estado inicial.”  
Aceitar proposta: botão **Aceitar e reter pagamento**. Painel: Total / Taxa Vizinho (12%) / Repasse.  
Loading: “Carregando o bairro…”. Erro: “Algo saiu do esperado” + “Tentar de novo”.  
Admin não autenticado: “Acesse como Equipe Vizinho no menu do avatar…”. Admin: “nesta demo o dinheiro não sai de verdade.”

Tema visual (sugestão, pode refinar): fundo quente `#F3EFE4`, card `#FFFCF6`, texto `#1C332E`, primary `#1F6F64`, estrela `#D39B2A`.

## O que o Sonnet deve melhorar (é para isso que você está aqui)
- UX mais clara no fluxo de aceite → escrow → início → confirmação → avaliação (o `COMPLETE_JOB` vs `CONFIRM_COMPLETION` precisa ficar óbvio na UI).
- Troca de perfil à prova de falha (dropdown do avatar).
- Acessibilidade básica, empty states, hierarquia visual, microcopy.
- Código limpo, tipado, testável; queries puras; reducer puro.
- README curto: como rodar, contas demo, roteiro de teste.
- **Não** adicione auth real, Postgres, pagamento real, mapa real, GPS, push.

## Roteiro de aceite (eu vou seguir isto hoje)
1. Home: marca, 8 categorias, radar, prestadores próximos (Marina, Ricardo), zero lorem.
2. Categoria Ar-condicionado → cards com estrela, km, **Verificado**, **Ver perfil**.
3. Perfil Ricardo → **Pedir orçamento** → pedido novo aparece em `/solicitacoes`.
4. Abrir `/solicitacoes/req_split_ana` como Ana → 2 propostas + chat → aceitar a de Ricardo → painel escrow (R$ 280,00 / taxa R$ 33,60 / repasse R$ 246,40 / Retido).
5. Trocar para Ricardo → `/painel` mostra inbox; iniciar atendimento.
6. Voltar Ana → confirmar conclusão → avaliar.
7. Trocar para Equipe Vizinho → `/admin` com docs do Carlos + valores retidos; aprovar documento.
8. Viewport ~390px: bottom nav Início / Buscar / Pedidos.
9. Restaurar demo volta o seed.

## Entrega
- Repo completo e consistente.
- `npm install && npm run dev` (porta 43141) funciona.
- Testes do reducer (`npm test`) cobrindo aceite/escrow 12%, mínimo R$ 50, disputa, review.
- README com o roteiro acima.
- Se der tempo: `mobile/` Expo SDK 57, package `app.vizinho`, mesmas regras em `mobile/core/`, rotas `categoria`/`prestador`/`pedido` (singular). Não bloqueie a web por isso.

Comece pela arquitetura de domínio + seed + reducer testado; depois UI. Não peça permissão — implemente.
