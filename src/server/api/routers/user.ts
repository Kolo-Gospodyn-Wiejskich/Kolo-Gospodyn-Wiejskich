import { TRPCError } from "@trpc/server";
import { hash } from "bcryptjs";
import { env } from "~/env.mjs";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { signUpSchema } from "~/utils/schemas";

export const userRouter = createTRPCRouter({
  signUp: publicProcedure
    .input(signUpSchema)
    .mutation(async ({ input, ctx }) => {
      if (input.secretCode !== env.SECRET_CODE)
        throw new TRPCError({
          message: "Wrong code",
          code: "FORBIDDEN",
        });

      const existingUser = await ctx.prisma.user.findUnique({
        where: {
          firstName_lastName: {
            firstName: input.firstName,
            lastName: input.lastName,
          },
        },
      });

      if (existingUser)
        throw new TRPCError({
          message: "User already exists",
          code: "CONFLICT",
        });

      const hashedPassword = await hash(input.password, 12);

      const newUser = await ctx.prisma.user.create({
        data: {
          firstName: input.firstName,
          lastName: input.lastName,
          password: hashedPassword,
        },
      });

      return newUser;
    }),
});
