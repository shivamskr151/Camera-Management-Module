import { useState, useCallback, useEffect } from 'react';
import { Camera } from '@/components/CameraSearch';
import { cameraService } from '@/lib/services/cameraService';

export interface UseCameraSearchOptions {
    mode: 'default' | 'mask' | 'ptz';
    onSelect?: (camera: Camera) => void;
    initialQuery?: string;
    autoLoad?: boolean;
}

export function useCameraSearch({
    mode,
    onSelect,
    initialQuery = '',
    autoLoad = true,
}: UseCameraSearchOptions) {
    const [searchQuery, setSearchQuery] = useState(initialQuery);
    const [cameras, setCameras] = useState<Camera[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [selectedCamera, setSelectedCamera] = useState<Camera | null>(null);

    const searchCameras = useCallback(async (query: string) => {
        setLoading(true);
        setError(null);
        try {
            const results = await cameraService.searchCameras(query);
            setCameras(results);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to search cameras');
            setCameras([]);
        } finally {
            setLoading(false);
        }
    }, []);

    const handleSearch = useCallback((query: string) => {
        setSearchQuery(query);
        searchCameras(query);
    }, [searchCameras]);

    const handleSelect = useCallback((camera: Camera) => {
        setSelectedCamera(camera);
        onSelect?.(camera);
    }, [onSelect]);

    // Load initial cameras
    useEffect(() => {
        if (autoLoad) {
            searchCameras(initialQuery);
        }
    }, [autoLoad, initialQuery, searchCameras]);

    return {
        searchQuery,
        cameras,
        loading,
        error,
        selectedCamera,
        handleSearch,
        handleSelect,
    };
} 