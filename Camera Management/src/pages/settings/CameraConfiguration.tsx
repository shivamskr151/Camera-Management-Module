import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Camera as CameraIcon, X, ArrowLeft, ArrowUpDown, Code, Network } from 'lucide-react';
import { useToast } from "@/components/ui/use-toast";
import JsonView, { InteractionProps } from 'react-json-view-ts';
import Editor from "@monaco-editor/react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import CameraSearch, { Camera } from '@/components/CameraSearch';
import type { Camera as CameraType } from '@/lib/types';

interface CameraConfig extends CameraType {
    jsonName: string;
    config: string;
}

interface JsonData {
    engine_pipeline?: string;
    send_analytics_pipeline?: string;
    send_events_pipeline?: string;
    kafka_interval_for_analytics?: number;
    reset_threshold?: number;
    AWS_S3?: {
        aws_access_key_id: string;
        aws_secret_access_key: string;
        region_name: string;
        BUCKET_NAME: string;
    };
    service_settings?: {
        aws_iot: {
            mqtt_broker: string;
            client_id: string;
            topic: string;
        };
    };
}

const defaultConfig = {
    engine_pipeline: "none",
    send_analytics_pipeline: "aianalytics",
    send_events_pipeline: "aievents",
    kafka_interval_for_analytics: 3000,
    reset_threshold: 3000,
    AWS_S3: {
        aws_access_key_id: "YOUR_ACCESS_KEY_ID",
        aws_secret_access_key: "YOUR_SECRET_ACCESS_KEY",
        region_name: "ap-south-1",
        BUCKET_NAME: "your-bucket-name"
    },
    service_settings: {
        aws_iot: {
            mqtt_broker: "your-iot-endpoint",
            client_id: "camera-client",
            topic: "camera/events"
        }
    }
};

// Memoized components
const ConfigEditor = React.memo(({ 
    value, 
    onChange 
}: { 
    value: string;
    onChange: (value: string | undefined) => void;
}) => {
    const [jsonData, setJsonData] = useState<JsonData>(() => {
        try {
            return value ? JSON.parse(value) : {};
        } catch {
            return {};
        }
    });

    const [isTreeView, setIsTreeView] = useState(true);
    const [editorValue, setEditorValue] = useState(value);

    // Update jsonData when value prop changes
    useEffect(() => {
        try {
            const parsed = value ? JSON.parse(value) : {};
            setJsonData(parsed);
            setEditorValue(value);
        } catch {
            setJsonData({});
            setEditorValue("{}");
        }
    }, [value]);

    const handleEdit = useCallback((edit: InteractionProps) => {
        setJsonData(edit.updated_src as JsonData);
        const newValue = JSON.stringify(edit.updated_src, null, 2);
        setEditorValue(newValue);
        onChange(newValue);
    }, [onChange]);

    const handleEditorChange = useCallback((value: string | undefined) => {
        if (value) {
            try {
                const parsed = JSON.parse(value);
                setJsonData(parsed);
                setEditorValue(value);
                onChange(value);
            } catch {
                // Invalid JSON, just update the editor value
                setEditorValue(value);
            }
        }
    }, [onChange]);

    return (
        <div className="space-y-4">
            <div className="flex justify-end">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setIsTreeView(!isTreeView)}
                    className="gap-2"
                >
                    {isTreeView ? (
                        <>
                            <Code className="h-4 w-4" />
                            Switch to Text Editor
                        </>
                    ) : (
                        <>
                            <Network className="h-4 w-4" />
                            Switch to Tree View
                        </>
                    )}
                </Button>
            </div>
            <div className="border rounded-md p-4 bg-background">
                {isTreeView ? (
                    <JsonView
                        src={jsonData}
                        onEdit={handleEdit}
                        onAdd={handleEdit}
                        onDelete={handleEdit}
                        theme={{
                            base00: 'var(--background)', // Background
                            base01: 'var(--muted)', // Lighter background
                            base02: 'var(--accent)', // Selection background
                            base03: 'var(--muted-foreground)', // Comment
                            base04: 'var(--muted-foreground)', // Default value
                            base05: 'var(--foreground)', // Default text
                            base06: 'var(--foreground)', // Key text
                            base07: 'var(--foreground)', // Value text
                            base08: 'var(--destructive)', // String
                            base09: 'var(--warning)', // Number
                            base0A: 'var(--warning)', // Integer
                            base0B: 'var(--success)', // Class name
                            base0C: 'var(--info)', // Support
                            base0D: 'var(--primary)', // Variable
                            base0E: 'var(--secondary)', // Keyword
                            base0F: 'var(--destructive)', // Deprecated
                        }}
                        displayDataTypes={false}
                        enableClipboard={true}
                        style={{
                            fontSize: '14px',
                            fontFamily: 'monospace',
                            backgroundColor: 'transparent',
                        }}
                    />
                ) : (
                    <Editor
                        height="400px"
                        defaultLanguage="json"
                        value={editorValue}
                        onChange={handleEditorChange}
                        theme="vs-dark"
                        options={{
                            minimap: { enabled: false },
                            fontSize: 14,
                            formatOnPaste: true,
                            formatOnType: true,
                            scrollBeyondLastLine: false,
                            wordWrap: "on",
                            wrappingIndent: "indent",
                            automaticLayout: true,
                            tabSize: 2,
                            lineNumbers: "on",
                            renderWhitespace: "selection",
                            bracketPairColorization: {
                                enabled: true
                            }
                        }}
                    />
                )}
            </div>
        </div>
    );
});

