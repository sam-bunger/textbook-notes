"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const next_1 = __importDefault(require("next"));
const fs_1 = __importDefault(require("fs"));
const dev = process.env.NODE_ENV !== 'production';
const app = next_1.default({ dev });
const handle = app.getRequestHandler();
const config = dev
    ? {
        port: 80
    }
    : {
        port: 80
    };
app.prepare().then(() => {
    const server = express_1.default();
    server.use(express_1.default.json());
    server.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () { return res.send(yield app.renderToHTML(req, res, '/home', req.query)); }));
    server.get('/resume', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        res.setHeader('Content-type', 'application/pdf');
        res.send(yield fs_1.default.readFileSync('./static/resume.pdf'));
    }));
    server.get('/static/*', (req, res) => __awaiter(void 0, void 0, void 0, function* () { return handle(req, res); }));
    server.get('/_next/*', (req, res) => __awaiter(void 0, void 0, void 0, function* () { return handle(req, res); }));
    //server.get('*', async (req, res) => res.send(await app.renderToHTML(req, res, '/404', req.query)));
    server.listen(config.port, () => {
        console.info(`VXN Frontend is listening on port ${config.port}`);
    });
});
//# sourceMappingURL=server.js.map