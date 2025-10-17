'use client'
import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import type { Account } from "@/lib/types"

interface AccountSearchInputProps {
    label: string;
    value: string;
    onValueChange: (value: string) => void;
    accounts: Account[];
    loading: boolean;
}

export function AccountSearchInput({ label, value, onValueChange, accounts, loading }: AccountSearchInputProps) {
  const [open, setOpen] = React.useState(false)
  const selectedAccount = accounts.find((account) => account.code === value)

  return (
    <div className="space-y-2">
        <Label>{label}</Label>
        <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
            <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between font-normal"
            disabled={loading}
            >
            {loading 
                ? "Cargando cuentas..." 
                : value && selectedAccount
                ? `${selectedAccount.code} - ${selectedAccount.name}`
                : "Seleccionar cuenta..."}
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
            </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
            <Command>
                <CommandInput placeholder="Buscar por código o nombre..." />
                <CommandList>
                    <CommandEmpty>No se encontró ninguna cuenta.</CommandEmpty>
                    <CommandGroup>
                        {accounts.map((account) => (
                        <CommandItem
                            key={account.id}
                            value={`${account.code} ${account.name}`}
                            onSelect={() => {
                                onValueChange(account.code)
                                setOpen(false)
                            }}
                        >
                            <Check
                                className={cn(
                                "mr-2 h-4 w-4",
                                value === account.code ? "opacity-100" : "opacity-0"
                                )}
                            />
                            {account.code} - {account.name}
                        </CommandItem>
                        ))}
                    </CommandGroup>
                </CommandList>
            </Command>
        </PopoverContent>
        </Popover>
    </div>
  )
}
