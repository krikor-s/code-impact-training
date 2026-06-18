import { useState, useEffect, useRef } from "react";
import { apiFetch } from "../lib/api";
import Layout from "../components/Layout";
import Card from "../components/Card";
import Button from "../components/Button";

type Profile = {
  displayName: string;
  email: string;
  profilePicture: string | null;
  dailyGoal: number;
  currentStreak: number;
  longestStreak: number;
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

export default function ProfilePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [dailyGoal, setDailyGoal] = useState(50);
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
        setDailyGoal(json.data.dailyGoal);
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

  async function handleUpdateProfile(e: { preventDefault(): void }) {
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
      body: JSON.stringify({ displayName, dailyGoal }),
    });
    const json = (await res.json()) as { success: boolean; data?: Profile; error?: string };
    setSaving(false);

    if (!res.ok) {
      setError(json.error ?? "Failed to update profile");
      return;
    }

    setProfile(json.data!);
    localStorage.setItem("displayName", json.data!.displayName);
    setSuccess("Profile updated");
  }

  if (!profile) return null;

  const pictureUrl = profile.profilePicture
    ? `${BASE_URL}${profile.profilePicture}`
    : null;

  return (
    <Layout>
      <div className="max-w-md mx-auto mt-8">
        <h1 className="text-2xl font-bold text-white mb-6">Profile</h1>

        {error && <p className="text-red-300 text-sm mb-4">{error}</p>}
        {success && <p className="text-emerald-300 text-sm mb-4">{success}</p>}

        <Card className="mb-6">
          {previewUrl ? (
            <div className="mb-6">
              <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">
                Adjust & save
              </p>
              <div className="flex items-center gap-5 mb-3">
                <div className="w-24 h-24 rounded-full overflow-hidden border border-white/20 shrink-0">
                  <img
                    src={previewUrl}
                    alt="Preview"
                    className="w-full h-full object-cover"
                    style={{ transform: `scale(${previewZoom})` }}
                  />
                </div>
                <div className="flex-1">
                  <label className="flex items-center gap-3 mb-3">
                    <span className="text-xs text-white/50">Zoom</span>
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
                    <Button onClick={handleSavePicture} disabled={saving} className="text-xs px-3 py-1">
                      {saving ? "Saving..." : "Save"}
                    </Button>
                    <Button variant="secondary" onClick={cancelPreview} className="text-xs px-3 py-1">
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-5 mb-6">
              <div className="w-20 h-20 rounded-full overflow-hidden border border-white/20 shrink-0">
                {pictureUrl ? (
                  <img src={pictureUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-white/15 flex items-center justify-center text-white/70 text-2xl font-bold">
                    {profile.displayName.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              <div>
                <label className="block">
                  <span className="text-sm font-medium text-white/70 cursor-pointer hover:text-white">
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
                <p className="text-xs text-white/30 mt-1">JPG, PNG, or WebP. Max 5MB.</p>
              </div>
            </div>
          )}

          <div className="mb-4">
            <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">Email</span>
            <p className="text-sm text-white mt-1">{profile.email}</p>
          </div>

          <form onSubmit={handleUpdateProfile}>
            <label className="block mb-4">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">Display Name</span>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                required
                className="mt-1 block w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-white/40"
              />
            </label>
            <label className="block mb-4">
              <span className="text-xs font-semibold text-white/50 uppercase tracking-wide">
                Daily completion goal
              </span>
              <div className="flex items-center gap-3 mt-1">
                <input
                  type="range"
                  min="10"
                  max="100"
                  step="10"
                  value={dailyGoal}
                  onChange={(e) => setDailyGoal(parseInt(e.target.value, 10))}
                  className="flex-1"
                />
                <span className="text-sm text-white font-medium w-12 text-right">{dailyGoal}%</span>
              </div>
              <p className="text-xs text-white/30 mt-1">
                Meet this daily to keep your streak going
              </p>
            </label>
            <Button type="submit" disabled={saving} className="w-full py-3">
              {saving ? "Saving..." : "Save"}
            </Button>
          </form>
        </Card>

        <Card className="mb-6">
          <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-3">Streak</p>
          <div className="flex gap-6 mb-4">
            <div>
              <p className="text-2xl font-bold text-white">{profile.currentStreak}</p>
              <p className="text-xs text-white/40">Current</p>
            </div>
            <div>
              <p className="text-2xl font-bold text-white">{profile.longestStreak}</p>
              <p className="text-xs text-white/40">Longest</p>
            </div>
          </div>
          <div className="border-t border-white/10 pt-3">
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wide mb-2">Badges</p>
            <p className="text-xs text-white/30 mb-2">Hit your daily goal on consecutive days to unlock ocean-themed badges.</p>
            <div className="flex flex-col gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-base ${profile.longestStreak >= 3 ? "" : "opacity-30"}`}>🐚</span>
                  <span className="text-xs text-white/70">Shell</span>
                </div>
                <span className={`text-xs ${profile.longestStreak >= 3 ? "text-emerald-400" : "text-white/30"}`}>{profile.longestStreak >= 3 ? "Unlocked" : "3 day streak"}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-base ${profile.longestStreak >= 7 ? "" : "opacity-30"}`}>🦪</span>
                  <span className="text-xs text-white/70">Pearl</span>
                </div>
                <span className={`text-xs ${profile.longestStreak >= 7 ? "text-emerald-400" : "text-white/30"}`}>{profile.longestStreak >= 7 ? "Unlocked" : "7 day streak"}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-base ${profile.longestStreak >= 14 ? "" : "opacity-30"}`}>🌊</span>
                  <span className="text-xs text-white/70">Wave</span>
                </div>
                <span className={`text-xs ${profile.longestStreak >= 14 ? "text-emerald-400" : "text-white/30"}`}>{profile.longestStreak >= 14 ? "Unlocked" : "14 day streak"}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={`text-base ${profile.longestStreak >= 30 ? "" : "opacity-30"}`}>⚓</span>
                  <span className="text-xs text-white/70">Anchor</span>
                </div>
                <span className={`text-xs ${profile.longestStreak >= 30 ? "text-emerald-400" : "text-white/30"}`}>{profile.longestStreak >= 30 ? "Unlocked" : "30 day streak"}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </Layout>
  );
}
