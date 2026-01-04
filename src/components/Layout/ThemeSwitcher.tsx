import { useUIStore } from '@/stores/uiStore';
import type { Theme } from '@/types';
import './layout.css';

const THEME_OPTIONS: { value: Theme; label: string; icon: string }[] = [
  { value: 'dark', label: 'Dark', icon: '🌙' },
  { value: 'light', label: 'Light', icon: '☀️' },
  { value: 'cream', label: 'Cream', icon: '🍂' },
];

export function ThemeSwitcher() {
  const theme = useUIStore((state) => state.theme);
  const setTheme = useUIStore((state) => state.setTheme);

  return (
    <div className="theme-switcher">
      {THEME_OPTIONS.map((option) => (
        <button
          key={option.value}
          className={`theme-switcher__button ${theme === option.value ? 'theme-switcher__button--active' : ''}`}
          onClick={() => setTheme(option.value)}
          title={option.label}
        >
          <span className="theme-switcher__icon">{option.icon}</span>
        </button>
      ))}
    </div>
  );
}
