import { format } from "date-fns";
import { pl } from "date-fns/locale";
import * as React from "react";
import { type DateRange } from "react-day-picker";

import { CalendarIcon } from "@radix-ui/react-icons";
import { useAtom } from "jotai";
import { type Matcher } from "react-day-picker";
import { dateRangeAtom } from "~/pages/add-competition";
import { api } from "~/utils/api";
import { cn } from "~/utils/tailwind-merge";
import { Button } from "../ui/dependencies/button";
import { Calendar } from "../ui/dependencies/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/dependencies/popover";

type NonUndefinedValues<T> = Required<{
  [K in keyof T]: NonNullable<T[K]>;
}>;

type FullDateRange = NonUndefinedValues<DateRange>;

export function DateRangePicker({
  className,
  isError,
  isLoading,
}: React.HTMLAttributes<HTMLDivElement> & {
  isError: boolean;
  isLoading: boolean;
}) {
  const [date, setDate] = useAtom(dateRangeAtom);

  const { data: takenDateRanges } =
    api.competition.getAllTakenDateRanges.useQuery();

  const handleSelectDate = (newDateRange: DateRange | undefined) => {
    // adjust select behavior
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
      !takenDateRanges ||
      !newDateRange.from ||
      !newDateRange.to
    ) {
      setDate(newDateRange);
      return;
    }

    setDate(newDateRange);
  };

  const numberOfMonths = useNumberOfMonths();

  const disabledMatchers = getDisabledMatchers({
    dbTakenRanges: takenDateRanges,
    selectedDate: date?.from,
  });

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
            disabled={disabledMatchers}
            className="bg-base-100"
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

interface GetDisabledMatchersProps {
  dbTakenRanges: FullDateRange[] | undefined;
  selectedDate: Date | undefined;
}

const getDisabledMatchers = (props: GetDisabledMatchersProps): Matcher[] => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);

  return [...getUnreachableRanges(props), { before: tomorrow }];
};

const getUnreachableRanges = ({
  dbTakenRanges,
  selectedDate,
}: GetDisabledMatchersProps): Matcher[] => {
  if (!dbTakenRanges) return [];

  if (!selectedDate) return dbTakenRanges;

  return dbTakenRanges.map((rangeToExtend) => {
    const fromAndDayBefore = new Date(rangeToExtend.from);
    fromAndDayBefore.setDate(fromAndDayBefore.getDate() - 1);

    const toAndDayAfter = new Date(rangeToExtend.to);
    toAndDayAfter.setDate(toAndDayAfter.getDate() + 1);

    if (rangeToExtend.from >= selectedDate) return { after: fromAndDayBefore };
    return { before: toAndDayAfter };
  });
};

const useNumberOfMonths = () => {
  const [numberOfMonths, setNumberOfMonths] = React.useState(1);

  const handleScreenChange = (e: MediaQueryListEvent) =>
    setNumberOfMonths(e.matches ? 2 : 1);

  React.useEffect(() => {
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
