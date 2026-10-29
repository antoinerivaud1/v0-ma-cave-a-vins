import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"
import type { Wine } from "@/data/apogee"
import type { StockOverride } from "@/lib/stock-overrides"

// MA-113 : comportement du store hooks/use-stock-overrides.ts contre un faux Supabase en mémoire
// qui reproduit la table stock_overrides (upsert sur user_id + wine_identity_key, trigger
// « dernier écrit gagne », colonnes absentes tant que la migration n'est pas appliquée).

interface CloudRow {
  user_id: string
  wine_identity_key: string
  stock: number | null
  archived: boolean
  deleted: boolean
  updated_at: string
}

const { cloud, fakeClient } = vi.hoisted(() => {
  const state = {
    rows: [] as CloudRow[],
    schemaReady: true,
    offline: false,
    sessionUserId: "user-a" as string | null,
    calls: [] as string[],
    lastOnConflict: null as string | null,
    upsertGate: null as Promise<void> | null,
    selectGate: null as Promise<void> | null,
  }

  const fail = (message: string) => ({ data: null, error: { message } })

  const client = {
    auth: {
      getSession: async () => ({
        data: { session: state.sessionUserId ? { user: { id: state.sessionUserId } } : null },
      }),
    },
    from: (table: string) => {
      if (table !== "stock_overrides") throw new Error(`table inattendue : ${table}`)
      return {
        select: (columns: string) => ({
          eq: (_column: string, userId: string) => ({
            order: () => ({
              range: async (from: number, to: number) => {
                state.calls.push("select")
                const snapshot = state.rows.map((r) => ({ ...r }))
                if (state.selectGate) await state.selectGate
                if (state.offline) return fail("TypeError: Failed to fetch")
                if (!state.schemaReady && columns.includes("archived")) {
                  return fail("column stock_overrides.archived does not exist")
                }
                const data = snapshot
                  .filter((r) => r.user_id === userId)
                  .sort((a, b) => a.wine_identity_key.localeCompare(b.wine_identity_key))
                  .slice(from, to + 1)
                  .map(({ user_id: _owner, ...rest }) => rest)
                return { data, error: null }
              },
            }),
          }),
        }),
        delete: () => ({
          eq: (_column: string, userId: string) => ({
            lte: async (_col: string, timestamp: string) => {
              state.calls.push("delete")
              if (state.offline) return fail("TypeError: Failed to fetch")
              state.rows = state.rows.filter(
                (r) => !(r.user_id === userId && Date.parse(r.updated_at) <= Date.parse(timestamp))
              )
              return { data: null, error: null }
            },
          }),
        }),
        upsert: async (rows: CloudRow[], options: { onConflict: string }) => {
          state.calls.push("upsert")
          state.lastOnConflict = options.onConflict
          if (state.upsertGate) await state.upsertGate
          if (state.offline) return fail("TypeError: Failed to fetch")
          if (!state.schemaReady) return fail("Could not find the 'archived' column of 'stock_overrides'")
          for (const next of rows) {
            const index = state.rows.findIndex(
              (r) => r.user_id === next.user_id && r.wine_identity_key === next.wine_identity_key
            )
            if (index === -1) {
              state.rows.push({ ...next })
            } else if (Date.parse(next.updated_at) >= Date.parse(state.rows[index].updated_at)) {
              state.rows[index] = { ...next }
            }
          }
          return { data: null, error: null }
        },
      }
    },
  }

  return { cloud: state, fakeClient: client }
})

vi.mock("@/lib/supabase/client", () => ({ createClient: () => fakeClient }))

const OVERRIDES_KEY = "cave-stock-overrides"
const META_KEY = "cave-stock-sync"
const WINE: Wine = { id: "w1", wine_name: "Chablis", millesime_year: 2020, bottle_quantity: 3 }
const KEY = "id:w1"

type StoreModule = typeof import("@/hooks/use-stock-overrides")

async function loadStore() {
  vi.resetModules()
  const React = await import("react")
  const { createRoot } = await import("react-dom/client")
  const store: StoreModule = await import("@/hooks/use-stock-overrides")

  let current: ReturnType<StoreModule["useStockOverrides"]> | null = null
  function Probe() {
    current = store.useStockOverrides()
    return null
  }

  const root = createRoot(document.createElement("div"))
  await React.act(async () => {
    root.render(React.createElement(Probe))
  })

  const hook = () => {
    if (!current) throw new Error("hook non monté")
    return current
  }

  return {
    store,
    hook,
    set: async (wine: Wine, override: StockOverride) => {
      await React.act(async () => {
        hook().setOverrideForWine(wine, override)
      })
    },
    sync: async () => {
      await React.act(async () => {
        await store.syncStockOverridesNow()
      })
    },
    run: async (fn: () => void) => {
      await React.act(async () => {
        fn()
      })
    },
    unmount: async () => {
      await React.act(async () => {
        root.unmount()
      })
    },
  }
}

