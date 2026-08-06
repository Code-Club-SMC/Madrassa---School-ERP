import {
  buildParentUsernameBase,
  createUniqueParentLoginIdentity,
} from "@/lib/server/auth/parent-login";

const bunTestModule: string = "bun:test";
const { describe, expect, test } = await import(bunTestModule);

describe("parent login usernames", () => {
  test("builds readable usernames from common Urdu guardian names", () => {
    expect(buildParentUsernameBase("محمد یوسف")).toBe("muhammad.yousaf");
    expect(buildParentUsernameBase("عبدالرحمن خان")).toBe("abdurrahman.khan");
  });

  test("falls back to parent when the name cannot be romanized", () => {
    expect(buildParentUsernameBase("سرپرست")).toBe("parent");
  });

  test("adds random digits and retries when a username is taken", async () => {
    const digits = ["1234", "5678"];
    const identity = await createUniqueParentLoginIdentity("محمد یوسف", {
      randomDigits: () => digits.shift() ?? "9999",
      usernameExists: async (username) => username === "muhammad.yousaf1234",
    });

    expect(identity).toEqual({
      username: "muhammad.yousaf5678",
      email: "muhammad.yousaf5678@parents.msmis.invalid",
    });
  });
});
