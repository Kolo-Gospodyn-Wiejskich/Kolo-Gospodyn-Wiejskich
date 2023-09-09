import { atom, useAtom } from "jotai";
import { type SubmitHandler, useForm } from "react-hook-form";
import { type LayoutProps } from "~/components/layout";
import { secretCodeSchema, signUpSchema } from "~/utils/schemas";
import { zodResolver } from "@hookform/resolvers/zod";
import { api } from "~/utils/api";
import { useState } from "react";
import { z } from "zod";
import { cn } from "~/utils/tailwind-merge";
import toast from "react-hot-toast";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";

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

type SecretCodeFormSchema = z.infer<typeof secretCodeSchema>;

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
  } = useForm<SecretCodeFormSchema>({
    resolver: zodResolver(secretCodeSchema),
  });

  const onSubmit: SubmitHandler<SecretCodeFormSchema> = (data) => {
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

const signUpSchemaWithConfirmPassword = signUpSchema
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    path: ["confirmPassword"],
    message: "Hasła są różne",
  });

type SignUpFormSchema = z.infer<typeof signUpSchemaWithConfirmPassword>;

function SignUpForm() {
  const [customIsLoading, setCustomIsLoading] = useState(false);
  const router = useRouter();

  const { mutate: signUp } = api.users.signUp.useMutation({
    onSuccess: async (data) => {
      const result = await signIn("credentials", {
        firstName: data.firstName,
        lastName: data.lastName,
        password: getValues("password"),
        redirect: false,
      });

      if (!result) return;
      if (result.error) {
        toast.error("Server error, please try again");
        setCustomIsLoading(false);
      }
      if (result.ok) await router.push("/");
    },
    onError: (error) => {
      if (error.data?.code === "CONFLICT") {
        setError("firstName", { type: "server", message: error.message });
        setError("lastName", { type: "server", message: error.message });
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
    clearErrors,
    watch,
    getValues,
  } = useForm<SignUpFormSchema>({
    resolver: zodResolver(signUpSchemaWithConfirmPassword),
  });

  const onSubmit: SubmitHandler<SignUpFormSchema> = (data) => {
    setCustomIsLoading(true);
    signUp(data);
  };

  watch((_, { name }) => {
    if (name !== "firstName" && name !== "lastName") return;

    if (
      errors.firstName?.type === "server" ||
      errors.lastName?.type === "server"
    ) {
      clearErrors();
    }
  });

  return (
    <div className="w-[80vw] space-y-4 sm:w-auto">
      <h1 className="text-4xl font-bold dark:text-primary-content">
        Zostań <span className="text-secondary">gospodynią</span>
      </h1>
      <p>
        Kod prawidłowy, teraz możesz dołączyć do{" "}
        <span className="text-primary">koła</span>{" "}
        <span className="text-secondary">gospodyń</span>{" "}
        <span className="text-accent">wiejskich</span>
      </p>
      <form
        // eslint-disable-next-line @typescript-eslint/no-misused-promises
        onSubmit={handleSubmit(onSubmit)}
        className="flex flex-col gap-2"
      >
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex flex-col">
            <label htmlFor="firstName" className="label label-text">
              Imię
            </label>
            <input
              type="text"
              id="firstName"
              {...register("firstName")}
              disabled={customIsLoading}
              className={cn("input input-bordered", {
                "input-error text-error": errors.firstName,
              })}
            />
            {errors.firstName && (
              <div className="label label-text-alt text-error">
                {errors.firstName.message}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <label htmlFor="lastName" className="label label-text">
              Nazwisko
            </label>
            <input
              type="text"
              id="lastName"
              {...register("lastName")}
              disabled={customIsLoading}
              className={cn("input input-bordered", {
                "input-error text-error": errors.lastName,
              })}
            />
            {errors.lastName && (
              <div className="label label-text-alt text-error">
                {errors.lastName.message}
              </div>
            )}
          </div>
        </div>
        <div className="flex flex-col gap-4 sm:flex-row">
          <div className="flex flex-col">
            <label htmlFor="password" className="label label-text">
              Hasło
            </label>
            <input
              type="password"
              id="password"
              {...register("password")}
              disabled={customIsLoading}
              className={cn("input input-bordered", {
                "input-error text-error": errors.password,
              })}
            />
            {errors.password && (
              <div className="label label-text-alt text-error">
                {errors.password.message}
              </div>
            )}
          </div>
          <div className="flex flex-col">
            <label htmlFor="confirmPassword" className="label label-text">
              Powtórz hasło
            </label>
            <input
              type="password"
              id="confirmPassword"
              {...register("confirmPassword")}
              disabled={customIsLoading}
              className={cn("input input-bordered", {
                "input-error text-error": errors.confirmPassword,
              })}
            />
            {errors.confirmPassword && (
              <div className="label label-text-alt text-error">
                {errors.confirmPassword.message}
              </div>
            )}
          </div>
        </div>
        <button disabled={customIsLoading} className="btn btn-accent mt-2">
          Wyślij
        </button>
      </form>
    </div>
  );
}
