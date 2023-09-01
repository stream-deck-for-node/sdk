import { readFile } from 'fs/promises';
import axios from 'axios';
import mime from 'mime-types';

const cache = {};

const base64Image = async (file: string) => {
  // read binary data
  const bitmap = await readFile(file);
  // convert binary data to base64 encoded string
  return Buffer.from(bitmap).toString('base64');
};

const downloadBase64Image = async (url: string) => {
  // convert to base64 encoded string
  const res = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(res.data).toString('base64');
};

// Convert url or file image to Base64 String
export const imageToBase64 = async (image: string, useCache = false) => {
  if (useCache && cache[image]) {
    return cache[image];
  }

  let imageBase64: string;
  const [, type] = (mime.lookup(image.replace(/\?.+$/, '')) || '').split('/');
  if (image.startsWith('http')) {
    imageBase64 = await downloadBase64Image(image);
  } else {
    imageBase64 = await base64Image(image);
  }

  cache[image] = `data:image/${type};base64, ${imageBase64}`;
  return cache[image];
};
