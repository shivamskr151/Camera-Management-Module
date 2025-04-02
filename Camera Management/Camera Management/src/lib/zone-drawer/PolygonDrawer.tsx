import React, { useState, useRef, useEffect, forwardRef, useImperativeHandle, ForwardRefRenderFunction } from 'react';

// Types for our component
export interface Point {
    x: number;
    y: number;
}

export interface PolygonDrawerProps {
    className?: string;
    style?: React.CSSProperties;
    strokeColor?: string;
    strokeWidth?: number;
    fillColor?: string;
    fillOpacity?: number;
    pointRadius?: number;
    onChange?: (points: Point[]) => void;
    children?: React.ReactNode;
    disabled?: boolean;
    initialPoints?: Point[];
}

// Define what methods will be available via the ref
export interface PolygonDrawerHandle {
    resetPolygon: () => void;
    getPoints: () => Point[];
    setPoints: (points: Point[]) => void;
}

const PolygonDrawerComponent: ForwardRefRenderFunction<PolygonDrawerHandle, PolygonDrawerProps> = (
    {
        className = '',
        style = {},
        strokeColor = '#ff0000',
        strokeWidth = 2,
        fillColor = '#ff0000',
        fillOpacity = 0.2,
        pointRadius = 5,
        onChange,
        children,
        disabled = false,
        initialPoints = [],
    },
    ref
) => {
    const [points, setPoints] = useState<Point[]>(initialPoints);
    const [isDragging, setIsDragging] = useState(false);
    const [dragPointIndex, setDragPointIndex] = useState<number | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    // Apply initial points if provided
    useEffect(() => {
        if (initialPoints && initialPoints.length > 0) {
            setPoints(initialPoints);
        }
    }, []);

    // Expose methods via ref
    useImperativeHandle(ref, () => ({
        resetPolygon: () => {
            setPoints([]);
            if (onChange) {
                onChange([]);
            }
        },
        getPoints: () => {
            return [...points];
        },
        setPoints: (newPoints: Point[]) => {
            setPoints(newPoints);
            if (onChange) {
                onChange(newPoints);
            }
        }
    }));

    /** 🔹 Insert a New Point Between the Closest Two Points **/
    const insertPointAtCorrectPosition = (newPoint: Point, existingPoints: Point[]): Point[] => {
        if (existingPoints.length < 2) return [...existingPoints, newPoint];

        let bestIndex = -1;
        let minDistance = Infinity;

        for (let i = 0; i < existingPoints.length; i++) {
            const current = existingPoints[i];
            const next = existingPoints[(i + 1) % existingPoints.length]; // Last connects to first

            const distance = pointToSegmentDistance(newPoint, current, next);
            if (distance < minDistance) {
                minDistance = distance;
                bestIndex = i + 1;
            }
        }

        const newPoints = [...existingPoints];
        newPoints.splice(bestIndex, 0, newPoint);
        return newPoints;
    };

    /** 🔹 Calculate Distance of Point from a Line Segment **/
    const pointToSegmentDistance = (p: Point, a: Point, b: Point): number => {
        const A = p.x - a.x, B = p.y - a.y;
        const C = b.x - a.x, D = b.y - a.y;

        const dot = A * C + B * D;
        const len_sq = C * C + D * D;
        const param = len_sq !== 0 ? dot / len_sq : -1;

        let xx, yy;
        if (param < 0) {
            xx = a.x; yy = a.y;
        } else if (param > 1) {
            xx = b.x; yy = b.y;
        } else {
            xx = a.x + param * C;
            yy = a.y + param * D;
        }

        const dx = p.x - xx, dy = p.y - yy;
        return Math.sqrt(dx * dx + dy * dy);
    };

    /** 🔹 Handle Mouse Click to Add Points **/
    const addPoint = (e: React.MouseEvent) => {
        if (disabled || isDragging) return;

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const newPoint: Point = {
            x: e.clientX - rect.left,
            y: e.clientY - rect.top,
        };

        if (getNearestPointIndex(newPoint.x, newPoint.y) !== null) return;

        const newPoints = insertPointAtCorrectPosition(newPoint, points);
        setPoints(newPoints);
        if (onChange) onChange(newPoints);
    };

    // Check if a point is near an existing vertex
    const getNearestPointIndex = (x: number, y: number, threshold = 10): number | null => {
        for (let i = 0; i < points.length; i++) {
            const dx = points[i].x - x;
            const dy = points[i].y - y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < threshold) {
                return i;
            }
        }
        return null;
    };

    // Delete a point on double click
    const handleDoubleClick = (e: React.MouseEvent) => {
        if (disabled) return;

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const pointIndex = getNearestPointIndex(x, y);
        if (pointIndex !== null) {
            e.stopPropagation(); // Prevent container double-click
            const newPoints = [...points];
            newPoints.splice(pointIndex, 1);
            setPoints(newPoints);

            if (onChange) {
                onChange(newPoints);
            }
        }
    };

    // Mouse down handler for dragging vertices
    const handleMouseDown = (e: React.MouseEvent, index: number) => {
        if (disabled) return;

        e.stopPropagation(); // Prevent container click
        setIsDragging(true);
        setDragPointIndex(index);
    };

    // Mouse move handler for dragging vertices
    const handleMouseMove = (e: React.MouseEvent) => {
        if (disabled || !isDragging || dragPointIndex === null) return;

        const container = containerRef.current;
        if (!container) return;

        const rect = container.getBoundingClientRect();
        const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
        const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));

        const newPoints = [...points];
        newPoints[dragPointIndex] = { x, y };
        setPoints(newPoints);
    };

    // Mouse up handler for finishing vertex drag
    const handleMouseUp = () => {
        if (isDragging && onChange && dragPointIndex !== null) {
            onChange(points);
        }
        setIsDragging(false);
        setDragPointIndex(null);
    };

    // Handle when mouse leaves the container
    const handleMouseLeave = () => {
        if (isDragging && onChange && dragPointIndex !== null) {
            onChange(points);
        }
        setIsDragging(false);
        setDragPointIndex(null);
    };

    // Convert points to SVG path
    const getPathData = (): string => {
        if (points.length < 3) return '';

        let pathData = `M ${points[0].x} ${points[0].y}`;
        for (let i = 1; i < points.length; i++) {
            pathData += ` L ${points[i].x} ${points[i].y}`;
        }

        pathData += ' Z'; // Close the path

        return pathData;
    };

    // Render connection lines even when there are fewer than 3 points
    const getConnectionLines = () => {
        if (points.length < 2) return null;

        return (
            <>
                {Array.from({ length: points.length - 1 }, (_, i) => (
                    <line
                        key={`line-${i}`}
                        x1={points[i].x}
                        y1={points[i].y}
                        x2={points[i + 1].x}
                        y2={points[i + 1].y}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                    />
                ))}
                {points.length > 2 && (
                    <line
                        key="line-close"
                        x1={points[points.length - 1].x}
                        y1={points[points.length - 1].y}
                        x2={points[0].x}
                        y2={points[0].y}
                        stroke={strokeColor}
                        strokeWidth={strokeWidth}
                        strokeDasharray="4"
                    />
                )}
            </>
        );
    };

    return (
        <div
            ref={containerRef}
            className={`relative ${className}`}
            style={{ ...style }}
            onClick={addPoint}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseLeave}
            onDoubleClick={handleDoubleClick}
        >
            <svg
                className="absolute inset-0 w-full h-full"
                style={{ pointerEvents: 'none' }}
            >
                {/* Connection lines */}
                {getConnectionLines()}

                {/* Filled polygon */}
                {points.length > 2 && (
                    <path
                        d={getPathData()}
                        fill={fillColor}
                        fillOpacity={fillOpacity}
                        stroke="none"
                    />
                )}

                {/* Vertices */}
                {points.map((point, index) => (
                    <circle
                        key={`point-${index}`}
                        cx={point.x}
                        cy={point.y}
                        r={pointRadius}
                        fill={strokeColor}
                        stroke="white"
                        strokeWidth={2}
                        style={{ cursor: 'pointer', pointerEvents: 'all' }}
                        onMouseDown={(e) => handleMouseDown(e, index)}
                    />
                ))}
            </svg>
            {children}
        </div>
    );
};

export const PolygonDrawer = forwardRef(PolygonDrawerComponent);
export default PolygonDrawer; 