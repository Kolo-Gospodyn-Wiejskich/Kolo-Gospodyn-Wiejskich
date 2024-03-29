import type { Rating, User } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { ratingSchema } from "~/utils/schemas";
import { toPlacementPoints } from "~/utils/placements";

export const ratingRouter = createTRPCRouter({
  getGlobalRanking: publicProcedure.query(async ({ ctx }) => {
    const competitions = await ctx.prisma.competiton.findMany({
      select: {
        entries: {
          select: {
            author: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            ratings: {
              select: {
                value: true,
              },
            },
          },
        },
      },
    });

    return toGlobalRanking(competitions);
  }),

  getRankingByCompetitionId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const competition = await ctx.prisma.competiton.findUnique({
        where: {
          id: input.id,
        },
        select: {
          startsAt: true,
          endsAt: true,
        },
      });

      if (!competition) throw new TRPCError({ code: "NOT_FOUND" });

      if (competition.startsAt > new Date()) return [];

      const [ratings, entryAuthors] = await Promise.allSettled([
        ctx.prisma.rating.findMany({
          where: {
            entry: {
              competitionId: input.id,
            },
          },
          select: {
            entry: {
              select: {
                author: { select: { firstName: true, lastName: true } },
              },
            },
            value: true,
          },
        }),
        ctx.prisma.entry.findMany({
          where: {
            competitionId: input.id,
          },
          select: {
            author: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
          },
        }),
      ]);

      if (ratings.status === "rejected" || entryAuthors.status === "rejected")
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Databaase error",
        });

      const flattenedEntryAuthors = entryAuthors.value.map(({ author }) => ({
        ...author,
      }));

      return toRankingArray(ratings.value, flattenedEntryAuthors);
    }),
  addNew: protectedProcedure
    .input(ratingSchema)
    .mutation(async ({ input, ctx }) => {
      const existingRatings = await ctx.prisma.rating.findMany({
        where: {
          entryId: input.entryId,
          authorId: ctx.session.user.id,
        },
        select: {
          id: true,
          type: true,
          value: true,
        },
      });

      const sameTypeRating = existingRatings.find(
        ({ type }) => type === input.type,
      );

      if (sameTypeRating) {
        await ctx.prisma.rating.update({
          where: {
            id: sameTypeRating.id,
          },
          data: {
            ...input,
            authorId: ctx.session.user.id,
          },
        });

        return { status: "ok" } as const;
      }

      const ratingTypesToCreate = (
        ["TASTE", "APPEARANCE", "NUTRITION"] as const
      ).filter((typeToCreate) => {
        const rating = existingRatings.find(
          ({ type }) => type === typeToCreate,
        );
        return !rating;
      });

      await ctx.prisma.rating.createMany({
        data: ratingTypesToCreate.map((typeToCreate) => ({
          type: typeToCreate,
          value: input.type === typeToCreate ? input.value : 1,
          entryId: input.entryId,
          authorId: ctx.session.user.id,
        })),
      });

      return { status: "ok" } as const;
    }),
});

type EntryAuthorsForRanking = Pick<User, "firstName" | "lastName">[];

type RatingsForRanking = Pick<Rating, "value"> & {
  entry: { author: Pick<User, "firstName" | "lastName"> };
};

const toRankingArray = (
  ratings: RatingsForRanking[],
  entryAuthors: EntryAuthorsForRanking,
) => {
  const resultMap = new Map<string, number>(
    entryAuthors.map(({ firstName, lastName }) => {
      const fullName = `${firstName} ${lastName}`;
      return [fullName, 0];
    }),
  );

  for (const rating of ratings) {
    const fullName = `${rating.entry.author.firstName} ${rating.entry.author.lastName}`;
    const curentPoints = resultMap.get(fullName);
    resultMap.set(
      fullName,
      curentPoints ? curentPoints + rating.value : rating.value,
    );
  }

  const rankingArray = Array.from(resultMap, ([name, value]) => ({
    name,
    value,
  })).sort((a, b) => b.value - a.value);

  const placementPoints = toPlacementPoints(rankingArray);

  return rankingArray.map(({ name, value }) => {
    const userPoints = placementPoints.find((p) => p.fullNames.includes(name));

    return {
      name,
      value,
      globalPointsEearned: userPoints?.points ?? 0,
    };
  });
};

type CompetitionsForGlobalRanking = {
  entries: {
    ratings: Pick<Rating, "value">[];
    author: Pick<User, "firstName" | "lastName">;
  }[];
}[];

const toGlobalRanking = (competitions: CompetitionsForGlobalRanking) => {
  const participants = [
    ...new Set(
      competitions
        .map(({ entries }) =>
          entries.map(({ author }) => {
            const fullName = `${author.firstName} ${author.lastName}`;
            return fullName;
          }),
        )
        .flat(),
    ),
  ];

  const resultMap = new Map<string, number>(
    participants.map((fullName) => [fullName, 0]),
  );

  for (const competition of competitions) {
    const competitionParticipants = competition.entries.map(({ author }) => {
      const fullName = `${author.firstName} ${author.lastName}`;
      return fullName;
    });

    const competitionMap = new Map<string, number>(
      competitionParticipants.map((fullName) => [fullName, 0]),
    );

    for (const { author, ratings } of competition.entries) {
      for (const { value } of ratings) {
        const fullName = `${author.firstName} ${author.lastName}`;
        const curentPoints = competitionMap.get(fullName);
        competitionMap.set(
          fullName,
          curentPoints ? curentPoints + value : value,
        );
      }
    }

    const competitionArray = Array.from(competitionMap, ([name, value]) => ({
      name,
      value,
    })).sort((a, b) => b.value - a.value);

    const placementPoints = toPlacementPoints(competitionArray);

    for (const { points, fullNames } of placementPoints) {
      for (const fullName of fullNames) {
        const curentPoints = resultMap.get(fullName);
        resultMap.set(fullName, curentPoints ? curentPoints + points : points);
      }
    }
  }

  return Array.from(resultMap, ([name, value]) => ({ name, value })).sort(
    (a, b) => b.value - a.value,
  );
};
