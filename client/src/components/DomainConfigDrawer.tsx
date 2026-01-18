import { X, Server } from 'lucide-react';
import { DomainConfigPanel } from './DomainConfigPanel';

interface DomainConfigDrawerProps {
  liveCodeId: string;
  liveCodeName: string;
  onClose: () => void;
}

export const DomainConfigDrawer: React.FC<DomainConfigDrawerProps> = ({
  liveCodeId,
  liveCodeName,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50">
      {/* 背景遮罩 */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity duration-200 z-0"
        onClick={onClose}
      />

      {/* 抽屉 */}
      <div className="absolute right-0 top-0 h-full w-full max-w-2xl bg-white shadow-2xl flex flex-col overflow-hidden z-10">
        {/* 头部 */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <Server className="w-5 h-5 text-blue-600" />
            <h2 className="text-xl font-bold text-gray-800">域名配置</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6">
          <DomainConfigPanel liveCodeId={liveCodeId} liveCodeName={liveCodeName} />
        </div>
      </div>
    </div>
  );
};
