import { type Competiton } from "@prisma/client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { type LayoutProps } from "~/components/layout";
import { api } from "~/utils/api";

export function getServerSideProps() {
  return {
    props: {
      layout: {
        title: "Koło Gospodyń Wiejskich",
        description: "Witaj na stronie Koła Gospodyń Wiejskich",
        centeredVertically: false,
      } satisfies LayoutProps,
    },
  };
}

export default function Home() {
  return (
    <div className="container flex h-full flex-col items-center justify-center gap-16 py-8">
      <h1 className="text-center text-5xl font-extrabold sm:text-[5rem]">
        <span className="text-primary">Koło</span>{" "}
        <span className="text-secondary">Gospodyń</span>{" "}
        <span className="text-accent">Wiejskich</span>
      </h1>
      <Welcome />
      <CompetitionList />
    </div>
  );
}

function Welcome() {
  const { data } = useSession();

  if (!data) return null;

  return (
    <div className="text-center text-3xl">
      Witaj,{" "}
      <span className="font-semibold">
        {data.user.firstName} {data.user.lastName}
      </span>
    </div>
  );
}

function CompetitionList() {
  const {
    data: competitions,
    isLoading,
    error,
  } = api.competitions.getAll.useQuery();

  if (isLoading)
    return (
      <span className="loading loading-dots loading-lg mt-6 text-accent" />
    );

  if (error)
    return (
      <div className="alert alert-error max-w-fit text-4xl">
        Error: {error.message}
      </div>
    );

  if (competitions.length === 0)
    return (
      <div className="rounded-xl bg-base-200 px-4 py-2 text-center text-2xl">
        Brak konkurencji
      </div>
    );

  return (
    <div className="flex w-[80vw] flex-wrap justify-center gap-4 sm:w-[60vw]">
      {competitions.map((competition) => (
        <Competition key={competition.id} {...competition} />
      ))}
    </div>
  );
}

type CompetitionProps = Pick<Competiton, "id" | "name">;

function Competition({ id, name }: CompetitionProps) {
  return (
    <Link
      href={`/competition/${id}`}
      className="flex h-56 w-56 items-center justify-center rounded-xl bg-base-200 p-4"
    >
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-base-300 text-xl font-semibold">
        <div className="overflow-hidden text-ellipsis p-4 text-center">
          {name}
        </div>
      </div>
    </Link>
  );
}
