import { type LayoutProps } from "~/components/layout";

export function getServerSideProps() {
  return {
    props: {
      layout: {
        title: "Koło Gospodyń Wiejskich",
        description: "Witaj na stronie Koła Gospodyń Wiejskich",
        centeredVertically: false,
      } satisfies LayoutProps,
    },
  };
}

export default function Home() {
  return (
    <div className="container flex h-full flex-col items-center justify-center gap-6">
      <h1 className="text-5xl font-extrabold sm:text-[5rem]">
        <span className="text-primary">Koło</span>{" "}
        <span className="text-secondary">Gospodyń</span>{" "}
        <span className="text-accent">Wiejskich</span>
      </h1>
      <div className="flex flex-col items-center gap-2">
        <p className="text-2xl">WORK IN PROGRESS</p>
      </div>
    </div>
  );
}
