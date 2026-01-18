import { useState, useEffect } from 'react';
import { Server, Lock, AlertCircle, Plus, Trash2, ChevronUp, ChevronDown, CheckCircle } from 'lucide-react';
import { liveCodeApi, domainPoolApi } from '../api';
import type { DomainConfig, Domain } from '../types';

interface DomainConfigPanelProps {
  liveCodeId: string;
  liveCodeName: string;
}

export function DomainConfigPanel({ liveCodeId, liveCodeName }: DomainConfigPanelProps) {
  const [config, setConfig] = useState<DomainConfig | null>(null);
  const [availableDomains, setAvailableDomains] = useState<Domain[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPrimaryConfirm, setShowPrimaryConfirm] = useState(false);
  const [selectedPrimaryDomain, setSelectedPrimaryDomain] = useState<string>('');
  const [selectedFallbackDomain, setSelectedFallbackDomain] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // 加载域名配置和可用域名列表
  useEffect(() => {
    loadData();
  }, [liveCodeId]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [configRes, domainsRes] = await Promise.all([
        liveCodeApi.getDomainConfig(liveCodeId),
        domainPoolApi.getDomains(),
      ]);

      if (configRes.success && configRes.data) {
        setConfig(configRes.data);
      }
      if (domainsRes.success && domainsRes.data) {
        setAvailableDomains(domainsRes.data.filter(d => d.status === 'active'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败');
    } finally {
      setLoading(false);
    }
  };

  // 切换故障转移
  const handleToggleFailover = async () => {
    if (!config) return;
    await saveConfig({
      ...config,
      fallbackDomains: {
        ...config.fallbackDomains,
        failoverEnabled: !config.fallbackDomains.failoverEnabled,
      },
    });
  };

  // 保存配置
  const saveConfig = async (newConfig: DomainConfig) => {
    setSaving(true);
    setError(null);
    setSuccessMsg(null);
    try {
      const res = await liveCodeApi.updateDomainConfig(liveCodeId, {
        fallbackDomains: newConfig.fallbackDomains,
        strategy: newConfig.strategy,
      });
      if (res.success && res.data) {
        setConfig(res.data);
        setSuccessMsg('保存成功');
        setTimeout(() => setSuccessMsg(null), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setSaving(false);
    }
  };

  // 绑定主域名
  const handleBindPrimaryDomain = async () => {
    if (!selectedPrimaryDomain) return;

    setSaving(true);
    setError(null);
    try {
      const res = await liveCodeApi.bindPrimaryDomain(liveCodeId, {
        domainId: selectedPrimaryDomain,
        confirmed: true,
      });
      if (res.success && res.data) {
        setConfig(res.data);
        setShowPrimaryConfirm(false);
        setSelectedPrimaryDomain('');
        setSuccessMsg('主域名绑定成功');
        setTimeout(() => setSuccessMsg(null), 2000);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '绑定失败');
    } finally {
      setSaving(false);
    }
  };

  // 添加炮灰域名
  const handleAddFallbackDomain = async () => {
    if (!selectedFallbackDomain || !config) return;

    // 检查是否已经添加
    if (config.fallbackDomains.domainIds.includes(selectedFallbackDomain)) {
      setError('该域名已在炮灰列表中');
      return;
    }

    const newConfig = {
      ...config,
      fallbackDomains: {
        ...config.fallbackDomains,
        domainIds: [...config.fallbackDomains.domainIds, selectedFallbackDomain],
        priority: [...config.fallbackDomains.priority, config.fallbackDomains.domainIds.length + 1],
      },
    };

    await saveConfig(newConfig);
    setSelectedFallbackDomain('');
  };

  // 删除炮灰域名
  const handleRemoveFallbackDomain = async (domainId: string) => {
    if (!config) return;

    const index = config.fallbackDomains.domainIds.indexOf(domainId);
    if (index === -1) return;

    const newDomainIds = config.fallbackDomains.domainIds.filter(id => id !== domainId);
    const newPriority = config.fallbackDomains.priority.filter((_, i) => i !== index);

    const newConfig = {
      ...config,
      fallbackDomains: {
        ...config.fallbackDomains,
        domainIds: newDomainIds,
        priority: newPriority,
      },
    };

    await saveConfig(newConfig);
  };

  // 上移炮灰域名
  const handleMoveUpFallbackDomain = async (domainId: string) => {
    if (!config) return;

    const index = config.fallbackDomains.domainIds.indexOf(domainId);
    if (index <= 0) return;

    const newDomainIds = [...config.fallbackDomains.domainIds];
    const newPriority = [...config.fallbackDomains.priority];

    // 交换位置
    [newDomainIds[index], newDomainIds[index - 1]] = [newDomainIds[index - 1], newDomainIds[index]];
    [newPriority[index], newPriority[index - 1]] = [newPriority[index - 1], newPriority[index]];

    const newConfig = {
      ...config,
      fallbackDomains: {
        ...config.fallbackDomains,
        domainIds: newDomainIds,
        priority: newPriority,
      },
    };

    await saveConfig(newConfig);
  };

  // 下移炮灰域名
  const handleMoveDownFallbackDomain = async (domainId: string) => {
    if (!config) return;

    const index = config.fallbackDomains.domainIds.indexOf(domainId);
    if (index === -1 || index >= config.fallbackDomains.domainIds.length - 1) return;

    const newDomainIds = [...config.fallbackDomains.domainIds];
    const newPriority = [...config.fallbackDomains.priority];

    // 交换位置
    [newDomainIds[index], newDomainIds[index + 1]] = [newDomainIds[index + 1], newDomainIds[index]];
    [newPriority[index], newPriority[index + 1]] = [newPriority[index + 1], newPriority[index]];

    const newConfig = {
      ...config,
      fallbackDomains: {
        ...config.fallbackDomains,
        domainIds: newDomainIds,
        priority: newPriority,
      },
    };

    await saveConfig(newConfig);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">加载中...</div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
        <p className="mt-2 text-sm text-gray-500">无法加载域名配置</p>
      </div>
    );
  }

  const hasPrimaryDomain = !!config.primaryDomain;
  const isPrimaryLocked = config.primaryDomain?.locked ?? false;

  // 获取未绑定的可用域名（用于主域名选择）
  const availableForPrimary = availableDomains.filter(d => {
    if (hasPrimaryDomain && d.id === config.primaryDomain?.domainId) return false;
    return true;
  });

  // 获取未添加的可用域名（用于炮灰域名选择）
  const availableForFallback = availableDomains.filter(d => {
    // 不能是主域名
    if (hasPrimaryDomain && d.id === config.primaryDomain?.domainId) return false;
    // 不能已经在炮灰列表中
    if (config.fallbackDomains.domainIds.includes(d.id)) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* 成功/错误提示 */}
      {successMsg && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
          <CheckCircle className="h-4 w-4 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {error && (
        <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          <AlertCircle className="h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-red-400 hover:text-red-600"
          >
            ✕
          </button>
        </div>
      )}

      {/* 主域名配置 */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-blue-600" />
            <h3 className="font-semibold text-gray-900">主域名配置</h3>
            {isPrimaryLocked && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-amber-100 text-amber-700 text-xs rounded-full">
                <Lock className="h-3 w-3" />
                已锁定
              </span>
            )}
          </div>
        </div>

        {hasPrimaryDomain ? (
          <div className="bg-white rounded-lg p-4 border border-amber-200">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-mono text-lg font-bold text-gray-900">
                  {config.primaryDomain?.protocol}://{config.primaryDomain?.domain}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  绑定时间: {config.primaryDomain?.lockedAt ? new Date(config.primaryDomain.lockedAt).toLocaleString() : '-'}
                </div>
              </div>
              {isPrimaryLocked && (
                <div className="text-xs text-amber-600 bg-amber-50 px-3 py-1 rounded">
                  ⚠️ 主域名已锁定，无法修改
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">
              选择一个活跃域名作为主域名。主域名一旦绑定将永久锁定，无法修改。
            </p>
            <div className="flex gap-2">
              <select
                value={selectedPrimaryDomain}
                onChange={(e) => setSelectedPrimaryDomain(e.target.value)}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                disabled={saving}
              >
                <option value="">选择主域名</option>
                {availableForPrimary.map((domain) => (
                  <option key={domain.id} value={domain.id}>
                    {domain.protocol}://{domain.domain}
                  </option>
                ))}
              </select>
              <button
                onClick={() => {
                  if (selectedPrimaryDomain) {
                    setShowPrimaryConfirm(true);
                  }
                }}
                disabled={!selectedPrimaryDomain || saving}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                绑定主域名
              </button>
            </div>
            {availableForPrimary.length === 0 && (
              <p className="text-sm text-gray-500 text-center py-4">
                没有可用的活跃域名，请先在域名池管理中添加域名
              </p>
            )}
          </div>
        )}
      </div>

      {/* 炮灰域名配置 */}
      <div className="border rounded-lg p-4 bg-gray-50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Server className="h-5 w-5 text-purple-600" />
            <h3 className="font-semibold text-gray-900">炮灰域名配置</h3>
            <span className="text-xs text-gray-500">
              ({config.fallbackDomains.domainIds.length} 个)
            </span>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={config.fallbackDomains.failoverEnabled}
              onChange={handleToggleFailover}
              disabled={saving}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">启用故障转移</span>
          </label>
        </div>

        {/* 炮灰域名列表 */}
        {config.fallbackDomains.domainIds.length > 0 ? (
          <div className="space-y-2 mb-3">
            {config.fallbackDomains.domainIds.map((domainId, index) => {
              const domain = availableDomains.find(d => d.id === domainId);
              if (!domain) return null;
              const isFirst = index === 0;
              const isLast = index === config.fallbackDomains.domainIds.length - 1;

              return (
                <div
                  key={domainId}
                  className="flex items-center gap-2 bg-white rounded-lg p-3 border border-gray-200"
                >
                  <span className="flex-shrink-0 w-6 h-6 flex items-center justify-center bg-purple-100 text-purple-700 text-xs font-bold rounded">
                    {index + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-mono text-sm font-medium text-gray-900 truncate">
                      {domain.protocol}://{domain.domain}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleMoveUpFallbackDomain(domainId)}
                      disabled={isFirst || saving}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="上移"
                    >
                      <ChevronUp className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleMoveDownFallbackDomain(domainId)}
                      disabled={isLast || saving}
                      className="p-1 text-gray-400 hover:text-gray-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="下移"
                    >
                      <ChevronDown className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleRemoveFallbackDomain(domainId)}
                      disabled={saving}
                      className="p-1 text-red-400 hover:text-red-600 disabled:opacity-30 disabled:cursor-not-allowed"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-sm text-gray-500 text-center py-4 mb-3 bg-white rounded-lg border border-dashed border-gray-300">
            暂无炮灰域名
          </p>
        )}

        {/* 添加炮灰域名 */}
        <div className="flex gap-2">
          <select
            value={selectedFallbackDomain}
            onChange={(e) => setSelectedFallbackDomain(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            disabled={saving || availableForFallback.length === 0}
          >
            <option value="">选择炮灰域名</option>
            {availableForFallback.map((domain) => (
              <option key={domain.id} value={domain.id}>
                {domain.protocol}://{domain.domain}
              </option>
            ))}
          </select>
          <button
            onClick={handleAddFallbackDomain}
            disabled={!selectedFallbackDomain || saving}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
          >
            <Plus className="h-4 w-4" />
            添加
          </button>
        </div>
        {availableForFallback.length === 0 && config.fallbackDomains.domainIds.length === 0 && (
          <p className="text-xs text-gray-400 mt-2 text-center">
            没有可用的域名，请先在域名池管理中添加域名
          </p>
        )}
      </div>

      {/* 主域名确认弹窗 */}
      {showPrimaryConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4 shadow-xl">
            <div className="flex items-center gap-3 mb-4">
              <AlertCircle className="h-8 w-8 text-amber-500" />
              <h3 className="text-lg font-medium text-gray-900">确认绑定主域名</h3>
            </div>
            <p className="text-gray-600 mb-4">
              您即将绑定主域名，这将是一个不可逆的操作：
            </p>
            <ul className="list-disc list-inside text-sm text-gray-600 mb-6 space-y-1">
              <li>主域名绑定后将永久锁定</li>
              <li>锁定后无法修改或更换</li>
              <li>仅管理员可强制解绑</li>
            </ul>
            <div className="bg-gray-100 rounded-lg p-3 mb-6">
              <div className="text-sm text-gray-600">选择的域名:</div>
              <div className="font-mono font-medium text-gray-900 mt-1">
                {availableDomains.find(d => d.id === selectedPrimaryDomain)?.protocol}://{availableDomains.find(d => d.id === selectedPrimaryDomain)?.domain}
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPrimaryConfirm(false);
                  setSelectedPrimaryDomain('');
                }}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50"
                disabled={saving}
              >
                取消
              </button>
              <button
                onClick={handleBindPrimaryDomain}
                disabled={saving}
                className="flex-1 px-4 py-2 bg-amber-600 text-white rounded-lg text-sm font-medium hover:bg-amber-700 disabled:opacity-50"
              >
                {saving ? '绑定中...' : '确认绑定'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
