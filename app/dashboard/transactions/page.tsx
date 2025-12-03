import { Metadata } from "next"
import { TransactionsContent } from "./transactions-content"

export const metadata: Metadata = {
  title: "Lançamentos | Finstrava",
  description: "Gerencie suas receitas e despesas",
}

export default function TransactionsPage() {
  return <TransactionsContent />
}