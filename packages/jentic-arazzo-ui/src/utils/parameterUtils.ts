import { Parameter } from '../types/index';

/**
 * Parameter with source annotation for display in StepProperties.
 */
export interface ParameterWithSource extends Parameter {
  /** Source of the parameter: 'workflow' (inherited) or 'step' (step-specific) */
  source: 'workflow' | 'step';

  /** True if this step parameter overrides a workflow parameter */
  isOverride?: boolean;

  /** Index in step.parameters[] array (only set for step parameters) */
  stepIndex?: number;
}

/**
 * Merge workflow-level and step-level parameters for display in StepProperties.
 *
 * Per Arazzo spec, workflow parameters apply to all steps and can be overridden
 * at the step level. A step parameter "overrides" a workflow parameter if both
 * have the same `name` and `in` fields.
 *
 * The merged result includes:
 * - Workflow parameters that are NOT overridden (read-only, inherited) appear first
 * - Step parameters follow (editable, may override workflow params)
 *
 * @param workflowParams - Parameters defined at workflow level
 * @param stepParams - Parameters defined at step level
 * @returns Array of parameters with source annotations for display
 *
 * @example
 * ```typescript
 * const workflowParams = [
 *   { name: 'apiKey', in: 'header', value: '$inputs.apiKey' },
 *   { name: 'format', in: 'query', value: 'json' }
 * ];
 *
 * const stepParams = [
 *   { name: 'apiKey', in: 'header', value: '$steps.login.token' }, // Override
 *   { name: 'userId', in: 'path', value: '123' }  // Step-only
 * ];
 *
 * const merged = mergeParametersForDisplay(workflowParams, stepParams);
 * // Result:
 * // [
 * //   { name: 'format', in: 'query', value: 'json', source: 'workflow' },
 * //   { name: 'apiKey', in: 'header', value: '$steps.login.token', source: 'step', isOverride: true, stepIndex: 0 },
 * //   { name: 'userId', in: 'path', value: '123', source: 'step', isOverride: false, stepIndex: 1 }
 * // ]
 * ```
 */
export function mergeParametersForDisplay(
  workflowParams: Parameter[],
  stepParams: Parameter[],
): ParameterWithSource[] {
  const result: ParameterWithSource[] = [];

  // Add workflow parameters that are NOT overridden (these appear first)
  workflowParams.forEach((workflowParam) => {
    const isOverridden = stepParams.some(
      (sp) => sp.name === workflowParam.name && sp.in === workflowParam.in,
    );

    if (!isOverridden) {
      result.push({
        ...workflowParam,
        source: 'workflow',
      });
    }
  });

  // Add all step parameters after workflow params (these are editable)
  stepParams.forEach((stepParam, index) => {
    // Check if this step parameter overrides a workflow parameter
    const overridesWorkflow = workflowParams.some(
      (wp) => wp.name === stepParam.name && wp.in === stepParam.in,
    );

    result.push({
      ...stepParam,
      source: 'step',
      isOverride: overridesWorkflow,
      stepIndex: index,
    });
  });

  return result;
}
