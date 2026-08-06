import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { motion } from 'framer-motion';

export default function Visitors() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [visitors, setVisitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSuperAdmin) return;

    const load = async () => {
      setLoading(true);
      try {
        // expects a `visitors` collection if you track visitor sessions
        const snap = await getDocs(collection(db, 'visitors'));
        const items = snap.docs.map(d => ({ id: d.id, ...(d.data() || {}) }));
        setVisitors(items);
      } catch (err) {
        console.error('Error loading visitors:', err);
        setVisitors([]);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAdmin, isSuperAdmin]);

  if (!isSuperAdmin) {
    return <div className="p-6">You do not have permission to view this page.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col lg:flex-row items-start gap-8">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Visitors</h1>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block w-80"
        >
          <img src="/storyset/Eco%20shopping-pana.svg" alt="Visitors Illustration" className="w-full" />
        </motion.div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : visitors.length === 0 ? (
        <div>No visitor data found. Add visitor tracking to record sessions into the `visitors` collection.</div>
      ) : (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-3 py-2">ID</th>
                <th className="px-3 py-2">IP / Identifier</th>
                <th className="px-3 py-2">Visited At</th>
                <th className="px-3 py-2">Path</th>
                <th className="px-3 py-2">Notes</th>
              </tr>
            </thead>
            <tbody>
              {visitors.map(v => (
                <tr key={v.id} className="border-t">
                  <td className="px-3 py-2">{v.id}</td>
                  <td className="px-3 py-2">{v.ip || v.identifier || '-'}</td>
                  <td className="px-3 py-2">{v.visitedAt || v.createdAt || '-'}</td>
                  <td className="px-3 py-2">{v.path || '-'}</td>
                  <td className="px-3 py-2">{v.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
