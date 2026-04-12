'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

export default function LawyerDashboard() {
  const [requests, setRequests] = useState<any[]>([]);

  useEffect(() => {
    const fetchRequests = async () => {
      const { data } = await supabase
        .from('contract_requests')
        .select('*, branch:branches(name)')
        .in('status', ['drafting', 'erlangga_review', 'collateral_rejected'])
        .order('created_at', { ascending: false });
      setRequests(data || []);
    };
    fetchRequests();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard Review</h1>
      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr><th className="p-2">No</th><th>Cabang</th><th>Nasabah</th><th>Status</th><th>Aksi</th></tr>
        </thead>
        <tbody>
          {requests.map(req => (
            <tr key={req.id} className="border-t">
              <td className="p-2">{req.request_number}</td>
              <td>{req.branch?.name}</td>
              <td>{req.customer_name}</td>
              <td>{req.status}</td>
              <td><Link href={`/lawyer/${req.id}`} className="text-blue-600 underline">Detail</Link></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
