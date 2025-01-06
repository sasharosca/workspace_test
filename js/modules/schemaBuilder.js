import { createElement } from './utils.js';

export class SchemaBuilder {
  constructor() {
    this.variablesContainer = document.getElementById('variablesContainer');
    this.addVarBtn = document.getElementById('addVariableBtn');
    this.downloadSchemaBtn = document.getElementById('downloadSchemaBtn');
    this.uploadSchemaBtn = document.getElementById('uploadSchemaBtn');
    this.uploadInput = document.getElementById('uploadInput');
    this.onSchemaChange = null;
    
    this.setupEventListeners();
  }

  setupEventListeners() {
    this.addVarBtn.addEventListener('click', () => {
      this.addVariableUI(this.variablesContainer);
      this.triggerSchemaUpdate();
    });
    this.downloadSchemaBtn.addEventListener('click', () => this.downloadSchema());
    this.uploadSchemaBtn.addEventListener('click', () => this.uploadInput.click());
    this.uploadInput.addEventListener('change', () => this.handleUpload());

    // Listen for changes in the variables container
    this.variablesContainer.addEventListener('change', () => {
      this.triggerSchemaUpdate();
    });
  }

  triggerSchemaUpdate() {
    if (this.onSchemaChange) {
      const schema = this.buildSchema();
      this.onSchemaChange(schema);
    }
  }

  addVariableUI(container, variableData=null) {
    const variableBlock = createElement('div', {className:'variable-entry'});
    variableBlock.innerHTML = `
      <h3>Variable</h3>
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
    container.appendChild(variableBlock);

    const varTypeSelect = variableBlock.querySelector('.var-type');
    variableBlock.querySelector('.addConditionGroupBtn').addEventListener('click', () => {
      this.addConditionGroupUI(variableBlock.querySelector('.conditionsContainer'));
    });
    variableBlock.querySelector('.addValueBtn').addEventListener('click', () => {
      this.addValueUI(variableBlock.querySelector('.valuesContainer'));
      this.triggerSchemaUpdate();
    });

    if (variableData) {
      this.populateVariableData(variableBlock, variableData);
    }

    return variableBlock;
  }

  populateVariableData(block, data) {
    block.querySelector('.var-name').value = data.name || '';
    block.querySelector('.var-type').value = data.type || 'enum';
    if (data.description) block.querySelector('.var-desc').value = data.description;
    
    if (data.values && Array.isArray(data.values)) {
      data.values.forEach(valObj => {
        const valContainer = block.querySelector('.valuesContainer');
        this.addValueUI(valContainer, valObj, data.type);
      });
    }
    
    if (data.conditions) {
      this.populateConditions(block.querySelector('.conditionsContainer'), data.conditions);
    }
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

  async downloadSchema() {
    const schema = this.buildSchema();
    const schemaText = JSON.stringify(schema, null, 2);
    const blob = new Blob([schemaText], {type: 'application/json'});
    const url = URL.createObjectURL(blob);
    const a = createElement('a', {href: url, download: 'schema.json'});
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  async handleUpload() {
    const file = this.uploadInput.files[0];
    if (!file) return;
    
    try {
      const text = await file.text();
      const json = JSON.parse(text.trim());
      if (!json || typeof json !== 'object') {
        throw new Error('Invalid schema format');
      }
      this.loadSchemaIntoBuilder(json);
      this.triggerSchemaUpdate();
    } catch(e) {
      console.error('Schema parsing error:', e);
      alert('Invalid JSON file: ' + e.message);
    }
  }

  loadSchemaIntoBuilder(json) {
    this.variablesContainer.innerHTML = '';

    if (!json.variables) return;
    json.variables.forEach(v => {
      this.addVariableUI(this.variablesContainer, v);
    });
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