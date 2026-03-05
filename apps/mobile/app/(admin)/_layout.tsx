import React, { useState, useEffect } from 'react';
import {
  View,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  Modal,
  Pressable,
  Image,
} from 'react-native';
import { Slot, useRouter, usePathname } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { YStack, XStack, Text, ScrollView } from 'tamagui';
import {
  Menu,
  X,
  BarChart3,
  Users,
  Clock,
  Bell,
  Image as ImageIcon,
  FileText,
  Heart,
  Calendar,
  Coins,
  LogOut,
  Shield,
  ChevronRight,
} from '@tamagui/lucide-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { clearAdminToken } from '../../src/services/adminApi';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DRAWER_WIDTH = SCREEN_WIDTH;

interface MenuItem {
  key: string;
  label: string;
  icon: React.ReactNode;
  route: string;
}

const menuItems: MenuItem[] = [
  { key: 'dashboard', label: 'Dashboard', icon: <BarChart3 size={22} color="#ffffff" />, route: '/(admin)' },
  { key: 'users', label: 'Users', icon: <Users size={22} color="#ffffff" />, route: '/(admin)/users' },
  { key: 'pending', label: 'Pending Members', icon: <Clock size={22} color="#ffffff" />, route: '/(admin)/pending-members' },
  { key: 'notifications', label: 'Notifications', icon: <Bell size={22} color="#ffffff" />, route: '/(admin)/notifications' },
  { key: 'yearGroups', label: 'Year Groups', icon: <ImageIcon size={22} color="#ffffff" />, route: '/(admin)/year-groups' },
  { key: 'stories', label: 'Stories', icon: <FileText size={22} color="#ffffff" />, route: '/(admin)/stories' },
  { key: 'memorials', label: 'Memorials', icon: <Heart size={22} color="#ffffff" />, route: '/(admin)/memorials' },
  { key: 'reunions', label: 'Reunions', icon: <Calendar size={22} color="#ffffff" />, route: '/(admin)/reunions' },
  { key: 'projects', label: 'Projects', icon: <Coins size={22} color="#ffffff" />, route: '/(admin)/projects' },
];

function DrawerContent({
  onClose,
  currentRoute,
  onNavigate,
  onLogout,
}: {
  onClose: () => void;
  currentRoute: string;
  onNavigate: (route: string) => void;
  onLogout: () => void;
}) {
  const insets = useSafeAreaInsets();

  const isActive = (route: string) => {
    if (route === '/(admin)' && (currentRoute === '/(admin)' || currentRoute === '/(admin)/index')) {
      return true;
    }
    return currentRoute === route;
  };

  return (
    <View style={[styles.drawerContainer, { paddingTop: insets.top }]}>
      {/* Header */}
      <XStack
        paddingHorizontal="$4"
        paddingVertical="$4"
        alignItems="center"
        justifyContent="space-between"
        borderBottomWidth={1}
        borderBottomColor="rgba(255,255,255,0.1)"
      >
        <XStack alignItems="center" gap="$3">
          <View style={styles.shieldContainer}>
            <Shield size={24} color="#3b82f6" />
          </View>
          <YStack>
            <Text color="#ffffff" fontSize={18} fontWeight="bold">
              Admin Portal
            </Text>
            <Text color="#9ca3af" fontSize={12}>
              Potch Gim Alumni
            </Text>
          </YStack>
        </XStack>
        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
          <X size={24} color="#ffffff" />
        </TouchableOpacity>
      </XStack>

      {/* Menu Items */}
      <ScrollView style={styles.menuContainer} showsVerticalScrollIndicator={false}>
        {menuItems.map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[
              styles.menuItem,
              isActive(item.route) && styles.menuItemActive,
            ]}
            onPress={() => onNavigate(item.route)}
            activeOpacity={0.7}
          >
            <XStack alignItems="center" gap="$3" flex={1}>
              {item.icon}
              <Text
                color="#ffffff"
                fontSize={16}
                fontWeight={isActive(item.route) ? '600' : '400'}
              >
                {item.label}
              </Text>
            </XStack>
            <ChevronRight size={18} color="#6b7280" />
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Logout Button */}
      <View style={[styles.logoutContainer, { paddingBottom: insets.bottom + 16 }]}>
        <TouchableOpacity style={styles.logoutButton} onPress={onLogout} activeOpacity={0.7}>
          <LogOut size={20} color="#ef4444" />
          <Text color="#ef4444" fontSize={16} fontWeight="500" marginLeft="$3">
            Logout
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [slideAnim] = useState(new Animated.Value(-DRAWER_WIDTH));
  const [fadeAnim] = useState(new Animated.Value(0));
  const router = useRouter();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (drawerOpen) {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -DRAWER_WIDTH,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [drawerOpen]);

  const handleNavigate = (route: string) => {
    setDrawerOpen(false);
    setTimeout(() => {
      router.push(route as any);
    }, 100);
  };

  const handleLogout = async () => {
    setDrawerOpen(false);
    // Clear token from SecureStore and other admin data from AsyncStorage
    await clearAdminToken();
    await AsyncStorage.multiRemove(['adminUser', 'isAdminAuthenticated']);
    router.replace('/(auth)/login');
  };

  // Get current page title
  const getPageTitle = () => {
    const item = menuItems.find((m) => {
      if (m.route === '/(admin)' && (pathname === '/(admin)' || pathname === '/')) {
        return true;
      }
      return pathname.includes(m.route.replace('/(admin)', ''));
    });
    return item?.label || 'Admin';
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <XStack
          paddingHorizontal="$4"
          paddingVertical="$3"
          alignItems="center"
          justifyContent="space-between"
        >
          <XStack alignItems="center" gap="$3">
            <TouchableOpacity
              onPress={() => setDrawerOpen(true)}
              style={styles.menuButton}
              activeOpacity={0.7}
            >
              <Menu size={24} color="#ffffff" />
            </TouchableOpacity>
            <XStack alignItems="center" gap="$2">
              <Shield size={20} color="#3b82f6" />
              <Text color="#ffffff" fontSize={18} fontWeight="bold">
                {getPageTitle()}
              </Text>
            </XStack>
          </XStack>
        </XStack>
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Slot />
      </View>

      {/* Drawer Modal */}
      <Modal visible={drawerOpen} transparent animationType="none" onRequestClose={() => setDrawerOpen(false)}>
        <View style={styles.modalContainer}>
          {/* Overlay */}
          <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
            <Pressable style={StyleSheet.absoluteFill} onPress={() => setDrawerOpen(false)} />
          </Animated.View>

          {/* Drawer */}
          <Animated.View
            style={[
              styles.drawer,
              { width: DRAWER_WIDTH, transform: [{ translateX: slideAnim }] },
            ]}
          >
            <DrawerContent
              onClose={() => setDrawerOpen(false)}
              currentRoute={pathname}
              onNavigate={handleNavigate}
              onLogout={handleLogout}
            />
          </Animated.View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f0e8',
  },
  header: {
    backgroundColor: '#000000',
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
  },
  content: {
    flex: 1,
  },
  modalContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  drawer: {
    height: '100%',
    backgroundColor: '#000000',
  },
  drawerContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  shieldContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeButton: {
    padding: 8,
  },
  menuContainer: {
    flex: 1,
    paddingTop: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    marginHorizontal: 8,
    marginVertical: 2,
    borderRadius: 8,
  },
  menuItemActive: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  logoutContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
    paddingTop: 16,
    paddingHorizontal: 16,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
});
