"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  Briefcase,
  ClipboardList,
  Home,
  Search,
  Shield,
} from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useMarketplace } from "@/infrastructure/store"
import { getCurrentUser } from "@/application/queries"
import { cn } from "@/lib/utils"

const demoAccounts = [
  { id: "user_ana", label: "Ana Ribeiro · Cliente" },
  { id: "user_ricardo", label: "Ricardo Alves · Prestador" },
  { id: "user_marina", label: "Marina Costa · Prestadora" },
  { id: "user_admin", label: "Equipe Vizinho · Admin" },
]

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const { state, dispatch } = useMarketplace()
  const user = getCurrentUser(state)
  const neighborhood =
    state.neighborhoods.find((item) => item.id === state.activeNeighborhoodId) ??
    state.neighborhoods[0]

  const nav = [
    { href: "/", label: "Início", icon: Home, show: true },
    { href: "/buscar", label: "Buscar", icon: Search, show: true },
    { href: "/solicitacoes", label: "Pedidos", icon: ClipboardList, show: true },
    {
      href: "/painel",
      label: "Painel",
      icon: Briefcase,
      show: user.role === "PROVIDER",
    },
    {
      href: "/admin",
      label: "Admin",
      icon: Shield,
      show: user.role === "ADMIN",
    },
  ].filter((item) => item.show)

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 w-full max-w-6xl items-center justify-between gap-3 px-4">
          <Link href="/" className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <svg viewBox="0 0 24 24" className="size-4 fill-current" aria-hidden>
                <path d="M12 3.2 3.8 9.4v11.4h5.3v-6.2h5.8v6.2h5.3V9.4L12 3.2Z" />
              </svg>
            </span>
            <span className="font-heading text-lg tracking-tight">Vizinho</span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex">
            {nav.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm",
                  pathname === item.href
                    ? "bg-muted font-medium"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <select
              aria-label="Bairro de busca"
              className="hidden h-8 max-w-36 rounded-lg border bg-background px-2 text-xs sm:block"
              value={neighborhood.id}
              onChange={(event) =>
                dispatch({ type: "SET_NEIGHBORHOOD", neighborhoodId: event.target.value })
              }
            >
              {state.neighborhoods.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.name}
                </option>
              ))}
            </select>

            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button variant="outline" size="sm" className="gap-2 pl-1" />
                }
              >
                <span
                  className="flex size-6 items-center justify-center rounded-full text-[10px] font-semibold text-white"
                  style={{ background: user.accent }}
                >
                  {user.initials}
                </span>
                <span className="hidden max-w-28 truncate sm:inline">{user.name}</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="min-w-56">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>Trocar perfil de demonstração</DropdownMenuLabel>
                  {demoAccounts.map((account) => (
                    <DropdownMenuItem
                      key={account.id}
                      onClick={() => {
                        dispatch({ type: "SWITCH_USER", userId: account.id })
                        toast.success(`Você entrou como ${account.label}`)
                      }}
                    >
                      {account.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    onClick={() => {
                      dispatch({ type: "RESET" })
                      toast.success("Demonstração restaurada ao estado inicial.")
                    }}
                  >
                    Restaurar dados da demo
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 pb-24 md:pb-10">
        {children}
      </main>

      <nav className="fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 backdrop-blur md:hidden">
        <div className="grid grid-cols-4">
          {nav.slice(0, 4).map((item) => {
            const Icon = item.icon
            const active = pathname === item.href
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 py-2 text-[11px]",
                  active ? "text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-4" />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
