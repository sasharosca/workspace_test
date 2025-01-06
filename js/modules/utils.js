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
  if (conditions.allOf) return conditions.allOf.every(c => evaluateConditions(c, selections));
  if (conditions.anyOf) return conditions.anyOf.some(c => evaluateConditions(c, selections));
  return Object.entries(conditions).every(([k,v]) => selections[k] === v);
} 