import { createTRPCRouter } from "~/server/api/trpc";
import { userRouter } from "./routers/user";
import { competitionRouter } from "./routers/competition";
import { entryRouter } from "./routers/entry";
import { ratingRouter } from "./routers/rating";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  user: userRouter,
  competition: competitionRouter,
  entry: entryRouter,
  rating: ratingRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;
