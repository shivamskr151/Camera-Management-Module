import React, { useState, useRef, useEffect } from 'react';
import { ZoomIn, ZoomOut, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';

interface PTZPosition {
  pan: number;
  tilt: number;
  zoom: number;
}

interface PTZCameraControllerProps {
  className?: string;
  onPositionChange?: (position: PTZPosition) => void;
  initialPosition?: PTZPosition;
  disabled?: boolean;
}

const PTZCameraController: React.FC<PTZCameraControllerProps> = ({
  className,
  onPositionChange,
  initialPosition = { pan: 0, tilt: 0, zoom: 1 },
  disabled = false,
}) => {
  const [pan, setPan] = useState(initialPosition.pan);
  const [tilt, setTilt] = useState(initialPosition.tilt);
  const [zoom, setZoom] = useState(initialPosition.zoom);
  const [isDragging, setIsDragging] = useState(false);
  const joystickContainerRef = useRef<HTMLDivElement>(null);
  const joystickHandleRef = useRef<HTMLDivElement>(null);

  // Initialize joystick position based on initial pan/tilt
  useEffect(() => {
    updateJoystickPosition(initialPosition.pan, initialPosition.tilt);
  }, []);

  const updateJoystickPosition = (panValue: number, tiltValue: number) => {
    if (!joystickContainerRef.current || !joystickHandleRef.current) return;

    const container = joystickContainerRef.current;
    const handle = joystickHandleRef.current;
    const rect = container.getBoundingClientRect();
    
    // Convert pan/tilt values (-100 to 100) to pixel positions
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    
    const x = centerX + (panValue / 100) * radius;
    const y = centerY + (tiltValue / 100) * radius;
    
    handle.style.left = `${x}px`;
    handle.style.top = `${y}px`;
  };

  const startDrag = (event: React.MouseEvent | React.TouchEvent) => {
    if (disabled) return;
    setIsDragging(true);
    
    // Capture the event type and handle accordingly
    if ('touches' in event) {
      document.addEventListener('touchmove', drag as any);
      document.addEventListener('touchend', stopDrag);
    } else {
      document.addEventListener('mousemove', drag as any);
      document.addEventListener('mouseup', stopDrag);
    }
  };

  const drag = (event: MouseEvent | TouchEvent) => {
    if (disabled || !isDragging) return;
    if (!joystickContainerRef.current || !joystickHandleRef.current) return;
    
    const container = joystickContainerRef.current;
    const handle = joystickHandleRef.current;
    const rect = container.getBoundingClientRect();
    
    // Get pointer position
    let clientX, clientY;
    if ('touches' in event) {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    } else {
      clientX = event.clientX;
      clientY = event.clientY;
    }
    
    // Calculate relative position
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    
    // Calculate normalized position (-1 to 1)
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const radius = Math.min(centerX, centerY) * 0.8;
    
    // Calculate vector from center
    let dx = x - centerX;
    let dy = y - centerY;
    
    // Limit to circle
    const distance = Math.sqrt(dx * dx + dy * dy);
    if (distance > radius) {
      dx = (dx / distance) * radius;
      dy = (dy / distance) * radius;
    }
    
    // Move handle
    handle.style.left = `${centerX + dx}px`;
    handle.style.top = `${centerY + dy}px`;
    
    // Convert to pan/tilt values (-100 to 100)
    const newPan = Math.round((dx / radius) * 100);
    const newTilt = Math.round((dy / radius) * 100);
    
    setPan(newPan);
    setTilt(newTilt);
    
    if (onPositionChange) {
      onPositionChange({ pan: newPan, tilt: newTilt, zoom });
    }
  };

  const stopDrag = () => {
    if (isDragging) {
      setIsDragging(false);
      document.removeEventListener('mousemove', drag as any);
      document.removeEventListener('mouseup', stopDrag);
      document.removeEventListener('touchmove', drag as any);
      document.removeEventListener('touchend', stopDrag);
    }
  };

  const handleZoomChange = (newZoom: number[]) => {
    const zoomValue = newZoom[0];
    setZoom(zoomValue);
    
    if (onPositionChange) {
      onPositionChange({ pan, tilt, zoom: zoomValue });
    }
  };

  const resetToHome = () => {
    setPan(0);
    setTilt(0);
    setZoom(1);
    updateJoystickPosition(0, 0);
    
    if (onPositionChange) {
      onPositionChange({ pan: 0, tilt: 0, zoom: 1 });
    }
  };

  return (
    <div className={cn("ptz-controller flex flex-col gap-4", className)}>
      {/* Joystick control */}
      <div className="ptz-joystick">
        <div
          ref={joystickContainerRef}
          className={cn(
            "relative w-full aspect-square rounded-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700",
            isDragging ? "cursor-grabbing" : "cursor-grab",
            disabled && "opacity-60 cursor-not-allowed"
          )}
        >
          {/* Center crosshair */}
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-gray-400 pointer-events-none">
            <div className="absolute w-px h-8 bg-gray-300 dark:bg-gray-600 left-1/2 -translate-x-1/2"></div>
            <div className="absolute h-px w-8 bg-gray-300 dark:bg-gray-600 top-1/2 -translate-y-1/2"></div>
          </div>
          
          {/* Joystick handle */}
          <div
            ref={joystickHandleRef}
            className={cn(
              "absolute w-6 h-6 bg-primary rounded-full -translate-x-1/2 -translate-y-1/2 left-1/2 top-1/2",
              isDragging ? "cursor-grabbing" : "cursor-grab",
              disabled && "cursor-not-allowed"
            )}
            onMouseDown={startDrag}
            onTouchStart={startDrag}
          />
        </div>
      </div>
      
      {/* Pan/Tilt values display */}
      <div className="ptz-values grid grid-cols-2 gap-2 text-sm">
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400">Pan:</span>
          <span className="font-mono">{pan}</span>
        </div>
        <div className="flex justify-between items-center">
          <span className="text-gray-500 dark:text-gray-400">Tilt:</span>
          <span className="font-mono">{tilt}</span>
        </div>
      </div>
      
      {/* Zoom control */}
      <div className="ptz-zoom-control">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500 dark:text-gray-400">Zoom:</span>
          <span className="font-mono text-sm">{zoom.toFixed(1)}x</span>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            disabled={disabled || zoom <= 1}
            onClick={() => handleZoomChange([Math.max(1, zoom - 0.5)])}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          
          <Slider
            disabled={disabled}
            value={[zoom]}
            min={1}
            max={10}
            step={0.1}
            className="flex-1"
            onValueChange={handleZoomChange}
          />
          
          <Button 
            variant="outline" 
            size="icon" 
            className="h-8 w-8" 
            disabled={disabled || zoom >= 10}
            onClick={() => handleZoomChange([Math.min(10, zoom + 0.5)])}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      {/* Reset button */}
      <Button 
        variant="outline" 
        className="mt-2" 
        disabled={disabled}
        onClick={resetToHome}
      >
        <Home className="h-4 w-4 mr-2" />
        Reset to Home
      </Button>
    </div>
  );
};

export default PTZCameraController; 