function cloudRow(partial: Partial<CloudRow> & { wine_identity_key: string }): CloudRow {
  return {
    user_id: "user-a",
    stock: null,
    archived: false,
    deleted: false,
    updated_at: "2026-10-29T09:00:00.000Z",
    ...partial,
  }
}

function localOverrides(): Record<string, StockOverride> {
  return JSON.parse(localStorage.getItem(OVERRIDES_KEY) ?? "{}") as Record<string, StockOverride>
}

let mounted: Awaited<ReturnType<typeof loadStore>> | null = null

async function mount() {
  if (mounted) await mounted.unmount()
  mounted = await loadStore()
  return mounted
}

describe("useStockOverrides : stock cloud avec cache local (MA-113)", () => {
  beforeEach(() => {
    ;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true
    vi.useFakeTimers({ toFake: ["setTimeout", "clearTimeout", "Date"] })
    vi.setSystemTime(new Date("2026-10-29T10:00:00.000Z"))
    vi.spyOn(console, "error").mockImplementation(() => {})
    localStorage.clear()
    cloud.rows = []
    cloud.schemaReady = true
    cloud.offline = false
    cloud.sessionUserId = "user-a"
    cloud.calls = []
    cloud.lastOnConflict = null
    cloud.upsertGate = null
    cloud.selectGate = null
  })

  afterEach(async () => {
    if (mounted) await mounted.unmount()
    mounted = null
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  it("dégrade proprement tant que la migration n'est pas appliquée, puis synchronise", async () => {
    cloud.schemaReady = false
    const { store, hook, set, sync } = await mount()
    store.startStockOverridesSync("user-a")

    await set(WINE, { quantity: 2 })
    await sync()

    // Rien n'est perdu ni affiché en erreur : le cache local fait foi, la modification reste en file
    expect(hook().getOverrideForWine(WINE)).toEqual({ quantity: 2 })
    expect(localOverrides()[KEY]).toEqual({ quantity: 2 })
    expect(store.getStockSyncSnapshot()).toMatchObject({ pendingCount: 1, owner: "user-a" })
    expect(store.getStockSyncSnapshot().lastError).toContain("archived")
    expect(cloud.rows).toEqual([])

    // Antoine colle le SQL : la synchro suivante envoie la modification
    cloud.schemaReady = true
    await sync()

    expect(cloud.rows).toEqual([
      cloudRow({ wine_identity_key: KEY, stock: 2, updated_at: "2026-10-29T10:00:00.000Z" }),
    ])
    expect(store.getStockSyncSnapshot()).toMatchObject({ pendingCount: 0, lastError: null })
    expect(hook().getOverrideForWine(WINE)).toEqual({ quantity: 2 })
  })

  it("consommer, archiver, restaurer et supprimer écrivent dans Supabase", async () => {
    const { store, hook, set, sync } = await mount()
    store.startStockOverridesSync("user-a")

    await set(WINE, { quantity: 2 })
    vi.setSystemTime(new Date("2026-10-29T10:01:00.000Z"))
    await set(WINE, { ...hook().getOverrideForWine(WINE), quantity: 0, archived: true })
    await sync()
    expect(cloud.rows).toEqual([
      cloudRow({ wine_identity_key: KEY, stock: 0, archived: true, updated_at: "2026-10-29T10:01:00.000Z" }),
    ])

    vi.setSystemTime(new Date("2026-10-29T10:02:00.000Z"))
    await set(WINE, { ...hook().getOverrideForWine(WINE), quantity: 1, archived: false })
    await sync()
    expect(cloud.rows[0]).toMatchObject({ stock: 1, archived: false, deleted: false })

    vi.setSystemTime(new Date("2026-10-29T10:03:00.000Z"))
    await set(WINE, { ...hook().getOverrideForWine(WINE), deleted: true })
    await sync()
    expect(cloud.rows).toHaveLength(1)
    expect(cloud.rows[0]).toMatchObject({ stock: 1, deleted: true })
    expect(cloud.lastOnConflict).toBe("user_id,wine_identity_key")
  })

  it("relit le stock depuis Supabase après rechargement ou sur un second appareil", async () => {
    cloud.rows = [
      cloudRow({ wine_identity_key: KEY, stock: 1 }),
      cloudRow({ wine_identity_key: "id:w2", archived: true }),
      cloudRow({ wine_identity_key: "id:autre", stock: 4, user_id: "user-b" }),
    ]
    const { store, hook, sync } = await mount()
    expect(hook().getOverrideForWine(WINE)).toBeUndefined()

    store.startStockOverridesSync("user-a")
    await sync()

    expect(hook().overrides).toEqual({ [KEY]: { quantity: 1 }, "id:w2": { archived: true } })
    expect(cloud.calls).not.toContain("upsert")
  })

  it("réconcilie au SIGNED_IN les surcharges locales antérieures, sans doublon", async () => {
    localStorage.setItem(
      OVERRIDES_KEY,
      JSON.stringify({ [KEY]: { quantity: 0, archived: true }, "id:w2": { quantity: 4 } })
    )
    cloud.rows = [cloudRow({ wine_identity_key: "id:w2", stock: 1, updated_at: "2026-10-01T00:00:00.000Z" })]

    const { store, hook, sync } = await mount()
    store.startStockOverridesSync("user-a")
    await sync()

    // id:w1 n'existait que localement : envoyé. id:w2 existait dans le cloud : le cloud gagne.
    expect(hook().overrides).toEqual({ [KEY]: { quantity: 0, archived: true }, "id:w2": { quantity: 1 } })
    expect(cloud.rows).toHaveLength(2)
    expect(cloud.rows.find((r) => r.wine_identity_key === KEY)).toMatchObject({
      stock: 0,
      archived: true,
      updated_at: "1970-01-01T00:00:00.000Z",
    })

    // Nouvelle connexion (INITIAL_SESSION au rechargement) : idempotent
    store.startStockOverridesSync("user-a")
    await sync()
    await sync()
    expect(cloud.rows).toHaveLength(2)
    expect(store.getStockSyncSnapshot().pendingCount).toBe(0)
  })

  it("dernier écrit gagne entre deux appareils", async () => {
    const { store, hook, set, sync } = await mount()
    store.startStockOverridesSync("user-a")

    // Appareil 1 hors ligne : consommation à 10:00
    cloud.offline = true
    await set(WINE, { quantity: 2 })
    await sync()

    // Appareil 2 a écrit à 10:05 pendant ce temps
    cloud.rows = [cloudRow({ wine_identity_key: KEY, stock: 5, updated_at: "2026-10-29T10:05:00.000Z" })]
    cloud.offline = false
    await sync()
    expect(hook().getOverrideForWine(WINE)).toEqual({ quantity: 5 })
    expect(cloud.rows[0].stock).toBe(5)

    // Appareil 1 écrit à 10:10 : il gagne
    vi.setSystemTime(new Date("2026-10-29T10:10:00.000Z"))
    await set(WINE, { quantity: 4 })
    await sync()
    expect(cloud.rows).toEqual([
      cloudRow({ wine_identity_key: KEY, stock: 4, updated_at: "2026-10-29T10:10:00.000Z" }),
    ])
  })

  it("hors ligne : aucun appel réseau, la modification reste en file", async () => {
    const onLine = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false)
    const { store, hook, set, sync } = await mount()
    store.startStockOverridesSync("user-a")

    await set(WINE, { quantity: 1 })
    await sync()

    expect(cloud.calls).toEqual([])
    expect(hook().getOverrideForWine(WINE)).toEqual({ quantity: 1 })
    expect(store.getStockSyncSnapshot().pendingCount).toBe(1)

    onLine.mockReturnValue(true)
    await sync()
    expect(cloud.rows[0]).toMatchObject({ wine_identity_key: KEY, stock: 1 })
    expect(store.getStockSyncSnapshot().pendingCount).toBe(0)
  })

  it("une écriture pendant l'envoi reste en file et part à la synchro suivante", async () => {
    const { store, hook, set, sync } = await mount()
    store.startStockOverridesSync("user-a")
    await set(WINE, { quantity: 2 })

    let release: () => void = () => {}
    cloud.upsertGate = new Promise<void>((resolve) => {
      release = resolve
    })
    const inFlight = store.syncStockOverridesNow()
    await vi.waitFor(() => expect(cloud.calls).toContain("upsert"))

    vi.setSystemTime(new Date("2026-10-29T10:00:30.000Z"))
    await set(WINE, { quantity: 1 })
    release()
    cloud.upsertGate = null
    await inFlight

    expect(store.getStockSyncSnapshot().pendingCount).toBe(1)
    await sync()
    expect(cloud.rows[0]).toMatchObject({ stock: 1, updated_at: "2026-10-29T10:00:30.000Z" })
    expect(hook().getOverrideForWine(WINE)).toEqual({ quantity: 1 })
    expect(store.getStockSyncSnapshot().pendingCount).toBe(0)
  })

  it("ne mélange pas deux comptes sur le même appareil", async () => {
    const { store, hook, set, sync, run } = await mount()
    store.startStockOverridesSync("user-a")

    // A modifie hors ligne puis se déconnecte, B se connecte
    cloud.offline = true
    await set(WINE, { quantity: 0, archived: true })
    await sync()
    cloud.offline = false
    cloud.sessionUserId = "user-b"
    cloud.rows = [cloudRow({ wine_identity_key: "id:b1", stock: 6, user_id: "user-b" })]

    await run(() => store.startStockOverridesSync("user-b"))
    expect(hook().getOverrideForWine(WINE)).toBeUndefined()
    await sync()
    expect(hook().overrides).toEqual({ "id:b1": { quantity: 6 } })
    expect(cloud.rows.filter((r) => r.user_id === "user-b")).toHaveLength(1)

    // A revient : sa modification non envoyée est restaurée puis envoyée sous son compte
    cloud.sessionUserId = "user-a"
    await run(() => store.startStockOverridesSync("user-a"))
    expect(hook().getOverrideForWine(WINE)).toEqual({ quantity: 0, archived: true })
    await sync()
    expect(cloud.rows.filter((r) => r.user_id === "user-a")).toEqual([
      cloudRow({ wine_identity_key: KEY, stock: 0, archived: true, updated_at: "2026-10-29T10:00:00.000Z" }),
    ])
  })

  it("clearAllStockOverrides vide aussi Supabase, même après une coupure réseau", async () => {
    cloud.rows = [
      cloudRow({ wine_identity_key: KEY, stock: 1 }),
      cloudRow({ wine_identity_key: "id:b1", stock: 6, user_id: "user-b" }),
    ]
    let ctx = await mount()
    ctx.store.startStockOverridesSync("user-a")
    await ctx.sync()
    expect(ctx.hook().getOverrideForWine(WINE)).toEqual({ quantity: 1 })

    cloud.offline = true
    vi.setSystemTime(new Date("2026-10-29T10:30:00.000Z"))
    await ctx.run(() => ctx.store.clearAllStockOverrides())
    await ctx.sync()
    expect(ctx.hook().overrides).toEqual({})
    expect(ctx.store.getStockSyncSnapshot().clearPending).toBe(true)
    expect(JSON.parse(localStorage.getItem(META_KEY) ?? "{}")).toHaveProperty("clearAt")

    // Rechargement de la page (window.location.reload après le reset)
    cloud.offline = false
    ctx = await mount()
    ctx.store.startStockOverridesSync("user-a")
    await ctx.sync()

    expect(cloud.rows).toEqual([cloudRow({ wine_identity_key: "id:b1", stock: 6, user_id: "user-b" })])
    expect(ctx.store.getStockSyncSnapshot().clearPending).toBe(false)
    expect(ctx.hook().overrides).toEqual({})
  })

  it("un vidage pendant la lecture cloud ne réinjecte pas les anciennes valeurs", async () => {
    cloud.rows = [cloudRow({ wine_identity_key: KEY, stock: 1 })]
    const { store, hook, sync, run } = await mount()
    store.startStockOverridesSync("user-a")

    let release: () => void = () => {}
    cloud.selectGate = new Promise<void>((resolve) => {
      release = resolve
    })
    const inFlight = store.syncStockOverridesNow()
    await vi.waitFor(() => expect(cloud.calls).toContain("select"))

    // Import Excel pendant la lecture
    vi.setSystemTime(new Date("2026-10-29T10:30:00.000Z"))
    await run(() => store.clearAllStockOverrides())
    release()
    cloud.selectGate = null
    await inFlight

    expect(hook().overrides).toEqual({})
    await sync()
    expect(cloud.rows).toEqual([])
    expect(hook().overrides).toEqual({})
    expect(store.getStockSyncSnapshot().clearPending).toBe(false)
  })

  it("garde la lecture des anciennes clés nom_millésime et les nettoie à l'écriture", async () => {
    localStorage.setItem(OVERRIDES_KEY, JSON.stringify({ "Chablis_2020": { quantity: 1 } }))
    const { store, hook, set, sync } = await mount()
    expect(hook().getOverrideForWine(WINE)).toEqual({ quantity: 1 })

    store.startStockOverridesSync("user-a")
    await set(WINE, { quantity: 0 })
    await sync()

    expect(hook().overrides).toEqual({ [KEY]: { quantity: 0 } })
    expect(cloud.rows.find((r) => r.wine_identity_key === KEY)).toMatchObject({ stock: 0 })
    // L'ancienne clé, jamais envoyée et supprimée localement, n'a rien à créer dans le cloud
    expect(cloud.rows.find((r) => r.wine_identity_key === "Chablis_2020")).toBeUndefined()
    expect(store.getStockSyncSnapshot().pendingCount).toBe(0)
  })
})
