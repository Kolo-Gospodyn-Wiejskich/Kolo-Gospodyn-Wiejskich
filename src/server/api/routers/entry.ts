import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { entrySchema } from "~/utils/schemas";

export const entryRouter = createTRPCRouter({
  getAllForUnauthedByCompetitionId: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => {
      return ctx.prisma.entry.findMany({
        where: {
          competitionId: input.id,
        },
        include: {
          author: true,
        },
        take: 100,
      });
    }),
  getAllWithRatingsByCompetitionId: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(({ input, ctx }) => {
      return ctx.prisma.entry.findMany({
        where: {
          competitionId: input.id,
        },
        include: {
          ratings: {
            where: {
              authorId: ctx.session.user.id,
            },
            select: {
              type: true,
              value: true,
            },
          },
          author: true,
        },
        take: 100,
      });
    }),
  addNew: protectedProcedure
    .input(entrySchema)
    .mutation(async ({ input, ctx }) => {
      // TODO: maybe use query
      const activeCompetition = await ctx.prisma.competiton.findFirst({
        where: {
          startsAt: {
            lte: new Date(),
          },
          endsAt: {
            gte: new Date(),
          },
        },
      });

      if (!activeCompetition)
        throw new TRPCError({
          message: "Brak aktywnej konkurencji",
          code: "BAD_REQUEST",
        });

      await ctx.prisma.entry.create({
        data: {
          ...input,
          competitionId: activeCompetition.id,
          authorId: ctx.session.user.id,
        },
      });

      return { competitionId: activeCompetition.id };
    }),
});
