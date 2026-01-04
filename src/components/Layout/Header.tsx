import { ThemeSwitcher } from './ThemeSwitcher';
import './layout.css';

interface HeaderProps {
  projectName?: string;
  onExport?: () => void;
  onReset?: () => void;
  isExporting?: boolean;
}

export function Header({
  projectName = 'Frontend Sandbox',
  onExport,
  onReset,
  isExporting = false,
}: HeaderProps) {
  return (
    <header className="header">
      <div className="header__left">
        <h1 className="header__title">{projectName}</h1>
      </div>
      <div className="header__right">
        <ThemeSwitcher />
        <div className="header__divider" />
        {onReset && (
          <button className="header__button" onClick={onReset} title="Reset to default project">
            🔄 Reset
          </button>
        )}
        {onExport && (
          <button
            className="header__button header__button--primary"
            onClick={onExport}
            disabled={isExporting}
            title="Export project as ZIP"
          >
            {isExporting ? '⏳ Exporting...' : '📦 Export ZIP'}
          </button>
        )}
      </div>
    </header>
  );
}
