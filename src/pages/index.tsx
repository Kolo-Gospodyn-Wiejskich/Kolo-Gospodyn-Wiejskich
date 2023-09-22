import { type Competiton } from "@prisma/client";
import Link from "next/link";
import { type CSSProperties, useEffect, useState } from "react";
import { type LayoutProps } from "~/components/layout";
import { api } from "~/utils/api";
import { cn } from "~/utils/tailwind-merge";

export function getStaticProps() {
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
    <div className="container flex h-full flex-col items-center justify-center gap-12 py-8">
      <h1 className="text-center text-5xl font-extrabold sm:text-[5rem]">
        <span className="text-primary">Koło</span>{" "}
        <span className="text-secondary">Gospodyń</span>{" "}
        <span className="text-accent">Wiejskich</span>
      </h1>
      <ActiveCompetition />
      <CompetitionList />
    </div>
  );
}

function ActiveCompetition() {
  const { data, isLoading, error } = api.competition.getActive.useQuery();

  if (isLoading) return null;

  if (error)
    return (
      <div className="alert alert-error max-w-fit text-4xl">
        Error: {error.message}
      </div>
    );

  const { isActive, competition } = data;

  if (!isActive) {
    return (
      <div className="text-center text-4xl">Brak aktywnej konkurencji</div>
    );
  }

  return (
    <div className="w-full space-y-4 text-center text-4xl">
      <p>
        <span>Konkurencja </span>
        <Link
          href={`/competition/${competition.id}`}
          className="link-secondary link block overflow-hidden text-ellipsis font-semibold"
        >
          {competition.name}
        </Link>
      </p>
      <p>Odliczanie do końca</p>
      <ActiveCompetitionCountDown deadline={competition.endsAt} />
    </div>
  );
}

function ActiveCompetitionCountDown({ deadline }: { deadline: Date }) {
  const { days, hours, minutes, seconds } = useCountdown(deadline);

  return (
    <span className="countdown font-mono text-5xl">
      <span style={{ "--value": days } as CSSProperties} />:
      <span style={{ "--value": hours } as CSSProperties} />:
      <span style={{ "--value": minutes } as CSSProperties} />:
      <span style={{ "--value": seconds } as CSSProperties} />
    </span>
  );
}

function CompetitionList() {
  const {
    data: competitions,
    isLoading,
    error,
  } = api.competition.getAll.useQuery();

  if (isLoading)
    return (
      <span className="loading loading-dots loading-lg mt-6 text-secondary" />
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
  const { data: activeCompetition } = api.competition.getActive.useQuery();

  return (
    <Link
      href={`/competition/${id}`}
      className={cn(
        "flex h-56 w-56 items-center justify-center rounded-xl bg-base-200 p-4",
        {
          "border-4 border-secondary":
            id === activeCompetition?.competition?.id,
        },
      )}
    >
      <div className="flex h-full w-full items-center justify-center rounded-xl bg-base-300 text-xl font-semibold">
        <div className="overflow-hidden text-ellipsis p-4 text-center">
          {name}
        </div>
      </div>
    </Link>
  );
}

const useCountdown = (deadline: Date) => {
  const initialTime = deadline.getTime() - Date.now();

  const [days, setDays] = useState(
    Math.floor(initialTime / (1000 * 60 * 60 * 24)),
  );
  const [hours, setHours] = useState(
    Math.floor((initialTime / (1000 * 60 * 60)) % 24),
  );
  const [minutes, setMinutes] = useState(
    Math.floor((initialTime / 1000 / 60) % 60),
  );
  const [seconds, setSeconds] = useState(Math.floor((initialTime / 1000) % 60));

  const setTime = (endDate: Date) => {
    const time = endDate.getTime() - Date.now();

    setDays(Math.floor(time / (1000 * 60 * 60 * 24)));
    setHours(Math.floor((time / (1000 * 60 * 60)) % 24));
    setMinutes(Math.floor((time / 1000 / 60) % 60));
    setSeconds(Math.floor((time / 1000) % 60));
  };

  useEffect(() => {
    const interval = setInterval(() => setTime(deadline), 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  return { days, hours, minutes, seconds };
};
