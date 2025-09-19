import * as React from "react"
import { CalendarIcon } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { formatDateForInput, parseDateFromInput } from "@/lib/date-utils"

interface DatePickerProps {
  value?: Date
  onChange?: (date: Date | undefined) => void
  placeholder?: string
  disabled?: boolean
  className?: string
}

export function DatePicker({
  value,
  onChange,
  placeholder = "дд/мм/гг",
  disabled,
  className,
}: DatePickerProps) {
  const [open, setOpen] = React.useState(false)
  const [inputValue, setInputValue] = React.useState(
    value ? formatDateForInput(value) : ""
  )

  React.useEffect(() => {
    setInputValue(value ? formatDateForInput(value) : "")
  }, [value])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    
    // Try to parse the input and update the date
    const parsedDate = parseDateFromInput(newValue)
    if (parsedDate && onChange) {
      onChange(parsedDate)
    }
  }

  const handleDateSelect = (date: Date | undefined) => {
    if (onChange) {
      onChange(date)
    }
    setOpen(false)
  }

  const handleInputBlur = () => {
    // Reformat the input on blur if valid
    if (value) {
      setInputValue(formatDateForInput(value))
    }
  }

  return (
    <div className={cn("relative", className)}>
      <div className="flex">
        <Input
          type="text"
          placeholder={placeholder}
          value={inputValue}
          onChange={handleInputChange}
          onBlur={handleInputBlur}
          disabled={disabled}
          className="pr-10"
        />
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <div>
              <Button
                variant="outline"
                size="icon"
                className="absolute right-0 top-0 h-full w-10 rounded-l-none border-l-0"
                disabled={disabled}
              >
                <CalendarIcon className="h-4 w-4" />
              </Button>
            </div>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={value}
              onSelect={handleDateSelect}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>
    </div>
  )
}