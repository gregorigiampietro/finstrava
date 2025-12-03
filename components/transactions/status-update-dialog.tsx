"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Transaction } from "@/lib/types/transaction"

interface StatusUpdateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (status: Transaction['status'], paymentDate?: string) => void
}

export function StatusUpdateDialog({
  open,
  onOpenChange,
  onConfirm,
}: StatusUpdateDialogProps) {
  const [paymentDate, setPaymentDate] = useState<Date>(new Date())

  const handleConfirm = () => {
    onConfirm("paid", format(paymentDate, "yyyy-MM-dd"))
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirmar pagamento</DialogTitle>
          <DialogDescription>
            Informe a data em que o pagamento foi realizado
          </DialogDescription>
        </DialogHeader>
        <div className="py-4">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !paymentDate && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {paymentDate ? (
                  format(paymentDate, "dd/MM/yyyy")
                ) : (
                  <span>Selecione uma data</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={paymentDate}
                onSelect={(date) => date && setPaymentDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={handleConfirm}>Confirmar</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}