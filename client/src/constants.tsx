
import { LiveCode, DistributionMode } from './types';

export const MOCK_LIVE_CODES: LiveCode[] = [
  {
    id: '1',
    name: '社群引流A',
    status: 'running',
    distributionMode: DistributionMode.THRESHOLD,
    totalPv: 1203,
    mainUrl: 'https://caoliao.api/link?id=1',
    subCodes: [
      { id: 's1', qrUrl: 'https://picsum.photos/200?random=1', threshold: 200, currentPv: 200, weight: 1, status: 'enabled' },
      { id: 's2', qrUrl: 'https://picsum.photos/200?random=2', threshold: 200, currentPv: 45, weight: 1, status: 'enabled' }
    ]
  },
  {
    id: '2',
    name: '活动引流B',
    status: 'paused',
    distributionMode: DistributionMode.RANDOM,
    totalPv: 876,
    mainUrl: 'https://caoliao.api/link?id=2',
    subCodes: [
      { id: 's3', qrUrl: 'https://picsum.photos/200?random=3', threshold: 100, currentPv: 100, weight: 1, status: 'enabled' }
    ]
  },
  {
    id: '3',
    name: '社群推广C',
    status: 'running',
    distributionMode: DistributionMode.THRESHOLD,
    totalPv: 2540,
    mainUrl: 'https://caoliao.api/link?id=3',
    subCodes: [
      { id: 's4', qrUrl: 'https://picsum.photos/200?random=4', threshold: 500, currentPv: 180, weight: 1, status: 'enabled' }
    ]
  },
  {
    id: '4',
    name: 'VIP会员招募',
    status: 'running',
    distributionMode: DistributionMode.FIXED,
    totalPv: 650,
    mainUrl: 'https://caoliao.api/link?id=4',
    subCodes: [
      { id: 's5', qrUrl: 'https://picsum.photos/200?random=5', threshold: 100, currentPv: 90, weight: 1, status: 'enabled' }
    ]
  }
];

export const CHART_DATA = [
  { name: 'Mon', pv: 400, uv: 240 },
  { name: 'Tue', pv: 300, uv: 139 },
  { name: 'Wed', pv: 200, uv: 980 },
  { name: 'Thu', pv: 278, uv: 390 },
  { name: 'Fri', pv: 189, uv: 480 },
  { name: 'Sat', pv: 239, uv: 380 },
  { name: 'Sun', pv: 349, uv: 430 },
];
