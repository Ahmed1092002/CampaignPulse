'use client';

import { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/Tabs';
import { 
  Plus, 
  Trash2, 
  GripVertical, 
  Eye, 
  EyeOff,
  Code,
  Shield,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Copy,
  Settings,
  Layers,
  ArrowUpDown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

export interface LeadFormField {
  id: string;
  type: 'text' | 'email' | 'phone' | 'select' | 'textarea' | 'number' | 'date' | 'checkbox' | 'radio' | 'file' | 'hidden';
  name: string;
  label: string;
  placeholder?: string;
  required: boolean;
  options?: string[];
  defaultValue?: string;
  // Validation
  validation?: {
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    patternMessage?: string;
    customValidator?: string;
  };
  // Conditional logic
  conditional?: {
    showWhen: {
      fieldId: string;
      operator: 'equals' | 'not_equals' | 'contains' | 'not_contains' | 'is_empty' | 'is_not_empty';
      value?: string;
    }[];
    logic: 'AND' | 'OR';
  };
  // Multi-step
  step?: number;
  // UI
  hidden?: boolean;
  helpText?: string;
  width?: 'full' | 'half' | 'third';
  order: number;
}

const FIELD_TYPES = [
  { value: 'text', label: 'Text', icon: 'Type' },
  { value: 'email', label: 'Email', icon: 'Mail' },
  { value: 'phone', label: 'Phone', icon: 'Phone' },
  { value: 'textarea', label: 'Long Text', icon: 'MessageSquare' },
  { value: 'number', label: 'Number', icon: 'Hash' },
  { value: 'date', label: 'Date', icon: 'Calendar' },
  { value: 'select', label: 'Dropdown', icon: 'ChevronDown' },
  { value: 'radio', label: 'Radio Buttons', icon: 'Circle' },
  { value: 'checkbox', label: 'Checkbox', icon: 'CheckSquare' },
  { value: 'file', label: 'File Upload', icon: 'Upload' },
  { value: 'hidden', label: 'Hidden Field', icon: 'EyeOff' },
];

const VALIDATION_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Not Contains' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

const CONDITIONAL_LOGIC = [
  { value: 'AND', label: 'All conditions (AND)' },
  { value: 'OR', label: 'Any condition (OR)' },
];

const FIELD_WIDTHS = [
  { value: 'full', label: 'Full Width' },
  { value: 'half', label: 'Half Width' },
  { value: 'third', label: 'Third Width' },
];

interface LeadFormBuilderProps {
  fields: LeadFormField[];
  onFieldsChange: (fields: LeadFormField[]) => void;
  availableFields: LeadFormField[]; // All fields for conditional logic
  maxSteps?: number;
}

export function LeadFormBuilder({ fields, onFieldsChange, availableFields, maxSteps = 5 }: LeadFormBuilderProps) {
  const t = useTranslations('landingPage');
  const [activeTab, setActiveTab] = useState<'fields' | 'validation' | 'conditional' | 'steps'>('fields');
  const [editingFieldId, setEditingFieldId] = useState<string | null>(null);
  const [showValidationModal, setShowValidationModal] = useState<string | null>(null);
  const [showConditionalModal, setShowConditionalModal] = useState<string | null>(null);
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);

  const sortedFields = [...fields].sort((a, b) => a.order - b.order);

  const getFieldById = (id: string) => availableFields.find(f => f.id === id);

  const handleFieldUpdate = useCallback((fieldId: string, updates: Partial<LeadFormField>) => {
    onFieldsChange(fields.map(f => f.id === fieldId ? { ...f, ...updates } : f));
  }, [fields, onFieldsChange]);

  const handleAddField = (type: LeadFormField['type']) => {
    const newField: LeadFormField = {
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      name: `field_${Date.now()}`,
      label: '',
      required: false,
      order: fields.length,
    };
    onFieldsChange([...fields, newField]);
  };

  const handleDuplicateField = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    const newField: LeadFormField = {
      ...field,
      id: `field_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: `${field.name}_copy`,
      order: fields.length,
    };
    onFieldsChange([...fields, newField]);
  };

  const handleDeleteField = (fieldId: string) => {
    if (fields.length <= 1) return;
    onFieldsChange(fields.filter(f => f.id !== fieldId).map((f, i) => ({ ...f, order: i })));
  };

  const handleDragStart = (fieldId: string) => setDraggedFieldId(fieldId);
  const handleDragEnd = () => setDraggedFieldId(null);

  const handleDragOver = (e: React.DragEvent, targetFieldId: string) => {
    e.preventDefault();
    if (!draggedFieldId || draggedFieldId === targetFieldId) return;
    
    const fromIndex = fields.findIndex(f => f.id === draggedFieldId);
    const toIndex = fields.findIndex(f => f.id === targetFieldId);
    if (fromIndex === -1 || toIndex === -1) return;

    const newFields = [...fields];
    const [removed] = newFields.splice(fromIndex, 1);
    newFields.splice(toIndex, 0, removed);
    
    onFieldsChange(newFields.map((f, i) => ({ ...f, order: i })));
  };

  const handleDrop = () => setDraggedFieldId(null);

  const openValidationEditor = (fieldId: string) => setShowValidationModal(fieldId);
  const openConditionalEditor = (fieldId: string) => setShowConditionalModal(fieldId);

  const addConditionalRule = (fieldId: string) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field) return;
    const newRule = { fieldId: '', operator: 'equals' as const, value: '', logic: 'AND' as const };
    handleFieldUpdate(fieldId, { 
      conditional: { 
        showWhen: [...(field.conditional?.showWhen || []), newRule], 
        logic: field.conditional?.logic || 'AND' 
      } 
    });
  };

  const updateConditionalRule = (fieldId: string, ruleIndex: number, updates: Partial<LeadFormField['conditional']['showWhen'][0]>) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field?.conditional) return;
    const newRules = [...field.conditional.showWhen];
    newRules[ruleIndex] = { ...newRules[ruleIndex], ...updates };
    handleFieldUpdate(fieldId, { conditional: { ...field.conditional, showWhen: newRules } });
  };

  const removeConditionalRule = (fieldId: string, ruleIndex: number) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field?.conditional) return;
    const newRules = field.conditional.showWhen.filter((_, i) => i !== ruleIndex);
    handleFieldUpdate(fieldId, { conditional: { ...field.conditional, showWhen: newRules } });
  };

  const addValidationRule = (fieldId: string, rule: Partial<LeadFormField['validation']>) => {
    const field = fields.find(f => f.id === fieldId);
    const current = field?.validation || {};
    handleFieldUpdate(fieldId, { validation: { ...current, ...rule } });
  };

  const removeValidationRule = (fieldId: string, key: keyof LeadFormField['validation']) => {
    const field = fields.find(f => f.id === fieldId);
    if (!field?.validation) return;
    const { [key]: removed, ...rest } = field.validation;
    handleFieldUpdate(fieldId, { validation: Object.keys(rest).length ? rest : undefined });
  };

  return (
    <div className="space-y-6">
      {/* Tabs for different aspects */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="fields" className="gap-2">
            <Layers className="h-4 w-4" />
            Fields
          </TabsTrigger>
          <TabsTrigger value="validation" className="gap-2">
            <Shield className="h-4 w-4" />
            Validation
          </TabsTrigger>
          <TabsTrigger value="conditional" className="gap-2">
            <Code className="h-4 w-4" />
            Conditional
          </TabsTrigger>
          <TabsTrigger value="steps" className="gap-2">
            <Settings className="h-4 w-4" />
            Steps
          </TabsTrigger>
        </TabsList>

        {/* Fields Tab - Main field list with drag-drop */}
        <TabsContent value="fields" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Form Fields</CardTitle>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => handleAddField('text')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Text Field
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleAddField('email')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Email
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {sortedFields.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Layers className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                  <p>No fields yet. Add your first field above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sortedFields.map((field) => (
                    <FieldCard
                      key={field.id}
                      field={field}
                      index={sortedFields.indexOf(field)}
                      allFields={availableFields}
                      onEdit={() => setEditingFieldId(field.id === editingFieldId ? null : field.id)}
                      onDuplicate={() => handleDuplicateField(field.id)}
                      onDelete={() => handleDeleteField(field.id)}
                      onDragStart={() => handleDragStart(field.id)}
                      onDragEnd={handleDragEnd}
                      onDragOver={(e) => handleDragOver(e, field.id)}
                      onDrop={handleDrop}
                      onValidation={() => openValidationEditor(field.id)}
                      onConditional={() => openConditionalEditor(field.id)}
                      isDragging={draggedFieldId === field.id}
                      isEditing={editingFieldId === field.id}
                      isFirst={sortedFields.indexOf(field) === 0}
                      isLast={sortedFields.indexOf(field) === sortedFields.length - 1}
                    />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Field Editor Panel */}
          {editingFieldId && (
            <FieldEditorPanel
              field={fields.find(f => f.id === editingFieldId)!}
              allFields={availableFields}
              onClose={() => setEditingFieldId(null)}
              onUpdate={handleFieldUpdate}
            />
          )}
        </TabsContent>

        {/* Validation Tab */}
        <TabsContent value="validation" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Validation Rules</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Configure validation rules for each field. Rules are applied on both client and server side.
              </p>
              <div className="space-y-4">
                {sortedFields.filter(f => f.type !== 'hidden').map((field) => (
                  <ValidationEditor
                    key={field.id}
                    field={field}
                    onUpdate={(updates) => handleFieldUpdate(field.id, updates)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Conditional Logic Tab */}
        <TabsContent value="conditional" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Conditional Logic</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-4">
                Show or hide fields based on other field values. Use AND/OR logic to combine multiple conditions.
              </p>
              <div className="space-y-4">
                {sortedFields.filter(f => f.type !== 'hidden').map((field) => (
                  <ConditionalEditor
                    key={field.id}
                    field={field}
                    allFields={availableFields.filter(f => f.id !== field.id)}
                    onUpdate={(updates) => handleFieldUpdate(field.id, updates)}
                  />
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Multi-step Tab */}
        <TabsContent value="steps" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Multi-Step Form</CardTitle>
            </CardHeader>
            <CardContent>
              <StepEditor
                fields={sortedFields}
                maxSteps={maxSteps}
                onUpdate={onFieldsChange}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Validation Modal */}
      {showValidationModal && (
        <ValidationModal
          field={fields.find(f => f.id === showValidationModal)!}
          onClose={() => setShowValidationModal(null)}
          onSave={(validation) => {
            handleFieldUpdate(showValidationModal, { validation });
            setShowValidationModal(null);
          }}
        />
      )}

      {/* Conditional Modal */}
      {showConditionalModal && (
        <ConditionalModal
          field={fields.find(f => f.id === showConditionalModal)!}
          allFields={availableFields.filter(f => f.id !== showConditionalModal)}
          onClose={() => setShowConditionalModal(null)}
          onSave={(conditional) => {
            handleFieldUpdate(showConditionalModal, { conditional });
            setShowConditionalModal(null);
          }}
        />
      )}
    </div>
  );
}

// Field Card Component
function FieldCard({ 
  field, index, allFields, onEdit, onDuplicate, onDelete, 
  onDragStart, onDragEnd, onDragOver, onDrop, 
  onValidation, onConditional,
  isDragging, isEditing, isFirst, isLast 
}: any) {
  const t = useTranslations('landingPage');
  
  const getTypeIcon = (type: string) => {
    const icons: Record<string, React.ComponentType> = {
      text: Code, email: Mail, phone: Phone, textarea: MessageSquare,
      number: Hash, date: Calendar, select: ChevronDown,
      radio: Circle, checkbox: CheckSquare, file: Upload, hidden: EyeOff,
    };
    return icons[type] || Code;
  };

  return (
    <div
      className={cn(
        'border rounded-lg p-4 transition-all',
        isDragging && 'opacity-50 rotate-2 shadow-lg',
        isEditing && 'ring-2 ring-primary border-primary',
        'bg-card'
      )}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      <div className="flex items-start gap-3">
        <GripVertical className="h-5 w-5 text-muted-foreground cursor-grab mt-1" />
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="secondary" className="text-xs">{field.type}</Badge>
            <span className="font-medium truncate">{field.label || field.name || 'Unnamed Field'}</span>
            <span className="text-xs text-muted-foreground">({field.name})</span>
            {field.required && <Badge variant="destructive" className="text-xs">Required</Badge>}
            {field.step && <Badge variant="default" className="text-xs">Step {field.step}</Badge>}
            {field.conditional?.showWhen?.length && <Badge variant="default" className="text-xs">Conditional</Badge>}
            {field.validation && <Badge variant="default" className="text-xs">Validated</Badge>}
          </div>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span>Type: {field.type}</span>
            {field.options?.length && <span>• Options: {field.options.length}</span>}
            {field.validation?.minLength && <span>• Min: {field.validation.minLength}</span>}
            {field.validation?.maxLength && <span>• Max: {field.validation.maxLength}</span>}
            {field.validation?.pattern && <span>• Pattern: {field.validation.pattern}</span>}
            {field.conditional?.showWhen?.length && <span>• {field.conditional.showWhen.length} condition(s)</span>}
            {field.helpText && <span>• Help: {field.helpText}</span>}
            {field.width && field.width !== 'full' && <span>• Width: {field.width}</span>}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0">
          <Button variant="ghost" size="sm" onClick={onEdit} title="Edit">
            {isEditing ? <ChevronLeft className="h-4 w-4" /> : <Settings className="h-4 w-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={onValidation} title="Validation">
            <Shield className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onConditional} title="Conditional Logic">
            <Code className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDuplicate} title="Duplicate">
            <Copy className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete} title="Delete" className="text-destructive hover:text-destructive">
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

// Field Editor Panel
function FieldEditorPanel({ field, allFields, onClose, onUpdate }: any) {
  const t = useTranslations('landingPage');
  const [localField, setLocalField] = useState(field);

  useEffect(() => {
    setLocalField(field);
  }, [field]);

  const handleChange = (key: string, value: any) => {
    const updated = { ...localField, [key]: value };
    setLocalField(updated);
    onUpdate(field.id, updated);
  };

  const handleOptionsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const options = e.target.value.split(',').map(s => s.trim()).filter(Boolean);
    handleChange('options', options);
  };

  return (
    <Card className="fixed right-0 top-16 bottom-4 w-full md:w-96 shadow-xl z-50 animate-slide-in" style={{ right: 0 }}>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Edit Field</CardTitle>
        <Button variant="ghost" size="sm" onClick={onClose}><X className="h-4 w-4" /></Button>
      </CardHeader>
      <CardContent className="space-y-4 max-h-[calc(100vh-200px)] overflow-y-auto">
        <div className="grid gap-4">
          <Input label="Field Name" value={localField.name} onChange={(e) => handleChange('name', e.target.value)} />
          <Input label="Label" value={localField.label} onChange={(e) => handleChange('label', e.target.value)} />
          <Input label="Placeholder" value={localField.placeholder} onChange={(e) => handleChange('placeholder', e.target.value)} />
          <Input label="Help Text" value={localField.helpText} onChange={(e) => handleChange('helpText', e.target.value)} />
          <Input label="Default Value" value={localField.defaultValue} onChange={(e) => handleChange('defaultValue', e.target.value)} />
          
          <Select label="Width" value={localField.width || 'full'} onChange={(e) => handleChange('width', e.target.value)} options={FIELD_WIDTHS} />
          
          {['select', 'radio', 'checkbox'].includes(localField.type) && (
            <div>
              <label className="label">Options (comma separated)</label>
              <Input value={localField.options?.join(', ') || ''} onChange={handleOptionsChange} placeholder="Option 1, Option 2, Option 3" />
            </div>
          )}
          
          <div className="flex items-center gap-2">
            <input type="checkbox" id="required" checked={localField.required} onChange={(e) => handleChange('required', e.target.checked)} className="h-4 w-4" />
            <label htmlFor="required" className="text-sm font-medium">Required</label>
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" id="hidden" checked={localField.hidden} onChange={(e) => handleChange('hidden', e.target.checked)} className="h-4 w-4" />
            <label htmlFor="hidden" className="text-sm font-medium">Hidden Field</label>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

import { useEffect, useState } from 'react';
import { Mail, Phone, MessageSquare, Hash, Calendar, ChevronDown, Circle, CheckSquare, Upload, EyeOff, X, Copy } from 'lucide-react';
import { FIELD_WIDTHS } from './LeadFormBuilder';