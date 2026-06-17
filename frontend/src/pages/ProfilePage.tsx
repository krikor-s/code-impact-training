import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../lib/api";
import Layout from "../components/Layout";

type Profile = {
  displayName: string;
  email: string;
  profilePicture: string | null;
};

const BASE_URL = (import.meta.env.VITE_API_URL as string) ?? "";
const OUTPUT_SIZE = 400;

function cropToSquare(img: HTMLImageElement, zoom: number): Promise<Blob> {
  return new Promise((resolve) => {
    const side = Math.min(img.width, img.height) / zoom;
    const sx = (img.width - side) / 2;
    const sy = (img.height - side) / 2;
    const canvas = document.createElement("canvas");
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, sx, sy, side, side, 0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    canvas.toBlob((blob) => resolve(blob!), "image/jpeg", 0.9);
  });
}

function handleSignOut() {
  localStorage.removeItem("token");
  localStorage.removeItem("displayName");
  localStorage.removeItem("profilePicture");
  window.location.href = "/login";
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewZoom, setPreviewZoom] = useState(1);
  const previewImgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    apiFetch("/api/v1/profile")
      .then((res) => res.json())
      .then((json: { data: Profile }) => {
        setProfile(json.data);
        setDisplayName(json.data.displayName);
        if (json.data.profilePicture) {
          localStorage.setItem("profilePicture", json.data.profilePicture);
        }
      });
  }, []);

  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setSuccess(null);
    setPreviewZoom(1);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      previewImgRef.current = img;
      setPreviewUrl(url);
    };
    img.src = url;
  }

  function cancelPreview() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    previewImgRef.current = null;
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handleSavePicture() {
    if (!previewImgRef.current) return;
    setSaving(true);
    setError(null);
    setSuccess(null);

    const blob = await cropToSquare(previewImgRef.current, previewZoom);
    const formData = new FormData();
    formData.append("profilePicture", blob, "profile.jpg");

    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/api/v1/profile`, {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    const json = (await res.json()) as { success: boolean; data?: Profile; error?: string };
    setSaving(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to upload picture");
      return;
    }

    setProfile(json.data!);
    if (json.data!.profilePicture) {
      localStorage.setItem("profilePicture", json.data!.profilePicture);
    }
    setSuccess("Profile picture updated");
    cancelPreview();
  }

  async function handleUpdateName(e: { preventDefault(): void }) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem("token");
    const res = await fetch(`${BASE_URL}/api/v1/profile`, {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ displayName }),
    });
    const json = (await res.json()) as { success: boolean; data?: Profile; error?: string };
    setSaving(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to update profile");
      return;
    }

    setProfile(json.data!);
    localStorage.setItem("displayName", json.data!.displayName);
    setSuccess("Display name updated");
  }

  if (!profile) return null;

  const pictureUrl = profile.profilePicture
    ? `${BASE_URL}${profile.profilePicture}`
    : null;

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Profile</h1>

        {error && <p className="text-red-600 text-sm mb-4">{error}</p>}
        {success && <p className="text-green-600 text-sm mb-4">{success}</p>}

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
          {previewUrl ? (
            <div className="mb-6">
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
                Adjust & save
              </p>
              <div className="flex items-center gap-5 mb-3">
                <div className="w-24 h-24 rounded-full overflow-hidden border border-gray-200 shrink-0">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    style={{ transform: `scale(${previewZoom})` }}
                  />
                </div>
                <div className="flex-1">
                  <label className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-gray-500">Zoom</span>
                    <input
                      type="range"
                      min="1"
                      max="3"
                      step="0.05"
                      value={previewZoom}
                      onChange={(e) => setPreviewZoom(parseFloat(e.target.value))}
                      className="flex-1"
                    />
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={handleSavePicture}
                      disabled={saving}
                      className="bg-slate-600 text-white text-sm font-medium px-4 py-2 rounded hover:bg-slate-500 transition-colors duration-150 disabled:opacity-50"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={cancelPreview}
                      className="border border-gray-300 bg-white text-gray-600 text-sm font-medium px-4 py-2 rounded hover:bg-gray-200 transition-colors duration-150"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-5 mb-6">
              <div className="w-20 h-20 rounded-full overflow-hidden border border-gray-200 shrink-0">
                {pictureUrl ? (
                  <img
                    src={pictureUrl}
                    alt="Profile"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-200 flex items-center justify-center text-gray-500 text-2xl font-bold">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <label className="block">
                  <span className="text-sm font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                    Upload picture
                  </span>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-xs text-gray-400 mt-1">JPG, PNG, or WebP. Max 5MB.</p>
              </div>
            </div>
          )}

          <div className="mb-4">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email</span>
            <p className="text-sm text-gray-900 mt-1">{profile.email}</p>
          </div>

          <form onSubmit={handleUpdateName}>
            <label className="block mb-4">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Display Name</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="mt-1 block w-full border border-gray-300 rounded px-3 py-2 text-sm"
              />
            </label>
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-slate-600 text-white text-sm font-medium px-4 py-3 rounded hover:bg-slate-500 transition-colors duration-150 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </form>
        </div>

        <button
          onClick={handleSignOut}
          className="w-full border border-gray-300 bg-white text-gray-600 text-sm font-medium px-4 py-3 rounded hover:bg-gray-200 transition-colors duration-150"
        >
          Sign out
        </button>
      </div>
    </Layout>
  );
}
