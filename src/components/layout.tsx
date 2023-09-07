import Head from "next/head";
import { type PropsWithChildren } from "react";
import { Navbar } from "./navbar";
import { cn } from "~/utils/tailwind-merge";

export interface LayoutProps extends PropsWithChildren {
  title: string;
  description: string;
  centeredVertically: boolean;
}

export default function Layout({
  title,
  description,
  centeredVertically = true,
  children,
}: LayoutProps) {
  // const theme = useTheme();
  const theme = "customLight";
  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content={description} />
        <link
          rel="icon"
          href="/favicon-light.png"
          type="image/x-icon"
          media="(prefers-color-scheme: light)"
        />
        <link
          rel="icon"
          href="/favicon-dark.png"
          type="image/x-icon"
          media="(prefers-color-scheme: dark)"
        />
      </Head>
      <main data-theme={theme} className="flex min-h-screen flex-col gap-6 p-6">
        <Navbar />
        <div
          className={cn("flex flex-1 justify-center px-6", {
            "items-center": centeredVertically,
          })}
        >
          {children}
        </div>
      </main>
    </>
  );
}

// const useTheme = () => {
//   const [theme, setTheme] = useState<"customDark" | "customLight">(
//     "customDark",
//   );

//   useLayoutEffect(() => {
//     if (
//       window.matchMedia &&
//       window.matchMedia("(prefers-color-scheme: light)").matches
//     ) {
//       setTheme("customLight");
//     }

//     window
//       .matchMedia("(prefers-color-scheme: light)")
//       .addEventListener("change", (e) => {
//         const newTheme = e.matches ? "customLight" : "customDark";
//         setTheme(newTheme);
//       });
//   }, []);

//   return theme;
// };
