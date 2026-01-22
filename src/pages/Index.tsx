
import React from 'react';
import { Sidebar } from '@/components/Sidebar';
import { Dashboard } from '@/components/Dashboard';
import { ChecklistsView } from '@/components/ChecklistsView';
import { ProfileView } from '@/components/ProfileView';
import { RSSView } from '@/components/RSSView';
import { BugReportsView } from '@/components/BugReportsView';
import { BountyTargetsView } from '@/components/BountyTargetsView';
import { AnalyticsView } from '@/components/AnalyticsView';
import { HuntingTargetsView } from '@/components/HuntingTargetsView';
import { KnowledgeBaseView } from '@/components/KnowledgeBaseView';
import { SidebarProvider } from '@/components/ui/sidebar';
import { AuthWrapper } from '@/components/AuthWrapper';

const Index = () => {
  const [activeView, setActiveView] = React.useState('dashboard');

  React.useEffect(() => {
    const handleNavigate = (event: CustomEvent) => {
      setActiveView(event.detail);
    };

    window.addEventListener('navigate', handleNavigate as EventListener);
    return () => {
      window.removeEventListener('navigate', handleNavigate as EventListener);
    };
  }, []);

  const renderView = () => {
    switch (activeView) {
      // Hunting
      case 'dashboard':
        return <Dashboard />;
      case 'my-targets':
        return <HuntingTargetsView />;
      case 'bug-reports':
        return <BugReportsView />;
      case 'analytics':
        return <AnalyticsView />;

      // Methodology
      case 'checklists':
        return <ChecklistsView />;
      case 'knowledge-base':
        return <KnowledgeBaseView />;

      // Resources
      case 'news-feed':
        return <RSSView />;
      case 'earnings-goals':
        return <BountyTargetsView />;

      // Account
      case 'profile':
        return <ProfileView />;

      default:
        return <Dashboard />;
    }
  };

  return (
    <AuthWrapper>
      <SidebarProvider>
        <div className="min-h-screen flex w-full bg-gray-900">
          <Sidebar activeView={activeView} setActiveView={setActiveView} />
          <main className="flex-1 overflow-auto">
            <div className="p-6">
              {renderView()}
            </div>
          </main>
        </div>
      </SidebarProvider>
    </AuthWrapper>
  );
};

export default Index;
