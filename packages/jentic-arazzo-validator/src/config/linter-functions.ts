import {
  isArrayElement,
  isStringElement,
  isObjectElement,
  isMemberElement,
  root,
  getElementsByTypeOrClass,
  type FunctionItem,
  type LinterFunctionsMap,
  type LinterFunction,
} from '@speclynx/apidom-ls';
import type {
  Element,
  ArrayElement,
  MemberElement,
  ObjectElement,
} from '@speclynx/apidom-datamodel';

import { toValue } from '@speclynx/apidom-core';
import { test as testRuntimeExpression } from '@swaggerexpert/arazzo-runtime-expression';

export const linterfunctions: FunctionItem[] = [
  {
    functionName: 'apilintArazzoRuntimeExpression',
    function: (element: Element): boolean => {
      // Validate that a string element value is a valid Arazzo runtime expression
      if (!element || !isStringElement(element)) return true;
      const value = toValue(element) as string;
      if (value.length === 0) return true;
      return testRuntimeExpression(value);
    },
  },
  {
    functionName: 'apilintObjectValuesArazzoRuntimeExpression',
    function: (element: Element): boolean => {
      // Validate all string values in an object map are valid Arazzo runtime expressions
      if (!element || !isObjectElement(element)) return true;
      for (const member of element as ObjectElement) {
        const val = (member as MemberElement).value;
        if (val && isStringElement(val)) {
          const strVal = toValue(val) as string;
          if (strVal.length > 0 && !testRuntimeExpression(strVal)) {
            return false;
          }
        }
      }
      return true;
    },
  },
  {
    functionName: 'apilintArazzoValueRuntimeExpression',
    function: (element: Element): boolean => {
      // If a parameter value is a string starting with '$', validate as runtime expression
      if (!element || !isStringElement(element)) return true;
      const value = toValue(element) as string;
      if (!value.startsWith('$')) return true;
      return testRuntimeExpression(value);
    },
  },
  {
    functionName: 'apilintArazzoArrayValuesResolveToWorkflows',
    function: (element: Element): boolean => {
      // Validate each string in an array resolves to an existing workflow's workflowId.
      // Values starting with $sourceDescriptions are external refs validated as runtime expressions.
      if (!element || !isArrayElement(element)) return true;
      const api = root(element);
      const workflows = getElementsByTypeOrClass(api, 'workflow');
      const workflowIds = new Set(
        workflows
          .filter((w: any) => isObjectElement(w) && w.hasKey('workflowId'))
          .map((w: any) => toValue((w as ObjectElement).get('workflowId'))),
      );
      for (const item of element as ArrayElement) {
        const val = toValue(item as Element);
        if (typeof val === 'string') {
          if (val.startsWith('$sourceDescriptions.')) {
            if (!testRuntimeExpression(val)) return false;
          } else if (!workflowIds.has(val)) {
            return false;
          }
        }
      }
      return true;
    },
  },
  {
    functionName: 'apilintArazzoWorkflowIdResolved',
    function: (element: Element): boolean => {
      // Validate that a workflowId reference resolves to an existing workflow.
      // $sourceDescriptions references are external and validated as runtime expressions.
      if (!element || !isStringElement(element)) return true;
      const value = toValue(element) as string;
      if (value.length === 0) return true;
      if (value.startsWith('$sourceDescriptions.')) return testRuntimeExpression(value);
      const api = root(element);
      const workflows = getElementsByTypeOrClass(api, 'workflow');
      return workflows.some(
        (w: any) =>
          isObjectElement(w) &&
          w.hasKey('workflowId') &&
          toValue((w as ObjectElement).get('workflowId')) === value,
      );
    },
  },
  {
    functionName: 'apilintArazzoActionStepIdResolved',
    function: (element: Element): boolean => {
      // Validate that a success/failure action's stepId resolves to an existing step's stepId
      // within the same workflow
      if (!element || !isStringElement(element)) return true;
      const value = toValue(element) as string;
      if (value.length === 0) return true;
      // Find the containing workflow by traversing up
      let node = element.parent;
      while (node && node.element !== 'workflow') {
        node = node.parent;
      }
      if (!node || !isObjectElement(node)) return true;
      const steps = (node as ObjectElement).get('steps');
      if (!steps || !isArrayElement(steps)) return true;
      for (const step of steps as ArrayElement) {
        if (
          isObjectElement(step) &&
          step.hasKey('stepId') &&
          toValue((step as ObjectElement).get('stepId')) === value
        ) {
          return true;
        }
      }
      return false;
    },
  },
  {
    functionName: 'apilintArazzoContentTypeFormat',
    function: (element: Element): boolean => {
      // Validate that contentType looks like a valid MIME type (type/subtype)
      if (!element || !isStringElement(element)) return true;
      const value = toValue(element) as string;
      if (value.length === 0) return true;
      // Basic MIME type validation: type/subtype with optional parameters (e.g. "; charset=utf-8")
      return /^[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_.+]*\/[a-zA-Z0-9][a-zA-Z0-9!#$&\-^_.+]*(?:\s*;\s*[a-zA-Z0-9!#$&\-^_.+]+=(?:[a-zA-Z0-9!#$&\-^_.+]+|"[^"]*"))*$/.test(value);
    },
  },
  {
    functionName: 'apilintArazzoConditionRegexValid',
    function: (element: Element): boolean => {
      // Validate that a criterion condition with type=regex has a valid regex pattern.
      // Only applies when the sibling 'type' field is 'regex' or a CriterionExpressionType
      // with type='regex'.
      if (!element || !isStringElement(element)) return true;
      const parent = element.parent?.parent;
      if (!parent || !isObjectElement(parent)) return true;
      // Find the type field value by iterating over members
      let typeValue: Element | undefined;
      for (const member of parent as ObjectElement) {
        const m = member as MemberElement;
        if (toValue(m.key as Element) === 'type') {
          typeValue = m.value as Element;
          break;
        }
      }
      if (!typeValue) return true;
      let isRegexType = false;
      if (isStringElement(typeValue) && toValue(typeValue) === 'regex') {
        isRegexType = true;
      } else if (isMemberElement(typeValue)) {
        // CriterionExpressionType: the Arazzo namespace represents the type object
        // as a MemberElement with key='type' and value=the type string
        const innerValue = (typeValue as MemberElement).value as Element;
        if (isStringElement(innerValue) && toValue(innerValue) === 'regex') {
          isRegexType = true;
        }
      } else if (isObjectElement(typeValue)) {
        for (const member of typeValue as ObjectElement) {
          const m = member as MemberElement;
          if (toValue(m.key as Element) === 'type' && isStringElement(m.value as Element)) {
            if (toValue(m.value as Element) === 'regex') isRegexType = true;
            break;
          }
        }
      }
      if (!isRegexType) return true;
      const condition = toValue(element) as string;
      try {
        new RegExp(condition);
        return true;
      } catch {
        return false;
      }
    },
  },
];

export const linterfunctionsMap: LinterFunctionsMap = {
  arazzo: Object.fromEntries(
    linterfunctions.map((item) => [item.functionName, item.function as LinterFunction]),
  ),
};
