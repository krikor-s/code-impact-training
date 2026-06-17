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
    <div className="min-h-screen bg-gray-100 flex flex-col p-8">
      <div className="w-full flex justify-end items-center gap-3 mb-4">
        {pictureUrl ? (
          <a href="/profile">
            <img
              src={pictureUrl}
              alt="Profile"
              className="w-8 h-8 rounded-full object-cover border border-gray-200"
            />
          </a>
        ) : displayName ? (
          <a
            href="/profile"
            className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 text-sm font-bold"
          >
            {displayName.charAt(0).toUpperCase()}
          </a>
        ) : null}
        {displayName && (
          <a href="/profile" className="text-sm text-gray-500 hover:text-gray-700">
            {displayName}
          </a>
        )}
        <button
          onClick={handleSignOut}
          className="text-sm font-medium text-gray-600 border border-gray-300 bg-white px-4 py-2 rounded hover:bg-gray-200 transition-colors duration-150"
        >
          Sign out
        </button>
      </div>
      {children}
    </div>
  );
}
