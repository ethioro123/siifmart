import { suppliersService } from './services/supabase.service';

async function check() {
    try {
        console.log("Fetching suppliers...");
        const result = await suppliersService.getAll(5, 0);
        console.log("Result:", JSON.stringify(result, null, 2));
    } catch (e) {
        console.error("Error:", e);
    }
}
check();
