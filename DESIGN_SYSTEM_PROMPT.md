# Soopsori Design System (Neo-Brutalism)

This document contains the core design system for the **Soopsori** project.
When building new applications (e.g., React Native, Flutter, or new web features) for this project, you MUST strictly follow the design tokens, components, and aesthetic rules outlined below.

## 1. Design Aesthetics & Core Principles
- **Theme:** Pop Art Neo-Brutalism
- **Core Traits:** Bold borders (usually 2px-3px solid black), sharp box-shadows (no blur), high-contrast vivid colors, and rounded pill shapes for interactive elements.
- **Micro-interactions:** Interactive elements (buttons, cards) translate across the X and Y axes when hovered or pressed, giving a physical "pressed" feeling while adjusting the shadow depth.

## 2. Design Tokens (Colors)
These colors should be mapped to the target framework's theme variables.

### Light Mode (Default)
- `neo-yellow`: `#F2DF11`
- `neo-pink`: `#ED1C8B`
- `neo-blue`: `#1CC9E8`
- `neo-green`: `#16DB65`
- `white`: `#ffffff`
- `black`: `#000000`

### Dark Mode (Cyberpunk Alternative)
- `neo-yellow`: `#A040FF`
- `neo-pink`: `#33D6FF`
- `neo-blue`: `#40E060`
- `neo-green`: `#F04060`
- `white`: `#111111`
- `black`: `#e5e5e5`

## 3. UI Component Specs

### 3.1 Button
- **Base Style:** 
  - Border: 2px solid black.
  - Border Radius: Full (Pill shape, e.g., 9999px).
  - Font: Bold, lowercase text.
  - Padding: `h-10`, `px-4`, `py-2` (Default Size).
- **Variants:**
  - `default`: White background, black text. Hover -> `neo-yellow` background.
  - `primary`: `neo-pink` background, white text. Hover -> black background, `neo-yellow` text.
  - `secondary`: `neo-yellow` background, black text. Hover -> `neo-pink` background, white text.
- **Interaction (Hover/Active):**
  - **Idle:** Shadow `4px 4px 0px black`.
  - **Hover:** Translate X(2px) Y(2px), Shadow `2px 2px 0px black`.
  - **Active:** Translate X(4px) Y(4px), Shadow `0px 0px 0px black`.

### 3.2 Card
- **Base Style:**
  - Background: White.
  - Border: 2px solid black.
  - Shadow: `4px 4px 0px black` (neo-shadow).
  - Corner: Sharp (No border-radius).
- **Interaction:**
  - **Hover:** Translate X(-2px) Y(-2px), Shadow `6px 6px 0px black` (neo-shadow-lg).

### 3.3 Input Field
- **Base Style:**
  - Background: White.
  - Border: 2px solid black.
  - Shadow: Inner shadow `inset 4px 4px 0px rgba(0,0,0,0.05)`.
  - Font: Bold.
- **Interaction:**
  - **Focus:** Background changes to `neo-yellow`, Inner shadow deepens `inset 4px 4px 0px rgba(0,0,0,0.1)`. Outline is removed.

### 3.4 Badge (Tags)
- **Base Style:**
  - Border: 2px solid black.
  - Border Radius: Full (Pill shape).
  - Font: Extra bold (Black weight), tiny size (`text-xs`).
  - Padding: `px-2.5`, `py-0.5`.
- **Variants (By Position):**
  - `vocal`: `neo-pink` background, white text.
  - `acoustic-guitar`: `neo-yellow` background, black text.
  - `electric-guitar`: `neo-blue` background, black text.
  - `bass`: `neo-green` background, black text.
  - `drum`: Dark gray background, white text.

## 4. Typography
- **Primary Font:** Pretendard (or system-ui fallback).
- **Headings:** Extra bold (900 weight), tight letter spacing (`tracking-tight`).
- **Body:** Regular or Bold for emphasis.

## Usage for AI Agents
When generating UI code (e.g., in React Native StyleSheet or Flutter Themes), you MUST adhere to the above rules. Hardcode the shadows without blur (e.g. `elevation: 0, shadowOffset: { width: 4, height: 4 }, shadowOpacity: 1, shadowRadius: 0` in React Native). Do NOT use generic material design or iOS native components without completely overriding their styles to match this Neo-Brutalism aesthetic.
