import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import { useEffect } from "react";

export const useProtectedPage = () => {
  const router = useRouter();
  const { status } = useSession();

  const isUnauthed = status === "unauthenticated";

  useEffect(() => {
    if (isUnauthed) void router.push("/auth/login");
  }, [router, isUnauthed]);

  return { isUnauthed };
};
