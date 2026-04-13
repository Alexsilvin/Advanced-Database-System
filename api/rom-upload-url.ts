import handler from "../netlify/functions/rom-upload-url.mts";
import { createVercelHandler } from "./_shared/invoke-netlify";

export default createVercelHandler(handler);
