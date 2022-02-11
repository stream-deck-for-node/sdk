import { readFile } from "fs/promises";
import axios from "axios";
import mime from "mime-types";

const base64Image = async (file: string) => {
    // read binary data
    const bitmap = await readFile(file);
    // convert binary data to base64 encoded string
    return Buffer.from(bitmap).toString("base64");
};

const downloadBase64Image = async (url: string) => {
    // download image from the url
    const res = await axios.get(url, { responseType: "arraybuffer" });
    // converto to base64 encoded string
    return Buffer.from(res.data).toString("base64");
};

// Convert url or file image to Base64 String
export const imageToBase64 = async (image: string) => {
    const [, type] = (mime.lookup(image.replace(/\?.+$/, "")) || "").split("/");
    if (image.startsWith("http")) {
        image = await downloadBase64Image(image);
    } else {
        image = await base64Image(image);
    }
    return `data:image/${type};base64, ${image}`;
};

