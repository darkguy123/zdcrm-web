"use client"

import * as React from "react"
import { ChevronDown, ChevronUp, Clock } from "lucide-react"
import { useController, type Control } from "react-hook-form"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"
import FormError from "@/components/ui/formError"
import { PopoverClose } from "@radix-ui/react-popover"

interface CustomTimePickerProps {
  className?: string
  control: Control<any>
  name: string
  label?: string
  hasError?: boolean
  errorMessage?: string
  errorMessageClass?: string
  containerClassName?: string
  optional?: boolean
}

const CustomTimePicker = React.forwardRef<HTMLDivElement, CustomTimePickerProps>(function CustomTimePicker(
  {
    className,
    control,
    name,
    label,
    hasError,
    errorMessage,
    errorMessageClass,
    containerClassName,
    optional,
  }: CustomTimePickerProps,
  ref,
) {
  const {
    field: { value, onChange },
  } = useController({
    name,
    control,
    // defaultValue: "15:00", // Set a static default instead of reactive one
  })

  const [hour, setHour] = React.useState(() => {
    if (value) {
      const [h] = value.split(":")
      const hour24 = Number.parseInt(h)
      return (hour24 % 12 || 12).toString().padStart(2, "0")
    }
    return "03" // Default to 3 PM (15:00)
  })

  const [minute, setMinute] = React.useState(() => {
    if (value) {
      return value.split(":")[1]
    }
    return "00"
  })

  const [period, setPeriod] = React.useState(() => {
    if (value) {
      const hour24 = Number.parseInt(value.split(":")[0])
      return hour24 >= 12 ? "PM" : "AM"
    }
    return "PM" // Default to PM for 15:00
  })

  React.useEffect(() => {
  if (value) {
    const [h, m] = value.split(":")
    const hour24 = Number.parseInt(h)
    const hour12 = hour24 % 12 || 12

    setHour(hour12.toString().padStart(2, "0"))
    setMinute(m)
    setPeriod(hour24 >= 12 ? "PM" : "AM")
  }
}, [value])

  const handleTimeChange = React.useCallback(() => {
    let hour24 = Number.parseInt(hour)
    if (period === "PM" && hour24 !== 12) {
      hour24 += 12
    } else if (period === "AM" && hour24 === 12) {
      hour24 = 0
    }
    const time = `${hour24.toString().padStart(2, "0")}:${minute}`
    onChange(time)
  }, [hour, minute, period, onChange])

React.useEffect(() => {
  if (hour && minute && period) {
    handleTimeChange()
  }
}, [hour, minute, period])

  const incrementHour = () => {
    const newHour = Number.parseInt(hour) + 1
    setHour(newHour > 12 ? "01" : newHour.toString().padStart(2, "0"))
  }

  const decrementHour = () => {
    const newHour = Number.parseInt(hour) - 1
    setHour(newHour < 1 ? "12" : newHour.toString().padStart(2, "0"))
  }

  const incrementMinute = () => {
    const newMinute = Number.parseInt(minute) + 1
    setMinute(newMinute > 59 ? "00" : newMinute.toString().padStart(2, "0"))
  }

  const decrementMinute = () => {
    const newMinute = Number.parseInt(minute) - 1
    setMinute(newMinute < 0 ? "59" : newMinute.toString().padStart(2, "0"))
  }

  const togglePeriod = () => {
    setPeriod(period === "AM" ? "PM" : "AM")
  }

  const formatDisplayTime = (value: string) => {
    if (!value) return "Select time"
    const [h, m] = value.split(":")
    const hour24 = Number.parseInt(h)
    const hour12 = hour24 % 12 || 12
    const period = hour24 >= 12 ? "PM" : "AM"
    return `${hour12.toString().padStart(2, "0")}:${m} ${period}`
  }

  return (
    <div className={cn("flex flex-col gap-2", containerClassName)}>
      {label && (
        <Label className="text-sm text-[#0F172B] font-poppins font-medium" htmlFor={name}>
          {label}
          {!optional && <span className="text-red-400 font-medium"> *</span>}
        </Label>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            id={name}
            className={cn(
              "relative w-full justify-start text-left font-normal h-14 rounded-lg",
              "focus:border-[#31A5F9] focus:bg-[#E3F2FD] focus:border-[1.75px]",
              "focus-visible:border-[#31A5F9] focus-visible:border-[1.75px]",
              "transition-all duration-200",
              !value && "text-muted-foreground",
              className,
            )}
          >
            <Clock className="mr-2 h-5 w-5 absolute right-4 top-[30%]" />
            {formatDisplayTime(value)}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[300px] p-0" align="start">
          <div className="p-4 bg-white rounded-lg shadow-lg">
            <h2 className="text-lg font-semibold mb-4 text-center">Select Time</h2>
            <div className="flex justify-between items-center mb-4">
              <div className="text-center w-1/3">
                <Button variant="ghost" size="sm" onClick={incrementHour} className="mb-2">
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <div className="text-2xl font-bold">{hour}</div>
                <Button variant="ghost" size="sm" onClick={decrementHour} className="mt-2">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center w-1/3">
                <Button variant="ghost" size="sm" onClick={incrementMinute} className="mb-2">
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <div className="text-2xl font-bold">{minute}</div>
                <Button variant="ghost" size="sm" onClick={decrementMinute} className="mt-2">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-center w-1/3">
                <Button variant="ghost" size="sm" onClick={togglePeriod} className="mb-2">
                  <ChevronUp className="h-4 w-4" />
                </Button>
                <div className="text-2xl font-bold">{period}</div>
                <Button variant="ghost" size="sm" onClick={togglePeriod} className="mt-2">
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </div>
            </div>
            <PopoverClose asChild className="w-full" onClick={() => handleTimeChange()}>
              <Button>OK</Button>
            </PopoverClose>
          </div>
        </PopoverContent>
      </Popover>
      {hasError && <FormError className={errorMessageClass} errorMessage={errorMessage} />}
    </div>
  )
})
CustomTimePicker.displayName = "CustomTimePicker"

export default CustomTimePicker
