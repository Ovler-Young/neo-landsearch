import { describe, it, expect } from "vitest";
import {
  deserializeFilterGroup,
  filterRuleToQueryString,
  queryStringToFilterRule,
  serializeFilterGroup,
} from "./transform";
import type { FilterGroup } from "@fn-sphere/filter";

describe("filterRuleToQueryString", () => {
  it("should transform simple equals filter", () => {
    const filter: FilterGroup = {
      id: "0" as FilterGroup["id"],
      type: "FilterGroup",
      op: "and",
      conditions: [
        {
          id: "1" as FilterGroup["id"],
          type: "Filter",
          path: ["title"],
          name: "equals",
          args: ["hello world"],
        },
      ],
    };
    expect(filterRuleToQueryString(filter)).toBe('(title = "hello world")');
  });

  it("should handle multiple conditions with AND", () => {
    const filter: FilterGroup = {
      id: "0" as FilterGroup["id"],
      type: "FilterGroup",
      op: "and",
      conditions: [
        {
          id: "1" as FilterGroup["id"],
          type: "Filter",
          path: ["title"],
          name: "startsWith",
          args: ["2025"],
        },
        {
          id: "2" as FilterGroup["id"],
          type: "Filter",
          path: ["content_length"],
          name: "lessThan",
          args: [10],
        },
      ],
    };
    expect(filterRuleToQueryString(filter)).toBe(
      '(title STARTS WITH "2025" AND content_length < 10)'
    );
  });

  it("should handle nested filter groups", () => {
    const filter: FilterGroup = {
      id: "0" as FilterGroup["id"],
      type: "FilterGroup",
      op: "or",
      conditions: [
        {
          id: "1" as FilterGroup["id"],
          type: "FilterGroup",
          op: "and",
          conditions: [
            {
              id: "1" as FilterGroup["id"],
              type: "Filter",
              path: ["title"],
              name: "startsWith",
              args: ["2025"],
            },
            {
              id: "2" as FilterGroup["id"],
              type: "Filter",
              path: ["content_length"],
              name: "lessThan",
              args: [10],
            },
          ],
        },
        {
          id: "4" as FilterGroup["id"],
          type: "Filter",
          path: ["id"],
          name: "equals",
          args: ["1726778286371046"],
        },
      ],
    };
    expect(filterRuleToQueryString(filter)).toBe(
      '((title STARTS WITH "2025" AND content_length < 10) OR id = "1726778286371046")'
    );
  });

  it("should handle tag for CONTAINS operator", () => {
    const filter: FilterGroup = {
      id: "0" as FilterGroup["id"],
      type: "FilterGroup",
      op: "and",
      conditions: [
        {
          id: "1" as FilterGroup["id"],
          type: "Filter",
          path: ["tags"],
          name: "contains",
          args: ["ctf"],
        },
      ],
    };
    expect(filterRuleToQueryString(filter)).toBe(`(tags CONTAINS "ctf")`);
  });

  it("should handle date values", () => {
    const date = new Date(2024, 0, 1); // January 1, 2024
    const filter: FilterGroup = {
      id: "0" as FilterGroup["id"],
      type: "FilterGroup",
      op: "and",
      conditions: [
        {
          id: "1" as FilterGroup["id"],
          type: "Filter",
          path: ["createdAt"],
          name: "before",
          args: [date],
        },
      ],
    };
    expect(filterRuleToQueryString(filter)).toBe("(createdAt < sec(2024-1-1))");
  });

  it("should handle unary filter cases", () => {
    const filter: FilterGroup = {
      id: "0" as FilterGroup["id"],
      type: "FilterGroup",
      op: "and",
      conditions: [
        {
          id: "1" as FilterGroup["id"],
          type: "Filter",
          path: ["title"],
          name: "isEmpty",
          args: [],
        },
      ],
    };

    expect(filterRuleToQueryString(filter)).toBe("(title IS EMPTY)");
  });

  it("should return empty string for empty filter", () => {
    const filter: FilterGroup = {
      id: "0" as FilterGroup["id"],
      type: "FilterGroup",
      op: "and",
      conditions: [
        {
          id: "1" as FilterGroup["id"],
          type: "Filter",
          path: ["title"],
          name: "equals",
          args: [],
        },
      ],
    };

    expect(filterRuleToQueryString(filter)).toBe("");
  });

  it("should return empty string for empty filter group", () => {
    const filter: FilterGroup = {
      id: "0" as FilterGroup["id"],
      type: "FilterGroup",
      op: "and",
      conditions: [],
    };
    expect(filterRuleToQueryString(filter)).toBe("");
  });
});