const CameraTableRow = React.memo(({ 
    camera, 
    onConfigure, 
    onDelete 
}: { 
    camera: CameraConfig;
    onConfigure: () => void;
    onDelete: () => void;
}) => (
    <TableRow>
        <TableCell>{camera.name}</TableCell>
        <TableCell>{camera.jsonName}</TableCell>
        <TableCell>
            <span className={`px-2 py-1 rounded-full text-xs ${
                camera.status === 'online' 
                    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
                    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
            }`}>
                {camera.status}
            </span>
        </TableCell>
        <TableCell>
            <div className="flex items-center gap-2">
                <Button
                    onClick={onConfigure}
                    className="bg-blue-500 hover:bg-blue-600 text-white"
                >
                    Configure
                </Button>
                <Button
                    onClick={onDelete}
                    variant="destructive"
                >
                    Delete
                </Button>
            </div>
        </TableCell>
    </TableRow>
));

const CameraSearchResult = React.memo(({ 
    camera, 
    onSelect 
}: { 
    camera: Camera;
    onSelect: () => void;
}) => (
    <button
        className="w-full p-3 flex items-center justify-between rounded-lg hover:bg-accent transition-colors"
        onClick={onSelect}
    >
        <div className="flex items-center gap-2">
            <CameraIcon className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">{camera.name}</span>
        </div>
        <span className={`px-2 py-1 rounded-full text-xs ${
            camera.status === 'online' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400' 
                : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
        }`}>
            {camera.status}
        </span>
    </button>
));

const ActionCard = React.memo(({ 
    title, 
    description, 
    icon, 
    isDisabled, 
    onClick 
}: { 
    title: string;
    description: string;
    icon: string;
    isDisabled: boolean;
    onClick: () => void;
}) => (
    <Card 
        className={`p-4 ${
            isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:bg-accent/50'
        } transition-colors`}
        onClick={() => !isDisabled && onClick()}
    >
        <div className="text-center space-y-2">
            <div className="text-2xl font-medium">{icon}</div>
            <div>
                <h4 className="font-medium">{title}</h4>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
        </div>
    </Card>
));

