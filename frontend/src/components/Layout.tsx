import type { ReactNode } from "react";

function handleSignOut() {
  localStorage.removeItem("token");
  localStorage.removeItem("displayName");
  window.location.href = "/login";
}

export default function Layout({ children }: { children: ReactNode }) {
  const displayName = localStorage.getItem("displayName");

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col p-8">
      <div className="w-full flex justify-end items-center gap-3 mb-4">
        {displayName && (
          <span className="text-sm text-gray-500">{displayName}</span>
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
