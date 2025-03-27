import React from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const SettingsLayout = () => {
  const location = useLocation();

  const tabs = [
    { name: 'Masks/Zones', href: '/settings/masks' },
    { name: 'PTZ Camera', href: '/settings/ptz' },
    { name: 'Camera Configuration', href: '/settings/config' }
  ];

  return (
    <div className="space-y-6">
      {/* <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">
          Manage your camera settings, masks/zones, and PTZ configuration.
        </p>
      </div> */}

      <div className="space-y-6">
        <nav className="flex space-x-2 border-b border-border">
          {tabs.map((tab) => (
            <Link
              key={tab.href}
              to={tab.href}
              className={cn(
                "px-3 py-2 text-sm font-medium transition-colors hover:text-primary",
                location.pathname === tab.href
                  ? "border-b-2 border-primary text-primary"
                  : "text-muted-foreground"
              )}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
        <Outlet />
      </div>
    </div>
  );
};

export default SettingsLayout; 