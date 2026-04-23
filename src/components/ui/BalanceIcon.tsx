import React from 'react';
import { motion } from 'framer-motion';
import { formatPrice } from '../../utils';

interface BalanceIconProps {
  balance: number;
  onClick?: () => void;
}

export default function BalanceIcon({ balance, onClick }: BalanceIconProps) {
  return (
    <motion.button
      onClick={onClick}
      className="flex items-center gap-2 px-3 py-1 bg-linear-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-full transition-all"
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
    >
      <span className="text-lg">💰</span>
      <span className="text-sm font-bold text-white">
        {formatPrice(balance)}
      </span>
    </motion.button>
  );
}
