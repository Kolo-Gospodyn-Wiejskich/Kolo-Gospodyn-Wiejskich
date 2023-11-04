import { type Rating } from "@prisma/client";
import * as Dialog from "@radix-ui/react-dialog";
import { AvatarIcon } from "@radix-ui/react-icons";
import { createServerSideHelpers } from "@trpc/react-query/server";
import { type inferProcedureOutput } from "@trpc/server";
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
import { type ChangeEvent, useEffect, type PropsWithChildren } from "react";
import toast from "react-hot-toast";
import superjson from "superjson";
import { AddEntryButton } from "~/components/addEntryButton";
import { type LayoutProps } from "~/components/layout";
import { type AppRouter, appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { api } from "~/utils/api";
import {
  MAX_POINTS_APPEARANCE,
  MAX_POINTS_NUTRITION,
  MAX_POINTS_TASTE,
} from "~/utils/schemas";
import { cn } from "~/utils/tailwind-merge";

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

  const competitionId = useAtomValue(competitionIdAtom);
  const { data } = api.rating.getRankingByCompetitionId.useQuery(
    { id: competitionId! },
    { enabled: !!competitionId },
  );

  if (sessionStatus === "loading" || !data)
    return (
      <span className="loading loading-dots loading-lg mt-6 text-accent" />
    );

  return (
    <>
      <CompetitionRanking rankingsArray={data} />
      {sessionStatus === "authenticated" && <AuthedEntryFeed />}
      {sessionStatus === "unauthenticated" && <UnauthedEntryFeed />}
    </>
  );
}

interface CompetitionRankingProps {
  rankingsArray: inferProcedureOutput<
    AppRouter["rating"]["getRankingByCompetitionId"]
  >;
}

function CompetitionRanking({ rankingsArray }: CompetitionRankingProps) {
  if (rankingsArray.length === 0) return null;

  return (
    <div className="space-y-4">
      <div className="text-center text-4xl font-bold text-secondary">
        Ranking
      </div>
      <ol className="space-y-1">
        {rankingsArray.map((spot) => (
          <li key={spot.name} className="flex justify-between gap-10 text-xl">
            <div>{spot.name}</div>
            <div className="font-semibold">{spot.value} pkt</div>
          </li>
        ))}
      </ol>
    </div>
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
          <EntryWithoutRatings key={authedEntry.id} {...authedEntry} />
        ) : (
          <EntryWithRatings
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
    api.entry.getAllWithoutRatingsByCompetitionId.useQuery(
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
        <EntryWithoutRatings key={unauthedEntry.id} {...unauthedEntry} />
      ))}
    </div>
  );
}

type EntryWithRatingsProps = {
  isActive: boolean;
} & inferProcedureOutput<
  AppRouter["entry"]["getAllWithRatingsByCompetitionId"]
>[number];

type EntryWithoutRatingsProps = inferProcedureOutput<
  AppRouter["entry"]["getAllWithoutRatingsByCompetitionId"]
>[number];

function EntryWithRatings({
  isActive,
  id,
  author,
  competitionId,
  title,
  description,
  imageUrl,
  ratings,
}: EntryWithRatingsProps) {
  return (
    <div className="card card-bordered w-[80vw] border-8 border-base-200 bg-base-200 bg-opacity-30 sm:w-[28rem] md:w-[36rem]">
      {/* TODO: pick correct width and height */}
      <figure className="rounded-t-lg">
        <EntryImageDialog imageUrl={imageUrl} title={title}>
          <Image src={imageUrl} alt={title} width={700} height={700} />
        </EntryImageDialog>
      </figure>
      <div className="card-body">
        <h2 className="card-title block overflow-hidden text-ellipsis">
          {title}
        </h2>
        <span className="flex items-center gap-2 opacity-75">
          <AvatarIcon className="h-6 w-6" />
          <span>
            {author.firstName} {author.lastName}
          </span>
        </span>
        {!!description && (
          <p className="block overflow-hidden text-ellipsis">{description}</p>
        )}
        <Ratings
          ratings={ratings}
          competitionId={competitionId}
          entryId={id}
          isCompetitionActive={isActive}
        />
      </div>
    </div>
  );
}

