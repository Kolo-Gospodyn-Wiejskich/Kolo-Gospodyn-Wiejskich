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
import { useAtom } from "jotai";
import { dateRangeAtom } from "~/pages/add-competition";

export function DateRangePicker({
  className,
  isError,
  isLoading,
}: React.HTMLAttributes<HTMLDivElement> & {
  isError: boolean;
  isLoading: boolean;
}) {
  const [date, setDate] = useAtom<DateRange | undefined>(dateRangeAtom);

  const numberOfMonths = useNumberOfMonths();

  return (
    <div className={cn("grid gap-2", className)}>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            id="dateRange"
            disabled={isLoading}
            variant={"outline"}
            className={cn(
              "input input-bordered justify-start py-6 text-left font-normal",
              !date && "text-muted-foreground",
              { "input-error text-error": isError },
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
        <PopoverContent
          className="w-auto p-0"
          align="start"
          side="top"
          data-theme="customLight"
        >
          <Calendar
            initialFocus
            mode="range"
            max={14}
            defaultMonth={date?.from}
            selected={date}
            onSelect={setDate}
            numberOfMonths={numberOfMonths}
            disabled={(date) => date <= new Date()}
            className="bg-base-100"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

const useNumberOfMonths = () => {
  const [numberOfMonths, setNumberOfMonths] = React.useState(1);

  const handleScreenChange = (e: MediaQueryListEvent) =>
    setNumberOfMonths(e.matches ? 2 : 1);

  React.useLayoutEffect(() => {
    if (window.matchMedia && window.matchMedia("(min-width: 1024px)").matches)
      setNumberOfMonths(2);

    window
      .matchMedia("(min-width: 1024px)")
      .addEventListener("change", handleScreenChange);

    return () => {
      window
        .matchMedia("(min-width: 1024px)")
        .removeEventListener("change", handleScreenChange);
    };
  }, []);

  return numberOfMonths;
};
