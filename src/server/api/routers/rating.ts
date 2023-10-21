import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { ratingSchema } from "~/utils/schemas";

export const ratingRouter = createTRPCRouter({
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
