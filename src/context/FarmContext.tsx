import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { FarmDetails, FieldUnit, NotificationItem } from '../types/farm';
import { DEFAULT_FARM_DETAILS, resolveClientCoords } from '../constants/agronomyData';
import {
  RootSenseApi,
  ApiWeather,
  ApiCropStress,
  ApiWaterRequirement,
  ApiTimeToStress,
  ApiSensorHealth,
  ApiDeviceRow,
  ApiSoilReading,
  ApiSoilHistoryResponse,
  ApiHeatmapResponse,
  ApiChatMessage,
} from '../services/api';

interface FarmContextType {
  farmDetails: FarmDetails | null;
  loading: boolean;
  refreshing: boolean;
  backendConnected: boolean;
  isConfigured: boolean;
  device: ApiDeviceRow | null;
  latestReading: ApiSoilReading | null;
  sensorHealth: ApiSensorHealth | null;
  weather: ApiWeather | null;
  cropStress: ApiCropStress | null;
  waterRequirement: ApiWaterRequirement | null;
  timeToStress: ApiTimeToStress | null;
  soilHistory: ApiSoilHistoryResponse | null;
  heatmap: ApiHeatmapResponse | null;
  notifications: NotificationItem[];
  unreadAlertCount: number;
  chatMessages: ApiChatMessage[];
  chatSending: boolean;
  geminiConfigured: boolean;
  geminiModel: string;
  assistantLanguage: string;
  setAssistantLanguage: (lang: string) => void;
  configureGeminiKey: (apiKey: string) => Promise<{ ok: boolean; error?: string }>;
  clearChatHistory: () => Promise<void>;
  refreshAll: () => Promise<void>;
  saveFarmDetails: (details: Partial<FarmDetails>) => Promise<void>;
  connectDevice: (wifiSsid: string, deviceId?: string) => Promise<void>;
  recordSoilReading: (moisture: number, soilTemp?: number) => Promise<void>;
  resetFarmDetails: () => Promise<void>;
  loadDemoFarm: () => Promise<void>;
  markAllNotificationsRead: () => Promise<void>;
  markNotificationRead: (id: string) => Promise<void>;
  sendChatMessage: (message: string, language?: string) => Promise<void>;
  getFirstName: () => string;
}

const STORAGE_KEY = '@rootsense_farm_details_v2';

