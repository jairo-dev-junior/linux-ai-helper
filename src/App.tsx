import { useState } from 'react';
import { ThemeProvider } from './components/Theme/ThemeProvider';
import { ChatProvider } from './contexts/ChatContext';
import { Navigation, Page } from './components/Navigation/Navigation';
import { Chat } from './components/Chat/Chat';
import { Scripts } from './components/Scripts/Scripts';
import './App.css';

function App() {
  const [currentPage, setCurrentPage] = useState<Page>('chat');

  return (
    <ThemeProvider>
      <ChatProvider>
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
          <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {currentPage === 'chat' ? <Chat /> : <Scripts />}
          </div>
        </div>
      </ChatProvider>
    </ThemeProvider>
  );
}

export default App;
