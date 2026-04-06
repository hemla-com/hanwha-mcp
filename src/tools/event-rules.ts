import { z } from "zod";
import { getActiveClient } from "./connect.js";

export const getEventRulesSchema = z.object({});

export async function getEventRules(): Promise<string> {
  const client = getActiveClient();
  const data = await client.request("eventrules.cgi", "rules", "view");

  const rules: Record<string, Record<string, string>> = {};

  for (const [key, value] of Object.entries(data)) {
    const match = key.match(/^Rule\.(\d+)\.(.+)$/);
    if (!match) continue;
    const [, idx, field] = match;
    rules[idx] ??= {};
    rules[idx][field] = value;
  }

  if (Object.keys(rules).length === 0) {
    return "No event rules configured.";
  }

  const lines: string[] = ["## Event Rules", ""];

  for (const [idx, fields] of Object.entries(rules).sort(([a], [b]) => Number(a) - Number(b))) {
    const name = fields["RuleName"] ?? "unnamed";
    const source = fields["EventSource"] ?? "N/A";
    const enabled = fields["Enable"] ?? "N/A";
    const schedule = fields["ScheduleType"] ?? "N/A";

    lines.push(`### Rule ${idx}: ${name}`);
    lines.push(`- Event Source: ${source}`);
    lines.push(`- Enabled: ${enabled}`);
    lines.push(`- Schedule: ${schedule}`);
    lines.push("");
  }

  return lines.join("\n");
}

export const setEventRuleSchema = z.object({
  ruleIndex: z.number().describe("Rule index number"),
  enable: z.boolean().optional().describe("Enable/disable the rule"),
});

export async function setEventRule(input: z.infer<typeof setEventRuleSchema>): Promise<string> {
  const client = getActiveClient();
  const prefix = `Rule.${input.ruleIndex}`;

  const params: Record<string, string> = {};

  if (input.enable !== undefined) params[`${prefix}.Enable`] = input.enable ? "True" : "False";

  await client.request("eventrules.cgi", "rules", "update", params);

  return `Event rule ${input.ruleIndex} ${input.enable ? "enabled" : "disabled"}.`;
}
