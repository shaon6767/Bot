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

describe("info-service message logic", () => {
  it("resolves payment payloads", () => {
    expect(resolvePayloadNode("INFO_PAYMENT")?.key).toBe("payment");
  });

  it("matches a keyword-based information request", () => {
    expect(findMatchedNode("What are your working hours?")?.key).toBe("hours");
  });

  it("returns undefined when there is no match", () => {
    expect(findMatchedNode("Tell me a joke")).toBeUndefined();
  });

  it("matches a long keyword with one typo", () => {
    expect(findMatchedNode("paymnt options")?.key).toBe("payment");
  });

  it("does not fuzzy-match short keywords", () => {
    expect(findMatchedNode("tim")).toBeUndefined();
  });

  it("does not match an unrelated word", () => {
    expect(findMatchedNode("volcano")).toBeUndefined();
  });

  it("validates a sample response", () => {
    const output = {
      matched: true,
      text: MESSAGE_TREE.payment.text,
      quickReplies: MESSAGE_TREE.payment.options?.map((option) => ({
        title: option.title,
        payload: option.payload,
      })),
    };

    expect(responseSchema.safeParse(output).success).toBe(true);
  });

  it("message tree includes main menu return path", () => {
    for (const node of Object.values(MESSAGE_TREE)) {
      for (const option of node.options ?? []) {
        expect(MESSAGE_TREE[option.nextKey]).toBeDefined();
        expect(resolvePayloadNode(option.payload)?.key).toBe(option.nextKey);
      }
      expect(node.options?.some((option) => option.payload === "MAIN_MENU")).toBe(true);
    }
  });
});
