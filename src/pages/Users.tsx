import { useEffect, useState } from 'react';
import { db } from '../lib/firebase';
import { collection, getDocs, query, where, updateDoc, doc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';
import { Check, X, Clock } from 'lucide-react';

export default function Users() {
  const { isAdmin, isSuperAdmin } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const handleApprove = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { status: 'approved' });
      setUsers(users.map(u => u.uid === uid ? { ...u, status: 'approved' } : u));
    } catch (error) {
      console.error('Error approving user:', error);
    }
  };

  const handleReject = async (uid: string) => {
    try {
      await updateDoc(doc(db, 'users', uid), { status: 'rejected' });
      setUsers(users.map(u => u.uid === uid ? { ...u, status: 'rejected' } : u));
    } catch (error) {
      console.error('Error rejecting user:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-green-100 text-green-700 rounded-full"><Check className="w-3 h-3" />Approved</span>;
      case 'rejected':
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-red-100 text-red-700 rounded-full"><X className="w-3 h-3" />Rejected</span>;
      default:
        return <span className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full"><Clock className="w-3 h-3" />Pending</span>;
    }
  };

  useEffect(() => {
    if (!isSuperAdmin) return;

    const load = async () => {
      setLoading(true);
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const docs = usersSnap.docs.map(d => ({ uid: d.id, ...((d.data() as any) || {}) }));

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
            status: u.status || 'pending',
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

  if (!isSuperAdmin) {
    return <div className="p-6">You do not have permission to view this page.</div>;
  }

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col lg:flex-row items-start gap-8">
        <div className="flex-1">
          <h1 className="text-2xl font-bold">Users</h1>
        </div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="hidden lg:block w-80"
        >
          <img src="/storyset/Farmers%20market-amico.svg" alt="Users Illustration" className="w-full" />
        </motion.div>
      </div>
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-xs text-gray-500 uppercase">
              <tr>
                <th className="px-3 py-2">User</th>
                <th className="px-3 py-2">Status</th>
                <th className="px-3 py-2">Role</th>
                <th className="px-3 py-2">Products</th>
                <th className="px-3 py-2">Purchases</th>
                <th className="px-3 py-2">Recipes</th>
                <th className="px-3 py-2">Batches</th>
                <th className="px-3 py-2">Sales</th>
                <th className="px-3 py-2">Shops</th>
                <th className="px-3 py-2">Collections</th>
                <th className="px-3 py-2">Money</th>
                <th className="px-3 py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => (
                <tr key={u.uid} className="border-t">
                  <td className="px-3 py-2">{u.displayName || u.email}</td>
                  <td className="px-3 py-2">{getStatusBadge(u.status)}</td>
                  <td className="px-3 py-2">{u.role}</td>
                  <td className="px-3 py-2">{u.counts.products}</td>
                  <td className="px-3 py-2">{u.counts.purchases}</td>
                  <td className="px-3 py-2">{u.counts.recipes}</td>
                  <td className="px-3 py-2">{u.counts.batches}</td>
                  <td className="px-3 py-2">{u.counts.sales}</td>
                  <td className="px-3 py-2">{u.counts.shops}</td>
                  <td className="px-3 py-2">{u.counts.collections}</td>
                  <td className="px-3 py-2">{u.counts.money}</td>
                  <td className="px-3 py-2">
                    {u.status === 'pending' && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleApprove(u.uid)}
                          className="p-1 bg-green-500 text-white rounded hover:bg-green-600"
                          title="Approve"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleReject(u.uid)}
                          className="p-1 bg-red-500 text-white rounded hover:bg-red-600"
                          title="Reject"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
