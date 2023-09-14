import * as React from "react";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { type DateRange } from "react-day-picker";

import { Button } from "./dependencies/button";
import { Calendar } from "./dependencies/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "./dependencies/popover";
import { CalendarIcon } from "@radix-ui/react-icons";
import { cn } from "~/utils/tailwind-merge";

export function WeekPicker({
  className,
}: React.HTMLAttributes<HTMLDivElement>) {
  const [date, setDate] = React.useState<DateRange | undefined>();

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="date"
            variant={"outline"}
            className={cn(
              "input input-bordered justify-start py-6 text-left font-normal",
              !date && "text-muted-foreground",
            )}
          >
            <CalendarIcon className="mr-2 h-4 w-4" />
            {date?.from ? (
              date.to ? (
                <>
                  {format(date.from, "dd LLL y", { locale: pl })} -{" "}
                  {format(date.to, "dd LLL y", { locale: pl })}
                </>
              ) : (
                format(date.from, "dd LLL y", { locale: pl })
              )
            ) : (
              <span>Wybierz przedział czasu</span>
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            initialFocus
            mode="range"
            max={13}
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={2}
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}
