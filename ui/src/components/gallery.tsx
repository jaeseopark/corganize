import { Center, VStack } from "@chakra-ui/react";
import { useCallback, useEffect, useRef, useState } from "preact/hooks";
import { useDoubleTap } from "use-double-tap";

type Image = {
  filename: string;
  isActive: boolean;
};

const Gallery = ({ fileFetchUrl }: { fileFetchUrl: string }) => {
  const [images, setImages] = useState<Image[]>([]);
  const [mode, setMode] = useState<"lightbox" | "scroll">("scroll");
  const [index, setIndex] = useState(0);
  const visibleImageRef = useRef(null);
  const containerRef = useRef(null);

  const goToNextIndex = useCallback(
    () => setIndex((prevIndex) => Math.min(prevIndex + 1, images.length - 1)),
    [images],
  );

  useEffect(() => {
    containerRef?.current?.focus();
    setTimeout(() => {
      // one-time data load
      fetch(fileFetchUrl)
        .then((r) => r.json())
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
    fetch("/api/images", {
      method: "delete",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        filenames: [img.filename],
      }),
    }).then(() => {
      img.isActive = false;
      setImages((prevImages) => [...prevImages]);
    });
  }, []);

  const doubleTapBind = useDoubleTap(({ target: { id } }) => {
    deleteImage(images.filter(({ filename }) => filename === id)[0]);
  });

  return (
    <>
      <Center>
        <VStack
          tabIndex={1}
          ref={containerRef}
          onKeyDown={(event) => {
            const { key } = event;
            ({
              g: () => {
                setMode((prevMode) => (prevMode === "scroll" ? "lightbox" : "scroll"));
                event.stopPropagation();
              },
              w: () => deleteImage(images[index]),
              e: goToNextIndex,
              " ": goToNextIndex,
            })[key.toLowerCase()]();
          }}
        >
          {mode === "scroll" ? (
            images.map((image, i) => {
              return (
                <img
                  {...doubleTapBind}
                  ref={index === i && visibleImageRef}
                  id={image.filename}
                  key={image.filename}
                  src={`/${image.filename}`}
                  style={{ opacity: image.isActive ? 1 : 0.1 }}
                />
              );
            })
          ) : (
            <img
              ref={visibleImageRef}
              src={`/${images[index].filename}`}
              style={{ opacity: images[index].isActive ? 1 : 0.1, height: "100vh" }}
            />
          )}
        </VStack>
      </Center>
    </>
  );
};

export default Gallery;
