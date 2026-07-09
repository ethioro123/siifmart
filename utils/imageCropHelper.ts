/**
 * Helper utility to crop and apply adjustments (rotation, brightness, contrast) to an image using HTML5 Canvas.
 */

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous'); // Avoid canvas taint
    image.src = url;
  });
}

function rotateSize(width: number, height: number, rotation: number) {
  const rotRad = (rotation * Math.PI) / 180;
  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

export async function getCroppedImg(
  imageSrc: string,
  pixelCrop: { x: number; y: number; width: number; height: number },
  rotation = 0,
  brightness = 100,
  contrast = 100
): Promise<string> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return '';
  }

  const rotRad = (rotation * Math.PI) / 180;

  // Calculate bounding box of the rotated image
  const { width: bWidth, height: bHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // Set canvas size to match the bounding box
  canvas.width = bWidth;
  canvas.height = bHeight;

  // Translate canvas context to draw image rotated around its center
  ctx.translate(bWidth / 2, bHeight / 2);
  ctx.rotate(rotRad);
  ctx.translate(-image.width / 2, -image.height / 2);

  // Draw rotated image
  ctx.drawImage(image, 0, 0);

  // Create final canvas to crop the rotated image
  const croppedCanvas = document.createElement('canvas');
  const croppedCtx = croppedCanvas.getContext('2d');

  if (!croppedCtx) {
    return '';
  }

  // Set cropped canvas size
  croppedCanvas.width = pixelCrop.width;
  croppedCanvas.height = pixelCrop.height;

  // Apply visual adjustments (brightness and contrast)
  croppedCtx.filter = `brightness(${brightness}%) contrast(${contrast}%)`;

  // Draw the cropped section from the first canvas onto final canvas
  croppedCtx.drawImage(
    canvas,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );

  return croppedCanvas.toDataURL('image/jpeg', 0.9);
}
