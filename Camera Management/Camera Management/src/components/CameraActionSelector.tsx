import React, { useState } from 'react';
import { Camera, Plus, Edit } from 'lucide-react';
import { Button } from '@/components/ui/button';
import CameraSearch from './CameraSearch';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Card, CardContent } from '@/components/ui/card';
import { Camera as CameraType } from '@/lib/types';

interface CameraActionSelectorProps {
    onCreateCamera: (camera: CameraType) => void;
    onUpdateCamera: (camera: CameraType) => void;
    className?: string;
}

const CameraActionSelector: React.FC<CameraActionSelectorProps> = ({
    onCreateCamera,
    onUpdateCamera,
    className
}) => {
    const [selectedCamera, setSelectedCamera] = useState<CameraType | null>(null);
    const [isActionModalOpen, setIsActionModalOpen] = useState(false);

    const handleCameraSelect = (camera: CameraType) => {
        setSelectedCamera(camera);
        setIsActionModalOpen(true);
    };

    const handleCreateCamera = () => {
        if (selectedCamera) {
            onCreateCamera(selectedCamera);
            setIsActionModalOpen(false);
            setSelectedCamera(null);
        }
    };

    const handleUpdateCamera = () => {
        if (selectedCamera) {
            onUpdateCamera(selectedCamera);
            setIsActionModalOpen(false);
            setSelectedCamera(null);
        }
    };

    return (
        <div className={className}>
            <CameraSearch
                mode="default"
                onCameraSelect={handleCameraSelect}
                className="w-full"
            />

            <Dialog open={isActionModalOpen} onOpenChange={setIsActionModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Choose Action</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                        <div className="text-center mb-4">
                            <Camera className="h-12 w-12 mx-auto mb-2" />
                            <p className="text-lg font-semibold">Selected Camera: {selectedCamera?.name}</p>
                            <p className="text-sm text-muted-foreground">What would you like to do with this camera?</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <Card
                                className="cursor-pointer hover:bg-accent"
                                onClick={handleCreateCamera}
                            >
                                <CardContent className="p-4 flex flex-col items-center">
                                    <Plus className="h-8 w-8 mb-2" />
                                    <span className="font-medium">Create New</span>
                                    <span className="text-sm text-muted-foreground">
                                        Create a new camera configuration
                                    </span>
                                </CardContent>
                            </Card>

                            <Card
                                className="cursor-pointer hover:bg-accent"
                                onClick={handleUpdateCamera}
                            >
                                <CardContent className="p-4 flex flex-col items-center">
                                    <Edit className="h-8 w-8 mb-2" />
                                    <span className="font-medium">Update Existing</span>
                                    <span className="text-sm text-muted-foreground">
                                        Modify existing camera settings
                                    </span>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CameraActionSelector; 