function formatRelativeTime(isoDate: string): string {
  const diffMs = Math.max(0, Date.now() - new Date(isoDate).getTime());
  const mins = Math.floor(diffMs / 60_000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs > 1 ? 's' : ''} ago`;
  const days = Math.floor(hrs / 24);
  return `${days} day${days > 1 ? 's' : ''} ago`;
}

const FALLBACK_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n1',
    title: 'High crop water stress detected.',
    message: 'Your soil moisture is approaching the stress threshold.',
    time: '10 min ago',
    type: 'critical',
    read: false,
  },
  {
    id: 'n2',
    title: 'Soil moisture is decreasing rapidly.',
    message: 'A steady drop observed in the last 6 hours.',
    time: '1 hour ago',
    type: 'warning',
    read: false,
  },
  {
    id: 'n3',
    title: 'Rain expected within next 24 hours.',
    message: 'Light to moderate rainfall is likely tomorrow.',
    time: '3 hours ago',
    type: 'info',
    read: false,
  },
];

const FALLBACK_CHAT: ApiChatMessage[] = [
  {
    id: 'c1',
    sender: 'user',
    text: 'Should I irrigate today?',
    created_at: new Date().toISOString(),
  },
  {
    id: 'c2',
    sender: 'assistant',
    text: 'Based on your current soil moisture (38.5%) and the weather forecast (20% rain probability), you can wait. Rain is likely tomorrow, which may reduce the need for irrigation.',
    created_at: new Date().toISOString(),
  },
];

const FarmContext = createContext<FarmContextType | undefined>(undefined);

export const FarmProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [farmDetails, setFarmDetails] = useState<FarmDetails | null>(DEFAULT_FARM_DETAILS);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [backendConnected, setBackendConnected] = useState(false);

  const [device, setDevice] = useState<ApiDeviceRow | null>(null);
  const [latestReading, setLatestReading] = useState<ApiSoilReading | null>(null);
  const [sensorHealth, setSensorHealth] = useState<ApiSensorHealth | null>(null);
  const [weather, setWeather] = useState<ApiWeather | null>(null);
  const [cropStress, setCropStress] = useState<ApiCropStress | null>(null);
  const [waterRequirement, setWaterRequirement] = useState<ApiWaterRequirement | null>(null);
  const [timeToStress, setTimeToStress] = useState<ApiTimeToStress | null>(null);
  const [soilHistory, setSoilHistory] = useState<ApiSoilHistoryResponse | null>(null);
  const [heatmap, setHeatmap] = useState<ApiHeatmapResponse | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>(FALLBACK_NOTIFICATIONS);
  const [chatMessages, setChatMessages] = useState<ApiChatMessage[]>(FALLBACK_CHAT);
  const [chatSending, setChatSending] = useState(false);
  const [geminiConfigured, setGeminiConfigured] = useState(false);
  const [geminiModel, setGeminiModel] = useState('gemini-3.8-flash');
  const [assistantLanguage, setAssistantLanguage] = useState('en');

  const syncFromBackend = useCallback(async () => {
    try {
      const [dashboard, historyRes, heatmapRes, alertsRes, chatRes, aiStatus] = await Promise.all([
        RootSenseApi.getDashboard(),
        RootSenseApi.getSoilHistory(),
        RootSenseApi.getSoilHeatmap(7),
        RootSenseApi.getAlerts(),
        RootSenseApi.getAssistantHistory(),
        RootSenseApi.getAssistantStatus(),
      ]);

      const mappedFarm: FarmDetails = {
        name: dashboard.farm.farmer_name,
        location: dashboard.farm.location,
        latitude: dashboard.farm.latitude,
        longitude: dashboard.farm.longitude,
        fieldDimension: String(dashboard.farm.field_dimension),
        fieldUnit: (dashboard.farm.field_unit as FieldUnit) || 'Acres',
        irrigationType: dashboard.farm.irrigation_type,
        soilType: dashboard.farm.soil_type,
        cropGrown: dashboard.farm.crop_type,
        deviceId: dashboard.device?.device_id || 'RS-KA-01',
        deviceStatus: (dashboard.device?.status as 'Online' | 'Offline') || 'Online',
        soilMoisture: dashboard.latest?.moisture ?? 38.5,
        timeUntilStressHours: dashboard.timeToStress?.hours_to_moderate ?? 12,
        confidence: dashboard.timeToStress?.confidence_pct ?? 82,
        configuredAt: dashboard.farm.updated_at,
      };

      setFarmDetails(mappedFarm);
      setDevice(dashboard.device);
      setLatestReading(dashboard.latest);
      setSensorHealth(dashboard.sensorHealth);
      setWeather(dashboard.weather);
      setCropStress(dashboard.cropStress);
      setWaterRequirement(dashboard.waterRequirement);
      setTimeToStress(dashboard.timeToStress);
      setSoilHistory(historyRes);
      setHeatmap(heatmapRes);
      setNotifications(
        alertsRes.map((a) => ({
          id: a.id,
          title: a.title,
          message: a.message,
          time: formatRelativeTime(a.created_at),
          type: a.severity,
          read: a.read,
        }))
      );
      setChatMessages(chatRes);
      setGeminiConfigured(aiStatus.configured);
      setGeminiModel(aiStatus.model);
      setBackendConnected(true);
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(mappedFarm)).catch(() => {});
    } catch {
      setBackendConnected(false);
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      try {
        const cached = await AsyncStorage.getItem(STORAGE_KEY);
        if (cached) {
          setFarmDetails(JSON.parse(cached));
        }
      } catch {
        // ignore cache read error
      }
      await syncFromBackend();
      setLoading(false);
    };
    init();

    // Poll backend every 5 seconds for live field sensor updates from FastAPI
    const interval = setInterval(() => {
      syncFromBackend();
    }, 5_000);

    return () => clearInterval(interval);
  }, [syncFromBackend]);

  const refreshAll = useCallback(async () => {
    setRefreshing(true);
    await syncFromBackend();
    setRefreshing(false);
  }, [syncFromBackend]);

  const saveFarmDetails = async (details: Partial<FarmDetails>) => {
    const resolvedLocation = details.location || farmDetails?.location || DEFAULT_FARM_DETAILS.location;
    const coords = resolveClientCoords(resolvedLocation);
    const updated: FarmDetails = {
      ...(farmDetails || DEFAULT_FARM_DETAILS),
      ...details,
      latitude: details.latitude ?? coords.latitude,
      longitude: details.longitude ?? coords.longitude,
      configuredAt: new Date().toISOString(),
    };
    setFarmDetails(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated)).catch(() => {});

    try {
      await RootSenseApi.saveFarm({
        farmer_name: updated.name,
        location: updated.location,
        crop_type: updated.cropGrown,
        soil_type: updated.soilType,
        field_dimension: Number(updated.fieldDimension) || 2.5,
        field_unit: updated.fieldUnit,
        irrigation_type: updated.irrigationType,
      });
      await syncFromBackend();
    } catch {
      setBackendConnected(false);
    }
  };

  const connectDevice = async (wifiSsid: string, deviceId = 'RS-KA-01') => {
    try {
      await RootSenseApi.connectDevice({ wifi_ssid: wifiSsid, device_id: deviceId });
      await syncFromBackend();
    } catch {
      setBackendConnected(false);
    }
  };

  const recordSoilReading = async (moisture: number, soilTemp = 27.0) => {
    try {
      await RootSenseApi.postSoilReading(moisture, soilTemp);
      await syncFromBackend();
    } catch {
      setFarmDetails((prev) => (prev ? { ...prev, soilMoisture: moisture } : prev));
      setBackendConnected(false);
    }
  };

  const resetFarmDetails = async () => {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
      setFarmDetails(null);
    } catch (e) {
      console.error('Failed to reset farm details:', e);
    }
  };

  const loadDemoFarm = async () => {
    await saveFarmDetails(DEFAULT_FARM_DETAILS);
  };

  const markAllNotificationsRead = async () => {
    setNotifications([]);
    try {
      await RootSenseApi.markAllAlertsRead();
    } catch {
      // local optimistic clear remains
    }
  };

  const markNotificationRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n))
    );
    try {
      await RootSenseApi.markAlertRead(id);
    } catch {
      // local optimistic state remains
    }
  };

  const configureGeminiKey = async (apiKey: string): Promise<{ ok: boolean; error?: string }> => {
    try {
      const res = await RootSenseApi.configureGeminiKey(apiKey);
      if (res.ok) {
        setGeminiConfigured(true);
        setGeminiModel(res.model);
        setBackendConnected(true);
      }
      return { ok: res.ok, error: res.error };
    } catch (err) {
      return {
        ok: false,
        error: (err as Error).message || 'Could not reach backend server.',
      };
    }
  };

  const clearChatHistory = async () => {
    setChatMessages([]);
    try {
      await RootSenseApi.clearAssistantHistory();
    } catch {
      // local state cleared
    }
  };

  const sendChatMessage = async (message: string, language?: string) => {
    const clean = message.trim();
    if (!clean) return;
    const activeLang = language || assistantLanguage || 'en';

    const optimisticUser: ApiChatMessage = {
      id: `local-u-${Date.now()}`,
      sender: 'user',
      text: clean,
      created_at: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, optimisticUser]);
    setChatSending(true);

    try {
      const res = await RootSenseApi.sendAssistantChat(clean, activeLang);
      setChatMessages((prev) => [
        ...prev.filter((m) => m.id !== optimisticUser.id),
        res.userMessage,
        res.assistantMessage,
      ]);
      if (res.engine === 'gemini-live') {
        setGeminiConfigured(true);
      }
      setBackendConnected(true);
    } catch {
      setBackendConnected(false);
      const moisture = farmDetails?.soilMoisture ?? 38.5;
      const fallbackReply: ApiChatMessage = {
        id: `local-a-${Date.now() + 1}`,
        sender: 'assistant',
        text: `Unable to reach the Root Sense server right now. For ${farmDetails?.cropGrown || 'Ragi'} in ${farmDetails?.soilType || 'Red Loam'}, your last recorded soil moisture is ${moisture}%. Please check your connection and try again.`,
        created_at: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, fallbackReply]);
    } finally {
      setChatSending(false);
    }
  };

  const getFirstName = () => {
    if (!farmDetails?.name) return 'Farmer';
    const parts = farmDetails.name.trim().split(' ');
    return parts[0] || 'Farmer';
  };

  const isConfigured = Boolean(
    farmDetails &&
      farmDetails.name?.trim() &&
      farmDetails.cropGrown &&
      farmDetails.soilType
  );

  const unreadAlertCount = notifications.filter((n) => !n.read).length;

  return (
    <FarmContext.Provider
      value={{
        farmDetails,
        loading,
        refreshing,
        backendConnected,
        isConfigured,
        device,
        latestReading,
        sensorHealth,
        weather,
        cropStress,
        waterRequirement,
        timeToStress,
        soilHistory,
        heatmap,
        notifications,
        unreadAlertCount,
        chatMessages,
        chatSending,
        geminiConfigured,
        geminiModel,
        assistantLanguage,
        setAssistantLanguage,
        configureGeminiKey,
        clearChatHistory,
        refreshAll,
        saveFarmDetails,
        connectDevice,
        recordSoilReading,
        resetFarmDetails,
        loadDemoFarm,
        markAllNotificationsRead,
        markNotificationRead,
        sendChatMessage,
        getFirstName,
      }}
    >
      {children}
    </FarmContext.Provider>
  );
};

export const useFarm = () => {
  const context = useContext(FarmContext);
  if (!context) {
    throw new Error('useFarm must be used within a FarmProvider');
  }
  return context;
};
