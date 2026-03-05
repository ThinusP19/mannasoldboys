import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  TouchableOpacity,
  Alert,
  FlatList,
  Linking,
  TextInput,
  Modal,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { YStack, XStack, Text, Spinner } from 'tamagui';
import {
  User,
  Mail,
  Phone,
  MessageCircle,
  Coins,
  CheckCircle,
  XCircle,
  Clock,
  Calendar,
  Search,
  X,
} from '@tamagui/lucide-icons';
import { format } from 'date-fns';

import { adminMembershipApi, PendingMember } from '../../src/services/adminApi';

interface MemberRequestCardProps {
  request: PendingMember;
  onApprove: () => void;
  onReject: () => void;
  onContactWhatsApp: () => void;
  isProcessing: boolean;
}

function MemberRequestCard({
  request,
  onApprove,
  onReject,
  onContactWhatsApp,
  isProcessing,
}: MemberRequestCardProps) {
  return (
    <View style={styles.requestCard}>
      {/* Header */}
      <XStack alignItems="flex-start" gap="$3">
        <View style={styles.avatar}>
          <User size={24} color="#f59e0b" />
        </View>

        <YStack flex={1} gap="$1">
          <Text color="#1a1f2c" fontSize={17} fontWeight="600">
            {request.fullName}
          </Text>

          <XStack alignItems="center" gap="$1">
            <Mail size={13} color="#6b7280" />
            <Text color="#6b7280" fontSize={13} numberOfLines={1}>
              {request.email}
            </Text>
          </XStack>

          <XStack alignItems="center" gap="$1">
            <Phone size={13} color="#6b7280" />
            <Text color="#6b7280" fontSize={13}>
              {request.phone}
            </Text>
          </XStack>

          <XStack alignItems="center" gap="$2" marginTop="$1">
            <View style={styles.amountBadge}>
              <Coins size={12} color="#22c55e" />
              <Text color="#22c55e" fontSize={12} fontWeight="600" marginLeft={2}>
                R{request.monthlyAmount}/month
              </Text>
            </View>

            <XStack alignItems="center" gap="$1">
              <Calendar size={12} color="#9ca3af" />
              <Text color="#9ca3af" fontSize={11}>
                {format(new Date(request.createdAt), 'dd MMM yyyy')}
              </Text>
            </XStack>
          </XStack>
        </YStack>
      </XStack>

      {/* Actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={styles.whatsappButton}
          onPress={onContactWhatsApp}
          activeOpacity={0.7}
        >
          <MessageCircle size={16} color="#25D366" />
          <Text color="#25D366" fontSize={13} fontWeight="500" marginLeft="$1">
            WhatsApp
          </Text>
        </TouchableOpacity>

        <XStack gap="$2">
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={onReject}
            activeOpacity={0.7}
            disabled={isProcessing}
          >
            <XCircle size={18} color="#ef4444" />
            <Text color="#ef4444" fontSize={13} fontWeight="600" marginLeft="$1">
              Reject
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton]}
            onPress={onApprove}
            activeOpacity={0.7}
            disabled={isProcessing}
          >
            <CheckCircle size={18} color="#ffffff" />
            <Text color="#ffffff" fontSize={13} fontWeight="600" marginLeft="$1">
              Approve
            </Text>
          </TouchableOpacity>
        </XStack>
      </View>
    </View>
  );
}

export default function PendingMembersScreen() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState<PendingMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Approval dialog state
  const [approvalDialog, setApprovalDialog] = useState<{ open: boolean; request: PendingMember | null }>({ open: false, request: null });
  const [approvalAmount, setApprovalAmount] = useState('');

  const fetchPendingMembers = async (isRefresh = false) => {
    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      const data = await adminMembershipApi.getPending();
      setRequests(data);
    } catch (err: any) {
      setError(err.error || 'Failed to load pending members');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPendingMembers();
  }, []);

  // Filter requests by search query
  const filteredRequests = useMemo(() => {
    if (!searchQuery.trim()) return requests;

    const query = searchQuery.toLowerCase();
    return requests.filter(
      (request) =>
        request.fullName.toLowerCase().includes(query) ||
        request.email.toLowerCase().includes(query) ||
        (request.phone && request.phone.includes(query)) ||
        (request.whatsapp && request.whatsapp.includes(query))
    );
  }, [requests, searchQuery]);

  const handleApprove = (request: PendingMember) => {
    // Open approval dialog with pre-filled amount
    setApprovalAmount(request.monthlyAmount.toString());
    setApprovalDialog({ open: true, request });
  };

  const confirmApprove = async () => {
    if (!approvalDialog.request) return;

    const amount = parseFloat(approvalAmount);
    if (!approvalAmount || isNaN(amount) || amount < 75) {
      Alert.alert('Invalid Amount', 'Please enter a valid monthly amount (minimum R75).');
      return;
    }

    try {
      setProcessingId(approvalDialog.request.id);
      await adminMembershipApi.approve(approvalDialog.request.id, amount);
      setRequests((prev) => prev.filter((r) => r.id !== approvalDialog.request!.id));

      const name = approvalDialog.request.fullName;
      setApprovalDialog({ open: false, request: null });
      setApprovalAmount('');

      Alert.alert('Success', `${name} has been approved as a member with R${amount}/month.`);
    } catch (err: any) {
      Alert.alert('Error', err.error || 'Failed to approve membership');
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (request: PendingMember) => {
    Alert.alert(
      'Reject Membership',
      `Are you sure you want to reject ${request.fullName}'s membership request?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setProcessingId(request.id);
              await adminMembershipApi.reject(request.id);
              setRequests((prev) => prev.filter((r) => r.id !== request.id));
              Alert.alert('Done', 'Membership request has been rejected.');
            } catch (err: any) {
              Alert.alert('Error', err.error || 'Failed to reject membership');
            } finally {
              setProcessingId(null);
            }
          },
        },
      ]
    );
  };

  const handleContactWhatsApp = (request: PendingMember) => {
    const phone = request.whatsapp || request.phone;
    if (phone) {
      // Format phone number for WhatsApp (remove spaces, dashes, etc.)
      const formattedPhone = phone.replace(/[\s-()]/g, '');
      const whatsappUrl = `whatsapp://send?phone=${formattedPhone}`;
      Linking.openURL(whatsappUrl).catch(() => {
        Alert.alert('Error', 'WhatsApp is not installed on this device');
      });
    } else {
      Alert.alert('Error', 'No phone number available');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Spinner size="large" color="#1e3a5f" />
        <Text color="#6b7280" marginTop="$3">
          {t('admin.loading_pending')}
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header Stats */}
      <View style={styles.statsHeader}>
        <View style={styles.statBox}>
          <Clock size={20} color="#f59e0b" />
          <Text color="#1a1f2c" fontSize={24} fontWeight="bold" marginLeft="$2">
            {filteredRequests.length}
          </Text>
          <Text color="#6b7280" fontSize={13} marginLeft="$1">
            {searchQuery ? t('admin.found') : t('admin.pending')}
          </Text>
        </View>
        {searchQuery && filteredRequests.length !== requests.length && (
          <Text color="#6b7280" fontSize={12} marginTop="$1" textAlign="center">
            of {requests.length} total pending
          </Text>
        )}
      </View>

      {/* Search Input */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Search size={20} color="#9ca3af" />
          <TextInput
            style={styles.searchInput}
            placeholder={t('admin.search_pending')}
            placeholderTextColor="#9ca3af"
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

      {error ? (
        <View style={styles.errorContainer}>
          <Text color="#dc2626" fontSize={16} textAlign="center">
            {error}
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={() => fetchPendingMembers()}>
            <Text color="#ffffff" fontWeight="600">
              {t('common.retry')}
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={filteredRequests}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <MemberRequestCard
              request={item}
              onApprove={() => handleApprove(item)}
              onReject={() => handleReject(item)}
              onContactWhatsApp={() => handleContactWhatsApp(item)}
              isProcessing={processingId === item.id}
            />
          )}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={() => fetchPendingMembers(true)}
              tintColor="#1e3a5f"
            />
          }
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <CheckCircle size={48} color="#22c55e" />
              <Text color="#22c55e" fontSize={18} fontWeight="600" marginTop="$3">
                {t('admin.all_caught_up')}
              </Text>
              <Text color="#6b7280" fontSize={14} marginTop="$1" textAlign="center">
                {t('admin.no_pending_requests')}
              </Text>
            </View>
          }
        />
      )}

      {processingId && (
        <View style={styles.processingOverlay}>
          <View style={styles.processingBox}>
            <Spinner size="large" color="#1e3a5f" />
            <Text color="#6b7280" marginTop="$2">
              {t('admin.processing')}
            </Text>
          </View>
        </View>
      )}

      {/* Approval Dialog Modal */}
      <Modal
        visible={approvalDialog.open}
        transparent
        animationType="fade"
        onRequestClose={() => {
          setApprovalDialog({ open: false, request: null });
          setApprovalAmount('');
        }}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <YStack gap="$3">
              <Text color="#1a1f2c" fontSize={18} fontWeight="600">
                {t('admin.approve_membership')}
              </Text>
              <Text color="#6b7280" fontSize={14}>
                {t('admin.approve_for_membership', { name: approvalDialog.request?.fullName })}
              </Text>

              <YStack gap="$2">
                <Text color="#1a1f2c" fontSize={14} fontWeight="500">
                  {t('membership.monthly_amount')}
                </Text>
                <XStack alignItems="center" gap="$2">
                  <Text color="#6b7280" fontSize={16}>R</Text>
                  <TextInput
                    style={styles.amountInput}
                    placeholder="75"
                    placeholderTextColor="#9ca3af"
                    value={approvalAmount}
                    onChangeText={setApprovalAmount}
                    keyboardType="numeric"
                  />
                </XStack>
                <Text color="#6b7280" fontSize={12}>
                  {t('membership.min_amount')}
                </Text>
                {approvalDialog.request?.monthlyAmount && (
                  <Text color="#3b82f6" fontSize={12}>
                    Requested amount: R{approvalDialog.request.monthlyAmount}
                  </Text>
                )}
              </YStack>

              <XStack gap="$3" justifyContent="flex-end" marginTop="$2">
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => {
                    setApprovalDialog({ open: false, request: null });
                    setApprovalAmount('');
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
                    (!approvalAmount || parseFloat(approvalAmount) < 75) && styles.confirmButtonDisabled,
                  ]}
                  onPress={confirmApprove}
                  activeOpacity={0.7}
                  disabled={!approvalAmount || parseFloat(approvalAmount) < 75}
                >
                  <Text color="#ffffff" fontSize={14} fontWeight="600">
                    {t('admin.approve_membership')}
                  </Text>
                </TouchableOpacity>
              </XStack>
            </YStack>
          </View>
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
  statsHeader: {
    padding: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  statBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fef3c7',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  requestCard: {
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
    backgroundColor: '#fef3c7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  amountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#dcfce7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  whatsappButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#25D366',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 8,
  },
  rejectButton: {
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  approveButton: {
    backgroundColor: '#22c55e',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  processingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  processingBox: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  searchContainer: {
    padding: 16,
    paddingBottom: 0,
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
  amountInput: {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    color: '#1a1f2c',
    fontWeight: '600',
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
    backgroundColor: '#22c55e',
  },
  confirmButtonDisabled: {
    backgroundColor: '#9ca3af',
  },
});
