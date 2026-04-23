import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { fetchWallet, topupWallet, fetchWalletTransactions, fetchPurchaseHistory } from '../services/api';
import type { Wallet, WalletTransaction, GamePurchase } from '../types';
import { formatPrice } from '../utils';

interface WalletPageProps {
  onBalanceUpdate?: (balance: number) => void;
}

type PaymentMethod = 'credit_card' | 'paypal' | 'debit_card';

export default function Wallet({ onBalanceUpdate }: WalletPageProps) {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [transactions, setTransactions] = useState<WalletTransaction[]>([]);
  const [purchases, setPurchases] = useState<GamePurchase[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTopupForm, setShowTopupForm] = useState(false);
  const [topupAmount, setTopupAmount] = useState('10');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('credit_card');
  const [processingTopup, setProcessingTopup] = useState(false);
  const [activeTab, setActiveTab] = useState<'balance' | 'transactions' | 'purchases'>('balance');

  useEffect(() => {
    loadWalletData();
  }, []);

  const loadWalletData = async () => {
    try {
      setLoading(true);
      const [walletData, txData, purchaseData] = await Promise.all([
        fetchWallet(),
        fetchWalletTransactions(),
        fetchPurchaseHistory(),
      ]);
      setWallet(walletData);
      setTransactions(txData);
      setPurchases(purchaseData);
      onBalanceUpdate?.(walletData.balance);
    } catch (error) {
      console.error('Failed to load wallet data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTopup = async () => {
    const amount = parseFloat(topupAmount);
    if (amount <= 0 || isNaN(amount)) {
      alert('Please enter a valid amount');
      return;
    }

    setProcessingTopup(true);
    try {
      const result = await topupWallet(amount, undefined, `${paymentMethod} topup`);
      setWallet((prev) => prev ? { ...prev, balance: result.newBalance } : null);
      setTransactions([
        result.transaction,
        ...transactions,
      ]);
      onBalanceUpdate?.(result.newBalance);
      setShowTopupForm(false);
      setTopupAmount('10');
      alert('✓ Topup successful!');
    } catch (error) {
      alert('Failed to process topup: ' + (error instanceof Error ? error.message : 'Unknown error'));
    } finally {
      setProcessingTopup(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-gray-400">Loading wallet...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="space-y-6"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Balance Card */}
      <motion.div 
        className="bg-linear-to-r from-blue-600/20 to-purple-600/20 border border-blue-500/50 rounded-lg p-6"
        whileHover={{ scale: 1.02 }}
      >
        <p className="text-gray-300 mb-2">Current Balance</p>
        <h1 className="text-5xl font-bold text-white mb-4">
          {formatPrice(wallet?.balance ?? 0)}
        </h1>
        <motion.button
          onClick={() => setShowTopupForm(!showTopupForm)}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white font-semibold"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          {showTopupForm ? 'Cancel' : 'Add Funds'}
        </motion.button>
      </motion.div>

      {/* Topup Form */}
      {showTopupForm && (
        <motion.div 
          className="bg-gray-900/50 border border-gray-700 rounded-lg p-6"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
        >
          <h2 className="text-xl font-bold text-white mb-4">Add Funds</h2>
          
          <div className="space-y-4">
            {/* Amount Input */}
            <div>
              <label className="block text-gray-300 mb-2">Amount (FCFA)</label>
              <input
                type="number"
                min="1"
                step="0.01"
                value={topupAmount}
                onChange={(e) => setTopupAmount(e.target.value)}
                className="w-full bg-gray-800 border border-gray-600 rounded px-4 py-2 text-white focus:outline-none focus:border-blue-500"
                placeholder="Enter amount"
              />
            </div>

            {/* Payment Method Selection */}
            <div>
              <label className="block text-gray-300 mb-2">Payment Method</label>
              <div className="space-y-2">
                {(['credit_card', 'paypal', 'debit_card'] as PaymentMethod[]).map((method) => (
                  <motion.label 
                    key={method}
                    className="flex items-center p-3 bg-gray-800 border border-gray-700 rounded hover:border-blue-500 cursor-pointer"
                    whileHover={{ backgroundColor: 'rgba(51, 65, 85, 1)' }}
                  >
                    <input
                      type="radio"
                      name="payment"
                      value={method}
                      checked={paymentMethod === method}
                      onChange={() => setPaymentMethod(method)}
                      aria-label={`Payment method: ${method.replace('_', ' ')}`}
                      className="mr-3"
                    />
                    <span className="text-white capitalize">
                      {method.replace('_', ' ')}
                    </span>
                  </motion.label>
                ))}
              </div>
            </div>

            {/* Buttons */}
            <div className="flex gap-3 pt-4">
              <motion.button
                onClick={handleTopup}
                disabled={processingTopup}
                className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-white font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {processingTopup ? 'Processing...' : 'Confirm Payment'}
              </motion.button>
              <motion.button
                onClick={() => setShowTopupForm(false)}
                className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-white font-semibold"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                Cancel
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        {(['balance', 'transactions', 'purchases'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold transition-all ${
              activeTab === tab
                ? 'border-b-2 border-blue-500 text-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'transactions' && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {transactions.length === 0 ? (
              <p className="text-gray-400">No transactions yet</p>
            ) : (
              transactions.map((tx) => (
                <motion.div
                  key={tx.id}
                  className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 flex justify-between items-center"
                  whileHover={{ backgroundColor: 'rgba(31, 41, 55, 1)' }}
                >
                  <div>
                    <p className="text-white font-semibold capitalize">{tx.transaction_type}</p>
                    <p className="text-xs text-gray-400">{tx.description}</p>
                    <p className="text-xs text-gray-500">{new Date(tx.created_at).toLocaleString()}</p>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      tx.transaction_type === 'topup' ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {tx.transaction_type === 'topup' ? '+' : '-'}{formatPrice(tx.amount)}
                    </p>
                    <p className={`text-xs capitalize ${
                      tx.status === 'completed' ? 'text-green-500' : 'text-yellow-500'
                    }`}>
                      {tx.status}
                    </p>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'purchases' && (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {purchases.length === 0 ? (
              <p className="text-gray-400">No purchases yet. Visit the store to buy games!</p>
            ) : (
              purchases.map((purchase) => (
                <motion.div
                  key={purchase.id}
                  className="bg-gray-900/50 border border-gray-700 rounded-lg p-3 flex justify-between items-center"
                  whileHover={{ backgroundColor: 'rgba(31, 41, 55, 1)' }}
                >
                  <div>
                    <p className="text-white font-semibold">{purchase.game_id}</p>
                    <p className="text-xs text-gray-400">{new Date(purchase.purchased_at).toLocaleString()}</p>
                  </div>
                  <p className="text-lg font-bold text-blue-400">-{formatPrice(purchase.price_paid)}</p>
                </motion.div>
              ))
            )}
          </div>
        )}

        {activeTab === 'balance' && (
          <motion.div
            className="bg-gray-900/50 border border-gray-700 rounded-lg p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <h3 className="text-lg font-semibold text-white mb-4">Wallet Info</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">Account Balance</span>
                <span className="text-white font-bold">{formatPrice(wallet?.balance ?? 0)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Account Created</span>
                <span className="text-white">{wallet ? new Date(wallet.created_at).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">Last Updated</span>
                <span className="text-white">{wallet ? new Date(wallet.updated_at).toLocaleString() : 'N/A'}</span>
              </div>
            </div>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
}
