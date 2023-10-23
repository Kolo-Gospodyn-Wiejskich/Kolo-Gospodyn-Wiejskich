import { type Competiton as CompetitionType } from "@prisma/client";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import Image from "next/image";
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
    <div className="flex flex-col items-center gap-4 text-center text-4xl">
      <p className="flex w-[80vw] flex-wrap justify-center gap-3">
        <span>Konkurencja</span>
        <Link
          href={`/competition/${competition.id}`}
          className="link-secondary link overflow-hidden text-ellipsis font-semibold"
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

function Competition({
  id,
  name,
  imageUrl,
  startsAt,
  endsAt,
}: CompetitionType) {
  const { data: activeCompetition } = api.competition.getActive.useQuery();

  const formattedFrom = format(startsAt, "dd MMM", { locale: pl });
  const formattedTo = format(endsAt, "dd MMM", { locale: pl });

  return (
    <Link
      href={`/competition/${id}`}
      className={cn(
        "flex h-fit w-56 flex-col items-center justify-start gap-3 rounded-xl bg-base-200 p-4 transition-[filter] hover:brightness-75",
        {
          "border-4 border-secondary":
            id === activeCompetition?.competition?.id,
        },
      )}
    >
      <div className="relative z-40 flex aspect-square w-full items-center justify-center rounded-xl bg-black bg-opacity-60 text-xl font-bold">
        <Image
          src={imageUrl}
          alt={`Zdjęcie przedstawiające ${name}`}
          width={300}
          height={300}
          className="absolute inset-0 z-30 h-full w-full rounded-xl object-cover object-center opacity-50"
        />
        <div className="z-50 overflow-hidden text-ellipsis p-4 text-center text-white">
          {name}
        </div>
      </div>
      <div className="flex gap-3 text-center text-xl font-semibold opacity-90">
        <span>{formattedFrom}</span>
        <span>-</span>
        <span>{formattedTo}</span>
      </div>
    </Link>
  );
}

const useCountdown = (deadline: Date) => {
  const initialDiff = deadline.getTime() - Date.now();

  const [time, setTime] = useState({
    days: Math.floor(initialDiff / (1000 * 60 * 60 * 24)),
    hours: Math.floor((initialDiff / (1000 * 60 * 60)) % 24),
    minutes: Math.floor((initialDiff / 1000 / 60) % 60),
    seconds: Math.floor((initialDiff / 1000) % 60),
  });

  const handleSetTime = (endDate: Date) => {
    const diff = endDate.getTime() - Date.now();

    if (diff <= 0) {
      setTime({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    setTime({
      days: Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((diff / 1000 / 60) % 60),
      seconds: Math.floor((diff / 1000) % 60),
    });
  };

  useEffect(() => {
    const interval = setInterval(() => handleSetTime(deadline), 1000);
    return () => clearInterval(interval);
  }, [deadline]);

  return time;
};
