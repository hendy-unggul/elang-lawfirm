'use client';

import { Suspense } from 'react';
import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useSearchParams } from 'next/navigation';

function StatusContent() {
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [request, setRequest] = useState<any>(null);

  useEffect(() => {
    if (id) {
      supabase
        .from('contract_requests')
        .select('*')
        .eq('id', id)
        .single()
        .then(({ data }) => setRequest(data));
    }
  }, [id]);

  if (!request) return <div className="p-6">Loading...</div>;
  const validation = request.collateral_validation_result || {};

  return (
    <div className="p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Status Permintaan</h1>
      <p><strong>No. Request:</strong> {request.request_number}</p>
      <p><strong>Status:</strong> {request.status}</p>
      <p><strong>Risk Level:</strong> {validation.risk_level || 'Belum'}</p>
      {validation.recommendation && (
        <div className="bg-yellow-100 p-2 mt-2">
          <strong>Rekomendasi:</strong> {validation.recommendation}
        </div>
      )}
    </div>
  );
}

export default function StatusPage() {
  return (
    <Suspense fallback={<div className="p-6">Loading...</div>}>
      <StatusContent />
    </Suspense>
  );
}
