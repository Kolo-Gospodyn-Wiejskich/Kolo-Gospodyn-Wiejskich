import { AvatarIcon } from "@radix-ui/react-icons";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { inferProcedureOutput } from "@trpc/server";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import { atom, useAtomValue, useSetAtom } from "jotai";
import {
  type GetStaticPaths,
  type GetStaticPropsContext,
  type InferGetStaticPropsType,
} from "next";
import { useSession } from "next-auth/react";
import Image from "next/image";
import { ChangeEvent, FormEvent, useEffect } from "react";
import superjson from "superjson";
import { AddEntryButton } from "~/components/addEntryButton";
import { type LayoutProps } from "~/components/layout";
import { AppRouter, appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { api } from "~/utils/api";

const competitionIdAtom = atom<string | null>(null);

export async function getStaticProps(
  context: GetStaticPropsContext<{ id: string }>,
) {
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, session: null },
    transformer: superjson,
  });

  // cast as unknown to make ts happy
  const id = context.params?.id as unknown as string;

  const competition = await helpers.competition.getById.fetch({
    id,
  });

  return {
    props: {
      trpcState: helpers.dehydrate(),
      id,
      layout: {
        title: competition.name,
        description: `Konkurencja ${competition.name} Koła Gospodyń Wiejskich`,
        centeredVertically: false,
      } satisfies LayoutProps,
    },
  };
}

export const getStaticPaths: GetStaticPaths = async () => {
  const competitions = await prisma.competiton.findMany({
    select: {
      id: true,
    },
  });

  return {
    paths: competitions.map((competition) => ({
      params: {
        id: competition.id,
      },
    })),
    // https://nextjs.org/docs/pages/api-reference/functions/get-static-paths#fallback-blocking
    fallback: "blocking",
  };
};

export default function CompetitionPage({
  id,
}: InferGetStaticPropsType<typeof getStaticProps>) {
  useSetAndResetCompetitonIdAtom(id);

  const {
    data: competition,
    isLoading,
    error,
  } = api.competition.getById.useQuery({ id });

  // actually its never loading because its preetched in static props
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

  const formattedFrom = format(competition.startsAt, "dd LLL y", {
    locale: pl,
  });

  const formattedTo = format(competition.endsAt, "dd LLL y", {
    locale: pl,
  });

  return (
    <div className="container flex h-full flex-col items-center justify-center gap-16 py-8">
      <h1 className="w-full overflow-hidden text-ellipsis text-center text-5xl font-extrabold text-secondary sm:text-[5rem]">
        {competition.name}
      </h1>
      <p className="flex gap-4 text-center text-xl font-semibold">
        <span>{formattedFrom}</span>
        <span>-</span>
        <span>{formattedTo}</span>
      </p>
      <CompetitionPageFeed />
    </div>
  );
}

function CompetitionPageFeed() {
  const { status: sessionStatus } = useSession();

  if (sessionStatus === "loading")
    return (
      <span className="loading loading-dots loading-lg mt-6 text-accent" />
    );

  return (
    <>
      {sessionStatus === "authenticated" && <AuthedEntryFeed />}
      {sessionStatus === "unauthenticated" && <UnauthedEntryFeed />}
    </>
  );
}

function AuthedEntryFeed() {
  const competitionId = useAtomValue(competitionIdAtom);
  const { data: sessionData } = useSession();

  const { data, isLoading, error } =
    api.entry.getAllWithRatingsByCompetitionId.useQuery(
      {
        id: competitionId!,
      },
      { enabled: !!competitionId },
    );

  const {
    data: activeCompetitionData,
    isLoading: activeIsLoading,
    error: activeError,
  } = api.competition.getActive.useQuery();

  if (isLoading || activeIsLoading)
    return (
      <span className="loading loading-dots loading-lg mt-6 text-accent" />
    );

  if (error)
    return (
      <div className="alert alert-error max-w-fit text-4xl">
        Error loading feed: {error.message}
      </div>
    );

  if (activeError)
    return (
      <div className="alert alert-error max-w-fit text-4xl">
        Error loading feed: {activeError.message}
      </div>
    );

  const isThisCompetitionActive =
    competitionId === activeCompetitionData?.competition?.id;

  return (
    <div className="flex flex-col items-center gap-8">
      {isThisCompetitionActive && <AddEntryButton type="page" />}
      {data.map((authedEntry) =>
        authedEntry.authorId === sessionData?.user.id ? (
          <UnauthedEntry key={authedEntry.id} {...authedEntry} />
        ) : (
          <AuthedEntry
            key={authedEntry.id}
            isActive={isThisCompetitionActive}
            {...authedEntry}
          />
        ),
      )}
    </div>
  );
}

function UnauthedEntryFeed() {
  const competitionId = useAtomValue(competitionIdAtom);

  const { data, isLoading, error } =
    api.entry.getAllForUnauthedByCompetitionId.useQuery(
      {
        id: competitionId!,
      },
      { enabled: !!competitionId },
    );

  if (isLoading)
    return (
      <span className="loading loading-dots loading-lg mt-6 text-accent" />
    );

  if (error)
    return (
      <div className="alert alert-error max-w-fit text-4xl">
        Error loading feed: {error.message}
      </div>
    );

  return (
    <div className="flex flex-col items-center gap-8">
      {data.map((unauthedEntry) => (
        <UnauthedEntry key={unauthedEntry.id} {...unauthedEntry} />
      ))}
    </div>
  );
}

type AuthedEntryProps = {
  isActive: boolean;
} & inferProcedureOutput<
  AppRouter["entry"]["getAllWithRatingsByCompetitionId"]
>[number];

type UnauthedEntryProps = inferProcedureOutput<
  AppRouter["entry"]["getAllForUnauthedByCompetitionId"]