describe("queryStringToFilterRule", () => {
  it("should parse URL query filters back into a FilterGroup", () => {
    const filter = queryStringToFilterRule(
      '(type = "reply" AND userid = "RRbLdfa")'
    );

    expect(filter).not.toBeNull();
    expect(filter?.op).toBe("and");
    expect(filter?.conditions).toHaveLength(2);
    expect((filter?.conditions[0] as any).name).toBe("postTypeEquals");
    expect(filterRuleToQueryString(filter!)).toBe(
      '(type = "reply" AND userid = "RRbLdfa")'
    );
  });

  it("should parse numeric and date filters", () => {
    const filter = queryStringToFilterRule(
      "(id = 123 AND now < sec(2024-1-1))"
    );

    expect(filter).not.toBeNull();
    expect(filterRuleToQueryString(filter!)).toBe(
      "(id = 123 AND now < sec(2024-1-1))"
    );
  });

  it("should reject mixed operators at the same group level", () => {
    expect(
      queryStringToFilterRule('(type = "reply" AND userid = "x" OR id = 1)')
    ).toBeNull();
  });

  it("should reject fields that are not exposed in the builder", () => {
    expect(queryStringToFilterRule('(_id = "abc")')).toBeNull();
  });

  it("should reject forum ids that are not available in the builder", () => {
    expect(queryStringToFilterRule("(fid = 999999)")).toBeNull();
  });

  it("should reject non-equals filters for post type", () => {
    expect(queryStringToFilterRule('(type CONTAINS "reply")')).toBeNull();
  });

  it("should only parse empty state filters for file extension", () => {
    const emptyFilter = queryStringToFilterRule("(ext IS EMPTY)");
    const notEmptyFilter = queryStringToFilterRule("(ext IS NOT EMPTY)");

    expect((emptyFilter?.conditions[0] as any).name).toBe(
      "fileExtensionIsEmpty"
    );
    expect((notEmptyFilter?.conditions[0] as any).name).toBe(
      "fileExtensionIsNotEmpty"
    );
    expect(filterRuleToQueryString(emptyFilter!)).toBe("(ext IS EMPTY)");
    expect(filterRuleToQueryString(notEmptyFilter!)).toBe(
      "(ext IS NOT EMPTY)"
    );
    expect(queryStringToFilterRule('(ext = ".jpg")')).toBeNull();
  });
});

describe("FilterGroup Serialization", () => {
  it("should serialize and deserialize a basic FilterGroup", () => {
    const filter: FilterGroup = {
      id: "0" as FilterGroup["id"],
      type: "FilterGroup",
      op: "and",
      conditions: [
        {
          id: "1" as FilterGroup["id"],
          type: "Filter",
          path: ["title"],
          name: "equals",
          args: ["test"],
        },
      ],
    };

    const serialized = serializeFilterGroup(filter);
    const deserialized = deserializeFilterGroup(serialized);
    expect(deserialized).toEqual(filter);
  });

  it("should handle Date objects in args correctly", () => {
    const date = new Date("2024-03-15T12:00:00Z");
    const filter: FilterGroup = {
      id: "0" as FilterGroup["id"],
      type: "FilterGroup",
      op: "and",
      conditions: [
        {
          id: "1" as FilterGroup["id"],
          type: "Filter",
          path: ["createdAt"],
          name: "equals",
          args: [date],
        },
      ],
    };

    const serialized = serializeFilterGroup(filter);
    const deserialized = deserializeFilterGroup(serialized);
    console.log(serialized, deserialized)
    expect((deserialized.conditions[0] as any).args[0]).toBeInstanceOf(Date);
    expect((deserialized.conditions[0] as any).args[0].toISOString()).toBe(
      date.toISOString()
    );
  });
});
