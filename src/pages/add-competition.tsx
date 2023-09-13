import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/router";
import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { type z } from "zod";
import { type LayoutProps } from "~/components/layout";
import { api } from "~/utils/api";
import { competitionSchema } from "~/utils/schemas";
import { cn } from "~/utils/tailwind-merge";

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

type FormSchema = z.infer<typeof competitionSchema>;

export default function AddCompetition() {
  const [customIsLoading, setCustomIsLoading] = useState(false);
  const router = useRouter();

  const { mutate: addCompetition } = api.competitions.addNew.useMutation({
    onSuccess: async ({ id }) => {
      await router.push(`/competition/${id}`);
    },
    onError: (error) => {
      if (error.data?.code === "CONFLICT") {
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
    formState: { errors },
    setError,
    watch,
    clearErrors,
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

  const onSubmit: SubmitHandler<FormSchema> = (data) => {
    setCustomIsLoading(true);
    addCompetition(data);
  };

  const startsAtField = watch("startsAt");
  const endsAtField = watch("endsAt");
  console.log({ startsAtField, endsAtField });
  const startsAtDate = startsAtField
    ? startsAtField.toISOString().split("T")[0]
    : undefined;
  const endsAtDate = endsAtField
    ? endsAtField.toISOString().split("T")[0]
    : undefined;

  console.log({ startsAtDate, endsAtDate });

  const stringToDate = (string: string) =>
    string ? new Date(string) : undefined;

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
          <label htmlFor="startsAt" className="label label-text">
            Początek
          </label>
          <input
            max={endsAtDate}
            type="date"
            id="startsAt"
            {...register("startsAt", { setValueAs: stringToDate })}
            disabled={customIsLoading}
            className={cn("input input-bordered", {
              "input-error text-error": errors.startsAt,
            })}
          />
          {errors.startsAt && (
            <div className="label label-text-alt text-error">
              {errors.startsAt.message}
            </div>
          )}
        </div>
        <div className="flex flex-col">
          <label htmlFor="endsAt" className="label label-text">
            Koniec
          </label>
          <input
            min={startsAtDate}
            type="date"
            id="endsAt"
            {...register("endsAt", { setValueAs: stringToDate })}
            disabled={customIsLoading}
            className={cn("input input-bordered", {
              "input-error text-error": errors.endsAt,
            })}
          />
          {errors.endsAt && (
            <div className="label label-text-alt text-error">
              {errors.endsAt.message}
            </div>
          )}
        </div>
        <button disabled={customIsLoading} className="btn btn-primary mt-2">
          Dodaj
        </button>
      </form>
    </div>
  );
}
