import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useHarvestStore } from '../store';
import HarvestReport from '../components/HarvestReport';

export default function ReportPage() {
  const { id } = useParams<{ id: string }>();
  const { currentTree, loading, loadTree } = useHarvestStore();

  useEffect(() => {
    if (id && (!currentTree || currentTree.id !== id)) {
      loadTree(id);
    }
  }, [id, currentTree, loadTree]);

  if (loading && !currentTree) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="font-cormorant italic text-3xl text-ht-ochre animate-pulse">Loading report…</p>
      </div>
    );
  }

  if (!currentTree) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="font-spectral text-ht-brown">Tree not found.</p>
        <Link to="/" className="text-sm font-spectral text-ht-ochre underline">Go home</Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ht-cream py-10">
      {/* Nav bar */}
      <div className="max-w-3xl mx-auto px-6 mb-8 flex items-center justify-between no-print">
        <Link
          to={`/tree/${currentTree.id}`}
          className="font-spectral text-sm text-ht-brown/60 hover:text-ht-ochre transition-colors duration-300 flex items-center gap-2"
        >
          ← Back to Tree
        </Link>
        <span className="font-cormorant italic text-lg text-ht-ochre">Harvest Trees™</span>
      </div>

      <HarvestReport tree={currentTree} />
    </div>
  );
}
