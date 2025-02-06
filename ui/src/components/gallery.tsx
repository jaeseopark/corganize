import { axios, subscribe, unsubscribe } from "@/api";
import {
  DrawerBackdrop,
  DrawerBody,
  DrawerCloseTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerRoot,
  DrawerTitle,
} from "@/components/ui/drawer";
import { Center, VStack } from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import Linkify from "react-linkify";
import { useDoubleTap } from "use-double-tap";

import "@/components/gallery.scss";

type Image = {
  filename: string;
  isActive: boolean;
};

type ImageMetadata = {
  loras: {
    alias: string;
    weight: number[] | number;
    url: string;
    notes: string;
  }[];
  model: string;
};

type WebSocketPayload = {
  message: string;
  metadata: object;
};

const newTabDecorator = (decoratedHref, decoratedText, key) => (
  <a href={decoratedHref} key={key} target="_blank" rel="noopener noreferrer" className="metadata-link">
    {decoratedText}
  </a>
);

const Gallery = ({ fileFetchUrl }: { fileFetchUrl: string }) => {
  const [images, setImages] = useState<Image[]>([]);
  const [mode, setMode] = useState<"lightbox" | "scroll">("scroll");
  const [newImagesExist, setNewImagesExist] = useState(false);
  const [index, setIndex] = useState(0);
  const visibleImageRef = useRef(null);
  const containerRef = useRef(null);
  const [imageMetadata, setImageMetadata] = useState<ImageMetadata | null>(null);

  const goToPrevIndex = useCallback(() => {
    setImageMetadata(null);
    setIndex((currIndex) => Math.max(currIndex - 1, 0));
  }, [images]);

  const goToNextIndex = useCallback(() => {
    setImageMetadata(null);
    setIndex((currIndex) => Math.min(currIndex + 1, images.length - 1));
  }, [images]);

  useEffect(() => {
    const listener = (message) => {
      if (message.topic === "diffusion") {
        const innerMessage = (message.payload as WebSocketPayload).message;
        console.log({ innerMessage });
        if (innerMessage === "partially-done" || innerMessage === "done") {
          setNewImagesExist(true);
        }
      }
    };
    subscribe(listener);
    return () => {
      unsubscribe(listener);
    };
  }, []);

  useEffect(() => {
    if (newImagesExist) {
      console.log("creating toaster for new images...");
      // TODO add a toaster
    }
  }, [newImagesExist]);

  useEffect(() => {
    containerRef?.current?.focus();
    setTimeout(() => {
      // one-time data load
      axios
        .get(fileFetchUrl)
        .then((r) => r.data)
        .then(({ filenames }: { filenames: string[] }) => {
          setImages(filenames.map((filename) => ({ filename, isActive: true })));
        });
    }, 100);
  }, [fileFetchUrl]);

  useEffect(() => {
    if (mode === "scroll") {
      visibleImageRef?.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [mode, index]);

  const deleteImage = useCallback((img: Image) => {
    if (!img.isActive) {
      return;
    }
    axios
      .delete("/api/images", {
        data: {
          filenames: [img.filename],
        },
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      })
      .then(() => {
        img.isActive = false;
        setImages((prevImages) => [...prevImages]);
      });
  }, []);

  const deleteCurrentImage = useCallback(() => deleteImage(images[index]), [images, index, deleteImage]);

  const handleKeyDown = useCallback(
    (event) => {
      const { key, metaKey, shiftKey, altKey, ctrlKey } = event;

      if (metaKey || shiftKey || altKey || ctrlKey) {
        event.stopPropagation();
        return;
      }

      const switchModes = () => setMode((prevMode) => (prevMode === "scroll" ? "lightbox" : "scroll"));

      const showMetadata = () => {
        axios
          .get(`/api/images/${images[index].filename}/metadata`)
          .then((r: any) => {
            if (r.status_code >= 400) {
              return {};
            }
            return {
              model: r.data.model,
              loras: r.data.loras,
            };
          })
          .then(setImageMetadata);
      };

      (
        ({
          enter: switchModes,
          g: switchModes,
          w: deleteCurrentImage,
          c: showMetadata,
          q: goToPrevIndex,
          arrowleft: goToPrevIndex,
          arrowup: goToPrevIndex,
          arrowdown: goToNextIndex,
          arrowright: goToNextIndex,
          e: goToNextIndex,
          " ": goToNextIndex,
        })[key.toLowerCase()] ||
        (() => {
          console.log(`key='${key}' not supported.`);
        })
      )();

      // prevent things like unwanted scrolling
      event.stopPropagation();
    },
    [deleteCurrentImage, goToPrevIndex, goToNextIndex],
  );

  const doubleTapBind = useDoubleTap(({ target: { id } }) => {
    deleteImage(images.filter(({ filename }) => filename === id)[0]);
  });

  return (
    <>
      <Center>
        <VStack tabIndex={1} ref={containerRef} onKeyDown={handleKeyDown}>
          {mode === "scroll" ? (
            images.map((image, i) => {
              return (
                <img
                  {...doubleTapBind}
                  title={image.filename}
                  ref={index === i && visibleImageRef}
                  id={image.filename}
                  key={image.filename}
                  src={`/${image.filename}`}
                  style={{ opacity: image.isActive ? 1 : 0.1 }}
                />
              );
            })
          ) : (
            <>
              <img
                title={`${images[index].filename}`}
                ref={visibleImageRef}
                src={`/${images[index].filename}`}
                style={{ opacity: images[index].isActive ? 1 : 0.1, height: "100vh" }}
              />
              <DrawerRoot
                open={!!imageMetadata}
                size="lg"
                onOpenChange={({ open }: any) => {
                  if (!open) {
                    setImageMetadata(null);
                  }
                }}
              >
                <DrawerBackdrop />
                <DrawerContent>
                  <DrawerHeader>
                    <DrawerTitle>{images[index].filename}</DrawerTitle>
                  </DrawerHeader>
                  <DrawerBody>
                    <div onKeyDown={handleKeyDown}>
                      <Linkify componentDecorator={newTabDecorator}>
                        <pre>{JSON.stringify(imageMetadata, null, 2)}</pre>
                      </Linkify>
                    </div>
                  </DrawerBody>
                  <DrawerCloseTrigger />
                </DrawerContent>
              </DrawerRoot>
            </>
          )}
        </VStack>
      </Center>
    </>
  );
};

export default Gallery;
