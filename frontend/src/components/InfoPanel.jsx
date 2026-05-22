import { useState } from 'react';

export default function InfoPanel({ conversationId, isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('info');

  if (!isOpen) {
    return null;
  }

  return (
    <div className="w-80 bg-slate-800 border-l border-slate-700 flex flex-col h-screen">
      {/* Header */}
      <div className="h-16 bg-slate-800 border-b border-slate-700 flex items-center justify-between px-6">
        <h3 className="font-semibold text-white">Details</h3>
        <button
          onClick={onClose}
          className="p-2 text-slate-400 hover:text-white transition-colors"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-700">
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'info'
              ? 'text-indigo-400 border-b-2 border-indigo-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Info
        </button>
        <button
          onClick={() => setActiveTab('members')}
          className={`flex-1 py-3 text-sm font-medium transition-colors ${
            activeTab === 'members'
              ? 'text-indigo-400 border-b-2 border-indigo-400'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Members
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {activeTab === 'info' ? (
          <div className="space-y-4">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Conversation ID</p>
              <p className="text-sm text-white font-mono">{conversationId}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-2">Created</p>
              <p className="text-sm text-white">{new Date().toLocaleDateString()}</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-slate-400">No members to display</p>
          </div>
        )}
      </div>
    </div>
  );
}
