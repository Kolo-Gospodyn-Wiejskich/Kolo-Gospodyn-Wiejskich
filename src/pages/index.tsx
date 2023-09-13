import { type Competiton } from "@prisma/client";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { type LayoutProps } from "~/components/layout";
import { api } from "~/utils/api";
import { dateToRelative } from "~/utils/relativeDate";

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
    <div className="container flex h-full flex-col items-center justify-center gap-6">
      <h1 className="text-center text-5xl font-extrabold sm:text-[5rem]">
        <span className="text-primary">Koło</span>{" "}
        <span className="text-secondary">Gospodyń</span>{" "}
        <span className="text-accent">Wiejskich</span>
      </h1>
      <div className="flex flex-col items-center gap-6">
        <Welcome />
        <CompetitionList />
      </div>
    </div>
  );
}

function Welcome() {
  const { data } = useSession();

  if (!data) return null;

  return (
    <p className="text-3xl">
      Witaj,{" "}
      <span className="font-semibold">
        {data.user.firstName} {data.user.lastName}
      </span>
    </p>
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
    <div>
      {competitions.map((competition) => (
        <Competition key={competition.id} {...competition} />
      ))}
    </div>
  );
}

function Competition({ id, name, startsAt, endsAt }: Competiton) {
  return (
    <Link href={`/competition/${id}`}>
      <div>{name}</div>
      <div>{dateToRelative(startsAt)}</div>
      <div>{dateToRelative(endsAt)}</div>
    </Link>
  );
}
