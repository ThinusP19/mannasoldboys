import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  TextInput,
  FlatList,
  Modal,
  Linking,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { YStack, XStack, Text, Spinner } from 'tamagui';
import {
  Search,
  X,
  User,
  Mail,
  Calendar,
  Shield,
  UserCheck,
  UserX,
  Key,
  Trash2,
  MoreVertical,
  Filter,
  AlertCircle,
} from '@tamagui/lucide-icons';

import { adminApi, AdminUser } from '../../src/services/adminApi';

type FilterType = 'all' | 'members' | 'non-members';

interface UserCardProps {
  user: AdminUser;
  onResetPassword: () => void;
  onToggleMembership: () => void;
  onDelete: () => void;
}

function UserCard({ user, onResetPassword, onToggleMembership, onDelete }: UserCardProps) {
  const [showActions, setShowActions] = useState(false);

  return (
    <View style={styles.userCard}>
      <XStack alignItems="flex-start" gap="$3">
        {/* Avatar */}
        <View style={[styles.avatar, user.isMember && styles.avatarMember]}>
          <User size={24} color={user.isMember ? '#22c55e' : '#6b7280'} />
        </View>

        {/* Info */}
        <YStack flex={1} gap="$1">
          <XStack alignItems="center" gap="$2">
            <Text color="#1a1f2c" fontSize={16} fontWeight="600" numberOfLines={1} flex={1}>
              {user.name}
            </Text>
            {user.hasPasswordResetRequest && user.role !== 'admin' && (
              <View style={styles.resetRequestBadge}>
                <AlertCircle size={14} color="#f97316" />
              </View>
            )}
            {user.role === 'admin' && (
              <View style={styles.adminBadge}>
                <Shield size={12} color="#d4a84b" />
                <Text color="#d4a84b" fontSize={10} fontWeight="600" marginLeft={2}>
                  ADMIN
                </Text>
              </View>
            )}
          </XStack>

          <XStack alignItems="center" gap="$1">
            <Mail size={12} color="#6b7280" />
            <Text color="#6b7280" fontSize={12} numberOfLines={1}>
              {user.email}
            </Text>
          </XStack>

          {user.profile?.year && (
            <XStack alignItems="center" gap="$1">
              <Calendar size={12} color="#6b7280" />
              <Text color="#6b7280" fontSize={12}>
                Class of {user.profile.year}
              </Text>
            </XStack>
          )}

          <XStack alignItems="center" gap="$2" marginTop="$1">
            <View style={[styles.statusBadge, user.isMember ? styles.memberBadge : styles.nonMemberBadge]}>
              {user.isMember ? (
                <UserCheck size={12} color="#22c55e" />
              ) : (
                <UserX size={12} color="#6b7280" />
              )}
              <Text
                color={user.isMember ? '#22c55e' : '#6b7280'}
                fontSize={11}
                fontWeight="500"
                marginLeft={4}
              >
                {user.isMember ? 'Member' : 'Non-Member'}
              </Text>
            </View>
            {user.isMember && user.monthlyAmount && (
              <Text color="#6b7280" fontSize={11}>
                R{user.monthlyAmount}/mo
              </Text>
            )}
          </XStack>
        </YStack>

        {/* Actions Button */}
        <TouchableOpacity
          style={styles.moreButton}
          onPress={() => setShowActions(!showActions)}
          activeOpacity={0.7}
        >
          <MoreVertical size={20} color="#6b7280" />
        </TouchableOpacity>
      </XStack>

      {/* Actions Panel */}
      {showActions && (
        <View style={styles.actionsPanel}>
          <TouchableOpacity style={styles.actionButton} onPress={onResetPassword} activeOpacity={0.7}>
            <Key size={16} color="#3b82f6" />
            <Text color="#3b82f6" fontSize={13} fontWeight="500" marginLeft="$2">
              Reset Password
            </Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionButton} onPress={onToggleMembership} activeOpacity={0.7}>
            {user.isMember ? (
              <>
                <UserX size={16} color="#f59e0b" />
                <Text color="#f59e0b" fontSize={13} fontWeight="500" marginLeft="$2">
                  Remove Membership
                </Text>
              </>
            ) : (
              <>
                <UserCheck size={16} color="#22c55e" />
                <Text color="#22c55e" fontSize={13} fontWeight="500" marginLeft="$2">
                  Make Member
                </Text>
              </>
            )}
          </TouchableOpacity>

          {user.role !== 'admin' && (
            <TouchableOpacity style={styles.actionButton} onPress={onDelete} activeOpacity={0.7}>
              <Trash2 size={16} color="#ef4444" />
              <Text color="#ef4444" fontSize={13} fontWeight="500" marginLeft="$2">
                Delete User
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
}

export default function UsersScreen() {
  const { t } = useTranslation();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Password reset dialog state
  const [passwordResetDialog, setPasswordResetDialog] = useState<{ open: boolean; user: AdminUser | null }>({ open: false, user: null });
  const [newPassword, setNewPassword] = useState('');

  const fetchUsers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await adminApi.getUsers();
      setUsers(data);
    } catch (err: any) {
      setError(err.error || 'Failed to load users');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = useMemo(() => {
    let result = users;

    // Apply filter
    if (filter === 'members') {
      result = result.filter((u) => u.isMember);
    } else if (filter === 'non-members') {
      result = result.filter((u) => !u.isMember);
    }

    // Apply search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (u) =>
          u.name.toLowerCase().includes(query) ||
          u.email.toLowerCase().includes(query) ||
          (u.profile?.year && u.profile.year.toString().includes(query))
      );
    }

    return result;
  }, [users, filter, searchQuery]);

  const handleResetPassword = (user: AdminUser) => {
    setNewPassword('');
    setPasswordResetDialog({ open: true, user });
  };

  const confirmResetPassword = async () => {
    if (!passwordResetDialog.user) return;

    if (!newPassword || newPassword.length < 6) {
      Alert.alert('Invalid Password', 'Password must be at least 6 characters long.');
      return;
    }

    try {
      setActionLoading(passwordResetDialog.user.id);
      await adminApi.resetUserPassword(passwordResetDialog.user.id, newPassword);

      // Update local state to clear the reset request flag
      setUsers((prev) =>
        prev.map((u) =>
          u.id === passwordResetDialog.user!.id
            ? { ...u, hasPasswordResetRequest: false }
            : u
        )
      );

      const user = passwordResetDialog.user;
      setPasswordResetDialog({ open: false, user: null });
      setNewPassword('');

      // Offer to send via WhatsApp if phone number available
      const phone = user.profile?.phone?.replace(/\D/g, '');
      if (phone) {
        Alert.alert(
          'Password Reset Successful',
          `Password has been reset. Would you like to send it via WhatsApp?`,
          [
            { text: 'No', style: 'cancel' },
            {
              text: 'Send via WhatsApp',
              onPress: () => {
                const message = encodeURIComponent(
                  `Hi ${user.name},\n\nYour Potch Gim Alumni password has been reset.\n\nNew Password: ${newPassword}\n\nPlease log in and change your password.`
                );
                Linking.openURL(`whatsapp://send?phone=${phone}&text=${message}`).catch(() => {
                  Alert.alert('Error', 'WhatsApp is not installed on this device');
                });
              },
            },
          ]
        );
      } else {
        Alert.alert(
          'Password Reset',
          `New password for ${user.name}:\n\n${newPassword}\n\nPlease share this securely.`
        );
      }
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to reset password');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleMembership = async (user: AdminUser) => {
    const action = user.isMember ? 'remove membership from' : 'make member';
    Alert.alert(
      user.isMember ? 'Remove Membership' : 'Add Membership',
      `Are you sure you want to ${action} ${user.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            try {
              setActionLoading(user.id);
              await adminApi.updateUserMembership(user.id, {
                isMember: !user.isMember,
                monthlyAmount: user.isMember ? undefined : 50,
              });
              setUsers((prev) =>
                prev.map((u) =>
                  u.id === user.id
                    ? { ...u, isMember: !u.isMember, monthlyAmount: u.isMember ? null : 50 }
                    : u
                )
              );
              Alert.alert('Success', `${user.name}'s membership has been updated.`);
            } catch (err: any) {
              Alert.alert('Error', err.error || 'Failed to update membership');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const handleDeleteUser = async (user: AdminUser) => {
    Alert.alert(
      'Delete User',
      `Are you sure you want to permanently delete ${user.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setActionLoading(user.id);
              await adminApi.deleteUser(user.id);
              setUsers((prev) => prev.filter((u) => u.id !== user.id));
              Alert.alert('Success', 'User has been deleted.');
            } catch (err: any) {
              Alert.alert('Error', err.error || 'Failed to delete user');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner size="large" color="#1e3a5f" />
        <Text color="#6b7280" marginTop="$3">
          {t('admin.loading_users')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('admin.search_users')}
            placeholderTextColor="#000000"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <X size={18} color="#9ca3af" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Filter Tabs */}
      <XStack paddingHorizontal="$4" paddingBottom="$3" gap="$2">
        {(['all', 'members', 'non-members'] as FilterType[]).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterTab, filter === f && styles.filterTabActive]}
            onPress={() => setFilter(f)}
            activeOpacity={0.7}
          >
            <Text
              color={filter === f ? '#ffffff' : '#6b7280'}
              fontSize={13}
              fontWeight={filter === f ? '600' : '400'}
            >
              {f === 'all' ? t('admin.all') : f === 'members' ? t('admin.members') : t('admin.non_members')}
            </Text>
          </TouchableOpacity>
        ))}
        <View style={styles.countBadge}>
          <Text color="#1e3a5f" fontSize={12} fontWeight="600">
            {filteredUsers.length}
          </Text>
        </View>
      </XStack>

      {error ? (
        <View style={styles.errorContainer}>
          <Text color="#dc2626" fontSize={16} textAlign="center">
            {error}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchUsers()}>
            <Text color="#ffffff" fontWeight="600">
              {t('common.retry')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <UserCard
              user={item}
              onResetPassword={() => handleResetPassword(item)}
              onToggleMembership={() => handleToggleMembership(item)}
              onDelete={() => handleDeleteUser(item)}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchUsers(true)} tintColor="#1e3a5f" />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <User size={48} color="#d1d5db" />
              <Text color="#6b7280" fontSize={16} marginTop="$3">
                {t('admin.no_users')}
              </Text>
            </View>
          }
        />
      )}

      {actionLoading && (
        <View style={styles.actionLoadingOverlay}>
          <View style={styles.actionLoadingBox}>
            <Spinner size="large" color="#1e3a5f" />
            <Text color="#6b7280" marginTop="$2">
              {t('admin.processing')}
            </Text>
          </View>
        </View>
      )}

      {/* Password Reset Modal */}
      <Modal
        visible={passwordResetDialog.open}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setPasswordResetDialog({ open: false, user: null });
          setNewPassword('');
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <YStack gap="$3">
              <Text color="#1a1f2c" fontSize={18} fontWeight="600">
                {t('admin.reset_password')}
              </Text>
              <Text color="#6b7280" fontSize={14}>
                {t('admin.reset_password_for', { name: passwordResetDialog.user?.name, email: passwordResetDialog.user?.email })}
              </Text>

              <YStack gap="$2">
                <Text color="#1a1f2c" fontSize={14} fontWeight="500">
                  {t('admin.new_password')}
                </Text>
                <TextInput
                  style={styles.passwordInput}
                  placeholder={t('admin.new_password_placeholder')}
                  placeholderTextColor="#9ca3af"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry
                  autoCapitalize="none"
                />
                <Text color="#6b7280" fontSize={12}>
                  {passwordResetDialog.user?.profile?.phone
                    ? t('admin.send_via_whatsapp')
                    : t('admin.no_phone_share_securely')}
                </Text>
              </YStack>

              <XStack gap="$3" justifyContent="flex-end" marginTop="$2">
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setPasswordResetDialog({ open: false, user: null });
                    setNewPassword('');
                  }}
                  activeOpacity={0.7}
                >
                  <Text color="#6b7280" fontSize={14} fontWeight="600">
                    {t('common.cancel')}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[
                    styles.confirmButton,
                    (!newPassword || newPassword.length < 6) && styles.confirmButtonDisabled,
                  ]}
                  onPress={confirmResetPassword}
                  activeOpacity={0.7}
                  disabled={!newPassword || newPassword.length < 6}
                >
                  <Text color="#ffffff" fontSize={14} fontWeight="600">
                    {t('admin.reset_password')}
                  </Text>
                </TouchableOpacity>
              </XStack>
            </YStack>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f0e8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f0e8',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  retryButton: {
    backgroundColor: '#1e3a5f',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  searchContainer: {
    padding: 16,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: '#1a1f2c',
    marginLeft: 10,
    marginRight: 10,
  },
  filterTab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  filterTabActive: {
    backgroundColor: '#1e3a5f',
  },
  countBadge: {
    marginLeft: 'auto',
    backgroundColor: '#e0e5eb',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 14,
  },
  listContent: {
    padding: 16,
    paddingTop: 0,
    gap: 12,
  },
  userCard: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarMember: {
    backgroundColor: '#dcfce7',
  },
  adminBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(212, 168, 75, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  memberBadge: {
    backgroundColor: '#dcfce7',
  },
  nonMemberBadge: {
    backgroundColor: '#f3f4f6',
  },
  moreButton: {
    padding: 8,
    marginRight: -8,
    marginTop: -8,
  },
  actionsPanel: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
    gap: 8,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  actionLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionLoadingBox: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  resetRequestBadge: {
    padding: 4,
    backgroundColor: '#fff7ed',
    borderRadius: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 20,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  passwordInput: {
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#1a1f2c',
  },
  cancelButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  confirmButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#1e3a5f',
  },
  confirmButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
});
