import React, { useState } from 'react';
import { Edit, Trash2, CheckCircle, XCircle, Clock, Ban, Link2, Eye } from 'lucide-react';
import type { Domain } from '../types';
import { domainPoolApi } from '../api';
import type { DomainBindingInfo } from '../types';
import { DomainBindingInfoDrawer } from './DomainBindingInfoDrawer';

interface DomainListProps {
  domains: Domain[];
  onEdit: (domain: Domain) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string) => void;
}

const statusConfig = {
  active: { label: '活跃', color: 'bg-green-100 text-green-700', icon: CheckCircle },
  inactive: { label: '未激活', color: 'bg-gray-100 text-gray-700', icon: XCircle },
  testing: { label: '测试中', color: 'bg-blue-100 text-blue-700', icon: Clock },
  banned: { label: '已封禁', color: 'bg-red-100 text-red-700', icon: Ban },
};

export const DomainList: React.FC<DomainListProps> = ({ domains, onEdit, onDelete, onToggle }) => {
  const [bindingInfoDrawer, setBindingInfoDrawer] = useState<{ domain: Domain; info: DomainBindingInfo | null } | null>(null);
  const [loadingBindingInfo, setLoadingBindingInfo] = useState<string | null>(null);

  const getHealthStatus = (domain: Domain) => {
    const failureRate = domain.totalRequests > 0 ? (domain.totalFailures / domain.totalRequests) * 100 : 0;
    if (domain.status === 'banned') return { color: 'text-red-600', label: '已封禁' };
    if (failureRate > 50) return { color: 'text-red-600', label: '高失败率' };
    if (failureRate > 20) return { color: 'text-yellow-600', label: '不稳定' };
    return { color: 'text-green-600', label: '健康' };
  };

  const handleViewBindingInfo = async (domain: Domain) => {
    setBindingInfoDrawer({ domain, info: null });
    setLoadingBindingInfo(domain.id);

    try {
      const response = await domainPoolApi.getDomainBindingInfo(domain.id);
      if (response.success && response.data) {
        setBindingInfoDrawer({ domain, info: response.data });
      }
    } catch (err) {
      console.error('Failed to fetch binding info:', err);
      // Still show drawer with null info
    } finally {
      setLoadingBindingInfo(null);
    }
  };

  const getBindingSummary = (domainId: string) => {
    // This is a placeholder - actual binding info would be tracked separately
    // For now, return null to indicate no binding info loaded
    return null;
  };

  if (domains.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-gray-400" />
        </div>
        <p className="text-gray-500 font-medium">暂无域名</p>
        <p className="text-gray-400 text-sm mt-1">请添加域名以开始使用域名池功能</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <table className="w-full">
        <thead className="bg-gray-50 border-b border-gray-200">
          <tr>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">域名</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">状态</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">权重/顺序</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">健康状态</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">失败率</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">绑定信息</th>
            <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">操作</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-200">
          {domains.map((domain) => {
            const config = statusConfig[domain.status];
            const StatusIcon = config.icon;
            const healthStatus = getHealthStatus(domain);
            const failureRate = domain.totalRequests > 0
              ? ((domain.totalFailures / domain.totalRequests) * 100).toFixed(1)
              : '0.0';

            return (
              <tr key={domain.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-mono text-sm font-medium text-gray-800">{domain.domain}</span>
                      <span className="text-xs text-gray-400">({domain.protocol.toUpperCase()})</span>
                    </div>
                    {domain.healthCheckUrl && (
                      <div className="text-xs text-gray-400 mt-1 font-mono">
                        {domain.healthCheckUrl}
                      </div>
                    )}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-bold ${config.color}`}>
                    <StatusIcon className="w-3 h-3" />
                    <span>{config.label}</span>
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-3 text-sm">
                    <span className="text-gray-600">权重: <span className="font-bold">{domain.weight}</span></span>
                    <span className="text-gray-300">|</span>
                    <span className="text-gray-600">顺序: <span className="font-bold">{domain.order}</span></span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm font-medium ${healthStatus.color}`}>
                    {healthStatus.label}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm">
                    <span className={`font-medium ${parseFloat(failureRate) > 20 ? 'text-red-600' : 'text-gray-600'}`}>
                      {failureRate}%
                    </span>
                    <span className="text-gray-400 text-xs ml-1">
                      ({domain.totalFailures}/{domain.totalRequests})
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <button
                    onClick={() => handleViewBindingInfo(domain)}
                    disabled={loadingBindingInfo === domain.id}
                    className="flex items-center space-x-1 text-sm text-blue-600 hover:text-blue-700 disabled:text-gray-400 disabled:cursor-not-allowed"
                  >
                    <Eye className="w-4 h-4" />
                    <span>
                      {loadingBindingInfo === domain.id ? '加载中...' : '查看绑定'}
                    </span>
                  </button>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => onToggle(domain.id)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title={domain.status === 'active' ? '停用' : '启用'}
                    >
                      {domain.status === 'active' ? (
                        <CheckCircle className="w-4 h-4" />
                      ) : (
                        <XCircle className="w-4 h-4" />
                      )}
                    </button>
                    <button
                      onClick={() => onEdit(domain)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => onDelete(domain.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* 域名绑定信息抽屉 */}
      {bindingInfoDrawer && (
        <DomainBindingInfoDrawer
          domain={bindingInfoDrawer.domain}
          bindingInfo={bindingInfoDrawer.info}
          onClose={() => setBindingInfoDrawer(null)}
        />
      )}
    </div>
  );
};
