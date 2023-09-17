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
import { api } from "~/utils/api";

export function DateRangePicker({
  className,
  isError,
  isLoading,
}: React.HTMLAttributes<HTMLDivElement> & {
  isError: boolean;
  isLoading: boolean;
}) {
  const [date, setDate] = useAtom(dateRangeAtom);

  const numberOfMonths = useNumberOfMonths();

  const { data: disabledDateRanges } =
    api.competitions.getAllDisabledDateRanges.useQuery();

  const isDateDisabled = (dateToCheck: Date) => {
    if (dateToCheck <= new Date()) return true;

    if (!disabledDateRanges) return false;

    for (const disabledDateRange of disabledDateRanges) {
      if (
        dateToCheck >= disabledDateRange.startsAt &&
        dateToCheck <= disabledDateRange.endsAt
      ) {
        return true;
      }
    }
    return false;
  };

  const handleSelectDate = (newDateRange: DateRange | undefined) => {
    // adjust select behaviour
    if (date?.from && date?.to) {
      if (newDateRange?.from === date.to) {
        setDate(undefined);
        return;
      }

      if (newDateRange?.from && newDateRange.from !== date?.from) {
        setDate({
          from: newDateRange.from,
        });
        return;
      }

      if (newDateRange?.to && newDateRange.to !== date?.to) {
        setDate({
          from: newDateRange.to,
        });
        return;
      }
    }

    if (
      !newDateRange ||
      !disabledDateRanges ||
      !newDateRange.from ||
      !newDateRange.to
    ) {
      setDate(newDateRange);
      return;
    }

    // disable taken dates
    for (const disabledDateRange of disabledDateRanges) {
      if (
        (disabledDateRange.startsAt >= newDateRange.from &&
          disabledDateRange.startsAt <= newDateRange.to) ||
        (disabledDateRange.endsAt >= newDateRange.from &&
          disabledDateRange.endsAt <= newDateRange.to)
      ) {
        return;
      }
    }

    setDate(newDateRange);
  };

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
            fixedWeeks={true}
            defaultMonth={date?.from}
            selected={date}
            onSelect={handleSelectDate}
            numberOfMonths={numberOfMonths}
            disabled={isDateDisabled}
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
