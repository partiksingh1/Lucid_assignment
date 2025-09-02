import { useState, useEffect } from 'react';
import './App.css';
import Dashboard from './components/Dashboard';
import EmailList from './components/EmaillList';
import EmailDetails from './components/EmailDetails';
import Analytics from './components/Analytics';
import Sidebar from './components/Sidebar';
import type { Email } from './types/Email';
import { Settings } from './components/Settings';

type ActiveView = 'dashboard' | 'emails' | 'analytics' | 'settings';

function App() {
  const [activeView, setActiveView] = useState<ActiveView>('dashboard');
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchEmails = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${import.meta.env.VITE_BASE_URL}/emails`);
      const data = await response.json();
      setEmails(data);
    } catch (error) {
      console.error('Error fetching emails:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmails();
    // Poll for new emails every 30 seconds
    const interval = setInterval(fetchEmails, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <Dashboard emails={emails} loading={loading} />;
      case 'emails':
        return (
          <div className="flex h-full">
            <EmailList
              emails={emails}
              onEmailSelect={setSelectedEmail}
              selectedEmail={selectedEmail}
              loading={loading}
            />
            {selectedEmail && (
              <EmailDetails
                email={selectedEmail}
                onClose={() => setSelectedEmail(null)}
              />
            )}
          </div>
        );
      case 'analytics':
        return <Analytics emails={emails} />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard emails={emails} loading={loading} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50">
      <Sidebar activeView={activeView} onViewChange={setActiveView} />
      <main className="flex-1 overflow-hidden">
        {renderContent()}
      </main>
    </div>
  );
}

export default App;