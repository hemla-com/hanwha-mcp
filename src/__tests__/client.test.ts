import { describe, it, expect } from "vitest";
import { SunapiClient } from "../sunapi/client.js";

describe("SunapiClient.parseKeyValue", () => {
  it("parses basic key=value pairs", () => {
    const text = "Model=XNV-6120R\nSerial=ABC123\nFirmware=2.21";
    const result = SunapiClient.parseKeyValue(text);
    expect(result).toEqual({
      Model: "XNV-6120R",
      Serial: "ABC123",
      Firmware: "2.21",
    });
  });

  it("ignores empty lines and comments", () => {
    const text = "Key1=val1\n\n# this is a comment\nKey2=val2\n   \n";
    const result = SunapiClient.parseKeyValue(text);
    expect(result).toEqual({ Key1: "val1", Key2: "val2" });
  });

  it("skips lines without =", () => {
    const text = "Good=value\nBadLineNoEquals\nAlsoGood=yes";
    const result = SunapiClient.parseKeyValue(text);
    expect(result).toEqual({ Good: "value", AlsoGood: "yes" });
  });

  it("handles values containing =", () => {
    const text = "Equation=a=b=c\nNormal=123";
    const result = SunapiClient.parseKeyValue(text);
    expect(result).toEqual({ Equation: "a=b=c", Normal: "123" });
  });

  it("returns empty object for blank input", () => {
    expect(SunapiClient.parseKeyValue("")).toEqual({});
    expect(SunapiClient.parseKeyValue("   \n  \n")).toEqual({});
  });
});
