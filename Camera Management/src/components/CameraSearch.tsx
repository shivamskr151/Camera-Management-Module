import React from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Camera, Search } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useCameraSearch } from '@/hooks/useCameraSearch';

export interface Camera {
    id: string;
    name: string;
    status: 'online' | 'offline';
}

interface CameraSearchProps {
    mode: 'default' | 'mask' | 'ptz';
    onCameraSelect: (camera: Camera) => void;
    className?: string;
    buttonText?: string;
    dialogTitle?: string;
    dialogDescription?: string;
}

const modeConfig = {
    default: {
        buttonText: 'Add Camera',
        title: 'Add New Camera',
        description: 'Search for a camera to add to the system.'
    },
    mask: {
        buttonText: 'Search Cameras',
        title: 'Select Camera for Mask',
        description: 'Select a camera to configure masks and zones.'
    },
    ptz: {
        buttonText: 'Search Cameras',
        title: 'Select PTZ Camera',
        description: 'Select a PTZ camera to configure pan-tilt-zoom settings.'
    }
};

const CameraSearch: React.FC<CameraSearchProps> = ({
    mode,
    onCameraSelect,
    className,
    buttonText,
    dialogTitle,
    dialogDescription
}) => {
    const [isOpen, setIsOpen] = React.useState(false);

    const {
        searchQuery,
        cameras,
        loading,
        handleSearch,
        handleSelect
    } = useCameraSearch({
        mode,
        onSelect: (camera) => {
            onCameraSelect(camera);
            setIsOpen(false);
        }
    });

    const config = modeConfig[mode];

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button 
                    variant="outline" 
                    size="lg"
                    className={`${className} relative group hover:border-primary/50 transition-colors`}
                >
                    <div className="flex items-center gap-2">
                        <Camera className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                        <span className="font-medium">
                            {buttonText || config.buttonText}
                        </span>
                    </div>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader className="space-y-4">
                    <DialogTitle className="text-xl">
                        {dialogTitle || config.title}
                    </DialogTitle>
                    <DialogDescription>
                        {dialogDescription || config.description}
                    </DialogDescription>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            value={searchQuery}
                            onChange={(e) => handleSearch(e.target.value)}
                            placeholder="Search cameras..."
                            className="pl-9 pr-4"
                        />
                    </div>
                </DialogHeader>
                
                <ScrollArea className="max-h-[300px] overflow-y-auto -mx-6 px-6">
                    <div className="space-y-2">
                        {loading ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>Loading cameras...</p>
                            </div>
                        ) : cameras.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground">
                                <p>{searchQuery ? 'No cameras match your search' : 'No cameras available'}</p>
                            </div>
                        ) : (
                            cameras.map((camera) => (
                                <Button
                                    key={camera.id}
                                    variant="outline"
                                    className="w-full justify-between h-auto py-3 px-4 hover:border-primary/50 transition-all"
                                    onClick={() => handleSelect(camera)}
                                >
                                    <div className="flex items-center gap-3">
                                        <Camera className="h-4 w-4 text-muted-foreground" />
                                        <span className="font-medium">{camera.name}</span>
                                    </div>
                                    <Badge 
                                        variant={camera.status === 'online' ? 'default' : 'secondary'}
                                        className={`${
                                            camera.status === 'online' 
                                                ? 'bg-green-500/10 text-green-500 hover:bg-green-500/20' 
                                                : 'bg-red-500/10 text-red-500 hover:bg-red-500/20'
                                        }`}
                                    >
                                        {camera.status}
                                    </Badge>
                                </Button>
                            ))
                        )}
                    </div>
                </ScrollArea>
            </DialogContent>
        </Dialog>
    );
};

export default CameraSearch; 