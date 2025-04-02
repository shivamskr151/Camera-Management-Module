import React, { forwardRef, useImperativeHandle, useRef, ForwardRefRenderFunction, useState } from 'react';
import { 
    Trash2, 
    Save, 
    XCircle, 
    Circle as CircleIcon, 
    Square as SquareIcon 
} from 'lucide-react';
import PolygonDrawer, { PolygonDrawerProps, PolygonDrawerHandle, Point } from './PolygonDrawer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export interface PolygonDrawerWithControlsProps extends PolygonDrawerProps {
    buttonStyle?: React.CSSProperties;
    buttonText?: string;
    onSave?: (points: Point[], color: string, name: string) => void;
    onCancel?: () => void;
    initialPoints?: Point[];
    initialColor?: string;
    initialName?: string;
}

export interface PolygonDrawerWithControlsHandle extends PolygonDrawerHandle { }

const PolygonDrawerWithControlsComponent: ForwardRefRenderFunction<
    PolygonDrawerWithControlsHandle,
    PolygonDrawerWithControlsProps
> = (
    {
        buttonStyle = {},
        buttonText = 'Reset Polygon',
        children,
        onSave,
        onCancel,
        initialPoints = [],
        initialColor = '#ff0000',
        initialName = '',
        ...props
    },
    ref
) => {
    const [points, setPoints] = useState<Point[]>(initialPoints);
    const [color, setColor] = useState(initialColor);
    const [name, setName] = useState(initialName);
    const [isDrawing, setIsDrawing] = useState(false);
    const polygonDrawerRef = useRef<PolygonDrawerHandle>(null);

    // Forward the PolygonDrawer methods
    useImperativeHandle(ref, () => ({
        resetPolygon: () => {
            if (polygonDrawerRef.current) {
                polygonDrawerRef.current.resetPolygon();
            }
        },
        getPoints: () => {
            if (polygonDrawerRef.current) {
                return polygonDrawerRef.current.getPoints();
            }
            return [];
        },
        setPoints: (points: Point[]) => {
            if (polygonDrawerRef.current) {
                polygonDrawerRef.current.setPoints(points);
            }
        }
    }));

    const handlePolygonChange = (newPoints: Point[]) => {
        setPoints(newPoints);
        setIsDrawing(newPoints.length > 0);
    };

    const handleSave = () => {
        if (points.length < 3) {
            alert('Please draw a polygon with at least 3 points');
            return;
        }
        
        if (!name.trim()) {
            alert('Please enter a name for this zone');
            return;
        }
        
        if (onSave) {
            onSave(points, color, name);
        }
        
        resetDrawer();
    };

    const handleCancel = () => {
        resetDrawer();
        if (onCancel) {
            onCancel();
        }
    };

    const resetDrawer = () => {
        if (polygonDrawerRef.current) {
            polygonDrawerRef.current.resetPolygon();
        }
        setIsDrawing(false);
        setName('');
    };

    const defaultButtonStyle: React.CSSProperties = {
        position: 'absolute',
        bottom: '10px',
        right: '10px',
        zIndex: 10,
        padding: '6px 12px',
        backgroundColor: '#f44336',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer',
        fontSize: '14px',
        ...buttonStyle
    };

    return (
        <div style={{ position: 'relative' }}>
            <PolygonDrawer
                ref={polygonDrawerRef}
                onChange={handlePolygonChange}
                strokeColor={color}
                fillColor={color}
                className="w-full h-full"
                initialPoints={initialPoints}
            >
                {children}
            </PolygonDrawer>

            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    <Label className="w-24 text-sm font-medium">Zone Name:</Label>
                    <Input
                        type="text"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        placeholder="Enter zone name"
                        className="flex-1"
                    />
                </div>
                
                <div className="flex items-center gap-4">
                    <Label className="w-24 text-sm font-medium">Zone Color:</Label>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => setColor(e.target.value)}
                            className="h-8 w-14 cursor-pointer rounded border border-gray-300"
                        />
                        <span className="text-sm text-gray-500">{color}</span>
                    </div>
                </div>
                
                <Card className="border border-gray-200 shadow-sm overflow-hidden">
                    <CardContent className="p-0">
                        <div className="relative aspect-video bg-gray-100 overflow-hidden">
                            <PolygonDrawer
                                ref={polygonDrawerRef}
                                onChange={handlePolygonChange}
                                strokeColor={color}
                                fillColor={color}
                                className="w-full h-full"
                                initialPoints={initialPoints}
                            >
                                {/* Placeholder image or video feed would go here */}
                                <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                    <p>Click to create points and draw a zone</p>
                                </div>
                            </PolygonDrawer>
                        </div>
                    </CardContent>
                </Card>
                
                <div className="flex justify-between">
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                if (polygonDrawerRef.current) {
                                    polygonDrawerRef.current.resetPolygon();
                                }
                            }}
                            disabled={!isDrawing}
                            className="flex items-center gap-1"
                        >
                            <Trash2 className="h-4 w-4" />
                            <span>Clear</span>
                        </Button>
                    </div>
                    
                    <div className="space-x-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCancel}
                            className="flex items-center gap-1"
                        >
                            <XCircle className="h-4 w-4" />
                            <span>Cancel</span>
                        </Button>
                        
                        <Button
                            variant="default"
                            size="sm"
                            onClick={handleSave}
                            disabled={points.length < 3 || !name.trim()}
                            className="flex items-center gap-1"
                        >
                            <Save className="h-4 w-4" />
                            <span>Save Zone</span>
                        </Button>
                    </div>
                </div>
            </div>

            <button
                style={defaultButtonStyle}
                onClick={resetDrawer}
            >
                {buttonText}
            </button>
        </div>
    );
};

const PolygonDrawerWithControls = forwardRef(PolygonDrawerWithControlsComponent);
export default PolygonDrawerWithControls; 