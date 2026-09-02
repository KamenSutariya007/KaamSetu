import Header from './Header';
import Sidebar from './Sidebar';
import MobileNav from './MobileNav';
import cn from '../../utils/cn';

/** Application shell — white header + optional light sidebar */
export default function AppShell({
  children,
  role,
  withSidebar = false,
  minimalHeader = false,
  showSearch = true,
  className = '',
}) {
  return (
    <div className="min-h-screen bg-page flex flex-col overflow-x-hidden">
      <Header minimal={minimalHeader} showSearch={showSearch && !minimalHeader} />
      <div className="flex flex-1 min-w-0">
        {withSidebar && role && <Sidebar role={role} />}
        <main className={cn('flex-1 min-w-0 pb-24 lg:pb-8', className)}>
          {children}
        </main>
      </div>
      <MobileNav />
    </div>
  );
}
