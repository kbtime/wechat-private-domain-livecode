import { X, Link2, Clock, Lock } from 'lucide-react';
import type { Domain, DomainBindingInfo } from '../types';

interface DomainBindingInfoDrawerProps {
  domain: Domain;
  bindingInfo: DomainBindingInfo | null;
  onClose: () => void;
}

export const DomainBindingInfoDrawer: React.FC<DomainBindingInfoDrawerProps> = ({
  domain,
  bindingInfo,
  onClose
}) => {
  const primaryBindings = bindingInfo?.boundToLiveCodes.filter(b => b.role === 'primary') || [];
  const fallbackBindings = bindingInfo?.boundToLiveCodes.filter(b => b.role === 'fallback') || [];

  return (
    <div className="fixed inset-0 z-50">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 z-0"
        onClick={onClose}
      />

      {/* 抽屉 */}
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-2xl flex flex-col overflow-hidden z-10">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Link2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">域名绑定信息</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 域名基本信息 */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
              域名信息
            </h3>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">域名</span>
                <span className="font-mono text-sm font-medium text-gray-800">
                  {domain.protocol}://{domain.domain}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">状态</span>
                <span className={`text-sm font-medium ${
                  domain.status === 'active' ? 'text-green-600' :
                  domain.status === 'inactive' ? 'text-gray-600' :
                  domain.status === 'testing' ? 'text-blue-600' :
                  'text-red-600'
                }`}>
                  {domain.status === 'active' ? '活跃' :
                   domain.status === 'inactive' ? '未激活' :
                   domain.status === 'testing' ? '测试中' : '已封禁'}
                </span>
              </div>
            </div>
          </div>

          {/* 绑定统计 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">
                {primaryBindings.length}
              </div>
              <div className="text-sm text-blue-700 mt-1">主域名绑定</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">
                {fallbackBindings.length}
              </div>
              <div className="text-sm text-purple-700 mt-1">备用域名绑定</div>
            </div>
          </div>

          {/* 主域名绑定列表 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>主域名绑定 ({primaryBindings.length})</span>
            </h3>
            {primaryBindings.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500">暂无主域名绑定</p>
              </div>
            ) : (
              <div className="space-y-2">
                {primaryBindings.map((binding) => (
                  <div
                    key={`${binding.liveCodeId}-primary`}
                    className="bg-amber-50 border border-amber-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800">
                        {binding.liveCodeName}
                      </span>
                      <span className="px-2 py-0.5 bg-amber-200 text-amber-800 text-xs rounded">
                        主域名
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        {new Date(binding.boundAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 备用域名绑定列表 */}
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">
              备用域名绑定 ({fallbackBindings.length})
            </h3>
            {fallbackBindings.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-200">
                <p className="text-sm text-gray-500">暂无备用域名绑定</p>
              </div>
            ) : (
              <div className="space-y-2">
                {fallbackBindings.map((binding) => (
                  <div
                    key={`${binding.liveCodeId}-fallback`}
                    className="bg-gray-50 border border-gray-200 rounded-lg p-3"
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-gray-800">
                        {binding.liveCodeName}
                      </span>
                      <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                        备用
                      </span>
                    </div>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        {new Date(binding.boundAt).toLocaleString()}
                      </span>
                      {binding.priority !== undefined && (
                        <span>优先级: {binding.priority}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 空状态提示 */}
          {bindingInfo && bindingInfo.boundToLiveCodes.length === 0 && (
            <div className="text-center py-12">
              <Link2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 font-medium">该域名未被任何活码绑定</p>
              <p className="text-gray-400 text-sm mt-1">
                在活码管理中配置域名后，此处将显示绑定信息
              </p>
            </div>
          )}
        </div>

        {/* 底部按钮 */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  );
};
