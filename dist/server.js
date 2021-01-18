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
    /*** WEB PAGE CONTENT ***/
    server.get('/static/*', (req, res) => __awaiter(void 0, void 0, void 0, function* () { return handle(req, res); }));
    server.get('/_next/*', (req, res) => __awaiter(void 0, void 0, void 0, function* () { return handle(req, res); }));
    /*** WEB PAGES ***/
    server.get('/', (req, res) => __awaiter(void 0, void 0, void 0, function* () { return res.send(yield app.renderToHTML(req, res, '/landing', req.query)); }));
    server.get('/editor', (req, res) => __awaiter(void 0, void 0, void 0, function* () { return res.send(yield app.renderToHTML(req, res, '/editor', req.query)); }));
    server.get('/pdfjs/:type', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        try {
            if (req.params.type == 'lib') {
                const file = fs_1.default.readFileSync('./node_modules/pdfjs-dist/build/pdf.js');
                res.type('.js');
                return res.send(file);
            }
            else if (req.params.type == 'viewer') {
                const file = fs_1.default.readFileSync('./node_modules/pdfjs-dist/web/pdf_viewer.js');
                res.type('.js');
                return res.send(file);
            }
            else if (req.params.type == 'view-css') {
                const file = fs_1.default.readFileSync('./node_modules/pdfjs-dist/web/pdf_viewer.css');
                res.type('.css');
                return res.send(file);
            }
            else if (req.params.type == 'worker') {
                const file = fs_1.default.readFileSync('./node_modules/pdfjs-dist/build/pdf.worker.js');
                res.type('.js');
                return res.send(file);
            }
            res.sendStatus(404);
        }
        catch (e) {
            console.error(e);
            res.status(500).send(e.toString());
        }
    }));
    /*** WEB CONTENT ***/
    server.get('/api/getNotes', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
        res.send({
            document: 'http://localhost/static/text2.pdf',
            currentPage: 1,
            projectName: 'Operating Systems',
            categories: [],
            links: {},
            pages: {}
        });
    }));
    server.post('/editor/saveNotes', (req, res) => __awaiter(void 0, void 0, void 0, function* () { }));
    /*** 404 PAGE ***/
    server.get('*', (req, res) => __awaiter(void 0, void 0, void 0, function* () { return res.send(yield app.renderToHTML(req, res, '/404', req.query)); }));
    /*** LISTEN ***/
    server.listen(config.port, () => {
        console.info(`Texbook frontend is listening on ${config.port}`);
    });
});
//# sourceMappingURL=server.js.map