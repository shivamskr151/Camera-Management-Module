import React, { useState, useRef, useCallback, useMemo, useEffect } from 'react';
import { Point, PolygonDrawerHandle } from "@/lib/zone-drawer";
import PolygonDrawer from "@/lib/zone-drawer/PolygonDrawer";
import { Plus, Edit3, Trash2, Camera, Check, X, MoreVertical, Save, Settings, Sliders } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import CameraSearch, { Camera as CameraType } from '@/components/CameraSearch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Select as SelectUI, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import Select from 'react-select';
import { toast } from 'sonner';
import { useStoreState } from 'easy-peasy';
import { StoreModel } from '@/store/model';
import ParametersForm, { ParameterValue } from '@/components/ParametersForm';
import { activityData } from '@/constants/ParametersData';
import { 
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { 
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger
} from "@/components/ui/dialog";
import {
    Accordion,
    AccordionContent,
    AccordionItem,
    AccordionTrigger,
} from "@/components/ui/accordion"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"

interface SavedPolygon {
    id: string;
    points: Point[];
    color: string;
    isActive?: boolean;
    name: string;
    activity: string;
    parameters: Record<string, ParameterValue>;
    isExpanded?: boolean;
}

interface MasksAndZonesProps {
    className?: string;
}

// Memoized components
const PolygonPreview = React.memo(({ 
    polygon, 
    isActive, 
    strokeWidth, 
    fillOpacity 
}: { 
    polygon: SavedPolygon;
    isActive: boolean;
    strokeWidth: number;
    fillOpacity: number;
}) => {
    const pointsString = polygon.points
        .map(point => `${point.x},${point.y}`)
        .join(' ');

    return (
        <polygon
            points={pointsString}
            fill={polygon.color}
            fillOpacity={isActive ? 0.1 : fillOpacity}
            stroke={polygon.color}
            strokeWidth={isActive ? 1 : strokeWidth}
            strokeDasharray={isActive ? "5,5" : "none"}
        />
    );
});

const SavedZoneItem = React.memo(({ 
    polygon, 
    isActive, 
    onEdit, 
    onDelete, 
    onStartEditingName, 
    onSaveName, 
    onCancelEditingName, 
    editingNameId, 
    editingName, 
    onEditingNameChange,
    onParametersChange,
    editingParameters
}: {
    polygon: SavedPolygon;
    isActive: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onStartEditingName: () => void;
    onSaveName: (id: string) => void;
    onCancelEditingName: () => void;
    editingNameId: string | null;
    editingName: string;
    onEditingNameChange: (value: string) => void;
    onParametersChange: (params: Record<string, ParameterValue>) => void;
    editingParameters: Record<string, ParameterValue>;
}) => (
    <div
        className={`flex flex-col p-3 rounded-lg ${
            isActive ? 'bg-primary/10' : 'bg-muted/30'
        } border transition-colors ${editingNameId === polygon.id ? 'border-primary' : 'border-transparent'}`}
    >
        <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3 flex-1">
                <div
                    className="w-3 h-3 rounded-full ring-2 ring-background"
                    style={{ backgroundColor: polygon.color }}
                />
                <div className="flex-1">
                    <div className="font-medium text-sm">
                        {formatActivityName(polygon.activity)}
                    </div>
                    {!editingNameId && (
                        <div className="text-xs text-muted-foreground mt-0.5">
                            {polygon.name !== formatActivityName(polygon.activity) ? polygon.name : ''}
                        </div>
                    )}
                </div>
            </div>
            {!editingNameId && (
                <div className="flex items-center gap-1.5">
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-primary/10 hover:text-primary transition-colors"
                        onClick={onStartEditingName}
                        title="Edit custom name"
                    >
                        <Edit3 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={onDelete}
                        title="Delete activity"
                    >
                        <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                </div>
            )}
        </div>
        {!editingNameId && isActive && polygon.parameters && Object.keys(polygon.parameters).length > 0 && (
            <div className="bg-background/50 rounded-lg p-3 text-sm">
                <div className="font-medium mb-2">Parameters</div>
                <div className="space-y-1.5">
                    {Object.entries(polygon.parameters).map(([key, value]) => (
                        <div key={key} className="flex justify-between">
                            <span className="text-muted-foreground">{key}:</span>
                            <span className="font-medium">{typeof value === 'object' ? JSON.stringify(value) : value.toString()}</span>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
));

// Helper function to format activity name
const formatActivityName = (name: string) => {
    if (name === 'PPE') {
        return 'PPE';
    }
    return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export const MasksAndZones: React.FC<MasksAndZonesProps> = ({ className }) => {
    // State
    const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
    const [isDrawingMode, setIsDrawingMode] = useState(false);
    const [strokeColor, setStrokeColor] = useState('#3498db');
    const [pointRadius, setPointRadius] = useState(5);
    const [strokeWidth, setStrokeWidth] = useState(2);
    const [fillOpacity, setFillOpacity] = useState(0.2);
    const [savedPolygons, setSavedPolygons] = useState<SavedPolygon[]>([]);
    const [activePolygonId, setActivePolygonId] = useState<string | null>(null);
    const [selectedCamera, setSelectedCamera] = useState<CameraType | null>(null);
    const [selectedActivity, setSelectedActivity] = useState<string>('');
    const [editingNameId, setEditingNameId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [newZoneName, setNewZoneName] = useState('');
    const [isDrawing, setIsDrawing] = useState(false);
    const [isDrawingEnabled, setIsDrawingEnabled] = useState(false);
    const activities = useStoreState((state: StoreModel) => state.activity.activities);
    const [parameters, setParameters] = useState<Record<string, ParameterValue>>({});
    const [isCameraFeedOpen, setIsCameraFeedOpen] = useState(false);
    const [drawnZones, setDrawnZones] = useState<SavedPolygon[]>([]);
    const [savedActivities, setSavedActivities] = useState<SavedPolygon[]>([]);
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [itemToDelete, setItemToDelete] = useState<{ id: string; type: 'activity' | 'zone' } | null>(null);

    // Refs
    const polygonDrawerRef = useRef<PolygonDrawerHandle>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const newZoneInputRef = useRef<HTMLInputElement>(null);

    // Callbacks
    const handlePolygonChange = useCallback((points: Point[]) => {
        setPolygonPoints(points);
    }, []);

    const handleStartDrawing = useCallback(() => {
        if (!selectedActivity) {
            toast.error('Please select an activity first');
            return;
        }
        setIsDrawingEnabled(true);
        setIsDrawing(true);
        setPolygonPoints([]); // Reset any existing points
        if (polygonDrawerRef.current) {
            polygonDrawerRef.current.resetPolygon();
        }
    }, [selectedActivity]);

    const handleStopDrawing = useCallback(() => {
        setIsDrawingEnabled(false);
        setIsDrawing(false);
        setPolygonPoints([]);
        if (polygonDrawerRef.current) {
            polygonDrawerRef.current.resetPolygon();
        }
    }, []);

    const saveToActivity = useCallback((polygons: SavedPolygon[]) => {
        try {
            if (!selectedCamera) return;

            const activityData = {
                zones: polygons.reduce((acc, polygon) => {
                    if (!acc[polygon.activity]) {
                        acc[polygon.activity] = {
                            zones: {},
                            parameters: {}
                        };
                    }
                    acc[polygon.activity].zones[polygon.name] = {
                        points: polygon.points,
                        parameters: polygon.parameters
                    };
                    return acc;
                }, {} as Record<string, { zones: Record<string, { points: Point[]; parameters: Record<string, ParameterValue> }>; parameters: Record<string, ParameterValue> }>)
            };

            // Here you would typically make an API call to save the data
            console.log('Saving activity data:', activityData);
        } catch (error) {
            console.error('Error saving to Activity:', error);
            toast.error('Failed to save data to Activity');
        }
    }, [selectedCamera]);

    const handleSavePolygon = useCallback(() => {
        if (!selectedActivity) {
            toast.error('Please select an activity first');
            return;
        }

        if (!newZoneName.trim()) {
            toast.error('Please enter a name for the zone');
            return;
        }

        if (polygonDrawerRef.current) {
            const points = polygonDrawerRef.current.getPoints();
            if (points.length >= 3) {
                const currentParameters = { ...parameters }; // Create a deep copy of parameters
                if (activePolygonId) {
                    // Update existing zone
                    const updatedZones = drawnZones.map(zone =>
                        zone.id === activePolygonId
                            ? {
                                ...zone,
                                points,
                                color: strokeColor,
                                name: newZoneName.trim(),
                                activity: selectedActivity,
                                parameters: currentParameters
                            }
                            : zone
                    );
                    setDrawnZones(updatedZones);
                    toast.success('Zone updated successfully');
                } else {
                    // Create new zone
                    const newZone: SavedPolygon = {
                        id: Date.now().toString(),
                        points,
                        color: strokeColor,
                        isActive: true,
                        name: newZoneName.trim(),
                        activity: selectedActivity,
                        parameters: currentParameters
                    };
                    setDrawnZones([...drawnZones, newZone]);
                    toast.success('Zone saved successfully');
                }
                handleStopDrawing();
                setNewZoneName('');
                setActivePolygonId(null);
            } else {
                toast.error('Please draw a valid polygon with at least 3 points');
            }
        }
    }, [selectedActivity, newZoneName, strokeColor, handleStopDrawing, activePolygonId, drawnZones, parameters]);

    const handleDeletePolygon = useCallback((id: string) => {
        const updatedPolygons = savedPolygons.filter(polygon => polygon.id !== id);
        setSavedPolygons(updatedPolygons);
        saveToActivity(updatedPolygons);
        if (activePolygonId === id) {
            setActivePolygonId(null);
            if (polygonDrawerRef.current) {
                polygonDrawerRef.current.resetPolygon();
            }
        }
    }, [activePolygonId, savedPolygons, saveToActivity]);

    const handleEditPolygon = useCallback((polygon: SavedPolygon) => {
        setStrokeColor(polygon.color);
        setActivePolygonId(polygon.id);
        setPolygonPoints([...polygon.points]);
        setNewZoneName(polygon.name);
        setSelectedActivity(polygon.activity);
        setParameters(polygon.parameters || {});
        setIsDrawing(true);

        if (polygonDrawerRef.current) {
            polygonDrawerRef.current.setPoints(polygon.points);
        }
        setTimeout(() => {
            newZoneInputRef.current?.focus();
        }, 0);
    }, []);

    const handleCancelDrawing = useCallback(() => {
        setIsDrawing(false);
        setPolygonPoints([]);
        setActivePolygonId(null);
        setNewZoneName('');
        if (polygonDrawerRef.current) {
            polygonDrawerRef.current.resetPolygon();
        }
    }, []);

    const handleCameraSelect = useCallback((camera: CameraType) => {
        setSelectedCamera(camera);
        console.log(`Initializing mask/zone drawing for camera: ${camera.name}`);
    }, []);

    const handleStartEditingName = useCallback((polygon: SavedPolygon) => {
        setEditingNameId(polygon.id);
        setEditingName(polygon.name);
        // Set both the editing parameters and the main parameters state
        const currentParams = polygon.parameters ? { ...polygon.parameters } : {};
        setParameters(currentParams);
        setSelectedActivity(polygon.activity);
        setTimeout(() => {
            nameInputRef.current?.focus();
        }, 0);
    }, []);

    const handleParametersChange = useCallback((newParameters: Record<string, ParameterValue>) => {
        // Always update the main parameters state
        setParameters(newParameters);
        
        // If editing a zone in Save Activity, update the saved activities immediately
        if (editingNameId) {
            const updatedActivities = savedActivities.map(activity =>
                activity.id === editingNameId
                    ? { ...activity, parameters: { ...newParameters } }
                    : activity
            );
            setSavedActivities(updatedActivities);
            saveToActivity(updatedActivities);
        }
    }, [editingNameId, savedActivities, saveToActivity]);

    const handleSaveName = useCallback((id: string) => {
        if (editingName.trim()) {
            // Create the updated activity with current parameters
            const updatedActivities = savedActivities.map(activity =>
                activity.id === id
                    ? { 
                        ...activity, 
                        name: editingName.trim(),
                        parameters: { ...parameters }, // Use current parameters
                        activity: selectedActivity
                    }
                    : activity
            );
            
            // Update saved activities
            setSavedActivities(updatedActivities);
            saveToActivity(updatedActivities);
            
            // Reset states after saving
            setEditingNameId(null);
            setEditingName('');
            setParameters({});
            setSelectedActivity('');
            
            toast.success('Activity updated successfully');
        }
    }, [editingName, parameters, savedActivities, saveToActivity, selectedActivity]);

    const handleCancelEditingName = useCallback(() => {
        const currentActivity = editingNameId 
            ? savedActivities.find(p => p.id === editingNameId)
            : activePolygonId 
                ? savedActivities.find(p => p.id === activePolygonId)
                : null;

        setEditingNameId(null);
        
        if (currentActivity) {
            // Restore the current activity's parameters and activity type
            setParameters(currentActivity.parameters || {});
            setSelectedActivity(currentActivity.activity);
        } else {
            // Reset if no activity is being edited or active
            const defaultActivity = activityData.find(act => act.name === selectedActivity);
            if (defaultActivity) {
                setParameters({ ...defaultActivity.data.parameters });
            } else {
                setParameters({});
                setSelectedActivity('');
            }
        }
    }, [editingNameId, activePolygonId, savedActivities, selectedActivity]);

    const handleActivityChange = useCallback((value: string) => {
        const activity = activityData.find((act) => act.name === value);
        setSelectedActivity(value);
        setParameters(activity?.data?.parameters || {});
    }, []);

    // Memoized values
    const activePolygon = useMemo(() => 
        savedPolygons.find(p => p.id === activePolygonId),
        [savedPolygons, activePolygonId]
    );

    // Update parameters state when editing a zone
    useEffect(() => {
        if (editingNameId) {
            // If editing, use the parameters from the activity being edited
            const editingActivity = savedActivities.find(a => a.id === editingNameId);
            if (editingActivity) {
                setParameters(editingActivity.parameters || {});
                setSelectedActivity(editingActivity.activity);
            }
        } else if (!editingNameId && !activePolygonId) {
            // Only reset to default parameters if not editing and no activity is selected
            const activity = activityData.find(act => act.name === selectedActivity);
            if (activity && Object.keys(parameters).length === 0) {
                setParameters({ ...activity.data.parameters });
                setIsDrawingEnabled(true);
            }
        }
    }, [editingNameId, activePolygonId, savedActivities, selectedActivity, parameters]);

    // Update parameters when activity changes
    useEffect(() => {
        if (!editingNameId && !activePolygonId) {
            const activity = activityData.find(act => act.name === selectedActivity);
            if (activity) {
                setParameters({ ...activity.data.parameters });
                setIsDrawingEnabled(true);
            } else {
                setParameters({});
                setIsDrawingEnabled(false);
            }
        }
    }, [selectedActivity, editingNameId, activePolygonId]);

    // Update the Save Activity button click handler
    const handleSaveActivity = useCallback(() => {
        if (!selectedActivity) {
            toast.error('Please select an activity first');
            return;
        }
        if (Object.keys(parameters).length === 0) {
            toast.error('Please configure parameters first');
            return;
        }
        const newActivity: SavedPolygon = {
            id: Date.now().toString(),
            points: [],
            color: strokeColor,
            isActive: true,
            name: formatActivityName(selectedActivity),
            activity: selectedActivity,
            parameters: { ...parameters }
        };
        const updatedActivities = [...savedActivities, newActivity];
        setSavedActivities(updatedActivities);
        saveToActivity(updatedActivities);
        toast.success('Activity saved successfully');

        // Reset all states to initial values
        setSelectedActivity('');
        setParameters({});
        setStrokeColor('#3498db');
        setPointRadius(5);
        setStrokeWidth(2);
        setFillOpacity(0.2);
        setPolygonPoints([]);
        setActivePolygonId(null);
        setEditingNameId(null);
        setEditingName('');
        setNewZoneName('');
        setIsDrawing(false);
        setIsDrawingEnabled(false);
        if (polygonDrawerRef.current) {
            polygonDrawerRef.current.resetPolygon();
        }
    }, [selectedActivity, parameters, strokeColor, saveToActivity, savedActivities]);

    const handleDeleteConfirm = useCallback(() => {
        if (!itemToDelete) return;

        if (itemToDelete.type === 'activity') {
            setSavedActivities(savedActivities.filter(z => z.id !== itemToDelete.id));
            toast.success('Activity deleted successfully');
        } else {
            setDrawnZones(drawnZones.filter(z => z.id !== itemToDelete.id));
            toast.success('Zone deleted successfully');
        }

        setDeleteDialogOpen(false);
        setItemToDelete(null);
    }, [itemToDelete, savedActivities, drawnZones]);

    return (
        <div className={className}>
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold">Masks/Zones</h2>
                <CameraSearch
                    mode="mask"
                    onCameraSelect={handleCameraSelect}
                    className="w-[300px]"
                />
            </div>

            {!selectedCamera ? (
                <div className="flex flex-col items-center justify-center p-20 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 border rounded-xl shadow-sm">
                    <div className="rounded-full p-6 bg-white dark:bg-gray-800 shadow-md mb-6">
                        <Camera className="h-12 w-12 text-blue-600 dark:text-blue-400" />
                    </div>
                    <p className="text-xl text-muted-foreground font-medium">Select a Camera</p>
                    <p className="text-sm text-muted-foreground mt-2">Choose a camera to configure masks and zones</p>
                </div>
            ) : (
                <Card>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="flex flex-col gap-4">
                                {/* Drawing Area */}
                                <div className="w-full mt-4">
                                    <div className="relative w-full aspect-video bg-muted rounded-lg">
                                        {/* Camera feed with Dialog */}
                                        <Dialog open={isCameraFeedOpen} onOpenChange={setIsCameraFeedOpen}>
                                            <DialogTrigger asChild>
                                                <div className="absolute inset-0 flex items-center justify-center cursor-pointer hover:bg-black/5 transition-colors">
                                                    <span className="text-muted-foreground">Camera Feed</span>
                                                </div>
                                            </DialogTrigger>
                                            <DialogContent className="max-w-4xl w-full">
                                                <DialogHeader>
                                                    <DialogTitle>Camera Feed - {selectedCamera.name}</DialogTitle>
                                                </DialogHeader>
                                                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
                                                    <span className="text-muted-foreground">Camera Feed</span>
                                                </div>
                                            </DialogContent>
                                        </Dialog>

                                        {/* Display saved polygons */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            <svg className="w-full h-full">
                                                {drawnZones.map(polygon => (
                                                    <PolygonPreview
                                                        key={polygon.id}
                                                        polygon={polygon}
                                                        isActive={activePolygonId === polygon.id}
                                                        strokeWidth={strokeWidth}
                                                        fillOpacity={fillOpacity}
                                                    />
                                                ))}
                                            </svg>
                                        </div>

                                        {/* Active polygon drawer */}
                                        <div className="absolute inset-0">
                                            <PolygonDrawer
                                                ref={polygonDrawerRef}
                                                strokeColor={strokeColor}
                                                fillColor={strokeColor}
                                                fillOpacity={fillOpacity}
                                                strokeWidth={strokeWidth}
                                                pointRadius={pointRadius}
                                                onChange={handlePolygonChange}
                                                className="w-full h-full"
                                                initialPoints={activePolygonId ? polygonPoints : []}
                                            />
                                        </div>

                                        {/* Drawing Controls Dialog */}
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button 
                                                    variant="outline" 
                                                    size="icon"
                                                    className="absolute top-4 right-4 h-8 w-8"
                                                >
                                                    <Sliders className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader>
                                                    <DialogTitle>Drawing Controls</DialogTitle>
                                                </DialogHeader>
                                                <div className="space-y-6">
                                                    {/* Color Picker */}
                                                    <div>
                                                        <Label className="block text-sm font-medium mb-2">
                                                            Stroke/Fill Color:
                                                        </Label>
                                                        <input
                                                            type="color"
                                                            value={strokeColor}
                                                            onChange={(e) => setStrokeColor(e.target.value)}
                                                            className="w-20 h-8 border border-border rounded cursor-pointer"
                                                            title="Select color for the zone"
                                                        />
                                                    </div>

                                                    {/* Sliders */}
                                                    <div>
                                                        <Label className="block text-sm font-medium mb-2">
                                                            Point Radius:
                                                        </Label>
                                                        <div className="flex items-center">
                                                            <input
                                                                type="range"
                                                                min="1"
                                                                max="10"
                                                                value={pointRadius}
                                                                onChange={(e) => setPointRadius(parseInt(e.target.value))}
                                                                className="w-full mr-2"
                                                                title="Adjust point radius"
                                                            />
                                                            <span className="text-sm text-muted-foreground w-10">{pointRadius}px</span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <Label className="block text-sm font-medium mb-2">
                                                            Stroke Width:
                                                        </Label>
                                                        <div className="flex items-center">
                                                            <input
                                                                type="range"
                                                                min="1"
                                                                max="5"
                                                                value={strokeWidth}
                                                                onChange={(e) => setStrokeWidth(parseInt(e.target.value))}
                                                                className="w-full mr-2"
                                                                title="Adjust stroke width"
                                                            />
                                                            <span className="text-sm text-muted-foreground w-10">{strokeWidth}px</span>
                                                        </div>
                                                    </div>

                                                    <div>
                                                        <Label className="block text-sm font-medium mb-2">
                                                            Fill Opacity:
                                                        </Label>
                                                        <div className="flex items-center">
                                                            <input
                                                                type="range"
                                                                min="0"
                                                                max="100"
                                                                value={fillOpacity * 100}
                                                                onChange={(e) => setFillOpacity(parseInt(e.target.value) / 100)}
                                                                className="w-full mr-2"
                                                                title="Adjust fill opacity"
                                                            />
                                                            <span className="text-sm text-muted-foreground w-10">{Math.round(fillOpacity * 100)}%</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            </DialogContent>
                                        </Dialog>
                                    </div>
                                </div>

                                {/* Controls Panel */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    {/* Left Side - Activity Selection and Saved Zones */}
                                    <div className="space-y-6">
                                        {/* Activity Selection */}
                                        <div className="flex items-center gap-4">
                                            <label className="text-gray-700 font-medium">Select Activity</label>
                                            <div className="flex-1">
                                                <Select
                                                    options={activityData.map((activity) => ({
                                                        value: activity.id,
                                                        label: formatActivityName(activity.name),
                                                    }))}
                                                    onChange={(selectedOption) => {
                                                        const activity = activityData.find((act) => act.id === selectedOption.value);
                                                        if (activity) {
                                                            setSelectedActivity(activity.name);
                                                            setParameters({ ...activity.data.parameters });
                                                            setIsDrawingEnabled(true);
                                                        }
                                                    }}
                                                    value={
                                                        selectedActivity
                                                            ? {
                                                                value: activityData.find(act => act.name === selectedActivity)?.id || '',
                                                                label: formatActivityName(selectedActivity)
                                                            }
                                                            : null
                                                    }
                                                    placeholder="Select"
                                                />
                                            </div>
                                        </div>

                                        {/* Saved Zones List */}
                                        <div className="border-t border-border pt-6">
                                            <h3 className="text-lg font-medium mb-2">Save Activity ({savedActivities.length})</h3>
                                            <div className="space-y-2">
                                                {savedActivities.map(polygon => (
                                                    <SavedZoneItem
                                                        key={polygon.id}
                                                        polygon={polygon}
                                                        isActive={activePolygonId === polygon.id}
                                                        onEdit={() => handleEditPolygon(polygon)}
                                                        onDelete={() => {
                                                            setItemToDelete({ id: polygon.id, type: 'activity' });
                                                            setDeleteDialogOpen(true);
                                                        }}
                                                        onStartEditingName={() => handleStartEditingName(polygon)}
                                                        onSaveName={handleSaveName}
                                                        onCancelEditingName={handleCancelEditingName}
                                                        editingNameId={editingNameId}
                                                        editingName={editingName}
                                                        onEditingNameChange={setEditingName}
                                                        onParametersChange={(newParams) => {
                                                            handleParametersChange(newParams);
                                                            // Also update the right side parameters form while editing
                                                            setParameters(newParams);
                                                        }}
                                                        editingParameters={parameters}
                                                    />
                                                ))}
                                            </div>
                                        </div>

                                        {/* Save Configuration Button */}
                                        <div className="pt-4 border-t border-border">
                                            <Button
                                                onClick={() => {
                                                    // Save all configurations including zones, activities, and parameters
                                                    const allConfig = {
                                                        zones: drawnZones,
                                                        activities: savedActivities,
                                                        parameters: parameters
                                                    };
                                                    saveToActivity([...drawnZones, ...savedActivities]);
                                                    toast.success('Configuration saved successfully');
                                                }}
                                                className="w-full"
                                                disabled={!selectedCamera || savedActivities.length === 0 || editingNameId !== null}
                                            >
                                                <Settings className="h-4 w-4 mr-2" />
                                                Save Configuration
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Right Side - Drawing Controls and Parameters */}
                                    <div className="space-y-6">
                                        {/* Drawing Controls */}
                                        <div className="space-y-4">
                                            {isDrawing ? (
                                                <>
                                                    <div className="space-y-2">
                                                        <Label htmlFor="zoneName" className="text-sm font-medium">
                                                            Zone Name:
                                                        </Label>
                                                        <Input
                                                            id="zoneName"
                                                            ref={newZoneInputRef}
                                                            value={newZoneName}
                                                            onChange={(e) => setNewZoneName(e.target.value)}
                                                            placeholder="Enter zone name"
                                                            className="w-full"
                                                            onKeyDown={(e) => {
                                                                if (e.key === 'Enter' && polygonPoints.length >= 3) {
                                                                    handleSavePolygon();
                                                                }
                                                            }}
                                                        />
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            onClick={handleCancelDrawing}
                                                            className="flex-1"
                                                        >
                                                            Cancel
                                                        </Button>
                                                        <Button
                                                            onClick={handleSavePolygon}
                                                            className="flex-1"
                                                            disabled={polygonPoints.length < 3 || !newZoneName.trim()}
                                                        >
                                                            Save Zone
                                                        </Button>
                                                    </div>
                                                </>
                                            ) : (
                                                <>
                                                    <Button
                                                        onClick={handleStartDrawing}
                                                        className="w-full"
                                                        disabled={!selectedActivity}
                                                    >
                                                        <Plus className="h-4 w-4 mr-2" />
                                                        Draw New Zone
                                                    </Button>

                                                    {/* Zone Coordinates Display */}
                                                    {drawnZones.length > 0 && (
                                                        <Accordion type="single" collapsible className="space-y-2">
                                                            {drawnZones.map((zone) => (
                                                                <AccordionItem key={zone.id} value={zone.id} className="border rounded-lg overflow-hidden">
                                                                    <AccordionTrigger className="px-4 py-2 hover:no-underline">
                                                                        <div className="flex items-center justify-between w-full">
                                                                            <div className="flex items-center gap-2">
                                                                                <div
                                                                                    className="w-3 h-3 rounded-full"
                                                                                    style={{ backgroundColor: zone.color }}
                                                                                />
                                                                                <span className="text-sm font-medium">
                                                                                    {zone.name}
                                                                                </span>
                                                                            </div>
                                                                            <div className="flex items-center gap-2">
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setItemToDelete({ id: zone.id, type: 'zone' });
                                                                                        setDeleteDialogOpen(true);
                                                                                    }}
                                                                                >
                                                                                    <Trash2 className="h-4 w-4" />
                                                                                </Button>
                                                                                <Button
                                                                                    variant="ghost"
                                                                                    size="icon"
                                                                                    className="h-8 w-8"
                                                                                    onClick={(e) => {
                                                                                        e.stopPropagation();
                                                                                        setActivePolygonId(zone.id);
                                                                                        setPolygonPoints([...zone.points]);
                                                                                        setNewZoneName(zone.name);
                                                                                        setSelectedActivity(zone.activity);
                                                                                        setParameters(zone.parameters || {});
                                                                                        setIsDrawing(true);
                                                                                        if (polygonDrawerRef.current) {
                                                                                            polygonDrawerRef.current.setPoints(zone.points);
                                                                                        }
                                                                                    }}
                                                                                >
                                                                                    <Edit3 className="h-4 w-4" />
                                                                                </Button>
                                                                            </div>
                                                                        </div>
                                                                    </AccordionTrigger>
                                                                    <AccordionContent>
                                                                        <div className="px-4 py-2 bg-muted/50">
                                                                            <div className="text-xs">
                                                                                <div className="font-medium mb-2">Coordinates:</div>
                                                                                <div className="space-y-1 max-h-48 overflow-y-auto">
                                                                                    {zone.points.map((point, index) => (
                                                                                        <div key={index} className="flex justify-between p-1 hover:bg-accent/50 rounded">
                                                                                            <span>Point {index + 1}:</span>
                                                                                            <span>({Math.round(point.x)}, {Math.round(point.y)})</span>
                                                                                        </div>
                                                                                    ))}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    </AccordionContent>
                                                                </AccordionItem>
                                                            ))}
                                                        </Accordion>
                                                    )}
                                                </>
                                            )}
                                        </div>

                                        {/* Parameters Form */}
                                        <ParametersForm
                                            activityType={selectedActivity}
                                            parameters={parameters}
                                            onChange={(newParameters) => {
                                                setParameters(newParameters);
                                                if (editingNameId) {
                                                    // If editing, update both sides
                                                    const updatedActivities = savedActivities.map(activity =>
                                                        activity.id === editingNameId
                                                            ? { ...activity, parameters: { ...newParameters } }
                                                            : activity
                                                    );
                                                    setSavedActivities(updatedActivities);
                                                    saveToActivity(updatedActivities);
                                                }
                                            }}
                                            onActivityChange={(activity) => {
                                                setSelectedActivity(activity);
                                                const activityConfig = activityData.find(act => act.name === activity);
                                                if (activityConfig && !editingNameId) {
                                                    setParameters({ ...activityConfig.data.parameters });
                                                    setIsDrawingEnabled(true);
                                                }
                                            }}
                                        />

                                        {/* Save/Update Activity Button */}
                                        <div className="pt-4 border-t border-border">
                                            {editingNameId ? (
                                                <Button
                                                    onClick={() => handleSaveName(editingNameId)}
                                                    className="w-full"
                                                    disabled={!selectedActivity || Object.keys(parameters).length === 0}
                                                >
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Update Activity
                                                </Button>
                                            ) : (
                                                <Button
                                                    onClick={handleSaveActivity}
                                                    className="w-full"
                                                    disabled={!selectedActivity || Object.keys(parameters).length === 0}
                                                >
                                                    <Save className="h-4 w-4 mr-2" />
                                                    Save Activity
                                                </Button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Add Alert Dialog for Delete Confirmation */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                        <AlertDialogDescription>
                            {itemToDelete?.type === 'activity' 
                                ? "This will permanently delete this activity and all its associated parameters. This action cannot be undone."
                                : "This will permanently delete this zone and all its associated settings. This action cannot be undone."}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={handleDeleteConfirm}>
                            Delete {itemToDelete?.type === 'activity' ? 'Activity' : 'Zone'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
};

export default MasksAndZones; 