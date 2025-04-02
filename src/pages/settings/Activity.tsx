import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Camera, Plus, Code, Network, ArrowUpDown, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import CameraSearch from '@/components/CameraSearch';
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
import { useStoreState, useStoreActions } from 'easy-peasy';
import activityStore, { ActivityConfig } from '@/store/activities';
import { StoreModel } from '@/store/model';

interface Point {
  x: number;
  y: number;
}

interface ZoneData {
    id: string;
    name: string;
    points: Point[];
    color: string;
    isActive: boolean;
    cameraId: string | null;
    cameraName: string | null;
}

interface ActivityData {
    [key: string]: ZoneData[];
}

const AVAILABLE_ACTIVITIES = [
  "workforce_efficiency",
  "desk_occupancy",
  "entry_exit_logs",
  "resource_utilization",
  "people_gathering",
  "workplace_area_occupancy",
  "PPE",
  "fire_and_smoke",
  "person_violations",
  "perimeter_monitoring",
  "climbing",
  "traffic_overspeeding",
  "workplace_overspeeding",
  "vehicle_interaction"
];

// Default activity configuration template
const defaultActivityConfig = {
  zones: {},
  parameters: {
    subcategory_mapping: [],
  }
};

// Memoized Activity Config Editor component
const ActivityConfigEditor = React.memo(({ 
  value, 
  onChange 
}: { 
  value: string;
  onChange: (value: string | undefined) => void;
}) => {
  const [jsonData, setJsonData] = useState<any>(() => {
    try {
      return value ? JSON.parse(value) : defaultActivityConfig;
    } catch {
      return defaultActivityConfig;
    }
  });

  const [isTreeView, setIsTreeView] = useState(true);
  const [editorValue, setEditorValue] = useState(value);

  // Update jsonData when value prop changes
  useEffect(() => {
    try {
      const parsed = value ? JSON.parse(value) : defaultActivityConfig;
      setJsonData(parsed);
      setEditorValue(value);
    } catch {
      setJsonData(defaultActivityConfig);
      setEditorValue(JSON.stringify(defaultActivityConfig, null, 2));
    }
  }, [value]);

  const handleEdit = useCallback((edit: InteractionProps) => {
    setJsonData(edit.updated_src);
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
  );
});

// Helper function to format activity name
const formatActivityName = (name: string) => {
  if (name === 'PPE') {
    return 'PPE';
  }
  return name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

// Helper function to safely get zone count
const getZoneCount = (activity: ActivityConfig) => {
  try {
    return Object.keys(activity.data.zones || {}).length;
  } catch {
    return 0;
  }
};

// Memoized Activity Table Row component
const ActivityTableRow = React.memo(({ 
  activity, 
  onConfigure, 
  onDelete 
}: { 
  activity: ActivityConfig;
  onConfigure: () => void;
  onDelete: () => void;
}) => (
  <TableRow>
    <TableCell>{formatActivityName(activity.name)}</TableCell>
    <TableCell>{getZoneCount(activity)}</TableCell>
    <TableCell>
      <span className={`px-2 py-1 rounded-full text-xs ${
        activity.status === 'active' 
          ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
          : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400'
      }`}>
        {activity.status}
      </span>
    </TableCell>
    <TableCell>{new Date(activity.lastModified).toLocaleDateString()}</TableCell>
    <TableCell>
      <div className="flex items-center gap-2">
        <Button
          onClick={onConfigure}
          className="bg-blue-500 hover:bg-blue-600 text-white"
          size="sm"
        >
          Configure
        </Button>
        <Button
          onClick={onDelete}
          variant="destructive"
          size="sm"
        >
          Delete
        </Button>
      </div>
    </TableCell>
  </TableRow>
));

const Activity = () => {
  const activities = useStoreState((state: StoreModel) => state.activity.activities);
  const { addActivity, updateActivity, deleteActivity } = useStoreActions((actions: StoreModel) => ({
    addActivity: actions.activity.addActivity,
    updateActivity: actions.activity.updateActivity,
    deleteActivity: actions.activity.deleteActivity
  }));
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newActivityName, setNewActivityName] = useState('');
  const [selectedActivity, setSelectedActivity] = useState<ActivityConfig | null>(null);
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [jsonConfig, setJsonConfig] = useState(JSON.stringify(defaultActivityConfig, null, 2));
  const [newActivityConfig, setNewActivityConfig] = useState(JSON.stringify(defaultActivityConfig, null, 2));

  useEffect(() => {
    if (newActivityName) {
      const config = {
        ...defaultActivityConfig
      };
      setNewActivityConfig(JSON.stringify(config, null, 2));
    }
  }, [newActivityName]);

  const handleCreateActivity = () => {
    if (!newActivityName.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const parsedConfig = JSON.parse(newActivityConfig);
      const newActivity: ActivityConfig = {
        id: Date.now().toString(),
        name: newActivityName,
        data: parsedConfig,
        status: 'active',
        lastModified: new Date().toISOString()
      };

      addActivity(newActivity);
      toast.success(`Created new activity: ${formatActivityName(newActivityName)}`);
      setNewActivityName('');
      setNewActivityConfig(JSON.stringify(defaultActivityConfig, null, 2));
      setIsCreateDialogOpen(false);
    } catch (error) {
      console.error('Error creating activity:', error);
      toast.error('Invalid JSON configuration');
    }
  };

  const handleConfigureActivity = (activity: ActivityConfig) => {
    setSelectedActivity(activity);
    // When configuring an existing activity, show its actual data
    setJsonConfig(JSON.stringify(activity.data, null, 2));
    setIsConfiguring(true);
  };

  const handleDeleteActivity = (activityId: string) => {
    try {
      deleteActivity(activityId);
      toast.success('Activity deleted successfully');
    } catch (error) {
      toast.error('Failed to delete activity');
    }
  };

  const handleSaveChanges = () => {
    if (!selectedActivity) {
      toast.error('No activity selected');
      return;
    }

    try {
      const parsedConfig = JSON.parse(jsonConfig);
      const updatedActivity = {
        ...selectedActivity,
        data: parsedConfig,
        lastModified: new Date().toISOString()
      };

      updateActivity(updatedActivity);
      toast.success('Activity configuration saved successfully');
      setIsConfiguring(false);
      setSelectedActivity(null);
    } catch (error) {
      console.error('Error saving activity:', error);
      toast.error('Invalid JSON configuration');
    }
  };

  if (isConfiguring && selectedActivity) {
    return (
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => {
                setIsConfiguring(false);
                setSelectedActivity(null);
              }}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">
              Configure {selectedActivity.name.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </h1>
          </div>
          <Button variant="outline" size="sm">
            <span className={`w-2 h-2 rounded-full mr-2 ${
              selectedActivity.status === 'active' ? 'bg-green-500' : 'bg-red-500'
            }`} />
            {selectedActivity.status}
          </Button>
        </div>

        <Card className="p-0 overflow-hidden border">
          <ActivityConfigEditor
            value={jsonConfig}
            onChange={setJsonConfig}
          />
        </Card>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsConfiguring(false);
              setSelectedActivity(null);
            }}
          >
            Cancel
          </Button>
          <Button onClick={handleSaveChanges}>
            Save Changes
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Activity</h2>
          <p className="text-muted-foreground">
            View and manage activity configurations.
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Activity
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Create New Activity</DialogTitle>
              <DialogDescription>
                Create a new activity configuration.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="activityName">Activity Name</Label>
                <Select value={newActivityName} onValueChange={setNewActivityName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select an activity" />
                  </SelectTrigger>
                  <SelectContent>
                    {AVAILABLE_ACTIVITIES.map((activity) => (
                      <SelectItem key={activity} value={activity}>
                        {formatActivityName(activity)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {newActivityName && (
                <div className="space-y-2">
                  <Label>Activity Configuration</Label>
                  <Card className="p-0 overflow-hidden border">
                    <ActivityConfigEditor
                      value={newActivityConfig}
                      onChange={setNewActivityConfig}
                    />
                  </Card>
                </div>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => {
                setIsCreateDialogOpen(false);
                setNewActivityName('');
                setNewActivityConfig(JSON.stringify(defaultActivityConfig, null, 2));
              }}>
                Cancel
              </Button>
              <Button onClick={handleCreateActivity}>
                Create
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
                <Button variant="ghost" className="pl-0 flex items-center gap-1">
                  Activity Name
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="pl-0 flex items-center gap-1">
                  Zones
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="pl-0 flex items-center gap-1">
                  Status
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" className="pl-0 flex items-center gap-1">
                  Last Modified
                  <ArrowUpDown className="h-4 w-4" />
                </Button>
              </TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {activities.map((activity) => (
              <ActivityTableRow
                key={activity.id}
                activity={activity}
                onConfigure={() => handleConfigureActivity(activity)}
                onDelete={() => handleDeleteActivity(activity.id)}
              />
            ))}
            {activities.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} className="text-center py-6 text-muted-foreground">
                  No activities configured. Create one to get started.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Card>
    </div>
  );
};

export default Activity; 