"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const http_1 = require("http");
const path_1 = __importDefault(require("path"));
const routes_1 = __importDefault(require("./routes"));
const app = (0, express_1.default)();
const server = (0, http_1.createServer)(app);
// Middleware
app.use(express_1.default.json());
app.use(express_1.default.static(path_1.default.join(process.cwd())));
// API routes
app.use(routes_1.default);
// Serve HTML files
app.get('/', (req, res) => {
    res.sendFile(path_1.default.join(process.cwd(), 'index.html'));
});
const PORT = process.env.PORT || 3000;
server.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`🌱 EcoMiles server running on http://0.0.0.0:${PORT}`);
    console.log(`📱 Access the app at: http://localhost:${PORT}`);
});
exports.default = app;
//# sourceMappingURL=index.js.map