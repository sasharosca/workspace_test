import { createElement, evaluateConditions } from './utils.js';

export class DynamicUI {
  constructor(schemaBuilder) {
    this.schemaBuilder = schemaBuilder;
    this.formContainer = document.getElementById('formContainer');
    this.currentSelections = {};
    this.currentSchema = null;
  }

  renderSchema(schema) {
    this.currentSchema = schema;
    this.currentSelections = {};
    this.formContainer.innerHTML = '';
    (schema.variables || []).forEach(v => this.renderVariable(this.formContainer, v));
    this.updateVisibleFields();
  }

  renderVariable(parent, variable) {
    const block = createElement('div', {className: 'variable-block'});
    if (variable.description) {
      block.appendChild(createElement('div', {className: 'description'}, [variable.description]));
    }

    if (variable.type === 'enum') {
      const label = createElement('label', {}, [variable.name + ": "]);
      const select = createElement('select', {dataset: {varName: variable.name}});
      block.appendChild(label);
      block.appendChild(select);
    } else {
      block.dataset.varName = variable.name;
      block.dataset.infoField = 'true';
      block.dataset.variable = JSON.stringify(variable);
    }
    parent.appendChild(block);
  }

  updateVisibleFields() {
    if (!this.currentSchema) return;
    this.applyConditionsToUI(this.currentSchema.variables, this.formContainer);
  }

  applyConditionsToUI(variables, container) {
    let children = Array.from(container.children);
    variables.forEach((variable, i) => {
      const block = children[i];
      const visible = evaluateConditions(variable.conditions || {}, this.currentSelections);
      block.style.display = visible ? 'block' : 'none';
      if (visible) {
        if (variable.type === 'enum') {
          this.renderEnumVariableValues(block, variable);
        } else {
          this.renderInfoVariable(block, variable);
        }
      }
    });
  }

  renderEnumVariableValues(block, variable) {
    let select = block.querySelector('select');
    const newSelect = select.cloneNode(false);
    newSelect.appendChild(new Option('---Select---', ''));

    let currentSelectedValue = this.currentSelections[variable.name] || '';
    let foundSelection = false;

    (variable.values || []).forEach(vObj => {
      if (evaluateConditions((vObj.conditions || {}), this.currentSelections)) {
        const opt = new Option(vObj.name, vObj.name);
        newSelect.appendChild(opt);
        if (vObj.name === currentSelectedValue) foundSelection = true;
      }
    });

    if (!foundSelection) {
      this.currentSelections[variable.name] = '';
      currentSelectedValue = '';
    }

    newSelect.value = currentSelectedValue;
    newSelect.addEventListener('change', () => {
      this.currentSelections[variable.name] = newSelect.value;
      this.updateVisibleFields();
    });

    select.replaceWith(newSelect);
  }

  renderInfoVariable(block, variable) {
    // Clear all existing content including headers
    block.querySelectorAll('.info-field, .variable-name-header').forEach(n => n.remove());
    
    // Add variable name header
    const nameHeader = createElement('div', {
      className: 'variable-name-header'
    }, [variable.name]);
    block.appendChild(nameHeader);
    
    if (variable.values && variable.values.length > 0) {
      variable.values.forEach(vObj => {
        const conditions = vObj.conditions || {};
        
        // Check if any condition group explicitly disqualifies this value
        const isDisqualified = Object.entries(conditions).some(([logic, condArray]) => {
          if (logic === 'allOf') {
            // For AND logic, if any condition conflicts with current selection, it's disqualified
            return condArray.some(cond => {
              const [varName, requiredValue] = Object.entries(cond)[0];
              const currentValue = this.currentSelections[varName];
              return currentValue && currentValue !== requiredValue;
            });
          } else if (logic === 'anyOf') {
            // For OR logic, if all conditions conflict with current selections, it's disqualified
            return condArray.length > 0 && condArray.every(cond => {
              const [varName, requiredValue] = Object.entries(cond)[0];
              const currentValue = this.currentSelections[varName];
              return currentValue && currentValue !== requiredValue;
            });
          }
          return false;
        });

        if (!isDisqualified) {
          const infoField = createElement('div', {
            className: 'info-field'
          }, [vObj.description]);

          // Add selector information only if conditions exist AND the conditions aren't fully met yet
          if (Object.keys(conditions).length > 0) {
            const isFullyTriggered = Object.entries(conditions).every(([logic, condArray]) => {
              if (logic === 'allOf') {
                return condArray.every(cond => {
                  const [varName, requiredValue] = Object.entries(cond)[0];
                  return this.currentSelections[varName] === requiredValue;
                });
              } else if (logic === 'anyOf') {
                return condArray.some(cond => {
                  const [varName, requiredValue] = Object.entries(cond)[0];
                  return this.currentSelections[varName] === requiredValue;
                });
              }
              return false;
            });

            if (!isFullyTriggered) {
              const selectorInfo = createElement('div', {
                className: 'selector-info'
              });
              
              Object.entries(conditions).forEach(([logic, condArray]) => {
                const condText = condArray.map(cond => {
                  const [varName, value] = Object.entries(cond)[0];
                  return `${varName} = ${value}`;
                }).join(logic === 'allOf' ? ' AND ' : ' OR ');
                
                selectorInfo.textContent = `Applies when: ${condText}`;
              });
              
              infoField.appendChild(selectorInfo);
            }
          }
          
          block.appendChild(infoField);
        }
      });
    } else if (variable.description) {
      block.appendChild(createElement('div', {className: 'info-field'}, [variable.description]));
    }
  }
} 