import dotenv from "dotenv";

// Read the .env file
dotenv.config();

// Expected structure of the read .env file
interface EnvData {
    PORT: number;
    OPENROUTER_KEY: string;
}

// Output
const envData: EnvData = {
    PORT: parseInt(process.env.PORT!),
    OPENROUTER_KEY: process.env.OPENROUTER_KEY!,
}

export default envData