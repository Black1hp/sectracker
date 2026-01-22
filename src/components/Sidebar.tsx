
import React from 'react';
import { Shield, Bug, CheckSquare, BookOpen, BarChart3, LogOut, User, Rss, Target, TrendingUp, Crosshair, DollarSign } from 'lucide-react';
import { Sidebar as SidebarUI, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter } from '@/components/ui/sidebar';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';

interface SidebarProps {
  activeView: string;
  setActiveView: (view: string) => void;
}

// Grouped menu structure
const menuGroups = [
  {
    label: 'Hunting',
    items: [
      { id: 'dashboard', title: 'Dashboard', icon: BarChart3, color: 'text-cyan-400' },
      { id: 'my-targets', title: 'My Targets', icon: Crosshair, color: 'text-cyan-400' },
      { id: 'bug-reports', title: 'Bug Reports', icon: Bug, color: 'text-red-400' },
      { id: 'analytics', title: 'Analytics', icon: TrendingUp, color: 'text-emerald-400' },
    ]
  },
  {
    label: 'Methodology',
    items: [
      { id: 'checklists', title: 'Checklists', icon: CheckSquare, color: 'text-green-400' },
      { id: 'knowledge-base', title: 'Knowledge Base', icon: BookOpen, color: 'text-purple-400' },
    ]
  },
  {
    label: 'Resources',
    items: [
      { id: 'news-feed', title: 'News Feed', icon: Rss, color: 'text-orange-400' },
      { id: 'earnings-goals', title: 'Earnings Goals', icon: DollarSign, color: 'text-green-400' },
    ]
  },
  {
    label: 'Account',
    items: [
      { id: 'profile', title: 'Profile', icon: User, color: 'text-pink-400' },
    ]
  }
];

export function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <SidebarUI className="border-r border-gray-700" style={{ backgroundColor: 'rgb(17, 24, 39)' }}>
      <SidebarHeader className="p-6 border-b border-gray-700" style={{ backgroundColor: 'rgb(17, 24, 39)' }}>
        <div className="flex items-center space-x-2">
          <Shield className="h-8 w-8 text-cyan-400" />
          <div>
            <h1 className="text-xl font-bold text-white">SecTracker</h1>
            <p className="text-sm text-gray-400">Bug Hunter Platform</p>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent style={{ backgroundColor: 'rgb(17, 24, 39)' }}>
        {menuGroups.map((group) => (
          <SidebarGroup key={group.label}>
            <SidebarGroupLabel className="text-gray-500 text-xs uppercase tracking-wider px-3 py-2">
              {group.label}
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {group.items.map((item) => (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton
                      onClick={() => setActiveView(item.id)}
                      className={`w-full justify-start transition-colors ${activeView === item.id
                        ? 'bg-cyan-600 text-white hover:bg-cyan-700'
                        : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                        }`}
                    >
                      <item.icon className={`h-5 w-5 ${activeView === item.id ? 'text-white' : item.color}`} />
                      <span>{item.title}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        ))}
      </SidebarContent>
      <SidebarFooter className="p-4 border-t border-gray-700" style={{ backgroundColor: 'rgb(17, 24, 39)' }}>
        <Button
          onClick={handleLogout}
          variant="outline"
          className="w-full border-red-500/50 text-red-400 bg-gray-800/50 hover:bg-red-900/30 hover:text-red-300 hover:border-red-400"
        >
          <LogOut className="h-4 w-4 mr-2" />
          Logout
        </Button>
      </SidebarFooter>
    </SidebarUI>
  );
}
