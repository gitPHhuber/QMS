import React from 'react';
import { NavLink } from 'react-router-dom';

interface NavItem {
  to: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: '\u25A6' },
  { to: '/orgs', label: 'Organizations', icon: '\u2616' },
  { to: '/instances', label: 'Instances', icon: '\u2726' },
  { to: '/licenses/new', label: 'Generate License', icon: '\u2712' },
  { to: '/settings', label: 'Settings', icon: '\u2699' },
];

const Sidebar: React.FC = () => {
  return (
    <aside className="flex h-screen w-[260px] flex-shrink-0 flex-col border-r border-card-border bg-card">
      {/* Branding */}
      <div className="flex items-center gap-3 border-b border-card-border px-5 py-5">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-surface font-bold text-lg">
          A
        </div>
        <div>
          <div className="text-sm font-semibold text-text-primary">ASVO License</div>
          <div className="text-xs text-text-secondary">Admin Panel</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors ${
                isActive
                  ? 'bg-accent/10 text-accent font-medium'
                  : 'text-text-secondary hover:bg-card-border/30 hover:text-text-primary'
              }`
            }
          >
            <span className="text-base w-5 text-center">{item.icon}</span>
            {item.label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="border-t border-card-border px-5 py-4">
        <div className="text-xs text-text-secondary">
          manage.asvo.tech
        </div>
        <div className="text-[10px] text-text-secondary/50 mt-0.5">
          ALS v1.0.0
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
