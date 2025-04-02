# Dashboard Theme Customization

This dashboard supports theme customization through a JSON configuration file. You can modify existing themes or add new ones by editing the `themes.json` file in the public directory.

## Understanding the themes.json Structure

The `themes.json` file has the following structure:

```json
{
  "themes": {
    "light": {
      "name": "Light",
      "colors": {
        "background": "0 0% 100%",
        "foreground": "240 10% 3.9%",
        // ... more color variables
      },
      "radius": "0.75rem"
    },
    "dark": {
      "name": "Dark",
      "colors": {
        // ... dark theme colors
      },
      "radius": "0.75rem"
    },
    // ... more themes
  },
  "activeTheme": "light"
}
```

## How to Customize Themes

### Adding a New Theme

1. Open the `themes.json` file
2. Add a new theme entry in the `themes` object:

```json
"mytheme": {
  "name": "My Custom Theme",
  "colors": {
    // Copy from an existing theme and modify
  },
  "radius": "0.5rem"
}
```

### Specifying Colors

You can use either of these formats for color values:

#### HSL Format (Recommended)
The HSL format is specified as "hue saturation% lightness%". For example:
- Red: "0 100% 50%"
- Blue: "210 100% 50%"
- Gray: "0 0% 50%"

#### Hexadecimal Format
You can also use standard hex color codes. For example:
- Red: "#FF0000"
- Blue: "#0066FF"
- Gray: "#808080"

The dashboard will automatically convert hex codes to the appropriate HSL values.

Example with hex codes:
```json
"colors": {
  "background": "#FFFFFF",
  "foreground": "#111111",
  "primary": "#0066FF",
  "accent": "#E6F0FF"
}
```

### Important Color Variables

- `background` / `foreground`: Main background and text colors
- `primary` / `primary-foreground`: Primary action colors
- `secondary` / `secondary-foreground`: Secondary UI element colors
- `card` / `card-foreground`: Card component colors
- `sidebar-background` / `sidebar-foreground`: Sidebar colors
- `destructive` / `destructive-foreground`: Error/delete action colors
- `muted` / `muted-foreground`: Muted UI element colors
- `accent` / `accent-foreground`: Accent UI element colors
- `border`: Border color
- `radius`: Border radius for UI elements

## Setting the Default Theme

To change the default theme, modify the `activeTheme` value to match the key of your preferred theme:

```json
"activeTheme": "mytheme"
```

Users can still change themes in the UI, but this sets the initial default theme for new users.

## Reload Required

After making changes to the themes.json file, you may need to refresh your browser to see the changes take effect. 