import { describe, expect, it } from "vitest";
import { z } from "zod";
import { MESSAGE_TREE, findMatchedNode, resolvePayloadNode } from "./messages.js";

const responseSchema = z.object({
  matched: z.boolean(),
  text: z.string().max(2000).optional(),
  quickReplies: z
    .array(
      z.object({
        title: z.string().max(20),
        payload: z.string().max(100),
      }),
    )
    .max(13)
    .optional(),
});

describe("orders-service message logic", () => {
  it("resolves a payload to the correct node", () => {
    expect(resolvePayloadNode("ORD_DELIVERY")?.key).toBe("delivery");
  });

  it("matches a keyword-based text request", () => {
    expect(findMatchedNode("Where is my shipment?")?.key).toBe("track");
  });

  it("returns undefined when there is no match", () => {
    expect(findMatchedNode("Tell me a joke")).toBeUndefined();
  });

  it("response schema is valid for a normal reply", () => {
    const node = MESSAGE_TREE.track;
    const output = {
      matched: true,
      text: node.text,
      quickReplies: node.options?.map((option) => ({
        title: option.title,
        payload: option.payload,
      })),
    };

    expect(responseSchema.safeParse(output).success).toBe(true);
  });

  it("message tree links each option to a real node and includes main menu", () => {
    for (const node of Object.values(MESSAGE_TREE)) {
      for (const option of node.options ?? []) {
        expect(MESSAGE_TREE[option.nextKey]).toBeDefined();
      }
      expect(node.options?.some((option) => option.payload === "MAIN_MENU")).toBe(true);
    }
  });
});
