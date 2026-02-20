import "dotenv/config";
import { config } from "dotenv";
config({ path: ".env.local" });

async function listModels() {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
        const data = await response.json();
        if (data.models) {
            const flashModels = data.models.filter(m => m.name.includes('flash')).map(m => m.name);
            console.log("Flash Models:", flashModels);
            const proModels = data.models.filter(m => m.name.includes('pro')).map(m => m.name);
            console.log("Pro Models:", proModels);
        } else {
            console.log("No models found or error:", data);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
