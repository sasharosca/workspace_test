export function createElement(tag, attrs={}, children=[]) {
  const el = document.createElement(tag);
  for (const [key, val] of Object.entries(attrs)) {
    if (key === 'dataset') {
      for (const [dKey, dVal] of Object.entries(val)) {
        el.dataset[dKey] = dVal;
      }
    } else {
      el[key] = val;
    }
  }
  children.forEach(child => {
    if (typeof child === 'string') {
      el.appendChild(document.createTextNode(child));
    } else {
      el.appendChild(child);
    }
  });
  return el;
}

export function evaluateConditions(conditions, selections) {
  if (!conditions || Object.keys(conditions).length === 0) return true;
  
  if (conditions.allOf) {
    return conditions.allOf.every(c => evaluateConditions(c, selections));
  }
  
  if (conditions.anyOf) {
    return conditions.anyOf.some(c => evaluateConditions(c, selections));
  }
  
  return Object.entries(conditions).every(([varName, requiredValue]) => {
    const selectedValues = selections[varName] || [];
    // If no selections are made for this variable, treat it as true
    // This change allows values to be visible by default
    if (selectedValues.length === 0) return true;
    // Check if the required value is included in the selections
    return selectedValues.includes(requiredValue);
  });
}

export function getValueRelationships(schema, selections) {
  const relationships = {};
  
  // Initialize relationships map for each variable
  schema.variables.forEach(variable => {
    relationships[variable.name] = {
      related: new Set(),
      incompatible: new Set()
    };
  });

  // For each variable in the schema
  schema.variables.forEach(variable => {
    // For each value in the variable
    variable.values.forEach(value => {
      // If this value has conditions (relationships)
      if (value.conditions) {
        const { requiredVars, allowedValues } = analyzeConditions(value.conditions);
        
        // If this value is selected, process its relationships
        if (selections[variable.name]?.includes(value.name)) {
          requiredVars.forEach(requiredVar => {
            // All values not in allowedValues[requiredVar] are incompatible
            const varObj = schema.variables.find(v => v.name === requiredVar);
            if (varObj) {
              varObj.values.forEach(v => {
                if (!allowedValues[requiredVar].has(v.name)) {
                  relationships[requiredVar].incompatible.add(v.name);
                }
              });
            }
            // Mark allowed values as related
            allowedValues[requiredVar].forEach(val => {
              relationships[requiredVar].related.add(val);
            });
          });
        }
        
        // Check if this value is incompatible with current selections
        const isCompatible = requiredVars.every(requiredVar => {
          const selectedValues = selections[requiredVar] || [];
          if (selectedValues.length === 0) return true;
          return selectedValues.some(selectedVal => 
            allowedValues[requiredVar].has(selectedVal)
          );
        });
        
        if (!isCompatible) {
          relationships[variable.name].incompatible.add(value.name);
        }
      }
    });
  });

  return relationships;
}

function analyzeConditions(conditions) {
  const requiredVars = new Set();
  const allowedValues = {};
  
  function processCondition(condition) {
    if (condition.allOf) {
      condition.allOf.forEach(c => processCondition(c));
    }
    else if (condition.anyOf) {
      condition.anyOf.forEach(c => {
        Object.entries(c).forEach(([varName, value]) => {
          requiredVars.add(varName);
          if (!allowedValues[varName]) {
            allowedValues[varName] = new Set();
          }
          allowedValues[varName].add(value);
        });
      });
    }
    else {
      Object.entries(condition).forEach(([varName, value]) => {
        requiredVars.add(varName);
        if (!allowedValues[varName]) {
          allowedValues[varName] = new Set();
        }
        allowedValues[varName].add(value);
      });
    }
  }
  
  processCondition(conditions);
  return { requiredVars: Array.from(requiredVars), allowedValues };
}
