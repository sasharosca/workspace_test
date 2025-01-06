# Schema Builder with Dynamic UI

A web-based tool for building and visualizing conditional schemas with a dynamic, interactive UI. This tool allows you to create complex, nested schemas with conditional logic and see the results in real-time.

## Features

- **Schema Builder**
  - Create variables with different types (enum, info)
  - Add conditional logic to variables and values
  - Support for AND/OR conditions
  - Real-time schema generation
  - Upload existing schemas
  - Download generated schemas as JSON

- **Dynamic UI**
  - Real-time preview of the schema
  - Interactive form elements based on schema
  - Conditional rendering based on selections
  - Live updates as you make choices

- **Modern Interface**
  - Clean, intuitive design
  - Responsive layout
  - Visual separation between components
  - Clear hierarchy of information

## Getting Started

1. Clone this repository
2. Open `index.html` in a modern web browser
3. Start building your schema!

## How to Use

### Building a Schema

1. Click "Add Variable" to create a new variable
2. Fill in the variable details:
   - Name: The identifier for your variable
   - Type: Choose between:
     - `enum`: For dropdown selections
     - `info`: For informational text
   - Description: Optional explanation of the variable

3. Add values to your variable:
   - For `enum` types: These become dropdown options
   - For `info` types: These become conditional text blocks
   - Each value can have its own conditions

4. Add conditions (optional):
   - Click "Add Condition Group" to create a condition
   - Choose between AND/OR logic
   - Select which variables and values trigger the condition

### Managing Schemas

- **Save Schema**: Click "Build Schema" to generate the JSON
- **Download**: Click "Download Schema" to save as a JSON file
- **Upload**: Use "Upload Schema" to load an existing schema

### Using the Dynamic UI

The dynamic UI section shows how your schema works in practice:
1. Make selections from the dropdowns
2. Watch as conditional elements appear/disappear
3. See your current selections displayed in real-time

## Schema Structure

The generated schema follows this format:

```json
{
  "variables": [
    {
      "name": "string",
      "type": "enum|info",
      "description": "string (optional)",
      "values": [
        {
          "name": "string (for enum)",
          "description": "string (for info)",
          "conditions": {
            "allOf|anyOf": [
              {"variableName": "value"}
            ]
          }
        }
      ],
      "conditions": {
        "allOf|anyOf": [
          {"variableName": "value"}
        ]
      }
    }
  ]
}
```

## Browser Compatibility

Tested and working in:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Technical Details

Built using:
- Vanilla JavaScript (ES6+)
- CSS3
- HTML5
- Modular architecture for maintainability

Files structure:
```
├── index.html
├── css/
│   └── styles.css
└── js/
    ├── main.js
    └── modules/
        ├── schemaBuilder.js
        ├── dynamicUI.js
        └── utils.js
```