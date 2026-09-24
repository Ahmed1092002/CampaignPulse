'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Input';
import { Input } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { Plus, Minus, Code, Trash2, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ConditionalEditorProps {
  field: any;
  allFields: any[];
  onUpdate: (updates: any) => void;
}

const CONDITIONAL_OPERATORS = [
  { value: 'equals', label: 'Equals' },
  { value: 'not_equals', label: 'Not Equals' },
  { value: 'contains', label: 'Contains' },
  { value: 'not_contains', label: 'Not Contains' },
  { value: 'is_empty', label: 'Is Empty' },
  { value: 'is_not_empty', label: 'Is Not Empty' },
];

const CONDITIONAL_LOGIC = [
  { value: 'AND', label: 'All conditions must be true (AND)' },
  { value: 'OR', label: 'Any condition can be true (OR)' },
];

const getCompatibleFields = (targetField: any, allFields: any[]) => {
  return allFields.filter(f => {
    if (f.id === targetField.id) return false;
    if (f.type === 'hidden') return false;
    if (f.type === 'file') return false;
    if (['select', 'radio', 'checkbox'].includes(f.type)) return true;
    if (['text', 'email', 'phone', 'textarea', 'number'].includes(f.type)) return true;
    return false;
  });
};

const getCompatibleOperators = (fieldType: string) => {
  if (['select', 'radio', 'checkbox'].includes(fieldType)) {
    return ['equals', 'not_equals'];
  }
  if (['text', 'email', 'phone', 'textarea'].includes(fieldType)) {
    return ['equals', 'not_equals', 'contains', 'not_contains', 'is_empty', 'is_not_empty'];
  }
  if (['number', 'date'].includes(fieldType)) {
    return ['equals', 'not_equals', 'is_empty', 'is_not_empty'];
  }
  return ['equals', 'not_equals', 'is_empty', 'is_not_empty'];
};

export function ConditionalEditor({ field, allFields, onUpdate }: ConditionalEditorProps) {
  const t = useTranslations('landingPage');
  const [expanded, setExpanded] = useState(false);
  const conditional = field.conditional || { showWhen: [], logic: 'AND' };
  const compatibleFields = getCompatibleFields(field, allFields);

  const handleLogicChange = (logic: 'AND' | 'OR') => {
    onUpdate({ conditional: { ...conditional, logic } });
  };

  const addRule = () => {
    const newRule = { fieldId: '', operator: 'equals', value: '' };
    onUpdate({ conditional: { ...conditional, showWhen: [...conditional.showWhen, newRule] } });
  };

  const removeRule = (index: number) => {
    const newRules = conditional.showWhen.filter((_: any, i: number) => i !== index);
    onUpdate({ conditional: { ...conditional, showWhen: newRules } });
  };

  const updateRule = (index: number, updates: any) => {
    const newRules = [...conditional.showWhen];
    newRules[index] = { ...newRules[index], ...updates };
    onUpdate({ conditional: { ...conditional, showWhen: newRules } });
  };

  if (compatibleFields.length === 0) {
    return (
      <Card className="border-l-4 border-yellow-500">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 text-yellow-700 dark:text-yellow-400">
            <AlertTriangle className="h-5 w-5" />
            <span className="text-sm">No compatible fields available for conditional logic. Add other fields first.</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-l-4 border-purple-500">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Code className="h-4 w-4" />
              {field.label || field.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground">Show this field when conditions are met</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => setExpanded(!expanded)} className="h-auto px-2">
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {expanded ? (
          <div className="space-y-4">
            {/* Logic Selector */}
            <div className="p-3 bg-purple-500/5 border border-purple-500/20 rounded-lg">
              <label className="text-sm font-medium mb-2 block">Logic</label>
              <Select
                value={conditional.logic}
                onChange={(e) => handleLogicChange(e.target.value as 'AND' | 'OR')}
                options={CONDITIONAL_LOGIC}
                className="w-full md:w-1/2"
              />
            </div>

            {/* Rules */}
            {conditional.showWhen.length === 0 ? (
              <div className="text-center py-8 border-2 border-dashed border-muted rounded-lg">
                <Code className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
                <p className="text-muted-foreground mb-4">No conditions set</p>
                <Button onClick={addRule}><Plus className="h-4 w-4 mr-2" />Add First Condition</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {conditional.showWhen.map((rule: any, index: number) => (
                  <ConditionalRuleCard
                    key={`${field.id}-${index}`}
                    rule={rule}
                    index={index}
                    field={field}
                    availableFields={compatibleFields}
                    operators={getCompatibleOperators(compatibleFields.find(f => f.id === rule.fieldId)?.type || 'text')}
                    onUpdate={(updates) => updateRule(index, updates)}
                    onRemove={() => removeRule(index)}
                  />
                ))}
                <Button variant="outline" onClick={addRule} className="w-full">
                  <Plus className="h-4 w-4 mr-2" />Add Another Condition
                </Button>
              </div>
            )}

            {/* Preview */}
            {conditional.showWhen.length > 0 && (
              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-2">Logic Preview:</p>
                <code className="text-xs text-primary font-mono bg-background p-2 rounded block">
                  {conditional.showWhen.map((r: any, i: number) => {
                    const targetField = allFields.find(f => f.id === r.fieldId);
                    const fieldLabel = targetField?.label || targetField?.name || 'Unknown';
                    const opLabels: Record<string, string> = {
                      equals: '=',
                      not_equals: '≠',
                      contains: 'contains',
                      not_contains: '!contains',
                      is_empty: 'is empty',
                      is_not_empty: 'is not empty',
                    };
                    const op = opLabels[r.operator] || r.operator;
                    const value = r.value ? ` "${r.value}"` : '';
                    return `${i > 0 ? ` ${conditional.logic} ` : ''}${fieldLabel} ${op}${value}`;
                  }).join('')}
                </code>
              </div>
            )}
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {conditional.showWhen.map((rule: any, i: number) => {
                const targetField = allFields.find(f => f.id === rule.fieldId);
                const fieldLabel = targetField?.label || targetField?.name || 'Unknown';
                const opLabels: Record<string, string> = {
                  equals: '=',
                  not_equals: '≠',
                  contains: 'contains',
                  not_contains: '!contains',
                  is_empty: 'empty',
                  is_not_empty: 'not empty',
                };
                return (
                  <Badge key={i} variant="secondary" className="text-xs gap-1">
                    {fieldLabel} {opLabels[rule.operator] || rule.operator} {rule.value || ''}
                  </Badge>
                );
              })}
              {conditional.showWhen.length === 0 && (
                <span className="text-xs text-muted-foreground">No conditions</span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={conditional.logic === 'AND' ? 'default' : 'secondary'} className="text-xs">
                {conditional.logic}
              </Badge>
              <Code className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function ConditionalRuleCard({ rule, index, field, availableFields, operators, onUpdate, onRemove }: any) {
  const targetField = availableFields.find(f => f.id === rule.fieldId);
  
  return (
    <div className="border rounded-lg p-3 bg-background">
      <div className="flex items-start gap-2 mb-3">
        <Badge variant="secondary">{index + 1}</Badge>
        <Select
          value={rule.fieldId}
          onChange={(e) => onUpdate({ fieldId: e.target.value })}
          options={availableFields.map(f => ({ value: f.id, label: f.label || f.name }))}
          placeholder="Select field"
          className="flex-1 min-w-[200px]"
        />
        <Button variant="ghost" size="sm" onClick={onRemove} className="h-8 w-8 p-0 text-destructive">
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Operator</label>
          <Select
            value={rule.operator}
            onChange={(e) => onUpdate({ operator: e.target.value })}
            options={operators.map(op => ({ value: op, label: op }))}
            className="w-full"
          />
        </div>
        <div className={!['is_empty', 'is_not_empty'].includes(rule.operator) ? '' : 'hidden'}>
          <label className="text-xs font-medium text-muted-foreground mb-1 block">Value</label>
          <Input
            value={rule.value || ''}
            onChange={(e) => onUpdate({ value: e.target.value })}
            placeholder="Value to compare"
          />
        </div>
        <div className={['is_empty', 'is_not_empty'].includes(rule.operator) ? 'md:col-span-3' : ''}>
          {targetField && ['select', 'radio', 'checkbox'].includes(targetField.type) && targetField.options?.length && (
            <>
              <label className="text-xs font-medium text-muted-foreground mb-1 block">Select Value</label>
              <Select
                value={rule.value || ''}
                onChange={(e) => onUpdate({ value: e.target.value })}
                options={targetField.options.map((opt: string) => ({ value: opt, label: opt }))}
                className="w-full"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}