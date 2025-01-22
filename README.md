# Schema Builder with Dynamic UI

A web-based tool for exploring and visualizing relationships in conditional schemas. This tool helps you understand how different variables and values are interconnected through an intuitive, interactive interface.

## Features

- **Relationship Visualization**
  - Interactive exploration of variable relationships
  - Visual highlighting of related values
  - Clear indication of incompatible selections
  - Intuitive interface for understanding connections

- **Schema Builder**
  - Create variables and their possible values
  - Define relationships between variables using conditions
  - Support for AND/OR logic
  - Real-time schema generation
  - Upload existing schemas
  - Download generated schemas as JSON

- **Dynamic UI**
  - Visual feedback for relationships:
    - Related values are highlighted with a light blue background
    - Incompatible values are dimmed
    - Unrelated values remain clearly visible
    - Hover effects reveal potential relationships
  - Smooth transitions between states
  - Interactive checkboxes for selection
  - Bidirectional relationship display

## Getting Started

1. Clone this repository
2. Set up a local development server. You can use one of these methods:
   - Python: Run `python -m http.server` in the project directory
   - Node.js: Install `http-server` globally with `npm install -g http-server` and run `http-server`
   - VS Code: Use the "Live Server" extension
3. Open the provided local server URL in your browser (typically `http://localhost:8000` or `http://localhost:8080`)
4. Start exploring relationships in your schema!

## How to Use

### Building a Schema

1. Click "Add Variable" to create a new variable
2. Fill in the variable details:
   - Name: The identifier for your variable
   - Description: Optional explanation of the variable

3. Add values to your variable:
   - Values become selectable options
   - Each value can have relationships with other values

4. Define relationships (optional):
   - Click "Add Condition Group" to create a relationship
   - Choose between AND/OR logic
   - Select which variables and values are related

### Exploring Relationships

The dynamic UI helps you understand relationships between variables:

1. **Visual States**:
   - Default: All values are fully visible
   - Related: Values with relationships are highlighted in light blue
   - Incompatible: Values that conflict with current selections are dimmed
   - Hover: Reveals potential relationships

2. **Interaction**:
   - Select values to see their relationships
   - Related values in other variables are automatically highlighted
   - Incompatible values are dimmed but remain accessible
   - Deselect values to explore different combinations

3. **Bidirectional Relationships**:
   - Relationships work in both directions
   - Selecting a value shows what it's related to
   - Selecting a related value highlights what it's connected to

### Managing Schemas

- **Save Schema**: Click "Build Schema" to generate the JSON
- **Download**: Click "Download Schema" to save as a JSON file
- **Upload**: Use "Upload Schema" to load an existing schema

## Schema Structure

The schema uses conditions to define relationships between values:

```json
{
  "variables": [
    {
      "name": "string",
      "description": "string (optional)",
      "values": [
        {
          "name": "string",
          "conditions": {
            "allOf|anyOf": [
              {"variableName": "value"}
            ]
          }
        }
      ]
    }
  ]
}
```

- `conditions`: Define relationships between values
- `allOf`: All conditions must be met (AND logic)
- `anyOf`: Any condition can be met (OR logic)

## Technical Details

Built using:
- Vanilla JavaScript (ES6+)
- CSS3 with smooth transitions
- HTML5
- Modular architecture for maintainability
