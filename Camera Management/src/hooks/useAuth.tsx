
import { useAuth as useStoreAuth, useAuthCheck, useRole } from './useStore';

// Re-export hooks for backward compatibility
export { useAuthCheck, useRole };
export const useAuth = useStoreAuth;

export default useStoreAuth;
