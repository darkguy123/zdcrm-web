"use client"

import * as React from "react"
import { DayPicker, type DropdownProps } from "react-day-picker"
import { cn } from "@/lib/utils"
import { buttonVariants } from "./button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select"

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  disablePastDates?: boolean
}

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  disabled = undefined,
  disablePastDates = false,
  ...props
}: CalendarProps) {
  // Create a function to disable past dates
  const getDisabledDates = React.useMemo(() => {
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    if (disablePastDates && disabled) {
      // If both disablePastDates and existing disabled prop are provided
      if (typeof disabled === "function") {
        return (date: Date) => disabled(date) || date < today
      } else if (Array.isArray(disabled)) {
        return (date: Date) =>
          disabled.some((disabledItem) => disabledItem instanceof Date && disabledItem.getTime() === date.getTime()) || date < today
      } else {
        return (date: Date) =>
          (disabled instanceof Date && date.getTime() === disabled.getTime()) || date < today
      }
    } else if (disablePastDates) {
      return (date: Date) => date < today
    } else {
      return disabled
    }
  }, [disabled, disablePastDates])

  return (
    <DayPicker
      className={cn("p-3 min-w-[350px]", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0 !min-w-[350px] !w-full",
        month: "space-y-4 !w-full flex flex-col items-center justify-center",
        caption: "flex justify-center pt-1 relative items-center min-w-[300px]",
        caption_label: "text-sm font-light",
        caption_dropdowns: "flex justify-center gap-1",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "unstyled" }),
          "h-7 w-7 bg-transparent p-0 opacity-50 hover:opacity-100",
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell: "text-muted-foreground rounded-md w-9 font-normal text-[0.8rem]",
        row: "flex w-full mt-2",
        cell: "text-center text-sm p-0 relative [&:has([aria-selected])]:bg-accent first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md focus-within:relative focus-within:z-20",
        day: cn(
          buttonVariants({ variant: "unstyled" }),
          "h-9 w-9 p-0 font-normal aria-selected:opacity-100 cursor-pointer",
        ),
        day_selected:
          "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground focus:bg-primary focus:text-primary-foreground",
        day_today: "bg-accent text-accent-foreground",
        day_outside: "text-muted-foreground opacity-50",
        day_disabled: "text-muted-foreground/40 opacity-40 cursor-not-allowed hover:opacity-40",
        day_range_middle: "aria-selected:bg-accent aria-selected:text-accent-foreground",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        /* Replace day picker textual date representation with select dropdowns. */
        /* https://github.com/shadcn-ui/ui/issues/546#issuecomment-1633100711 */
        /* https://gist.github.com/mjbalcueva/1fbcb1be9ef68a82c14d778b686a04fa */
        Dropdown: ({ value, onChange, children }: DropdownProps) => {
          const options = React.Children.toArray(children) as React.ReactElement<React.HTMLProps<HTMLOptionElement>>[]
          const selected = options.find((child) => child.props.value === value)
          const handleChange = (value: string) => {
            const changeEvent = {
              target: { value },
            } as React.ChangeEvent<HTMLSelectElement>
            onChange?.(changeEvent)
          }

          return (
            <Select
              value={value?.toString()}
              onValueChange={(value) => {
                handleChange(value)
              }}
            >
              <SelectTrigger className="h-[28px] px-2 focus:ring-0">
                <SelectValue>{selected?.props?.children}</SelectValue>
              </SelectTrigger>
              <SelectContent position="popper">
                {options.map((option, id: number) => (
                  <SelectItem key={`${option.props.value}-${id}`} value={option.props.value?.toString() ?? ""}>
                    {option.props.children}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )
        },
        IconLeft: ({ ...props }) => (
          <svg fill="none" height={16} viewBox="0 0 16 16" width={16} xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
              clipRule="evenodd"
              d="M6.782 9.886a2.667 2.667 0 0 1-.1-3.665l.1-.106L9.53 3.529a.667.667 0 0 1 .998.88l-.056.063-2.746 2.586a1.333 1.333 0 0 0-.078 1.8l.078.085 2.746 2.586a.667.667 0 0 1-.88.998l-.062-.055-2.747-2.586Z"
              fill="#4E4E4E"
              fillRule="evenodd"
            />
          </svg>
        ),
        IconRight: ({ ...props }) => (
          <svg fill="none" height={16} viewBox="0 0 16 16" width={16} xmlns="http://www.w3.org/2000/svg" {...props}>
            <path
              clipRule="evenodd"
              d="M9.218 6.114a2.667 2.667 0 0 1 .1 3.665l-.1.106-2.747 2.586a.667.667 0 0 1-.998-.88l.056-.063 2.746-2.586c.493-.493.52-1.276.078-1.8l-.078-.085L5.529 4.47a.667.667 0 0 1 .88-.998l.062.055 2.747 2.586Z"
              fill="#4E4E4E"
              fillRule="evenodd"
            />
          </svg>
        ),
      }}
      disabled={getDisabledDates}
      showOutsideDays={showOutsideDays}
      {...props}
    />
  )
}

Calendar.displayName = "Calendar"

export { Calendar }
