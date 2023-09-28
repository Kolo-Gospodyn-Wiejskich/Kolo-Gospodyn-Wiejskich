import { CookieIcon } from "@radix-ui/react-icons";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { api } from "~/utils/api";
import { cn } from "~/utils/tailwind-merge";

export function AddEntryButton({ type }: { type: "nav" | "page" }) {
  const canUserAddEntry = useCanUserAddEntry();

  if (!canUserAddEntry) return null;

  return (
    <Link
      href={"/add-entry"}
      role="button"
      className={cn("btn", {
        "btn-ghost": type === "nav",
        "btn-secondary btn-wide": type === "page",
      })}
    >
      <CookieIcon />
      Dodaj wypiek
    </Link>
  );
}

const useCanUserAddEntry = () => {
  const { data: sessionData, status: sessionStatus } = useSession();

  const { data: activeCompetion } = api.competition.getActive.useQuery();
  const { data: activeCompetitionEntries } =
    api.entry.getAllForUnauthedByCompetitionId.useQuery(
      // cast to unknown first to make ts happy
      { id: activeCompetion?.competition?.id as unknown as string },
      { enabled: !!activeCompetion?.competition?.id },
    );

  if (
    sessionStatus !== "authenticated" ||
    !activeCompetion ||
    !activeCompetitionEntries ||
    !activeCompetion.isActive
  )
    return false;

  const userEntry = activeCompetitionEntries.find(
    ({ authorId }) => authorId === sessionData?.user.id,
  );

  return !userEntry;
};
