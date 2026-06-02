import { Bookmark, Clock, Search } from "lucide-react";
import type { AppState, CountrySummary, Story } from "../types";

interface SidebarProps {
  stories: Story[];
  countries: CountrySummary[];
  state: AppState;
  selectedCountry: string;
  search: string;
  language: "zh" | "en";
  onSearchChange: (value: string) => void;
  onCountryChange: (value: string) => void;
  onSelectStory: (id: string) => void;
}

export function Sidebar({
  stories,
  countries,
  state,
  selectedCountry,
  search,
  language,
  onSearchChange,
  onCountryChange,
  onSelectStory
}: SidebarProps) {
  const selectedCountryInfo = countries.find((country) => country.country === selectedCountry);
  const favorites = stories.filter((story) => state.favoriteIds.includes(story.id));
  const recent = state.recentIds
    .map((id) => stories.find((story) => story.id === id))
    .filter((story): story is Story => Boolean(story));

  return (
    <aside className="sidebar">
      <div className="search-box">
        <Search size={17} />
        <input
          placeholder="搜索国家、故事、主题"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
        />
      </div>

      <div className="country-strip">
        <button className={!selectedCountry ? "active" : ""} onClick={() => onCountryChange("")} type="button">
          全部地区
        </button>
        {countries.map((country) => (
          <button
            className={selectedCountry === country.country ? "active" : ""}
            key={country.country}
            onClick={() => onCountryChange(country.country)}
            type="button"
          >
            {country.country}
            <span>{country.count}</span>
          </button>
        ))}
      </div>

      <section className="country-card">
        <span>{selectedCountryInfo?.region || "Global"}</span>
        <h2>{selectedCountryInfo ? `${selectedCountryInfo.country} ${selectedCountryInfo.countryEn}` : "世界神话索引"}</h2>
        <div>
          <strong>{stories.length}</strong>
          <small>当前故事</small>
        </div>
      </section>

      {(favorites.length > 0 || recent.length > 0) && (
        <div className="memory-row">
          {favorites.length > 0 && (
            <div>
              <Bookmark size={14} />
              {favorites.length} 收藏
            </div>
          )}
          {recent.length > 0 && (
            <div>
              <Clock size={14} />
              {recent.length} 最近
            </div>
          )}
        </div>
      )}

      <div className="story-grid">
        {stories.map((story) => (
          <button className="story-tile" key={story.id} onClick={() => onSelectStory(story.id)} type="button">
            <img alt={story.titleZh} src={story.imageUrl} />
            <span>{story.icon}</span>
            <strong>{language === "zh" ? story.titleZh : story.titleEn}</strong>
            <small>{story.country}</small>
          </button>
        ))}
      </div>
    </aside>
  );
}
