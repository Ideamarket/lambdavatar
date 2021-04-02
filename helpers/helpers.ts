import * as sharp from 'sharp';

export const smallerImage = async (imageData: Buffer): Promise<string> => {
  let smallImage = await sharp(imageData).resize({width: parseInt(process.env.imageWidth)}).png().toBuffer();
  let dataUrl = `data:image/png;base64,${smallImage.toString('base64')}`;
  return dataUrl;
}