import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { ratingSchema } from "~/utils/schemas";

export const ratingRouter = createTRPCRouter({
  addNew: protectedProcedure.input(ratingSchema).mutation(({ input, ctx }) => {
    return ctx.prisma.rating.create({
      data: {
        ...input,
        authorId: ctx.session.user.id,
      },
    });
  }),
});
