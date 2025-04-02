import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle } from 'react';
import { Plus, Edit3, Trash2, Check, X, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { PolygonDrawer, PolygonDrawerHandle, Point } from './PolygonDrawer';
import { toast } from 'sonner';

export interface SavedPolygon {
  id: string;
  points: Point[];
  color: string;
  name: string;
  type?: 'detection' | 'exclusion';
}

export interface MultiPolygonDrawerProps {
  className?: string;
  style?: React.CSSProperties;
  initialPolygons?: SavedPolygon[];
  onChange?: (polygons: SavedPolygon[]) => void;
  onSave?: (polygons: SavedPolygon[]) => void;
  strokeWidth?: number;
  pointRadius?: number;
  fillOpacity?: number;
  disabled?: boolean;
  children?: React.ReactNode;
  zoneType?: 'detection' | 'exclusion';
}

export interface MultiPolygonDrawerHandle {
  resetAll: () => void;
  getPolygons: () => SavedPolygon[];
  setPolygons: (polygons: SavedPolygon[]) => void;
  addPolygon: (polygon: SavedPolygon) => void;
}

const MultiPolygonDrawerComponent = forwardRef<MultiPolygonDrawerHandle, MultiPolygonDrawerProps>(({
  className = '',
  style = {},
  initialPolygons = [],
  onChange,
  onSave,
  strokeWidth = 2,
  pointRadius = 5,
  fillOpacity = 0.2,
  disabled = false,
  children,
  zoneType = 'detection',
}, ref) => {
  const [polygons, setPolygons] = useState<SavedPolygon[]>(initialPolygons);
  const [polygonPoints, setPolygonPoints] = useState<Point[]>([]);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [activePolygonId, setActivePolygonId] = useState<string | null>(null);
  const [strokeColor, setStrokeColor] = useState(zoneType === 'detection' ? '#4CAF50' : '#F44336');
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [newZoneName, setNewZoneName] = useState('');
  
  const polygonDrawerRef = useRef<PolygonDrawerHandle>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // Expose methods via ref
  useImperativeHandle(ref, () => ({
    resetAll: () => {
      setPolygons([]);
      setPolygonPoints([]);
      setActivePolygonId(null);
      setIsDrawingMode(false);
      if (onChange) {
        onChange([]);
      }
    },
    getPolygons: () => [...polygons],
    setPolygons: (newPolygons: SavedPolygon[]) => {
      setPolygons(newPolygons);
      if (onChange) {
        onChange(newPolygons);
      }
    },
    addPolygon: (polygon: SavedPolygon) => {
      const updatedPolygons = [...polygons, polygon];
      setPolygons(updatedPolygons);
      if (onChange) {
        onChange(updatedPolygons);
      }
    }
  }));

  const handlePolygonChange = (points: Point[]) => {
    setPolygonPoints(points);
  };

  const handleStartDrawing = () => {
    setIsDrawingMode(true);
    setActivePolygonId(null);
    setStrokeColor(zoneType === 'detection' ? '#4CAF50' : '#F44336');
    setNewZoneName('');
    if (polygonDrawerRef.current) {
      polygonDrawerRef.current.resetPolygon();
    }
  };

  const handleSavePolygon = () => {
    if (polygonPoints.length < 3) {
      toast.error('Please draw a polygon with at least 3 points');
      return;
    }

    if (activePolygonId) {
      // Update existing polygon
      setPolygons(prev => prev.map(polygon =>
        polygon.id === activePolygonId
          ? { ...polygon, points: [...polygonPoints], color: strokeColor }
          : polygon
      ));
      toast.success('Zone updated successfully');
    } else {
      // Create new polygon
      const zoneName = newZoneName.trim() 
        ? newZoneName.trim() 
        : `${zoneType === 'detection' ? 'Detection' : 'Exclusion'} Zone ${polygons.length + 1}`;
        
      const newPolygon: SavedPolygon = {
        id: Date.now().toString(),
        points: [...polygonPoints],
        color: strokeColor,
        name: zoneName,
        type: zoneType
      };
      setPolygons(prev => [...prev, newPolygon]);
      toast.success('New zone created successfully');
    }

    if (polygonDrawerRef.current) {
      polygonDrawerRef.current.resetPolygon();
    }
    setIsDrawingMode(false);
    setActivePolygonId(null);
    setPolygonPoints([]);

    // Notify parent about change
    if (onChange) {
      if (activePolygonId) {
        onChange(polygons.map(polygon => 
          polygon.id === activePolygonId
            ? { ...polygon, points: [...polygonPoints], color: strokeColor }
            : polygon
        ));
      } else {
        const zoneName = newZoneName.trim() 
          ? newZoneName.trim() 
          : `${zoneType === 'detection' ? 'Detection' : 'Exclusion'} Zone ${polygons.length + 1}`;
          
        const newPolygon: SavedPolygon = {
          id: Date.now().toString(),
          points: [...polygonPoints],
          color: strokeColor,
          name: zoneName,
          type: zoneType
        };
        onChange([...polygons, newPolygon]);
      }
    }
  };

  const handleDeletePolygon = (id: string) => {
    const updatedPolygons = polygons.filter(polygon => polygon.id !== id);
    setPolygons(updatedPolygons);
    
    if (activePolygonId === id) {
      setActivePolygonId(null);
      if (polygonDrawerRef.current) {
        polygonDrawerRef.current.resetPolygon();
      }
    }
    
    if (onChange) {
      onChange(updatedPolygons);
    }
    
    toast.success('Zone deleted successfully');
  };

  const handleEditPolygon = (polygon: SavedPolygon) => {
    setStrokeColor(polygon.color);
    setActivePolygonId(polygon.id);
    setPolygonPoints([...polygon.points]);
    setIsDrawingMode(true);

    if (polygonDrawerRef.current) {
      polygonDrawerRef.current.setPoints(polygon.points);
    }
  };

  const handleCancelDrawing = () => {
    setIsDrawingMode(false);
    setPolygonPoints([]);
    setActivePolygonId(null);
    setNewZoneName('');
    if (polygonDrawerRef.current) {
      polygonDrawerRef.current.resetPolygon();
    }
  };

  const handleStartEditingName = (polygon: SavedPolygon) => {
    setEditingNameId(polygon.id);
    setEditingName(polygon.name);
    // Focus the input after a short delay to ensure it's rendered
    setTimeout(() => {
      nameInputRef.current?.focus();
    }, 0);
  };

  const handleSaveName = (id: string) => {
    if (editingName.trim()) {
      const updatedPolygons = polygons.map(polygon =>
        polygon.id === id
          ? { ...polygon, name: editingName.trim() }
          : polygon
      );
      
      setPolygons(updatedPolygons);
      
      if (onChange) {
        onChange(updatedPolygons);
      }
    }
    setEditingNameId(null);
  };

  const handleCancelEditingName = () => {
    setEditingNameId(null);
  };

  const handleSaveAll = () => {
    if (onSave && polygons.length > 0) {
      onSave(polygons);
    }
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex flex-col md:flex-row gap-4">
        {/* Control Panel */}
        <div className="w-full md:w-80 space-y-4">
          {/* Action Buttons */}
          <div className="flex gap-2">
            {isDrawingMode ? (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleCancelDrawing}
                  className="flex-1 flex items-center gap-1"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleSavePolygon}
                  disabled={polygonPoints.length < 3}
                  className="flex-1 flex items-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  <span>{activePolygonId ? 'Update' : 'Save'}</span>
                </Button>
              </>
            ) : (
              <>
                <Button
                  variant="default"
                  size="sm"
                  onClick={handleStartDrawing}
                  className="flex-1 flex items-center gap-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>New {zoneType === 'detection' ? 'Zone' : 'Mask'}</span>
                </Button>
                {polygons.length > 0 && (
                  <Button
                    variant="default"
                    size="sm"
                    onClick={handleSaveAll}
                    className="flex items-center gap-1"
                  >
                    <Check className="h-4 w-4" />
                    <span>Save All</span>
                  </Button>
                )}
              </>
            )}
          </div>

          {/* Editing Controls */}
          {isDrawingMode && (
            <div className="space-y-2 p-3 border rounded-md">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium w-20">Name:</label>
                <Input
                  type="text"
                  value={newZoneName}
                  onChange={(e) => setNewZoneName(e.target.value)}
                  placeholder={`New ${zoneType === 'detection' ? 'Zone' : 'Mask'} Name`}
                  className="h-8 text-sm"
                />
              </div>
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium w-20">Color:</label>
                <input
                  type="color"
                  value={strokeColor}
                  onChange={(e) => setStrokeColor(e.target.value)}
                  className="h-8 w-12 cursor-pointer rounded"
                />
                <span className="text-sm text-gray-500">{strokeColor}</span>
              </div>
            </div>
          )}

          {/* Saved Zones List */}
          {polygons.length > 0 && !isDrawingMode && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">
                Saved {zoneType === 'detection' ? 'Zones' : 'Masks'} ({polygons.length})
              </h3>
              <Card>
                <CardContent className="p-2 space-y-2">
                  {polygons.map(polygon => (
                    <div
                      key={polygon.id}
                      className={`flex items-center justify-between p-2 text-sm rounded-md border ${
                        activePolygonId === polygon.id
                          ? 'bg-primary/5 border-primary/20'
                          : 'bg-background border-muted-foreground/20'
                      }`}
                    >
                      <div className="flex items-center flex-1 min-w-0">
                        <div
                          className="w-3 h-3 rounded-full mr-2 flex-shrink-0"
                          style={{ backgroundColor: polygon.color }}
                        />
                        {editingNameId === polygon.id ? (
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            <Input
                              ref={nameInputRef}
                              value={editingName}
                              onChange={(e) => setEditingName(e.target.value)}
                              className="h-7 text-sm"
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleSaveName(polygon.id);
                                } else if (e.key === 'Escape') {
                                  handleCancelEditingName();
                                }
                              }}
                            />
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => handleSaveName(polygon.id)}
                            >
                              <Check className="h-3 w-3" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={handleCancelEditingName}
                            >
                              <X className="h-3 w-3" />
                            </Button>
                          </div>
                        ) : (
                          <span 
                            className="truncate hover:text-primary cursor-pointer"
                            onClick={() => handleStartEditingName(polygon)}
                            title={polygon.name}
                          >
                            {polygon.name}
                          </span>
                        )}
                      </div>
                      <div className="flex gap-1 ml-2 flex-shrink-0">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditPolygon(polygon)}
                          className="h-6 w-6"
                          title="Edit zone"
                        >
                          <Edit3 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletePolygon(polygon.id)}
                          className="h-6 w-6 text-destructive"
                          title="Delete zone"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          )}
        </div>

        {/* Drawing Canvas */}
        <div className="flex-1 bg-gray-50 dark:bg-gray-800 rounded-lg overflow-hidden">
          <div className="relative w-full aspect-video">
            {/* Background content */}
            <div className="absolute inset-0">
              {children}
            </div>

            {/* Display saved polygons */}
            {polygons.length > 0 && (
              <div className="absolute inset-0 pointer-events-none">
                <svg className="w-full h-full">
                  {polygons.map(polygon => {
                    const pointsString = polygon.points
                      .map(point => `${point.x},${point.y}`)
                      .join(' ');

                    const isActive = activePolygonId === polygon.id;

                    return (
                      <polygon
                        key={polygon.id}
                        points={pointsString}
                        fill={polygon.color}
                        fillOpacity={isActive ? 0.1 : fillOpacity}
                        stroke={polygon.color}
                        strokeWidth={isActive ? 1 : strokeWidth}
                        strokeDasharray={isActive ? "5,5" : "none"}
                      />
                    );
                  })}
                </svg>
              </div>
            )}

            {/* Active polygon drawer */}
            {isDrawingMode && (
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
            )}

            {/* Placeholder message */}
            {!isDrawingMode && polygons.length === 0 && !children && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <p>Click "New {zoneType === 'detection' ? 'Zone' : 'Mask'}" to start drawing</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {isDrawingMode && (
        <div className="text-sm text-muted-foreground">
          Click on the canvas to create points. A {zoneType === 'detection' ? 'zone' : 'mask'} requires at least 3 points.
        </div>
      )}
    </div>
  );
});

MultiPolygonDrawerComponent.displayName = 'MultiPolygonDrawer';

export default MultiPolygonDrawerComponent; 