import styles from './Navigation.module.css';

export type Page = 'home' | 'chat' | 'scripts';

interface NavigationProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
}

export function Navigation({ currentPage, onPageChange }: NavigationProps) {
  return (
    <nav className={styles.navigation}>
      <button
        type="button"
        className={`${styles.navButton} ${currentPage === 'home' ? styles.active : ''}`}
        onClick={() => onPageChange('home')}
      >
        🏠 Início
      </button>
      <button
        type="button"
        className={`${styles.navButton} ${currentPage === 'chat' ? styles.active : ''}`}
        onClick={() => onPageChange('chat')}
      >
        💬 Chat
      </button>
      <button
        type="button"
        className={`${styles.navButton} ${currentPage === 'scripts' ? styles.active : ''}`}
        onClick={() => onPageChange('scripts')}
      >
        📜 Scripts
      </button>
    </nav>
  );
}