const CameraConfiguration: React.FC = () => {
    const { toast } = useToast();
    const [selectedCamera, setSelectedCamera] = useState<CameraConfig | null>(null);
    const [jsonConfig, setJsonConfig] = useState<string>("{}");
    const [isConfiguring, setIsConfiguring] = useState(false);
    const [showActionDialog, setShowActionDialog] = useState(false);
    const [tempSelectedCamera, setTempSelectedCamera] = useState<Camera | null>(null);
    const [cameraConfigs, setCameraConfigs] = useState<CameraConfig[]>([]);

    const handleCameraSelect = useCallback((camera: Camera) => {
        setTempSelectedCamera(camera);
        setShowActionDialog(true);
    }, []);

    const handleCreateNew = useCallback(() => {
        if (tempSelectedCamera) {
            const newConfig: CameraConfig = {
                ...tempSelectedCamera,
                jsonName: `camera_${tempSelectedCamera.id}.json`,
                config: "{}"
            };
            setSelectedCamera(newConfig);
            setJsonConfig(newConfig.config);
            setShowActionDialog(false);
            setIsConfiguring(true);
        }
    }, [tempSelectedCamera]);

    const handleUpdateExisting = useCallback(() => {
        if (tempSelectedCamera) {
            const existingConfig = cameraConfigs.find(c => c.id === tempSelectedCamera.id);
            if (existingConfig) {
                setSelectedCamera(existingConfig);
                setJsonConfig(existingConfig.config);
                setShowActionDialog(false);
                setIsConfiguring(true);
            } else {
                toast({
                    variant: "destructive",
                    title: "Error",
                    description: "No existing configuration found for this camera."
                });
            }
        }
    }, [tempSelectedCamera, cameraConfigs, toast]);

    const handleEditorChange = useCallback((value: string | undefined) => {
        if (value) {
            setJsonConfig(value);
        }
    }, []);

    const handleSaveChanges = useCallback(() => {
        try {
            JSON.parse(jsonConfig);
            
            if (selectedCamera) {
                const formattedJson = JSON.stringify(JSON.parse(jsonConfig), null, 2);
                
                const updatedConfigs = cameraConfigs.map(config => 
                    config.id === selectedCamera.id 
                        ? { ...config, config: formattedJson }
                        : config
                );

                if (!cameraConfigs.find(c => c.id === selectedCamera.id)) {
                    updatedConfigs.push({
                        ...selectedCamera,
                        config: formattedJson
                    });
                }

                setCameraConfigs(updatedConfigs);
                
                toast({
                    title: "Success",
                    description: "Camera configuration saved successfully"
                });
                setIsConfiguring(false);
                setSelectedCamera(null);
            }
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Invalid JSON configuration. Please check the format and try again."
            });
        }
    }, [jsonConfig, selectedCamera, cameraConfigs, toast]);

    const handleResetConfig = useCallback(() => {
        setJsonConfig(JSON.stringify(defaultConfig, null, 2));
    }, []);

    const handleDeleteConfig = useCallback((cameraId: string) => {
        setCameraConfigs(configs => configs.filter(c => c.id !== cameraId));
        toast({
            title: "Success",
            description: "Camera configuration deleted successfully"
        });
    }, [toast]);

    if (isConfiguring && selectedCamera) {
        return (
            <div className="container mx-auto py-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="icon"
                            onClick={() => {
                                setIsConfiguring(false);
                                setSelectedCamera(null);
                            }}
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <h1 className="text-2xl font-bold">Configure {selectedCamera.name}</h1>
                    </div>
                    <Button variant="outline" size="sm" disabled>
                        <span className={`w-2 h-2 rounded-full mr-2 ${
                            selectedCamera.status === 'online' ? 'bg-green-500' : 'bg-red-500'
                        }`} />
                        {selectedCamera.status}
                    </Button>
                </div>

                <div className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center mb-2">
                            <h2 className="text-lg font-semibold">Edit Camera: {selectedCamera.name}</h2>
                            <Button
                                variant="outline"
                                onClick={handleResetConfig}
                                size="sm"
                            >
                                Reset to Default
                            </Button>
                        </div>
                        <Card className="p-0 overflow-hidden border">
                            <ConfigEditor
                                value={jsonConfig}
                                onChange={handleEditorChange}
                            />
                        </Card>
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={() => {
                                setIsConfiguring(false);
                                setSelectedCamera(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button onClick={handleSaveChanges}>
                            Save Changes
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Camera Configurations</h1>
                    <p className="text-muted-foreground">
                        Manage and configure your camera settings
                    </p>
                </div>
                <CameraSearch
                    mode="default"
                    onCameraSelect={handleCameraSelect}
                    buttonText="Search Cameras"
                    dialogTitle="Add Camera Configuration"
                    dialogDescription="Search and select a camera to add to the configuration system."
                    className="w-[200px]"
                />
            </div>

            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>
                                <Button variant="ghost" className="pl-0 flex items-center gap-1">
                                    Camera Name
                                    <ArrowUpDown className="h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" className="pl-0 flex items-center gap-1">
                                    JSON Name
                                    <ArrowUpDown className="h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button variant="ghost" className="pl-0 flex items-center gap-1">
                                    Status
                                    <ArrowUpDown className="h-4 w-4" />
                                </Button>
                            </TableHead>
                            <TableHead>Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {cameraConfigs.map((camera) => (
                            <CameraTableRow
                                key={camera.id}
                                camera={camera}
                                onConfigure={() => handleCameraSelect(camera)}
                                onDelete={() => handleDeleteConfig(camera.id)}
                            />
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Action Selection Dialog */}
            <Dialog open={showActionDialog} onOpenChange={setShowActionDialog}>
                <DialogContent className="sm:max-w-[400px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-semibold">Choose Action</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col items-center gap-4">
                        <div className="text-center">
                            <div className="mb-4">
                                <CameraIcon className="h-12 w-12 mx-auto" />
                            </div>
                            <h3 className="font-semibold text-lg">Selected Camera: {tempSelectedCamera?.name}</h3>
                            <p className="text-sm text-muted-foreground mt-1">What would you like to do with this camera?</p>
                        </div>
                        <div className="grid grid-cols-2 gap-4 w-full mt-2">
                            <ActionCard
                                title="Create New"
                                description={cameraConfigs.some(c => c.id === tempSelectedCamera?.id)
                                    ? 'Camera already exists'
                                    : 'Create a new camera configuration'}
                                icon="+"
                                isDisabled={cameraConfigs.some(c => c.id === tempSelectedCamera?.id)}
                                onClick={handleCreateNew}
                            />
                            <ActionCard
                                title="Update Existing"
                                description={!cameraConfigs.some(c => c.id === tempSelectedCamera?.id)
                                    ? 'This camera is not configured'
                                    : 'Modify existing camera settings'}
                                icon="✏️"
                                isDisabled={!cameraConfigs.some(c => c.id === tempSelectedCamera?.id)}
                                onClick={handleUpdateExisting}
                            />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default CameraConfiguration;