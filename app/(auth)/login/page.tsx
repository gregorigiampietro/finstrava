"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Logo } from "@/components/logo"

export default function LoginPage() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const supabase = createClient()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (error) {
        setError(error.message)
      } else {
        router.push("/dashboard")
        router.refresh()
      }
    } catch (err) {
      setError("Ocorreu um erro ao fazer login")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Logo/Brand Area */}
      <div className="text-center flex flex-col items-center">
        <Logo size="lg" className="mb-4" />
        <h1 className="text-4xl font-bold bg-gradient-to-r from-[#8578fe] to-[#cbc7fe] bg-clip-text text-transparent mb-2">
          Finstrava
        </h1>
        <p className="text-muted-foreground">Gestão Financeira Inteligente</p>
      </div>

      <Card className="border-primary/20">
        <CardHeader className="space-y-1 pb-6">
          <CardTitle className="text-3xl font-bold text-center">Entrar</CardTitle>
          <CardDescription className="text-center text-base">
            Digite seu email e senha para acessar sua conta
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="space-y-5">
            {error && (
              <div className="bg-destructive/15 border border-destructive/50 text-destructive px-4 py-3 rounded-lg text-sm font-medium flex items-start gap-2">
                <span className="text-lg">⚠️</span>
                <span>{error}</span>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-semibold">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-semibold">Senha</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="h-11"
              />
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-4 pt-2">
            <Button type="submit" className="w-full h-11 text-base" disabled={loading} size="lg">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
            <p className="text-sm text-center text-muted-foreground">
              Não tem uma conta?{" "}
              <Link href="/signup" className="text-primary font-semibold hover:underline">
                Criar conta
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}