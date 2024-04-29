import { decode as msgpackDecode, encode as msgpackEncode } from "@msgpack/msgpack";

type WsMessage = {
  type: "Sync",
  random: number
} | {
  type: "ApplyDelta",
  asd: number
};

export function decode(bytes: ArrayBuffer): WsMessage | null {
  const rawDecoded = msgpackDecode(bytes);
  if (!Array.isArray(rawDecoded)) return null;

  switch (rawDecoded[0]) {
    case "Sync":
      // "random"
      if (typeof rawDecoded[1] === "number") return { type: "Sync", random: rawDecoded[1] };
      break;
    case "ApplyDelta":
      // "asd"
      if (typeof rawDecoded[1] === "number") return { type: "ApplyDelta", asd: rawDecoded[1] };
      break;
  }

  return null;
}

export function encode(message: WsMessage): Uint8Array {
  let messageArray: unknown[] | null = null;
  switch (message.type) {
    case "Sync":
      messageArray = ["Sync", message.random];
      break;
    case "ApplyDelta":
      messageArray = ["ApplyDelta", message.asd];
      break;
  }
  return msgpackEncode(messageArray);
}