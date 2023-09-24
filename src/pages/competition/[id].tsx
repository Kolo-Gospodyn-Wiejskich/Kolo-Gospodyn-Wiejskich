import { createServerSideHelpers } from "@trpc/react-query/server";
import { format } from "date-fns";
import { pl } from "date-fns/locale";
import {
  type GetStaticPaths,
  type GetStaticPropsContext,
  type InferGetStaticPropsType,
} from "next";
import superjson from "superjson";
import { type LayoutProps } from "~/components/layout";
import { appRouter } from "~/server/api/root";
import { prisma } from "~/server/db";
import { api } from "~/utils/api";

export async function getStaticProps(
  context: GetStaticPropsContext<{ id: string }>,
) {
  const helpers = createServerSideHelpers({
    router: appRouter,
    ctx: { prisma, session: null },
    transformer: superjson,
  });

  // cast as unknown to make ts-config happy
  const id = context.params?.id as unknown as string;

  const competition = await helpers.competition.getById.fetch({
    id,
  });

  return {
    props: {
      trpcState: helpers.dehydrate(),
      id,
      layout: {
        title: competition ? competition.name : "Konkurencja",
        description: `Konkurencja${
          competition ? ` ${competition.name}` : ""
        } Koła Gospodyń Wiejskich`,
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
  const {
    data: competition,
    isLoading,
    error,
  } = api.competition.getById.useQuery({ id });

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
    </div>
  );
}
