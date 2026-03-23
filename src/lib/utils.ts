
/**
 * @param url 
 */
export const validateUrl = (url: string): boolean => {
    try {
        const parsed = new URL(url);
        return parsed.protocol === "http:" || parsed.protocol === "https:";
    } catch {
        return false;
    }
};

/**

 * @param data 
 * @returns 
 */
export const truncateData = (data: any): string => {
    const LIMIT = 8000
    // If it's already a string (like HTML), just slice it
    if (typeof data === 'string') {
        return data.length > LIMIT 
            ? data.slice(0, LIMIT) + "\n[NOTICE: HTML truncated for analysis]" 
            : data;
    }

    // If it's an object/array, stringify it
    const stringified = JSON.stringify(data);

    if (stringified.length > LIMIT) {
        return stringified.slice(0, LIMIT) + 
            `\n\n[WARNING: JSON body truncated. Only the first ${LIMIT} characters were sent for analysis.]`;
    }

    return stringified;
}