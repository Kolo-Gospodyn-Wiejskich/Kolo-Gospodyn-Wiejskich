import { type LayoutProps } from "~/components/layout";
import { api } from "~/utils/api";
import { toPlacements } from "~/utils/placements";
import { cn } from "~/utils/tailwind-merge";

export function getStaticProps() {
  return {
    props: {
      layout: {
        title: "Ranking",
        description: "Ranking członków Koła Gospodyń Wiejskich",
      } satisfies LayoutProps,
    },
  };
}

export default function RankingPage() {
  return (
    <div className="container flex h-full flex-col items-center justify-center gap-6">
      <div className="w-[80vw] max-w-3xl">
        <GlobalRanking />
      </div>
    </div>
  );
}

function GlobalRanking() {
  const { data, isLoading, error } = api.rating.getGlobalRanking.useQuery();

  if (isLoading)
    return (
      <span className="loading loading-dots mx-auto mt-6 block w-12 text-center text-primary" />
    );

  if (error)
    return (
      <div className="alert alert-error max-w-fit text-4xl">
        Error: {error.message}
      </div>
    );

  const placements = toPlacements(data);
  const getPlaceByFullName = (fullName: string) =>
    placements.find((placement) => placement.fullNames.includes(fullName))!
      .placeIndex;

  // TODO: HANDLE OVERFLOW Y
  return (
    <div className="mt-6 space-y-6">
      <h1 className="text-5xl font-bold text-primary">Ranking</h1>
      <table className="table">
        <thead className="text-lg">
          <tr>
            <th>Miejsce</th>
            <th>Uczestnik</th>
            <th>Punkty</th>
          </tr>
        </thead>
        <tbody className="text-xl">
          {data.map(({ name, value }) => (
            <tr
              key={name}
              className={cn({
                "font-semibold": getPlaceByFullName(name) < 3,
                "bg-amber-400 bg-opacity-10": getPlaceByFullName(name) === 0,
                "bg-slate-400 bg-opacity-10": getPlaceByFullName(name) === 1,
                "bg-amber-700 bg-opacity-10": getPlaceByFullName(name) === 2,
              })}
            >
              <td>{getPlaceByFullName(name) + 1}</td>
              <td
                className={cn({
                  "underline decoration-4 underline-offset-2":
                    getPlaceByFullName(name) < 3,
                  "decoration-amber-400": getPlaceByFullName(name) === 0,
                  "decoration-slate-400": getPlaceByFullName(name) === 1,
                  "decoration-amber-700": getPlaceByFullName(name) === 2,
                })}
              >
                {name}
              </td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
