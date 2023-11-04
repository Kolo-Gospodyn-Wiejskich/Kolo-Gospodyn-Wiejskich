import { type LayoutProps } from "~/components/layout";
import { api } from "~/utils/api";

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
      <div className="w-[80vw] sm:w-96">
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

  // TODO: HANDLE OVERFLOW Y
  return (
    <div className="mt-6 space-y-6">
      <h1 className="text-5xl font-bold text-primary">Ranking</h1>
      <table className="table table-pin-cols static h-44">
        <thead>
          <tr>
            <th>Miejsce</th>
            <th>Uczestnik</th>
            <th>Punkty</th>
          </tr>
        </thead>
        <tbody>
          {data.map(({ name, value }, index) => (
            <tr key={name}>
              <td>{index + 1}</td>
              <td>{name}</td>
              <td>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
