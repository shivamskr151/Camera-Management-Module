import React, { useState, useRef, useCallback, useMemo } from 'react';
import { Point, PolygonDrawerHandle } from "@/lib/zone-drawer";
import PolygonDrawer from "@/lib/zone-drawer/PolygonDrawer";
import { Plus, Edit3, Trash2, Camera, Check, X } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import CameraSearch, { Camera as CameraType } from '@/components/CameraSearch';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

interface SavedPolygon {
    id: string;
    points: Point[];
    color: string;
    isActive?: boolean;
    name: string;
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
    onEditingNameChange 
}: {
    polygon: SavedPolygon;
    isActive: boolean;
    onEdit: () => void;
    onDelete: () => void;
    onStartEditingName: () => void;
    onSaveName: () => void;
    onCancelEditingName: () => void;
    editingNameId: string | null;
    editingName: string;
    onEditingNameChange: (value: string) => void;
}) => (
    <div
        className={`flex items-center justify-between p-2 rounded-md ${
            isActive ? 'bg-primary/10' : 'bg-muted'
        }`}
    >
        <div className="flex items-center gap-2 flex-1">
            <div
                className="w-4 h-4 rounded-full"
                style={{ backgroundColor: polygon.color }}
            />
            {editingNameId === polygon.id ? (
                <div className="flex items-center gap-1 flex-1">
                    <Input
                        value={editingName}
                        onChange={(e) => onEditingNameChange(e.target.value)}
                        className="h-7 text-sm"
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                onSaveName();
                            } else if (e.key === 'Escape') {
                                onCancelEditingName();
                            }
                        }}
                    />
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={onSaveName}
                    >
                        <Check className="h-4 w-4" />
                    </Button>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7"
                        onClick={onCancelEditingName}
                    >
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            ) : (
                <span 
                    className="text-sm font-medium cursor-pointer hover:text-primary"
                    onClick={onStartEditingName}
                >
                    {polygon.name}
                </span>
            )}
        </div>
        <div className="flex space-x-2">
            <Button
                variant="ghost"
                size="icon"
                onClick={onEdit}
                className="h-8 w-8"
            >
                <Edit3 className="h-4 w-4" />
            </Button>
            <Button
                variant="ghost"
                size="icon"
                onClick={onDelete}
                className="h-8 w-8 text-destructive"
            >
                <Trash2 className="h-4 w-4" />
            </Button>
        </div>
    </div>
));

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
    const [editingNameId, setEditingNameId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [newZoneName, setNewZoneName] = useState('');

    // Refs
    const polygonDrawerRef = useRef<PolygonDrawerHandle>(null);
    const nameInputRef = useRef<HTMLInputElement>(null);
    const newZoneInputRef = useRef<HTMLInputElement>(null);

    // Callbacks
    const handlePolygonChange = useCallback((points: Point[]) => {
        setPolygonPoints(points);
    }, []);

    const handleStartDrawing = useCallback(() => {
        setIsDrawingMode(true);
        setActivePolygonId(null);
        setNewZoneName('');
        if (polygonDrawerRef.current) {
            polygonDrawerRef.current.resetPolygon();
        }
        setTimeout(() => {
            newZoneInputRef.current?.focus();
        }, 0);
    }, []);

    const handleSavePolygon = useCallback(() => {
        if (polygonPoints.length < 3) {
            alert('Please draw a polygon with at least 3 points');
            return;
        }

        if (!newZoneName.trim()) {
            alert('Please enter a name for the zone');
            newZoneInputRef.current?.focus();
            return;
        }

        if (activePolygonId) {
            setSavedPolygons(prev => prev.map(polygon =>
                polygon.id === activePolygonId
                    ? { ...polygon, points: [...polygonPoints], color: strokeColor, name: newZoneName.trim() }
                    : polygon
            ));
        } else {
            const newPolygon: SavedPolygon = {
                id: Date.now().toString(),
                points: [...polygonPoints],
                color: strokeColor,
                name: newZoneName.trim()
            };
            setSavedPolygons(prev => [...prev, newPolygon]);
        }

        if (polygonDrawerRef.current) {
            polygonDrawerRef.current.resetPolygon();
        }
        setIsDrawingMode(false);
        setActivePolygonId(null);
        setNewZoneName('');
    }, [polygonPoints, newZoneName, activePolygonId, strokeColor]);

    const handleDeletePolygon = useCallback((id: string) => {
        setSavedPolygons(prev => prev.filter(polygon => polygon.id !== id));
        if (activePolygonId === id) {
            setActivePolygonId(null);
            if (polygonDrawerRef.current) {
                polygonDrawerRef.current.resetPolygon();
            }
        }
    }, [activePolygonId]);

    const handleEditPolygon = useCallback((polygon: SavedPolygon) => {
        setStrokeColor(polygon.color);
        setActivePolygonId(polygon.id);
        setPolygonPoints([...polygon.points]);
        setNewZoneName(polygon.name);
        setIsDrawingMode(true);

        if (polygonDrawerRef.current) {
            polygonDrawerRef.current.setPoints(polygon.points);
        }
        setTimeout(() => {
            newZoneInputRef.current?.focus();
        }, 0);
    }, []);

    const handleCancelDrawing = useCallback(() => {
        setIsDrawingMode(false);
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
        setTimeout(() => {
            nameInputRef.current?.focus();
        }, 0);
    }, []);

    const handleSaveName = useCallback((id: string) => {
        if (editingName.trim()) {
            setSavedPolygons(prev => prev.map(polygon =>
                polygon.id === id
                    ? { ...polygon, name: editingName.trim() }
                    : polygon
            ));
        }
        setEditingNameId(null);
    }, [editingName]);

    const handleCancelEditingName = useCallback(() => {
        setEditingNameId(null);
    }, []);

    // Memoized values
    const activePolygon = useMemo(() => 
        savedPolygons.find(p => p.id === activePolygonId),
        [savedPolygons, activePolygonId]
    );

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
                            <div className="flex flex-col lg:flex-row h-full gap-4">
                                {/* Controls Panel */}
                                <div className="w-full lg:w-1/3 space-y-6">
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
                                            />
                                            <span className="text-sm text-muted-foreground w-10">{Math.round(fillOpacity * 100)}%</span>
                                        </div>
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="space-y-4">
                                        {isDrawingMode ? (
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
                                                        {activePolygonId ? 'Update' : 'Save'} Zone
                                                    </Button>
                                                </div>
                                            </>
                                        ) : (
                                            <Button
                                                onClick={handleStartDrawing}
                                                className="flex-1"
                                            >
                                                <Plus className="h-4 w-4 mr-2" />
                                                Draw New Zone
                                            </Button>
                                        )}
                                    </div>

                                    {/* Saved Zones List */}
                                    <div className="mt-6 pt-6 border-t border-border">
                                        <h3 className="text-lg font-medium mb-2">Saved Zones ({savedPolygons.length})</h3>
                                        <div className="space-y-2">
                                            {savedPolygons.map(polygon => (
                                                <SavedZoneItem
                                                    key={polygon.id}
                                                    polygon={polygon}
                                                    isActive={activePolygonId === polygon.id}
                                                    onEdit={() => handleEditPolygon(polygon)}
                                                    onDelete={() => handleDeletePolygon(polygon.id)}
                                                    onStartEditingName={() => handleStartEditingName(polygon)}
                                                    onSaveName={() => handleSaveName(polygon.id)}
                                                    onCancelEditingName={handleCancelEditingName}
                                                    editingNameId={editingNameId}
                                                    editingName={editingName}
                                                    onEditingNameChange={setEditingName}
                                                />
                                            ))}
                                        </div>
                                    </div>
                                </div>

                                {/* Drawing Area */}
                                <div className="w-full lg:w-2/3">
                                    <div className="relative w-full aspect-video bg-muted rounded-lg">
                                        {/* Camera feed placeholder */}
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <span className="text-muted-foreground">Camera Feed</span>
                                        </div>

                                        {/* Display saved polygons */}
                                        <div className="absolute inset-0 pointer-events-none">
                                            <svg className="w-full h-full">
                                                {savedPolygons.map(polygon => (
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
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
};

export default MasksAndZones; 