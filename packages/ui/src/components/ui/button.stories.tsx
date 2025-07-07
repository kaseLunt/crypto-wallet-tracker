import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "./button";
import { Copy, Wallet } from "lucide-react";

const meta: Meta<typeof Button> = {
  title: "UI/Button",
  component: Button,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: [
        "default",
        "destructive",
        "outline",
        "secondary",
        "ghost",
        "link",
        "success",
        "warning",
      ],
    },
    size: {
      control: { type: "select" },
      options: ["default", "sm", "lg", "icon", "icon-sm", "icon-lg"],
    },
    loading: {
      control: { type: "boolean" },
    },
    disabled: {
      control: { type: "boolean" },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: "Connect Wallet",
  },
};

export const Secondary: Story = {
  args: {
    variant: "secondary",
    children: "Secondary Action",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    children: "Disconnect",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    children: "View Details",
  },
};

export const Ghost: Story = {
  args: {
    variant: "ghost",
    children: "Ghost Button",
  },
};

export const Success: Story = {
  args: {
    variant: "success",
    children: "Transaction Confirmed",
  },
};

export const Warning: Story = {
  args: {
    variant: "warning",
    children: "High Gas Fee",
  },
};

export const Loading: Story = {
  args: {
    loading: true,
    children: "Processing...",
  },
};

export const WithIcon: Story = {
  args: {
    children: (
      <>
        <Wallet className="mr-2 h-4 w-4" />
        Connect Wallet
      </>
    ),
  },
};

export const IconOnly: Story = {
  args: {
    variant: "outline",
    size: "icon",
    children: <Copy className="h-4 w-4" />,
  },
};

export const Small: Story = {
  args: {
    size: "sm",
    children: "Small Button",
  },
};

export const Large: Story = {
  args: {
    size: "lg",
    children: "Large Button",
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
    children: "Disabled Button",
  },
};
