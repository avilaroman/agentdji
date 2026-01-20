/**
 * Tool definitions for the AI chat agent
 * Tools can either require human confirmation or execute automatically
 */
import { tool } from "ai";
import { z } from "zod";

import type { Chat } from "./server";
import { getCurrentAgent } from "agents";
import { unstable_scheduleSchema } from "agents/schedule";
import { env } from "cloudflare:workers";
import { generateText } from "ai";
import { createWorkersAI } from "workers-ai-provider";
import { openai } from "@ai-sdk/openai";
import { PROMPT, TELLO_COMMANDS_STRING } from "./telloCommands";

// TODO:
// [] Update to gpt5 and new agnets and ai sdks
// [] Feed compass data to model
// [] Add model response to moves
// [] Only request new detection after inference

const model = openai("gpt-4o-2024-11-20");
const moveDroneToTarget = tool({
  description: "Get the drone to fly towards a target and land",
  parameters: z.object({
    target: z.string().describe("The target to fly to")
  }),
  execute: async ({ target }) => {
    try {
      let { webSocket: droneWs } = await fetch("http://localhost:8788/ws", {
        headers: { Upgrade: "websocket" }
      });
      if (!droneWs) throw new Error("server didn't accept WebSocket");

      droneWs.accept();
      function droneSend(payload: object) {
        droneWs?.send(JSON.stringify(payload));
      }
      droneSend({ type: "target:start", payload: target });

      const moves: any[] = [];

      return await new Promise((resolve, reject) => {
        droneWs.addEventListener("message", async (event: any) => {
          try {
            const msg = JSON.parse(event.data);

            if (msg.type === "info") {
              console.log(msg);
            } else if (msg.type === "target") {
              const detection = msg.payload;

              const prompt = `
            ${PROMPT}
            TELLO DRONE COMMANDS:
            ${TELLO_COMMANDS_STRING}
            PREVIOUS DRONE DETECTIONS AND MOVES MADE BY YOU:
            ${JSON.stringify(moves)}
            NEW FRAME INFO AND DETECTED OBJECT:
            ${JSON.stringify(detection)}
            `;

              const { text } = await generateText({ model, prompt });
              const llm_command = text.replaceAll('"', "");
              const move = {
                move_number: moves.length + 1,
                llm_generated_command: llm_command,
                ...detection
              };

              console.log(move);
              moves.push(move);

              droneSend({ type: "command", payload: llm_command });

              if (llm_command === "land") {
                droneWs.close();
                resolve(
                  `landed drone at ${target} after ${moves.length} moves`
                );
              }
            }
          } catch (err) {
            reject(err);
          }
        });

        droneWs.addEventListener("close", () => {
          resolve("connection closed");
        });

        droneWs.addEventListener("error", (err: any) => {
          reject(err);
        });
      });
    } catch (error: any) {
      console.error(error);
      throw new Error(error.message);
    }
  }
});

/**
 * Export all available tools
 * These will be provided to the AI model to describe available capabilities
 */
export const tools = {
  moveDroneToTarget
};

/**
 * Implementation of confirmation-required tools
 * This object contains the actual logic for tools that need human approval
 * Each function here corresponds to a tool above that doesn't have an execute function
 * NOTE: keys below should match toolsRequiringConfirmation in app.tsx
 */
export const executions = {};
