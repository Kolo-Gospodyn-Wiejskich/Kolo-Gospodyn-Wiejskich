import { signOut, useSession } from "next-auth/react";
import Link from "next/link";

import { ExitIcon, EnterIcon, PersonIcon } from "@radix-ui/react-icons";

export function Navbar() {
  const { status: sessionStatus } = useSession();

  return (
    <nav className="navbar">
      <div className="flex-1">
        <Link href={"/"} className="btn btn-ghost text-2xl normal-case">
          <span className="text-primary">Koło</span>{" "}
          <span className="text-secondary">Gospodyń</span>{" "}
          <span className="text-accent">Wiejskich</span>
        </Link>
      </div>
      <div className="flex gap-4">
        {sessionStatus === "authenticated" && (
          <button className="btn btn-ghost" onClick={() => void signOut()}>
            <ExitIcon />
            Wyloguj
          </button>
        )}
        {sessionStatus === "unauthenticated" && (
          <>
            <Link href={"/auth/signup"} role="button" className="btn btn-ghost">
              <PersonIcon />
              Rejestracja
            </Link>
            <Link href={"/auth/login"} className="btn btn-ghost">
              <EnterIcon />
              Logowanie
            </Link>
          </>
        )}
      </div>
    </nav>
  );
}
