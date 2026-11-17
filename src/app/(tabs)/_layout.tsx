import React from 'react';
import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Shadows } from '../../constants/theme';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: Colors.pureWhite,
        tabBarInactiveTintColor: Colors.deepOlive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconPill, focused && styles.activeIconPill]}>
              <Ionicons
                name={focused ? 'home' : 'home-outline'}
                size={22}
                color={focused ? Colors.pureWhite : Colors.deepOlive}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="soil"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconPill, focused && styles.activeIconPill]}>
              <Ionicons
                name={focused ? 'leaf' : 'leaf-outline'}
                size={22}
                color={focused ? Colors.pureWhite : Colors.deepOlive}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="weather"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconPill, focused && styles.activeIconPill]}>
              <Ionicons
                name={focused ? 'partly-sunny' : 'partly-sunny-outline'}
                size={22}
                color={focused ? Colors.pureWhite : Colors.deepOlive}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="assistant"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconPill, focused && styles.activeIconPill]}>
              <Ionicons
                name={focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline'}
                size={22}
                color={focused ? Colors.pureWhite : Colors.deepOlive}
              />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="farm"
        options={{
          tabBarIcon: ({ focused }) => (
            <View style={[styles.iconPill, focused && styles.activeIconPill]}>
              <Ionicons
                name={focused ? 'person' : 'person-outline'}
                size={22}
                color={focused ? Colors.pureWhite : Colors.deepOlive}
              />
            </View>
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.softCream,
    borderTopWidth: 1,
    borderTopColor: Colors.sandBeige,
    height: Platform.OS === 'ios' ? 78 : 64,
    paddingTop: 8,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    ...Shadows.soft,
  },
  iconPill: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeIconPill: {
    backgroundColor: Colors.charcoal,
  },
});
