import React from 'react';
import { useStore } from '../context/StoreContext';
import { useRouter } from '../router/RouterContext';
import { ShieldCheck, ArrowRight, X } from 'lucide-react';

export const AdminModal: React.FC = () => {
  const { navigate } = useRouter();
  // Clean fallback redirect component
  return null;
};
