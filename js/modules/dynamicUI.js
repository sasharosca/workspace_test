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
    block.querySelectorAll('.info-field').forEach(n => n.remove());
    let matched = [];
    
    if (variable.values && variable.values.length > 0) {
      variable.values.forEach(vObj => {
        if (evaluateConditions(vObj.conditions || {}, this.currentSelections)) {
          matched.push(vObj);
        }
      });
    }
    
    if (matched.length > 0) {
      matched.forEach(vObj => {
        block.appendChild(createElement('div', {className: 'info-field'}, [vObj.description]));
      });
    } else if (variable.description) {
      block.appendChild(createElement('div', {className: 'info-field'}, [variable.description]));
    }
  }
} 