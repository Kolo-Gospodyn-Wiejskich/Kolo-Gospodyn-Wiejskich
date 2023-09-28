import { TRPCError } from "@trpc/server";
import { hash } from "bcryptjs";
import { z } from "zod";
import { env } from "~/env.mjs";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { signUpSchema } from "~/utils/schemas";

export const userRouter = createTRPCRouter({
  checkSecretCode: publicProcedure
    .input(z.object({ secretCode: z.string().min(1) }))
    .mutation(({ input }) => {
      if (input.secretCode !== env.SECRET_CODE)
        throw new TRPCError({
          message: "Niepoprawny kod",
          code: "FORBIDDEN",
        });

      return { status: "ok" } as const;
    }),
  signUp: publicProcedure
    .input(signUpSchema)
    .mutation(async ({ input, ctx }) => {
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
          message: "Użytkownik już istnieje",
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
