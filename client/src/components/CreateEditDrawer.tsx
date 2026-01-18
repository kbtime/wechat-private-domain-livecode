import React, { useState, useEffect } from 'react';
import { X, Upload, Plus, Trash2, Loader2, Image as ImageIcon } from 'lucide-react';
import type { LiveCode, SubCode, DistributionMode } from '../types';
import { uploadApi } from '../api';

interface CreateEditDrawerProps {
  code?: LiveCode;
  onClose: () => void;
  onSave: (data: Partial<LiveCode>) => Promise<void>;
}

const DISTRIBUTION_MODES = [
  { value: 'THRESHOLD', label: '阈值模式', description: '按访问量阈值轮流切换' },
  { value: 'RANDOM', label: '随机模式', description: '按权重随机分配' },
  { value: 'FIXED', label: '固定模式', description: '固定显示单个二维码' }
];

const DEFAULT_THRESHOLD = 200;
const DEFAULT_WEIGHT = 1;

export const CreateEditDrawer: React.FC<CreateEditDrawerProps> = ({ code, onClose, onSave }) => {
  const isEdit = !!code;
  const [name, setName] = useState(code?.name || '');
  const [distributionMode, setDistributionMode] = useState<DistributionMode>(
    code?.distributionMode || 'THRESHOLD'
  );
  const [subCodes, setSubCodes] = useState<SubCode[]>(code?.subCodes || []);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  // 生成唯一 ID
  const generateId = () => `subcode_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // 添加新子码
  const addSubCode = () => {
    const newSubCode: SubCode = {
      id: generateId(),
      qrUrl: '',
      threshold: DEFAULT_THRESHOLD,
      currentPv: 0,
      weight: DEFAULT_WEIGHT,
      status: 'enabled'
    };
    setSubCodes([...subCodes, newSubCode]);
  };

  // 删除子码
  const removeSubCode = (index: number) => {
    setSubCodes(subCodes.filter((_, i) => i !== index));
  };

  // 更新子码字段
  const updateSubCode = (index: number, field: keyof SubCode, value: any) => {
    const updated = [...subCodes];
    updated[index] = { ...updated[index], [field]: value };
    setSubCodes(updated);
  };

  // 处理文件上传
  const handleFileUpload = async (index: number, file: File) => {
    try {
      const response = await uploadApi.uploadFile(file);
      if (response.success && response.data) {
        updateSubCode(index, 'qrUrl', response.data.url);
      } else {
        throw new Error(response.message || '上传失败');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : '上传失败，请重试');
    }
  };

  // 处理拖拽上传
  const handleDrop = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(null);
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      handleFileUpload(index, file);
    }
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDragLeave = () => {
    setDragOverIndex(null);
  };

  // 处理点击上传
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileUpload(index, file);
    }
  };

  // 验证表单
  const validateForm = (): string | null => {
    if (!name.trim()) {
      return '请输入活码名称';
    }
    if (subCodes.length === 0) {
      return '请至少添加一个二维码';
    }
    const hasEmptyQr = subCodes.some(sc => !sc.qrUrl);
    if (hasEmptyQr) {
      return '请为所有子码上传二维码图片';
    }
    if (distributionMode === 'THRESHOLD') {
      const hasInvalidThreshold = subCodes.some(sc => sc.threshold <= 0);
      if (hasInvalidThreshold) {
        return '阈值模式下，所有子码的阈值必须大于 0';
      }
    }
    if (distributionMode === 'RANDOM') {
      const hasInvalidWeight = subCodes.some(sc => sc.weight <= 0);
      if (hasInvalidWeight) {
        return '随机模式下，所有子码的权重必须大于 0';
      }
    }
    return null;
  };

  // 保存
  const handleSave = async () => {
    const validationError = validateForm();
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const data: Partial<LiveCode> = {
        name,
        distributionMode,
        subCodes
      };
      if (isEdit) {
        data.id = code.id;
      }
      await onSave(data);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setIsSubmitting(false);
    }
  };

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
          <h2 className="text-xl font-bold text-gray-800">
            {isEdit ? '编辑活码' : '新建活码'}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* 内容区 */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* 错误提示 */}
          {error && (
            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-lg text-sm">
              {error}
              <button
                onClick={() => setError(null)}
                className="ml-2 text-red-400 hover:text-red-600"
              >
                ✕
              </button>
            </div>
          )}

          {/* 基本信息 */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
              基本信息
            </h3>

            {/* 活码名称 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                活码名称 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="输入活码名称，如：客服二维码"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              />
            </div>

            {/* 分配模式 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                分配模式 <span className="text-red-500">*</span>
              </label>
              <div className="grid grid-cols-3 gap-3">
                {DISTRIBUTION_MODES.map((mode) => (
                  <button
                    key={mode.value}
                    onClick={() => setDistributionMode(mode.value as DistributionMode)}
                    className={`p-3 rounded-lg border-2 text-left transition-all ${
                      distributionMode === mode.value
                        ? 'border-blue-500 bg-blue-50 text-blue-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="font-medium text-sm">{mode.label}</div>
                    <div className="text-xs text-gray-500 mt-1">{mode.description}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 子码管理 */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide">
                子二维码
              </h3>
              <button
                onClick={addSubCode}
                className="flex items-center space-x-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                <span>添加</span>
              </button>
            </div>

            {subCodes.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200">
                <p className="text-gray-400">暂无子码，点击上方按钮添加</p>
              </div>
            ) : (
              <div className="space-y-4">
                {subCodes.map((subCode, index) => (
                  <div
                    key={subCode.id}
                    className="bg-gray-50 rounded-lg p-4 space-y-3"
                  >
                    {/* 头部：序号 + 删除按钮 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-600">
                        子码 #{index + 1}
                      </span>
                      {subCodes.length > 1 && (
                        <button
                          onClick={() => removeSubCode(index)}
                          className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* 二维码上传区域 */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        二维码图片 <span className="text-red-500">*</span>
                      </label>
                      <div
                        onDrop={(e) => handleDrop(e, index)}
                        onDragOver={(e) => handleDragOver(e, index)}
                        onDragLeave={handleDragLeave}
                        onClick={() => document.getElementById(`file-input-${index}`)?.click()}
                        className={`relative border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-colors ${
                          dragOverIndex === index
                            ? 'border-blue-500 bg-blue-50'
                            : subCode.qrUrl
                            ? 'border-green-500 bg-green-50'
                            : 'border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          id={`file-input-${index}`}
                          type="file"
                          accept="image/*"
                          onChange={(e) => handleFileInput(e, index)}
                          className="hidden"
                        />
                        {subCode.qrUrl ? (
                          <div className="space-y-2">
                            <img
                              src={subCode.qrUrl}
                              alt="QR Code"
                              className="w-20 h-20 mx-auto object-contain"
                            />
                            <p className="text-xs text-green-600">二维码已上传</p>
                            <p className="text-xs text-gray-400">点击或拖拽更换图片</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <ImageIcon className="w-10 h-10 text-gray-400 mx-auto" />
                            <p className="text-sm text-gray-600">点击或拖拽图片到此处</p>
                            <p className="text-xs text-gray-400">支持 PNG、JPG、GIF 格式</p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 根据模式显示不同的配置项 */}
                    {distributionMode === 'THRESHOLD' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          访问阈值 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={subCode.threshold}
                          onChange={(e) => updateSubCode(index, 'threshold', parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="如：200"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          访问量达到此值后切换到下一个子码
                        </p>
                      </div>
                    )}

                    {distributionMode === 'RANDOM' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          权重 <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          min="1"
                          value={subCode.weight}
                          onChange={(e) => updateSubCode(index, 'weight', parseInt(e.target.value) || 0)}
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
                          placeholder="如：1"
                        />
                        <p className="text-xs text-gray-400 mt-1">
                          权重越高，被选中的概率越大
                        </p>
                      </div>
                    )}

                    {/* 状态切换 */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">启用状态</span>
                      <button
                        onClick={() => updateSubCode(
                          index,
                          'status',
                          subCode.status === 'enabled' ? 'disabled' : 'enabled'
                        )}
                        className={`relative w-12 h-6 rounded-full transition-colors ${
                          subCode.status === 'enabled' ? 'bg-blue-600' : 'bg-gray-300'
                        }`}
                      >
                        <span
                          className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                            subCode.status === 'enabled' ? 'left-7' : 'left-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 底部按钮 */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors font-medium disabled:opacity-50"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>保存中...</span>
              </>
            ) : (
              <span>{isEdit ? '保存修改' : '创建活码'}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};