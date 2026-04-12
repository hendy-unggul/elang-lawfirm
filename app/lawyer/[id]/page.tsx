// Di dalam useEffect
const { data } = await supabase
  .from('contract_requests')
  .select('*, branch:branches(name)')
  .eq('id', id)
  .single();

// Kemudian di JSX, akses request.branch?.name
