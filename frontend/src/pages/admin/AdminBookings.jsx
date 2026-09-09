import { useEffect, useState } from 'react';

import { Link } from 'react-router-dom';

import DashboardLayout from '../../components/DashboardLayout';

import LoadingState from '../../components/LoadingState';

import StatusBadge from '../../components/StatusBadge';

import { TableScroll } from '../../components/layout/PageContainer';

import { adminAPI } from '../../api/client';



export default function AdminBookingsPage() {

  const [bookings, setBookings] = useState([]);

  const [loading, setLoading] = useState(true);



  useEffect(() => {

    adminAPI.bookings().then(({ data }) => {

      setBookings(data.results || data);

      setLoading(false);

    });

  }, []);



  return (

    <DashboardLayout role="ADMIN">

      <Link to="/admin" className="text-brand text-sm mb-4 inline-block">← Admin Dashboard</Link>

      <h1 className="text-2xl font-bold text-ink mb-6">All Bookings</h1>

      {loading ? <LoadingState /> : (

        <TableScroll>

          <table className="w-full min-w-[640px] text-sm bg-surface rounded-xl border border-line overflow-hidden">

            <thead className="bg-page text-left">

              <tr>

                <th className="px-4 py-3 font-semibold text-ink">ID</th>

                <th className="px-4 py-3 font-semibold text-ink">Service</th>

                <th className="px-4 py-3 font-semibold text-ink">Customer</th>

                <th className="px-4 py-3 font-semibold text-ink">Status</th>

              </tr>

            </thead>

            <tbody>

              {bookings.map((b) => (

                <tr key={b.id} className="border-t border-line">

                  <td className="px-4 py-3 font-medium">#{b.id}</td>

                  <td className="px-4 py-3">{b.category_detail?.name || '—'}</td>

                  <td className="px-4 py-3 text-muted">{b.customer_name || b.customer}</td>

                  <td className="px-4 py-3"><StatusBadge status={b.status} /></td>

                </tr>

              ))}

            </tbody>

          </table>

        </TableScroll>

      )}

    </DashboardLayout>

  );

}


