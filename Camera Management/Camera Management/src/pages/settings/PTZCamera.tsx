import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { ZoomIn, ZoomOut, Home, Camera, Play, Square } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Slider } from '@/components/ui/slider';
import CameraSearch, { Camera as CameraType } from '@/components/CameraSearch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

// Move interfaces to a separate types file
interface Preset {
  id: number;
  name: string;
  angle: number;
  tilt: number;
  zoom: number;
  panTilt: { pan: number; tilt: number };
  joystickPosition: { x: number; y: number };
  createdAt: number;
  lastUsed?: number;
  duration: number;
  durationUnit: 'hours' | 'minutes' | 'seconds';
  lastModified?: number;
  selectedForPatrol: boolean;
}

interface CameraAPIResponse {
  success: boolean;
  message?: string;
}

interface PatrolState {
  isPatrolling: boolean;
  currentPresetIndex: number;
  startTime: string;
  endTime: string;
  isSinglePresetPatrol: boolean;
  singlePresetId: number | null;
  remainingTime: number;
  activePresetId: number | null;
}

interface PTZCameraProps {
  className?: string;
}

// Memoized components
const CameraPreview = React.memo(({ 
  showGridlines, 
  panTilt, 
  angle, 
  tilt, 
  zoom 
}: { 
  showGridlines: boolean;
  panTilt: { pan: number; tilt: number };
  angle: number;
  tilt: number;
  zoom: number;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const drawCameraView = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#1a1a1a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (showGridlines) {
        ctx.strokeStyle = "#333";
        ctx.lineWidth = 1;
        for (let x = 0; x <= canvas.width; x += 30) {
          ctx.beginPath();
          ctx.moveTo(x, 0);
          ctx.lineTo(x, canvas.height);
          ctx.stroke();
        }
        for (let y = 0; y <= canvas.height; y += 30) {
          ctx.beginPath();
          ctx.moveTo(0, y);
          ctx.lineTo(canvas.width, y);
          ctx.stroke();
        }
      }

      // Draw camera indicator
      ctx.fillStyle = "#4CAF50";
      ctx.beginPath();
      ctx.arc(
        canvas.width / 2 + panTilt.pan * 50,
        canvas.height / 2 + panTilt.tilt * 50,
        10 * zoom,
        0,
        Math.PI * 2
      );
      ctx.fill();

      // Draw FOV lines
      ctx.strokeStyle = "#ffffff33";
      ctx.lineWidth = 2;
      const fovAngle = 60 / zoom;
      const startAngle = (angle - fovAngle / 2) * Math.PI / 180;
      const endAngle = (angle + fovAngle / 2) * Math.PI / 180;
      const lineLength = 100;

      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 + panTilt.pan * 50, canvas.height / 2 + panTilt.tilt * 50);
      ctx.lineTo(
        canvas.width / 2 + panTilt.pan * 50 + Math.cos(startAngle) * lineLength,
        canvas.height / 2 + panTilt.tilt * 50 + Math.sin(startAngle) * lineLength
      );
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 + panTilt.pan * 50, canvas.height / 2 + panTilt.tilt * 50);
      ctx.lineTo(
        canvas.width / 2 + panTilt.pan * 50 + Math.cos(endAngle) * lineLength,
        canvas.height / 2 + panTilt.tilt * 50 + Math.sin(endAngle) * lineLength
      );
      ctx.stroke();
    };

    drawCameraView();
  }, [showGridlines, panTilt, angle, tilt, zoom]);

  return (
    <canvas 
      ref={canvasRef}
      className="w-full h-full" 
      width={300}
      height={180}
    />
  );
});

