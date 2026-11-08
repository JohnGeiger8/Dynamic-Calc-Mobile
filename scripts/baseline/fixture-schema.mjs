import assert from 'node:assert/strict';

function matchesType(value, type) {
  if (type === 'null') return value === null;
  if (type === 'integer') return Number.isInteger(value);
  if (type === 'number') return typeof value === 'number' && Number.isFinite(value);
  if (type === 'array') return Array.isArray(value);
  if (type === 'object') return value !== null && typeof value === 'object' && !Array.isArray(value);
  return typeof value === type;
}

export function validateFixtureSchema(value, schema) {
  assert.equal(schema.$schema, 'https://json-schema.org/draft/2020-12/schema', 'Fixture schema dialect');
  const errors = [];
  function check(input, rule, location) {
    if (rule.$ref) {
      assert.ok(rule.$ref.startsWith('#/$defs/'), `Unsupported schema reference: ${rule.$ref}`);
      return check(input, schema.$defs[rule.$ref.slice(8)], location);
    }
    if (rule.oneOf) {
      const count = rule.oneOf.filter(choice => {
        const before = errors.length;
        check(input, choice, location);
        const valid = errors.length === before;
        errors.length = before;
        return valid;
      }).length;
      if (count !== 1) errors.push(`${location}: expected exactly one shape, matched ${count}`);
      return;
    }
    if ('const' in rule && input !== rule.const) errors.push(`${location}: expected ${JSON.stringify(rule.const)}`);
    if (rule.type && ![rule.type].flat().some(type => matchesType(input, type))) {
      errors.push(`${location}: expected ${JSON.stringify(rule.type)}`);
      return;
    }
    if (rule.pattern && !new RegExp(rule.pattern).test(input)) errors.push(`${location}: pattern ${rule.pattern}`);
    if (rule.minimum !== undefined && input < rule.minimum) errors.push(`${location}: below ${rule.minimum}`);
    if (rule.minLength !== undefined && input.length < rule.minLength) errors.push(`${location}: too short`);
    if (Array.isArray(input)) {
      if (rule.minItems !== undefined && input.length < rule.minItems) errors.push(`${location}: too few items`);
      if (rule.maxItems !== undefined && input.length > rule.maxItems) errors.push(`${location}: too many items`);
      input.forEach((item, index) => {
        const itemRule = rule.prefixItems?.[index] || rule.items;
        if (itemRule) check(item, itemRule, `${location}[${index}]`);
      });
    }
    if (matchesType(input, 'object')) {
      for (const key of rule.required || []) if (!(key in input)) errors.push(`${location}.${key}: missing`);
      for (const [key, item] of Object.entries(input)) {
        if (rule.properties?.[key]) check(item, rule.properties[key], `${location}.${key}`);
        else if (rule.additionalProperties === false) errors.push(`${location}.${key}: unexpected`);
        else if (rule.additionalProperties) check(item, rule.additionalProperties, `${location}.${key}`);
      }
    }
  }
  check(value, schema, '$');
  return errors;
}
