import { useEffect } from "react";
import { Outlet, useLocation } from "react-router";
import { Navigation } from "./Navigation";

export function Layout() {
  const { pathname } = useLocation();

  // Reset scroll to the top when navigating to any route other than the
  // homepage. React Router v7 keeps the previous scroll position on
  // client-side navigation, which otherwise lands long pages (e.g. the
  // UX/UI case study, reached from far down the homepage) scrolled down.
  // The homepage is excluded so its intentional scroll restoration
  // (useScrollRestoration) is preserved.
  useEffect(() => {
    if (pathname !== "/") {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname]);

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <main>
        <Outlet />
      </main>
    </div>
  );
}
