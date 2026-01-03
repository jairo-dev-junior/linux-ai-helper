import { useState } from 'react';
import { ThemeProvider } from './components/Theme/ThemeProvider';
import { ChatProvider } from './contexts/ChatContext';
import { Navigation, Page } from './components/Navigation/Navigation';
import { Dashboard } from './components/Dashboard/Dashboard';
import { Chat } from './components/Chat/Chat';
import { Scripts } from './components/Scripts/Scripts';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('home');

  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return <Dashboard />;
      case 'chat':
        return <Chat />;
      case 'scripts':
        return <Scripts />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <ThemeProvider>
      <ChatProvider>
        <div style={{ display: 'flex', flexDirection: 'row', height: '100vh' }}>
          <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {renderPage()}
          </div>
        </div>
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;
