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
    
    this.currentFile = null;
    this.currentFileHandle = null;
    
    this.setupEventListeners();
  }

  showAddVariableButton() {
    this.addVarBtn.style.display = 'block';
  }

  hideAddVariableButton() {
    this.addVarBtn.style.display = 'none';
  }

  setupEventListeners() {
    this.addVarBtn.addEventListener('click', () => {
      this.addVariableUI(this.variablesContainer);
      this.triggerSchemaUpdate();
    });

    this.newSchemaBtn.addEventListener('click', () => this.createNewSchema());
    this.openSchemaBtn.addEventListener('click', () => this.openSchemaFile());
    this.schemaFileInput.addEventListener('change', () => this.handleFileSelect());

    // Listen for changes in the variables container
    this.variablesContainer.addEventListener('change', () => {
      this.triggerSchemaUpdate();
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
      this.currentFile = handle.name;
      this.currentFileSpan.textContent = `Current file: ${this.currentFile}`;
      
      // Clear existing schema
      this.variablesContainer.innerHTML = '';
      this.showAddVariableButton();
      this.triggerSchemaUpdate();
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
      this.currentFile = handle.name;
      this.currentFileSpan.textContent = `Current file: ${this.currentFile}`;
      
      const file = await handle.getFile();
      const content = await file.text();
      this.loadSchemaIntoBuilder(JSON.parse(content));
      this.showAddVariableButton();
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

  triggerSchemaUpdate() {
    if (this.onSchemaChange) {
      const schema = this.buildSchema();
      this.onSchemaChange(schema);
    }
    // Autosave when schema changes
    if (this.currentFileHandle) {
      this.saveCurrentSchema();
    }
  }

  addVariableUI(container, variableData=null) {
    const variableBlock = createElement('div', {className:'variable-entry'});
    
    // Create header for collapsible section
    const header = createElement('div', {className:'variable-header'});
    const summary = createElement('div', {className:'variable-summary'});
    summary.innerHTML = `
      <span class="variable-name-display">New Variable</span>
      <span class="variable-type-display">enum</span>
      <span class="variable-values-count">0 values</span>
    `;
    header.appendChild(summary);
    
    // Add delete button
    const deleteBtn = createElement('button', {
      className: 'delete-variable-btn',
      type: 'button'
    }, ['×']);
    header.appendChild(deleteBtn);
    
    variableBlock.appendChild(header);

    // Create content section (collapsed by default)
    const content = createElement('div', {className:'variable-content'});
    content.innerHTML = `
      <h3>Variable Details</h3>
      <label>Variable Name:</label><input type="text" class="var-name" placeholder="e.g. Level"><br/>
      <label>Type:</label>
      <select class="var-type">
        <option value="enum">Enum</option>
        <option value="info">Info</option>
      </select><br/>
      <label>Description:</label><input type="text" class="var-desc" placeholder="Description (optional)"><br/>
      <h4>Values</h4>
      <p>For "enum" variables, each value is a "Value Name" for the dropdown.<br>
      For "info" variables, each value is a "Value Description" displayed conditionally.<br>
      Conditions can be added to each value.</p>
      <div class="valuesContainer"></div>
      <button type="button" class="addValueBtn">Add Value</button>

      <h4>Conditions (optional)</h4>
      <div class="conditionsContainer"></div>
      <button type="button" class="addConditionGroupBtn">Add Condition Group</button>
    `;
    variableBlock.appendChild(content);
    container.appendChild(variableBlock);

    // Setup event listeners
    header.addEventListener('click', (e) => {
      // Don't toggle if clicking the delete button
      if (!e.target.matches('.delete-variable-btn')) {
        variableBlock.classList.toggle('expanded');
      }
    });

    // Setup delete button handler
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation(); // Prevent header click
      if (confirm('Are you sure you want to delete this variable?')) {
        variableBlock.remove();
        this.triggerSchemaUpdate();
      }
    });

    const updateSummary = () => {
      const nameDisplay = summary.querySelector('.variable-name-display');
      const typeDisplay = summary.querySelector('.variable-type-display');
      const valuesCountDisplay = summary.querySelector('.variable-values-count');
      
      const name = content.querySelector('.var-name').value.trim() || 'New Variable';
      const type = content.querySelector('.var-type').value;
      const valuesCount = content.querySelectorAll('.value-entry').length;
      
      nameDisplay.textContent = name;
      typeDisplay.textContent = type;
      valuesCountDisplay.textContent = `${valuesCount} value${valuesCount !== 1 ? 's' : ''}`;
    };

    const varTypeSelect = content.querySelector('.var-type');
    const nameInput = content.querySelector('.var-name');

    [varTypeSelect, nameInput].forEach(el => {
      el.addEventListener('change', updateSummary);
      el.addEventListener('input', updateSummary);
    });

    content.querySelector('.addConditionGroupBtn').addEventListener('click', () => {
      this.addConditionGroupUI(content.querySelector('.conditionsContainer'));
    });
    content.querySelector('.addValueBtn').addEventListener('click', () => {
      this.addValueUI(content.querySelector('.valuesContainer'));
      updateSummary();
      this.triggerSchemaUpdate();
    });

    if (variableData) {
      this.populateVariableData(variableBlock, variableData);
      updateSummary();
    }

    return variableBlock;
  }

  addValueUI(container, valueData=null, varType=null) {
    const valEntry = createElement('div', {className:'value-entry'});
    valEntry.innerHTML = `
      <label>Value Name/Description:</label><input type="text" class="value-name" placeholder="Enum: Value Name, Info: Value Description"><br/>
      <h4>Value Conditions (optional)</h4>
      <div class="valueConditionsContainer"></div>
      <button type="button" class="addValueConditionGroupBtn">Add Condition Group</button>
    `;
    container.appendChild(valEntry);

    valEntry.querySelector('.addValueConditionGroupBtn').addEventListener('click', () => {
      this.addConditionGroupUI(valEntry.querySelector('.valueConditionsContainer'));
    });

    if (valueData) {
      valEntry.querySelector('.value-name').value = valueData.name || valueData.description || '';
      if (valueData.conditions) {
        this.populateConditions(valEntry.querySelector('.valueConditionsContainer'), valueData.conditions);
      }
    }

    return valEntry;
  }

  addConditionGroupUI(container, groupData=null) {
    const group = createElement('div', {className:'condition-group'});
    group.innerHTML = `
      <label>Group Logic:</label>
      <select class="group-logic">
        <option value="allOf">allOf (AND)</option>
        <option value="anyOf">anyOf (OR)</option>
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
      const condArray = groupData[logic];
      condArray.forEach(condObj => {
        this.addConditionEntryUI(group.querySelector('.conditionEntriesContainer'), condObj);
      });
    }

    return group;
  }

  addConditionEntryUI(container, entryData=null) {
    const entry = createElement('div', {className:'condition-entry'});
    const vars = this.getCurrentBuilderVariables();
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

    this.setupConditionEntryListeners(entry, vars, entryData);
    return entry;
  }

  setupConditionEntryListeners(entry, vars, entryData) {
    const varSelect = entry.querySelector('.cond-var-select');
    const valSelect = entry.querySelector('.cond-val-select');

    varSelect.addEventListener('change', () => {
      const selectedVar = vars.find(v => v.name === varSelect.value);
      if (selectedVar && selectedVar.type === 'enum') {
        valSelect.innerHTML = selectedVar.values.map(val => 
          `<option value="${val}">${val}</option>`
        ).join('');
        valSelect.disabled = false;
      } else {
        valSelect.innerHTML = `<option value="">No values</option>`;
        valSelect.disabled = true;
      }
    });

    if (entryData) {
      const [cVar, cVal] = Object.entries(entryData)[0];
      varSelect.value = cVar;
      varSelect.dispatchEvent(new Event('change'));
      valSelect.value = cVal;
    }
  }

  getCurrentBuilderVariables() {
    const varBlocks = document.querySelectorAll('.variable-entry');
    return Array.from(varBlocks).map(block => {
      const varName = block.querySelector('.var-name').value.trim();
      const varType = block.querySelector('.var-type').value;
      const values = this.extractValuesForVars(varType, block);
      return {name: varName, type: varType, values};
    });
  }

  extractValuesForVars(varType, block) {
    const valBlocks = block.querySelectorAll('.value-entry');
    return Array.from(valBlocks)
      .map(vb => vb.querySelector('.value-name').value.trim())
      .filter(Boolean);
  }

  buildSchema() {
    return { variables: this.buildSchemaVariables() };
  }

  buildSchemaVariables() {
    const varBlocks = document.querySelectorAll('.variable-entry');
    return Array.from(varBlocks).map(block => this.buildVariableObject(block));
  }

  buildVariableObject(block) {
    const varName = block.querySelector('.var-name').value.trim();
    const varType = block.querySelector('.var-type').value;
    const varDesc = block.querySelector('.var-desc').value.trim();
    
    let varObj = {name: varName, type: varType};
    if (varDesc) varObj.description = varDesc;

    const values = this.buildValues(block, varType);
    if (values.length > 0) varObj.values = values;

    const conditions = this.buildConditionsJSON(
      block.querySelectorAll('.conditionsContainer > .condition-group')
    );
    if (Object.keys(conditions).length > 0) varObj.conditions = conditions;

    return varObj;
  }

  buildValues(block, varType) {
    const valBlocks = block.querySelectorAll('.value-entry');
    const values = [];
    
    valBlocks.forEach(vb => {
      const vName = vb.querySelector('.value-name').value.trim();
      if (!vName) return;
      
      const vConditions = this.buildConditionsJSON(
        vb.querySelectorAll('.valueConditionsContainer > .condition-group')
      );
      
      const vObj = varType === 'enum' ? {name: vName} : {description: vName};
      if (Object.keys(vConditions).length > 0) vObj.conditions = vConditions;
      
      values.push(vObj);
    });
    
    return values;
  }

  buildConditionsJSON(condGroups) {
    if (condGroups.length === 0) return {};
    if (condGroups.length === 1) return this.extractGroupConditions(condGroups[0]);
    
    const allGroups = [];
    condGroups.forEach(g => {
      const c = this.extractGroupConditions(g);
      if (Object.keys(c).length > 0) allGroups.push(c);
    });
    
    return allGroups.length > 0 ? { allOf: allGroups } : {};
  }

  extractGroupConditions(groupEl) {
    const logic = groupEl.querySelector('.group-logic').value;
    const condEntries = groupEl.querySelectorAll('.condition-entry');
    const groupArray = [];
    
    condEntries.forEach(entry => {
      const cVar = entry.querySelector('.cond-var-select').value.trim();
      const cVal = entry.querySelector('.cond-val-select').value.trim();
      if (cVar && cVal) {
        let cObj = {};
        cObj[cVar] = cVal;
        groupArray.push(cObj);
      }
    });
    
    if (groupArray.length === 0) return {};
    return {[logic]: groupArray};
  }

  loadSchemaIntoBuilder(json) {
    this.variablesContainer.innerHTML = '';

    if (!json.variables) return;
    json.variables.forEach(v => {
      this.addVariableUI(this.variablesContainer, v);
    });
    this.triggerSchemaUpdate();
  }

  populateVariableData(block, data) {
    // Ensure the block starts collapsed
    block.classList.remove('expanded');
    
    const content = block.querySelector('.variable-content');
    content.querySelector('.var-name').value = data.name || '';
    content.querySelector('.var-desc').value = data.description || '';
    content.querySelector('.var-type').value = data.type || 'enum';

    // Populate values
    const valuesContainer = content.querySelector('.valuesContainer');
    (data.values || []).forEach(value => {
      this.addValueUI(valuesContainer, value, data.type);
    });

    // Populate conditions
    if (data.conditions) {
      const conditionsContainer = content.querySelector('.conditionsContainer');
      this.populateConditions(conditionsContainer, data.conditions);
    }

    // Update the summary display
    const updateEvent = new Event('change');
    content.querySelector('.var-name').dispatchEvent(updateEvent);
  }

  populateConditions(container, conditionsData) {
    if (!conditionsData || Object.keys(conditionsData).length === 0) return;
    
    // If top-level allOf or anyOf
    if (conditionsData.allOf || conditionsData.anyOf) {
      this.addConditionGroupUI(container, conditionsData);
    } else {
      // No allOf/anyOf, single condition set
      this.addConditionGroupUI(container, { allOf: [conditionsData] });
    }
  }
} 