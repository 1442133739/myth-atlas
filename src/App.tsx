import { useCallback, useEffect, useMemo, useState } from "react";
import { Database, Globe2, Loader2, LogIn, LogOut, Sparkles } from "lucide-react";
import { fetchCountries, fetchState, fetchStories, fetchStoryDetails, login, postComment, register, toggleFavorite } from "./api";
import { AuthModal } from "./components/AuthModal";
import { FilterBar } from "./components/FilterBar";
import { MythMap } from "./components/MythMap";
import { Sidebar } from "./components/Sidebar";
import { StoryCard } from "./components/StoryCard";
import type { AppState, CountrySummary, MythEra, MythTheme, PublicUser, Story, StoryDetails } from "./types";

const emptyState: AppState = {
  favoriteIds: [],
  recentIds: []
};

export default function App() {
  const [stories, setStories] = useState<Story[]>([]);
  const [countries, setCountries] = useState<CountrySummary[]>([]);
  const [appState, setAppState] = useState<AppState>(emptyState);
  const [selectedDetails, setSelectedDetails] = useState<StoryDetails | null>(null);
  const [theme, setTheme] = useState<MythTheme>("all");
  const [era, setEra] = useState<MythEra>("all");
  const [search, setSearch] = useState("");
  const [selectedCountry, setSelectedCountry] = useState("");
  const [showLabels, setShowLabels] = useState(false);
  const [showConnections, setShowConnections] = useState(true);
  const [language, setLanguage] = useState<"zh" | "en">("zh");
  const [isExploring, setIsExploring] = useState(false);
  const [currentUser, setCurrentUser] = useState<PublicUser | null>(() => {
    const raw = localStorage.getItem("myth-atlas-user");
    return raw ? (JSON.parse(raw) as PublicUser) : null;
  });
  const [authOpen, setAuthOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    fetchStories({ theme, era, q: search, country: selectedCountry })
      .then((nextStories) => {
        if (!cancelled) setStories(nextStories);
      })
      .catch(() => {
        if (!cancelled) setError("故事数据加载失败，请确认后端 API 已启动。");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [theme, era, search, selectedCountry]);

  useEffect(() => {
    Promise.all([fetchCountries(), fetchState()])
      .then(([nextCountries, nextState]) => {
        setCountries(nextCountries);
        setAppState(nextState);
      })
      .catch(() => setError("应用状态加载失败。"));
  }, []);

  const selectedStory = selectedDetails?.story;

  const selectStory = useCallback(async (id: string) => {
    try {
      const details = await fetchStoryDetails(id);
      setSelectedDetails(details);
      setAppState(details.state);
    } catch {
      setError("故事详情加载失败。");
    }
  }, []);

  const handleToggleFavorite = useCallback(async (id: string) => {
    try {
      const nextState = await toggleFavorite(id);
      setAppState(nextState);
    } catch {
      setError("收藏状态保存失败。");
    }
  }, []);

  const handleLogin = useCallback(async (payload: { username: string; password: string }) => {
    const user = await login(payload);
    localStorage.setItem("myth-atlas-user", JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  const handleRegister = useCallback(async (payload: { username: string; displayName: string; password: string }) => {
    const user = await register(payload);
    localStorage.setItem("myth-atlas-user", JSON.stringify(user));
    setCurrentUser(user);
  }, []);

  const logout = () => {
    localStorage.removeItem("myth-atlas-user");
    setCurrentUser(null);
  };

  const submitComment = useCallback(
    async (body: string) => {
      if (!selectedStory || !currentUser) {
        setAuthOpen(true);
        return;
      }
      await postComment(selectedStory.id, { userId: currentUser.id, body });
      const details = await fetchStoryDetails(selectedStory.id);
      setSelectedDetails(details);
      setAppState(details.state);
    },
    [currentUser, selectedStory]
  );

  useEffect(() => {
    if (!isExploring || stories.length === 0) return;
    let index = Math.max(
      0,
      stories.findIndex((story) => story.id === selectedStory?.id)
    );

    const timer = window.setInterval(() => {
      index = (index + 1) % stories.length;
      void selectStory(stories[index].id);
    }, 4200);

    return () => window.clearInterval(timer);
  }, [isExploring, stories, selectedStory?.id, selectStory]);

  const visibleCountryName = useMemo(() => {
    if (selectedStory) return `${selectedStory.countryEn} ${selectedStory.country}`;
    if (selectedCountry) {
      const country = countries.find((item) => item.country === selectedCountry);
      return country ? `${country.countryEn} ${country.country}` : selectedCountry;
    }
    return "World Myth Atlas";
  }, [countries, selectedCountry, selectedStory]);

  const totalCountries = countries.length;
  const selectedState = selectedDetails?.state || appState;

  return (
    <main className="app-shell">
      <MythMap
        stories={stories}
        selectedStory={selectedStory}
        relatedStories={selectedDetails?.related || []}
        showLabels={showLabels}
        showConnections={showConnections}
        onSelectStory={selectStory}
      />

      <header className="top-panel">
        <div className="title-block">
          <div className="title-icon">
            <Globe2 size={20} />
          </div>
          <div>
            <span>世界神话地图</span>
            <h1>{visibleCountryName}</h1>
          </div>
        </div>
        <div className="stats">
          <div>
            <strong>{stories.length}</strong>
            <span>当前故事</span>
          </div>
          <div>
            <strong>{totalCountries}</strong>
            <span>文明地区</span>
          </div>
          <div>
            <strong>{appState.favoriteIds.length}</strong>
            <span>收藏</span>
          </div>
        </div>
        <button className="user-button" onClick={currentUser ? logout : () => setAuthOpen(true)} type="button">
          {currentUser ? <LogOut size={16} /> : <LogIn size={16} />}
          {currentUser ? currentUser.displayName : "登录"}
        </button>
      </header>

      <Sidebar
        stories={stories}
        countries={countries}
        state={appState}
        selectedCountry={selectedCountry}
        search={search}
        language={language}
        onSearchChange={setSearch}
        onCountryChange={setSelectedCountry}
        onSelectStory={selectStory}
      />

      {selectedStory && selectedDetails && (
        <StoryCard
          story={selectedStory}
          related={selectedDetails.related}
          comments={selectedDetails.comments}
          state={selectedState}
          currentUser={currentUser}
          language={language}
          onClose={() => setSelectedDetails(null)}
          onSelectStory={selectStory}
          onToggleFavorite={handleToggleFavorite}
          onLoginClick={() => setAuthOpen(true)}
          onSubmitComment={submitComment}
        />
      )}

      {authOpen && <AuthModal onClose={() => setAuthOpen(false)} onLogin={handleLogin} onRegister={handleRegister} />}

      <FilterBar
        theme={theme}
        era={era}
        showLabels={showLabels}
        showConnections={showConnections}
        language={language}
        isExploring={isExploring}
        onThemeChange={setTheme}
        onEraChange={setEra}
        onShowLabelsChange={setShowLabels}
        onShowConnectionsChange={setShowConnections}
        onLanguageChange={setLanguage}
        onExploreToggle={() => setIsExploring((value) => !value)}
      />

      <section className="insight-card">
        <div>
          <Sparkles size={16} />
          神话相似度
        </div>
        <p>同类母题会自动连线，适合拍“不同文明竟然讲过类似故事”的短视频。</p>
      </section>

      <section className="storage-badge">
        <Database size={15} />
        Express API + JSON Store
      </section>

      {loading && (
        <div className="status-toast">
          <Loader2 className="spin" size={16} />
          加载神话档案
        </div>
      )}

      {error && (
        <button className="status-toast error" onClick={() => setError("")} type="button">
          {error}
        </button>
      )}
    </main>
  );
}
