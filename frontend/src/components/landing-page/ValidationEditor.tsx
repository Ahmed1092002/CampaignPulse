'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { Switch } from '@/components/ui/Switch';
import { AlertTriangle, Shield, Minus, Plus, CheckCircle, X } from 'lucide-react';
import { useTranslations } from 'next-intl';

interface ValidationEditorProps {
  field: any;
  onUpdate: (updates: any) => void;
}

const VALIDATION_RULES = [
  { key: 'required', label: 'Required', type: 'boolean', description: 'Field must be filled' },
  { key: 'minLength', label: 'Min Length', type: 'number', description: 'Minimum character count' },
  { key: 'maxLength', label: 'Max Length', type: 'number', description: 'Maximum character count' },
  { key: 'pattern', label: 'Regex Pattern', type: 'regex', description: 'Custom regex validation' },
  { key: 'patternMessage', label: 'Pattern Error Message', type: 'text', description: 'Custom error for regex failure' },
  { key: 'min', label: 'Min Value', type: 'number', description: 'Minimum numeric value' },
  { key: 'max', label: 'Max Value', type: 'number', description: 'Maximum numeric value' },
  { key: 'customValidator', label: 'Custom Validator', type: 'code', description: 'JavaScript function as string' },
];

export function ValidationEditor({ field, onUpdate }: ValidationEditorProps) {
  const t = useTranslations('landingPage');
  const validation = field.validation || {};
  const [expanded, setExpanded] = useState(false);

  const handleChange = (key: string, value: any) => {
    const newValidation = { ...validation, [key]: value };
    if (Object.keys(newValidation).length === 0) {
      onUpdate({ validation: undefined });
    } else {
      onUpdate({ validation: newValidation });
    }
  };

  const removeRule = (key: string) => {
    const { [key]: removed, ...rest } = validation;
    if (Object.keys(rest).length === 0) {
      onUpdate({ validation: undefined });
    } else {
      onUpdate({ validation: rest });
    }
  };

  const getFieldTypeValidationRules = (type: string) => {
    const baseRules = ['required', 'minLength', 'maxLength', 'pattern', 'patternMessage', 'customValidator'];
    switch (type) {
      case 'email':
        return [...baseRules];
      case 'phone':
        return ['required', 'pattern', 'patternMessage', 'minLength', 'maxLength'];
      case 'number':
        return ['required', 'min', 'max', 'minLength', 'maxLength'];
      case 'date':
        return ['required'];
      case 'select':
      case 'radio':
        return ['required'];
      case 'checkbox':
        return ['required'];
      case 'file':
        return ['required'];
      case 'textarea':
        return [...baseRules];
      default:
        return baseRules;
    }
  };

  const availableRules = getFieldTypeValidationRules(field.type);

  if (availableRules.length === 0) {
    return (
      <div className="p-4 bg-muted/50 rounded-lg text-center text-sm text-muted-foreground">
        No validation rules available for {field.type} fields
      </div>
    );
  }

  return (
    <Card className="border-l-4 border-primary">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4" />
              {field.label || field.name}
            </CardTitle>
            <p className="text-xs text-muted-foreground capitalize">{field.type} field</p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setExpanded(!expanded)}
            className="h-auto px-2"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {expanded ? (
          <div className="space-y-3">
            {/* Active Rules */}
            {Object.entries(validation).map(([key, value]) => {
              const rule = VALIDATION_RULES.find(r => r.key === key);
              if (!rule) return null;
              
              return (
                <div key={key} className="flex items-center gap-2 p-2 bg-green-500/5 border border-green-500/20 rounded-lg">
                  <Badge variant="success" className="mr-2">{rule.label}</Badge>
                  <span className="text-sm font-mono text-green-700 dark:text-green-400">
                    {typeof value === 'string' && value.length > 50 ? value.substring(0, 50) + '...' : String(value)}
                  </span>
                  <Button variant="ghost" size="sm" onClick={() => removeRule(key)} className="h-6 w-6 p-0 ml-auto">
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              );
            })}
            
            {/* Add Rule */}
            <div className="flex items-center gap-2 pt-2 border-t">
              <Select
                placeholder="Add validation rule..."
                value=""
                onChange={(e) => {
                  const key = e.target.value;
                  if (key === 'required') {
                    handleChange(key, true);
                  } else if (['minLength', 'maxLength', 'min', 'max'].includes(key)) {
                    handleChange(key, 0);
                  } else {
                    handleChange(key, '');
                  }
                }}
                options={availableRules.map(k => {
                  const rule = VALIDATION_RULES.find(r => r.key === k);
                  return { value: k, label: rule?.label || k };
                })}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-wrap">
              {Object.keys(validation).map(key => {
                const rule = VALIDATION_RULES.find(r => r.key === key);
                return <Badge key={key} variant="success" className="text-xs">{rule?.label || key}</Badge>;
              })}
              {Object.keys(validation).length === 0 && (
                <span className="text-xs text-muted-foreground">No validation rules</span>
              )}
            </div>
            <AlertTriangle className="h-4 w-4 text-muted-foreground" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}