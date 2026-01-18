import React, { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';
import { Plus, Settings2, ShieldCheck, Loader2, ArrowUpRight, Activity, CheckCircle } from 'lucide-react';
import { Layout } from './components/Layout';
import { LiveCodeCard } from './components/LiveCodeCard';
import { PromotionModal } from './components/PromotionModal';
import { CreateEditDrawer } from './components/CreateEditDrawer';
import { DomainConfigDrawer } from './components/DomainConfigDrawer';
import { DomainList } from './components/DomainList';
import { AddEditDomainModal } from './components/AddEditDomainModal';
import { LiveCode, Domain, DomainPoolConfig, DomainPoolStatistics, AddDomainRequest, UpdateDomainRequest } from './types';
import { CHART_DATA } from './constants';
import { useAuth } from './hooks/useAuth';
import { liveCodeApi, domainPoolApi } from './api';

const App: React.FC = () => {
  const { isAuthenticated, isLoading: authLoading, login, logout } = useAuth();
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [activeView, setActiveView] = useState('live-codes');
  const [liveCodes, setLiveCodes] = useState<LiveCode[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCode, setSelectedCode] = useState<LiveCode | null>(null);
  const [showPromote, setShowPromote] = useState(false);
  const [showDrawer, setShowDrawer] = useState(false);
  const [drawerData, setDrawerData] = useState<LiveCode | undefined>(undefined);
  const [showDomainConfig, setShowDomainConfig] = useState(false);
  const [domainConfigCode, setDomainConfigCode] = useState<LiveCode | undefined>(undefined);

  // Domain pool state
  const [domains, setDomains] = useState<Domain[]>([]);
  const [poolConfig, setPoolConfig] = useState<DomainPoolConfig | null>(null);
  const [poolStatistics, setPoolStatistics] = useState<DomainPoolStatistics | null>(null);
  const [isLoadingDomains, setIsLoadingDomains] = useState(false);
  const [showDomainModal, setShowDomainModal] = useState(false);
  const [domainModalData, setDomainModalData] = useState<Domain | undefined>(undefined);
  const [healthCheckRunning, setHealthCheckRunning] = useState(false);

  // 获取活码列表
  const fetchLiveCodes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await liveCodeApi.getAll();
      setLiveCodes(response.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取活码列表失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 获取域名池数据
  const fetchDomainPoolData = async () => {
    setIsLoadingDomains(true);
    setError(null);
    try {
      const [configResponse, domainsResponse] = await Promise.all([
        domainPoolApi.getConfig(),
        domainPoolApi.getDomains(),
      ]);
      setPoolConfig(configResponse.data?.config || null);
      setPoolStatistics(configResponse.data?.statistics || null);
      setDomains(domainsResponse.data || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取域名池数据失败');
    } finally {
      setIsLoadingDomains(false);
    }
  };

  // 登录后获取活码列表
  useEffect(() => {
    if (isAuthenticated) {
      fetchLiveCodes();
      fetchDomainPoolData();
    }
  }, [isAuthenticated]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    const success = await login(password);
    if (!success) {
      setLoginError('密码错误，请重试');
    }
  };

  const handleLogout = async () => {
    await logout();
    setLiveCodes([]);
    setActiveView('live-codes');
  };

  const openEditDrawer = (code: LiveCode) => {
    setDrawerData(code);
    setShowDrawer(true);
  };

  const openCreateDrawer = () => {
    setDrawerData(undefined);
    setShowDrawer(true);
  };

  const openPromoteModal = (code: LiveCode) => {
    setSelectedCode(code);
    setShowPromote(true);
  };

  const openDomainConfigDrawer = (code: LiveCode) => {
    setDomainConfigCode(code);
    setShowDomainConfig(true);
  };

  const handleSave = async (newData: Partial<LiveCode>) => {
    setError(null);
    try {
      if (newData.id) {
        // 更新活码
        const response = await liveCodeApi.update(newData.id, newData);
        setLiveCodes(prev =>
          prev.map(c => (c.id === newData.id ? response.data! : c))
        );
      } else {
        // 创建新活码
        const response = await liveCodeApi.create({
          name: newData.name!,
          distributionMode: newData.distributionMode!,
          subCodes: newData.subCodes || []
        });
        setLiveCodes(prev => [response.data!, ...prev]);
      }
      setShowDrawer(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
      throw err; // 让抽屉组件知道保存失败
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这个活码吗？')) return;

    setError(null);
    try {
      await liveCodeApi.delete(id);
      setLiveCodes(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除失败');
    }
  };

  // Domain pool handlers
  const openAddDomainModal = () => {
    setDomainModalData(undefined);
    setShowDomainModal(true);
  };

  const openEditDomainModal = (domain: Domain) => {
    setDomainModalData(domain);
    setShowDomainModal(true);
  };

  const handleDomainSave = async (data: AddDomainRequest | UpdateDomainRequest) => {
    setError(null);
    try {
      if (domainModalData?.id) {
        const response = await domainPoolApi.updateDomain(domainModalData.id, data);
        setDomains(prev => prev.map(d => d.id === domainModalData.id ? response.data! : d));
      } else {
        const response = await domainPoolApi.addDomain(data as AddDomainRequest);
        setDomains(prev => [response.data!, ...prev]);
      }
      await fetchDomainPoolData();
      setShowDomainModal(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存域名失败');
      throw err;
    }
  };

  const handleDomainDelete = async (id: string) => {
    if (!confirm('确定要删除这个域名吗？')) return;

    setError(null);
    try {
      await domainPoolApi.deleteDomain(id);
      setDomains(prev => prev.filter(d => d.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : '删除域名失败');
    }
  };

  const handleDomainToggle = async (id: string) => {
    setError(null);
    try {
      const response = await domainPoolApi.toggleDomainStatus(id);
      setDomains(prev => prev.map(d => d.id === id ? response.data! : d));
    } catch (err) {
      setError(err instanceof Error ? err.message : '切换域名状态失败');
    }
  };

  const handleHealthCheck = async () => {
    setError(null);
    setHealthCheckRunning(true);
    try {
      await domainPoolApi.healthCheck();
      await fetchDomainPoolData();
    } catch (err) {
      setError(err instanceof Error ? err.message : '健康检查失败');
    } finally {
      setHealthCheckRunning(false);
    }
  };

  const handlePoolConfigUpdate = async (updates: Partial<DomainPoolConfig>) => {
    setError(null);
    try {
      const response = await domainPoolApi.updateConfig(updates);
      setPoolConfig(response.data || null);
    } catch (err) {
      setError(err instanceof Error ? err.message : '更新配置失败');
    }
  };

  // 加载状态
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
      </div>
    );
  }

  // 登录页
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl overflow-hidden animate-in fade-in zoom-in duration-300">
          <div className="p-8 pb-4 flex flex-col items-center">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mb-6 shadow-lg shadow-blue-200">
               <ShieldCheck className="text-white w-10 h-10" />
            </div>
            <h1 className="text-3xl font-extrabold text-blue-600 tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-400 mt-2 text-sm">请输入管理密码以继续</p>
          </div>

          <form onSubmit={handleLogin} className="p-8 pt-4">
            <div className="space-y-4">
              {loginError && (
                <div className="bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm">
                  {loginError}
                </div>
              )}
              <div className="relative">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-5 py-4 rounded-xl border border-gray-200 focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all pr-12 font-mono"
                  placeholder="请输入管理密码"
                />
                <Settings2 className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-300 w-5 h-5" />
              </div>
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg transition-all active:scale-[0.98] shadow-lg shadow-blue-200"
              >
                登录系统
              </button>
            </div>
          </form>

          <div className="bg-gray-50 p-4 border-t border-gray-100 flex justify-center">
             <span className="text-xs text-gray-400 font-mono">Powered by LinkOS v1.0</span>
          </div>
        </div>
      </div>
    );
  }

  const renderDashboard = () => (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { label: '总访问 PV', value: liveCodes.reduce((sum, c) => sum + c.totalPv, 0).toLocaleString(), change: '+12%', color: 'blue' },
          { label: '活跃活码', value: liveCodes.filter(c => c.status === 'running').length.toString(), change: `+${liveCodes.filter(c => c.status === 'running').length}`, color: 'green' },
          { label: '今日新增', value: '458', change: '+8%', color: 'purple' },
          { label: '平均转化率', value: '18.5%', change: '-2%', color: 'orange' },
        ].map((stat, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
            <p className="text-sm text-gray-400 font-medium mb-1">{stat.label}</p>
            <div className="flex items-end justify-between">
              <h3 className="text-2xl font-bold text-gray-800">{stat.value}</h3>
              <span className={`text-xs font-bold px-2 py-0.5 rounded ${stat.change.startsWith('+') ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                {stat.change}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">访问趋势分析</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Line type="monotone" dataKey="pv" stroke="#2563eb" strokeWidth={3} dot={{ r: 4, fill: '#2563eb' }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-6">流量分布</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={CHART_DATA}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                <Tooltip
                  contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)'}}
                />
                <Bar dataKey="uv" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLiveCodes = () => (
    <div className="animate-in fade-in duration-500">
      {/* 错误提示 */}
      {error && (
        <div className="mb-4 bg-red-50 text-red-600 px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-gray-800">我的活码</h2>
        <div className="flex items-center space-x-3">
           <button className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium shadow-sm transition-all">
             <Settings2 className="w-4 h-4" />
             <span>域名池配置</span>
           </button>
           <button
            onClick={openCreateDrawer}
            className="flex items-center space-x-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
           >
             <Plus className="w-5 h-5" />
             <span>新建活码</span>
           </button>
        </div>
      </div>

      {/* 加载状态 */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-6">
          {liveCodes.map(code => (
            <LiveCodeCard
              key={code.id}
              code={code}
              onEdit={openEditDrawer}
              onPromote={openPromoteModal}
              onDomainConfig={openDomainConfigDrawer}
              onStats={(c) => setActiveView('stats')}
              onDelete={handleDelete}
            />
          ))}

          {/* Empty State / Add Placeholder */}
          <button
            onClick={openCreateDrawer}
            className="border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center justify-center text-gray-400 hover:border-blue-300 hover:text-blue-400 transition-all bg-white/50"
          >
            <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mb-3 group-hover:bg-blue-50">
              <Plus className="w-8 h-8" />
            </div>
            <span className="font-bold">新建活码</span>
          </button>
        </div>
      )}
    </div>
  );

  const renderDomainPool = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* 错误提示 */}
      {error && (
        <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-red-400 hover:text-red-600">✕</button>
        </div>
      )}

      {/* 加载状态 */}
      {isLoadingDomains && (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
            <p className="text-gray-500">正在加载域名池数据...</p>
          </div>
        </div>
      )}

      {/* 数据为空时的提示 */}
      {!isLoadingDomains && !poolConfig && !error && (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center">
          <Server className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h3 className="text-lg font-bold text-gray-700 mb-2">域名池数据加载失败</h3>
          <p className="text-gray-500 mb-6">请检查后端服务是否正常运行，或刷新页面重试</p>
          <button
            onClick={fetchDomainPoolData}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold transition-colors"
          >
            重新加载
          </button>
        </div>
      )}

      {/* 统计卡片 */}
      {poolStatistics && (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">总域名数</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{poolStatistics.totalDomains}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">活跃域名</p>
            <p className="text-2xl font-bold text-green-600 mt-1">{poolStatistics.activeDomains}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">已封禁</p>
            <p className="text-2xl font-bold text-red-600 mt-1">{poolStatistics.bannedDomains}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">总请求数</p>
            <p className="text-2xl font-bold text-blue-600 mt-1">{poolStatistics.totalRequests.toLocaleString()}</p>
          </div>
          <div className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm">
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">成功率</p>
            <p className="text-2xl font-bold text-gray-800 mt-1">{poolStatistics.successRate.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {/* 配置区域 */}
      {poolConfig && (
        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
          <h3 className="text-lg font-bold text-gray-800 mb-4">域名池配置</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">选择策略</label>
              <select
                value={poolConfig.strategy}
                onChange={(e) => handlePoolConfigUpdate({ strategy: e.target.value as any })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              >
                <option value="round-robin">轮询 (Round-Robin)</option>
                <option value="random">随机 (Random)</option>
                <option value="weighted">加权 (Weighted)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">最大失败次数</label>
              <input
                type="number"
                min="1"
                value={poolConfig.maxFailures}
                onChange={(e) => handlePoolConfigUpdate({ maxFailures: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">健康检查间隔(秒)</label>
              <input
                type="number"
                min="10"
                value={poolConfig.healthCheckInterval}
                onChange={(e) => handlePoolConfigUpdate({ healthCheckInterval: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-500 mb-1">重试间隔(秒)</label>
              <input
                type="number"
                min="1"
                value={poolConfig.retryInterval}
                onChange={(e) => handlePoolConfigUpdate({ retryInterval: parseInt(e.target.value) })}
                className="w-full px-3 py-2 rounded-lg border border-gray-200 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={() => handlePoolConfigUpdate({ isActive: !poolConfig.isActive })}
                className={`w-full px-4 py-2 rounded-lg text-sm font-bold transition-colors flex items-center justify-center space-x-2 ${
                  poolConfig.isActive
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                <CheckCircle className="w-4 h-4" />
                <span>{poolConfig.isActive ? '已启用' : '已禁用'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 域名列表 */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-800">域名列表</h2>
          <div className="flex items-center space-x-3">
            <button
              onClick={handleHealthCheck}
              disabled={healthCheckRunning}
              className="flex items-center space-x-2 px-4 py-2 bg-white text-gray-600 rounded-lg border border-gray-200 hover:bg-gray-50 font-medium shadow-sm transition-all disabled:opacity-50"
            >
              <Activity className={`w-4 h-4 ${healthCheckRunning ? 'animate-pulse' : ''}`} />
              <span>{healthCheckRunning ? '检查中...' : '健康检查'}</span>
            </button>
            <button
              onClick={openAddDomainModal}
              className="flex items-center space-x-2 px-5 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-bold shadow-lg shadow-blue-200 transition-all active:scale-95"
            >
              <Plus className="w-5 h-5" />
              <span>添加域名</span>
            </button>
          </div>
        </div>

        {isLoadingDomains ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          </div>
        ) : (
          <DomainList
            domains={domains}
            onEdit={openEditDomainModal}
            onDelete={handleDomainDelete}
            onToggle={handleDomainToggle}
          />
        )}
      </div>
    </div>
  );

  return (
    <Layout
      activeView={activeView}
      onViewChange={setActiveView}
      onLogout={handleLogout}
    >
      {activeView === 'dashboard' && renderDashboard()}
      {activeView === 'live-codes' && renderLiveCodes()}
      {activeView === 'domain-pool' && renderDomainPool()}
      {activeView === 'stats' && <div className="text-center py-20 text-gray-400 italic">统计报表正在开发中...</div>}
      {activeView === 'settings' && <div className="text-center py-20 text-gray-400 italic">系统设置正在开发中...</div>}
      {activeView === 'users' && <div className="text-center py-20 text-gray-400 italic">用户管理正在开发中...</div>}

      {showPromote && selectedCode && (
        <PromotionModal code={selectedCode} onClose={() => setShowPromote(false)} />
      )}

      {showDrawer && (
        <CreateEditDrawer
          code={drawerData}
          onClose={() => setShowDrawer(false)}
          onSave={handleSave}
        />
      )}

      {showDomainConfig && domainConfigCode && (
        <DomainConfigDrawer
          liveCodeId={domainConfigCode.id}
          liveCodeName={domainConfigCode.name}
          onClose={() => setShowDomainConfig(false)}
        />
      )}

      {showDomainModal && (
        <AddEditDomainModal
          domain={domainModalData}
          onClose={() => setShowDomainModal(false)}
          onSave={handleDomainSave}
        />
      )}
    </Layout>
  );
};

export default App;
