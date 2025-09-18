// Force memory initialization on server start
import * as memory from "./memory";

console.log("🚀 Initializing memory system on server start");
console.log("Memory status:", memory.getMemoryStatus());

export default memory;