interface RatingsProps {
  ratings: Pick<Rating, "type" | "value">[];
  competitionId: string;
  entryId: string;
  isCompetitionActive: boolean;
}

function Ratings({
  ratings,
  competitionId,
  entryId,
  isCompetitionActive,
}: RatingsProps) {
  const utils = api.useContext();

  const { mutate: addRating } = api.rating.addNew.useMutation({
    onMutate: async (rating) => {
      await utils.entry.getAllWithRatingsByCompetitionId.cancel({
        id: competitionId,
      });

      const previousEntries =
        utils.entry.getAllWithRatingsByCompetitionId.getData({
          id: competitionId,
        });

      if (!previousEntries) return;

      const previousEntry = previousEntries.find(
        (entry) => entry.id === entryId,
      );
      if (!previousEntry) return;

      const newRatings = (["TASTE", "APPEARANCE", "NUTRITION"] as const).map(
        (type) => {
          if (type === rating.type) return rating;
          const previousRating = previousEntry.ratings.find(
            (r) => r.type === type,
          );
          if (previousRating) return previousRating;
          return { type, value: 1 };
        },
      );

      const newEntries = previousEntries.map((entry) => {
        if (entry.id !== entryId) return entry;
        return {
          ...entry,
          ratings: newRatings,
        };
      });
      console.log({ newRatings });

      utils.entry.getAllWithRatingsByCompetitionId.setData(
        { id: competitionId },
        newEntries,
      );

      return { previousEntries };
    },
    onError: (_, __, context) => {
      toast.error("Błąd serwera, spróbuj ponownie");

      if (!context?.previousEntries) return;
      utils.entry.getAllWithRatingsByCompetitionId.setData(
        { id: competitionId },
        context?.previousEntries,
      );
    },
    onSettled: () => {
      void Promise.allSettled([
        utils.entry.getAllWithRatingsByCompetitionId.invalidate({
          id: competitionId,
        }),
        utils.rating.getRankingByCompetitionId.invalidate({
          id: competitionId,
        }),
      ]);
    },
  });

  const handleRatingChange = (
    type: "TASTE" | "APPEARANCE" | "NUTRITION",
    e: ChangeEvent<HTMLInputElement>,
  ) => {
    const value = parseInt(e.target.value);
    addRating({ entryId, type, value });
  };

  const shouldBeChecked = (
    type: "TASTE" | "APPEARANCE" | "NUTRITION",
    value: number,
  ) => {
    return !!ratings.find(
      (rating) => rating.type === type && rating.value === value,
    );
  };

  const numberRangeTo = (number: number) =>
    [...Array(number).keys()].map((value) => value + 1);

  return (
    <div className="card-actions mt-4 flex-col items-stretch justify-around gap-4 md:flex-row">
      <div
        className={cn(
          "flex flex-1 flex-col items-center rounded-xl bg-base-300 px-4 py-2 text-center text-secondary",
          { "brightness-75": !isCompetitionActive },
        )}
      >
        <span className="font-semibold">Smak</span>
        <div
          className="rating"
          onChange={
            isCompetitionActive
              ? (e) =>
                  handleRatingChange(
                    "TASTE",
                    e as ChangeEvent<HTMLInputElement>,
                  )
              : () => undefined
          }
        >
          {numberRangeTo(MAX_POINTS_TASTE).map((value) => (
            <input
              key={value}
              disabled={!isCompetitionActive}
              type="radio"
              name={`${entryId}-TASTE`}
              value={value}
              checked={shouldBeChecked("TASTE", value)}
              readOnly
              className={cn("mask mask-star bg-secondary brightness-50", {
                "cursor-not-allowed": !isCompetitionActive,
              })}
            />
          ))}
        </div>
      </div>
      <div
        className={cn(
          "flex flex-1 flex-col items-center rounded-xl bg-base-300 px-4 py-2 text-center text-accent",
          { "brightness-75": !isCompetitionActive },
        )}
      >
        <span className="font-semibold">Wygląd</span>
        <div
          className="rating"
          onChange={
            isCompetitionActive
              ? (e) =>
                  handleRatingChange(
                    "APPEARANCE",
                    e as ChangeEvent<HTMLInputElement>,
                  )
              : () => undefined
          }
        >
          {numberRangeTo(MAX_POINTS_APPEARANCE).map((value) => (
            <input
              key={value}
              disabled={!isCompetitionActive}
              type="radio"
              name={`${entryId}-APPEARANCE`}
              value={value}
              checked={shouldBeChecked("APPEARANCE", value)}
              readOnly
              className={cn("mask mask-star bg-accent brightness-50", {
                "cursor-not-allowed": !isCompetitionActive,
              })}
            />
          ))}
        </div>
      </div>
      <div
        className={cn(
          "flex flex-1 flex-col items-center rounded-xl bg-base-300 px-4 py-2 text-center text-primary",
          { "brightness-75": !isCompetitionActive },
        )}
      >
        <span className="font-semibold">Odżywczość</span>
        <div
          className="rating"
          onChange={
            isCompetitionActive
              ? (e) =>
                  handleRatingChange(
                    "NUTRITION",
                    e as ChangeEvent<HTMLInputElement>,
                  )
              : () => undefined
          }
        >
          {numberRangeTo(MAX_POINTS_NUTRITION).map((value) => (
            <input
              key={value}
              disabled={!isCompetitionActive}
              type="radio"
              name={`${entryId}-NUTRITION`}
              value={value}
              checked={shouldBeChecked("NUTRITION", value)}
              readOnly
              className={cn("mask mask-star bg-primary brightness-50", {
                "cursor-not-allowed": !isCompetitionActive,
              })}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function EntryWithoutRatings({
  author,
  title,
  description,
  imageUrl,
}: EntryWithoutRatingsProps) {
  return (
    <div className="card card-bordered w-[80vw] border-8 border-base-200 bg-base-200 bg-opacity-30 sm:w-[28rem] md:w-[36rem]">
      {/* TODO: pick correct width and height */}
      <figure className="rounded-t-lg">
        <EntryImageDialog imageUrl={imageUrl} title={title}>
          <Image src={imageUrl} alt={title} width={700} height={700} />
        </EntryImageDialog>
      </figure>
      <div className="card-body">
        <h2 className="card-title block overflow-hidden text-ellipsis">
          {title}
        </h2>
        <span className="flex items-center gap-2 opacity-75">
          <AvatarIcon className="h-6 w-6" />
          <span>
            {author.firstName} {author.lastName}
          </span>
        </span>
        {!!description && (
          <p className="block overflow-hidden text-ellipsis">{description}</p>
        )}
      </div>
    </div>
  );
}

interface EntryImageDialogProps extends PropsWithChildren {
  imageUrl: string;
  title: string;
}

function EntryImageDialog({
  imageUrl,
  title,
  children,
}: EntryImageDialogProps) {
  return (
    <Dialog.Root>
      <Dialog.Trigger>{children}</Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-80 [animation:overlayShow_600ms_cubic-bezier(0.16,1,0.3,1)]" />
        <Dialog.Content
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-black bg-opacity-25 [animation:contentShow_400ms_cubic-bezier(0.16,1,0.3,1)]"
        >
          <Image
            src={imageUrl}
            alt={title}
            width={2000}
            height={2000}
            className="max-h-[95vh] w-auto max-w-[95vw]"
          />
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

const useSetAndResetCompetitonIdAtom = (id: string) => {
  const setCompetitionId = useSetAtom(competitionIdAtom);

  useEffect(() => {
    setCompetitionId(id);
    return () => setCompetitionId(null);
  }, [id, setCompetitionId]);
};
