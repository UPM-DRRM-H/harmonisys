// hooks/useNotifications.ts
import { useQueryIdentity } from '@/components/providers/QueryProvider';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export interface AppNotification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    link?: string | null;
    refId?: string | null;
    refType?: string | null;
    createdAt: string;
}

interface NotificationsResponse {
    notifications: AppNotification[];
    unreadCount: number;
}

const POLL_INTERVAL = 30_000; // 30 s

export function useNotifications() {
    const qc = useQueryClient();
    const { scope } = useQueryIdentity();
    const notificationKey = ['notifications', scope];

    const query = useQuery<NotificationsResponse>({
        queryKey: notificationKey,
        enabled: scope !== 'guest' && scope !== 'uninitialized',
        queryFn: async () => {
            const res = await fetch('/api/notifications?limit=20');
            if (!res.ok) throw new Error('Failed to fetch notifications');
            return res.json();
        },
        staleTime: POLL_INTERVAL,
        refetchInterval: POLL_INTERVAL,
        refetchIntervalInBackground: false,
    });

    // Mark a single notification as read
    const markRead = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/notifications/${id}`, {
                method: 'PATCH',
            });
            if (!response.ok) throw new Error('Notification update failed.');
        },
        onMutate: async (id) => {
            await qc.cancelQueries({ queryKey: notificationKey });
            const prev =
                qc.getQueryData<NotificationsResponse>(notificationKey);
            qc.setQueryData<NotificationsResponse>(notificationKey, (old) => {
                if (!old) return old;
                return {
                    notifications: old.notifications.map((n) =>
                        n.id === id ? { ...n, read: true } : n
                    ),
                    unreadCount: Math.max(
                        0,
                        old.unreadCount -
                            (old.notifications.some(
                                (n) => n.id === id && !n.read
                            )
                                ? 1
                                : 0)
                    ),
                };
            });
            return { prev };
        },
        onError: (_err, _id, ctx) => {
            if (ctx?.prev) qc.setQueryData(notificationKey, ctx.prev);
        },
    });

    // Mark all as read
    const markAllRead = useMutation({
        mutationFn: async () => {
            const response = await fetch('/api/notifications', {
                method: 'POST',
            });
            if (!response.ok) throw new Error('Notification update failed.');
        },
        onSuccess: () => {
            qc.setQueryData<NotificationsResponse>(notificationKey, (old) => {
                if (!old) return old;
                return {
                    notifications: old.notifications.map((n) => ({
                        ...n,
                        read: true,
                    })),
                    unreadCount: 0,
                };
            });
        },
    });

    // Delete a single notification
    const deleteNotif = useMutation({
        mutationFn: async (id: string) => {
            const response = await fetch(`/api/notifications/${id}`, {
                method: 'DELETE',
            });
            if (!response.ok) throw new Error('Notification removal failed.');
        },
        onSuccess: () => qc.invalidateQueries({ queryKey: notificationKey }),
    });

    return {
        notifications: query.data?.notifications ?? [],
        unreadCount: query.data?.unreadCount ?? 0,
        isLoading: query.isLoading,
        markRead: markRead.mutate,
        markAllRead: markAllRead.mutate,
        deleteNotif: deleteNotif.mutate,
        refetch: query.refetch,
    };
}

// ── Pending-requests-specific hook (for admin / team-leader badge) ─────────────
export function usePendingRequestsCount() {
    const { scope } = useQueryIdentity();
    return useQuery<{ count: number }>({
        queryKey: ['misalud-pending-count', scope],
        enabled: scope.endsWith(':ADMIN') || scope.endsWith(':RESPONDER'),
        queryFn: async () => {
            const res = await fetch(
                '/api/misalud/requests?status=PENDING&countOnly=true'
            );
            if (!res.ok) throw new Error('Failed');
            return res.json();
        },
        staleTime: 30_000,
        refetchInterval: 30_000,
        refetchIntervalInBackground: false,
    });
}
