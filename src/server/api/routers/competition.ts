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
  getAllTakenDateRanges: publicProcedure.query(async ({ ctx }) => {
    const takenDateRanges = await ctx.prisma.competiton.findMany({
      // only get those not in the past, since those are already taken
      where: {
        endsAt: {
          gt: new Date(),
        },
      },
      select: {
        startsAt: true,
        endsAt: true,
      },
      // prioritize those closer to current date
      orderBy: {
        startsAt: "asc",
      },
      take: 100,
    });

    // change object shape to fit react-day-picker
    return takenDateRanges.map(({ startsAt, endsAt }) => ({
      from: startsAt,
      to: endsAt,
    }));
  }),
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const competition = await ctx.prisma.competiton.findUnique({
        where: {
          id: input.id,
        },
      });

      if (!competition)
        throw new TRPCError({
          message: "Konkurencja nie istnieje",
          code: "NOT_FOUND",
        });

      return competition;
    }),
  addNew: protectedProcedure
    .input(competitionSchema)
    .mutation(async ({ input, ctx }) => {
      if (input.startsAt <= new Date())
        throw new TRPCError({
          message: "Konkurencja nie może zaczynać się w przeszłości",
          code: "BAD_REQUEST",
        });

      if (input.startsAt >= input.endsAt)
        throw new TRPCError({
          message: "Konkurencja musi zaczynać się przed jej końcem",
          code: "BAD_REQUEST",
        });

      const conflicting = await ctx.prisma.competiton.findFirst({
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

      if (conflicting)
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
