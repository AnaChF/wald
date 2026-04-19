import { Link, Outlet } from 'react-router-dom';

export default function Layout() {
  return (
    <div className="min-h-screen bg-ht-cream">
      <nav className="bg-ht-cream border-b border-ht-ochre/20 px-6 py-3 flex items-center justify-between sticky top-0 z-50">
        <Link
          to="/"
          className="font-cormorant italic text-2xl font-semibold text-ht-ochre tracking-wide hover:opacity-80 transition-opacity duration-300"
        >
          HARVEST TREES™
        </Link>
        <div className="flex items-center gap-4">
          <Link
            to="/trees"
            className="font-spectral text-sm text-ht-brown hover:text-ht-ochre transition-colors duration-300"
          >
            My Trees
          </Link>
          <Link
            to="/"
            className="font-spectral text-sm border border-ht-ochre text-ht-ochre px-4 py-1.5 rounded hover:bg-ht-ochre hover:text-white transition-all duration-300"
          >
            New Tree
          </Link>
        </div>
      </nav>
      <main>
        <Outlet />
      </main>
    </div>
  );
}
