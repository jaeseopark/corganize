import Admin from "@/components/admin";
import ConfigManagement from "@/components/config/mgmt";
import Gallery from "@/components/gallery";
import { JSX } from "preact";

export const AUTHENTICATED_ROUTES: { [key: string]: () => JSX.Element } = {
  "/gallery": () => <Gallery fileFetchUrl="/api/images/shuffled" />,
  "/gallery/recent": () => <Gallery fileFetchUrl="/api/images/recent" />,
  "/admin/config": () => <ConfigManagement />,
  "/admin/misc": () => <Admin />,
};
