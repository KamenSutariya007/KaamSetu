import AppShell from './AppShell';

function PublicLayout({ children }) {
  return (
    <AppShell showSearch>
      {children}
    </AppShell>
  );
}

function AuthLayout({ children }) {
  return (
    <AppShell minimalHeader showSearch={false}>
      {children}
    </AppShell>
  );
}

export { PublicLayout, AuthLayout };
