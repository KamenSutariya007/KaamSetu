import MarketplaceNav from './MarketplaceNav';

/** Public pages: marketplace nav only (no old sidebar / bottom pill). */
export function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-page">
      <MarketplaceNav solid />
      <main>{children}</main>
    </div>
  );
}

/** Auth pages: blank canvas — pages own their composition. */
export function AuthLayout({ children }) {
  return <div className="min-h-screen bg-page">{children}</div>;
}
