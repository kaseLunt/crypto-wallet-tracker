import { GraphQLScalarType, Kind, type ValueNode } from "graphql";

// A type alias for any valid JSON value. This is more specific than 'any'.
type JsonValue = string | number | boolean | null | { [key: string]: JsonValue } | JsonValue[];

export const DateTimeScalar = new GraphQLScalarType({
  name: "DateTime",
  description: "Date time string in ISO 8601 format",
  serialize: (value: unknown): string => {
    if (value instanceof Date) {
      return value.toISOString();
    }
    return String(value);
  },
  parseValue: (value: unknown): Date => {
    if (typeof value === "string") {
      return new Date(value);
    }
    throw new Error("DateTime must be a string");
  },
  parseLiteral: (ast: ValueNode): Date => {
    if (ast.kind === Kind.STRING) {
      return new Date(ast.value);
    }
    throw new Error("DateTime must be a string");
  },
});

export const BigIntScalar = new GraphQLScalarType({
  name: "BigInt",
  description: "Large integer values",
  serialize: (value: unknown): string => {
    if (typeof value === "bigint") {
      return value.toString();
    }
    if (typeof value === "number" || typeof value === "string") {
      return String(value);
    }
    throw new Error("BigInt must be a number or string");
  },
  parseValue: (value: unknown): bigint => {
    if (typeof value === "string" || typeof value === "number") {
      try {
        return BigInt(value);
      } catch {
        throw new Error("Invalid BigInt value");
      }
    }
    throw new Error("BigInt must be a string or number");
  },
  parseLiteral: (ast: ValueNode): bigint => {
    if (ast.kind === Kind.STRING || ast.kind === Kind.INT) {
      try {
        return BigInt(ast.value);
      } catch {
        throw new Error("Invalid BigInt value");
      }
    }
    throw new Error("BigInt must be a string or integer");
  },
});

// The 'ast' parameter is now correctly typed as 'ValueNode'
function parseJSONLiteral(ast: ValueNode): JsonValue {
  switch (ast.kind) {
    case Kind.STRING:
    case Kind.BOOLEAN:
      return ast.value;
    case Kind.INT:
    case Kind.FLOAT:
      return Number.parseFloat(ast.value);
    case Kind.OBJECT: {
      const value = Object.create(null);
      for (const field of ast.fields) {
        value[field.name.value] = parseJSONLiteral(field.value);
      }
      return value;
    }
    case Kind.LIST:
      return ast.values.map(parseJSONLiteral);
    case Kind.NULL:
      return null;
    default:
      // This default case handles any unexpected node types, making the function safer.
      return null;
  }
}

export const JSONScalar = new GraphQLScalarType({
  name: "JSON",
  description: "Arbitrary JSON value",
  // We can cast the return type to our more specific JsonValue
  serialize: (value: unknown): JsonValue => value as JsonValue,
  parseValue: (value: unknown): JsonValue => value as JsonValue,
  parseLiteral: parseJSONLiteral,
});
