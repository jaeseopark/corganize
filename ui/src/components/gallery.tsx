import { Center, VStack } from "@chakra-ui/react";
import { useEffect, useState } from "preact/hooks";
import { useDoubleTap } from "use-double-tap";

type Image = {
  filename: string;
  isActive: boolean;
};

const Gallery = ({ fileFetchUrl }: { fileFetchUrl: string }) => {
  const [images, setImages] = useState<Image[]>([]);

  useEffect(() => {
    setTimeout(() => {
      // one-time data load
      fetch(fileFetchUrl)
        .then((r) => r.json())
        .then(({ filenames }: { filenames: string[] }) => {
          setImages(filenames.map((filename) => ({ filename, isActive: true })));
        });
    }, 100);
  }, [fileFetchUrl]);

  const doubleTapBind = useDoubleTap(({ target: { id } }) => {
    const img = images.filter(({ filename }) => filename === id)[0];
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
        filenames: [id],
      }),
    })
      .then((r) => r.json())
      .then(() => {
        setImages((prevImages) => {
          const img = prevImages.filter(({ filename }) => filename === id)[0];
          img.isActive = false;
          return [...prevImages];
        });
      });
  });

  return (
    <>
      <Center>
        <VStack>
          {images.map((image) => {
            return (
              <img
                id={image.filename}
                key={image.filename}
                src={image.filename}
                style={{ opacity: image.isActive ? 1 : 0.1 }}
                {...doubleTapBind}
              />
            );
          })}
        </VStack>
      </Center>
    </>
  );
}

export default Gallery;
