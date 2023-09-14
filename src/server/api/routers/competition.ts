import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  createTRPCRouter,
  protectedProcedure,
  publicProcedure,
} from "~/server/api/trpc";
import { competitionSchema } from "~/utils/schemas";

export const competitionRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.prisma.competiton.findMany({
      select: {
        id: true,
        name: true,
      },
      take: 100,
    });
  }),
  getDetailsById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      return ctx.prisma.competiton.findUnique({
        where: {
          id: input.id,
        },
      });
    }),
  addNew: protectedProcedure
    .input(competitionSchema)
    .mutation(async ({ input, ctx }) => {
      const conflictingCompetition = await ctx.prisma.competiton.findFirst({
        where: {
          OR: [
            {
              endsAt: {
                lte: input.endsAt,
                gte: input.startsAt,
              },
            },
            {
              startsAt: {
                lte: input.endsAt,
                gte: input.startsAt,
              },
            },
            {
              startsAt: {
                lte: input.startsAt,
              },
              endsAt: {
                gte: input.endsAt,
              },
            },
          ],
        },
      });

      if (conflictingCompetition)
        throw new TRPCError({
          message: "Istnieje już konkurencja w tym przedziale czasowym",
          code: "CONFLICT",
        });

      const { id } = await ctx.prisma.competiton.create({
        data: input,
        select: { id: true },
      });

      return { id };
    }),
});
