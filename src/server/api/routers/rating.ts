import type { Rating, User } from "@prisma/client";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { ratingSchema } from "~/utils/schemas";

export const ratingRouter = createTRPCRouter({
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

      // TODO: fix
      if (true) {
        //(competition.endsAt > new Date()) {
        const ratings = await ctx.prisma.rating.findMany({
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
        });

        const entryAuthors = (
          await ctx.prisma.entry.findMany({
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
          })
        ).map(({ author }) => ({ ...author }));

        return toRankingArray(ratings, entryAuthors);
      }

      // FIXME: handle past competitions
      return [];
    }),
  addNew: protectedProcedure
    .input(ratingSchema)
    .mutation(async ({ input, ctx }) => {
      const existingRating = await ctx.prisma.rating.findFirst({
        where: {
          entryId: input.entryId,
          type: input.type,
          authorId: ctx.session.user.id,
        },
        select: {
          id: true,
        },
      });

      if (existingRating) {
        await ctx.prisma.rating.update({
          where: {
            id: existingRating.id,
          },
          data: {
            ...input,
            authorId: ctx.session.user.id,
          },
        });
      } else {
        await ctx.prisma.rating.create({
          data: {
            ...input,
            authorId: ctx.session.user.id,
          },
        });
      }

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
  const resultMap = new Map<string, number>();

  for (const author of entryAuthors) {
    const fullName = `${author.firstName} ${author.lastName}`;
    resultMap.set(fullName, 0);
  }

  for (const rating of ratings) {
    const fullName = `${rating.entry.author.firstName} ${rating.entry.author.lastName}`;
    const curentPoints = resultMap.get(fullName);
    resultMap.set(
      fullName,
      curentPoints ? curentPoints + rating.value : rating.value,
    );
  }

  return Array.from(resultMap, ([name, value]) => ({ name, value })).sort(
    (a, b) => b.value - a.value,
  );
};
