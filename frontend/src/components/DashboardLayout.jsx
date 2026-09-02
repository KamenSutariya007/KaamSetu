import AppShell from './layout/AppShell';

/** Dashboard wrapper — light sidebar + header */
export default function DashboardLayout({ children, role = 'CUSTOMER' }) {
  return (
    <AppShell withSidebar role={role}>
      <div className="p-4 sm:p-6 lg:p-8 max-w-[1600px]">{children}</div>
    </AppShell>
  );
}
