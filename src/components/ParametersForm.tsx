import React, { useState, useEffect } from "react";
import Select, { components } from "react-select";
import { activityData } from "@/constants/ParametersData";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

type Point = [number, number];
export type ParameterValue = string | number | string[] | Point[] | Record<string, unknown>;

const formatActivityName = (name: string) => {
  return name.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const formatParameterValue = (value: ParameterValue): string => {
  if (Array.isArray(value)) {
    if (value.length > 0 && Array.isArray(value[0])) {
      return 'Coordinates Array';
    }
    return value.join(', ');
  }
  if (typeof value === 'object') {
    return JSON.stringify(value);
  }
  return String(value);
};

interface ParametersFormProps {
  activityType: string;
  parameters: Record<string, ParameterValue>;
  onChange: (parameters: Record<string, ParameterValue>) => void;
  onActivityChange?: (activity: string) => void;
}

export default function ParametersForm({ activityType, parameters, onChange, onActivityChange }: ParametersFormProps) {
  const [selectedActivity, setSelectedActivity] = useState(activityData.find(act => act.name === activityType) || null);
  const [newValue, setNewValue] = useState("");
  const [allOptions, setAllOptions] = useState<Record<string, Set<string>>>({});

  // Initialize options when activity changes
  useEffect(() => {
    const activity = activityData.find(act => act.name === activityType);
    setSelectedActivity(activity || null);

    if (activity) {
      const initialOptions: Record<string, Set<string>> = {};
      Object.entries(activity.data.parameters).forEach(([key, value]) => {
        if (Array.isArray(value) && isStringArray(value)) {
          const currentValues = (parameters[key] as string[]) || [];
          initialOptions[key] = new Set([...value, ...currentValues]);
        }
      });
      setAllOptions(initialOptions);
    }
  }, [activityType]);

  const handleActivityChange = (selectedOption: { value: string; label: string }) => {
    const activity = activityData.find((act) => act.id === selectedOption.value);
    setSelectedActivity(activity);
    if (activity) {
      const newParameters = activity.data.parameters as Record<string, ParameterValue>;
      onChange(newParameters);
      onActivityChange?.(activity.name);
    }
  };

  const handleParameterChange = (key: string, value: ParameterValue) => {
    if (isStringArray(value)) {
      // When options are deselected, ensure they remain in allOptions
      const currentValues = value as string[];
      const previousValues = (parameters[key] as string[]) || [];
      const removedValues = previousValues.filter(v => !currentValues.includes(v));
      
      if (removedValues.length > 0) {
        setAllOptions(prev => ({
          ...prev,
          [key]: new Set([...(prev[key] || []), ...removedValues])
        }));
      }
    }
    onChange({ ...parameters, [key]: value });
  };

  const handleAddNewValue = (key: string, newValueToAdd: string) => {
    if (newValueToAdd.trim() && isStringArray(parameters[key])) {
      const currentValues = parameters[key] as string[];
      const updatedValues = [...currentValues, newValueToAdd.trim()];
      
      // Add to all options first
      setAllOptions(prev => ({
        ...prev,
        [key]: new Set([...(prev[key] || []), newValueToAdd.trim()])
      }));
      
      // Then update selected values
      handleParameterChange(key, updatedValues);
      setNewValue("");
    }
  };

  const getAvailableOptions = (key: string, selectedValues: string[]) => {
    const allPossibleOptions = Array.from(allOptions[key] || []);
    return allPossibleOptions.sort().map(option => ({
      value: option,
      label: option
    }));
  };

  const isStringArray = (value: ParameterValue): value is string[] => {
    return Array.isArray(value) && (!value.length || typeof value[0] === 'string');
  };

  return (
    <div className="space-y-6">
      {selectedActivity && Object.keys(parameters).length > 0 && (
        <div className="space-y-3">
          {Object.entries(parameters).map(([key, value]) => (
            <div key={key} className="mb-3">
              <label className="block text-gray-700 font-medium mb-1">
                {key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}
              </label>
              {Array.isArray(value) && !Array.isArray(value[0]) ? (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Select
                        isMulti
                        options={getAvailableOptions(key, value as string[])}
                        value={(value as string[]).map(item => ({ value: item, label: item }))}
                        onChange={(selectedOptions) => {
                          const newValues = selectedOptions.map((opt) => opt.value);
                          handleParameterChange(key, newValues);
                        }}
                        className="w-full"
                        placeholder="Select options"
                      />
                    </div>
                    {isStringArray(value) && (
                      <div className="flex gap-1">
                        <Input
                          placeholder="Add new value"
                          value={newValue}
                          onChange={(e) => setNewValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                              handleAddNewValue(key, newValue);
                            }
                          }}
                          className="h-9 w-[150px] text-sm"
                        />
                        <Button
                          type="button"
                          size="icon"
                          variant="ghost"
                          onClick={() => handleAddNewValue(key, newValue)}
                          className="h-9 w-9"
                        >
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ) : typeof value === "number" ? (
                <input
                  type="number"
                  className="w-full border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
                  value={value}
                  onChange={(e) =>
                    handleParameterChange(key, Number(e.target.value))
                  }
                  title={`Input for ${key}`}
                  placeholder={`Enter ${key}`}
                />
              ) : (
                <div className="w-full border rounded px-3 py-2 bg-gray-50">
                  {formatParameterValue(value)}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}