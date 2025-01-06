import { SchemaBuilder } from './modules/schemaBuilder.js';
import { DynamicUI } from './modules/dynamicUI.js';

document.addEventListener('DOMContentLoaded', () => {
  const schemaBuilder = new SchemaBuilder();
  const dynamicUI = new DynamicUI(schemaBuilder);

  // Connect the schema builder to the dynamic UI
  schemaBuilder.onSchemaChange = (schema) => {
    dynamicUI.renderSchema(schema);
  };
}); 