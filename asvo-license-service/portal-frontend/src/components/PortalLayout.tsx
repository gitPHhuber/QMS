import { ReactNode } from 'react';
import PortalSidebar from './PortalSidebar';

interface Props {
  children: ReactNode;
}

export default function PortalLayout({ children }: Props) {
  return (
    <div className="flex min-h-screen bg-dark-bg">
      <PortalSidebar />
      <main className="flex-1 overflow-y-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">{children}</div>
      </main>
    </div>
  );
}
