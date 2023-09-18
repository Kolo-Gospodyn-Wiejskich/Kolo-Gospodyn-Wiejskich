import { zodResolver } from "@hookform/resolvers/zod";
import { atom, useAtomValue } from "jotai";
import { useRouter } from "next/router";
import { useEffect, useState } from "react";
import { type DateRange } from "react-day-picker";
import {
  type SubmitHandler,
  useForm,
  UseFormSetValue,
  UseFormGetValues,
  UseFormTrigger,
  UseFormStateReturn,
  UseFormReset,
} from "react-hook-form";
import toast from "react-hot-toast";
import { type z } from "zod";
import { type LayoutProps } from "~/components/layout";
import { DateRangePicker } from "~/components/ui/date-range-picker";
import { api } from "~/utils/api";
import { competitionSchema } from "~/utils/schemas";
import { cn } from "~/utils/tailwind-merge";
import { useProtectedPage } from "~/utils/useProtectedPage";
// import  from '@radix-ui/react-form';

export function getServerSideProps() {
  return {
    props: {
      layout: {
        title: "Dodaj konkurencję",
        description: "Dodaj konkurencję do Koła Gospodyń Wiejskich",
      } satisfies LayoutProps,
    },
  };
}

export const dateRangeAtom = atom<DateRange | undefined>(undefined);

type FormSchema = z.infer<typeof competitionSchema>;

export default function AddCompetition() {
  const [customIsLoading, setCustomIsLoading] = useState(false);
  const router = useRouter();

  const { mutate: addCompetition } = api.competitions.addNew.useMutation({
    onSuccess: async ({ id }) => {
      await router.push(`/competition/${id}`);
    },
    onError: (error) => {
      if (
        error.data?.code === "CONFLICT" ||
        error.data?.code === "BAD_REQUEST"
      ) {
        setError("startsAt", { type: "server", message: error.message });
        setError("endsAt", { type: "server", message: error.message });
      } else {
        toast.error("Server error, please try again");
      }
      setCustomIsLoading(false);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitted },
    setError,
    watch,
    clearErrors,
    setValue,
    getValues,
    reset,
    trigger,
  } = useForm<FormSchema>({
    resolver: zodResolver(competitionSchema),
  });

  watch((_, { name }) => {
    if (name !== "startsAt" && name !== "endsAt") return;

    if (
      errors.startsAt?.type === "server" ||
      errors.endsAt?.type === "server"
    ) {
      clearErrors(["startsAt", "endsAt"]);
    }
  });

  useCustomDatePickerBehavior({
    setValue,
    getValues,
    reset,
    trigger,
    isSubmitted,
  });

  const onSubmit: SubmitHandler<FormSchema> = (data) => {
    setCustomIsLoading(true);

    const correctEndsAt = new Date(data.endsAt.getTime());
    correctEndsAt.setSeconds(correctEndsAt.getSeconds() - 1);
    correctEndsAt.setDate(correctEndsAt.getDate() + 1);

    const dataWithCorrectEndsAt = {
      name: data.name,
      startsAt: data.startsAt,
      endsAt: correctEndsAt,
    };

    addCompetition(dataWithCorrectEndsAt);
  };

  const { isAuthed } = useProtectedPage();
  if (!isAuthed) return null;

  return (
    <div className="w-[80vw] space-y-4 sm:w-96">
      <h1 className="text-4xl font-bold dark:text-primary-content">
        Dodaj <span className="text-primary">konkurencję</span>
      </h1>
      <p>
        Podaj nazwę <span className="text-primary">konkurencji</span>, oraz
        przedział czasu w jakim ma się wydarzyć
      </p>
      <form
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-2"
      >
        <div className="flex flex-col">
          <label htmlFor="name" className="label label-text">
            Nazwa
          </label>
          <input
            placeholder="Ciasteczka..."
            type="text"
            id="name"
            {...register("name")}
            disabled={customIsLoading}
            className={cn("input input-bordered", {
              "input-error text-error": errors.name,
            })}
          />
          {errors.name && (
            <div className="label label-text-alt text-error">
              {errors.name.message}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <label htmlFor="dateRange" className="label label-text">
            Przedział czasu
          </label>
          <DateRangePicker
            isError={!!errors.startsAt || !!errors.endsAt}
            isLoading={customIsLoading}
          />
          {errors.startsAt && (
            <div className="label label-text-alt text-error">
              {errors.startsAt.message}
            </div>
          )}
          {!errors.startsAt && errors.endsAt && (
            <div className="label label-text-alt text-error">
              {errors.endsAt.message}
            </div>
          )}
          <div className="label label-text-alt">
            Ustaw tydzień w przypadku braku sytuacji nadzwyczajnej
          </div>
        </div>
        <button disabled={customIsLoading} className="btn btn-primary mt-2">
          Dodaj
        </button>
      </form>
    </div>
  );
}

const useCustomDatePickerBehavior = ({
  setValue,
  reset,
  getValues,
  isSubmitted,
  trigger,
}: {
  setValue: UseFormSetValue<FormSchema>;
  reset: UseFormReset<FormSchema>;
  getValues: UseFormGetValues<FormSchema>;
  isSubmitted: UseFormStateReturn<FormSchema>["isSubmitted"];
  trigger: UseFormTrigger<FormSchema>;
}) => {
  const dateRangeValue = useAtomValue(dateRangeAtom);

  useEffect(() => {
    if (!dateRangeValue) {
      reset(
        {
          name: getValues("name"),
        },
        { keepIsSubmitted: true },
      );
      if (isSubmitted) {
        void trigger("startsAt");
        void trigger("endsAt");
      }
      return;
    }
    if (dateRangeValue.from) setValue("startsAt", dateRangeValue.from);
    else {
      reset(
        {
          name: getValues("name"),
          endsAt: getValues("endsAt"),
        },
        { keepIsSubmitted: true },
      );
    }
    if (dateRangeValue.to) setValue("endsAt", dateRangeValue.to);
    else {
      reset(
        {
          name: getValues("name"),
          startsAt: getValues("startsAt"),
        },
        { keepIsSubmitted: true },
      );
    }
    if (isSubmitted) {
      void trigger("startsAt");
      void trigger("endsAt");
    }
  }, [dateRangeValue, setValue, reset, getValues, isSubmitted, trigger]);
};