>[number];

function AuthedEntry({
  isActive,
  id,
  author,
  competitionId,
  title,
  description,
  imageUrl,
  ratings,
}: AuthedEntryProps) {
  const utils = api.useContext();

  console.log({ ratings });

  const { mutate: addRating } = api.rating.addNew.useMutation({
    onSuccess: async () => {
      await utils.entry.getAllWithRatingsByCompetitionId.invalidate({
        id: competitionId,
      });
    },
  });

  const handleRatingChange = (
    type: "TASTE" | "APPEARANCE" | "NUTRITION",
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = parseInt(e.target.value);
    addRating({ entryId: id, type, value });
  };

  const shouldBeChecked = (
    type: "TASTE" | "APPEARANCE" | "NUTRITION",
    value: number,
  ) => {
    return !!ratings.find(
      (rating) => rating.type === type && rating.value === value,
    );
  };

  return (
    <div className="card card-bordered w-[80vw] border-8 border-base-200 bg-base-200 bg-opacity-30 sm:w-[28rem] md:w-[36rem]">
      {/* TODO: pick correct width and height */}
      <figure className="rounded-t-lg">
        <Image src={imageUrl} alt={title} width={700} height={700} />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        <span className="flex items-center gap-2 opacity-75">
          <AvatarIcon className="h-6 w-6" />
          <span>
            {author.firstName} {author.lastName}
          </span>
        </span>
        <p>{description}</p>
        <div className="card-actions mt-4 flex-col items-stretch justify-around gap-4 md:flex-row">
          <div className="flex flex-1 flex-col items-center rounded-xl bg-base-300 px-4 py-2 text-center text-secondary">
            <span className="font-semibold">Smak</span>
            <div
              className="rating"
              onChange={(e) =>
                handleRatingChange("TASTE", e as ChangeEvent<HTMLInputElement>)
              }
            >
              <input
                type="radio"
                name="TASTE"
                value={1}
                defaultChecked={shouldBeChecked("TASTE", 1)}
                className="mask mask-star bg-secondary brightness-50"
              />
              <input
                type="radio"
                name="TASTE"
                value={2}
                defaultChecked={shouldBeChecked("TASTE", 2)}
                className="mask mask-star bg-secondary brightness-50"
              />
              <input
                type="radio"
                name="TASTE"
                value={3}
                defaultChecked={shouldBeChecked("TASTE", 3)}
                className="mask mask-star bg-secondary brightness-50"
              />
              <input
                type="radio"
                name="TASTE"
                value={4}
                defaultChecked={shouldBeChecked("TASTE", 4)}
                className="mask mask-star bg-secondary brightness-50"
              />
              <input
                type="radio"
                name="TASTE"
                value={5}
                defaultChecked={shouldBeChecked("TASTE", 5)}
                className="mask mask-star bg-secondary brightness-50"
              />
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center rounded-xl bg-base-300 px-4 py-2 text-center text-accent">
            <span className="font-semibold">Wygląd</span>
            <div
              className="rating"
              onChange={(e) =>
                handleRatingChange(
                  "APPEARANCE",
                  e as ChangeEvent<HTMLInputElement>,
                )
              }
            >
              <input
                type="radio"
                name="APPEARANCE"
                value={1}
                defaultChecked={shouldBeChecked("APPEARANCE", 1)}
                className="mask mask-star bg-accent brightness-50"
              />
              <input
                type="radio"
                name="APPEARANCE"
                value={2}
                defaultChecked={shouldBeChecked("APPEARANCE", 2)}
                className="mask mask-star bg-accent brightness-50"
              />
              <input
                type="radio"
                name="APPEARANCE"
                value={3}
                defaultChecked={shouldBeChecked("APPEARANCE", 3)}
                className="mask mask-star bg-accent brightness-50"
              />
            </div>
          </div>
          <div className="flex flex-1 flex-col items-center rounded-xl bg-base-300 px-4 py-2 text-center text-primary">
            <span className="font-semibold">Odżywczość</span>
            <div
              className="rating"
              onChange={(e) =>
                handleRatingChange(
                  "NUTRITION",
                  e as ChangeEvent<HTMLInputElement>,
                )
              }
            >
              <input
                type="radio"
                name="NUTRITION"
                value={1}
                defaultChecked={shouldBeChecked("NUTRITION", 1)}
                className="mask mask-star bg-primary brightness-50"
              />
              <input
                type="radio"
                name="NUTRITION"
                value={2}
                defaultChecked={shouldBeChecked("NUTRITION", 2)}
                className="mask mask-star bg-primary brightness-50"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UnauthedEntry({
  id,
  author,
  competitionId,
  title,
  description,
  imageUrl,
}: UnauthedEntryProps) {
  return (
    <div className="card card-bordered w-[80vw] border-8 border-base-200 bg-base-200 bg-opacity-30 sm:w-[28rem] md:w-[36rem]">
      {/* TODO: pick correct width and height */}
      <figure className="rounded-t-lg">
        <Image src={imageUrl} alt={title} width={700} height={700} />
      </figure>
      <div className="card-body">
        <h2 className="card-title">{title}</h2>
        <span className="flex items-center gap-2 opacity-75">
          <AvatarIcon className="h-6 w-6" />
          <span>
            {author.firstName} {author.lastName}
          </span>
        </span>
        <p>{description}</p>
      </div>
    </div>
  );
}

const useSetAndResetCompetitonIdAtom = (id: string) => {
  const setCompetitionId = useSetAtom(competitionIdAtom);

  useEffect(() => {
    setCompetitionId(id);
    return () => setCompetitionId(null);
  }, [id, setCompetitionId]);
};
