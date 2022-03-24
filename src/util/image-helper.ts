import { readFile } from "fs/promises";
import axios from "axios";
import mime from "mime-types";

const cache = {};

const base64Image = async (file: string) => {
  // read binary data
  const bitmap = await readFile(file);
  // convert binary data to base64 encoded string
  cache[file] = Buffer.from(bitmap).toString("base64");
  return cache[file];
};

const downloadBase64Image = async (url: string) => {
  // convert to base64 encoded string
  const res = await axios.get(url, { responseType: "arraybuffer" });
  // cache the result
  cache[url] = Buffer.from(res.data).toString("base64");
  return cache[url];
};

// Convert url or file image to Base64 String
export const imageToBase64 = async (image: string, useCache = false) => {
  if (useCache && cache[image]) {
    return cache[image];
  }
  const [, type] = (mime.lookup(image.replace(/\?.+$/, "")) || "").split("/");
  if (image.startsWith("http")) {
    image = await downloadBase64Image(image);
  } else {
    image = await base64Image(image);
  }
  return `data:image/${type};base64, ${image}`;
};







