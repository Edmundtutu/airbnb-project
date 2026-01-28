import { useAuth } from '@/context/AuthContext';

export function useRequireAuth() {
    const { isAuthenticated } = useAuth();

    const requireAuth = (
        action: () => void,
        opts?: { onBlocked?: () => void }
    ): boolean => {
        if (!isAuthenticated) {
            // Let the caller decide how to surface the blocked state (tooltip, modal, etc.)
            if (opts?.onBlocked) opts.onBlocked();
            return false;
        }

        action();
        return true;
    };

    return { requireAuth, isAuthenticated };
}
