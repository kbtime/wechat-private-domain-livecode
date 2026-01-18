import React from 'react';
import { QrCode, Edit3, BarChart2, Share2, Trash2, Server } from 'lucide-react';
import { LiveCode, DistributionMode } from '../types';

interface LiveCodeCardProps {
  code: LiveCode;
  onEdit: (code: LiveCode) => void;
  onStats: (code: LiveCode) => void;
  onPromote: (code: LiveCode) => void;
  onDomainConfig: (code: LiveCode) => void;
  onDelete: (id: string) => void;
}

export const LiveCodeCard: React.FC<LiveCodeCardProps> = ({ code, onEdit, onStats, onPromote, onDomainConfig, onDelete }) => {
  const currentSub = code.subCodes.find(s => s.status === 'enabled') || code.subCodes[0];
  const remaining = currentSub.threshold - currentSub.currentPv;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5">
        <div className="flex justify-between items-start mb-4">
          <h3 className="font-bold text-gray-800 text-lg">{code.name}</h3>
          <span className={`px-2 py-0.5 rounded text-xs font-medium ${
            code.status === 'running' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
          }`}>
            {code.status === 'running' ? '运行中' : '已暂停'}
          </span>
        </div>

        <div className="flex space-x-4 items-center mb-6">
          <div className="w-20 h-20 bg-gray-50 rounded border border-dashed border-gray-300 flex items-center justify-center p-1">
            <img src={currentSub.qrUrl} alt="QR Preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 grid grid-cols-3 gap-2">
            <div>
              <p className="text-xs text-gray-400 mb-1">总访问 PV</p>
              <p className="font-bold text-gray-800">{code.totalPv.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">当前子码</p>
              <p className="font-medium text-gray-700">#{currentSub.id.replace('s', '')}</p>
            </div>
            <div>
              <p className="text-xs text-gray-400 mb-1">剩余阈值</p>
              <p className="font-medium text-gray-700">{remaining}/{currentSub.threshold}</p>
            </div>
          </div>
        </div>

        <div className="flex border-t border-gray-50 -mx-5 -mb-5 divide-x divide-gray-50">
          <button
            onClick={() => onEdit(code)}
            className="flex-1 py-3 flex items-center justify-center space-x-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Edit3 className="w-4 h-4" />
            <span className="text-sm font-medium">编辑</span>
          </button>
          <button
            onClick={() => onStats(code)}
            className="flex-1 py-3 flex items-center justify-center space-x-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <BarChart2 className="w-4 h-4" />
            <span className="text-sm font-medium">数据</span>
          </button>
          <button
            onClick={() => onDomainConfig(code)}
            className="flex-1 py-3 flex items-center justify-center space-x-1 text-gray-600 hover:text-purple-600 hover:bg-purple-50 transition-colors"
          >
            <Server className="w-4 h-4" />
            <span className="text-sm font-medium">域名</span>
          </button>
          <button
            onClick={() => onPromote(code)}
            className="flex-1 py-3 flex items-center justify-center space-x-1 text-gray-600 hover:text-blue-600 hover:bg-blue-50 transition-colors"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-sm font-medium">推广码</span>
          </button>
          <button
            onClick={() => onDelete(code.id)}
            className="flex-1 py-3 flex items-center justify-center space-x-1 text-gray-600 hover:text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="text-sm font-medium">删除</span>
          </button>
        </div>
      </div>
    </div>
  );
};
