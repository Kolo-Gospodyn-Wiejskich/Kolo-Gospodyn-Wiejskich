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
          },
        },
      });
    }),
  addNew: protectedProcedure.input(entrySchema).mutation(({ input, ctx }) => {
    return ctx.prisma.entry.create({
      data: {
        ...input,
        authorId: ctx.session.user.id,
      },
    });
  }),
});
