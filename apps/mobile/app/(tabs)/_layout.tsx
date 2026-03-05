import React from 'react';
import { Tabs } from 'expo-router';
import { View, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { Home, Users, Calendar, User } from '@tamagui/lucide-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

// Custom Tab Bar matching web's MobileBottomNav
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();

  const getRouteIndex = (routeName: string) => {
    return state.routes.findIndex((route: any) => route.name === routeName);
  };

  const handlePress = (routeName: string) => {
    const routeIndex = getRouteIndex(routeName);
    const route = state.routes[routeIndex];
    const event = navigation.emit({
      type: 'tabPress',
      target: route.key,
      canPreventDefault: true,
    });

    if (!event.defaultPrevented) {
      navigation.navigate(routeName);
    }
  };

  const isActive = (routeName: string) => {
    const currentRoute = state.routes[state.index];
    return currentRoute.name === routeName;
  };

  return (
    <View style={[styles.tabBarContainer, { bottom: Math.max(insets.bottom, 8) }]}>
      <View style={styles.tabBarBackground}>
        <View style={styles.tabBar}>
          {/* Home */}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => handlePress('index')}
            activeOpacity={0.7}
          >
            <Home
              size={22}
              color={isActive('index') ? '#ffffff' : '#9ca3af'}
              fill={isActive('index') ? '#ffffff' : 'transparent'}
            />
          </TouchableOpacity>

          {/* Directory */}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => handlePress('directory')}
            activeOpacity={0.7}
          >
            <Users
              size={22}
              color={isActive('directory') ? '#ffffff' : '#9ca3af'}
              fill={isActive('directory') ? '#ffffff' : 'transparent'}
            />
          </TouchableOpacity>

          {/* Center Logo */}
          <View style={styles.logoContainer}>
            <Image
              source={require('../../assets/images/school-logo.png')}
              style={styles.logo}
              resizeMode="contain"
            />
          </View>

          {/* Reunions */}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => handlePress('reunions')}
            activeOpacity={0.7}
          >
            <Calendar
              size={22}
              color={isActive('reunions') ? '#ffffff' : '#9ca3af'}
              fill={isActive('reunions') ? '#ffffff' : 'transparent'}
            />
          </TouchableOpacity>

          {/* Profile */}
          <TouchableOpacity
            style={styles.tabButton}
            onPress={() => handlePress('profile')}
            activeOpacity={0.7}
          >
            <User
              size={22}
              color={isActive('profile') ? '#ffffff' : '#9ca3af'}
              fill={isActive('profile') ? '#ffffff' : 'transparent'}
            />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabBarContainer: {
    position: 'absolute',
    left: 8,
    right: 8,
    height: 64,
    borderRadius: 16,
    overflow: 'hidden',
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    // Shadow for Android
    elevation: 10,
  },
  tabBarBackground: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.92)',
    borderRadius: 16,
  },
  tabBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingHorizontal: 8,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
  },
  logo: {
    width: 44,
    height: 44,
  },
});

export default function TabLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{
        headerShown: false,  // No header - titles in screen content
      }}
    >
      <Tabs.Screen name="index" options={{ title: t('nav.my_year') }} />
      <Tabs.Screen name="directory" options={{ title: t('nav.directory') }} />
      <Tabs.Screen name="reunions" options={{ title: t('nav.reunions') }} />
      <Tabs.Screen name="profile" options={{ title: t('nav.profile') }} />
    </Tabs>
  );
}