const PresetCard = React.memo(({ 
  preset, 
  isSelected, 
  isMoving, 
  onLoad, 
  onEdit, 
  onDelete, 
  onTogglePatrol, 
  onStartSinglePresetPatrol,
  isPatrolling 
}: {
  preset: Preset;
  isSelected: boolean;
  isMoving: boolean;
  onLoad: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onTogglePatrol: () => void;
  onStartSinglePresetPatrol: () => void;
  isPatrolling: boolean;
}) => (
  <Card className="p-3 relative">
    <div className={`absolute top-0 right-0 w-2 h-2 rounded-full ${
      isSelected ? 'bg-green-500' : 'bg-transparent'
    }`} />
    <div className="flex justify-between items-start">
      <div>
        <h4 className="font-medium">{preset.name}</h4>
        <p className="text-xs text-gray-500">
          Created: {new Date(preset.createdAt).toLocaleString()}
        </p>
        {preset.lastUsed && (
          <p className="text-xs text-gray-500">
            Last used: {new Date(preset.lastUsed).toLocaleString()}
          </p>
        )}
      </div>
      <div className="flex space-x-1">
        <Button
          size="sm"
          variant="outline"
          onClick={onLoad}
          disabled={isMoving}
        >
          {isMoving && isSelected ? 'Moving...' : 'Load'}
        </Button>
        <Button
          size="sm"
          variant="outline"
          onClick={onEdit}
        >
          Edit
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={onDelete}
        >
          Delete
        </Button>
      </div>
    </div>
    <div className="mt-2 grid grid-cols-3 gap-1 text-xs">
      <div>Pan: {preset.panTilt.pan.toFixed(2)}</div>
      <div>Tilt: {preset.panTilt.tilt.toFixed(2)}</div>
      <div>Zoom: {preset.zoom.toFixed(1)}x</div>
    </div>
    <div className="mt-2 flex items-center justify-between">
      <div className="flex items-center">
        <Checkbox
          id={`patrol-${preset.id}`}
          checked={preset.selectedForPatrol}
          onCheckedChange={onTogglePatrol}
        />
        <label
          htmlFor={`patrol-${preset.id}`}
          className="ml-2 text-sm"
        >
          Include in patrol
        </label>
      </div>
      <Button
        size="sm"
        variant="outline"
        onClick={onStartSinglePresetPatrol}
        disabled={isPatrolling}
      >
        Patrol this preset
      </Button>
    </div>
  </Card>
));

