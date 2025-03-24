import * as React from "react"
import { useState, useCallback } from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { useQuery, useMutation } from "@tanstack/react-query"
import { apiRequest } from "@/lib/queryClient"
import { queryClient } from "@/lib/queryClient"
import { useToast } from "@/hooks/use-toast"

interface AutocompleteInputProps {
  value?: string;
  onChange: (value: string) => void;
  queryKey: string;
  placeholder: string;
  createEndpoint?: string;
  items?: string[];
  emptyText?: string;
}

export function AutocompleteInput({
  value,
  onChange,
  queryKey,
  placeholder,
  createEndpoint,
  items: propItems,
  emptyText = "No results found.",
}: AutocompleteInputProps) {
  const [open, setOpen] = useState(false)
  const [inputValue, setInputValue] = useState("")
  const { toast } = useToast()

  const { data: fetchedItems = [] } = useQuery<string[]>({
    queryKey: [queryKey],
    enabled: !propItems,
  })

  const items = propItems || fetchedItems

  const createItemMutation = useMutation({
    mutationFn: async (value: string) => {
      if (!createEndpoint) return value
      const res = await apiRequest("POST", createEndpoint, { name: value })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.message || 'Failed to create item')
      }
      return (await res.json()).name
    },
    onSuccess: (newValue) => {
      if (createEndpoint) {
        queryClient.invalidateQueries({ queryKey: [queryKey] })
      }
      onChange(newValue)
      setOpen(false)
      setInputValue("")
      toast({ title: "Item created successfully" })
    },
    onError: (error: Error) => {
      toast({ 
        title: "Failed to create item",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  const createItem = useCallback(async (value: string) => {
    const trimmedValue = value.trim()
    if (!trimmedValue) return

    // If item already exists, just select it
    if (items.some(item => item.toLowerCase() === trimmedValue.toLowerCase())) {
      onChange(trimmedValue)
      setOpen(false)
      setInputValue("")
      return
    }

    await createItemMutation.mutateAsync(trimmedValue)
  }, [createItemMutation, items, onChange])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between"
        >
          {value || placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-full p-0">
        <Command>
          <CommandInput
            placeholder={`Search ${placeholder.toLowerCase()}...`}
            value={inputValue}
            onValueChange={setInputValue}
          />
          <CommandEmpty>
            {createEndpoint && (
              <Button
                variant="secondary"
                className="w-full"
                onClick={() => createItem(inputValue)}
                disabled={!inputValue.trim()}
              >
                Create "{inputValue}"
              </Button>
            )}
            {!createEndpoint && emptyText}
          </CommandEmpty>
          <CommandGroup>
            {items.map((item) => (
              <CommandItem
                key={item}
                value={item}
                onSelect={(currentValue) => {
                  onChange(currentValue)
                  setOpen(false)
                }}
              >
                <Check
                  className={cn(
                    "mr-2 h-4 w-4",
                    value === item ? "opacity-100" : "opacity-0"
                  )}
                />
                {item}
              </CommandItem>
            ))}
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
