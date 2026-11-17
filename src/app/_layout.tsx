import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { FarmProvider } from '../context/FarmContext';
import { Colors } from '../constants/theme';

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <FarmProvider>
        <StatusBar style="dark" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: { backgroundColor: Colors.warmIvory },
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="index" options={{ animation: 'fade' }} />
          <Stack.Screen name="setup" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
          <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="device/connect" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="device/searching" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="device/wifi" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="device/connected" options={{ animation: 'slide_from_right' }} />
          <Stack.Screen name="device/status" options={{ animation: 'slide_from_right' }} />
        </Stack>
      </FarmProvider>
    </SafeAreaProvider>
  );
}
