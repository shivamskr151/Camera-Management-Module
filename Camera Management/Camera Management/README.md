# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react/README.md) uses [Babel](https://babeljs.io/) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

# DashboardX: JSON Configuration Guide

This application is fully configurable through JSON configuration. This allows for easy customization of the UI elements without modifying the codebase directly.

## Configuration Overview

The configuration is managed through the `appConfig` object defined in `src/config/app-config.ts`. This object provides a single source of truth for configurable elements across the application.

## Available Configuration Options

### Dashboard Configuration

```json
"dashboard": {
  "title": "Dashboard",
  "welcomeMessage": "Welcome back to your dashboard overview."
}
```

- `title`: The main heading displayed on the dashboard page
- `welcomeMessage`: The welcome text shown below the dashboard title

### Authentication Pages Configuration

```json
"auth": {
  "login": {
    "title": "Welcome back",
    "subtitle": "Enter your credentials to access your account"
  },
  "register": {
    "title": "Create an account",
    "subtitle": "Enter your details to get started"
  }
}
```

- `login.title`: The main heading on the login page
- `login.subtitle`: Descriptive text on the login page
- `register.title`: The main heading on the registration page
- `register.subtitle`: Descriptive text on the registration page

### Sidebar Configuration

```json
"sidebar": {
  "appName": "DashboardX",
  "sections": {
    "main": {
      "title": "Menu",
      "items": [
        { "name": "Dashboard", "icon": "LayoutDashboard", "href": "/dashboard" },
        { "name": "Reports", "icon": "BarChart3", "href": "/reports" },
        { "name": "Documents", "icon": "FileText", "href": "/documents" }
      ]
    },
    "admin": {
      "title": "Admin",
      "items": [
        { "name": "Users", "icon": "Users", "href": "/users" },
        { "name": "Settings", "icon": "Settings", "href": "/settings" }
      ]
    },
    "support": {
      "title": "Support",
      "items": [
        { "name": "Help Center", "icon": "Package", "href": "/help" }
      ]
    }
  },
  "roles": {
    "user": ["main", "support"],
    "admin": ["main", "admin", "support"]
  }
}
```

- `appName`: The application name displayed in the sidebar header
- `sections`: Defines groups of navigation items
  - `title`: The section heading
  - `items`: Array of navigation items
    - `name`: Display name of the menu item
    - `icon`: Icon name (from the Lucide icons library)
    - `href`: URL path for the navigation link
- `roles`: Controls which sidebar sections are visible to different user roles
  - Each role has an array of section keys that should be visible to users with that role

## How to Customize the Configuration

There are several ways to customize the configuration:

1. **Direct Modification**: Edit the `defaultConfig` object in `src/config/app-config.ts`

2. **LocalStorage**: The application checks for a configuration in localStorage under the key 'appConfig'
   ```javascript
   // Save custom configuration to localStorage
   localStorage.setItem('appConfig', JSON.stringify({
     dashboard: {
       title: "My Custom Dashboard",
       welcomeMessage: "Welcome to your personalized dashboard"
     }
   }));
   ```

3. **External API**: For production applications, you can modify the `loadConfig` function to fetch configuration from an API

## Extending the Configuration

To add new configurable elements:

1. Update the `AppConfig` interface in `src/config/app-config.ts`
2. Add default values to the `defaultConfig` object
3. Use the configuration values in your components

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default tseslint.config({
  extends: [
    // Remove ...tseslint.configs.recommended and replace with this
    ...tseslint.configs.recommendedTypeChecked,
    // Alternatively, use this for stricter rules
    ...tseslint.configs.strictTypeChecked,
    // Optionally, add this for stylistic rules
    ...tseslint.configs.stylisticTypeChecked,
  ],
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default tseslint.config({
  plugins: {
    // Add the react-x and react-dom plugins
    'react-x': reactX,
    'react-dom': reactDom,
  },
  rules: {
    // other rules...
    // Enable its recommended typescript rules
    ...reactX.configs['recommended-typescript'].rules,
    ...reactDom.configs.recommended.rules,
  },
})
```
