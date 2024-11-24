import ReconnectingWebSocket from "reconnecting-websocket";

export type WebsocketMessage = {
  topic: string;
  payload: object;
};

export type WebsocketListener = (message: WebsocketMessage) => void;

const WEBSOCKET_LISTENERS: WebsocketListener[] = [];

const WEBSOCKET_URL = (() => {
  const { protocol, hostname, port } = window.location;
  let wsProtocol = protocol === "https" ? "wss" : "ws";
  return `${wsProtocol}://${hostname}:${port}/api/ws`;
})();

new ReconnectingWebSocket(WEBSOCKET_URL).onmessage = ({ data }) => {
  const message = JSON.parse(data);
  WEBSOCKET_LISTENERS.forEach((listener) => listener(message));
};

export const subscribe = (listener: WebsocketListener) => {
  WEBSOCKET_LISTENERS.push(listener);
};

export const unsubscribe = (listener: WebsocketListener) => {
  const i = WEBSOCKET_LISTENERS.indexOf(listener);
  WEBSOCKET_LISTENERS.splice(i, 1);
};
