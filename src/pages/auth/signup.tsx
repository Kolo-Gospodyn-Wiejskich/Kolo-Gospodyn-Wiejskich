import { atom, useAtom } from "jotai";
import { type SubmitHandler, useForm } from "react-hook-form";
import { type LayoutProps } from "~/components/layout";
import { secretCodeSchema } from "~/utils/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/utils/api";
import { useState } from "react";
import { type z } from "zod";
import { cn } from "~/utils/tailwind-merge";

type FormSchema = z.infer<typeof secretCodeSchema>;

const isCorrectSecretCodeEnteredAtom = atom(false);

export function getServerSideProps() {
  return {
    props: {
      layout: {
        title: "Rejestracja",
        description: "Zarejestruj sie do Koła Gospodyń Wiejskich",
      } satisfies LayoutProps,
    },
  };
}

export default function SignUp() {
  const [isCorrectSecretCodeEntered] = useAtom(isCorrectSecretCodeEnteredAtom);

  return (
    <div className="container flex h-full flex-col items-center justify-center gap-6">
      {isCorrectSecretCodeEntered ? <SignUpForm /> : <SecretCodeForm />}
    </div>
  );
}

function SecretCodeForm() {
  const [customIsLoading, setCustomIsLoading] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [_, setIsCorrectSecretCodeEntered] = useAtom(
    isCorrectSecretCodeEnteredAtom,
  );

  const { mutate: checkSecretCode } = api.users.checkSecretCode.useMutation({
    onSuccess: () => {
      setIsCorrectSecretCodeEntered(true);
    },
    onError: ({ message }) => {
      setError("secretCode", { type: "server", message });
      setCustomIsLoading(false);
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<FormSchema>({
    resolver: zodResolver(secretCodeSchema),
  });

  const onSubmit: SubmitHandler<FormSchema> = (data) => {
    setCustomIsLoading(true);
    checkSecretCode(data);
  };

  return (
    <div className="w-[80vw] space-y-4 sm:w-96">
      <h1 className="text-4xl font-bold dark:text-primary-content">
        Zostań <span className="text-secondary">gospodynią</span>
      </h1>
      <p>
        Aby zostać <span className="text-secondary">gospodynią</span>{" "}
        <span className="text-primary">koła</span> musisz wpisać kod
        uprawniający do członkostwa
      </p>
      <form
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-2"
      >
        <div className="flex flex-col">
          <label htmlFor="secretCode" className="label label-text">
            Kod
          </label>
          <input
            type="text"
            id="secretCode"
            {...register("secretCode")}
            disabled={customIsLoading}
            className={cn("input input-bordered", {
              "input-error text-error": errors.secretCode,
            })}
          />
          {errors.secretCode && (
            <div className="label label-text-alt text-error">
              {errors.secretCode.message}
            </div>
          )}
        </div>
        <button disabled={customIsLoading} className="btn btn-accent mt-2">
          Wyślij
        </button>
      </form>
    </div>
  );
}

function SignUpForm() {
  return (
    <div className="w-[80vw] space-y-4 sm:w-96">
      <h1 className="text-4xl font-bold dark:text-primary-content">
        Zostań <span className="text-secondary">gospodynią</span>
      </h1>
      <p>
        Kod prawidłowy, teraz możesz dołączyć do{" "}
        <span className="text-primary">koła</span>{" "}
        <span className="text-secondary">gospodyń</span>{" "}
        <span className="text-accent">wiejskich</span>
      </p>
    </div>
  );
}
