'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Plus, Minus, ChevronLeft, ChevronRight, Trash2, GripVertical, Settings, Copy, Layers } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';

interface StepEditorProps {
  fields: any[];
  maxSteps: number;
  onUpdate: (fields: any[]) => void;
}

export function StepEditor({ fields, maxSteps, onUpdate }: StepEditorProps) {
  const t = useTranslations('landingPage');
  const [activeStep, setActiveStep] = useState(1);
  const [stepNames, setStepNames] = useState<Record<number, string>>({});
  const [showProgress, setShowProgress] = useState(true);
  const [allowBack, setAllowBack] = useState(true);

  const getStepsConfig = () => {
    const steps: Record<number, { fields: any[]; name: string }> = {};
    fields.forEach(f => {
      const step = f.step || 1;
      if (!steps[step]) steps[step] = { fields: [], name: stepNames[step] || `Step ${step}` };
      steps[step].fields.push(f);
    });
    return steps;
  };

  const stepsConfig = getStepsConfig();
  const totalSteps = Math.max(maxSteps, Object.keys(stepsConfig).length);

  const addStep = () => {
    const newStep = totalSteps + 1;
    if (newStep > maxSteps) return;
    setStepNames(prev => ({ ...prev, [newStep]: `Step ${newStep}` }));
    // Move first unassigned field to new step
    const unassignedField = fields.find(f => !f.step || f.step > newStep);
    if (unassignedField) {
      onUpdate(fields.map(f => f.id === unassignedField.id ? { ...f, step: newStep } : f));
    }
  };

  const removeStep = (step: number) => {
    if (Object.keys(stepsConfig).length <= 1) return;
    // Move fields from removed step to previous step
    const newFields = fields.map(f => {
      if (f.step === step) return { ...f, step: step - 1 };
      if (f.step && f.step > step) return { ...f, step: f.step - 1 };
      return f;
    });
    onUpdate(newFields);
    const newStepNames = { ...stepNames };
    delete newStepNames[step];
    // Renumber remaining steps
    Object.keys(newStepNames).forEach(key => {
      const stepNum = parseInt(key);
      if (stepNum > step) {
        newStepNames[stepNum - 1] = newStepNames[key];
        delete newStepNames[key];
      }
    });
    setStepNames(newStepNames);
    if (activeStep > totalSteps - 1) setActiveStep(totalSteps - 1);
  };

  const moveFieldToStep = (fieldId: string, newStep: number) => {
    onUpdate(fields.map(f => f.id === fieldId ? { ...f, step: newStep } : f));
  };

  const updateStepName = (step: number, name: string) => {
    setStepNames(prev => ({ ...prev, [step]: name }));
  };

  const getFieldsForStep = (step: number) => {
    return fields.filter(f => (f.step || 1) === step).sort((a, b) => (a.order || 0) - (b.order || 0));
  };

  return (
    <div className="space-y-6">
      {/* Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Multi-Step Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div>
              <label className="label">Show Progress Bar</label>
              <Switch checked={showProgress} onCheckedChange={setShowProgress} />
            </div>
            <div>
              <label className="label">Allow Back Navigation</label>
              <Switch checked={allowBack} onCheckedChange={setAllowBack} />
            </div>
            <div>
              <label className="label">Max Steps</label>
              <Input type="number" value={maxSteps} onChange={(e) => {}} disabled className="text-muted-foreground" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Step Navigator */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Steps ({Object.keys(stepsConfig).length} / {maxSteps})</CardTitle>
          {Object.keys(stepsConfig).length < maxSteps && (
            <Button size="sm" onClick={addStep}><Plus className="h-4 w-4 mr-2" />Add Step</Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 overflow-x-auto pb-4">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
              const config = stepsConfig[step];
              const isActive = step === activeStep;
              const hasFields = config && config.fields.length > 0;
              
              return (
                <Button
                  key={step}
                  variant={isActive ? 'primary' : hasFields ? 'secondary' : 'outline'}
                  className="whitespace-nowrap flex items-center gap-2"
                  onClick={() => setActiveStep(step)}
                >
                  <span className="text-sm font-medium">{step}</span>
                  <span className="text-xs opacity-70">{config?.name || `Step ${step}`}</span>
                  {hasFields && <Badge variant="default" className="ml-1">{config!.fields.length}</Badge>}
                  {Object.keys(stepsConfig).length > 1 && step !== 1 && (
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 ml-1" onClick={(e) => { e.stopPropagation(); removeStep(step); }}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </Button>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Step Editor */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Step {activeStep}: {stepNames[activeStep] || `Step ${activeStep}`}</CardTitle>
            <p className="text-sm text-muted-foreground">{getFieldsForStep(activeStep).length} fields</p>
          </div>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Step name"
              value={stepNames[activeStep] || ''}
              onChange={(e) => updateStepName(activeStep, e.target.value)}
              className="w-48"
            />
            {Object.keys(stepsConfig).length > 1 && (
              <Button variant="outline" size="sm" onClick={() => removeStep(activeStep)} disabled={Object.keys(stepsConfig).length <= 1}>
                <Trash2 className="h-4 w-4 mr-2" />Remove Step
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {getFieldsForStep(activeStep).length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-muted rounded-lg">
                <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground">No fields in this step</p>
                <p className="text-xs text-muted-foreground mt-1">Assign fields to this step using the field editor</p>
              </div>
            ) : (
              getFieldsForStep(activeStep).map((field, index) => (
                <StepFieldCard
                  key={field.id}
                  field={field}
                  index={index}
                  step={activeStep}
                  totalSteps={totalSteps}
                  allSteps={Array.from({ length: totalSteps }, (_, i) => i + 1)}
                  onMoveToStep={moveFieldToStep}
                  onEdit={() => {}}
                />
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* Step Preview */}
      <Card>
        <CardHeader>
          <CardTitle>Step Flow Preview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2 flex-wrap">
            {Array.from({ length: totalSteps }, (_, i) => i + 1).map((step) => {
              const config = stepsConfig[step];
              const isComplete = step < activeStep;
              const isCurrent = step === activeStep;
              
              return (
                <div key={step} className="flex items-center gap-2">
                  <div className={cn(
                    'flex items-center justify-center w-8 h-8 rounded-full text-sm font-medium transition-all',
                    isComplete ? 'bg-green-500 text-green-500-foreground' :
                    isCurrent ? 'bg-primary text-primary-foreground' :
                    'bg-muted text-muted-foreground'
                  )}>
                    {isComplete ? <Check className="h-4 w-4" /> : step}
                  </div>
                  {step < totalSteps && (
                    <div className={cn('w-12 h-1', isComplete ? 'bg-green-500' : 'bg-muted')} />
                  )}
                  <div className="text-xs text-center w-20">
                    <span className={cn('font-medium', isCurrent && 'text-primary')}>{config?.name || `Step ${step}`}</span>
                    {config && <span className="text-muted-foreground">({config.fields.length})</span>}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  function getFieldsForStep(step: number) {
    return fields.filter(f => (f.step || 1) === step).sort((a, b) => (a.order || 0) - (b.order || 0));
  }

  function updateStepName(step: number, name: string) {
    setStepNames(prev => ({ ...prev, [step]: name }));
  }
}

function StepFieldCard({ field, index, step, totalSteps, allSteps, onMoveToStep }: any) {
  return (
    <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
      <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab" />
      <Badge variant="secondary" className="w-16 text-center">Step {step}</Badge>
      <div className="flex-1">
        <p className="font-medium">{field.label || field.name}</p>
        <p className="text-xs text-muted-foreground">{field.type} • {field.required ? 'Required' : 'Optional'}</p>
      </div>
      <Select
        value={field.step || 1}
        onChange={(e) => onMoveToStep(field.id, parseInt(e.target.value))}
        options={allSteps.map(s => ({ value: s.toString(), label: `Step ${s}` }))}
        className="w-32"
      />
    </div>
  );
}

import { Layers, Check } from 'lucide-react';