import { describe, expect, it } from "vitest"
import { DomainError } from "@/domain/errors"
import { reduceMarketplace } from "@/infrastructure/reducer"
import { createSeedState } from "@/infrastructure/seed"

describe("reduceMarketplace", () => {
  it("aplica taxa de escrow de 12% ao aceitar proposta", () => {
    let state = createSeedState()
    state = reduceMarketplace(state, { type: "SWITCH_USER", userId: "user_ana" }, createSeedState)

    const next = reduceMarketplace(
      state,
      { type: "ACCEPT_PROPOSAL", proposalId: "prop_ricardo_split" },
      createSeedState,
    )

    const payment = next.payments.find((item) => item.jobId === next.jobs.at(-1)?.id)
    expect(payment).toBeDefined()
    expect(payment?.amountCents).toBe(28000)
    expect(payment?.platformFeeCents).toBe(3360)
    expect(payment?.providerAmountCents).toBe(24640)
    expect(payment?.status).toBe("HELD")
  })

  it("rejeita proposta abaixo de R$ 50", () => {
    let state = createSeedState()
    state = reduceMarketplace(state, { type: "SWITCH_USER", userId: "user_ricardo" }, createSeedState)

    state = {
      ...state,
      requests: [
        {
          id: "req_test",
          clientId: "user_ana",
          categoryId: "cat_ac",
          title: "Teste mínimo",
          description: "Descrição do teste",
          attachments: [],
          address: "Rua Teste",
          location: { lat: -23.5674, lng: -46.6934 },
          scheduleType: "IMMEDIATE",
          scheduledAt: null,
          preferredProviderId: null,
          status: "OPEN",
          createdAt: new Date().toISOString(),
        },
        ...state.requests,
      ],
    }

    expect(() =>
      reduceMarketplace(
        state,
        {
          type: "SEND_PROPOSAL",
          input: {
            requestId: "req_test",
            amountCents: 4999,
            etaHours: 2,
            message: "Proposta barata demais",
          },
        },
        createSeedState,
      ),
    ).toThrow(DomainError)
  })

  it("resolve disputa liberando ou estornando pagamento", () => {
    let state = createSeedState()
    state = reduceMarketplace(state, { type: "SWITCH_USER", userId: "user_ana" }, createSeedState)
    state = reduceMarketplace(state, { type: "OPEN_DISPUTE", requestId: "req_faxina_ana" }, createSeedState)

    expect(state.requests.find((item) => item.id === "req_faxina_ana")?.status).toBe("DISPUTED")

    state = reduceMarketplace(state, { type: "SWITCH_USER", userId: "user_admin" }, createSeedState)
    const refunded = reduceMarketplace(
      state,
      { type: "RESOLVE_DISPUTE", requestId: "req_faxina_ana", releaseToProvider: false },
      createSeedState,
    )

    const payment = refunded.payments.find((item) => item.jobId === "job_faxina_ana")
    expect(payment?.status).toBe("REFUNDED")
    expect(refunded.requests.find((item) => item.id === "req_faxina_ana")?.status).toBe("COMPLETED")
  })

  it("atualiza rating do prestador após review", () => {
    let state = createSeedState()
    state = {
      ...state,
      reviews: state.reviews.filter(
        (item) => !(item.jobId === "job_frete_bruno" && item.fromUserId === "user_bruno"),
      ),
      providers: state.providers.map((item) =>
        item.userId === "user_joao"
          ? { ...item, ratingCount: 1, ratingAvg: 5.0 }
          : item,
      ),
    }
    state = reduceMarketplace(state, { type: "SWITCH_USER", userId: "user_bruno" }, createSeedState)

    const next = reduceMarketplace(
      state,
      {
        type: "SUBMIT_REVIEW",
        jobId: "job_frete_bruno",
        rating: 4,
        comment: "Bom serviço, mas chegou um pouco atrasado.",
      },
      createSeedState,
    )

    const provider = next.providers.find((item) => item.userId === "user_joao")
    expect(
      next.reviews.some(
        (item) => item.jobId === "job_frete_bruno" && item.fromUserId === "user_bruno",
      ),
    ).toBe(true)
    expect(provider?.ratingCount).toBe(1)
    expect(provider?.ratingAvg).toBe(4)
  })
})
