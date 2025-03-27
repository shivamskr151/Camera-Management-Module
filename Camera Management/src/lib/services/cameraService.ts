import { Camera } from '@/components/CameraSearch';

// This is a mock implementation. Replace with actual API calls in production
class CameraService {
    private static instance: CameraService;
    private cameras: Camera[] = [
        { id: '1', name: 'Cam 1', status: 'online' },
        { id: '2', name: 'Cam 2', status: 'offline' },
        { id: '3', name: 'Cam 3', status: 'online' },
        { id: '4', name: 'Cam 4', status: 'online' },
        { id: '5', name: 'Cam 5', status: 'offline' },
    ];

    private constructor() {}

    public static getInstance(): CameraService {
        if (!CameraService.instance) {
            CameraService.instance = new CameraService();
        }
        return CameraService.instance;
    }

    public async searchCameras(query: string): Promise<Camera[]> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Case-insensitive search
        return this.cameras.filter(camera =>
            camera.name.toLowerCase().includes(query.toLowerCase())
        );
    }

    public async getAllCameras(): Promise<Camera[]> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        return [...this.cameras];
    }

    public async getCameraById(id: string): Promise<Camera | null> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 300));
        return this.cameras.find(camera => camera.id === id) || null;
    }

    // Add a camera to the system
    public async addCamera(camera: Omit<Camera, 'id'>): Promise<Camera> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 700));
        
        const newCamera = {
            ...camera,
            id: Date.now().toString(),
        };
        
        this.cameras.push(newCamera);
        return newCamera;
    }

    // Update a camera's details
    public async updateCamera(id: string, updates: Partial<Camera>): Promise<Camera | null> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 700));
        
        const index = this.cameras.findIndex(camera => camera.id === id);
        if (index === -1) return null;

        this.cameras[index] = {
            ...this.cameras[index],
            ...updates,
        };

        return this.cameras[index];
    }

    // Remove a camera from the system
    public async deleteCamera(id: string): Promise<boolean> {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const initialLength = this.cameras.length;
        this.cameras = this.cameras.filter(camera => camera.id !== id);
        return this.cameras.length !== initialLength;
    }
}

export const cameraService = CameraService.getInstance(); 