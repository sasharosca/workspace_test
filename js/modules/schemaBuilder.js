import { createElement } from './utils.js';

export class SchemaBuilder {
  constructor() {
    this.variablesContainer = document.getElementById('variablesContainer');
    this.addVarBtn = document.getElementById('addVariableBtn');
    this.newSchemaBtn = document.getElementById('newSchemaBtn');
    this.openSchemaBtn = document.getElementById('openSchemaBtn');
    this.schemaFileInput = document.getElementById('schemaFileInput');
    this.currentFileSpan = document.getElementById('currentFile');
    this.onSchemaChange = null;
    this.draggedElement = null;
    this.dropPlaceholder = createElement('div', {className: 'drop-placeholder'});
    this.currentFileHandle = null;
    
    this.setupEventListeners();
    this.setupDragAndDrop();
  }

  setupDragAndDrop() {
    this.variablesContainer.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      if (!this.draggedElement) return;
      
      const { element: target, insertBefore } = this.getDropTarget(e.clientY);
      if (!target || target === this.draggedElement) {
        this.dropPlaceholder.remove();
        return;
      }
      
      this.dropPlaceholder.className = `drop-placeholder ${insertBefore ? 'top' : 'bottom'}`;
      target.appendChild(this.dropPlaceholder);
    });

    this.variablesContainer.addEventListener('dragleave', (e) => {
      if (!this.variablesContainer.contains(e.relatedTarget)) {
        this.dropPlaceholder.remove();
      }
    });

    this.variablesContainer.addEventListener('drop', (e) => {
      e.preventDefault();
      if (!this.draggedElement || !this.dropPlaceholder.parentNode) return;
      
      const target = this.dropPlaceholder.parentNode;
      const insertBefore = this.dropPlaceholder.className.includes('top');
      target.parentNode.insertBefore(
        this.draggedElement, 
        insertBefore ? target : target.nextSibling
      );
      
      this.dropPlaceholder.remove();
      if (this.onSchemaChange) {
        this.onSchemaChange(this.buildSchema());
      }
      if (this.currentFileHandle) {
        this.saveCurrentSchema();
      }
    });
  }

  getDropTarget(clientY) {
    const children = Array.from(this.variablesContainer.children)
      .filter(child => child !== this.draggedElement && child !== this.dropPlaceholder);
    
    if (!children.length) return { element: null, insertBefore: false };

    const firstChild = children[0];
    const firstRect = firstChild.getBoundingClientRect();
    if (clientY < firstRect.top + 10) {
      return { element: firstChild, insertBefore: true };
    }

    const lastChild = children[children.length - 1];
    const lastRect = lastChild.getBoundingClientRect();
    if (clientY >= lastRect.bottom - 10) {
      return { element: lastChild, insertBefore: false };
    }

    for (let i = 0; i < children.length; i++) {
      const current = children[i];
      const currentRect = current.getBoundingClientRect();
      
      if (i === children.length - 1) {
        return { element: current, insertBefore: false };
      }
      
      const next = children[i + 1];
      const nextRect = next.getBoundingClientRect();
      const gapMiddle = (currentRect.bottom + nextRect.top) / 2;
      
      if (clientY >= currentRect.top && clientY < nextRect.top) {
        return {
          element: clientY <= gapMiddle ? current : next,
          insertBefore: clientY > gapMiddle
        };
      }
    }
    
    return { element: lastChild, insertBefore: false };
  }

  setupEventListeners() {
    this.addVarBtn.addEventListener('click', () => {
      this.addVariableUI(this.variablesContainer);
      if (this.onSchemaChange) {
        this.onSchemaChange(this.buildSchema());
      }
      if (this.currentFileHandle) {
        this.saveCurrentSchema();
      }
    });

    this.newSchemaBtn.addEventListener('click', () => this.createNewSchema());
    this.openSchemaBtn.addEventListener('click', () => this.openSchemaFile());
    this.schemaFileInput.addEventListener('change', () => this.handleFileSelect());
    this.variablesContainer.addEventListener('change', () => {
      if (this.onSchemaChange) {
        this.onSchemaChange(this.buildSchema());
      }
      if (this.currentFileHandle) {
        this.saveCurrentSchema();
      }
    });
  }

  async createNewSchema() {
    try {
      const handle = await window.showSaveFilePicker({
        types: [{
          description: 'JSON Files',
          accept: {'application/json': ['.json']},
        }],
      });
      
      this.currentFileHandle = handle;
      this.currentFileSpan.textContent = `Current file: ${handle.name}`;
      this.variablesContainer.innerHTML = '';
      this.addVarBtn.style.display = 'block';
      if (this.onSchemaChange) {
        this.onSchemaChange(this.buildSchema());
      }
      if (this.currentFileHandle) {
        this.saveCurrentSchema();
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error creating new schema:', err);
      }
    }
  }

  async openSchemaFile() {
    try {
      const [handle] = await window.showOpenFilePicker({
        types: [{
          description: 'JSON Files',
          accept: {'application/json': ['.json']},
        }],
      });
      
      this.currentFileHandle = handle;
      this.currentFileSpan.textContent = `Current file: ${handle.name}`;
      
      const file = await handle.getFile();
      const content = await file.text();
      this.loadSchemaIntoBuilder(JSON.parse(content));
      this.addVarBtn.style.display = 'block';
    } catch (err) {
      if (err.name !== 'AbortError') {
        console.error('Error opening schema file:', err);
      }
    }
  }

  async saveCurrentSchema() {
    if (!this.currentFileHandle) return;

    try {
      const schema = this.buildSchema();
      const writable = await this.currentFileHandle.createWritable();
      await writable.write(JSON.stringify(schema, null, 2));
      await writable.close();
    } catch (err) {
      console.error('Error saving schema:', err);
    }
  }

  addVariableUI(container, variableData=null) {
    const variableBlock = createElement('div', {className:'variable-entry'});
    const header = createElement('div', {className:'variable-header'});
    const dragHandle = createElement('div', {className:'drag-handle'});
    dragHandle.draggable = true;
    
    header.appendChild(dragHandle);
    header.appendChild(createElement('span', {className:'expand-icon'}, ['▶']));
    
    const summary = createElement('div', {className:'variable-summary'});
    summary.innerHTML = `
      <span class="variable-name-display">New Variable</span>
      <span class="variable-type-display">enum</span>
      <span class="variable-values-count">0 values</span>
    `;
    header.appendChild(summary);
    
    header.appendChild(createElement('button', {
      className: 'delete-variable-btn',
      type: 'button'
    }, ['×']));
    
    variableBlock.appendChild(header);

    dragHandle.addEventListener('dragstart', (e) => {
      e.stopPropagation();
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', '');
      requestAnimationFrame(() => {
        this.draggedElement = variableBlock;
        variableBlock.classList.add('dragging');
      });
    });
    
    dragHandle.addEventListener('dragend', () => {
      this.draggedElement = null;
      variableBlock.classList.remove('dragging');
      this.dropPlaceholder.remove();
    });

    const content = createElement('div', {className:'variable-content'});
    content.innerHTML = `
      <div class="form-row">
        <input type="text" class="var-name" placeholder="Variable Name (e.g. Level)">
      </div>
      <div class="valuesContainer"></div>
      <button type="button" class="addValueBtn">Add Value</button>
      <div class="conditionsContainer"></div>
      <button type="button" class="addConditionGroupBtn">Add Condition Group</button>
    `;
    variableBlock.appendChild(content);
    container.appendChild(variableBlock);

    header.addEventListener('click', (e) => {
      if (!e.target.matches('.delete-variable-btn') && !e.target.closest('.drag-handle')) {
        variableBlock.classList.toggle('expanded');
      }
    });

    header.querySelector('.delete-variable-btn').addEventListener('click', (e) => {
      e.stopPropagation();
      if (confirm('Are you sure you want to delete this variable?')) {
        variableBlock.remove();
        if (this.onSchemaChange) {
          this.onSchemaChange(this.buildSchema());
        }
        if (this.currentFileHandle) {
          this.saveCurrentSchema();
        }
      }
    });

    const updateSummary = () => {
      const name = content.querySelector('.var-name').value.trim() || 'New Variable';
      const count = content.querySelectorAll('.value-entry').length;
      
      summary.querySelector('.variable-name-display').textContent = name;
      summary.querySelector('.variable-type-display').textContent = 'enum';
      summary.querySelector('.variable-values-count').textContent = 
        `${count} value${count !== 1 ? 's' : ''}`;
    };

    content.querySelector('.var-name').addEventListener('change', updateSummary);
    content.querySelector('.var-name').addEventListener('input', updateSummary);

    content.querySelector('.addConditionGroupBtn').addEventListener('click', () => {
      this.addConditionGroupUI(content.querySelector('.conditionsContainer'));
    });
    
    content.querySelector('.addValueBtn').addEventListener('click', () => {
      this.addValueUI(content.querySelector('.valuesContainer'));
      updateSummary();
      if (this.onSchemaChange) {
        this.onSchemaChange(this.buildSchema());
      }
      if (this.currentFileHandle) {
        this.saveCurrentSchema();
      }
    });

    if (variableData) {
      this.populateVariableData(variableBlock, variableData);
      updateSummary();
    }

    return variableBlock;
  }

  addValueUI(container, valueData=null) {
    const valEntry = createElement('div', {className:'value-entry'});
    valEntry.innerHTML = `
      <input type="text" class="value-name" placeholder="Value Name">
      <div class="valueConditionsContainer"></div>
      <button type="button" class="addValueConditionGroupBtn">Add Condition Group</button>
    `;
    container.appendChild(valEntry);

    valEntry.querySelector('.addValueConditionGroupBtn').addEventListener('click', () => {
      this.addConditionGroupUI(valEntry.querySelector('.valueConditionsContainer'));
    });

    if (valueData) {
      valEntry.querySelector('.value-name').value = valueData.name || '';
      if (valueData.conditions) {
        this.populateConditions(valEntry.querySelector('.valueConditionsContainer'), valueData.conditions);
      }
    }

    return valEntry;
  }

  addConditionGroupUI(container, groupData=null) {
    const group = createElement('div', {className:'condition-group'});
    group.innerHTML = `
      <select class="group-logic">
        <option value="allOf">AND</option>
        <option value="anyOf">OR</option>
      </select>
      <div class="conditionEntriesContainer"></div>
      <button type="button" class="addConditionEntryBtn">Add Condition</button>
    `;
    container.appendChild(group);
    
    group.querySelector('.addConditionEntryBtn').addEventListener('click', () => {
      this.addConditionEntryUI(group.querySelector('.conditionEntriesContainer'));
    });

    if (groupData) {
      const logic = Object.keys(groupData)[0];
      group.querySelector('.group-logic').value = logic;
      groupData[logic].forEach(condObj => {
        this.addConditionEntryUI(group.querySelector('.conditionEntriesContainer'), condObj);
      });
    }

    return group;
  }

  addConditionEntryUI(container, entryData=null) {
    const vars = Array.from(document.querySelectorAll('.variable-entry')).map(block => ({
      name: block.querySelector('.var-name').value.trim(),
      values: Array.from(block.querySelectorAll('.value-entry'))
        .map(vb => vb.querySelector('.value-name').value.trim())
        .filter(Boolean)
    }));

    const entry = createElement('div', {className:'condition-entry'});
    entry.innerHTML = `
      <label>Variable:</label>
      <select class="cond-var-select">
        <option value="">--Select Variable--</option>
        ${vars.map(v=>`<option value="${v.name}">${v.name}</option>`).join('')}
      </select><br/>
      <label>Value:</label>
      <select class="cond-val-select" disabled><option value="">--Select Value--</option></select>
    `;
    container.appendChild(entry);

    const varSelect = entry.querySelector('.cond-var-select');
    const valSelect = entry.querySelector('.cond-val-select');

    varSelect.addEventListener('change', () => {
      const selectedVar = vars.find(v => v.name === varSelect.value);
      valSelect.innerHTML = selectedVar
        ? selectedVar.values.map(val => `<option value="${val}">${val}</option>`).join('')
        : '<option value="">No values</option>';
      valSelect.disabled = !selectedVar;
    });

    if (entryData) {
      const [cVar, cVal] = Object.entries(entryData)[0];
      varSelect.value = cVar;
      varSelect.dispatchEvent(new Event('change'));
      valSelect.value = cVal;
    }

    return entry;
  }

  buildSchema() {
    return { variables: Array.from(document.querySelectorAll('.variable-entry'))
      .map(block => {
        const varObj = {
          name: block.querySelector('.var-name').value.trim(),
          type: 'enum'
        };

        const values = Array.from(block.querySelectorAll('.value-entry'))
          .map(vb => {
            const name = vb.querySelector('.value-name').value.trim();
            if (!name) return null;
            
            const vObj = { name };
            const conditions = this.buildConditionsJSON(
              vb.querySelectorAll('.valueConditionsContainer > .condition-group')
            );
            if (Object.keys(conditions).length) vObj.conditions = conditions;
            
            return vObj;
          })
          .filter(Boolean);

        if (values.length) varObj.values = values;

        const conditions = this.buildConditionsJSON(
          block.querySelectorAll('.conditionsContainer > .condition-group')
        );
        if (Object.keys(conditions).length) varObj.conditions = conditions;

        return varObj;
      })
    };
  }

  buildConditionsJSON(condGroups) {
    if (!condGroups.length) return {};
    if (condGroups.length === 1) {
      const groupEl = condGroups[0];
      const logic = groupEl.querySelector('.group-logic').value;
      const conditions = Array.from(groupEl.querySelectorAll('.condition-entry'))
        .map(entry => {
          const cVar = entry.querySelector('.cond-var-select').value.trim();
          const cVal = entry.querySelector('.cond-val-select').value.trim();
          return cVar && cVal ? {[cVar]: cVal} : null;
        })
        .filter(Boolean);
      
      return conditions.length ? {[logic]: conditions} : {};
    }
    
    const groups = Array.from(condGroups)
      .map(groupEl => {
        const logic = groupEl.querySelector('.group-logic').value;
        const conditions = Array.from(groupEl.querySelectorAll('.condition-entry'))
          .map(entry => {
            const cVar = entry.querySelector('.cond-var-select').value.trim();
            const cVal = entry.querySelector('.cond-val-select').value.trim();
            return cVar && cVal ? {[cVar]: cVal} : null;
          })
          .filter(Boolean);
        
        return conditions.length ? {[logic]: conditions} : null;
      })
      .filter(Boolean);
    
    return groups.length ? { allOf: groups } : {};
  }

  loadSchemaIntoBuilder(json) {
    this.variablesContainer.innerHTML = '';
    (json.variables || []).forEach(v => {
      this.addVariableUI(this.variablesContainer, v);
    });
    if (this.onSchemaChange) {
      this.onSchemaChange(this.buildSchema());
    }
    if (this.currentFileHandle) {
      this.saveCurrentSchema();
    }
  }

  populateVariableData(block, data) {
    block.classList.remove('expanded');
    const content = block.querySelector('.variable-content');
    content.querySelector('.var-name').value = data.name || '';

    (data.values || []).forEach(value => {
      this.addValueUI(content.querySelector('.valuesContainer'), value);
    });

    if (data.conditions) {
      this.populateConditions(content.querySelector('.conditionsContainer'), data.conditions);
    }

    content.querySelector('.var-name').dispatchEvent(new Event('change'));
  }

  populateConditions(container, conditionsData) {
    if (!conditionsData || !Object.keys(conditionsData).length) return;
    
    if (conditionsData.allOf || conditionsData.anyOf) {
      this.addConditionGroupUI(container, conditionsData);
    } else {
      this.addConditionGroupUI(container, { allOf: [conditionsData] });
    }
  }
}
