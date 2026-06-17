import type { ReactNode } from "react";

const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? "";

function handleSignOut() {
  localStorage.removeItem("token");
  localStorage.removeItem("displayName");
  localStorage.removeItem("profilePicture");
  window.location.href = "/login";
}

export default function Layout({ children }: { children: ReactNode }) {
  const displayName = localStorage.getItem("displayName");
  const profilePicture = localStorage.getItem("profilePicture");
  const pictureUrl = profilePicture ? `${BASE_URL}${profilePicture}` : null;

  return (
    <div className="min-h-screen bg-ocean flex flex-col p-8">
      <div className="w-full flex justify-end items-center gap-3 mb-4">
        {pictureUrl ? (
          <a href="/profile">
            <img
              src={pictureUrl}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border border-white/30"
            />
          </a>
        ) : displayName ? (
          <a
            href="/profile"
            className="w-8 h-8 rounded-full bg-white/15 flex items-center justify-center text-white/70 text-sm font-bold"
          >
            {displayName.charAt(0).toUpperCase()}
          </a>
        ) : null}
        {displayName && (
          <a href="/profile" className="text-sm text-white/70 hover:text-white">
            {displayName}
          </a>
        )}
        <button
          onClick={handleSignOut}
          className="text-sm font-medium text-white/70 border border-white/20 bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 hover:text-white transition-colors duration-150"
        >
          Sign out
        </button>
      </div>
      {children}
    </div>
  );
}
