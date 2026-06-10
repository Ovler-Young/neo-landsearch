import {
  createFilterGroup,
  createSingleFilter,
  FilterGroup,
  SingleFilter,
} from "@fn-sphere/filter";
import { filterFnList } from "./schema";
import { forumIds } from "./forum-data";
import { z } from "zod";

// Define operator mapping
const FILTER_OPERATORS: Record<string, string> = {
  equals: "=",
  notEquals: "!=",
  greaterThan: ">",
  greaterThanOrEqual: ">=",
  lessThan: "<",
  lessThanOrEqual: "<=",
  contains: "CONTAINS",
  notContains: "NOT CONTAINS",
  startsWith: "STARTS WITH",
  notStartsWith: "NOT STARTS WITH",
  in: "IN",
  notIn: "NOT IN",
  isNull: "IS NULL",
  isNotNull: "IS NOT NULL",
  isEmpty: "IS EMPTY",
  isNotEmpty: "IS NOT EMPTY",
  before: "<",
  after: ">",
};

const OPERATOR_FILTERS: Record<string, string> = {
  "=": "equals",
  "!=": "notEquals",
  ">=": "greaterThanOrEqual",
  "<=": "lessThanOrEqual",
  CONTAINS: "contains",
  "NOT CONTAINS": "notContains",
  "STARTS WITH": "startsWith",
  "NOT STARTS WITH": "notStartsWith",
  IN: "in",
  "NOT IN": "notIn",
  "IS NULL": "isNull",
  "IS NOT NULL": "isNotNull",
  "IS EMPTY": "isEmpty",
  "IS NOT EMPTY": "isNotEmpty",
};

const QUERY_TOKEN =
  /\s*(>=|<=|!=|=|>|<|\(|\)|"(?:(?:\\.)|[^"\\])*"|AND\b|OR\b|IS\s+NOT\s+NULL\b|IS\s+NULL\b|IS\s+NOT\s+EMPTY\b|IS\s+EMPTY\b|NOT\s+CONTAINS\b|CONTAINS\b|NOT\s+STARTS\s+WITH\b|STARTS\s+WITH\b|sec\(\d{4}-\d{1,2}-\d{1,2}\)|[A-Za-z_][A-Za-z0-9_]*|-?\d+(?:\.\d+)?)/gi;

const FIELD_TYPES: Record<string, "string" | "number" | "date" | "literal"> = {
  type: "literal",
  name: "string",
  title: "string",
  content: "string",
  userid: "string",
  id: "number",
  now: "date",
  parent: "number",
  fid: "literal",
  ext: "string",
};

const parseQueryTokens = (query: string) => {
  const tokens: string[] = [];
  let index = 0;
  QUERY_TOKEN.lastIndex = 0;

  while (index < query.length) {
    const match = QUERY_TOKEN.exec(query);
    if (!match || match.index !== index) return null;
    tokens.push(match[1]);
    index = QUERY_TOKEN.lastIndex;
  }

  return tokens;
};

function parseQueryValue(token?: string): unknown {
  if (token === undefined) return undefined;
  if (token.startsWith('"') && token.endsWith('"')) {
    return token.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }

  const dateMatch = token.match(/^sec\((\d{4})-(\d{1,2})-(\d{1,2})\)$/);
  if (dateMatch) {
    return new Date(
      Number(dateMatch[1]),
      Number(dateMatch[2]) - 1,
      Number(dateMatch[3])
    );
  }

  if (/^-?\d+(?:\.\d+)?$/.test(token)) {
    return Number(token);
  }

  return token;
}

function normalizeQueryValue(path: string, value: unknown): unknown {
  const fieldType = FIELD_TYPES[path];
  if (!fieldType) return undefined;

  if (fieldType === "number") {
    if (typeof value === "number") return value;
    if (typeof value === "string" && /^-?\d+(?:\.\d+)?$/.test(value)) {
      return Number(value);
    }
    return undefined;
  }

  if (fieldType === "date") {
    return value instanceof Date ? value : undefined;
  }

  if (fieldType === "literal") {
    if (path === "type" && (value === "thread" || value === "reply")) {
      return value;
    }
    if (path === "fid" && forumIds.includes(String(value))) {
      return String(value);
    }
    return undefined;
  }

  return typeof value === "string" ? value : undefined;
}

const normalizeOperator = (operator: string) =>
  operator.replace(/\s+/g, " ").toUpperCase();

function parseSingleQueryFilter(tokens: string[], index: number) {
  const path = tokens[index];
  const operatorToken = tokens[index + 1];
  if (!path || !operatorToken) return null;
  if (!(path in FIELD_TYPES)) return null;

  const operator = normalizeOperator(operatorToken);
  const rawValue = parseQueryValue(tokens[index + 2]);
  const value = operator.startsWith("IS ")
    ? undefined
    : normalizeQueryValue(path, rawValue);
  if (!operator.startsWith("IS ") && value === undefined) return null;
  const name =
    operator === ">"
      ? value instanceof Date
        ? "after"
        : "greaterThan"
      : operator === "<"
        ? value instanceof Date
          ? "before"
          : "lessThan"
        : OPERATOR_FILTERS[operator];
  if (!name) return null;

  const nextIndex =
    operator.startsWith("IS ") &&
    !["=", "!=", ">", ">=", "<", "<="].includes(operator)
      ? index + 2
      : index + 3;
  const args = nextIndex === index + 2 ? [] : [value];

  return {
    rule: createSingleFilter({
      path: [path],
      name,
      args,
    }),
    index: nextIndex,
  };
}

