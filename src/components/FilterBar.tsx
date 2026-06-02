import { Compass, Eye, EyeOff, GitBranch, Languages, Route } from "lucide-react";
import type { MythEra, MythTheme } from "../types";

const themes: Array<{ value: MythTheme; label: string; icon: string }> = [
  { value: "all", label: "All", icon: "✦" },
  { value: "sun", label: "太阳", icon: "☀️" },
  { value: "flood", label: "洪水", icon: "🌊" },
  { value: "fire", label: "火", icon: "🔥" },
  { value: "dragon", label: "龙", icon: "🐉" },
  { value: "love", label: "爱情", icon: "💗" },
  { value: "moon", label: "月亮", icon: "🌙" },
  { value: "underworld", label: "冥界", icon: "💀" },
  { value: "hero", label: "英雄", icon: "⚔️" },
  { value: "creation", label: "创世", icon: "🌱" }
];

const eras: Array<{ value: MythEra; label: string }> = [
  { value: "all", label: "All Eras" },
  { value: "ancient", label: "远古" },
  { value: "classical", label: "古典" },
  { value: "medieval", label: "中世纪" },
  { value: "modern", label: "近现代" }
];

interface FilterBarProps {
  theme: MythTheme;
  era: MythEra;
  showLabels: boolean;
  showConnections: boolean;
  language: "zh" | "en";
  isExploring: boolean;
  onThemeChange: (theme: MythTheme) => void;
  onEraChange: (era: MythEra) => void;
  onShowLabelsChange: (value: boolean) => void;
  onShowConnectionsChange: (value: boolean) => void;
  onLanguageChange: (value: "zh" | "en") => void;
  onExploreToggle: () => void;
}

export function FilterBar({
  theme,
  era,
  showLabels,
  showConnections,
  language,
  isExploring,
  onThemeChange,
  onEraChange,
  onShowLabelsChange,
  onShowConnectionsChange,
  onLanguageChange,
  onExploreToggle
}: FilterBarProps) {
  return (
    <footer className="filter-bar">
      <div className="filter-row theme-row">
        {themes.map((item) => (
          <button
            className={`chip ${theme === item.value ? "active" : ""}`}
            key={item.value}
            onClick={() => onThemeChange(item.value)}
            type="button"
          >
            <span>{item.icon}</span>
            {item.label}
          </button>
        ))}
      </div>

      <div className="filter-row controls-row">
        <div className="era-tabs">
          {eras.map((item) => (
            <button
              className={`era-tab ${era === item.value ? "active" : ""}`}
              key={item.value}
              onClick={() => onEraChange(item.value)}
              type="button"
            >
              {item.label}
            </button>
          ))}
        </div>

        <div className="icon-controls">
          <button className={`icon-pill ${showLabels ? "active" : ""}`} onClick={() => onShowLabelsChange(!showLabels)} type="button">
            {showLabels ? <Eye size={16} /> : <EyeOff size={16} />}
            标签
          </button>
          <button
            className={`icon-pill ${showConnections ? "active" : ""}`}
            onClick={() => onShowConnectionsChange(!showConnections)}
            type="button"
          >
            <GitBranch size={16} />
            关联
          </button>
          <button className={`icon-pill ${language === "en" ? "active" : ""}`} onClick={() => onLanguageChange(language === "zh" ? "en" : "zh")} type="button">
            <Languages size={16} />
            {language === "zh" ? "中文" : "EN"}
          </button>
          <button className={`icon-pill explore ${isExploring ? "active" : ""}`} onClick={onExploreToggle} type="button">
            {isExploring ? <Route size={16} /> : <Compass size={16} />}
            漫游
          </button>
        </div>
      </div>
    </footer>
  );
}
