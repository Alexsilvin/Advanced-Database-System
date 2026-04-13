import handler from "../netlify/functions/enrich-posters.mts";
import { createVercelHandler } from "./_shared/invoke-netlify";

export default createVercelHandler(handler);
