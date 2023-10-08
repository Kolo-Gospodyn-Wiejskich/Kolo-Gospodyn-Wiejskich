import { useRouter } from "next/router";
import { type LayoutProps } from "~/components/layout";
import { api } from "~/utils/api";
import { useProtectedPage } from "~/utils/useProtectedPage";

export function getStaticProps() {
  return {
    props: {
      layout: {
        title: "Dodaj wypiek",
        description:
          "Dodaj wypiek do obecnej konkurencji Koła Gospodyń Wiejskich",
        centeredVertically: false,
      } satisfies LayoutProps,
    },
  };
}

export default function AddEntryPage() {
  const router = useRouter();
  const utils = api.useContext();

  const {
    data: activeCompetition,
    isLoading,
    error,
  } = api.competition.getActive.useQuery();

  const { mutate: addNewEntry } = api.entry.addNew.useMutation({
    onSuccess: async ({ competitionId }) => {
      await router.push(`/competition/${competitionId}`);
      await Promise.allSettled([
        utils.entry.getAllWithRatingsByCompetitionId.invalidate({
          id: competitionId,
        }),
        utils.entry.getAllForUnauthedByCompetitionId.invalidate({
          id: competitionId,
        }),
      ]);
    },
  });

  const { isUnauthed } = useProtectedPage();
  if (isUnauthed) return null;

  if (error)
    return (
      <div className="alert alert-error max-w-fit text-4xl">
        Error fetching active competition: {error.message}
      </div>
    );

  return <div></div>;
}
