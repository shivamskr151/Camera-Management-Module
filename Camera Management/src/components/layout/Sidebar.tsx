import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';
import { appConfig } from '@/config/app-config';
import {
  LayoutDashboard,
  Users,
  Settings,
  BarChart3,
  FileText,
  Home,
  Layers,
  Package,
} from 'lucide-react';

// Map of icon names to components
const iconMap: Record<string, React.ReactNode> = {
  LayoutDashboard: <LayoutDashboard className="h-5 w-5" />,
  Users: <Users className="h-5 w-5" />,
  Settings: <Settings className="h-5 w-5" />,
  BarChart3: <BarChart3 className="h-5 w-5" />,
  FileText: <FileText className="h-5 w-5" />,
  Home: <Home className="h-5 w-5" />,
  Package: <Package className="h-5 w-5" />,
  Layers: <Layers className="h-5 w-5" />
};

interface SidebarProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, setIsOpen }) => {
  const location = useLocation();
  const { state } = useAuth();
  const { user } = state;
  const config = appConfig.sidebar;
  
  // Get accessible sections based on user role
  const accessibleSections = user?.role ? 
    config.roles[user.role] || [] : 
    config.roles['user'] || []; // Default to user role if no role specified
    
  return (
    <aside
      className={cn(
        "fixed inset-y-0 left-0 z-20 w-64 bg-sidebar text-sidebar-foreground border-r border-sidebar-border transition-transform duration-300 ease-in-out transform",
        {
          "translate-x-0": isOpen,
          "-translate-x-full": !isOpen,
          "md:translate-x-0": true,
        }
      )}
    >
      <div className="flex flex-col h-full">
        <div className="flex h-16 items-center justify-center border-b border-sidebar-border px-4">
          <img 
            src="/assets/Variphi-Logo.jpg" 
            alt="Variphi Logo" 
            className="h-10 object-contain" 
          />
        </div>
        
        <div className="flex-1 overflow-y-auto py-4 px-3">
          {/* Render each accessible section */}
          {accessibleSections.map(sectionKey => {
            const section = config.sections[sectionKey];
            if (!section) return null;
            
            return (
              <div key={sectionKey} className="space-y-1 mb-6">
                <p className="text-xs font-semibold text-sidebar-foreground/60 uppercase tracking-wider px-3 py-2">
                  {section.title}
                </p>
                
                {/* Section items */}
                {section.items.map((item) => {
                  const isActive = location.pathname === item.href;
                  const icon = iconMap[item.icon] || <Home className="h-5 w-5" />;
                  
                  return (
                    <Link
                      key={item.name}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                        {
                          "bg-sidebar-accent text-sidebar-accent-foreground": isActive,
                          "hover:bg-sidebar-accent/50 text-sidebar-foreground": !isActive,
                        }
                      )}
                    >
                      {icon}
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            );
          })}
        </div>
        
        {/* User profile summary */}
        {user && (
          <div className="border-t border-sidebar-border p-4">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-sidebar-primary flex items-center justify-center text-sidebar-primary-foreground">
                {user.name.split(' ').map(n => n[0]).join('')}
              </div>
              <div className="flex flex-col">
                <span className="text-sm font-medium">{user.name}</span>
                <span className="text-xs text-sidebar-foreground/60">{user.role}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};

export default Sidebar;
