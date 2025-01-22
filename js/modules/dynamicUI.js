import { createElement, evaluateConditions, getValueRelationships } from './utils.js';

export class DynamicUI {
  constructor(schemaBuilder) {
    this.schemaBuilder = schemaBuilder;
    this.formContainer = document.getElementById('formContainer');
    this.currentSelections = {};
    this.currentSchema = null;
    
    // Add CSS for value states
    const style = document.createElement('style');
    style.textContent = `
      .value-block { 
        opacity: 1; 
        transition: all 0.2s;
      }
      .value-block.related { 
        background-color: rgba(0, 123, 255, 0.1);
        border-color: #007bff;
      }
      .value-block.incompatible { 
        opacity: 0.4;
      }
      .value-block:hover { 
        opacity: 1;
        background-color: rgba(0, 123, 255, 0.05);
      }
    `;
    document.head.appendChild(style);
  }

  renderSchema(schema) {
    this.currentSchema = schema;
    this.currentSelections = {};
    this.formContainer.innerHTML = '';
    (schema.variables || []).forEach(v => {
      const block = createElement('div', {className: 'variable-block'});
      block.appendChild(createElement('div', {className: 'variable-name-header'}, [v.name]));
      const valuesContainer = createElement('div', {className: 'values-container'});
      block.appendChild(valuesContainer);
      this.formContainer.appendChild(block);
    });
    this.updateFields();
  }

  updateFields() {
    if (!this.currentSchema?.variables) return;

    // Get relationships based on current selections
    const relationships = getValueRelationships(this.currentSchema, this.currentSelections);

    Array.from(this.formContainer.children).forEach((block, i) => {
      const variable = this.currentSchema.variables[i];
      this.renderVariableValues(block, variable, relationships);
    });
  }

  renderVariableValues(block, variable, relationships) {
    const valuesContainer = block.querySelector('.values-container');
    valuesContainer.innerHTML = '';
    
    if (!this.currentSelections[variable.name]) {
      this.currentSelections[variable.name] = [];
    }

    const { related, incompatible } = relationships[variable.name];
    const hasSelections = Object.values(this.currentSelections).some(vals => vals.length > 0);

    (variable.values || []).forEach(vObj => {
      let className = 'value-block';
      if (related.has(vObj.name)) className += ' related';
      if (incompatible.has(vObj.name)) className += ' incompatible';
      
      const valueBlock = createElement('div', { className });
      const checkbox = createElement('input', {
        type: 'checkbox',
        id: `${variable.name}-${vObj.name}`,
        checked: this.currentSelections[variable.name].includes(vObj.name)
      });
      const label = createElement('label', {
        htmlFor: `${variable.name}-${vObj.name}`,
        className: 'value-label'
      }, [vObj.name]);
      
      checkbox.addEventListener('change', () => {
        const selections = this.currentSelections[variable.name];
        if (checkbox.checked) {
          if (!selections.includes(vObj.name)) {
            selections.push(vObj.name);
          }
        } else {
          const index = selections.indexOf(vObj.name);
          if (index > -1) {
            selections.splice(index, 1);
          }
        }
        this.updateFields();
      });

      valueBlock.appendChild(checkbox);
      valueBlock.appendChild(label);
      valuesContainer.appendChild(valueBlock);
    });
  }
}
