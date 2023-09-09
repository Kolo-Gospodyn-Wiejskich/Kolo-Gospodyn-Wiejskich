import { zodResolver } from "@hookform/resolvers/zod";
import { signIn } from "next-auth/react";
import { useRouter } from "next/router";
import { useState } from "react";
import { type SubmitHandler, useForm } from "react-hook-form";
import { type z } from "zod";
import { type LayoutProps } from "~/components/layout";
import { loginSchema } from "~/utils/schemas";
import { cn } from "~/utils/tailwind-merge";

type FormSchema = z.infer<typeof loginSchema>;

export function getServerSideProps() {
  return {
    props: {
      layout: {
        title: "Logowanie",
        description: "Zaloguj się do Koła Gospodyń Wiejskich",
      } satisfies LayoutProps,
    },
  };
}

export default function LogIn() {
  const [customIsLoading, setCustomIsLoading] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
    watch,
  } = useForm<FormSchema>({
    resolver: zodResolver(loginSchema),
  });

  watch(() => {
    if (
      errors.firstName?.type === "server" ||
      errors.lastName?.type === "server" ||
      errors.password?.type === "server"
    ) {
      clearErrors();
    }
  });

  const onSubmit: SubmitHandler<FormSchema> = async (data) => {
    setCustomIsLoading(true);

    const result = await signIn("credentials", { ...data, redirect: false });

    if (result?.error) {
      setError("firstName", { type: "server", message: "Nieprawidłowe dane" });
      setError("lastName", { type: "server", message: "Nieprawidłowe dane" });
      setError("password", { type: "server", message: "Nieprawidłowe dane" });
      setCustomIsLoading(false);
    }
    if (result?.ok) await router.push("/");
  };

  return (
    <div className="container flex h-full flex-col items-center justify-center gap-6">
      <div className="w-[80vw] space-y-4 sm:w-96">
        <h1 className="text-4xl font-bold dark:text-primary-content">
          Zaloguj się
        </h1>
        <p>
          Zaloguj się do <span className="text-primary">koła</span>{" "}
          <span className="text-secondary">gospodyń</span>{" "}
          <span className="text-accent">wiejskich</span>
        </p>
        <form
          // eslint-disable-next-line @typescript-eslint/no-misused-promises
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-2"
        >
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
          <div className="flex flex-col">
            <label htmlFor="password" className="label label-text">
              Password
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

          <button disabled={customIsLoading} className="btn btn-accent mt-2">
            Zaloguj
          </button>
        </form>
      </div>
    </div>
  );
}
