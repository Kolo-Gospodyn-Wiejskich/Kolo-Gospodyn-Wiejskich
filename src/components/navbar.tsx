import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import {
  ExitIcon,
  EnterIcon,
  PersonIcon,
  PlusIcon,
  StarIcon,
} from "@radix-ui/react-icons";
import { AddEntryButton } from "./addEntryButton";

export function Navbar() {
  const { status: sessionStatus } = useSession();

  return (
    <nav className="navbar flex-col gap-2 lg:flex-row">
      <div className="flex-1">
        <Link href={"/"} className="btn btn-ghost text-2xl normal-case">
          <span className="text-primary">Koło</span>{" "}
          <span className="text-secondary">Gospodyń</span>{" "}
          <span className="text-accent">Wiejskich</span>
        </Link>
      </div>
      <div className="flex flex-col gap-2 lg:flex-row lg:gap-4">
        {sessionStatus === "authenticated" && (
          <>
            <AddEntryButton type="nav" />
            <Link
              href={"/add-competition"}
              role="button"
              className="btn btn-ghost"
            >
              <PlusIcon />
              Dodaj konkurencję
            </Link>
            <Ranking />
            <button className="btn btn-ghost" onClick={() => void signOut()}>
              <ExitIcon />
              Wyloguj
            </button>
          </>
        )}
        {sessionStatus === "unauthenticated" && (
          <>
            <Ranking />
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

function Ranking() {
  return (
    <Link href={"/ranking"} role="button" className="btn btn-ghost">
      <StarIcon />
      Ranking
    </Link>
  );
}
