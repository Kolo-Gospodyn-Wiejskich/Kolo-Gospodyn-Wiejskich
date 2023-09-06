import Head from "next/head";
import { type PropsWithChildren } from "react";

interface LayoutProps extends PropsWithChildren {
  title: string;
  description: string;
}

export default function Layout({ title, description, children }: LayoutProps) {
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
      <main className=" flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-[#2e026d] to-[#15162c]">
        <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16 ">
          {children}
        </div>
      </main>
    </>
  );
}
