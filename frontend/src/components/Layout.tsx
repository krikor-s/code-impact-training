import type { ReactNode } from "react";

const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? "";

function handleSignOut() {
  localStorage.removeItem("token");
  localStorage.removeItem("displayName");
  localStorage.removeItem("profilePicture");
  window.location.href = "/login";
}

const NAV_ITEMS = [
  { href: "/", label: "Dashboard" },
  { href: "/calendar", label: "Calendar" },
  { href: "/tasks", label: "Tasks" },
  { href: "/reminders", label: "Reminders" },
  { href: "/profile", label: "Profile" },
];

export default function Layout({ children, fillHeight = false }: { children: ReactNode; fillHeight?: boolean }) {
  const displayName = localStorage.getItem("displayName");
  const profilePicture = localStorage.getItem("profilePicture");
  const pictureUrl = profilePicture ? `${BASE_URL}${profilePicture}` : null;
  const path = window.location.pathname;

  return (
    <div className="h-screen bg-ocean flex overflow-hidden">
      <nav className="w-52 shrink-0 glass flex flex-col p-4 m-4 mr-0 rounded-xl">
        <a href="/" className="text-2xl font-bold text-white mb-6 px-2 tracking-tight">Orbit</a>
        <div className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className={`text-sm px-3 py-2 rounded-lg transition-colors duration-150 ${
                path === item.href
                  ? "bg-white/20 text-white font-medium"
                  : "text-white/60 hover:bg-white/10 hover:text-white"
              }`}
            >
              {item.label}
            </a>
          ))}
        </div>
        <div className="mt-auto pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 px-2 mb-3">
            {pictureUrl ? (
              <a href="/profile">
                <img
                  src={pictureUrl}
                  alt="Profile"
                  className="w-7 h-7 rounded-full object-cover border border-white/30"
                />
              </a>
            ) : displayName ? (
              <a
                href="/profile"
                className="w-7 h-7 rounded-full bg-white/15 flex items-center justify-center text-white/60 text-xs font-bold"
              >
                {displayName.charAt(0).toUpperCase()}
              </a>
            ) : null}
            {displayName && (
              <a href="/profile" className="text-xs text-white/50 hover:text-white truncate">
                {displayName}
              </a>
            )}
          </div>
          <button
            onClick={handleSignOut}
            className="w-full text-left text-sm text-white/50 px-3 py-2 rounded-lg hover:bg-white/10 hover:text-white transition-colors duration-150"
          >
            Sign out
          </button>
        </div>
      </nav>
      <div className={`flex-1 flex flex-col p-8 min-h-0 ${fillHeight ? "overflow-hidden" : "overflow-y-auto"}`}>
        {children}
      </div>
    </div>
  );
}
