# @crypto-tracker/ui

A comprehensive UI component library built specifically for crypto portfolio tracking applications. Built with React 19, Radix UI primitives, and Tailwind CSS v4.

## Features

- 🎨 **Modern Design System**: Crypto-themed color palette with dark/light mode support
- ♿ **Accessibility First**: Built on Radix UI primitives with full keyboard navigation
- 🔧 **TypeScript**: Fully typed components with excellent IntelliSense
- 📱 **Responsive**: Mobile-first design with proper breakpoints
- 🎭 **Themeable**: CSS variables for easy customization
- 🚀 **Performance**: Optimized bundle size with tree-shaking

## Installation

```bash
pnpm add @crypto-tracker/ui
```

## Usage

### Basic Setup

```tsx
import { Button, Card, WalletCard } from "@crypto-tracker/ui";
import "@crypto-tracker/ui/styles";

function App() {
  return (
    <div>
      <Button variant="default">Connect Wallet</Button>
      <WalletCard
        address="0x742d35Cc6634C0532925a3b844Bc9e7595f2bD40"
        chain="ethereum"
        balance={1250.50}
        label="Main Wallet"
      />
    </div>
  );
}
```

### Theme Provider

```tsx
import { ThemeProvider } from "@crypto-tracker/ui";

function App() {
  return (
    <ThemeProvider defaultTheme="system">
      {/* Your app */}
    </ThemeProvider>
  );
}
```

## Components

### UI Components

- **Button**: Multiple variants with loading states
- **Card**: Flexible card component with header, content, footer
- **Badge**: Status and chain indicators
- **Input**: Enhanced input with icons and validation
- **Alert**: Notification and error states
- **Skeleton**: Loading placeholders
- **Separator**: Visual dividers
- **Label**: Form labels
- **Tooltip**: Contextual help

### Crypto Components

- **WalletCard**: Complete wallet display with balance and actions
- **TokenBadge**: Token information with price changes
- **PriceDisplay**: Price formatting with trend indicators
- **ChainIcon**: Branded blockchain icons

## Utilities

```tsx
import { formatAddress, formatUSD, formatCryptoAmount } from "@crypto-tracker/ui";

// Format long addresses
formatAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f2bD40"); // "0x742d...2bD40"

// Format USD amounts
formatUSD(1250.50); // "$1,250.50"

// Format crypto amounts
formatCryptoAmount("1000000000000000000", 18, 4); // "1.0000"
```

## Customization

### CSS Variables

The design system uses CSS variables that can be customized:

```css
:root {
  --color-crypto-blue: oklch(0.5 0.2 250);
  --color-crypto-purple: oklch(0.45 0.25 300);
  --color-crypto-green: oklch(0.6 0.2 150);
  --color-crypto-orange: oklch(0.65 0.2 50);
}
```

### Component Variants

Most components support multiple variants:

```tsx
<Button variant="default" size="lg" loading>
  Processing...
</Button>

<Badge variant="ethereum" size="sm">
  ETH
</Badge>

<Alert variant="warning">
  <AlertTitle>Warning</AlertTitle>
  <AlertDescription>Check your wallet connection</AlertDescription>
</Alert>
```

## Development

```bash
# Type checking
pnpm type-check

# Linting
pnpm lint

# Formatting
pnpm format
```

## Architecture

The library follows a modular architecture:

```
src/
├── components/
│   ├── ui/           # Generic UI components
│   └── crypto/       # Domain-specific components
├── lib/              # Utilities and helpers
├── providers/        # React context providers
└── styles/           # Global styles and themes
```

## Contributing

1. Follow the existing component patterns
2. Include proper TypeScript types
3. Add loading and error states
4. Ensure accessibility compliance
5. Test with both light and dark themes