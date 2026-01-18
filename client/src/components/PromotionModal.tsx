import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Download, Loader2 } from 'lucide-react';
import { LiveCode } from '../types';
import { liveCodeApi } from '../api';

interface PromotionModalProps {
  code: LiveCode;
  onClose: () => void;
}

interface PromotionCodeData {
  shortUrl: string;
  qrCode: string;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({ code, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [promotionData, setPromotionData] = useState<PromotionCodeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取推广码信息
  useEffect(() => {
    const fetchPromotionCode = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const response = await liveCodeApi.getPromotionCode(code.id);
        setPromotionData(response.data || null);
      } catch (err) {
        setError(err instanceof Error ? err.message : '获取推广码失败');
        // 失败时使用活码自身的 mainUrl 作为回退
        setPromotionData({
          shortUrl: code.mainUrl,
          qrCode: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code.mainUrl)}`
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchPromotionCode();
  }, [code.id, code.mainUrl]);

  const handleCopy = () => {
    const urlToCopy = promotionData?.shortUrl || code.mainUrl;
    navigator.clipboard.writeText(urlToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    const qrUrl = promotionData?.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(code.mainUrl)}`;

    try {
      // 下载二维码图片
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `推广码-${code.name}.png`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      // 如果下载失败，尝试在新窗口打开
      window.open(qrUrl, '_blank');
    }
  };

  const displayUrl = promotionData?.shortUrl || code.mainUrl;
  const displayQrCode = promotionData?.qrCode || `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(code.mainUrl)}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl relative animate-in fade-in zoom-in duration-200">
        <div className="bg-blue-600 p-4 rounded-t-2xl flex items-center justify-between text-white">
          <h3 className="font-bold text-lg">推广码</h3>
          <button onClick={onClose} className="hover:bg-white/20 p-1 rounded-full transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-8 flex flex-col items-center">
          {/* 错误提示 */}
          {error && (
            <div className="mb-4 bg-red-50 text-red-600 px-4 py-2 rounded-lg text-sm w-full">
              {error}
            </div>
          )}

          {/* 加载状态 */}
          {isLoading ? (
            <div className="w-48 h-48 bg-gray-50 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
            </div>
          ) : (
            <>
              <div className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-sm mb-6">
                <div className="w-48 h-48 bg-gray-50 flex items-center justify-center overflow-hidden">
                   <img
                     src={displayQrCode}
                     alt="推广二维码"
                     className="w-full h-full"
                   />
                </div>
              </div>

              <div className="w-full flex items-center mb-8 border border-gray-200 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500">
                <div className="flex-1 px-3 py-3 bg-gray-50 text-gray-500 text-sm truncate font-mono">
                  {displayUrl}
                </div>
                <button
                  onClick={handleCopy}
                  className={`flex items-center space-x-1 px-4 py-3 font-medium transition-colors ${
                    copied ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  <span>{copied ? '已复制' : '复制链接'}</span>
                </button>
              </div>

              <button
                onClick={handleDownload}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white py-4 rounded-xl font-bold text-lg transition-transform active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Download className="w-5 h-5" />
                下载二维码图片
              </button>
            </>
          )}
        </div>

        {/* Floating Success Toast when copied */}
        {copied && (
          <div className="absolute -top-12 left-1/2 -translate-x-1/2 bg-white/95 px-4 py-2 rounded-full shadow-lg border border-green-100 flex items-center space-x-2 animate-in slide-in-from-top-4">
             <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center">
               <Check className="w-3 h-3 text-white" />
             </div>
             <span className="text-green-700 font-medium">链接复制成功</span>
          </div>
        )}
      </div>
    </div>
  );
};
