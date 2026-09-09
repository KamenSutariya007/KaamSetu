import WorkspaceShell from './layout/WorkspaceShell';

/** Role dashboards use the new horizontal workspace chrome. */
export default function DashboardLayout({ children, role = 'CUSTOMER', title, subtitle, actions }) {
  return (
    <WorkspaceShell role={role} title={title} subtitle={subtitle} actions={actions}>
      {children}
    </WorkspaceShell>
  );
}
