import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function Users() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAdmin && !isSuperAdmin) return;

    const load = async () => {
      setLoading(true);
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const docs = usersSnap.docs.map(d => ({ uid: d.id, ...(d.data() || {}) }));

        // For each user compute basic counts
        const summaries = await Promise.all(docs.map(async (u) => {
          const [products, purchases, recipes, batches, sales, shops, collections, money] = await Promise.all([
            getDocs(query(collection(db, 'products'), where('owner', '==', u.uid))),
            getDocs(query(collection(db, 'purchases'), where('owner', '==', u.uid))),
            getDocs(query(collection(db, 'recipes'), where('owner', '==', u.uid))),
            getDocs(query(collection(db, 'batches'), where('owner', '==', u.uid))),
            getDocs(query(collection(db, 'sales'), where('owner', '==', u.uid))),
            getDocs(query(collection(db, 'shops'), where('owner', '==', u.uid))),
            getDocs(query(collection(db, 'collections'), where('owner', '==', u.uid))),
            getDocs(query(collection(db, 'money'), where('owner', '==', u.uid))),
          ]);

          return {
            uid: u.uid,
            email: u.email || '',
            displayName: u.fullName || u.displayName || '',
            role: u.role || '',
            createdAt: u.createdAt || '',
            counts: {
              products: products.size,
              purchases: purchases.size,
              recipes: recipes.size,
              batches: batches.size,
              sales: sales.size,
              shops: shops.size,
              collections: collections.size,
              money: money.size,
            }
          };
        }));

        setUsers(summaries);
      } catch (err) {
        console.error('Error loading users:', err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [isAdmin, isSuperAdmin]);

  if (!isAdmin && !isSuperAdmin) {
    return <div className="p-6">You do not have permission to view this page.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <h1 className="text-2xl font-bold">Users</h1>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Products</th>
                <th className="px-3 py-2">Purchases</th>
                <th className="px-3 py-2">Recipes</th>
                <th className="px-3 py-2">Batches</th>
                <th className="px-3 py-2">Sales</th>
                <th className="px-3 py-2">Shops</th>
                <th className="px-3 py-2">Collections</th>
                <th className="px-3 py-2">Money</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.uid} className="border-t">
                  <td className="px-3 py-2">{u.displayName || u.email}</td>
                  <td className="px-3 py-2">{u.role}</td>
                  <td className="px-3 py-2">{u.counts.products}</td>
                  <td className="px-3 py-2">{u.counts.purchases}</td>
                  <td className="px-3 py-2">{u.counts.recipes}</td>
                  <td className="px-3 py-2">{u.counts.batches}</td>
                  <td className="px-3 py-2">{u.counts.sales}</td>
                  <td className="px-3 py-2">{u.counts.shops}</td>
                  <td className="px-3 py-2">{u.counts.collections}</td>
                  <td className="px-3 py-2">{u.counts.money}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
