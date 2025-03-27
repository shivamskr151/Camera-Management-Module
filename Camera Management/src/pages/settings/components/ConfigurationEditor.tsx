import React from 'react';
import ReactJson from 'react-json-view-ts';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CameraConfig } from '@/lib/types';

interface ConfigurationEditorProps {
    config: CameraConfig;
    onEdit: (newConfig: CameraConfig) => void;
}

const ConfigurationEditor: React.FC<ConfigurationEditorProps> = ({ config, onEdit }) => {
    const handleEdit = (edit: { updated_src: unknown }) => {
        onEdit(edit.updated_src as CameraConfig);
    };

    return (
        <div className="space-y-4">
            <Alert variant="destructive">
                <AlertDescription>
                    Warning: Editing camera configuration directly can cause issues if not done carefully.
                    Please ensure you understand the changes you are making.
                </AlertDescription>
            </Alert>
            <div className="border rounded-lg p-4 bg-background">
                <ReactJson
                    src={config}
                    onEdit={handleEdit}
                    theme="monokai"
                    displayDataTypes={false}
                    enableClipboard={false}
                    displayObjectSize={false}
                />
            </div>
        </div>
    );
};

export default ConfigurationEditor; 