const PTZCamera: React.FC<PTZCameraProps> = ({ className }) => {
  // Refs
  const joystickContainerRef = useRef<HTMLDivElement>(null);
  const joystickHandleRef = useRef<HTMLDivElement>(null);
  const cameraPreviewRef = useRef<HTMLCanvasElement>(null);
  
  // State variables
  const [selectedCamera, setSelectedCamera] = useState<CameraType | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [panTilt, setPanTilt] = useState({ pan: 0, tilt: 0 });
  const [angle, setAngle] = useState(0);
  const [tilt, setTilt] = useState(0);
  const [zoom, setZoom] = useState(1);
  const [manualAngle, setManualAngle] = useState(0);
  const [manualTilt, setManualTilt] = useState(0);
  const [joystickPosition, setJoystickPosition] = useState({ x: 0, y: 0 });
  const [showGridlines, setShowGridlines] = useState(true);
  const [presets, setPresets] = useState<Preset[]>(() => {
    const savedPresets = localStorage.getItem('cameraPresets');
    return savedPresets ? JSON.parse(savedPresets) : [];
  });
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [isMoving, setIsMoving] = useState(false);
  const [moveError, setMoveError] = useState<string | null>(null);
  const [newPresetName, setNewPresetName] = useState('');
  const [editingPreset, setEditingPreset] = useState<Preset | null>(null);
  const [showPresetDialog, setShowPresetDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('control');
  const [patrol, setPatrol] = useState<PatrolState>({
    isPatrolling: false,
    currentPresetIndex: 0,
    startTime: '00:00',
    endTime: '23:59',
    isSinglePresetPatrol: false,
    singlePresetId: null,
    remainingTime: 0,
    activePresetId: null
  });
  const patrolIntervalRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Save presets to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('cameraPresets', JSON.stringify(presets));
  }, [presets]);

  // Update the patrol effect to use preset durations in seconds and handle countdown
  useEffect(() => {
    const checkPatrolTime = () => {
      if (!patrol.isPatrolling) return;
      if (patrol.isSinglePresetPatrol && !patrol.singlePresetId) return;

      const now = new Date();
      const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
      
      if (currentTime >= patrol.startTime && currentTime <= patrol.endTime) {
        let currentPreset;
        
        if (patrol.isSinglePresetPatrol) {
          currentPreset = presets.find(p => p.id === patrol.singlePresetId);
        } else {
          const selectedPresets = presets.filter(p => p.selectedForPatrol);
          if (selectedPresets.length < 2) return;
          currentPreset = selectedPresets[patrol.currentPresetIndex % selectedPresets.length];
        }
        
        if (!currentPreset) {
          stopPatrol();
          return;
        }

        // Only load preset and set remaining time if it's a new patrol or switching presets
        if (patrol.remainingTime <= 0) {
          if (patrol.isSinglePresetPatrol) {
            loadPreset(currentPreset);
            setPatrol(prev => ({
              ...prev,
              remainingTime: currentPreset.duration,
              activePresetId: currentPreset.id
            }));
          } else {
            const nextIndex = (patrol.currentPresetIndex + 1) % presets.filter(p => p.selectedForPatrol).length;
            const nextPreset = presets.filter(p => p.selectedForPatrol)[nextIndex];
            loadPreset(nextPreset);
            setPatrol(prev => ({
              ...prev,
              currentPresetIndex: nextIndex,
              remainingTime: nextPreset.duration,
              activePresetId: nextPreset.id
            }));
          }
        }
      } else if (currentTime > patrol.endTime) {
        stopPatrol();
      }
    };

    const intervalId = setInterval(checkPatrolTime, 1000);
    return () => {
      clearInterval(intervalId);
      if (patrolIntervalRef.current) {
        clearTimeout(patrolIntervalRef.current);
      }
    };
  }, [patrol.isPatrolling, patrol.currentPresetIndex, patrol.startTime, patrol.endTime, patrol.isSinglePresetPatrol, patrol.singlePresetId, patrol.remainingTime, presets]);

  // Add countdown effect
  useEffect(() => {
    let countdownInterval: number;
    
    if (patrol.isPatrolling && patrol.remainingTime > 0) {
      countdownInterval = window.setInterval(() => {
        setPatrol(prev => ({
          ...prev,
          remainingTime: Math.max(0, prev.remainingTime - 1)
        }));
      }, 1000);
    }

    return () => {
      if (countdownInterval) {
        clearInterval(countdownInterval);
      }
    };
  }, [patrol.isPatrolling, patrol.remainingTime]);

  // Canvas preview effect
  useEffect(() => {
    if (cameraPreviewRef.current) {
      const canvas = cameraPreviewRef.current;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        const drawCameraView = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.fillStyle = "#1a1a1a";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          if (showGridlines) {
            ctx.strokeStyle = "#333";
            ctx.lineWidth = 1;
            for (let x = 0; x <= canvas.width; x += 30) {
              ctx.beginPath();
              ctx.moveTo(x, 0);
              ctx.lineTo(x, canvas.height);
              ctx.stroke();
            }
            for (let y = 0; y <= canvas.height; y += 30) {
              ctx.beginPath();
              ctx.moveTo(0, y);
              ctx.lineTo(canvas.width, y);
              ctx.stroke();
            }
          }

          // Draw camera indicator
          ctx.fillStyle = "#4CAF50";
          ctx.beginPath();
          ctx.arc(
            canvas.width / 2 + panTilt.pan * 50,
            canvas.height / 2 + panTilt.tilt * 50,
            10 * zoom,
            0,
            Math.PI * 2
          );
          ctx.fill();

          // Draw FOV lines
          ctx.strokeStyle = "#ffffff33";
          ctx.lineWidth = 2;
          const fovAngle = 60 / zoom;
          const startAngle = (angle - fovAngle / 2) * Math.PI / 180;
          const endAngle = (angle + fovAngle / 2) * Math.PI / 180;
          const lineLength = 100;

          ctx.beginPath();
          ctx.moveTo(canvas.width / 2 + panTilt.pan * 50, canvas.height / 2 + panTilt.tilt * 50);
          ctx.lineTo(
            canvas.width / 2 + panTilt.pan * 50 + Math.cos(startAngle) * lineLength,
            canvas.height / 2 + panTilt.tilt * 50 + Math.sin(startAngle) * lineLength
          );
          ctx.stroke();

          ctx.beginPath();
          ctx.moveTo(canvas.width / 2 + panTilt.pan * 50, canvas.height / 2 + panTilt.tilt * 50);
          ctx.lineTo(
            canvas.width / 2 + panTilt.pan * 50 + Math.cos(endAngle) * lineLength,
            canvas.height / 2 + panTilt.tilt * 50 + Math.sin(endAngle) * lineLength
          );
          ctx.stroke();
        }

        drawCameraView();
      }
    }
  }, [panTilt, angle, tilt, zoom, showGridlines]);

  // Format remaining time for display
  const formatRemainingTime = (seconds: number): string => {
    if (seconds <= 0) return '00:00:00';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  };

  // Handle camera selection
  const handleCameraSelect = (camera: CameraType) => {
    setSelectedCamera(camera);
    resetCamera();
    console.log(`Initializing PTZ control for camera: ${camera.name}`);
  };

  // Update handle position based on mouse/touch event
  const updateHandlePosition = (event: MouseEvent | TouchEvent) => {
    if (!joystickContainerRef.current || !joystickHandleRef.current || !selectedCamera) return;

    const rect = joystickContainerRef.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX;
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY;

    // Calculate position relative to center
    let x = clientX - centerX;
    let y = clientY - centerY;

    // Calculate distance from center
    const distance = Math.sqrt(x * x + y * y);
    const maxRadius = rect.width / 2 - 20; // Subtract handle radius

    // Limit to max radius
    if (distance > maxRadius) {
      x = (x / distance) * maxRadius;
      y = (y / distance) * maxRadius;
    }

    // Calculate angle (0-360 degrees)
    let angleDeg = Math.atan2(y, x) * (180 / Math.PI);
    if (angleDeg < 0) angleDeg += 360;

    // Calculate tilt (0-90 degrees based on distance)
    const normalizedTilt = (distance / maxRadius) * 90;

    // Update state
    setAngle(angleDeg);
    setTilt(normalizedTilt);
    setPanTilt({ 
      pan: x / maxRadius, 
      tilt: y / maxRadius 
    });
    setJoystickPosition({ x, y });
  };

  // Start dragging the joystick
  const startDrag = (event: React.MouseEvent | React.TouchEvent) => {
    if (!selectedCamera) return;
    setIsDragging(true);
    event.preventDefault();
    updateHandlePosition(event.nativeEvent);
  };

  const drag = (event: MouseEvent | TouchEvent) => {
    if (!isDragging || !selectedCamera) return;
    event.preventDefault();
    updateHandlePosition(event);
  };

  const stopDrag = () => {
    setIsDragging(false);
  };

  // Add event listeners for document-level events
  useEffect(() => {
    if (!isDragging) return;

    const handleMouseMove = (e: MouseEvent) => drag(e);
    const handleTouchMove = (e: TouchEvent) => drag(e);
    const handleMouseUp = () => stopDrag();
    const handleTouchEnd = () => stopDrag();

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging]);

  // Handle zoom change
  const handleZoomChange = (value: number) => {
    if (!selectedCamera) return;
    const newZoom = Math.min(5, Math.max(1, value));
    setZoom(newZoom);
  };

  // Reset camera to default position
  const resetCamera = () => {
    setAngle(0);
    setTilt(0);
    setZoom(1);
    setPanTilt({ pan: 0, tilt: 0 });
    setJoystickPosition({ x: 0, y: 0 });
    setManualAngle(0);
    setManualTilt(0);
  };

  // Save current position as a preset
  const savePreset = () => {
    if (!selectedCamera) return;
    
    const newPreset: Preset = {
      id: Date.now(),
      name: `Preset ${presets.length + 1}`,
      angle,
      tilt,
      zoom,
      panTilt,
      joystickPosition,
      createdAt: Date.now(),
      duration: 3600, // Default 1 hour in seconds
      durationUnit: 'hours',
      selectedForPatrol: false
    };
    setEditingPreset(newPreset);
    setShowPresetDialog(true);
  };

  // Convert time units to seconds
  const convertToSeconds = (value: number, unit: 'hours' | 'minutes' | 'seconds'): number => {
    switch (unit) {
      case 'hours':
        return Math.round(value * 3600);
      case 'minutes':
        return Math.round(value * 60);
      case 'seconds':
        return Math.round(value);
    }
  };

  // Convert seconds to time units
  const convertFromSeconds = (seconds: number, unit: 'hours' | 'minutes' | 'seconds'): number => {
    switch (unit) {
      case 'hours':
        return Number((seconds / 3600).toFixed(2));
      case 'minutes':
        return Number((seconds / 60).toFixed(2));
      case 'seconds':
        return seconds;
    }
  };

  // Handle saving a preset
  const handleSavePreset = (preset: Preset) => {
    const timestamp = Date.now();
    const updatedPreset = {
      ...preset,
      lastModified: timestamp
    };

    if (preset.id && presets.some(p => p.id === preset.id)) {
      // Update existing preset
      setPresets(prev => prev.map(p => 
        p.id === preset.id ? updatedPreset : p
      ));
    } else {
      // Add new preset
      setPresets(prev => [...prev, updatedPreset]);
    }
    setShowPresetDialog(false);
    setEditingPreset(null);
  };

  // Edit an existing preset
  const editPreset = (preset: Preset) => {
    setEditingPreset({ ...preset });
    setShowPresetDialog(true);
  };

  // Move camera to a specific position
  const moveCameraToPosition = async (position: {
    angle: number,
    tilt: number,
    zoom: number,
    panTilt: { pan: number; tilt: number }
  }): Promise<CameraAPIResponse> => {
    if (!selectedCamera) return { success: false, message: 'No camera selected' };

    try {
      setIsMoving(true);
      setMoveError(null);

      // Simulate API call - Replace with actual camera API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Update camera position
      setAngle(position.angle);
      setTilt(position.tilt);
      setZoom(position.zoom);
      setPanTilt(position.panTilt);
      setManualAngle(position.angle);
      setManualTilt(position.tilt);
      
      // Calculate joystick position based on panTilt
      if (joystickContainerRef.current) {
        const maxRadius = joystickContainerRef.current.clientWidth / 2;
        setJoystickPosition({
          x: position.panTilt.pan * maxRadius,
          y: position.panTilt.tilt * maxRadius
        });
      }

      return { success: true };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to move camera';
      setMoveError(errorMessage);
      return { success: false, message: errorMessage };
    } finally {
      setIsMoving(false);
    }
  };

  // Load a preset
  const loadPreset = async (preset: Preset) => {
    if (!selectedCamera) return;
    
    const response = await moveCameraToPosition({
      angle: preset.angle,
      tilt: preset.tilt,
      zoom: preset.zoom,
      panTilt: preset.panTilt
    });

    if (response.success) {
      setSelectedPreset(preset.id);
      
      // Calculate and set joystick position
      if (joystickContainerRef.current) {
        const maxRadius = joystickContainerRef.current.clientWidth / 2;
        setJoystickPosition({
          x: preset.panTilt.pan * maxRadius,
          y: preset.panTilt.tilt * maxRadius
        });
      }
      
      // Update last used timestamp
      setPresets(presets.map(p => 
        p.id === preset.id 
          ? { ...p, lastUsed: Date.now() } 
          : p
      ));
    } else {
      console.error('Failed to load preset:', response.message);
    }
  };

  // Delete a preset
  const deletePreset = (presetId: number) => {
    setPresets(presets.filter(preset => preset.id !== presetId));
    if (selectedPreset === presetId) {
      setSelectedPreset(null);
    }
  };

  // Start patrol with multiple presets
  const startPatrol = () => {
    const selectedPresets = presets.filter(p => p.selectedForPatrol);
    if (selectedPresets.length < 2) {
      toast.error('Need at least 2 selected presets to start patrol');
      return;
    }

    const firstPreset = selectedPresets[0];
    setPatrol(prev => ({
      ...prev,
      isPatrolling: true,
      currentPresetIndex: 0,
      isSinglePresetPatrol: false,
      singlePresetId: null,
      remainingTime: firstPreset.duration,
      activePresetId: firstPreset.id
    }));
  };

  // Start single preset patrol
  const startSinglePresetPatrol = (presetId: number) => {
    const preset = presets.find(p => p.id === presetId);
    if (!preset) return;

    setPatrol(prev => ({
      ...prev,
      isPatrolling: true,
      isSinglePresetPatrol: true,
      singlePresetId: presetId,
      remainingTime: preset.duration,
      activePresetId: presetId
    }));
  };

  // Stop patrol
  const stopPatrol = () => {
    setPatrol(prev => ({
      ...prev,
      isPatrolling: false,
      currentPresetIndex: 0,
      isSinglePresetPatrol: false,
      singlePresetId: null,
      activePresetId: null
    }));
    if (patrolIntervalRef.current) {
      clearTimeout(patrolIntervalRef.current);
    }
  };

  // Toggle preset selection for patrol
  const togglePresetSelection = (presetId: number) => {
    setPresets(prev => prev.map(p => 
      p.id === presetId 
        ? { ...p, selectedForPatrol: !p.selectedForPatrol }
        : p
    ));
  };

  // Handle manual angle change
  const handleManualAngleChange = (value: string) => {
    const angleValue = parseFloat(value);
    if (!isNaN(angleValue)) {
      setManualAngle(angleValue);
    }
  };

  // Handle manual tilt change
  const handleManualTiltChange = (value: string) => {
    const tiltValue = parseFloat(value);
    if (!isNaN(tiltValue)) {
      setManualTilt(Math.min(90, Math.max(0, tiltValue)));
    }
  };

  // Apply manual angle and tilt
  const applyManualAngle = () => {
    if (!selectedCamera || isNaN(manualAngle)) return;
    
    if (!joystickContainerRef.current) return;
    const maxRadius = joystickContainerRef.current.clientWidth / 2;
    
    // Calculate distance based on tilt value (0-90° maps to 0-maxRadius)
    const distance = (manualTilt / 90) * maxRadius;
    
    // Convert angle to radians
    const angleRad = manualAngle * (Math.PI / 180);
    
    // Calculate new x, y position based on angle and specified distance
    const x = Math.cos(angleRad) * distance;
    const y = Math.sin(angleRad) * distance;
    
    // Update position
    setAngle(manualAngle);
    setTilt(manualTilt);
    setJoystickPosition({ x, y });
    setPanTilt({ pan: x / maxRadius, tilt: y / maxRadius });
  };

  return (
    <div className={className}>
      <div className="flex flex-col space-y-6">
        <div className="flex justify-between items-center">
          <div>
          <h2 className="text-2xl font-bold">PTZ Camera</h2>
            {/* <p className="text-muted-foreground mt-1">
              Configure and manage your camera's pan, tilt, and zoom settings
            </p> */}
          </div>
          <CameraSearch 
            mode="ptz" 
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
            <p className="text-sm text-muted-foreground mt-2">Choose a camera to configure PTZ controls</p>
          </div>
        ) : (
          <>
            <Tabs 
              value={activeTab} 
              onValueChange={setActiveTab} 
              className="w-full"
            >
              <TabsList className="mb-6 bg-gray-100 dark:bg-gray-800 p-1 rounded-lg">
                <TabsTrigger 
                  value="control" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
                >
                  Camera Control
                </TabsTrigger>
                <TabsTrigger 
                  value="presets" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
                >
                  Presets Management
                </TabsTrigger>
                <TabsTrigger 
                  value="patrol" 
                  className="data-[state=active]:bg-white data-[state=active]:shadow-sm dark:data-[state=active]:bg-gray-700"
                >
                  Patrol Settings
                </TabsTrigger>
              </TabsList>

              <TabsContent value="control" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  <Card className="p-6 shadow-sm">
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold">Camera Preview</h3>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setShowGridlines(!showGridlines)}
                        className="text-xs"
                      >
                        {showGridlines ? 'Hide Grid' : 'Show Grid'}
                      </Button>
                    </div>
                    <div className="relative w-full aspect-video bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg overflow-hidden shadow-inner">
                      <canvas 
                        ref={cameraPreviewRef} 
                        className="w-full h-full" 
                        width={300}
                        height={180}
                      />
                    </div>
                    
                    <div className="mt-6 space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">Current Position</span>
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={resetCamera}
                          className="text-xs"
                        >
                          Reset Position
                        </Button>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Pan</span>
                          <span className="text-sm font-mono font-medium">{panTilt.pan.toFixed(2)}</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Tilt</span>
                          <span className="text-sm font-mono font-medium">{panTilt.tilt.toFixed(2)}</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Zoom</span>
                          <span className="text-sm font-mono font-medium">{zoom.toFixed(2)}x</span>
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Angle</span>
                          <span className="text-sm font-mono font-medium">{angle.toFixed(1)}°</span>
                        </div>
                        <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                          <span className="text-xs text-muted-foreground block mb-1">Tilt Angle</span>
                          <span className="text-sm font-mono font-medium">{tilt.toFixed(1)}°</span>
                        </div>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 shadow-sm">
                    <h3 className="text-lg font-semibold mb-6">Camera Control</h3>
                    
                    <div className="flex flex-col items-center space-y-6">
                      <div 
                        ref={joystickContainerRef}
                        className="relative w-56 h-56 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 shadow-inner touch-none"
                        onMouseDown={startDrag}
                        onTouchStart={startDrag}
                      >
                        <div 
                          ref={joystickHandleRef}
                          className="absolute w-10 h-10 rounded-full bg-blue-500 shadow-md cursor-grab active:cursor-grabbing transition-transform hover:scale-105"
                          style={{ 
                            left: '50%',
                            top: '50%',
                            transform: `translate(-50%, -50%) translate(${joystickPosition.x}px, ${joystickPosition.y}px)`
                          }}
                        />
                      </div>

                      <div className="w-full space-y-4">
                        <div>
                          <div className="flex justify-between mb-2">
                            <span className="text-sm font-medium">Zoom Level</span>
                            <span className="text-sm text-muted-foreground">{zoom.toFixed(1)}x</span>
                          </div>
                          <Slider
                            min={1}
                            max={5}
                            step={0.1}
                            value={[zoom]}
                            onValueChange={values => handleZoomChange(values[0])}
                            className="py-2"
                          />
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <span className="text-sm font-medium">Manual Position Control</span>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="manual-angle" className="text-xs">Angle (0-360°)</Label>
                              <Input
                                id="manual-angle"
                                type="number"
                                placeholder="Angle"
                                min={0}
                                max={360}
                                value={manualAngle}
                                onChange={(e) => handleManualAngleChange(e.target.value)}
                                className="h-9"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="manual-tilt" className="text-xs">Tilt (0-90°)</Label>
                              <Input
                                id="manual-tilt"
                                type="number"
                                placeholder="Tilt"
                                min={0}
                                max={90}
                                value={manualTilt}
                                onChange={(e) => handleManualTiltChange(e.target.value)}
                                className="h-9"
                              />
                            </div>
                          </div>
                          <Button 
                            onClick={applyManualAngle} 
                            className="w-full bg-blue-600 hover:bg-blue-700"
                          >
                            Apply Position
                          </Button>
                        </div>

                        <Button 
                          className="w-full bg-green-600 hover:bg-green-700"
                          onClick={savePreset}
                        >
                          Save Current Position
                        </Button>
                      </div>
                    </div>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="presets" className="space-y-6">
                <Card className="p-6 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h3 className="text-lg font-semibold">Preset Positions</h3>
                    <span className="text-sm text-muted-foreground">
                      {presets.length} presets saved
                    </span>
                  </div>
                  
                  {presets.length === 0 ? (
                    <div className="text-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg">
                      <div className="rounded-full p-4 bg-white dark:bg-gray-800 shadow-md mb-4 inline-block">
                        <Camera className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="text-base font-medium">No Presets Saved</p>
                      <p className="text-sm text-muted-foreground mt-2">
                        Use the camera controls to position the camera, then save as a preset
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {presets.map((preset) => (
                        <Card key={preset.id} className="p-4 relative hover:shadow-md transition-shadow">
                          <div className={`absolute top-2 right-2 w-2 h-2 rounded-full ${
                            selectedPreset === preset.id ? 'bg-green-500' : 'bg-transparent'
                          }`} />
                          <div className="flex justify-between items-start">
                            <div>
                              <h4 className="font-medium text-lg">{preset.name}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                Created: {new Date(preset.createdAt).toLocaleString()}
                              </p>
                              {preset.lastUsed && (
                                <p className="text-xs text-muted-foreground">
                                  Last used: {new Date(preset.lastUsed).toLocaleString()}
                                </p>
                              )}
                            </div>
                            <div className="flex space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => loadPreset(preset)}
                                disabled={isMoving}
                                className="text-xs"
                              >
                                {isMoving && selectedPreset === preset.id ? 'Moving...' : 'Load'}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => editPreset(preset)}
                                className="text-xs"
                              >
                                Edit
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => deletePreset(preset.id)}
                                className="text-xs"
                              >
                                Delete
                              </Button>
                            </div>
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-2">
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <span className="text-xs text-muted-foreground block">Pan</span>
                              <span className="text-sm font-mono">{preset.panTilt.pan.toFixed(2)}</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <span className="text-xs text-muted-foreground block">Tilt</span>
                              <span className="text-sm font-mono">{preset.panTilt.tilt.toFixed(2)}</span>
                            </div>
                            <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded">
                              <span className="text-xs text-muted-foreground block">Zoom</span>
                              <span className="text-sm font-mono">{preset.zoom.toFixed(1)}x</span>
                            </div>
                          </div>
                          <div className="mt-4 flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <Checkbox
                                id={`patrol-${preset.id}`}
                                checked={preset.selectedForPatrol}
                                onCheckedChange={() => togglePresetSelection(preset.id)}
                              />
                              <label
                                htmlFor={`patrol-${preset.id}`}
                                className="text-sm"
                              >
                                Include in patrol
                              </label>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => startSinglePresetPatrol(preset.id)}
                              disabled={patrol.isPatrolling}
                              className="text-xs"
                            >
                              Patrol this preset
                            </Button>
                          </div>
                        </Card>
                      ))}
                    </div>
                  )}
                </Card>
              </TabsContent>

              <TabsContent value="patrol" className="space-y-6">
                <Card className="p-6 shadow-sm">
                  <h3 className="text-lg font-semibold mb-6">Patrol Configuration</h3>
                  
                  <div className="space-y-6">
                    <div className="grid grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-medium block">Start Time</label>
                        <Input
                          type="time"
                          value={patrol.startTime}
                          onChange={e => setPatrol(prev => ({ ...prev, startTime: e.target.value }))}
                          disabled={patrol.isPatrolling}
                          className="h-10"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium block">End Time</label>
                        <Input
                          type="time"
                          value={patrol.endTime}
                          onChange={e => setPatrol(prev => ({ ...prev, endTime: e.target.value }))}
                          disabled={patrol.isPatrolling}
                          className="h-10"
                        />
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <h4 className="font-medium">Selected Presets for Patrol</h4>
                        <div className="text-sm text-muted-foreground">
                          {presets.filter(p => p.selectedForPatrol).length} selected
                        </div>
                      </div>

                      {presets.filter(p => p.selectedForPatrol).length === 0 ? (
                        <div className="text-center p-6 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 rounded-lg">
                          <div className="rounded-full p-3 bg-white dark:bg-gray-800 shadow-md mb-3 inline-block">
                            <Camera className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                          </div>
                          <p className="text-base font-medium">No Presets Selected</p>
                          <p className="text-sm text-muted-foreground mt-1">
                            Select presets in the Presets tab to include them in patrol
                          </p>
                        </div>
                      ) : (
                        <div className="grid grid-cols-2 gap-3">
                          {presets
                            .filter(p => p.selectedForPatrol)
                            .map(preset => (
                              <div 
                                key={preset.id} 
                                className={`p-3 rounded-lg border transition-colors ${
                                  patrol.activePresetId === preset.id 
                                    ? 'border-green-500 bg-green-50 dark:bg-green-900/20' 
                                    : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'
                                }`}
                              >
                                <div className="flex justify-between items-center">
                                  <span className="font-medium">{preset.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {convertFromSeconds(preset.duration, preset.durationUnit).toFixed(1)} {preset.durationUnit}
                                  </span>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>

                    {patrol.isPatrolling && (
                      <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                        <div className="flex justify-between items-center">
                          <div>
                            <h4 className="font-medium text-blue-700 dark:text-blue-300">Patrol Active</h4>
                            <p className="text-sm text-blue-600 dark:text-blue-400">
                              {patrol.isSinglePresetPatrol 
                                ? 'Single preset patrol' 
                                : `Cycling through ${presets.filter(p => p.selectedForPatrol).length} presets`}
                            </p>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium text-blue-700 dark:text-blue-300">Next switch in:</div>
                            <div className="font-mono text-blue-600 dark:text-blue-400">{formatRemainingTime(patrol.remainingTime)}</div>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      {patrol.isPatrolling ? (
                        <Button 
                          variant="destructive"
                          onClick={stopPatrol}
                          className="bg-red-600 hover:bg-red-700"
                        >
                          Stop Patrol
                        </Button>
                      ) : (
                        <Button 
                          onClick={startPatrol}
                          disabled={presets.filter(p => p.selectedForPatrol).length < 2}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          Start Patrol
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              </TabsContent>
            </Tabs>
          </>
        )}

        {showPresetDialog && editingPreset && (
          <Dialog open={showPresetDialog} onOpenChange={setShowPresetDialog}>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle className="text-xl">{editingPreset.id ? 'Edit Preset' : 'Save Preset'}</DialogTitle>
                <DialogDescription>
                  Configure your preset settings
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium block">Preset Name</label>
                  <Input
                    value={editingPreset.name}
                    onChange={e => setEditingPreset(prev => prev ? { ...prev, name: e.target.value } : null)}
                    placeholder="Enter preset name"
                    className="h-10"
                  />
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium block">Duration</label>
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={convertFromSeconds(editingPreset.duration, editingPreset.durationUnit)}
                      onChange={e => {
                        const value = parseFloat(e.target.value);
                        if (!isNaN(value)) {
                          setEditingPreset(prev => 
                            prev ? { 
                              ...prev, 
                              duration: convertToSeconds(value, prev.durationUnit) 
                            } : null
                          );
                        }
                      }}
                      className="h-10"
                    />
                    <Select
                      value={editingPreset.durationUnit}
                      onValueChange={(value: 'hours' | 'minutes' | 'seconds') => {
                        setEditingPreset(prev => {
                          if (!prev) return null;
                          const currentSeconds = prev.duration;
                          return {
                            ...prev,
                            durationUnit: value,
                            duration: currentSeconds
                          };
                        });
                      }}
                    >
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Unit" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="hours">Hours</SelectItem>
                        <SelectItem value="minutes">Minutes</SelectItem>
                        <SelectItem value="seconds">Seconds</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                  <h4 className="text-sm font-medium mb-3">Position Details</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-white dark:bg-gray-700 p-2 rounded">
                      <span className="text-xs text-muted-foreground block">Pan</span>
                      <span className="text-sm font-mono">{editingPreset.panTilt.pan.toFixed(2)}</span>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-2 rounded">
                      <span className="text-xs text-muted-foreground block">Tilt</span>
                      <span className="text-sm font-mono">{editingPreset.panTilt.tilt.toFixed(2)}</span>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-2 rounded">
                      <span className="text-xs text-muted-foreground block">Zoom</span>
                      <span className="text-sm font-mono">{editingPreset.zoom.toFixed(1)}x</span>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="bg-white dark:bg-gray-700 p-2 rounded">
                      <span className="text-xs text-muted-foreground block">Angle</span>
                      <span className="text-sm font-mono">{editingPreset.angle.toFixed(1)}°</span>
                    </div>
                    <div className="bg-white dark:bg-gray-700 p-2 rounded">
                      <span className="text-xs text-muted-foreground block">Created</span>
                      <span className="text-sm font-mono">{new Date(editingPreset.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </div>

              <DialogFooter>
                <Button variant="outline" onClick={() => setShowPresetDialog(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={() => {
                    if (editingPreset) {
                      handleSavePreset(editingPreset);
                      toast.success(`Preset "${editingPreset.name}" saved`);
                    }
                  }}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Save
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </div>
  );
};

export default PTZCamera; 