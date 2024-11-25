import Admin from "@/components/admin";
import PresetManagement from "@/components/config/preset/mgmt";
import Gallery from "@/components/gallery";
import { JSX } from "preact";

export const AUTHENTICATED_ROUTES: { [key: string]: () => JSX.Element } = {
  "/gallery": () => <Gallery fileFetchUrl="/api/images/shuffled" />,
  "/gallery/recent": () => <Gallery fileFetchUrl="/api/images/recent" />,
  "/admin/config/presets": () => <PresetManagement />,
  "/admin/misc": () => <Admin />,
};