function parseQueryGroup(tokens: string[], index = 0) {
  if (tokens[index] !== "(") return null;
  index += 1;

  const conditions: FilterGroup["conditions"] = [];
  let op: FilterGroup["op"] | undefined;

  while (index < tokens.length) {
    if (tokens[index] === ")") {
      return {
        rule: createFilterGroup({
          op: op ?? "and",
          conditions,
        }),
        index: index + 1,
      };
    }

    const result =
      tokens[index] === "("
        ? parseQueryGroup(tokens, index)
        : parseSingleQueryFilter(tokens, index);
    if (!result) return null;

    conditions.push(result.rule);
    index = result.index;

    if (tokens[index] === ")") continue;
    const joiner = tokens[index]?.toLowerCase();
    if (joiner !== "and" && joiner !== "or") return null;
    if (op && op !== joiner) return null;
    op = joiner;
    index += 1;
  }

  return null;
}

/**
 * Checks if a filter is unary (takes 0 or 1 parameters)
 *
 * Unary filters include operations like isNull, isEmpty, isNotNull etc.
 */
const checkUnaryFilter = (filterName: string) => {
  // use `validateRule` from @fn-sphere/core in the future
  const filterSchema = filterFnList.find((fn) => fn.name === filterName);
  if (!filterSchema) throw new Error("Unknown filter! " + filterName);
  const filterDefine =
    typeof filterSchema.define === "function"
      ? filterSchema.define(z.any())
      : filterSchema.define;
  const parameters = filterDefine.parameters();
  return parameters.items.length <= 1;
};

function transformSingleFilter(filter: SingleFilter): string | null {
  const path = filter.path?.[0];
  const operator = filter.name ? FILTER_OPERATORS[filter.name] : undefined;
  const value = filter.args[0];

  if (!filter.name || path === undefined || operator === undefined) {
    return null;
  }
  const isUnaryFilter = checkUnaryFilter(filter.name);
  if (value === undefined && !isUnaryFilter) {
    return null;
  }

  // Handle array values for IN/NOT IN operators
  if (Array.isArray(value)) {
    return `${path} ${operator} [${value
      .map((v) => (typeof v === "string" ? `${v}` : v))
      .join(", ")}]`;
  }

  if (value === undefined) {
    return `${path} ${operator}`;
  }

  // Handle string values
  if (typeof value === "string") {
    return `${path} ${operator} "${value}"`;
  }
  // Handle date values
  if (value instanceof Date) {
    const dateStr = `sec(${value.getFullYear()}-${
      value.getMonth() + 1
    }-${value.getDate()})`;
    return `${path} ${operator} ${dateStr}`;
  }

  return `${path} ${operator} ${value}`;
}

function transformFilterGroup(filterGroup: FilterGroup): string | null {
  if (!filterGroup.conditions.length) return "";

  const conditions = filterGroup.conditions.map((condition) => {
    if (condition.type === "Filter") {
      return transformSingleFilter(condition);
    } else {
      return transformFilterGroup(condition);
    }
  });

  const operator = filterGroup.op.toUpperCase() as Uppercase<FilterGroup["op"]>;
  const result = conditions.filter((i) => i !== null).join(` ${operator} `);
  if (!result) {
    return null;
  }

  return `(${result})`;
}

/**
 * Transforms a FilterGroup object into a query string format for advanced search.
 *
 * @example
 * ```ts
 * filterRuleToQueryString({
 *   type: "FilterGroup",
 *   op: "and",
 *   conditions: [{
 *     type: "Filter",
 *     path: ["title"],
 *     name: "equals",
 *     args: ["hello world"]
 *   }]
 * })
 * // "(title = "hello world")"
 * ```
 */
export const filterRuleToQueryString = (filterGroup: FilterGroup) => {
  return transformFilterGroup(filterGroup) ?? "";
};

export function queryStringToFilterRule(query: string): FilterGroup | null {
  const tokens = parseQueryTokens(query.trim());
  if (!tokens?.length) return null;

  const result = parseQueryGroup(tokens);
  if (!result || result.index !== tokens.length) return null;
  if (!result.rule.conditions.length) return null;

  return result.rule;
}

/**
 * Serializes a FilterGroup object to JSON string with special date handling
 */
export function serializeFilterGroup(filterGroup: FilterGroup): string {
  const replacer = function (this: any, key: string, value: any) {
    // Special handling for Date objects in args
    return this[key] instanceof Date
      ? {
          __type: "Date",
          value: this[key].toISOString(),
        }
      : this[key];
  };
  const serialized = JSON.stringify(filterGroup, replacer);
  return serialized;
}

/**
 * deserializes a JSON string back to FilterGroup object
 */
export function deserializeFilterGroup(serialized: string): FilterGroup {
  const deserialized = JSON.parse(serialized, (key, value) => {
    // Revive Date objects from special format
    if (value && typeof value === "object" && value.__type === "Date") {
      return new Date(value.value);
    }
    return value;
  });

  // Type guard to ensure we have a valid FilterGroup
  if (!isValidFilterGroup(deserialized)) {
    throw new Error("Invalid FilterGroup structure");
  }
  return deserialized;
}

/**
 * Type guard to validate FilterGroup structure
 */
function isValidFilterGroup(obj: any): obj is FilterGroup {
  return (
    obj &&
    typeof obj === "object" &&
    typeof obj.id === "string" &&
    obj.type === "FilterGroup" &&
    (obj.op === "and" || obj.op === "or") &&
    Array.isArray(obj.conditions)
  );
}
